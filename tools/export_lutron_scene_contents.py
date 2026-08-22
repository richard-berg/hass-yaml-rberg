#!/usr/bin/env python3
"""Infer Lutron bridge scene contents and write an AI-friendly Markdown report.

This is a black-box exporter: Home Assistant exposes Lutron bridge scenes as
opaque scene entities, so the script samples light states before and after
activating each scene from two different baselines.

Default execution environment is the Home Assistant add-on shell, where
SUPERVISOR_TOKEN can authenticate against http://supervisor/core/api.
Outside HAOS, set HASS_URL and HASS_TOKEN.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


LUTRON_PLATFORM = "lutron_caseta"
DEFAULT_OUTPUT = Path("docs/lutron-scene-contents.md")
DEFAULT_REGISTRY = Path(".storage/core.entity_registry")
UNKNOWN_STATES = {"missing", "unavailable", "unknown"}
NORMALIZED_LIGHT_ATTRIBUTES = (
    "brightness",
    "color_mode",
    "color_temp_kelvin",
    "color_temp",
    "hs_color",
    "rgb_color",
    "xy_color",
    "effect",
)


@dataclass(frozen=True)
class RegistryEntity:
    entity_id: str
    name: str


@dataclass(frozen=True)
class InferredEntity:
    entity_id: str
    name: str
    setting: dict[str, Any]
    confidence: str
    reason: str


@dataclass(frozen=True)
class SceneResult:
    scene: RegistryEntity
    controlled: list[InferredEntity]
    ambiguous: list[InferredEntity]
    not_controlled_count: int


class HomeAssistantClient:
    def __init__(self, base_url: str, token: str) -> None:
        self.base_url = base_url.rstrip("/")
        if self.base_url.endswith("/api"):
            self.base_url = self.base_url[:-4]
        self.token = token

    def get_json(self, path: str) -> Any:
        request = self._request("GET", path)
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))

    def post_json(self, path: str, payload: dict[str, Any]) -> Any:
        request = self._request("POST", path, payload)
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else None

    def call_service(self, domain: str, service: str, payload: dict[str, Any]) -> Any:
        return self.post_json(f"/api/services/{domain}/{service}", payload)

    def snapshot(self, entity_ids: list[str]) -> dict[str, dict[str, Any]]:
        wanted = set(entity_ids)
        records = self.get_json("/api/states")
        return {
            record["entity_id"]: normalize_light_state(record)
            for record in records
            if record.get("entity_id") in wanted
        }

    def raw_snapshot(self, entity_ids: list[str]) -> dict[str, dict[str, Any]]:
        wanted = set(entity_ids)
        records = self.get_json("/api/states")
        return {
            record["entity_id"]: record
            for record in records
            if record.get("entity_id") in wanted
        }

    def _request(
        self, method: str, path: str, payload: dict[str, Any] | None = None
    ) -> urllib.request.Request:
        url = f"{self.base_url}{path}"
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        return urllib.request.Request(
            url,
            data=data,
            method=method,
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
            },
        )


def parse_args() -> argparse.Namespace:
    default_url = os.environ.get("HASS_URL") or os.environ.get("HOME_ASSISTANT_URL")
    default_token = os.environ.get("HASS_TOKEN") or os.environ.get("HOME_ASSISTANT_TOKEN")
    supervisor_token = os.environ.get("SUPERVISOR_TOKEN")

    if default_url is None and supervisor_token:
        default_url = "http://supervisor/core"
    if default_token is None and supervisor_token:
        default_token = supervisor_token

    parser = argparse.ArgumentParser(
        description="Infer Lutron bridge scene contents and write Markdown."
    )
    parser.add_argument("--ha-url", default=default_url, help="Home Assistant base URL")
    parser.add_argument("--token", default=default_token, help="Long-lived access token")
    parser.add_argument(
        "--registry",
        type=Path,
        default=DEFAULT_REGISTRY,
        help="Path to .storage/core.entity_registry",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Markdown output path",
    )
    parser.add_argument(
        "--wait",
        type=float,
        default=4.0,
        help="Seconds to wait after each service call before sampling states",
    )
    parser.add_argument(
        "--scene",
        action="append",
        dest="scenes",
        help="Scene entity_id to export; repeat to select multiple scenes",
    )
    parser.add_argument(
        "--light",
        action="append",
        dest="lights",
        help="Light entity_id to sample; repeat to select multiple lights",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List selected scenes/lights without changing Home Assistant state",
    )
    parser.add_argument(
        "--no-restore",
        action="store_true",
        help="Leave lights in the final sampled state instead of restoring initial state",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    scenes, lights = load_lutron_entities(args.registry)
    scenes = filter_entities(scenes, args.scenes)
    lights = filter_entities(lights, args.lights)

    if not scenes:
        print("No Lutron scenes selected.", file=sys.stderr)
        return 2
    if not lights:
        print("No Lutron lights selected.", file=sys.stderr)
        return 2

    if args.dry_run:
        print(f"Selected {len(scenes)} Lutron scenes and {len(lights)} Lutron lights.")
        print("Scenes:")
        for scene in scenes:
            print(f"  {scene.entity_id} ({scene.name})")
        print("Lights:")
        for light in lights:
            print(f"  {light.entity_id} ({light.name})")
        return 0

    if not args.ha_url or not args.token:
        print(
            "Missing Home Assistant credentials. Set HASS_URL/HASS_TOKEN, "
            "or run inside a HA add-on shell with SUPERVISOR_TOKEN.",
            file=sys.stderr,
        )
        return 2

    client = HomeAssistantClient(args.ha_url, args.token)
    light_ids = [light.entity_id for light in lights]
    initial_states = client.raw_snapshot(light_ids)

    try:
        results = infer_scene_contents(client, scenes, lights, args.wait)
    finally:
        if not args.no_restore:
            restore_lights(client, initial_states)

    write_markdown(args.output, args.ha_url, args.wait, scenes, lights, results)
    print(f"Wrote {args.output}")
    return 0


def load_lutron_entities(registry_path: Path) -> tuple[list[RegistryEntity], list[RegistryEntity]]:
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    scenes: list[RegistryEntity] = []
    lights: list[RegistryEntity] = []

    for entry in registry.get("data", {}).get("entities", []):
        entity_id = entry.get("entity_id", "")
        if entry.get("platform") != LUTRON_PLATFORM or entry.get("disabled_by"):
            continue

        name = entry.get("name") or entry.get("original_name") or entity_id
        registry_entity = RegistryEntity(entity_id=entity_id, name=name)
        if entity_id.startswith("scene."):
            scenes.append(registry_entity)
        elif entity_id.startswith("light."):
            lights.append(registry_entity)

    return sorted(scenes, key=lambda entity: entity.entity_id), sorted(
        lights, key=lambda entity: entity.entity_id
    )


def filter_entities(
    entities: list[RegistryEntity], requested_entity_ids: list[str] | None
) -> list[RegistryEntity]:
    if not requested_entity_ids:
        return entities

    requested = set(requested_entity_ids)
    selected = [entity for entity in entities if entity.entity_id in requested]
    missing = requested - {entity.entity_id for entity in selected}
    if missing:
        raise SystemExit(f"Requested entities were not found in the Lutron registry: {sorted(missing)}")
    return selected


def infer_scene_contents(
    client: HomeAssistantClient,
    scenes: list[RegistryEntity],
    lights: list[RegistryEntity],
    wait_seconds: float,
) -> list[SceneResult]:
    light_ids = [light.entity_id for light in lights]
    light_names = {light.entity_id: light.name for light in lights}
    results: list[SceneResult] = []

    for scene in scenes:
        print(f"Sampling {scene.entity_id} ({scene.name})")
        client.call_service("light", "turn_off", {"entity_id": light_ids})
        time.sleep(wait_seconds)
        baseline_off = client.snapshot(light_ids)

        client.call_service("scene", "turn_on", {"entity_id": scene.entity_id})
        time.sleep(wait_seconds)
        after_off_scene = client.snapshot(light_ids)

        client.call_service("light", "turn_on", {"entity_id": light_ids})
        time.sleep(wait_seconds)
        baseline_on = client.snapshot(light_ids)

        client.call_service("scene", "turn_on", {"entity_id": scene.entity_id})
        time.sleep(wait_seconds)
        after_on_scene = client.snapshot(light_ids)

        controlled: list[InferredEntity] = []
        ambiguous: list[InferredEntity] = []
        not_controlled_count = 0

        for light_id in light_ids:
            inference = infer_light_membership(
                light_id,
                light_names[light_id],
                baseline_off.get(light_id, {"state": "missing"}),
                after_off_scene.get(light_id, {"state": "missing"}),
                baseline_on.get(light_id, {"state": "missing"}),
                after_on_scene.get(light_id, {"state": "missing"}),
            )
            if inference.confidence == "controlled":
                controlled.append(inference)
            elif inference.confidence == "ambiguous":
                ambiguous.append(inference)
            else:
                not_controlled_count += 1

        results.append(
            SceneResult(
                scene=scene,
                controlled=controlled,
                ambiguous=ambiguous,
                not_controlled_count=not_controlled_count,
            )
        )

    return results


def infer_light_membership(
    entity_id: str,
    name: str,
    baseline_off: dict[str, Any],
    after_off_scene: dict[str, Any],
    baseline_on: dict[str, Any],
    after_on_scene: dict[str, Any],
) -> InferredEntity:
    baseline_changed = baseline_off != baseline_on
    scene_converged = after_off_scene == after_on_scene
    scene_changed_state = after_off_scene != baseline_off or after_on_scene != baseline_on
    final_state = after_on_scene.get("state", "missing")

    if scene_converged and final_state not in UNKNOWN_STATES:
        if baseline_changed:
            return InferredEntity(
                entity_id=entity_id,
                name=name,
                setting=after_on_scene,
                confidence="controlled",
                reason="scene result matched from off and on baselines",
            )
        if scene_changed_state:
            return InferredEntity(
                entity_id=entity_id,
                name=name,
                setting=after_on_scene,
                confidence="controlled",
                reason="scene changed the entity even though baselines were not distinct",
            )

    if not baseline_changed:
        return InferredEntity(
            entity_id=entity_id,
            name=name,
            setting=after_on_scene,
            confidence="ambiguous",
            reason="off/on baselines were not distinct for this entity",
        )

    return InferredEntity(
        entity_id=entity_id,
        name=name,
        setting=after_on_scene,
        confidence="not_controlled",
        reason="scene result differed between off and on baselines",
    )


def normalize_light_state(record: dict[str, Any]) -> dict[str, Any]:
    state = record.get("state", "missing")
    normalized: dict[str, Any] = {"state": state}
    attributes = record.get("attributes", {})

    if state == "on":
        for key in NORMALIZED_LIGHT_ATTRIBUTES:
            value = attributes.get(key)
            if value is not None:
                normalized[key] = value

    return normalized


def restore_lights(
    client: HomeAssistantClient, initial_states: dict[str, dict[str, Any]]
) -> None:
    off_entities = [
        entity_id
        for entity_id, record in initial_states.items()
        if record.get("state") == "off"
    ]
    if off_entities:
        client.call_service("light", "turn_off", {"entity_id": off_entities})

    for entity_id, record in initial_states.items():
        if record.get("state") != "on":
            continue

        attributes = record.get("attributes", {})
        payload: dict[str, Any] = {"entity_id": entity_id}
        brightness = attributes.get("brightness")
        if brightness is not None:
            payload["brightness"] = brightness

        color_mode = attributes.get("color_mode")
        if color_mode == "color_temp" and attributes.get("color_temp_kelvin") is not None:
            payload["color_temp_kelvin"] = attributes["color_temp_kelvin"]
        elif color_mode == "hs" and attributes.get("hs_color") is not None:
            payload["hs_color"] = attributes["hs_color"]
        elif attributes.get("rgb_color") is not None:
            payload["rgb_color"] = attributes["rgb_color"]
        elif attributes.get("xy_color") is not None:
            payload["xy_color"] = attributes["xy_color"]

        try:
            client.call_service("light", "turn_on", payload)
        except urllib.error.HTTPError:
            fallback_payload = {"entity_id": entity_id}
            if brightness is not None:
                fallback_payload["brightness"] = brightness
            client.call_service("light", "turn_on", fallback_payload)


def write_markdown(
    output_path: Path,
    ha_url: str,
    wait_seconds: float,
    scenes: list[RegistryEntity],
    lights: list[RegistryEntity],
    results: list[SceneResult],
) -> None:
    generated_at = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        render_markdown(generated_at, ha_url, wait_seconds, scenes, lights, results),
        encoding="utf-8",
    )


def render_markdown(
    generated_at: str,
    ha_url: str,
    wait_seconds: float,
    scenes: list[RegistryEntity],
    lights: list[RegistryEntity],
    results: list[SceneResult],
) -> str:
    lines = [
        "# Inferred Lutron Scene Contents",
        "",
        f"Generated: `{generated_at}` by `tools/export_lutron_scene_contents.py`",
        f"Source: `{ha_url}`; wait: `{wait_seconds:g}s`; scenes: `{len(scenes)}`; lights: `{len(lights)}`",
        "",
        "```yaml",
    ]

    for result in results:
        lines.append(f"{result.scene.entity_id}:")
        lines.append(f"  name: {quote_yaml_scalar(result.scene.name)}")
        lines.append("  controlled_entities:")
        if result.controlled:
            for controlled in result.controlled:
                lines.append(f"    - entity_id: {controlled.entity_id}")
                lines.append(f"      name: {quote_yaml_scalar(controlled.name)}")
                lines.extend(render_yaml_setting(controlled.setting, indent="      "))
        else:
            lines.append("    []")
        if result.ambiguous:
            lines.append("  ambiguous_entities:")
            for ambiguous in result.ambiguous:
                lines.append(f"    - entity_id: {ambiguous.entity_id}")
                lines.append(f"      name: {quote_yaml_scalar(ambiguous.name)}")
                lines.append(f"      reason: {quote_yaml_scalar(ambiguous.reason)}")
        lines.append(f"  not_controlled_count: {result.not_controlled_count}")
    lines.append("```")

    return "\n".join(lines) + "\n"


def render_yaml_setting(setting: dict[str, Any], indent: str) -> list[str]:
    lines = [f"{indent}setting:"]
    for key, value in setting.items():
        lines.append(f"{indent}  {key}: {quote_yaml_value(value)}")
    return lines


def quote_yaml_scalar(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def quote_yaml_value(value: Any) -> str:
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False)
    return json.dumps(value, ensure_ascii=False)


if __name__ == "__main__":
    raise SystemExit(main())
# Foyer Transit Data Integrity Plan

Date: 2026-08-23

## Goal

Make the foyer transit panel consume a trustworthy Home Assistant-level transit model instead of raw MTA arrival-slot sensors. The dashboard should distinguish transient feed failures, stale-but-still-useful absolute arrival times, expired arrivals, and planned service exceptions.

## Upstream Findings

The official Home Assistant `mta` integration is a thin wrapper around `py-nymta==0.4.1`.

- It polls every 30 seconds via `UPDATE_INTERVAL = timedelta(seconds=30)`.
- Each configured stop/line/direction has its own `DataUpdateCoordinator`.
- Each stop exposes 9 sensors: arrival timestamp, route, and destination for the next three arrivals.
- On `MTAFeedError`, the coordinator raises `UpdateFailed`.
- Home Assistant's `DataUpdateCoordinator` preserves the previous `coordinator.data` object in memory on failed refreshes, but `CoordinatorEntity.available` becomes false while `last_update_success` is false.
- Therefore raw MTA entities appear unavailable during transient failures even though the last successful absolute arrival timestamps may still be useful.
- `py-nymta` filters out arrivals already in the past on successful fetches, but a cache layer must do that itself when carrying forward old data through failed polls.
- The official integration and `py-nymta` do not expose a normalized MTA service-alert surface for the dashboard.

## Design Direction

Add a small HA-level normalization layer for foyer transit. Prefer a custom integration if this becomes reusable across dashboards; use AppDaemon only if we want a faster local experiment.

Avoid large template-sensor graphs for this. Templates would duplicate route/slot logic across many entities, do not naturally preserve structured last-good snapshots, and would make MTA alert correlation awkward.

## Normalized Entity Contract

Expose one dashboard-facing sensor per route group and direction, for example:

- `sensor.foyer_transit_45_fulton_uptown`
- `sensor.foyer_transit_ac_fulton_downtown`
- `sensor.foyer_transit_jz_fulton_uptown`

Suggested state:

- Next live train countdown in minutes, or `unknown` when no usable arrival exists.

Suggested attributes:

- `status`: `live`, `stale`, `expired`, `offline`, or `service_exception`
- `updated_at`: last successful upstream poll time
- `age_seconds`: age of the last-good snapshot
- `stale`: boolean
- `expired`: boolean
- `route_group`: stable route group ID, such as `jz-fulton`
- `direction`: display direction, such as `Uptown/Queens/Bronx`
- `station`: selected station for this direction
- `walk_minutes`: configured walk time
- `arrivals`: combined list sorted by absolute arrival time/countdown
- `next_countdown_minutes`: `min(countdown)` across valid arrivals
- `leave_in_minutes`: `min(countdown - walk_minutes)` across strictly positive catchable arrivals
- `leave_arrival`: route/destination/arrival identifying the train used for `leave_in_minutes`
- `exceptions`: active exception/reroute/shutdown objects relevant to this route group, direction, or station
- `raw_entities`: underlying HA MTA entities used to build the snapshot

## Freshness Semantics

Use absolute arrival timestamps as the source of truth, not stored countdowns.

- `live`: last successful upstream poll is inside roughly two poll intervals plus grace, for example `<= 75s`.
- `stale`: upstream poll is older than live threshold but cached arrival timestamps are still in the future.
- `expired`: all cached arrival timestamps are now in the past, or the only remaining trains are no longer catchable.
- `offline`: no successful snapshot exists, or the last-good snapshot is too old to trust.
- `service_exception`: an active MTA alert indicates no service, planned shutdown, skipped stop, major reroute, or other route-level exception.

The dashboard should use subtle treatment for `stale`, stronger treatment for `expired`/`offline`, and explicit copy for `service_exception`.

## Polling And Cache Behavior

For every route-group direction:

1. Read or fetch all configured MTA source stops/lines.
2. On successful fetch, replace the last-good snapshot with absolute arrival times, route IDs, destinations, and fetch time.
3. On transient fetch failure, keep the last-good snapshot and increment/derive age.
4. Recompute countdowns from absolute timestamps at render/update time.
5. Drop arrivals whose timestamp is in the past from normal `arrivals`, but retain optional debug metadata if needed.
6. Mark status based on snapshot age plus whether any future/catchable arrivals remain.

Do not call every raw slot entity independently from the dashboard if the normalized layer can fetch or read once and publish a coherent route-group snapshot.

## Exception Feed Plan

Add a separate shared service-alert collector using the official MTA GTFS-RT alerts feed. It should be independent from the foyer dashboard so other automations/dashboards can reuse the same exception data.

Responsibilities:

- Poll the MTA service-alert feed on a modest cadence, likely 1-5 minutes.
- Normalize active alerts by affected route, stop, direction, effect, severity, active period, headline, and description.
- Classify effects into dashboard-friendly categories: `planned_shutdown`, `no_service`, `reroute`, `skipped_stop`, `delay`, `service_change`, and `advisory`.
- Join alerts to foyer route groups by route IDs, stop IDs, and direction when available.
- Expose shared entities such as `sensor.mta_service_exceptions` and route-specific attributes on each normalized foyer transit sensor.

Open implementation detail: verify the exact current MTA alerts endpoint and whether it needs a key in this Home Assistant environment before coding. The trip-update subway feeds do not need a key; alerts may have different endpoint rules.

## Dashboard Consumption

Once normalized entities exist, update `www/foyer-dashboard/foyer-dashboard-card.js` to prefer them over raw MTA slot sensors.

Main panel:

- Show `next_countdown_minutes` as the primary row value.
- Keep fixed route-group order.
- Use stale/expired/service-exception status for subtle or strong row treatment.
- Do not visually single out a line within a route pair on the collapsed row.

Modal:

- Render one combined table per direction, sorted by countdown.
- Omit stale/offline arrival rows.
- Show `Leave in X minutes (Y min walk)` once per direction column.
- Highlight the arrival corresponding to `leave_arrival`.
- Show service exceptions/reroutes in a compact free-text section below the arrivals when present.

## Implementation Phases

1. Prototype a normalized route-group builder in a custom integration module or AppDaemon app using the existing configured stops.
2. Add cached last-good snapshots with freshness/expiry status.
3. Publish one normalized sensor per route-group direction.
4. Update the foyer dashboard card to consume normalized sensors, with raw MTA sensors as a temporary fallback.
5. Add the shared MTA service-alert collector and attach exceptions to normalized transit sensors.
6. Remove the raw fallback from the dashboard after the normalized layer has run reliably for a few days.

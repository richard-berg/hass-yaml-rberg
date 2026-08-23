# Foyer iPad Dashboard Design Spec

Date: 2026-08-22
Device: iPad Air 13 inch, landscape, eye-level wall mount in the foyer / entryway.
Dashboard: `dashboard-foyer`

## Intent

This dashboard is a purpose-built entry/exit surface for household adults. It should feel like a polished architectural control panel, not a generic Home Assistant overview and not a security console.

Primary jobs:

- Decide what to do when leaving home, especially commute/transit choices.
- Set the Open Area lighting state quickly.
- Show brief household status and exceptions without becoming noisy.
- Provide a calm, attractive always-on daytime surface, dimmed when idle.
- Turn off at night, with tap-to-wake behavior handled by the tablet/browser layer.

Out of scope for v1:

- Security, lock, alarm, garage, or similarly risky controls.
- Full individual light control.
- Full HVAC control; there is a nearby thermostat.
- Full X32/theater/stage/media control.
- Deep analytics pages such as energy, battery status, temperature/air graphs.
- Calendar/reminders.

## Visual Direction

Target feeling: light stone plus black metal, with GlassHome-like polish but less decorative chrome.

Design preferences:

- Architectural, crisp, and premium.
- Light dominant, not dark-mode-first.
- Some glossy depth is welcome.
- Avoid frosted glass blur as the main visual trick.
- Avoid thin low-contrast text.
- Avoid default HA blue as a dominant accent.
- Avoid overly rounded bubbly cards as the primary language, even if Bubble Card is used under the hood.

Suggested palette:

- Background: warm limestone / pale concrete.
- Primary text: near-black graphite.
- Secondary text: warm gray.
- Accent: controlled amber/brass for active lighting scenes.
- Alert accent: restrained red/orange only for exceptions.
- Transit colors: use official MTA line colors where needed; keep them contained inside line badges.

Material language:

- Flat architectural panels with crisp borders.
- Slight glossy/tactile depth for tappable controls.
- Radius modest: roughly 6-10px, not pill-heavy except for line/status chips.
- Strong alignment and generous whitespace around dense data.
- Avoid title bars on obvious blocks; the contents should make each region self-evident.
- Keep the clock small. It is context, not the main feature.
- Use whitespace with discipline; dense controls like lighting should be compact and immediately actionable.
- Keep the primary layout as two zones: roughly 35% left status rail and 65% right workspace. Do not split the right workspace into a persistent third column.

Dog photo/art direction:

- Use the current Foyer dashboard dog photo as a right-side framed print.
- Crop inside a black/brass frame with a mat, subtle border, and tonal color grading that matches the stone/black-metal palette.
- Slot the dog image into the right workspace as a composed framed print, not a persistent full-height third column and not a low-opacity full-screen wallpaper behind unrelated UI.
- Prefer warm graphite/low-saturation processing so the photo feels like a deliberate print rather than a raw camera image.
- If a full-screen background returns later, design the whole dashboard around it rather than placing ordinary cards on top of a faded image.

## Stack Recommendation

Use Home Assistant Lovelace storage dashboard with:

- Native `sections` view as the layout shell.
- Bubble Card for polished, compact button/select/popup patterns.
- Existing `kiosk-mode` for wall-tablet behavior.
- A custom HA theme for the light-stone/black-metal design language.
- Native tile/heading/conditional cards where they are sufficient.

Custom card inventory already present under `/config/www/community` includes:

- `Bubble-Card`
- `lovelace-mushroom`
- `kiosk-mode`
- `clock-weather-card`
- `weather-card`
- `platinum-weather-card`
- `mini-media-player`
- `atomic-calendar-revive`
- `calendar-card-pro`
- `mini-graph-card`
- layout/stack helpers

Preferred v1 approach: HA Sections + Bubble Card + custom theme. Keep Mushroom available as a fallback for simple status chips if Bubble styling becomes cumbersome.

## Information Architecture

Main screen: no required scrolling.

Use a 35/65 composition:

- Left 35%: situational awareness.
- Center/right 65%: controls.

Proposed layout:

```text
+-----------------------------+-----------------------------------------------------+
| STATUS RAIL                 | CONTROLS                                            |
|                             |                                                     |
| Large clock/date            | Office Commute Decision Panel                       |
| Weather now + brief today   | 4/5 vs R/W, manual/status shell for v1              |
| Temp/air brief              |                                                     |
| People chips                | Open Area Lighting                                  |
| Active media chip           | [Include Living toggle] [Normal] [Mood] [Off]       |
| Exception/alert chips       |                                                     |
|                             | House Modes                                         |
|                             | [Guest] [Party]                                     |
|                             |                                                     |
|                             | Living Room Sonos compact control                   |
+-----------------------------+-----------------------------------------------------+
```

Secondary surfaces:

- Lighting popup: detailed room/scene controls for Kitchen, Dining, Living, Stage.
- Transit popup: all useful nearby lines, de-duplicated by real walking/usefulness logic.
- Status popup: alerts/details for people, device issues, active media.

Avoid adding separate dashboard pages in v1 unless the popup model becomes cramped.

## Widgets

### Status Rail

Purpose: calm situational context while walking past.

Content:

- Small clock and date.
- Weather summary from `weather.forecast_home`, with stronger iconography and color than the first mockup.
- Hour-by-hour precipitation strip across the rolling 24-hour window, with the window inferred from the x-axis labels instead of stated in the copy.
- Keep the top weather readout strictly about current state: current temperature, feels-like temperature, wind, and the short condition sentence.
- Show forward-looking temperature as a second series on the strip rather than as a separate H/L text readout.
- The strip should use blue for precipitation and a separate warm line for temperature, with split legend placement and left/right scale labels to make the approximate high/low and precipitation scale legible.
- Current temperature, feels-like, and wind readouts should include units.
- Keep the weather widget to a headline and strip for now; revisit a separate precipitation summary only if the card feels too bare.
- Wind can be small and can be paired with feels-like temperature.
- No separate temperature or air-quality sensors in v1; weather is enough.
- Transit status grouped here because it is status/decision support, not a control surface.
- People status as compact avatar/status icons.
- Do not duplicate Sonos/media state in the left status rail; keep Sonos in the control area.
- Normal no-alert state can be icon-only; words should appear only when there is an actual alert preview.
- Exception chips only when needed.

Behavior:

- Most status cards are read-only or open detail popups.
- Weather should be complete in the main pane and should not show a drill-in chevron.
- Alerts should be small in normal state and visually stronger only when active.

### Transit Panel

Purpose: leaving-home decision board.

V1 data model:

- Static mockup with fake data first, not live GTFS yet.
- First-screen panel should emphasize uptown trip choices generally, not a specific office commute.
- Do not show home/work addresses or other static information already known to the household.
- Keep `4/5` vs `R/W` prominent, with room for other useful uptown choices.
- Use embedded affordances, such as a chevron/notch, to imply that tapping opens more detail; avoid instructional text.
- Include a popup for downtown lines and transit alerts later.

Important routing rule:

- Do not show duplicate worse station options merely because they are within radius.
- Use meaningful options from 176 Broadway, NY 10038.
- Fulton and the WTC/Park Place/Chambers/Cortlandt complex are useful.
- Wall Street should generally be suppressed for duplicate service when Fulton gives a closer platform for the same train family.
- Park Place remains useful for uptown `2/3` despite similar walking distance to Wall, because it changes the actual decision.

Potential future data sources:

- Adapt/embed a 12amtrain-style local widget.
- Build a custom local web component using MTA GTFS realtime.
- Expose derived sensors in HA only if they become useful outside this dashboard.

### Open Area Lighting

User mental model:

- Axis 1: which parts of the Open Area are about to be used.
- Axis 2: intensity/mood of those areas.

Default scope:

- Always control Kitchen + Dining + Foyer.
- Often include Living.
- Stage is rare; do not give it one-tap primary-screen access.

Main-screen control:

- A boolean-style `+ Living Room` control.
- `+ Living Room` means include Living Room in future grouped lighting actions. Turning it on also immediately applies the current intensity to Living Room; turning it off does not turn Living Room off.
- Track the current selected intensity in `input_select.foyer_dashboard_lighting_intensity` with options `Bright`, `Everyday`, `Evening`, `Mood`, `Off`.
- Instant intensity buttons: `Everyday`, `Off`, plus smaller `Bright`, `Evening`, `Mood` buttons. These apply immediately to the current scope and update the intensity helper.
- Avoid a separate confirmation for these lighting controls.
- Use a large lightbulb icon for context instead of static room labels; the tablet mount location makes the default Kitchen/Dining/Foyer scope clear enough.
- Avoid ambiguous jargon such as `Core` and avoid `K/D/F` abbreviations.
- Active intensity must be visually selected, and all lighting buttons should have tangible tap feedback.
- The lower-right details affordance opens a dismissable `Light Controls` modal/lightbox. Granular controls can be added there later.

Known Open Area entities/scenes:

- Open Area meta-area: Kitchen, Foyer, Dining, Stage, Living.
- Existing reusable script: `script.open_area_lights_off`.
- Foyer light: `light.front_foyer_main_lights` currently appears assigned to Kitchen.
- Existing all-off scene: `scene.all_off` controls a broad set and includes some bathroom/bedroom/theater entries; evaluate before making it a prominent button.
- Kitchen scenes include foyer lighting: `scene.kitchen_bright`, `scene.kitchen_normal`, `scene.kitchen_mood`, `scene.kitchen_off`.
- Dining scenes include dining plus adjacent accent lighting: `scene.dining_bright`, `scene.dining_normal`, `scene.dining_mood`, `scene.dining_off`.
- Living scenes: `scene.living_room_bright`, `scene.living_room_normal`, `scene.living_room_mood`, `scene.living_room_off`.
- Stage scenes should live in popup/detail only unless later promoted.

Implementation implication:

- Use explicit scripts for each intensity: `script.foyer_dashboard_open_area_bright`, `script.foyer_dashboard_open_area_everyday`, `script.foyer_dashboard_open_area_evening`, `script.foyer_dashboard_open_area_mood`, and `script.foyer_dashboard_open_area_off`.
- The UI label `Everyday` maps to the existing `normal` scenes behind the scenes.
- Use `input_boolean.foyer_dashboard_include_living` for the `+ Living Room` toggle.
- Foyer dashboard scripts must call `script.kitchen_bright`, `script.kitchen_normal`, `script.kitchen_mood`, or `script.kitchen_off` rather than raw `scene.kitchen_*` scenes, because those kitchen behavior scripts also update the Hood Light.
- After setting the active intensity helper, run Kitchen, Dining, and optional Living Room changes as parallel branches so Kitchen/Hood Light delays do not postpone Living Room.

### House Modes

V1 visible modes/toggles:

- Guest
- Party
- Performance

Treatment:

- Show these as compact labeled controls, not full cards.
- Avoid icon-only mode buttons; they are too ambiguous on a wall dashboard.
- Put modes in their own bottom dock/panel with similar visual importance to navigation; do not combine modes with Sonos.
- Deeper name/purpose details can still live in the eventual HA more-info surface.

Current discovery:

- No obvious Guest or Party helper/script/scene was found by fuzzy search.
- Performance is reserved for future semantics.

Need discovery before implementation:

- Treat Guest, Party, and Performance as reserved toggles in the visual mockup until their semantics are defined.

### People Status

V1 treatment:

- Show small avatars/chips.
- Known person entities: `person.richard_berg`, `person.allison_bishop`, `person.public`.
- Do not show `person.public` on the wall display.

Need decision:

- Confirm avatar imagery/naming once moving from mockup to implementation.

### Audio

V1 scope:

- Living Room Sonos only: `media_player.living_room`.
- Show now-playing status if active.
- Provide basic pause/off control only.
- Full X32/theater/stage/media control belongs elsewhere.

### HVAC

Low priority for v1.

Known entity:

- `climate.thermostat`

Possible treatment:

- Small status chip in the left rail.
- No full thermostat card on the main screen unless user later wants it.
- HVAC scene shortcuts can be omitted initially to protect focus.

## Interaction Rules

- Main-screen controls should be touch-sized for eye-level landscape use.
- Frequent actions must be one tap.
- Risky controls are absent, not merely hidden.
- Secondary detail opens in popups, not deep navigation.
- Navigation should be a compact bottom-right dock with right-justified chips, not a full-width footer.
- Avoid long press as a core interaction; wall tablets should be obvious to household adults.
- Avoid scroll as a requirement for the primary workflow.

## Proposed V1 Build Plan

1. Create or update a custom foyer theme for light stone / black metal / restrained gloss.
2. Create a static HTML mockup with fake transit/status data before changing the live dashboard.
3. Add helpers for dashboard-local state if missing: `input_boolean.foyer_include_living`, Guest mode helper, Party mode helper, Performance mode helper.
4. Create small scripts for lighting intents: core-only and core-plus-living variants for Mood, Normal, and Off.
5. Replace the current minimal `dashboard-foyer` view with a sections-based dashboard.
6. Add popups for lighting details and transit detail once the main screen is useful.
7. Configure kiosk-mode/tablet behavior after the dashboard shape is stable.

## Open Questions

- What should Guest mode eventually do?
- What should Party mode eventually do?
- What should Performance mode eventually do?
- Should `All Off` appear in a power-user popup/tab, given `scene.all_off` currently controls more than the Open Area?
- Should the current background image on `dashboard-foyer` stay, be replaced, or be removed in favor of a theme background?
- How should cute dog art/photo be integrated tastefully without making the dashboard feel like a photo frame?

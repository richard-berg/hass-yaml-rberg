const TRANSIT_UPTOWN = "Uptown/Queens/Bronx";
const TRANSIT_DOWNTOWN = "Downtown/Brooklyn";
const TRANSIT_ARRIVAL_SLOTS = ["next_arrival", "second_arrival", "third_arrival"];
const ALL_LIGHTS_OFF_ENTITIES = [
  "light.dining_room_beer_shelf", "light.dining_room_main_lights", "light.dining_room_pendant", "light.dining_room_piano_lamp",
  "light.front_foyer_main_lights", "light.guest_bathroom_main_lights",
  "light.kitchen_island_lights", "light.kitchen_island_toe_kick", "light.kitchen_main_lights", "light.kitchen_perimeter_toe_kick", "light.kitchen_under_cabinet",
  "light.living_room_allisons_desk_lamp", "light.living_room_book_shelf", "light.living_room_floor_lamp", "light.living_room_holiday_lights", "light.living_room_main_lights", "light.living_room_painting", "light.living_room_stage_perimeter", "light.living_room_stage_spot_lights", "light.living_room_walkway",
  "light.master_bathroom_commode", "light.master_bathroom_main_lights", "light.master_bathroom_shower_lights", "light.master_bathroom_shower_niche", "light.master_bathroom_vanity_lights", "light.master_bedroom_cove_lights",
  "light.theater_clouds_front", "light.theater_clouds_rear", "light.theater_desk_lamp", "light.theater_downlight_front", "light.theater_downlight_rear", "light.theater_dresser_left", "light.theater_dresser_right",
  "light.hood_light_light_0", "light.pendant",
  "light.stage_uplight_1_red", "light.stage_uplight_1_green", "light.stage_uplight_1_blue", "light.stage_uplight_1_amber", "light.stage_uplight_1_white", "light.stage_uplight_1_uv",
  "light.stage_uplight_2_red", "light.stage_uplight_2_green", "light.stage_uplight_2_blue", "light.stage_uplight_2_amber", "light.stage_uplight_2_white", "light.stage_uplight_2_uv"
];

const mtaSource = (line, prefix) => ({
  line,
  arrival_entities: TRANSIT_ARRIVAL_SLOTS.map((slot) => `${prefix}_${slot}`),
  destination_entities: TRANSIT_ARRIVAL_SLOTS.map((slot) => `${prefix}_${slot}_destination`),
  route_entities: TRANSIT_ARRIVAL_SLOTS.map((slot) => `${prefix}_${slot}_route`)
});

const DEFAULT_CONFIG = {
  image: "/api/image/serve/7abddc82be6cd368867697a7e0ac5a3c/original",
  entities: {
    weather: "weather.forecast_home",
    includeLiving: "input_boolean.foyer_dashboard_include_living",
    lightingIntensity: "input_select.foyer_dashboard_lighting_intensity",
    lightingPeriod: "input_select.open_area_lighting_period",
    transitDirection: "input_select.foyer_dashboard_transit_direction",
    guestMode: "input_boolean.guest_mode",
    partyMode: "input_boolean.party_mode",
    concertMode: "input_boolean.concert_mode",
    richard: "person.richard_berg",
    allison: "person.allison_bishop",
    mediaPlayer: "media_player.living_room"
  },
  homeSsids: ["BlindDog/DeafDog"],
  scripts: {
    on: "script.foyer_dashboard_open_area_on",
    bright: "script.foyer_dashboard_open_area_bright",
    daytime: "script.foyer_dashboard_open_area_everyday",
    everyday: "script.foyer_dashboard_open_area_everyday",
    evening: "script.foyer_dashboard_open_area_evening",
    mood: "script.foyer_dashboard_open_area_mood",
    off: "script.foyer_dashboard_open_area_off"
  },
  lightingAreas: [
    {
      key: "kitchen",
      label: "Kitchen",
      presets: [
        { label: "Bright", entity: "script.kitchen_bright" },
        { label: "Day", entity: "script.kitchen_normal" },
        { label: "Evening", entity: "script.kitchen_evening" },
        { label: "Mood", entity: "script.kitchen_mood" },
        { label: "Off", entity: "script.kitchen_off", off: true }
      ]
    },
    {
      key: "dining",
      label: "Dining",
      presets: [
        { label: "Bright", entity: "scene.dining_bright" },
        { label: "Day", entity: "scene.dining_normal" },
        { label: "Evening", entity: "scene.pantry_smart_bridge_dining_evening" },
        { label: "Mood", entity: "scene.dining_mood" },
        { label: "Off", entity: "scene.dining_off", off: true }
      ]
    },
    {
      key: "stage",
      label: "Stage",
      presets: [
        { label: "Bright", entity: "scene.stage_etc_bright" },
        { label: "Focus", entity: "scene.stage_etc_focus" },
        { label: "Mood", entity: "scene.stage_etc_mood" },
        { label: "Off", entity: "scene.stage_etc_off", off: true }
      ]
    },
    {
      key: "living",
      label: "Living",
      presets: [
        { label: "Bright", entity: "scene.living_room_bright" },
        { label: "Day", entity: "scene.living_room_normal" },
        { label: "Evening", entity: "scene.pantry_smart_bridge_living_room_evening" },
        { label: "Mood", entity: "scene.living_room_mood" },
        { label: "Off", entity: "scene.living_room_off", off: true }
      ]
    }
  ],
  wholeHouseLighting: [
    { key: "off", label: "Off", entity: "script.all_lights_off", level: 0, off: true, wide: true, expected: Object.fromEntries(ALL_LIGHTS_OFF_ENTITIES.map((entityId) => [entityId, "off"])), expectedStates: { "switch.guest_bath_vanity_switch": "off" } },
    { key: "pathway", label: "Pathway to Shower", entity: "script.pathway_to_shower", emoji: "💩", wide: true, expected: { ...Object.fromEntries(ALL_LIGHTS_OFF_ENTITIES.map((entityId) => [entityId, "off"])), "light.master_bathroom_shower_lights": 76, "light.master_bathroom_shower_niche": 76, "light.theater_downlight_front": 12 }, expectedStates: { "switch.guest_bath_vanity_switch": "off" } }
  ],
  transit: {
    staleAfterMinutes: 4,
    routeGroups: [
      {
        id: "45-fulton",
        label: "4/5",
        lines: [{ label: "4", className: "green" }, { label: "5", className: "green" }],
        data_source: "mta",
        directions: {
          [TRANSIT_UPTOWN]: { direction: "N", station: "Fulton St", walk_minutes: 5, sources: [mtaSource("4", "sensor.4_fulton_st_n_direction"), mtaSource("5", "sensor.5_fulton_st_n_direction")], alert_entities: [] },
          [TRANSIT_DOWNTOWN]: { direction: "S", station: "Fulton St", walk_minutes: 5, sources: [mtaSource("4", "sensor.4_fulton_st_s_direction"), mtaSource("5", "sensor.5_fulton_st_s_direction")], alert_entities: [] }
        }
      },
      {
        id: "ac-fulton",
        label: "A/C",
        lines: [{ label: "A", className: "blue" }, { label: "C", className: "blue" }],
        data_source: "mta",
        directions: {
          [TRANSIT_UPTOWN]: { direction: "N", station: "Fulton St", walk_minutes: 5, sources: [mtaSource("A", "sensor.a_fulton_st_n_direction"), mtaSource("C", "sensor.c_fulton_st_n_direction")], alert_entities: [] },
          [TRANSIT_DOWNTOWN]: { direction: "S", station: "Fulton St", walk_minutes: 5, sources: [mtaSource("A", "sensor.a_fulton_st_s_direction"), mtaSource("C", "sensor.c_fulton_st_s_direction")], alert_entities: [] }
        }
      },
      {
        id: "rw-cortlandt",
        label: "R/W",
        lines: [{ label: "R", className: "yellow" }, { label: "W", className: "yellow" }],
        data_source: "mta",
        directions: {
          [TRANSIT_UPTOWN]: { direction: "N", station: "Cortlandt St", walk_minutes: 6, sources: [mtaSource("R", "sensor.r_cortlandt_st_n_direction"), mtaSource("W", "sensor.w_cortlandt_st_n_direction")], alert_entities: [] },
          [TRANSIT_DOWNTOWN]: { direction: "S", station: "Cortlandt St", walk_minutes: 6, sources: [mtaSource("R", "sensor.r_cortlandt_st_s_direction"), mtaSource("W", "sensor.w_cortlandt_st_s_direction")], alert_entities: [] }
        }
      },
      {
        id: "jz-fulton",
        label: "J/Z",
        lines: [{ label: "J", className: "brown" }, { label: "Z", className: "brown" }],
        data_source: "mta",
        directions: {
          [TRANSIT_UPTOWN]: { direction: "N", station: "Fulton St", walk_minutes: 5, sources: [mtaSource("J", "sensor.j_fulton_st_n_direction"), mtaSource("Z", "sensor.z_fulton_st_n_direction")], alert_entities: [] }
        }
      },
      {
        id: "e-wtc",
        label: "E",
        lines: [{ label: "E", className: "blue" }],
        data_source: "mta",
        directions: {
          [TRANSIT_UPTOWN]: { direction: "N", station: "World Trade Center", walk_minutes: 6, sources: [mtaSource("E", "sensor.e_world_trade_center_n_direction")], alert_entities: [] }
        }
      },
      {
        id: "1-wtc",
        label: "1",
        lines: [{ label: "1", className: "red" }],
        data_source: "mta",
        directions: {
          [TRANSIT_UPTOWN]: { direction: "N", station: "WTC Cortlandt", walk_minutes: 6, sources: [mtaSource("1", "sensor.1_wtc_cortlandt_n_direction")], alert_entities: [] }
        }
      },
      {
        id: "23-seventh",
        label: "2/3",
        lines: [{ label: "2", className: "red" }, { label: "3", className: "red" }],
        data_source: "mta",
        directions: {
          [TRANSIT_UPTOWN]: { direction: "N", station: "Park Pl", walk_minutes: 6, sources: [mtaSource("2", "sensor.2_park_place_n_direction"), mtaSource("3", "sensor.3_park_place_n_direction")], alert_entities: [] },
          [TRANSIT_DOWNTOWN]: { direction: "S", station: "Fulton St", walk_minutes: 5, sources: [mtaSource("2", "sensor.2_fulton_st_s_direction"), mtaSource("3", "sensor.3_fulton_st_s_direction")], alert_entities: [] }
        }
      },
      {
        id: "path-wtc",
        label: "PATH",
        lines: [{ label: "PATH", className: "path" }],
        data_source: "path",
        enabled: false,
        directions: {}
      }
    ]
  }
};

class FoyerDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = DEFAULT_CONFIG;
    this._hass = null;
    this._timer = null;
    this._pressedKey = null;
    this._pressedTimer = null;
    this._optimisticIntensity = null;
    this._optimisticTimer = null;
    this._lightingModalOpen = false;
    this._expandedLightingAreas = new Set();
    this._lightSliderActive = false;
    this._optimisticLightBrightness = new Map();
    this._transitModal = null;
    this._personModal = null;
    this._forecastCache = { entityId: null, hourly: [], updatedAt: 0 };
    this._forecastPromise = null;
    this._forecastTimer = null;
    this._handleClick = this._handleClick.bind(this);
    this._handleLightPointerDown = this._handleLightPointerDown.bind(this);
    this._handleLightPointerUp = this._handleLightPointerUp.bind(this);
    this._handleLightPointerCancel = this._handleLightPointerCancel.bind(this);
    this._handleLightInput = this._handleLightInput.bind(this);
    this._handleLightChange = this._handleLightChange.bind(this);
  }

  setConfig(config) {
    this._config = this._mergeConfig(DEFAULT_CONFIG, config || {});
    this._forecastCache = { entityId: null, hourly: [], updatedAt: 0 };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    for (const [entityId, optimistic] of this._optimisticLightBrightness) {
      const state = hass.states[entityId];
      const brightness = state?.state === "on" && Number.isFinite(Number(state.attributes?.brightness))
        ? Math.round(Number(state.attributes.brightness) / 2.55)
        : 0;
      if (Math.abs(brightness - optimistic.brightness) <= 1) {
        window.clearTimeout(optimistic.timer);
        this._optimisticLightBrightness.delete(entityId);
      }
    }
    this._refreshWeatherForecasts();
    this._render();
  }

  connectedCallback() {
    this.shadowRoot.addEventListener("click", this._handleClick);
    this.shadowRoot.addEventListener("pointerdown", this._handleLightPointerDown);
    this.shadowRoot.addEventListener("pointerup", this._handleLightPointerUp);
    this.shadowRoot.addEventListener("pointercancel", this._handleLightPointerCancel);
    this.shadowRoot.addEventListener("input", this._handleLightInput);
    this.shadowRoot.addEventListener("change", this._handleLightChange);
    this._timer = window.setInterval(() => this._render(), 30000);
    this._forecastTimer = window.setInterval(() => this._refreshWeatherForecasts(true), 15 * 60 * 1000);
    this._refreshWeatherForecasts();
    this._render();
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener("click", this._handleClick);
    this.shadowRoot.removeEventListener("pointerdown", this._handleLightPointerDown);
    this.shadowRoot.removeEventListener("pointerup", this._handleLightPointerUp);
    this.shadowRoot.removeEventListener("pointercancel", this._handleLightPointerCancel);
    this.shadowRoot.removeEventListener("input", this._handleLightInput);
    this.shadowRoot.removeEventListener("change", this._handleLightChange);
    if (this._timer) {
      window.clearInterval(this._timer);
      this._timer = null;
    }
    if (this._pressedTimer) window.clearTimeout(this._pressedTimer);
    if (this._optimisticTimer) window.clearTimeout(this._optimisticTimer);
    for (const optimistic of this._optimisticLightBrightness.values()) window.clearTimeout(optimistic.timer);
    this._optimisticLightBrightness.clear();
    if (this._forecastTimer) window.clearInterval(this._forecastTimer);
  }

  getCardSize() {
    return 12;
  }

  _mergeConfig(base, override) {
    return {
      ...base,
      ...override,
      entities: { ...base.entities, ...(override.entities || {}) },
      scripts: { ...base.scripts, ...(override.scripts || {}) },
      lightingAreas: override.lightingAreas || base.lightingAreas,
      wholeHouseLighting: override.wholeHouseLighting || base.wholeHouseLighting,
      transit: this._mergeTransitConfig(base.transit, override.transit)
    };
  }

  _mergeTransitConfig(baseTransit, overrideTransit) {
    if (!overrideTransit) return baseTransit;
    if (Array.isArray(overrideTransit)) return { ...baseTransit, routeGroups: overrideTransit };
    return {
      ...baseTransit,
      ...overrideTransit,
      routeGroups: overrideTransit.routeGroups || baseTransit.routeGroups
    };
  }

  _state(entityId) {
    return entityId && this._hass ? this._hass.states[entityId] : undefined;
  }

  _friendly(entityId, fallback) {
    const state = this._state(entityId);
    return state?.attributes?.friendly_name || fallback || entityId;
  }

  _initial(entityId, fallback) {
    const name = this._friendly(entityId, fallback);
    return (name || "?").trim().charAt(0).toUpperCase();
  }

  _relativeAge(timestamp) {
    const elapsed = Date.now() - Date.parse(timestamp);
    if (!Number.isFinite(elapsed) || elapsed < 0) return "unknown age";
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 2) return "now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  _personModel(entityId) {
    const person = this._state(entityId);
    const state = person?.state;
    const trackerId = person?.attributes?.source || person?.attributes?.device_trackers?.[0];
    const tracker = this._state(trackerId);
    const trackerKey = trackerId?.startsWith("device_tracker.") ? trackerId.slice("device_tracker.".length) : null;
    const ssid = trackerKey ? this._state(`sensor.${trackerKey}_ssid`) : null;
    const connection = trackerKey ? this._state(`sensor.${trackerKey}_connection_type`) : null;
    const homeWifi = this._config.homeSsids.includes(ssid?.state);
    const updatedAt = tracker?.last_changed || tracker?.last_updated || person?.last_updated || null;
    const stale = !updatedAt || Date.now() - Date.parse(updatedAt) > 6 * 60 * 60 * 1000;
    const accuracy = Number(person?.attributes?.gps_accuracy);
    const homeRadius = Number(this._state("zone.home")?.attributes?.radius) || 100;
    const poorAccuracy = Number.isFinite(accuracy) && accuracy > homeRadius;

    let kind = "away";
    let label = "Away";
    if (!person || ["unknown", "unavailable"].includes(state)) {
      kind = "unknown";
      label = "Unknown";
    } else if (state === "home") {
      kind = stale || (poorAccuracy && !homeWifi) ? "uncertain" : "home";
      label = kind === "home" ? "Home" : "Home?";
    } else if (state !== "not_home") {
      kind = "zone";
      label = this._titleCase(state);
    }

    const evidence = [this._relativeAge(updatedAt)];
    if (Number.isFinite(accuracy)) evidence.push(`±${Math.round(accuracy)}m`);
    if (homeWifi) evidence.push("Wi-Fi");
    return {
      entityId,
      name: this._friendly(entityId),
      initial: this._initial(entityId),
      picture: person?.attributes?.entity_picture || null,
      kind,
      label,
      evidence: evidence.join(" · "),
      updatedAt,
      accuracy: Number.isFinite(accuracy) ? Math.round(accuracy) : null,
      network: homeWifi ? ssid.state : connection?.state || ssid?.state || null,
      sourceType: tracker?.attributes?.source_type || null,
      connection: tracker?.state === "home" ? "Connected" : tracker?.state === "not_home" ? "Disconnected" : "Unavailable",
      ipAddress: tracker?.attributes?.ip || null,
      tracker: trackerId ? this._friendly(trackerId, trackerId) : null
    };
  }

  _formatClock() {
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date()).replace(" AM", "").replace(" PM", "");
  }

  _formatDate() {
    return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date());
  }

  _titleCase(value) {
    if (!value) return "Unknown";
    return String(value).replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  _weatherConditionLabel(value) {
    const labels = {
      clear: "Clear",
      "clear-night": "Clear",
      cloudy: "Cloudy",
      fog: "Foggy",
      hail: "Hail",
      lightning: "Lightning",
      lightning_rainy: "Storms",
      partlycloudy: "Partly cloudy",
      pouring: "Pouring",
      rainy: "Rainy",
      snowy: "Snowy",
      snowy_rainy: "Sleet",
      sunny: "Sunny",
      windy: "Windy",
      windy_variant: "Windy"
    };
    return labels[value] || this._titleCase(value);
  }

  async _fetchForecast(entityId, type) {
    if (!this._hass?.callWS || !entityId) return [];
    const response = await this._hass.callWS({
      type: "call_service",
      domain: "weather",
      service: "get_forecasts",
      service_data: { type },
      target: { entity_id: entityId },
      return_response: true
    });
    const forecast = response?.[entityId]?.forecast || response?.response?.[entityId]?.forecast || response?.service_response?.[entityId]?.forecast;
    return Array.isArray(forecast) ? forecast : [];
  }

  _refreshWeatherForecasts(force = false) {
    const entityId = this._config.entities.weather;
    if (!this._hass?.callWS || !entityId || this._forecastPromise) return;
    const fresh = this._forecastCache.entityId === entityId && Date.now() - this._forecastCache.updatedAt < 15 * 60 * 1000;
    if (!force && fresh) return;

    this._forecastPromise = this._fetchForecast(entityId, "hourly").then((hourly) => {
      this._forecastCache = { entityId, hourly, updatedAt: Date.now() };
      this._render();
    }).catch(() => {
      this._forecastCache = { ...this._forecastCache, entityId, updatedAt: Date.now() };
    }).finally(() => {
      this._forecastPromise = null;
    });
  }

  _forecastHours() {
    const now = Date.now();
    return (this._forecastCache.hourly || [])
      .filter((hour) => Date.parse(hour.datetime) >= now - 60 * 60 * 1000)
      .slice(0, 24);
  }

  _hourLabel(date) {
    return new Intl.DateTimeFormat(undefined, { hour: "numeric" })
      .format(date)
      .replace(/\s/g, "")
      .replace("AM", "a")
      .replace("PM", "p")
      .toLowerCase();
  }

  _daypart(date) {
    const hour = date.getHours();
    if (hour < 5) return "overnight";
    if (hour < 12) return "this morning";
    if (hour < 17) return "this afternoon";
    if (hour < 21) return "this evening";
    return "tonight";
  }

  _isWetForecast(hour) {
    const condition = String(hour.condition || "").replace(/_/g, "-");
    const precipitation = Number(hour.precipitation || 0);
    const probability = Number(hour.precipitation_probability);
    return precipitation >= 0.01 || probability >= 30 || ["rainy", "pouring", "lightning-rainy", "snowy", "snowy-rainy", "hail"].includes(condition);
  }

  _weatherSentence(condition, hours) {
    if (!hours.length) return `${condition} now`;
    const wetHour = hours.find((hour) => this._isWetForecast(hour));
    if (wetHour) {
      const wetDate = new Date(wetHour.datetime);
      const wetWord = String(wetHour.condition || "").includes("snow") ? "snow" : "rain";
      return `${condition} now, ${wetWord} ${this._daypart(wetDate)}`;
    }

    const laterCondition = this._weatherConditionLabel(hours[Math.min(8, hours.length - 1)]?.condition || condition).toLowerCase();
    const currentCondition = condition.toLowerCase();
    if (laterCondition && laterCondition !== currentCondition) return `${condition} now, ${laterCondition} later`;
    return `${condition} now, holding steady`;
  }

  _formatPrecip(value, unit, includeUnit = false) {
    const safeValue = Number.isFinite(value) ? value : 0;
    if (unit === "%") return `${Math.round(safeValue)}${includeUnit ? "%" : ""}`;
    const decimals = safeValue > 0 && safeValue < 0.1 ? 2 : safeValue < 1 ? 1 : 0;
    return `${safeValue.toFixed(decimals)}${includeUnit ? ` ${unit}` : ""}`;
  }

  _precipScaleMax(values, hasProbability) {
    if (hasProbability) return 100;
    const maxValue = Math.max(0, ...values);
    if (maxValue <= 0.05) return 0.05;
    if (maxValue <= 0.1) return 0.1;
    if (maxValue <= 0.25) return 0.25;
    if (maxValue <= 0.5) return 0.5;
    if (maxValue <= 1) return 1;
    return Math.ceil(maxValue);
  }

  _forecastChart(hours, currentTemperature, precipitationUnit) {
    const sourceHours = hours.length ? hours : Array.from({ length: 24 }, (_, index) => ({ datetime: new Date(Date.now() + index * 60 * 60 * 1000).toISOString() }));
    const hasProbability = sourceHours.some((hour) => Number.isFinite(Number(hour.precipitation_probability)));
    const precipValues = sourceHours.map((hour) => {
      const precipitation = Number(hour.precipitation || 0);
      const probability = Number(hour.precipitation_probability);
      return hasProbability && Number.isFinite(probability) ? probability : Math.max(0, precipitation);
    });
    const precipUnit = hasProbability ? "%" : (precipitationUnit || "in");
    const precipMax = this._precipScaleMax(precipValues, hasProbability);
    const plottedTemps = sourceHours.map((hour) => {
      const temperature = Number(hour.temperature);
      return Number.isFinite(temperature) ? temperature : currentTemperature;
    }).filter((temperature) => Number.isFinite(temperature));
    const fallbackTemp = Number.isFinite(currentTemperature) ? currentTemperature : 72;
    const tempHigh = Math.round(Math.max(fallbackTemp, ...plottedTemps));
    const tempLow = Math.round(Math.min(fallbackTemp, ...plottedTemps));
    const tempAxisHigh = Math.ceil((tempHigh + 1) / 2) * 2;
    const tempAxisLow = Math.floor((tempLow - 1) / 2) * 2;
    const tempAxisMid = Math.round((tempAxisHigh + tempAxisLow) / 2);
    const tempRange = Math.max(1, tempAxisHigh - tempAxisLow);
    const chartWidth = 240;
    const chartHeight = 64;

    const bars = sourceHours.slice(0, 24).map((hour, index) => {
      const value = precipValues[index] || 0;
      const height = value > 0 ? Math.max(4, Math.round((value / precipMax) * chartHeight)) : this._isWetForecast(hour) ? 5 : 2;
      const date = new Date(hour.datetime || Date.now() + index * 60 * 60 * 1000);
      const temp = Number(hour.temperature);
      const precipitation = Number(hour.precipitation || 0);
      const probability = Number(hour.precipitation_probability);
      const detail = hasProbability && Number.isFinite(probability) ? `${Math.round(probability)}%` : this._formatPrecip(precipitation, precipUnit, true);
      const title = `${this._hourLabel(date)}${Number.isFinite(temp) ? `, ${Math.round(temp)}F` : ""}, ${detail}`;
      return { height, wet: this._isWetForecast(hour), title };
    });

    const points = sourceHours.slice(0, 24).map((hour, index) => {
      const temperature = Number(hour.temperature);
      const safeTemperature = Number.isFinite(temperature) ? temperature : fallbackTemp;
      const x = sourceHours.length <= 1 ? 0 : (index / (Math.min(sourceHours.length, 24) - 1)) * chartWidth;
      const y = chartHeight - ((safeTemperature - tempAxisLow) / tempRange) * chartHeight;
      return `${x.toFixed(1)},${Math.max(0, Math.min(chartHeight, y)).toFixed(1)}`;
    }).join(" ");

    return {
      bars,
      points,
      tempHigh,
      tempLow,
      tempScale: [`${tempAxisHigh} F`, `${tempAxisMid} F`, `${tempAxisLow} F`],
      precipScale: [
        this._formatPrecip(precipMax, precipUnit, true),
        this._formatPrecip(precipMax / 2, precipUnit, true),
        this._formatPrecip(0, precipUnit, true)
      ]
    };
  }

  _forecastAxis(hours) {
    const start = new Date();
    return [0, 6, 12, 18, 24].map((offset, index) => index === 0 ? "Now" : this._hourLabel(new Date(start.getTime() + offset * 60 * 60 * 1000)));
  }

  _weatherModel() {
    const weather = this._state(this._config.entities.weather);
    const attributes = weather?.attributes || {};
    const temperature = Number(attributes.temperature ?? attributes.native_temperature ?? attributes.apparent_temperature ?? 72);
    const wind = Number(attributes.wind_speed ?? 6);
    const apparent = Number(attributes.apparent_temperature);
    const condition = this._weatherConditionLabel(weather?.state || "partlycloudy");
    const hours = this._forecastHours();
    const chart = this._forecastChart(hours, Number.isFinite(temperature) ? temperature : 72, attributes.precipitation_unit);
    const meta = [];
    meta.push(`Feels like ${Math.round(Number.isFinite(apparent) ? apparent : temperature)}°`);
    if (Number.isFinite(wind)) meta.push(`Wind ${Math.round(wind)} mph`);
    return {
      temperature: Number.isFinite(temperature) ? Math.round(temperature) : 72,
      meta,
      condition,
      sentence: this._weatherSentence(condition, hours),
      chart,
      axis: this._forecastAxis(hours)
    };
  }

  _mediaModel() {
    const media = this._state(this._config.entities.mediaPlayer);
    const state = media?.state || "unknown";
    const title = media?.attributes?.media_title || media?.attributes?.media_artist || "Morning playlist";
    const label = state === "playing" ? `Playing - ${title}` : state === "paused" ? `Paused - ${title}` : this._titleCase(state);
    const volume = Number(media?.attributes?.volume_level);
    const volumeLabel = Number.isFinite(volume) ? `${Math.round(volume * 100)}%` : "Vol";
    const muted = Boolean(media?.attributes?.is_volume_muted);
    return { state, label, volumeLabel, muted };
  }

  _levelBars(level) {
    return [8, 14, 20, 26].slice(0, level);
  }

  _lightingModes() {
    return [
      { key: "bright", label: "Bright", script: "bright", livingScene: "scene.living_room_bright", level: 4 },
      { key: "daytime", label: "Daytime", script: "daytime", livingScene: "scene.living_room_normal", level: 3 },
      { key: "evening", label: "Evening", script: "evening", livingScene: "scene.pantry_smart_bridge_living_room_evening", level: 2 },
      { key: "mood", label: "Mood", script: "mood", livingScene: "scene.living_room_mood", level: 1 },
      { key: "off", label: "Off", script: "off", livingScene: "scene.living_room_off", level: 0, off: true }
    ];
  }

  _lightingAreas() {
    const kitchen = {
      key: "kitchen", label: "Kitchen", members: ["light.front_foyer_main_lights", "light.kitchen_island_lights", "light.kitchen_island_toe_kick", "light.kitchen_main_lights", "light.kitchen_perimeter_toe_kick", "light.kitchen_under_cabinet", "light.hood_light_light_0"],
      presets: [
        { key: "off", label: "Off", entity: "script.kitchen_off", level: 0, expected: { "light.front_foyer_main_lights": "off", "light.kitchen_island_lights": "off", "light.kitchen_island_toe_kick": "off", "light.kitchen_main_lights": "off", "light.kitchen_perimeter_toe_kick": "off", "light.kitchen_under_cabinet": "off", "light.hood_light_light_0": "off" } },
        { key: "mood", label: "Mood", entity: "script.kitchen_mood", level: 1, expected: { "light.front_foyer_main_lights": "off", "light.kitchen_island_lights": "off", "light.kitchen_island_toe_kick": 38, "light.kitchen_main_lights": "off", "light.kitchen_perimeter_toe_kick": 38, "light.kitchen_under_cabinet": "off", "light.hood_light_light_0": "off" } },
        { key: "evening", label: "Evening", entity: "script.kitchen_evening", level: 2, expected: { "light.front_foyer_main_lights": 12, "light.kitchen_island_lights": 66, "light.kitchen_island_toe_kick": 153, "light.kitchen_main_lights": 25, "light.kitchen_perimeter_toe_kick": 153, "light.kitchen_under_cabinet": 61, "light.hood_light_light_0": 26 } },
        { key: "daytime", label: "Day", entity: "script.kitchen_normal", level: 3, expected: { "light.front_foyer_main_lights": 191, "light.kitchen_island_lights": 191, "light.kitchen_island_toe_kick": 165, "light.kitchen_main_lights": 127, "light.kitchen_perimeter_toe_kick": 165, "light.kitchen_under_cabinet": 102, "light.hood_light_light_0": 51 } },
        { key: "bright", label: "Bright", entity: "script.kitchen_bright", level: 4, expected: { "light.front_foyer_main_lights": 255, "light.kitchen_island_lights": 255, "light.kitchen_island_toe_kick": 255, "light.kitchen_main_lights": 255, "light.kitchen_perimeter_toe_kick": 255, "light.kitchen_under_cabinet": 255, "light.hood_light_light_0": 255 } }
      ]
    };
    const dining = {
      key: "dining", label: "Dining", members: ["light.dining_room_beer_shelf", "light.dining_room_main_lights", "light.dining_room_pendant", "light.dining_room_piano_lamp", "light.living_room_stage_perimeter"],
      presets: [
        { key: "off", label: "Off", entity: "scene.dining_off", level: 0, expected: { "light.dining_room_beer_shelf": "off", "light.dining_room_main_lights": "off", "light.dining_room_pendant": "off", "light.dining_room_piano_lamp": "off", "light.living_room_stage_perimeter": "off" } },
        { key: "mood", label: "Mood", entity: "scene.dining_mood", level: 1, expected: { "light.dining_room_beer_shelf": 30, "light.dining_room_main_lights": "off", "light.dining_room_pendant": 12, "light.dining_room_piano_lamp": 43, "light.living_room_stage_perimeter": 114 } },
        { key: "evening", label: "Evening", entity: "scene.pantry_smart_bridge_dining_evening", level: 2, expected: { "light.dining_room_beer_shelf": 153, "light.dining_room_main_lights": "off", "light.dining_room_pendant": 71, "light.dining_room_piano_lamp": 165, "light.living_room_stage_perimeter": 186 } },
        { key: "daytime", label: "Day", entity: "scene.dining_normal", level: 3, expected: { "light.dining_room_beer_shelf": 119, "light.dining_room_main_lights": 25, "light.dining_room_pendant": 127, "light.dining_room_piano_lamp": 114, "light.living_room_stage_perimeter": 255 } },
        { key: "bright", label: "Bright", entity: "scene.dining_bright", level: 4, expected: { "light.dining_room_beer_shelf": 255, "light.dining_room_main_lights": 255, "light.dining_room_pendant": 255, "light.dining_room_piano_lamp": 255, "light.living_room_stage_perimeter": 255 } }
      ]
    };
    const living = {
      key: "living", label: "Living", members: ["light.living_room_allisons_desk_lamp", "light.living_room_book_shelf", "light.living_room_floor_lamp", "light.living_room_holiday_lights", "light.living_room_main_lights", "light.living_room_painting", "light.living_room_stage_perimeter", "light.living_room_stage_spot_lights", "light.living_room_walkway"],
      presets: [
        { key: "off", label: "Off", entity: "scene.living_room_off", level: 0, expected: { "light.living_room_allisons_desk_lamp": "off", "light.living_room_book_shelf": "off", "light.living_room_floor_lamp": "off", "light.living_room_holiday_lights": "off", "light.living_room_main_lights": "off", "light.living_room_painting": "off", "light.living_room_stage_perimeter": "off", "light.living_room_stage_spot_lights": "off", "light.living_room_walkway": "off" } },
        { key: "mood", label: "Mood", entity: "scene.living_room_mood", level: 1, expected: { "light.living_room_allisons_desk_lamp": 51, "light.living_room_book_shelf": 25, "light.living_room_floor_lamp": 51, "light.living_room_holiday_lights": 117, "light.living_room_main_lights": "off", "light.living_room_painting": "off", "light.living_room_stage_perimeter": 114, "light.living_room_walkway": "off" } },
        { key: "evening", label: "Evening", entity: "scene.pantry_smart_bridge_living_room_evening", level: 2, expected: { "light.living_room_allisons_desk_lamp": 127, "light.living_room_book_shelf": 102, "light.living_room_floor_lamp": 178, "light.living_room_holiday_lights": 173, "light.living_room_main_lights": "off", "light.living_room_painting": 76, "light.living_room_stage_perimeter": 186, "light.living_room_walkway": "off" } },
        { key: "daytime", label: "Day", entity: "scene.living_room_normal", level: 3, expected: { "light.living_room_allisons_desk_lamp": 183, "light.living_room_book_shelf": 114, "light.living_room_floor_lamp": 204, "light.living_room_holiday_lights": 255, "light.living_room_main_lights": 38, "light.living_room_painting": 153, "light.living_room_stage_perimeter": 186, "light.living_room_walkway": 20 } },
        { key: "bright", label: "Bright", entity: "scene.living_room_bright", level: 4, expected: { "light.living_room_allisons_desk_lamp": 255, "light.living_room_book_shelf": 255, "light.living_room_floor_lamp": 255, "light.living_room_holiday_lights": 255, "light.living_room_main_lights": 255, "light.living_room_painting": 255, "light.living_room_stage_perimeter": 255, "light.living_room_walkway": 255 } }
      ]
    };
    const stage = {
      key: "stage", label: "Stage", independent: true, members: ["light.dining_room_piano_lamp", "light.living_room_holiday_lights", "light.living_room_stage_perimeter", "light.living_room_stage_spot_lights"],
      presets: [
        { key: "off", label: "Off", entity: "scene.stage_off", level: 0, dmxPreset: "Off", dmxBrightness: 0, expected: { "light.dining_room_piano_lamp": "off", "light.living_room_holiday_lights": "off", "light.living_room_stage_perimeter": "off", "light.living_room_stage_spot_lights": "off" } },
        { key: "mood", label: "Mood", entity: "scene.stage_mood", level: 1, dmxPreset: "Velvet Purple", dmxBrightness: 45, expected: { "light.dining_room_piano_lamp": 43, "light.living_room_holiday_lights": 117, "light.living_room_stage_perimeter": 114, "light.living_room_stage_spot_lights": "off" } },
        { key: "evening", label: "Evening", entity: "scene.pantry_smart_bridge_stage_evening", level: 2, dmxPreset: "Jazz Gold", dmxBrightness: 67, expected: { "light.dining_room_piano_lamp": 165, "light.living_room_holiday_lights": 173, "light.living_room_stage_perimeter": 186, "light.living_room_stage_spot_lights": "off" } },
        { key: "daytime", label: "Day", entity: "scene.stage_normal", level: 3, dmxPreset: "Off", dmxBrightness: 0, expected: { "light.dining_room_piano_lamp": 127, "light.living_room_holiday_lights": 255, "light.living_room_stage_perimeter": 255, "light.living_room_stage_spot_lights": 122 } },
        { key: "bright", label: "Bright", entity: "scene.stage_bright", level: 4, dmxPreset: "Off", dmxBrightness: 0, expected: { "light.dining_room_piano_lamp": 255, "light.living_room_holiday_lights": 255, "light.living_room_stage_perimeter": 255, "light.living_room_stage_spot_lights": 255 } }
      ]
    };
    return [kitchen, dining, living, stage];
  }

  _matchesLightingPreset(preset) {
    const lightsMatch = Object.entries(preset.expected || {}).every(([entityId, expected]) => {
      const state = this._state(entityId);
      if (!state) return false;
      if (expected === "off") return state.state === "off";
      return state.state === "on" && Math.abs(Number(state.attributes?.brightness) - expected) <= 1;
    });
    const statesMatch = Object.entries(preset.expectedStates || {}).every(([entityId, expected]) => this._state(entityId)?.state === expected);
    if (!lightsMatch || !statesMatch || !preset.dmxPreset) return lightsMatch && statesMatch;
    return [1, 2].every((fixture) => this._state(`input_select.stage_uplight_${fixture}_preset`)?.state === preset.dmxPreset
      && Math.abs(Number(this._state(`input_number.stage_uplight_${fixture}_brightness`)?.state) - preset.dmxBrightness) <= 0.5);
  }

  _lightingPresetActive(area, preset) {
    if (area.key === "whole-house") return this._matchesLightingPreset(preset);
    if (area.key === "kitchen") return this._matchesLightingPreset(preset);
    if (area.key === "living" && this._state(this._config.entities.includeLiving)?.state !== "on") return this._matchesLightingPreset(preset);
    const globalIntensity = this._currentIntensityKey();
    if (!area.independent && globalIntensity !== "custom") return globalIntensity === preset.key;
    return this._matchesLightingPreset(preset);
  }

  _intensities() {
    return this._lightingModes().filter((intensity) => !intensity.off);
  }

  _normalizeIntensityKey(value) {
    const normalized = String(value || "Custom").toLowerCase().replace(/\s+/g, "-");
    if (normalized === "everyday" || normalized === "normal") return "daytime";
    if (normalized === "none" || normalized === "unmatched") return "custom";
    return normalized;
  }

  _onIntensityKey() {
    return this._normalizeIntensityKey(this._state(this._config.entities.lightingPeriod)?.state) === "evening" ? "evening" : "daytime";
  }

  _modeForKey(key) {
    const normalized = this._normalizeIntensityKey(key);
    return this._lightingModes().find((intensity) => intensity.key === normalized) || null;
  }

  _scriptId(scriptKey) {
    return this._config.scripts[scriptKey] || (scriptKey === "daytime" ? this._config.scripts.everyday : undefined);
  }

  _currentIntensityKey() {
    if (this._optimisticIntensity) return this._normalizeIntensityKey(this._optimisticIntensity);
    const state = this._state(this._config.entities.lightingIntensity)?.state || "Custom";
    const normalized = this._normalizeIntensityKey(state);
    return this._lightingModes().some((intensity) => intensity.key === normalized) ? normalized : "custom";
  }

  _currentIntensity() {
    return this._modeForKey(this._currentIntensityKey()) || { key: "custom", label: "Custom", level: 0, custom: true };
  }

  _includeLiving() {
    return this._state(this._config.entities.includeLiving)?.state === "on";
  }

  _press(key) {
    this._pressedKey = key;
    if (this._pressedTimer) window.clearTimeout(this._pressedTimer);
    this._pressedTimer = window.setTimeout(() => {
      this._pressedKey = null;
      this._render();
    }, 180);
    this._render();
  }

  _setOptimisticIntensity(key) {
    this._optimisticIntensity = key;
    if (this._optimisticTimer) window.clearTimeout(this._optimisticTimer);
    this._optimisticTimer = window.setTimeout(() => {
      this._optimisticIntensity = null;
      this._render();
    }, 2500);
  }

  _syncLivingToIntensity() {
    // Re-run the whole intensity script, not just the living scene: the script also owns
    // stage spotlights, holiday lights, and DMX uplights via script.open_area_stage_extras.
    const intensity = this._currentIntensity();
    const scriptId = intensity.script ? this._scriptId(intensity.script) : null;
    if (scriptId) {
      this._hass.callService("script", "turn_on", { entity_id: scriptId, variables: { include_living: this._includeLiving() } });
      return;
    }
    if (intensity.livingScene) this._hass.callService("scene", "turn_on", { entity_id: intensity.livingScene });
  }

  _handleLightPointerDown(event) {
    if (event.target.closest('input[data-action="set-light-brightness"]')) this._lightSliderActive = true;
  }

  _handleLightPointerUp(event) {
    if (!event.target.closest('input[data-action="set-light-brightness"]')) return;
    window.setTimeout(() => {
      if (!this._lightSliderActive) return;
      this._lightSliderActive = false;
      this._render();
    }, 0);
  }

  _handleLightPointerCancel(event) {
    if (!event.target.closest('input[data-action="set-light-brightness"]')) return;
    this._lightSliderActive = false;
    this._render();
  }

  _handleLightInput(event) {
    const slider = event.target.closest('input[data-action="set-light-brightness"]');
    if (!slider) return;
    const output = slider.closest(".individual-light")?.querySelector(".individual-light-value");
    if (output) output.textContent = Number(slider.value) === 0 ? "Off" : `${slider.value}%`;
    slider.style.setProperty("--light-level", `${slider.value}%`);
  }

  _handleLightChange(event) {
    const slider = event.target.closest('input[data-action="set-light-brightness"]');
    if (!slider || !this._hass) return;
    this._lightSliderActive = false;
    const entityId = slider.dataset.entity;
    const brightness = Number(slider.value);
    if (!entityId?.startsWith("light.") || !Number.isFinite(brightness)) return;
    const previous = this._optimisticLightBrightness.get(entityId);
    if (previous) window.clearTimeout(previous.timer);
    const timer = window.setTimeout(() => {
      this._optimisticLightBrightness.delete(entityId);
      this._render();
    }, 3000);
    this._optimisticLightBrightness.set(entityId, { brightness, timer });
    this._press(`light-${entityId}`);
    this._hass.callService("light", brightness === 0 ? "turn_off" : "turn_on", brightness === 0
      ? { entity_id: entityId }
      : { entity_id: entityId, brightness_pct: brightness });
  }

  _handleClick(event) {
    if (event.target.classList?.contains("modal-backdrop")) {
      this._lightingModalOpen = false;
      this._transitModal = null;
      this._personModal = null;
      this._render();
      return;
    }

    const target = event.target.closest("[data-action]");
    if (!target || !this._hass) return;

    const action = target.dataset.action;
    if (action === "open-person") {
      this._personModal = target.dataset.entity;
      this._render();
      return;
    }

    if (action === "close-person") {
      this._personModal = null;
      this._render();
      return;
    }

    if (action === "open-person-more-info") {
      const entityId = target.dataset.entity;
      this._personModal = null;
      this.dispatchEvent(new CustomEvent("hass-more-info", {
        bubbles: true,
        composed: true,
        detail: { entityId }
      }));
      return;
    }

    if (action === "toggle-living") {
      this._press("living");
      const entityId = this._config.entities.includeLiving;
      const isOn = this._state(entityId)?.state === "on";
      const toggled = this._hass.callService("input_boolean", isOn ? "turn_off" : "turn_on", { entity_id: entityId });
      // Wait for the helper to land: the intensity script branches on it.
      if (!isOn) Promise.resolve(toggled).then(() => this._syncLivingToIntensity());
      return;
    }

    if (action === "script") {
      const scriptId = this._scriptId(target.dataset.script);
      const intensity = this._normalizeIntensityKey(target.dataset.intensity);
      this._press(`intensity-${intensity}`);
      this._setOptimisticIntensity(intensity);
      if (scriptId) this._hass.callService("script", "turn_on", { entity_id: scriptId, variables: { include_living: this._includeLiving() } });
      return;
    }

    if (action === "smart-on") {
      const intensity = this._onIntensityKey();
      const scriptId = this._scriptId("on") || this._scriptId(intensity);
      this._press("power-on");
      this._setOptimisticIntensity(intensity);
      if (scriptId) this._hass.callService("script", "turn_on", { entity_id: scriptId, variables: { include_living: this._includeLiving() } });
      return;
    }

    if (action === "open-lighting-modal") {
      this._press("details");
      this._lightingModalOpen = true;
      this._render();
      return;
    }

    if (action === "close-lighting-modal") {
      this._lightingModalOpen = false;
      this._render();
      return;
    }

    if (action === "lighting-preset") {
      const entityId = target.dataset.entity;
      const domain = entityId?.split(".")[0];
      if (!entityId || !["scene", "script"].includes(domain)) return;
      this._press(`lighting-${entityId}`);
      this._hass.callService(domain, "turn_on", { entity_id: entityId });
      if (target.dataset.dmxPreset) {
        Promise.resolve(this._hass.callService("input_number", "set_value", { entity_id: "input_number.stage_uplights_fade", value: 1.5 })).then(() => Promise.all([
          this._hass.callService("input_select", "select_option", { entity_id: "input_select.stage_uplights_preset", option: target.dataset.dmxPreset }),
          this._hass.callService("input_number", "set_value", { entity_id: "input_number.stage_uplights_brightness", value: Number(target.dataset.dmxBrightness) })
        ]));
      }
      return;
    }

    if (action === "toggle-lighting-area") {
      const areaKey = target.dataset.area;
      this._expandedLightingAreas.has(areaKey) ? this._expandedLightingAreas.delete(areaKey) : this._expandedLightingAreas.add(areaKey);
      this._render();
      return;
    }

    if (action === "toggle-light") {
      const entityId = target.dataset.entity;
      if (!entityId?.startsWith("light.")) return;
      this._press(`light-${entityId}`);
      this._hass.callService("light", "toggle", { entity_id: entityId });
      return;
    }

    if (action === "set-transit-direction") {
      const option = target.dataset.direction;
      const entityId = this._config.entities.transitDirection;
      this._press(`transit-${option}`);
      if (option && entityId) this._hass.callService("input_select", "select_option", { entity_id: entityId, option });
      return;
    }

    if (action === "open-transit-route") {
      this._transitModal = { routeId: target.dataset.route };
      this._render();
      return;
    }

    if (action === "open-transit-alerts") {
      this._transitModal = { focus: "alerts" };
      this._render();
      return;
    }

    if (action === "sonos-play") {
      this._press("sonos-play");
      this._hass.callService("media_player", "media_play", { entity_id: this._config.entities.mediaPlayer });
      return;
    }

    if (action === "sonos-volume-down") {
      this._press("sonos-volume-down");
      this._hass.callService("media_player", "volume_down", { entity_id: this._config.entities.mediaPlayer });
      return;
    }

    if (action === "sonos-volume-up") {
      this._press("sonos-volume-up");
      this._hass.callService("media_player", "volume_up", { entity_id: this._config.entities.mediaPlayer });
      return;
    }

    if (action === "sonos-mute") {
      const entityId = this._config.entities.mediaPlayer;
      this._press("sonos-mute");
      this._hass.callService("media_player", "volume_mute", { entity_id: entityId, is_volume_muted: !this._mediaModel().muted });
      return;
    }

    if (action === "sonos-off") {
      this._press("sonos-off");
      this._hass.callService("media_player", "turn_off", { entity_id: this._config.entities.mediaPlayer });
      return;
    }

    if (action === "toggle-mode") {
      const mode = target.dataset.mode;
      const entityId = this._config.entities[`${mode}Mode`];
      if (!entityId?.startsWith("input_boolean.")) return;
      this._press(`mode-${mode}`);
      this._hass.callService("input_boolean", "toggle", { entity_id: entityId });
    }
  }

  _renderIntensityButton(intensity) {
    const active = this._currentIntensityKey() === intensity.key;
    const pressed = this._pressedKey === `intensity-${intensity.key}`;
    return `
      <button class="scene-button intensity ${active ? "active" : ""} ${pressed ? "is-pressed" : ""}" data-action="script" data-script="${intensity.script}" data-intensity="${intensity.key}" aria-pressed="${active}">
        <strong>${intensity.label}</strong>
        <span class="scene-level">${this._levelBars(intensity.level).map((height) => `<i style="height: ${height}px;"></i>`).join("")}</span>
      </button>
    `;
  }

  _renderBulbIcon(off = false) {
    return `
      <span class="power-icon ${off ? "off" : ""}" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M8 14c-1.4-1.2-2-2.7-2-4.5A6 6 0 0 1 18 9.5c0 1.8-.7 3.3-2 4.5-.8.7-1 1.4-1 2H9c0-.6-.2-1.3-1-2Z"></path>${off ? `<path class="slash" d="M5 5l14 14"></path>` : ""}</svg>
      </span>
    `;
  }

  _renderOnButton() {
    const targetIntensity = this._modeForKey(this._onIntensityKey());
    const active = this._currentIntensityKey() === targetIntensity.key;
    const pressed = this._pressedKey === "power-on";
    return `
      <button class="scene-button power on ${active ? "active" : ""} ${pressed ? "is-pressed" : ""}" data-action="smart-on" data-intensity="${targetIntensity.key}" aria-label="Turn lights on to ${targetIntensity.label}" aria-pressed="${active}">
        <span class="power-icon-cell">${this._renderBulbIcon(false)}</span>
        <span class="power-label"><strong>On</strong></span>
        <span class="power-meter"><span class="scene-level">${this._levelBars(targetIntensity.level).map((height) => `<i style="height: ${height}px;"></i>`).join("")}</span></span>
      </button>
    `;
  }

  _renderOffButton() {
    const intensity = this._modeForKey("off");
    const active = this._currentIntensityKey() === intensity.key;
    const pressed = this._pressedKey === `intensity-${intensity.key}`;
    return `
      <button class="scene-button power off ${active ? "active" : ""} ${pressed ? "is-pressed" : ""}" data-action="script" data-script="${intensity.script}" data-intensity="${intensity.key}" aria-label="Turn lights off" aria-pressed="${active}">
        <span class="power-icon-cell">${this._renderBulbIcon(true)}</span>
        <span class="power-label"><strong>${intensity.label}</strong></span>
        <span class="power-meter" aria-hidden="true"></span>
      </button>
    `;
  }

  _renderLightingModal(includeLiving) {
    if (!this._lightingModalOpen) return "";
    const areas = this._lightingAreas();
    const wholeHouse = this._config.wholeHouseLighting || [];
    return `
      <div class="modal-backdrop" role="presentation">
        <section class="lightbox" role="dialog" aria-modal="true" aria-label="Light Controls">
          <div class="lighting-modal-body">
            ${wholeHouse.length ? `
              <section class="whole-house-controls" aria-label="Whole House lighting controls">
                <div class="whole-house-label">
                  <strong><span>Whole</span><span>House</span></strong>
                </div>
                <div class="whole-house-actions">
                  ${wholeHouse.map((preset) => this._renderLightingPreset({ key: "whole-house", label: "Whole House" }, preset)).join("")}
                </div>
              </section>
            ` : ""}
            <div class="area-controls" aria-label="Open Area light scenes">
              ${areas.map((area) => {
                const expanded = this._expandedLightingAreas.has(area.key);
                return `
                <section class="area-control-row ${expanded ? "expanded" : ""}" aria-labelledby="lighting-area-${this._escapeHtml(area.key)}">
                  <div class="area-control-name" id="lighting-area-${this._escapeHtml(area.key)}">
                    <strong>${this._escapeHtml(area.label)}</strong>
                  </div>
                  <div class="area-preset-grid">
                    ${area.presets.map((preset) => this._renderLightingPreset(area, preset)).join("")}
                  </div>
                  <button class="area-expand" data-action="toggle-lighting-area" data-area="${this._escapeHtml(area.key)}" aria-label="${expanded ? "Hide" : "Show"} ${this._escapeHtml(area.label)} lights" aria-expanded="${expanded}">›</button>
                  ${expanded ? `<div class="area-light-list">${area.members
                    .map((entityId) => ({ entityId, name: this._areaRelativeLightName(entityId, area.label) }))
                    .sort((left, right) => left.name.localeCompare(right.name))
                    .map(({ entityId, name }) => this._renderIndividualLight(entityId, name))
                    .join("")}</div>` : ""}
                </section>
              `; }).join("")}
            </div>
          </div>
        </section>
      </div>
    `;
  }

  _renderLightingPreset(area, preset) {
    const entity = preset.entity;
    const unavailable = !this._state(entity) || this._state(entity)?.state === "unavailable";
    const pressed = this._pressedKey === `lighting-${entity}`;
    const active = this._lightingPresetActive(area, preset);
    const description = `${area.label} ${preset.label}`;
    return `
      <button class="lighting-preset ${preset.level === 0 ? "off" : ""} ${preset.wide ? "wide" : ""} ${active ? "active" : ""} ${pressed ? "is-pressed" : ""}" data-action="lighting-preset" data-entity="${this._escapeHtml(entity)}" data-dmx-preset="${this._escapeHtml(preset.dmxPreset || "")}" data-dmx-brightness="${preset.dmxBrightness ?? ""}" aria-label="${this._escapeHtml(description)}" aria-pressed="${active}" ${unavailable ? "disabled" : ""}>
        ${preset.emoji ? `<span class="lighting-preset-emoji" aria-hidden="true">${this._escapeHtml(preset.emoji)}</span>` : preset.level === 0 ? this._renderBulbIcon(true) : `<span class="scene-level">${this._levelBars(preset.level).map((height) => `<i style="height: ${height}px;"></i>`).join("")}</span>`}
        <strong>${this._escapeHtml(preset.label)}</strong>
      </button>
    `;
  }

  _areaRelativeLightName(entityId, areaLabel) {
    const name = this._friendly(entityId);
    const areaNames = areaLabel === "Living"
      ? ["Living Room", "Living"]
      : areaLabel === "Dining"
        ? ["Dining Room", "Living Room", "Dining", "Room"]
        : [areaLabel];
    const prefix = areaNames
      .map((areaName) => `${areaName} `)
      .find((candidate) => name.toLocaleLowerCase().startsWith(candidate.toLocaleLowerCase()));
    return prefix ? name.slice(prefix.length) : name;
  }

  _renderIndividualLight(entityId, name = this._friendly(entityId)) {
    const state = this._state(entityId);
    const optimisticBrightness = this._optimisticLightBrightness.get(entityId)?.brightness;
    const on = optimisticBrightness !== undefined ? optimisticBrightness > 0 : state?.state === "on";
    const supportsBrightness = state?.attributes?.supported_color_modes?.some((mode) => mode !== "onoff");
    const brightness = optimisticBrightness !== undefined
      ? optimisticBrightness
      : on && Number.isFinite(Number(state?.attributes?.brightness))
        ? Math.round(Number(state.attributes.brightness) / 2.55)
        : 0;
    return `
      <div class="individual-light ${on ? "on" : ""} ${this._pressedKey === `light-${entityId}` ? "is-pressed" : ""}">
        <button class="individual-light-power" data-action="toggle-light" data-entity="${this._escapeHtml(entityId)}" aria-label="Turn ${this._escapeHtml(name)} ${on ? "off" : "on"}" aria-pressed="${on}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 22h4M8 14c-1.4-1.2-2-2.7-2-4.5A6 6 0 0 1 18 9.5c0 1.8-.7 3.3-2 4.5-.8.7-1 1.4-1 2H9c0-.6-.2-1.3-1-2Z"></path></svg>
        </button>
        <span class="individual-light-name">${this._escapeHtml(name)}</span>
        <output class="individual-light-value">${on ? `${brightness}%` : "Off"}</output>
        ${supportsBrightness ? `<input class="individual-light-slider" type="range" min="0" max="100" step="1" value="${brightness}" style="--light-level: ${brightness}%" data-action="set-light-brightness" data-entity="${this._escapeHtml(entityId)}" aria-label="${this._escapeHtml(name)} brightness">` : ""}
      </div>
    `;
  }

  _renderPeople() {
    const richard = this._config.entities.richard;
    const allison = this._config.entities.allison;
    return [richard, allison].map((entityId) => {
      const person = this._personModel(entityId);
      return `
        <button class="person-status ${person.kind}" data-action="open-person" data-entity="${this._escapeHtml(person.entityId)}" aria-label="${this._escapeHtml(`${person.name}: ${person.label}. Open details`)}">
          <span class="person-icon status-token">${person.picture ? `<img src="${this._escapeHtml(person.picture)}" alt="">` : this._escapeHtml(person.initial)}</span>
          <strong class="person-label">${this._escapeHtml(person.label)}</strong>
        </button>
      `;
    }).join("");
  }

  _renderPersonModal() {
    if (!this._personModal) return "";
    const person = this._personModel(this._personModal);
    const details = [[person.sourceType === "router" ? "Presence since" : "Last signal", this._relativeAge(person.updatedAt)]];
    if (person.sourceType === "router") {
      details.push(["Connection", person.connection], ["LAN IP", person.ipAddress || "Not connected"]);
    } else {
      details.push(
        ["Location accuracy", person.accuracy === null ? "Unavailable" : `±${person.accuracy} m`],
        ["Network", person.network || "Unavailable"]
      );
    }
    details.push(["Source", person.tracker || "Unavailable"]);
    return `
      <div class="modal-backdrop" role="presentation">
        <section class="lightbox person-lightbox" role="dialog" aria-modal="true" aria-label="${this._escapeHtml(`${person.name} presence details`)}">
          <header class="person-detail-head">
            <span class="person-detail-photo">${person.picture ? `<img src="${this._escapeHtml(person.picture)}" alt="">` : this._escapeHtml(person.initial)}</span>
            <div><h2>${this._escapeHtml(person.name)}</h2><p>${this._escapeHtml(person.label)}</p></div>
            <button class="lightbox-close" data-action="close-person" aria-label="Close">×</button>
          </header>
          <dl class="person-detail-list">
            ${details.map(([label, value]) => `<div><dt>${this._escapeHtml(label)}</dt><dd>${this._escapeHtml(value)}</dd></div>`).join("")}
          </dl>
          <button class="control-chip person-more-info" data-action="open-person-more-info" data-entity="${this._escapeHtml(person.entityId)}">Open history</button>
        </section>
      </div>
    `;
  }

  _transitDirections() {
    return [
      { option: TRANSIT_UPTOWN, label: "Uptown" },
      { option: TRANSIT_DOWNTOWN, label: "Downtown" }
    ];
  }

  _currentTransitDirection() {
    const state = this._state(this._config.entities.transitDirection)?.state;
    const directions = this._transitDirections();
    return directions.some((direction) => direction.option === state) ? state : directions[0].option;
  }

  _escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  _transitConfig() {
    const transit = this._config.transit;
    if (Array.isArray(transit)) return { ...DEFAULT_CONFIG.transit, routeGroups: transit };
    return {
      ...DEFAULT_CONFIG.transit,
      ...(transit || {}),
      routeGroups: transit?.routeGroups || DEFAULT_CONFIG.transit.routeGroups
    };
  }

  _transitGroups() {
    return (this._transitConfig().routeGroups || []).filter((group) => group.enabled !== false);
  }

  _validTransitValue(value) {
    const state = String(value ?? "").trim();
    return state && !["unknown", "unavailable", "none", "null"].includes(state.toLowerCase());
  }

  _stateUpdatedAt(state) {
    const stamp = state?.last_reported || state?.last_updated || state?.last_changed;
    const timestamp = Date.parse(stamp);
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  _transitArrivalModel(source, arrivalEntity, index, directionConfig, now, staleAfterMs) {
    const entity = this._state(arrivalEntity);
    const value = entity?.state;
    const destinationState = this._state(source.destination_entities?.[index]);
    const routeState = this._state(source.route_entities?.[index]);
    const updatedAt = this._stateUpdatedAt(entity);
    const arrivalTime = Date.parse(value);
    const missing = !entity || !this._validTransitValue(value);
    const stale = missing || (updatedAt !== null && now - updatedAt > staleAfterMs);
    const validTime = Number.isFinite(arrivalTime) && arrivalTime >= now - 60 * 1000;
    const valid = !stale && validTime;
    const trainMinutes = valid ? Math.max(0, Math.ceil((arrivalTime - now) / 60000)) : null;
    const walkMinutes = Number(source.walk_minutes ?? directionConfig.walk_minutes ?? 0);

    return {
      arrivalEntity,
      line: source.line,
      route: this._validTransitValue(routeState?.state) ? routeState.state : source.line,
      destination: this._validTransitValue(destinationState?.state) ? destinationState.state : "",
      station: source.station || directionConfig.station,
      walkMinutes,
      updatedAt,
      arrivalTime: validTime ? arrivalTime : null,
      trainMinutes,
      leaveMinutes: valid ? trainMinutes - walkMinutes : null,
      valid,
      stale,
      missing
    };
  }

  _transitDirectionModel(group, directionOption, now = Date.now()) {
    const directionConfig = group.directions?.[directionOption];
    if (!directionConfig || directionConfig.enabled === false) return null;

    const staleAfterMs = Number(this._transitConfig().staleAfterMinutes || 4) * 60 * 1000;
    const sources = (directionConfig.sources || []).map((source) => {
      const arrivals = (source.arrival_entities || []).map((arrivalEntity, index) => this._transitArrivalModel(source, arrivalEntity, index, directionConfig, now, staleAfterMs));
      return {
        ...source,
        station: source.station || directionConfig.station,
        walkMinutes: Number(source.walk_minutes ?? directionConfig.walk_minutes ?? 0),
        arrivals
      };
    });
    const arrivals = sources.flatMap((source) => source.arrivals);
    const validArrivals = arrivals.filter((arrival) => arrival.valid).sort((a, b) => a.arrivalTime - b.arrivalTime);
    const catchableArrivals = validArrivals
      .filter((arrival) => Number.isFinite(arrival.leaveMinutes) && arrival.leaveMinutes > 0)
      .sort((a, b) => a.leaveMinutes - b.leaveMinutes || a.arrivalTime - b.arrivalTime);
    const nextArrival = validArrivals[0] || null;
    const leaveArrival = catchableArrivals[0] || null;
    const configured = sources.some((source) => source.arrivals.length);
    const lastUpdatedAt = Math.max(0, ...arrivals.map((arrival) => arrival.updatedAt || 0));

    return {
      groupId: group.id,
      label: group.label,
      lines: group.lines || [],
      directionOption,
      direction: directionConfig.direction,
      station: directionConfig.station,
      walkMinutes: Number(directionConfig.walk_minutes ?? leaveArrival?.walkMinutes ?? nextArrival?.walkMinutes ?? 0),
      sources,
      arrivals,
      nextArrival,
      leaveArrival,
      leaveMinutes: leaveArrival?.leaveMinutes ?? null,
      countdownMinutes: nextArrival?.trainMinutes ?? null,
      lastUpdatedAt,
      status: nextArrival ? "live" : configured ? "offline" : "not-configured",
      alert_entities: [...(group.alert_entities || []), ...(directionConfig.alert_entities || [])]
    };
  }

  _transitRows() {
    const currentDirection = this._currentTransitDirection();
    return this._transitGroups()
      .map((group) => this._transitDirectionModel(group, currentDirection))
      .filter(Boolean);
  }

  _activeTransitAlerts(groups = this._transitGroups()) {
    const alertIds = new Set();
    groups.forEach((group) => {
      (group.alert_entities || []).forEach((entityId) => alertIds.add(entityId));
      Object.values(group.directions || {}).forEach((direction) => (direction.alert_entities || []).forEach((entityId) => alertIds.add(entityId)));
    });

    return [...alertIds].map((entityId) => {
      const state = this._state(entityId);
      return { entityId, state };
    }).filter(({ state }) => {
      const value = String(state?.state || "").toLowerCase();
      return state && !["off", "clear", "none", "ok", "unknown", "unavailable"].includes(value);
    });
  }

  _formatTransitUpdated(updatedAt) {
    if (!updatedAt) return "No update";
    const minutes = Math.max(0, Math.round((Date.now() - updatedAt) / 60000));
    if (minutes < 1) return "Updated now";
    if (minutes === 1) return "Updated 1 min ago";
    return `Updated ${minutes} min ago`;
  }

  _lineClass(line) {
    return {
      "1": "red",
      "2": "red",
      "3": "red",
      "4": "green",
      "5": "green",
      A: "blue",
      C: "blue",
      E: "blue",
      R: "yellow",
      W: "yellow",
      J: "brown",
      Z: "brown",
      PATH: "path"
    }[String(line).toUpperCase()] || "";
  }

  _renderLineBadges(lines) {
    return lines.map((line) => this._renderLineBadge(line)).join("");
  }

  _renderLineBadge(line, extraClass = "") {
    const label = typeof line === "object" ? line.label : line;
    const className = typeof line === "object" ? line.className || this._lineClass(line.label) : this._lineClass(line);
    return `<span class="line ${this._escapeHtml(className)} ${this._escapeHtml(extraClass)}">${this._escapeHtml(label)}</span>`;
  }

  _renderTransitRow(row) {
    const hasArrival = Number.isFinite(row.countdownMinutes);
    const timeLabel = hasArrival ? row.countdownMinutes : "--";
    const unitLabel = hasArrival ? "min" : "offline";
    const ariaTime = hasArrival ? `next train in ${row.countdownMinutes} minutes` : "offline";
    return `
      <button class="route-card ${hasArrival ? "" : "stale"}" data-action="open-transit-route" data-route="${this._escapeHtml(row.groupId)}" aria-label="${this._escapeHtml(`${row.label} at ${row.station}, ${ariaTime}`)}">
        <div class="line-badges">${this._renderLineBadges(row.lines)}</div>
        <div class="route-main"><div class="route-place">${this._escapeHtml(row.station)}</div></div>
        <div class="route-time ${hasArrival ? "" : "offline"}">${timeLabel}<span>${unitLabel}</span></div>
      </button>
    `;
  }

  _renderTransitArrival(arrival, highlighted = false) {
    const valid = arrival.valid;
    const time = valid ? `${arrival.trainMinutes}` : "--";
    const detail = valid
      ? `${this._renderLineBadge(arrival.route, "arrival-line")}<span class="arrival-destination">to ${this._escapeHtml(arrival.destination || "destination pending")}</span>`
      : this._escapeHtml(arrival.stale ? "Data stale" : "Offline");
    const due = valid && arrival.arrivalTime ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(arrival.arrivalTime)) : "";
    return `
      <div class="arrival-row ${valid ? "" : "offline"} ${highlighted ? "catchable" : ""}">
        <span class="arrival-time"><strong>${time}</strong><span>${valid ? "min" : ""}</span></span>
        <span class="arrival-detail">${detail}</span>
        <span class="arrival-due">${this._escapeHtml(due)}</span>
      </div>
    `;
  }

  _renderTransitArrivalList(model) {
    const arrivals = [...(model.arrivals || [])]
      .filter((arrival) => arrival.valid)
      .sort((a, b) => a.trainMinutes - b.trainMinutes || String(a.route).localeCompare(String(b.route)));

    return `
      <div class="arrival-list combined-arrivals">
        ${arrivals.map((arrival) => this._renderTransitArrival(arrival, model.leaveArrival?.arrivalEntity === arrival.arrivalEntity)).join("")}
      </div>
    `;
  }

  _renderTransitDirectionDetail(model, active) {
    const hasLiveArrival = Number.isFinite(model.countdownMinutes);
    const hasLeaveArrival = Number.isFinite(model.leaveMinutes);
    const walkMinutes = Number.isFinite(model.leaveArrival?.walkMinutes) ? model.leaveArrival.walkMinutes : model.walkMinutes;
    const walkLabel = Number.isFinite(walkMinutes) ? ` (${walkMinutes} min walk)` : "";
    const leaveLabel = hasLeaveArrival ? `Leave in ${model.leaveMinutes} minute${model.leaveMinutes === 1 ? "" : "s"}${walkLabel}` : hasLiveArrival ? "No catchable train" : "offline";
    return `
      <section class="direction-detail ${active ? "selected" : ""} ${hasLiveArrival ? "" : "offline"}">
        <header class="direction-detail-head">
          <span>${this._escapeHtml(this._transitDirections().find((direction) => direction.option === model.directionOption)?.label || model.directionOption)}</span>
          <span>${this._escapeHtml(leaveLabel)}</span>
        </header>
        <div class="transit-sources">${this._renderTransitArrivalList(model)}</div>
        <footer class="transit-updated">${this._escapeHtml(this._formatTransitUpdated(model.lastUpdatedAt))}${hasLiveArrival ? "" : " / check source"}</footer>
      </section>
    `;
  }

  _renderTransitAlertFocus(alerts) {
    return `
      <div class="transit-detail-body alerts-only">
        <section class="direction-detail selected">
          <header class="direction-detail-head">
            <span>Advisories</span>
            <span>${alerts.length}</span>
          </header>
          <div class="arrival-list">
            ${alerts.map(({ entityId, state }) => `
              <div class="arrival-row alert-row">
                <span class="arrival-time"><strong>!</strong></span>
                <span class="arrival-detail">${this._escapeHtml(state?.attributes?.friendly_name || entityId)}</span>
                <span class="arrival-due">${this._escapeHtml(state?.state || "")}</span>
              </div>
            `).join("")}
          </div>
        </section>
      </div>
    `;
  }

  _renderTransitModal() {
    if (!this._transitModal) return "";
    const currentDirection = this._currentTransitDirection();
    const groups = this._transitGroups();
    const alerts = this._activeTransitAlerts(groups);
    if (this._transitModal.focus === "alerts" && alerts.length) {
      return `
        <div class="modal-backdrop" role="presentation">
          <section class="lightbox transit-lightbox" role="dialog" aria-modal="true" aria-label="Transit advisories">
            ${this._renderTransitAlertFocus(alerts)}
          </section>
        </div>
      `;
    }

    const group = groups.find((candidate) => candidate.id === this._transitModal.routeId) || groups[0];
    if (!group) return "";
    const directionOptions = [currentDirection, ...this._transitDirections().map((direction) => direction.option).filter((option) => option !== currentDirection)];
    const directionModels = directionOptions.map((option) => this._transitDirectionModel(group, option)).filter(Boolean);

    return `
      <div class="modal-backdrop" role="presentation">
        <section class="lightbox transit-lightbox" role="dialog" aria-modal="true" aria-label="Transit details">
          <div class="transit-detail-body">
            ${directionModels.map((model) => this._renderTransitDirectionDetail(model, model.directionOption === currentDirection)).join("")}
          </div>
        </section>
      </div>
    `;
  }

  _renderWeather() {
    const weather = this._weatherModel();
    return `
      <section class="panel no-drill weather-card" aria-label="Weather">
        <div class="weather-mark" aria-hidden="true">
          <svg viewBox="0 0 64 64">
            <circle cx="24" cy="22" r="10" fill="#f3b343" stroke="none"></circle>
            <path d="M19 43h27c7 0 11-4 11-10s-5-10-12-10c-3-8-16-9-20-1-8 0-14 5-14 12 0 6 3 9 8 9Z" fill="#edf7fa" stroke="#2e6074"></path>
            <path d="M25 49v5M36 49v5M47 49v5" stroke="#3c7fa1"></path>
          </svg>
        </div>
        <div>
          <div class="weather-now">
            <span class="temp">${weather.temperature}<span class="degree">°</span></span>
            ${weather.meta.length ? `<span class="weather-meta">${weather.meta.join("<br>")}</span>` : ""}
          </div>
          <div class="weather-copy">${weather.sentence}</div>
          <div class="forecast-strip">
            <div class="forecast-legend" aria-hidden="true">
              <span class="legend-temp">Temp<i class="legend-line"></i></span>
              <span class="legend-precip"><i class="legend-bar"></i>Precip</span>
            </div>
            <div class="forecast-graph" aria-label="Hourly temperature and precipitation forecast">
              <div class="chart-scale temp-scale">${weather.chart.tempScale.map((label) => `<span>${label}</span>`).join("")}</div>
              <div class="forecast-plot">
                <div class="forecast-hours">
                  ${weather.chart.bars.map((hour) => `<span class="forecast-hour ${hour.wet ? "wet" : "dry"}" style="height: ${hour.height}px;"></span>`).join("")}
                </div>
                <svg class="temp-line" viewBox="0 0 240 64" preserveAspectRatio="none" aria-hidden="true">
                  <polyline points="${weather.chart.points}"></polyline>
                </svg>
              </div>
              <div class="chart-scale precip-scale">${weather.chart.precipScale.map((label) => `<span>${label}</span>`).join("")}</div>
              <div class="forecast-axis" aria-hidden="true">
                ${weather.axis.map((label) => `<span>${label}</span>`).join("")}
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  _renderTransit() {
    const currentDirection = this._currentTransitDirection();
    const rows = this._transitRows();
    const alerts = this._activeTransitAlerts();
    const hasLiveRows = rows.some((row) => row.status === "live");
    return `
      <section class="panel no-drill transit-card" aria-label="${currentDirection} transit status">
        <div class="transit-head">
          <div class="direction-switch" role="group" aria-label="Transit direction">
            ${this._transitDirections().map((direction) => {
              const active = direction.option === currentDirection;
              const pressed = this._pressedKey === `transit-${direction.option}`;
              return `<button class="control-chip direction-option ${active ? "active" : ""} ${pressed ? "is-pressed" : ""}" data-action="set-transit-direction" data-direction="${direction.option}" aria-label="Show ${direction.option} transit" aria-pressed="${active}">${direction.label}</button>`;
            }).join("")}
          </div>
          ${alerts.length ? `<button class="control-chip tiny-alert" data-action="open-transit-alerts">${alerts.length} advisory${alerts.length === 1 ? "" : "ies"}</button>` : `<span class="transit-state"><span class="transit-pulse ${hasLiveRows ? "live" : "offline"}"></span>${hasLiveRows ? "Live" : "Offline"}</span>`}
        </div>
        <div class="route-list">
          ${rows.length ? rows.map((row) => this._renderTransitRow(row)).join("") : `<div class="route-empty">No configured ${this._escapeHtml(currentDirection)} routes</div>`}
        </div>
      </section>
    `;
  }

  _render() {
    if (this._lightSliderActive) return;
    if (!this.shadowRoot) return;
    const lightingScrollTop = this.shadowRoot.querySelector(".lighting-modal-body")?.scrollTop || 0;
    const includeLiving = this._state(this._config.entities.includeLiving)?.state === "on";
    const media = this._mediaModel();
    const intensities = [...this._intensities()].reverse();

    this.shadowRoot.innerHTML = `
      ${this._styles()}
      <main class="foyer-dashboard" aria-label="Foyer dashboard">
        <aside class="rail" aria-label="Status and transit">
          <section class="panel no-drill status-top" aria-label="Current time and people status">
            <div>
              <div class="time">${this._formatClock()}</div>
              <div class="date">${this._formatDate()}</div>
            </div>
            <div class="status-icons" aria-label="People status">${this._renderPeople()}</div>
          </section>

          ${this._renderWeather()}
          ${this._renderTransit()}
        </aside>

        <section class="controls" aria-label="Controls and detail surfaces">
          <section class="control-layout">
            <section class="panel lighting-panel" aria-label="Open Area lighting controls">
              <div class="lighting-shell">
                <div class="power-buttons">
                  <button class="control-chip scope-toggle ${includeLiving ? "on" : ""} ${this._pressedKey === "living" ? "is-pressed" : ""}" data-action="toggle-living" aria-pressed="${includeLiving}">
                    <span class="scope-plus">+</span>
                    <span class="scope-label"><span>Living</span><span>Room</span></span>
                  </button>
                  ${this._renderOffButton()}
                  ${this._renderOnButton()}
                </div>
                <div class="intensity-buttons">
                  <div class="intensity-row">${intensities.map((intensity) => this._renderIntensityButton(intensity)).join("")}</div>
                </div>
                <button class="details-button ${this._pressedKey === "details" ? "is-pressed" : ""}" data-action="open-lighting-modal" aria-label="Open light controls">›</button>
              </div>
            </section>

            <section class="panel no-drill dog-card" aria-label="Dog photo">
              <img src="${this._config.image}" alt="Dog photo used on the current Foyer dashboard" decoding="async">
            </section>

            <section class="panel no-drill mode-dock" aria-label="House mode shortcuts">
              <div class="mode-block">
                <div class="mode-icons" aria-label="House mode toggles">
                  <button class="control-chip mode-icon ${this._state(this._config.entities.guestMode)?.state === "on" ? "active" : ""} ${this._pressedKey === "mode-guest" ? "is-pressed" : ""}" data-action="toggle-mode" data-mode="guest" aria-label="Toggle Guest mode" aria-pressed="${this._state(this._config.entities.guestMode)?.state === "on"}"><ha-icon icon="mdi:account-plus-outline" aria-hidden="true"></ha-icon><span>Guest</span></button>
                  <button class="control-chip mode-icon ${this._state(this._config.entities.partyMode)?.state === "on" ? "active" : ""} ${this._pressedKey === "mode-party" ? "is-pressed" : ""}" data-action="toggle-mode" data-mode="party" aria-label="Toggle Party mode" aria-pressed="${this._state(this._config.entities.partyMode)?.state === "on"}"><ha-icon icon="mdi:party-popper" aria-hidden="true"></ha-icon><span>Party</span></button>
                  <button class="control-chip mode-icon ${this._state(this._config.entities.concertMode)?.state === "on" ? "active" : ""} ${this._pressedKey === "mode-concert" ? "is-pressed" : ""}" data-action="toggle-mode" data-mode="concert" aria-label="Toggle Concert mode" aria-pressed="${this._state(this._config.entities.concertMode)?.state === "on"}"><ha-icon icon="mdi:piano" aria-hidden="true"></ha-icon><span>Concert</span></button>
                </div>
              </div>
            </section>

            <section class="panel no-drill media-panel" aria-label="Living Room Sonos compact control">
              <strong>Sonos</strong>
              <span class="media-label">${media.label}</span>
              <div class="volume-controls" aria-label="Sonos volume controls">
                <button class="control-chip volume-button ${this._pressedKey === "sonos-volume-down" ? "is-pressed" : ""}" data-action="sonos-volume-down" aria-label="Volume down"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"></path><path d="M16 9a5 5 0 0 1 0 6"></path></svg></button>
                <button class="control-chip volume-button ${this._pressedKey === "sonos-volume-up" ? "is-pressed" : ""}" data-action="sonos-volume-up" aria-label="Volume up"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"></path><path d="M16 9a5 5 0 0 1 0 6"></path><path d="M19 6a9 9 0 0 1 0 12"></path></svg></button>
                <span class="volume-level ${media.muted ? "muted" : ""}">${media.muted ? "Mute" : media.volumeLabel}</span>
                <button class="control-chip volume-button ${media.muted ? "active" : ""} ${this._pressedKey === "sonos-mute" ? "is-pressed" : ""}" data-action="sonos-mute" aria-label="${media.muted ? "Unmute" : "Mute"}" aria-pressed="${media.muted}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"></path><path d="m16 9 5 5M21 9l-5 5"></path></svg></button>
              </div>
              <div class="media-actions">
                <button class="control-chip small-button ${this._pressedKey === "sonos-play" ? "is-pressed" : ""}" data-action="sonos-play">Play</button>
                <button class="control-chip small-button ${this._pressedKey === "sonos-off" ? "is-pressed" : ""}" data-action="sonos-off">Off</button>
              </div>
            </section>

            <div class="bottom-dock">
              <nav class="panel no-drill nav" aria-label="Dashboard tabs">
                <div class="nav-items">
                  <span class="control-chip nav-item active"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 12 4l9 7v9H5v-9"></path></svg>Home</span>
                  <span class="control-chip nav-item"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path></svg>Lists</span>
                  <span class="control-chip nav-item"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V6h16v14M9 20V9h6v11M4 12h5M15 12h5"></path></svg>Rooms</span>
                  <span class="control-chip nav-item"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.4 4.9L20 9l-4 3.9.9 5.6L12 15.9l-4.9 2.6.9-5.6L4 9l5.6-1.1L12 3Z"></path></svg>Show</span>
                  <span class="control-chip nav-item"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4"></path></svg>Mixer</span>
                  <span class="control-chip nav-item"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z"></path></svg>Energy</span>
                  <span class="control-chip nav-item"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7zM4 10h3M4 14h3M17 10h3M17 14h3M10 4v3M14 4v3M10 17v3M14 17v3"></path></svg>System</span>
                  <span class="control-chip nav-item"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6ZM9 4v14M15 6v14"></path></svg>Map</span>
                </div>
              </nav>
            </div>
          </section>
        </section>
      </main>
      ${this._renderLightingModal(includeLiving)}
      ${this._renderTransitModal()}
      ${this._renderPersonModal()}
    `;
    const lightingModalBody = this.shadowRoot.querySelector(".lighting-modal-body");
    if (lightingModalBody) lightingModalBody.scrollTop = lightingScrollTop;
  }

  _styles() {
    return `
      <style>
        :host {
          --stone-50: #f8f3eb;
          --stone-100: #eee5d7;
          --stone-250: #cbbba4;
          --ink-900: #141311;
          --ink-760: #302d28;
          --ink-600: #5b554b;
          --ink-450: #81786a;
          --brass-500: #b98135;
          --rain-500: #3c7fa1;
          --green-500: #2f7252;
          --red-500: #a24335;
          --panel: rgba(255, 251, 243, 0.9);
          --panel-solid: #fffaf0;
          --panel-dark: #1d1b18;
          --hairline: rgba(20, 19, 17, 0.15);
          --shadow: 0 16px 48px rgba(35, 30, 22, 0.16);
          --gloss: inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 -18px 38px rgba(85, 62, 28, 0.04);
          --radius-panel: 10px;
          --radius-control: 8px;
          --radius-chip: var(--radius-control);
          --font-sans: "Aptos Display", "Avenir Next", "DIN Alternate", "Trebuchet MS", sans-serif;
          --font-serif: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
          --control-bg: rgba(255, 255, 255, 0.58);
          --control-border: rgba(20, 19, 17, 0.14);
          --control-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82), 0 8px 16px rgba(43, 36, 24, 0.08);
          --control-active-bg: var(--panel-dark);
          --control-active-border: rgba(185, 129, 53, 0.42);
          --control-active-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 10px 22px rgba(43, 36, 24, 0.14);
          --drill-size: 38px;
          display: block;
          height: 100vh;
          min-height: 760px;
          color: var(--ink-900);
          font-family: var(--font-sans);
          letter-spacing: 0;
        }

        * { box-sizing: border-box; }
        button { cursor: pointer; }

        .foyer-dashboard {
          position: relative;
          display: grid;
          grid-template-columns: minmax(340px, 35%) 1fr;
          gap: 18px;
          width: 100%;
          height: 100%;
          min-height: 760px;
          padding: 22px;
          overflow: hidden;
          background:
            radial-gradient(circle at 85% 12%, rgba(185, 129, 53, 0.14), transparent 34%),
            linear-gradient(90deg, rgba(248, 243, 235, 0.96), rgba(244, 236, 224, 0.92)),
            repeating-linear-gradient(90deg, rgba(40, 36, 30, 0.03) 0, rgba(40, 36, 30, 0.03) 1px, transparent 1px, transparent 10px),
            var(--stone-50);
        }

        .foyer-dashboard::after {
          content: "";
          position: absolute;
          inset: 16px;
          pointer-events: none;
          border: 1px solid rgba(20, 19, 17, 0.08);
          border-radius: 14px;
        }

        .panel {
          position: relative;
          border: 1px solid var(--hairline);
          border-radius: var(--radius-panel);
          background: var(--panel);
          box-shadow: var(--gloss), var(--shadow);
          overflow: hidden;
        }

        .panel::after,
        .details-button {
          display: grid;
          place-items: center;
          width: var(--drill-size);
          height: var(--drill-size);
          border: 1px solid var(--control-border);
          border-radius: 999px;
          background: var(--control-bg);
          color: var(--ink-600);
          box-shadow: var(--control-shadow);
          font: inherit;
          font-size: 28px;
          line-height: 1;
        }

        .panel::after {
          content: "›";
          position: absolute;
          right: 13px;
          bottom: 13px;
          z-index: 2;
          pointer-events: none;
        }

        .route-card::after {
          content: "";
          position: absolute;
          right: 14px;
          bottom: 50%;
          width: 8px;
          height: 8px;
          border-top: 2px solid rgba(20, 19, 17, 0.28);
          border-right: 2px solid rgba(20, 19, 17, 0.28);
          transform: translateY(50%) rotate(45deg);
        }

        .no-drill::after,
        .nav::after { display: none; }
        .rail, .controls { position: relative; z-index: 1; min-width: 0; }
        .rail { display: grid; grid-template-rows: minmax(168px, auto) auto minmax(0, 1fr); gap: 12px; }
        .controls { display: grid; grid-template-rows: minmax(0, 1fr); gap: 14px; }

        .status-top { display: grid; grid-template-columns: auto auto; align-items: center; justify-content: space-between; gap: 20px; padding: 8px 22px; }
        .time { font-family: var(--font-serif); font-size: 68px; line-height: 0.95; font-weight: 650; }
        .date { margin-top: 8px; color: var(--ink-450); font-size: 14px; font-weight: 800; text-transform: uppercase; }
        .status-icons, .mode-icons, .nav-items { display: flex; align-items: center; gap: 16px; }
        .status-top .status-icons { justify-self: end; }

        .person-icon, .mode-icon, .nav-item {
          display: grid;
          place-items: center;
          border: 1px solid var(--control-border);
          background: var(--control-bg);
          color: var(--ink-760);
          box-shadow: var(--control-shadow);
        }

        .control-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 40px;
          padding: 8px 12px;
          border: 1px solid var(--control-border);
          border-radius: var(--radius-chip);
          background: var(--control-bg);
          color: var(--ink-760);
          font: inherit;
          font-size: 13px;
          font-weight: 900;
          line-height: 1;
          white-space: nowrap;
          box-shadow: var(--control-shadow);
          transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease, color 140ms ease, border-color 140ms ease;
        }

        .control-chip.active,
        .control-chip.on {
          border-color: var(--control-active-border);
          background: var(--control-active-bg);
          color: var(--stone-50);
          box-shadow: var(--control-active-shadow);
        }

        .person-status { display: grid; justify-items: center; gap: 8px; min-width: 104px; min-height: 128px; padding: 6px 4px; border: 0; border-radius: var(--radius-control); background: transparent; color: var(--ink-760); font: inherit; cursor: pointer; }
        .person-icon { position: relative; width: 96px; height: 96px; overflow: visible; border-radius: 999px; background: var(--control-active-bg); color: var(--stone-50); border-color: var(--control-active-border); font-size: 24px; font-weight: 900; }
        .person-icon img { width: 100%; height: 100%; border-radius: inherit; object-fit: cover; }
        .person-icon::after {
          content: "";
          position: absolute;
          right: 0;
          bottom: 0;
          width: 15px;
          height: 15px;
          border: 4px solid var(--panel-solid);
          border-radius: 999px;
          background: var(--green-500);
        }
        .person-status.away .person-icon::after { background: var(--ink-450); }
        .person-status.zone .person-icon::after { background: var(--rain-500); }
        .person-status.uncertain .person-icon::after, .person-status.unknown .person-icon::after { background: var(--brass-500); }
        .person-label { max-width: 104px; overflow: hidden; font-size: 14px; line-height: 1; text-overflow: ellipsis; white-space: nowrap; }

        .weather-card { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 16px; align-items: start; padding: 16px; background: linear-gradient(145deg, rgba(255, 253, 247, 0.94), rgba(229, 216, 198, 0.76)), var(--panel-solid); }
        .weather-mark { display: grid; place-items: center; width: 88px; height: 88px; border-radius: 50%; background: radial-gradient(circle at 32% 32%, #ffe3a0 0 18%, transparent 19%), radial-gradient(circle at 58% 58%, #d8edf4 0 36%, transparent 37%), linear-gradient(145deg, #f6c76d, #6ea5b9); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75), 0 12px 24px rgba(79, 117, 139, 0.22); }
        .weather-mark svg { width: 64px; height: 64px; }
        .weather-now { display: flex; align-items: center; gap: 12px; min-height: 58px; padding-top: 5px; }
        .temp { font-size: 46px; line-height: 0.92; font-weight: 900; }
        .temp .degree { position: relative; top: -0.18em; margin-left: 1px; color: var(--ink-600); font-size: 0.68em; font-weight: 900; line-height: 0; }
        .weather-meta { color: var(--ink-450); font-size: 14px; font-weight: 800; line-height: 1.25; text-transform: uppercase; }
        .weather-copy { margin-top: 7px; color: var(--ink-600); font-size: 15px; font-weight: 750; }
        .forecast-strip { margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(20, 19, 17, 0.1); }
        .forecast-legend { display: grid; grid-template-columns: 26px minmax(0, 1fr) 34px; column-gap: 4px; align-items: center; margin-bottom: 6px; color: var(--ink-450); font-size: 10px; font-weight: 900; text-transform: uppercase; overflow: visible; }
        .forecast-legend span { display: inline-flex; align-items: center; gap: 5px; grid-row: 1; white-space: nowrap; position: relative; }
        .forecast-legend i { display: inline-block; }
        .legend-temp { grid-column: 1; justify-self: end; color: var(--brass-650); }
        .legend-precip { grid-column: 3; justify-self: start; color: var(--rain-500); }
        .legend-line { width: 14px; height: 2px; border-radius: 999px; background: var(--brass-500); }
        .legend-bar { width: 8px; height: 12px; border-radius: 999px 999px 2px 2px; background: var(--rain-500); }
        .legend-temp .legend-line { position: absolute; left: calc(100% + 5px); top: 50%; transform: translateY(-50%); }
        .legend-precip .legend-bar { position: absolute; right: calc(100% + 5px); top: 50%; transform: translateY(-50%); }
        .forecast-graph { display: grid; grid-template-columns: 26px minmax(0, 1fr) 34px; grid-template-rows: 68px auto; column-gap: 4px; align-items: stretch; }
        .chart-scale { display: flex; flex-direction: column; justify-content: space-between; color: var(--ink-450); font-size: 9px; font-weight: 850; line-height: 1; white-space: nowrap; }
        .temp-scale { text-align: right; color: var(--brass-650); }
        .precip-scale { text-align: left; color: var(--rain-500); }
        .forecast-plot { position: relative; height: 68px; border-left: 1px solid rgba(130, 88, 34, 0.18); border-right: 1px solid rgba(60, 127, 161, 0.18); background: linear-gradient(to bottom, rgba(20, 19, 17, 0.08), rgba(20, 19, 17, 0.08) 1px, transparent 1px, transparent 50%, rgba(20, 19, 17, 0.06) 50%, rgba(20, 19, 17, 0.06) calc(50% + 1px), transparent calc(50% + 1px), transparent calc(100% - 1px), rgba(20, 19, 17, 0.08) calc(100% - 1px)); }
        .forecast-hours { position: absolute; inset: 0 0 2px; display: grid; grid-template-columns: repeat(24, minmax(2px, 1fr)); align-items: end; gap: 2px; padding: 0 2px; }
        .forecast-hour { display: block; min-height: 2px; border-radius: 999px 999px 2px 2px; background: rgba(79, 117, 139, 0.2); }
        .forecast-hour.wet { background: linear-gradient(180deg, #7fb7cc, var(--rain-500)); box-shadow: 0 4px 10px rgba(60, 127, 161, 0.18); }
        .temp-line { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
        .temp-line polyline { fill: none; stroke: var(--brass-500); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; filter: drop-shadow(0 2px 3px rgba(130, 88, 34, 0.2)); }
        .forecast-axis { grid-column: 2; display: flex; justify-content: space-between; margin-top: 5px; color: var(--ink-450); font-size: 10px; font-weight: 850; }

        .transit-card { padding: 12px; }
        .transit-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 9px; }
        .direction-switch { display: inline-flex; align-items: center; gap: 2px; min-height: 38px; padding: 3px; border: 1px solid rgba(20, 19, 17, 0.12); border-radius: 999px; background: rgba(255, 255, 255, 0.5); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7); }
        .direction-option { min-height: 30px; padding: 0 10px; border-color: transparent; border-radius: 999px; background: transparent; color: var(--ink-450); box-shadow: none; font-size: 11px; text-transform: uppercase; }
        .direction-option.active { border-color: var(--control-active-border); background: var(--control-active-bg); color: var(--stone-50); box-shadow: var(--control-active-shadow); }
        .tiny-alert { min-height: 32px; padding: 0 10px; color: var(--ink-450); font-size: 11px; }
        .transit-state { display: inline-flex; align-items: center; gap: 8px; margin-right: 6px; color: var(--ink-450); font-size: 10px; font-weight: 900; text-transform: uppercase; }
        .transit-pulse { display: block; width: 12px; height: 12px; border-radius: 999px; background: var(--green-500); box-shadow: 0 0 0 5px rgba(47, 114, 82, 0.12); }
        .transit-pulse.offline { background: var(--red-500); box-shadow: 0 0 0 5px rgba(162, 67, 53, 0.12); }
        .route-list { display: grid; gap: 7px; }
        .route-card { position: relative; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; width: 100%; min-height: 58px; padding: 9px 26px 9px 10px; border: 1px solid rgba(20, 19, 17, 0.12); border-radius: var(--radius-control); background: linear-gradient(145deg, rgba(255, 255, 255, 0.66), rgba(239, 230, 214, 0.62)); color: inherit; font: inherit; text-align: left; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72); transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease; }
        .route-card:active { transform: translateY(1px); }
        .route-card.stale { opacity: 0.76; }
        .line-badges { display: flex; align-items: center; gap: 5px; }
        .line { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 999px; color: white; font-size: 15px; font-weight: 900; line-height: 1; }
        .line.green { background: #00933c; }
        .line.blue { background: #0039a6; }
        .line.yellow { background: #fccc0a; color: #16120b; }
        .line.red { background: #ee352e; }
        .line.brown { background: #996633; }
        .line.path { width: auto; min-width: 42px; padding: 0 8px; background: #1f8f5f; font-size: 10px; }
        .line.arrival-line { flex: 0 0 auto; width: 22px; height: 22px; font-size: 12px; }
        .line.path.arrival-line { width: auto; min-width: 36px; height: 22px; font-size: 9px; }
        .route-main { min-width: 0; }
        .route-place { color: var(--ink-760); font-size: 15px; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .route-time { color: var(--ink-900); font-size: 26px; font-weight: 950; line-height: 1; text-align: right; }
        .route-time span { display: block; color: var(--ink-450); font-size: 10px; font-weight: 900; text-transform: uppercase; }
        .route-time.offline { color: var(--ink-450); }
        .route-empty { min-height: 120px; display: grid; place-items: center; color: var(--ink-450); font-size: 13px; font-weight: 850; }

        .control-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(136px, 0.26fr); grid-template-rows: auto auto minmax(220px, 1fr) auto; gap: 14px; min-width: 0; min-height: 0; }
        .lighting-panel { grid-column: 1 / -1; display: grid; align-content: start; min-height: 0; padding: 18px; }
        .lighting-panel::after { display: none; }
        .lighting-shell { position: relative; display: grid; grid-template-rows: auto auto; align-content: start; gap: 8px; }
        .power-buttons { display: grid; grid-template-columns: 90px minmax(0, 1fr) minmax(0, 1fr); align-items: stretch; gap: 10px; padding-right: 52px; }
        .power-icon-cell { display: grid; place-items: center; width: 70px; height: 70px; }
        .power-icon { display: grid; place-items: center; width: 70px; height: 70px; border-radius: 999px; background: linear-gradient(145deg, #2d2923, #151310); color: #f1bd69; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 18px 28px rgba(39, 31, 20, 0.18); }
        .power-icon.off { color: rgba(238, 229, 214, 0.78); }
        .power-icon svg { width: 44px; height: 44px; }
        .power-icon svg, .volume-button svg, .nav-item svg { stroke: currentColor; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
        .power-icon .slash { stroke-width: 2.5; }
        .scope-toggle { display: grid; grid-template-columns: auto minmax(0, max-content); place-content: center; align-items: center; align-self: stretch; column-gap: 7px; min-height: 0; padding: 10px 8px; border-radius: var(--radius-control); border-color: rgba(20, 19, 17, 0.14); background: linear-gradient(180deg, rgba(238, 229, 214, 0.92), rgba(203, 187, 164, 0.7)); color: var(--ink-900); font-size: 13px; font-weight: 950; white-space: normal; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82), 0 8px 16px rgba(43, 36, 24, 0.08); }
        .scope-toggle.on { border-color: rgba(185, 129, 53, 0.48); background: linear-gradient(180deg, #211e19, #3f3527); color: var(--stone-50); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 10px 22px rgba(43, 36, 24, 0.14); }
        .scope-plus { color: var(--brass-500); font-size: 22px; line-height: 1; }
        .scope-toggle.on .scope-plus { color: #f1bd69; }
        .scope-label { display: grid; gap: 1px; line-height: 0.95; text-align: left; text-transform: uppercase; }
        .control-chip.is-pressed, .scene-button.is-pressed, .details-button.is-pressed { transform: translateY(1px) scale(0.985); box-shadow: inset 0 2px 8px rgba(20, 19, 17, 0.24); }
        .intensity-buttons { display: grid; align-content: start; gap: 10px; padding-right: 52px; }
        .intensity-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
        .scene-button { display: grid; align-content: space-between; border: 1px solid rgba(20, 19, 17, 0.14); border-radius: var(--radius-control); background: linear-gradient(180deg, rgba(238, 229, 214, 0.92), rgba(203, 187, 164, 0.7)); color: var(--ink-900); font: inherit; text-align: left; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82), 0 8px 16px rgba(43, 36, 24, 0.08); transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease; }
        .scene-button.power { display: grid; grid-template-columns: minmax(76px, 1fr) auto minmax(76px, 1fr); grid-template-rows: 1fr; align-items: center; column-gap: 6px; min-height: 142px; padding: 16px; }
        .scene-button.intensity { min-height: 78px; padding: 12px 17px 11px; }
        .scene-button strong { font-size: 28px; line-height: 1.15; font-weight: 950; white-space: nowrap; }
        .scene-button.power strong { font-size: 40px; line-height: 1; }
        .scene-button.intensity strong { font-size: 17px; }
        .power-icon-cell { grid-column: 1; grid-row: 1; justify-self: center; z-index: 1; }
        .power-label { grid-column: 2; grid-row: 1; display: grid; place-items: center; min-width: 0; }
        .power-meter { grid-column: 3; grid-row: 1; display: grid; align-items: center; justify-items: start; min-width: 0; }
        .scene-button.on .power-meter { padding-left: 6px; }
        .scene-level { display: flex; gap: 4px; align-items: end; height: 30px; }
        .scene-level i { display: block; width: 8px; border-radius: 999px 999px 2px 2px; background: var(--brass-500); }
        .scene-button.power .scene-level { height: 30px; }
        .scene-button.intensity .scene-level { height: 26px; }
        .scene-button.intensity .scene-level i { width: 6px; }
        .scene-button.active { background: linear-gradient(180deg, #211e19, #3f3527); color: var(--stone-50); border-color: rgba(185, 129, 53, 0.48); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 10px 22px rgba(43, 36, 24, 0.14); }
        .details-button { position: absolute; right: 0; bottom: 0; padding: 0; transition: transform 140ms ease, box-shadow 140ms ease; }

        .dog-card { grid-column: 1; grid-row: 2 / 4; position: relative; min-height: 0; padding: 16px; border: 2px solid rgba(15, 13, 11, 0.96); background: linear-gradient(145deg, #090807, #3b332b 24%, #81705d 36%, #1a1713 55%, #4a3c2d 78%, #0d0b09); box-shadow: 0 26px 54px rgba(22, 18, 13, 0.34), inset 0 2px 0 rgba(255, 255, 255, 0.28), inset 0 -3px 0 rgba(0, 0, 0, 0.54), inset 0 0 0 6px rgba(185, 129, 53, 0.22); }
        .dog-card::before { content: ""; position: absolute; inset: 8px; z-index: 2; pointer-events: none; border: 2px solid rgba(240, 190, 108, 0.48); border-radius: 5px; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18), inset 0 0 34px rgba(0, 0, 0, 0.28); background: linear-gradient(130deg, rgba(255, 255, 255, 0.28) 0 11%, transparent 12% 55%, rgba(255, 255, 255, 0.12) 56%, transparent 68%); }
        .dog-card img { position: relative; z-index: 1; width: 100%; height: 100%; min-height: 280px; display: block; object-fit: cover; object-position: 50% 47%; border: 1px solid rgba(255, 244, 221, 0.5); border-radius: 4px; box-shadow: inset 0 0 0 1px rgba(20, 19, 17, 0.28), 0 12px 22px rgba(0, 0, 0, 0.34); filter: contrast(1.06) saturate(1.08); }
        .media-panel { grid-column: 2; grid-row: 3; display: grid; grid-template-rows: auto minmax(0, 1fr) auto auto; align-items: start; gap: 12px; min-width: 0; padding: 12px 14px; color: var(--ink-600); font-size: 13px; font-weight: 850; }
        .media-panel strong { color: var(--ink-900); font-size: 15px; }
        .media-label { min-width: 0; line-height: 1.2; white-space: normal; overflow-wrap: anywhere; }
        .volume-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; width: 100%; }
        .volume-button { width: 100%; min-width: 0; padding: 0; }
        .volume-button svg { width: 19px; height: 19px; }
        .volume-level { display: grid; place-items: center; min-height: 40px; border: 1px solid var(--control-border); border-radius: var(--radius-control); background: rgba(255, 255, 255, 0.38); color: var(--ink-760); font-size: 12px; font-weight: 950; line-height: 1; box-shadow: var(--control-shadow); }
        .volume-level.muted { color: var(--brass-500); }
        .media-actions { display: grid; gap: 7px; width: 100%; }
        .small-button { width: 100%; min-width: 0; }

        .bottom-dock { grid-column: 1 / -1; display: flex; align-items: center; gap: 10px; min-width: 0; }
        .mode-dock { grid-column: 2; grid-row: 2; display: grid; grid-template-columns: 1fr; align-content: start; padding: 6px; }
        .mode-block { display: grid; align-items: center; }
        .mode-icons { display: grid; grid-template-columns: 1fr; gap: 8px; }
        .mode-icon { position: relative; justify-content: flex-start; width: 100%; min-width: 0; min-height: 52px; gap: 10px; padding: 0 12px; font-size: 14px; text-align: left; }
        .mode-icon ha-icon { flex: 0 0 auto; width: 28px; height: 28px; --mdc-icon-size: 28px; }
        .nav { flex: 1 1 auto; width: 100%; padding: 6px; }
        .nav-items { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 6px; width: 100%; }
        .nav-item { min-width: 0; padding: 0 8px; color: var(--ink-600); font-size: 11px; }
        .nav-item svg { width: 16px; height: 16px; }

        .modal-backdrop { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 44px; background: rgba(20, 19, 17, 0.42); }
        .lightbox { display: grid; grid-template-rows: 1fr; width: min(1100px, calc(100vw - 72px)); min-height: min(575px, calc(100vh - 72px)); max-height: calc(100vh - 72px); border: 1px solid rgba(20, 19, 17, 0.18); border-radius: 12px; background: linear-gradient(145deg, rgba(255, 251, 243, 0.98), rgba(232, 222, 205, 0.96)); box-shadow: 0 30px 80px rgba(22, 20, 16, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.9); }
        .lightbox-head { display: flex; align-items: start; justify-content: space-between; gap: 18px; padding: 22px 24px 14px; border-bottom: 1px solid rgba(20, 19, 17, 0.1); }
        .lightbox h2 { margin: 0; font-size: 28px; line-height: 1; font-weight: 950; }
        .lightbox p { margin: 8px 0 0; color: var(--ink-450); font-size: 13px; font-weight: 900; text-transform: uppercase; }
        .lightbox-close { display: grid; place-items: center; width: 52px; height: 52px; padding: 0; border: 1px solid var(--control-active-border); border-radius: 999px; background: var(--control-active-bg); color: var(--stone-50); font: inherit; font-size: 28px; line-height: 1; }
        .person-lightbox { grid-template-rows: auto 1fr auto; width: min(820px, calc(100vw - 72px)); min-height: min(624px, calc(100vh - 72px)); padding-bottom: 20px; }
        .person-detail-head { display: grid; grid-template-columns: 220px minmax(0, 1fr) 52px; align-items: center; gap: 24px; padding: 24px 34px 20px; border-bottom: 1px solid rgba(20, 19, 17, 0.1); }
        .person-detail-head h2 { font-size: 42px; }
        .person-detail-head p { margin-top: 10px; font-size: 18px; }
        .person-detail-photo { display: grid; place-items: center; width: 220px; height: 220px; overflow: hidden; border-radius: 999px; background: var(--control-active-bg); color: var(--stone-50); font-size: 46px; font-weight: 950; }
        .person-detail-photo img { width: 100%; height: 100%; object-fit: cover; }
        .person-detail-list { display: grid; align-content: center; margin: 0; padding: 10px 34px; }
        .person-detail-list div { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 24px; min-height: 48px; padding: 8px 0; border-bottom: 1px solid rgba(20, 19, 17, 0.08); }
        .person-detail-list div:last-child { border-bottom: 0; }
        .person-detail-list dt { color: var(--ink-450); font-size: 18px; font-weight: 850; }
        .person-detail-list dd { margin: 0; color: var(--ink-900); font-size: 20px; font-weight: 900; text-align: right; }
        .person-more-info { justify-self: stretch; margin: 6px 34px 0; min-height: 56px; font-size: 18px; }
        .lighting-modal-body { min-height: 0; overflow: auto; }
        .area-controls { padding: 18px 30px 12px; }
        .area-control-row { display: grid; grid-template-columns: 116px minmax(0, 1fr) 48px; align-items: center; gap: 16px; padding: 15px 0; border-bottom: 1px solid rgba(20, 19, 17, 0.1); }
        .area-control-row:last-child { border-bottom: 0; }
        .area-control-name { display: grid; gap: 4px; }
        .area-control-name strong, .whole-house-controls strong { color: var(--ink-900); font-size: 20px; font-weight: 900; line-height: 1; }
        .area-preset-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
        .lighting-preset { display: grid; grid-template-columns: 42px minmax(0, 1fr); align-items: center; gap: 10px; min-width: 0; min-height: 74px; padding: 11px 13px; border: 1px solid var(--control-border); border-radius: var(--radius-control); background: linear-gradient(180deg, rgba(238, 229, 214, 0.92), rgba(203, 187, 164, 0.7)); color: var(--ink-760); font: inherit; text-align: left; box-shadow: var(--control-shadow); transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease, background 140ms ease, color 140ms ease; }
        .lighting-preset strong { min-width: 0; overflow: hidden; font-size: 16px; font-weight: 850; line-height: 1; text-overflow: ellipsis; white-space: nowrap; }
        .lighting-preset .scene-level { justify-self: center; height: 31px; gap: 4px; }
        .lighting-preset .scene-level i { width: 6px; }
        .lighting-preset .power-icon { width: 40px; height: 40px; background: #514c44; color: rgba(238, 229, 214, 0.8); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14); }
        .lighting-preset .power-icon svg { width: 26px; height: 26px; }
        .lighting-preset.active { border-color: var(--control-active-border); background: var(--control-active-bg); color: var(--stone-50); box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.42), 0 4px 8px rgba(43, 36, 24, 0.08); transform: translateY(1px); }
        .lighting-preset:disabled { cursor: not-allowed; opacity: 0.42; }
        .lighting-preset.is-pressed { transform: translateY(1px) scale(0.98); box-shadow: inset 0 2px 8px rgba(20, 19, 17, 0.2); }
        .area-expand { display: grid; place-items: center; width: 48px; height: 48px; padding: 0; border: 1px solid var(--control-border); border-radius: 999px; background: var(--control-bg); color: var(--ink-600); font: inherit; font-size: 30px; line-height: 1; box-shadow: var(--control-shadow); transition: transform 160ms ease; }
        .area-control-row.expanded .area-expand { transform: rotate(90deg); }
        .area-light-list { grid-column: 2 / 4; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; padding: 3px 0 6px; }
        .individual-light { display: grid; grid-template-columns: 54px minmax(0, 1fr) auto; grid-template-rows: auto auto; align-items: center; column-gap: 12px; row-gap: 9px; min-width: 0; min-height: 92px; padding: 10px 13px; border: 1px solid rgba(20, 19, 17, 0.1); border-radius: 7px; background: rgba(255, 255, 255, 0.4); color: var(--ink-600); font: inherit; transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease; }
        .individual-light.on { border-color: rgba(185, 129, 53, 0.28); background: rgba(255, 248, 235, 0.78); color: var(--ink-900); }
        .individual-light.is-pressed { box-shadow: inset 0 2px 8px rgba(20, 19, 17, 0.14); }
        .individual-light-power { grid-column: 1; grid-row: 1 / 3; display: grid; place-items: center; width: 54px; height: 54px; padding: 0; border: 1px solid var(--control-border); border-radius: 999px; background: #514c44; color: rgba(238, 229, 214, 0.8); box-shadow: var(--control-shadow); }
        .individual-light.on .individual-light-power { border-color: rgba(185, 129, 53, 0.5); background: var(--panel-dark); color: #f1bd69; }
        .individual-light-power svg { width: 30px; height: 30px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .individual-light-name { grid-column: 2; min-width: 0; overflow: hidden; font-size: 15px; font-weight: 800; line-height: 1.1; text-overflow: ellipsis; white-space: nowrap; }
        .individual-light-value { grid-column: 3; color: var(--ink-450); font-size: 13px; font-weight: 850; line-height: 1; }
        .individual-light-slider { grid-column: 2 / 4; width: 100%; height: 28px; margin: 0; appearance: none; background: transparent; cursor: pointer; }
        .individual-light-slider::-webkit-slider-runnable-track { height: 7px; border-radius: 999px; background: linear-gradient(90deg, var(--brass-500) 0 var(--light-level), rgba(20, 19, 17, 0.14) var(--light-level) 100%); }
        .individual-light-slider::-moz-range-track { height: 7px; border-radius: 999px; background: linear-gradient(90deg, var(--brass-500) 0 var(--light-level), rgba(20, 19, 17, 0.14) var(--light-level) 100%); }
        .individual-light-slider::-webkit-slider-thumb { width: 21px; height: 21px; margin-top: -7px; appearance: none; border: 2px solid var(--panel-solid); border-radius: 999px; background: var(--panel-dark); box-shadow: 0 2px 5px rgba(20, 19, 17, 0.28); }
        .individual-light-slider::-moz-range-thumb { width: 17px; height: 17px; border: 2px solid var(--panel-solid); border-radius: 999px; background: var(--panel-dark); box-shadow: 0 2px 5px rgba(20, 19, 17, 0.28); }
        .whole-house-controls { display: grid; grid-template-columns: 116px minmax(0, 1fr) 48px; align-items: center; gap: 16px; padding: 24px 30px; border-bottom: 1px solid rgba(162, 67, 53, 0.2); background: rgba(255, 244, 238, 0.5); }
        .whole-house-label strong { display: grid; gap: 1px; }
        .whole-house-actions { grid-column: 2; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
        .whole-house-actions .lighting-preset { min-height: 126px; grid-template-columns: 58px minmax(0, 1fr); gap: 16px; padding: 18px 20px; }
        .whole-house-actions .lighting-preset strong { font-size: 21px; white-space: normal; }
        .whole-house-actions .lighting-preset.active strong { color: var(--stone-50); }
        .whole-house-actions .lighting-preset .power-icon { width: 54px; height: 54px; }
        .whole-house-actions .lighting-preset .power-icon svg { width: 34px; height: 34px; }
        .lighting-preset-emoji { justify-self: center; font-size: 38px; line-height: 1; }
        .transit-lightbox { grid-template-rows: 1fr; width: min(1400px, calc(100vw - 72px)); height: min(645px, calc(100vh - 72px)); min-height: 0; }
        .transit-detail-body { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 22px; padding: 28px 30px; overflow: auto; }
        .transit-detail-body.alerts-only { grid-template-columns: minmax(0, 1fr); }
        .direction-detail { display: grid; align-content: start; gap: 18px; padding: 22px; border: 1px solid rgba(20, 19, 17, 0.12); border-radius: var(--radius-control); background: rgba(255, 255, 255, 0.48); }
        .direction-detail.selected { border-color: rgba(185, 129, 53, 0.48); background: rgba(255, 248, 235, 0.82); }
        .direction-detail.offline { opacity: 0.78; }
        .direction-detail-head, .arrival-row { display: grid; align-items: center; gap: 14px; }
        .direction-detail-head { grid-template-columns: 1fr auto; color: var(--ink-900); font-size: 20px; font-weight: 950; }
        .direction-detail-head span:last-child { color: var(--ink-450); font-size: 16px; }
        .transit-sources { display: grid; min-height: 0; gap: 15px; }
        .arrival-list { display: grid; grid-auto-rows: 82px; gap: 12px; min-height: 0; }
        .arrival-row { grid-template-columns: 94px minmax(0, 1fr) auto; min-height: 82px; padding: 12px 15px; border: 1px solid rgba(20, 19, 17, 0.08); border-radius: 7px; background: rgba(255, 255, 255, 0.46); }
        .arrival-row.catchable { border-color: rgba(185, 129, 53, 0.46); background: rgba(255, 248, 235, 0.86); box-shadow: inset 3px 0 0 rgba(185, 129, 53, 0.72); }
        .arrival-row.alert-row { border-color: rgba(162, 67, 53, 0.24); background: rgba(255, 241, 235, 0.68); }
        .arrival-row.offline { color: var(--ink-450); }
        .arrival-time { display: flex; align-items: baseline; gap: 3px; color: var(--ink-900); }
        .arrival-row.offline .arrival-time { color: var(--ink-450); }
        .arrival-time strong { font-size: 34px; line-height: 1; }
        .arrival-time span, .arrival-due { color: var(--ink-450); font-size: 16px; font-weight: 900; text-transform: uppercase; }
        .arrival-detail { display: flex; align-items: center; gap: 10px; min-width: 0; overflow: hidden; color: var(--ink-760); font-size: 20px; font-weight: 850; white-space: nowrap; }
        .arrival-detail .line.arrival-line { width: 32px; height: 32px; font-size: 17px; }
        .arrival-detail .line.path.arrival-line { width: auto; min-width: 50px; height: 32px; font-size: 11px; }
        .arrival-destination { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .arrival-row.catchable .arrival-time strong,
        .arrival-row.catchable .arrival-detail,
        .arrival-row.catchable .arrival-due { color: var(--ink-900); font-weight: 950; }
        .transit-updated { color: var(--ink-450); font-size: 14px; font-weight: 900; text-transform: uppercase; }

        @media (max-width: 920px) {
          :host { height: auto; min-height: 980px; }
          .foyer-dashboard { grid-template-columns: 1fr; min-height: 980px; overflow-y: auto; }
          .control-layout { grid-template-columns: 1fr; grid-template-rows: auto; }
          .lighting-panel, .media-panel, .dog-card, .bottom-dock { grid-column: auto; grid-row: auto; }
          .lighting-panel { min-height: auto; }
          .power-buttons, .intensity-buttons { padding-right: 0; }
          .power-buttons, .intensity-row { grid-template-columns: 1fr; }
          .details-button { position: static; justify-self: end; margin-top: 8px; }
          .bottom-dock { flex-wrap: wrap; }
          .modal-backdrop { padding: 18px; }
          .lightbox { width: calc(100vw - 36px); max-height: calc(100vh - 36px); min-height: 0; }
          .lightbox-head { padding: 18px 18px 12px; }
          .area-controls { padding: 6px 18px; }
          .area-control-row { grid-template-columns: minmax(0, 1fr) 38px; gap: 9px; padding: 12px 0; }
          .area-control-name { grid-column: 1; }
          .area-preset-grid { grid-column: 1 / -1; grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .area-expand { grid-column: 2; grid-row: 1; }
          .area-light-list { grid-column: 1 / -1; grid-template-columns: 1fr 1fr; }
          .whole-house-controls { grid-template-columns: minmax(0, 1fr); gap: 10px; padding: 16px 18px; }
          .whole-house-actions { grid-column: 1; }
        }
      </style>
    `;
  }
}

customElements.define("foyer-dashboard", FoyerDashboardCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "foyer-dashboard",
  name: "Foyer Dashboard",
  description: "Purpose-built foyer wall dashboard"
});

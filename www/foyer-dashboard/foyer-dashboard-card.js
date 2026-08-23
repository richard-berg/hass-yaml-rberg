const DEFAULT_CONFIG = {
  image: "/api/image/serve/7abddc82be6cd368867697a7e0ac5a3c/original",
  entities: {
    weather: "weather.forecast_home",
    includeLiving: "input_boolean.foyer_dashboard_include_living",
    lightingIntensity: "input_select.foyer_dashboard_lighting_intensity",
    richard: "person.richard_berg",
    allison: "person.allison_bishop",
    mediaPlayer: "media_player.living_room"
  },
  scripts: {
    bright: "script.foyer_dashboard_open_area_bright",
    everyday: "script.foyer_dashboard_open_area_everyday",
    evening: "script.foyer_dashboard_open_area_evening",
    mood: "script.foyer_dashboard_open_area_mood",
    off: "script.foyer_dashboard_open_area_off"
  },
  transit: [
    { lines: [{ label: "4", className: "green" }, { label: "5", className: "green" }], station: "Fulton", next: "6, 14, 23", minutes: 18, best: true },
    { lines: [{ label: "R", className: "yellow" }, { label: "W", className: "yellow" }], station: "Cortlandt", next: "10, 18, 31", minutes: 24 },
    { lines: [{ label: "2", className: "red" }, { label: "3", className: "red" }], station: "Park Pl", next: "12, 22, 32", minutes: 27 }
  ]
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
    this._forecastCache = { entityId: null, hourly: [], updatedAt: 0 };
    this._forecastPromise = null;
    this._forecastTimer = null;
    this._handleClick = this._handleClick.bind(this);
  }

  setConfig(config) {
    this._config = this._mergeConfig(DEFAULT_CONFIG, config || {});
    this._forecastCache = { entityId: null, hourly: [], updatedAt: 0 };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._refreshWeatherForecasts();
    this._render();
  }

  connectedCallback() {
    this.shadowRoot.addEventListener("click", this._handleClick);
    this._timer = window.setInterval(() => this._render(), 30000);
    this._forecastTimer = window.setInterval(() => this._refreshWeatherForecasts(true), 15 * 60 * 1000);
    this._refreshWeatherForecasts();
    this._render();
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener("click", this._handleClick);
    if (this._timer) {
      window.clearInterval(this._timer);
      this._timer = null;
    }
    if (this._pressedTimer) window.clearTimeout(this._pressedTimer);
    if (this._optimisticTimer) window.clearTimeout(this._optimisticTimer);
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
      transit: override.transit || base.transit
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

  _isHome(entityId) {
    return this._state(entityId)?.state === "home";
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
    return { state, label };
  }

  _intensities() {
    return [
      { key: "bright", label: "Bright", script: "bright", livingScene: "scene.living_room_bright", bars: [6, 11, 16, 21], size: "secondary" },
      { key: "everyday", label: "Everyday", script: "everyday", livingScene: "scene.living_room_normal", bars: [18, 25, 32], size: "primary" },
      { key: "evening", label: "Evening", script: "evening", livingScene: "scene.living_room_mood", bars: [12, 23], size: "secondary" },
      { key: "mood", label: "Mood", script: "mood", livingScene: "scene.living_room_mood", bars: [16], size: "secondary" },
      { key: "off", label: "Off", script: "off", livingScene: "scene.living_room_off", bars: [4], size: "primary", off: true }
    ];
  }

  _currentIntensityKey() {
    if (this._optimisticIntensity) return this._optimisticIntensity;
    const state = this._state(this._config.entities.lightingIntensity)?.state || "Everyday";
    const normalized = state.toLowerCase().replace(/\s+/g, "-");
    return this._intensities().some((intensity) => intensity.key === normalized) ? normalized : "everyday";
  }

  _currentIntensity() {
    const key = this._currentIntensityKey();
    return this._intensities().find((intensity) => intensity.key === key) || this._intensities()[1];
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
    const livingScene = this._currentIntensity().livingScene;
    if (livingScene) this._hass.callService("scene", "turn_on", { entity_id: livingScene });
  }

  _handleClick(event) {
    if (event.target.classList?.contains("modal-backdrop")) {
      this._lightingModalOpen = false;
      this._render();
      return;
    }

    const target = event.target.closest("[data-action]");
    if (!target || !this._hass) return;

    const action = target.dataset.action;
    if (action === "toggle-living") {
      this._press("living");
      const entityId = this._config.entities.includeLiving;
      const isOn = this._state(entityId)?.state === "on";
      this._hass.callService("input_boolean", isOn ? "turn_off" : "turn_on", { entity_id: entityId });
      if (!isOn) this._syncLivingToIntensity();
      return;
    }

    if (action === "script") {
      const scriptId = this._config.scripts[target.dataset.script];
      const intensity = target.dataset.intensity;
      this._press(`intensity-${intensity}`);
      this._setOptimisticIntensity(intensity);
      if (scriptId) this._hass.callService("script", "turn_on", { entity_id: scriptId });
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

    if (action === "sonos-play") {
      this._press("sonos-play");
      this._hass.callService("media_player", "media_play", { entity_id: this._config.entities.mediaPlayer });
      return;
    }

    if (action === "sonos-off") {
      this._press("sonos-off");
      this._hass.callService("media_player", "turn_off", { entity_id: this._config.entities.mediaPlayer });
      return;
    }

    if (action === "reserved") {
      this._press(`reserved-${target.dataset.mode}`);
      this.dispatchEvent(new CustomEvent("hass-notification", {
        bubbles: true,
        composed: true,
        detail: { message: `${target.textContent.trim()} mode is reserved for a later pass.` }
      }));
    }
  }

  _renderIntensityButton(intensity) {
    const active = this._currentIntensityKey() === intensity.key;
    const pressed = this._pressedKey === `intensity-${intensity.key}`;
    return `
      <button class="scene-button ${intensity.size} ${active ? "active" : ""} ${pressed ? "is-pressed" : ""} ${intensity.off ? "off" : ""}" data-action="script" data-script="${intensity.script}" data-intensity="${intensity.key}" aria-pressed="${active}">
        <strong>${intensity.label}</strong>
        <span class="scene-level">${intensity.bars.map((height) => `<i style="height: ${height}px;"></i>`).join("")}</span>
      </button>
    `;
  }

  _renderLightingModal(includeLiving) {
    if (!this._lightingModalOpen) return "";
    const intensity = this._currentIntensity();
    return `
      <div class="modal-backdrop" role="presentation">
        <section class="lightbox" role="dialog" aria-modal="true" aria-label="Light Controls">
          <header class="lightbox-head">
            <div>
              <h2>Light Controls</h2>
              <p>${intensity.label}${includeLiving ? " + Living Room" : ""}</p>
            </div>
            <button class="control-chip lightbox-close" data-action="close-lighting-modal" aria-label="Close light controls">Close</button>
          </header>
          <div class="lightbox-empty" aria-label="Granular light controls placeholder"></div>
        </section>
      </div>
    `;
  }

  _renderPeople() {
    const richard = this._config.entities.richard;
    const allison = this._config.entities.allison;
    return [richard, allison].map((entityId) => `
      <span class="person-icon status-token ${this._isHome(entityId) ? "home" : "away"}" title="${this._friendly(entityId)} ${this._isHome(entityId) ? "home" : "away"}">${this._initial(entityId)}</span>
    `).join("");
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
                  ${weather.chart.bars.map((hour) => `<span class="forecast-hour ${hour.wet ? "wet" : "dry"}" style="height: ${hour.height}px;" title="${hour.title}"></span>`).join("")}
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
    return `
      <section class="panel transit-card" aria-label="Uptown transit status">
        <div class="transit-head">
          <div class="transit-title">
            <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true"><path d="M12 4v16M6 10l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
            Uptown
          </div>
          <span class="control-chip tiny-alert">1 advisory</span>
        </div>
        <div class="route-list">
          ${this._config.transit.map((route) => `
            <article class="route-card ${route.best ? "best" : ""}">
              <div class="line-badges">${route.lines.map((line) => `<span class="line ${line.className}">${line.label}</span>`).join("")}</div>
              <div class="route-main"><div class="route-place">${route.station}</div><div class="route-next">${route.next}</div></div>
              <div class="route-time">${route.minutes}<span>min</span></div>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  _render() {
    if (!this.shadowRoot) return;
    const includeLiving = this._state(this._config.entities.includeLiving)?.state === "on";
    const media = this._mediaModel();
    const intensities = this._intensities();
    const primaryIntensities = intensities.filter((intensity) => intensity.size === "primary");
    const secondaryIntensities = intensities.filter((intensity) => intensity.size === "secondary");

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

          <section class="panel no-drill micro-status" aria-label="Compact status">
            <span class="status-icon" title="No alerts"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg></span>
          </section>
        </aside>

        <section class="controls" aria-label="Controls and detail surfaces">
          <section class="control-layout">
            <section class="panel lighting-panel" aria-label="Open Area lighting controls">
              <div class="lighting-shell">
                <div class="scope-strip">
                  <div class="scope-left">
                    <span class="lighting-icon" title="Lighting" aria-hidden="true">
                      <svg viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M8 14c-1.4-1.2-2-2.7-2-4.5A6 6 0 0 1 18 9.5c0 1.8-.7 3.3-2 4.5-.8.7-1 1.4-1 2H9c0-.6-.2-1.3-1-2Z"></path></svg>
                    </span>
                  </div>
                  <button class="control-chip scope-toggle ${includeLiving ? "on" : ""} ${this._pressedKey === "living" ? "is-pressed" : ""}" data-action="toggle-living" aria-pressed="${includeLiving}">+ Living Room</button>
                </div>
                <div class="intensity-buttons">
                  <div class="primary-intensities">${primaryIntensities.map((intensity) => this._renderIntensityButton(intensity)).join("")}</div>
                  <div class="secondary-intensities">${secondaryIntensities.map((intensity) => this._renderIntensityButton(intensity)).join("")}</div>
                </div>
                <button class="details-button ${this._pressedKey === "details" ? "is-pressed" : ""}" data-action="open-lighting-modal" aria-label="Open light controls">›</button>
              </div>
            </section>

            <section class="panel art-card" aria-label="Dog art/photo and Sonos">
              <div class="art-mat">
                <div class="media-mini" aria-label="Living Room Sonos compact control">
                  <strong>Sonos</strong>
                  <span>${media.label}</span>
                  <div class="media-actions">
                    <button class="control-chip small-button ${this._pressedKey === "sonos-play" ? "is-pressed" : ""}" data-action="sonos-play">Play</button>
                    <button class="control-chip small-button ${this._pressedKey === "sonos-off" ? "is-pressed" : ""}" data-action="sonos-off">Off</button>
                  </div>
                </div>
                <figure class="print-frame" aria-label="Framed processed dog photo from the current Foyer dashboard">
                  <div class="photo-window"><img src="${this._config.image}" alt="Dog photo used on the current Foyer dashboard" decoding="async"></div>
                </figure>
              </div>
            </section>

            <div class="bottom-dock">
              <section class="panel no-drill mode-dock" aria-label="House mode shortcuts">
                <div class="mode-block">
                  <div class="mode-icons" aria-label="Reserved mode toggles">
                    <button class="control-chip mode-icon ${this._pressedKey === "reserved-guest" ? "is-pressed" : ""}" data-action="reserved" data-mode="guest" title="Guest" aria-label="Guest mode reserved"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V6h10v14M14 11h6v9M9 12h.01"></path></svg><span>Guest</span></button>
                    <button class="control-chip mode-icon ${this._pressedKey === "reserved-party" ? "is-pressed" : ""}" data-action="reserved" data-mode="party" title="Party" aria-label="Party mode reserved"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.4 4.9L20 9l-4 3.9.9 5.6L12 15.9l-4.9 2.6.9-5.6L4 9l5.6-1.1L12 3Z"></path></svg><span>Party</span></button>
                    <button class="control-chip mode-icon ${this._pressedKey === "reserved-performance" ? "is-pressed" : ""}" data-action="reserved" data-mode="performance" title="Performance" aria-label="Performance mode reserved"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 20h10M12 16v4M5 4h14l-2 12H7L5 4Z"></path></svg><span>Perf</span></button>
                  </div>
                </div>
              </section>

              <nav class="panel no-drill nav" aria-label="Dashboard tabs">
                <div class="nav-items">
                  <span class="control-chip nav-item active"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 12 4l9 7v9H5v-9"></path></svg>Home</span>
                  <span class="control-chip nav-item"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18h16M7 18V9m5 9V5m5 13v-6"></path></svg>Power</span>
                  <span class="control-chip nav-item"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M6 9h12M8 15h8"></path></svg>Climate</span>
                  <span class="control-chip nav-item"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7zM17 10h2v4h-2"></path></svg>Health</span>
                </div>
              </nav>
            </div>
          </section>
        </section>
      </main>
      ${this._renderLightingModal(includeLiving)}
    `;
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
        .rail { display: grid; grid-template-rows: auto auto 1fr auto; gap: 12px; }
        .controls { display: grid; grid-template-rows: minmax(0, 1fr); gap: 14px; }

        .status-top { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 12px; padding: 12px 14px; }
        .time { font-family: var(--font-serif); font-size: 34px; line-height: 1; font-weight: 650; }
        .date { color: var(--ink-450); font-size: 12px; font-weight: 800; text-transform: uppercase; }
        .status-icons, .mode-icons, .nav-items { display: flex; align-items: center; gap: 8px; }
        .status-top .status-icons { justify-self: end; }

        .person-icon, .status-icon, .mode-icon, .nav-item {
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

        .person-icon, .status-icon { position: relative; width: 34px; height: 34px; border-radius: 999px; font-size: 13px; font-weight: 900; }
        .person-icon { background: var(--control-active-bg); color: var(--stone-50); border-color: var(--control-active-border); }
        .person-icon::after, .status-icon::after {
          content: "";
          position: absolute;
          right: 0;
          bottom: 0;
          width: 8px;
          height: 8px;
          border: 2px solid var(--panel-solid);
          border-radius: 999px;
          background: var(--green-500);
        }
        .person-icon.away::after { background: var(--brass-500); }

        .weather-card { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 16px; align-items: start; padding: 16px; background: linear-gradient(145deg, rgba(255, 253, 247, 0.94), rgba(229, 216, 198, 0.76)), var(--panel-solid); }
        .weather-mark { display: grid; place-items: center; width: 88px; height: 88px; border-radius: 50%; background: radial-gradient(circle at 32% 32%, #ffe3a0 0 18%, transparent 19%), radial-gradient(circle at 58% 58%, #d8edf4 0 36%, transparent 37%), linear-gradient(145deg, #f6c76d, #6ea5b9); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75), 0 12px 24px rgba(79, 117, 139, 0.22); }
        .weather-mark svg { width: 64px; height: 64px; }
        .weather-now { display: flex; align-items: center; gap: 12px; min-height: 58px; padding-top: 5px; }
        .temp { font-size: 46px; line-height: 0.92; font-weight: 900; }
        .temp .degree { position: relative; top: -0.18em; margin-left: 1px; color: var(--ink-600); font-size: 0.68em; font-weight: 900; line-height: 0; }
        .weather-meta { color: var(--ink-450); font-size: 13px; font-weight: 800; line-height: 1.25; text-transform: uppercase; }
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
        .transit-title { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 900; }
        .tiny-alert { min-height: 32px; padding: 0 10px; color: var(--ink-450); font-size: 11px; }
        .route-list { display: grid; gap: 7px; }
        .route-card { position: relative; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; min-height: 58px; padding: 9px 26px 9px 10px; border: 1px solid rgba(20, 19, 17, 0.12); border-radius: var(--radius-control); background: linear-gradient(145deg, rgba(255, 255, 255, 0.66), rgba(239, 230, 214, 0.62)); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72); }
        .route-card.best { border-color: rgba(185, 129, 53, 0.58); background: linear-gradient(145deg, rgba(255, 248, 235, 0.92), rgba(237, 219, 188, 0.76)); }
        .line-badges { display: flex; align-items: center; gap: 5px; }
        .line { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 999px; color: white; font-size: 15px; font-weight: 900; line-height: 1; }
        .line.green { background: #00933c; }
        .line.yellow { background: #fccc0a; color: #16120b; }
        .line.red { background: #ee352e; }
        .route-main { min-width: 0; }
        .route-place { color: var(--ink-760); font-size: 15px; font-weight: 900; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .route-next { margin-top: 2px; color: var(--ink-450); font-size: 12px; font-weight: 800; }
        .route-time { color: var(--ink-900); font-size: 26px; font-weight: 950; line-height: 1; text-align: right; }
        .route-time span { display: block; color: var(--ink-450); font-size: 10px; font-weight: 900; text-transform: uppercase; }
        .micro-status { display: flex; align-items: center; justify-content: flex-start; justify-self: start; gap: 8px; padding: 8px; }

        .control-layout { display: grid; grid-template-columns: 1fr; grid-template-rows: auto auto minmax(0, 1fr) auto; gap: 14px; height: 100%; min-width: 0; }
        .lighting-panel { display: grid; align-content: stretch; min-height: 344px; padding: 18px; }
        .lighting-panel::after { display: none; }
        .lighting-shell { position: relative; display: grid; grid-template-rows: auto 1fr; gap: 14px; height: 100%; }
        .scope-strip { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-right: 52px; }
        .scope-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .lighting-icon { display: grid; place-items: center; flex: 0 0 auto; width: 96px; height: 96px; border-radius: 999px; background: linear-gradient(145deg, #2d2923, #151310); color: #f1bd69; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 18px 28px rgba(39, 31, 20, 0.18); }
        .lighting-icon svg { width: 54px; height: 54px; }
        .lighting-icon svg, .mode-icon svg, .status-icon svg, .nav-item svg { stroke: currentColor; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
        .scope-toggle { min-height: 48px; padding: 9px 15px; font-size: 16px; font-weight: 950; }
        .control-chip.is-pressed, .scene-button.is-pressed, .details-button.is-pressed { transform: translateY(1px) scale(0.985); box-shadow: inset 0 2px 8px rgba(20, 19, 17, 0.24); }
        .intensity-buttons { display: grid; align-content: end; gap: 10px; padding-right: 52px; }
        .primary-intensities { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .secondary-intensities { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
        .scene-button { display: grid; align-content: space-between; border: 1px solid rgba(20, 19, 17, 0.14); border-radius: var(--radius-control); background: linear-gradient(150deg, rgba(255, 255, 255, 0.78), rgba(232, 222, 205, 0.7)); color: var(--ink-900); font: inherit; text-align: left; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82), 0 8px 16px rgba(43, 36, 24, 0.08); transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease; }
        .scene-button.primary { min-height: 118px; padding: 16px; }
        .scene-button.secondary { min-height: 74px; padding: 11px 12px; }
        .scene-button strong { font-size: 28px; line-height: 1.15; font-weight: 950; white-space: nowrap; }
        .scene-button.secondary strong { font-size: 18px; }
        .scene-level { display: flex; gap: 4px; align-items: end; height: 32px; }
        .scene-level i { display: block; width: 8px; border-radius: 999px 999px 2px 2px; background: var(--brass-500); }
        .scene-button.secondary .scene-level { height: 24px; }
        .scene-button.secondary .scene-level i { width: 5px; }
        .scene-button.active { background: linear-gradient(150deg, #211e19, #3f3527); color: var(--stone-50); border-color: rgba(185, 129, 53, 0.48); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 10px 22px rgba(43, 36, 24, 0.14); }
        .scene-button.off strong { color: var(--red-500); }
        .scene-button.off.active strong { color: #f0b3a8; }
        .details-button { position: absolute; right: 0; bottom: 0; padding: 0; transition: transform 140ms ease, box-shadow 140ms ease; }

        .art-card { position: relative; display: grid; min-height: 300px; padding: 14px; background: linear-gradient(145deg, rgba(255, 253, 247, 0.95), rgba(226, 216, 199, 0.82)), repeating-linear-gradient(135deg, rgba(20, 19, 17, 0.03) 0, rgba(20, 19, 17, 0.03) 1px, transparent 1px, transparent 13px), var(--panel-solid); }
        .art-mat { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 18px; min-height: 100%; padding: 14px 18px; border: 1px solid rgba(20, 19, 17, 0.13); border-radius: 7px; background: radial-gradient(circle at 50% 38%, rgba(255, 251, 243, 0.9), transparent 45%), linear-gradient(145deg, rgba(248, 243, 235, 0.88), rgba(203, 187, 164, 0.42)), repeating-linear-gradient(135deg, rgba(20, 19, 17, 0.032) 0, rgba(20, 19, 17, 0.032) 1px, transparent 1px, transparent 12px); overflow: hidden; }
        .art-mat::before { content: ""; position: absolute; inset: 22px; border: 1px solid rgba(20, 19, 17, 0.08); border-radius: 6px; pointer-events: none; }
        .print-frame { position: relative; width: 168px; aspect-ratio: 4 / 5; padding: 10px; border-radius: 6px; background: linear-gradient(145deg, #11100e, #3c3328 54%, #15130f); box-shadow: 0 22px 42px rgba(34, 29, 21, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.14), inset 0 -1px 0 rgba(0, 0, 0, 0.46); }
        .print-frame::before { content: ""; position: absolute; inset: 6px; border: 1px solid rgba(185, 129, 53, 0.48); border-radius: 3px; pointer-events: none; z-index: 2; }
        .photo-window { position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 3px; background: #d8c8ad; }
        .photo-window img { width: 100%; height: 100%; display: block; object-fit: cover; object-position: 50% 47%; filter: grayscale(0.72) sepia(0.28) saturate(0.82) contrast(1.1) brightness(1.04); transform: scale(1.03); }
        .photo-window::before, .photo-window::after { content: ""; position: absolute; inset: 0; pointer-events: none; }
        .photo-window::before { background: linear-gradient(145deg, rgba(255, 245, 224, 0.26), rgba(53, 43, 31, 0.18)), radial-gradient(circle at 50% 35%, transparent 35%, rgba(22, 19, 14, 0.28) 100%); mix-blend-mode: multiply; }
        .photo-window::after { box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28), inset 0 0 34px rgba(20, 19, 17, 0.28); background: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.045) 0, rgba(255, 255, 255, 0.045) 1px, transparent 1px, transparent 5px); opacity: 0.58; }
        .media-mini { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; min-width: 0; padding: 12px 14px; border: 1px solid rgba(20, 19, 17, 0.1); border-radius: var(--radius-control); background: rgba(255, 255, 255, 0.5); color: var(--ink-600); font-size: 13px; font-weight: 850; }
        .media-mini strong { color: var(--ink-900); font-size: 15px; }
        .media-actions { display: flex; gap: 7px; }
        .small-button { min-width: 64px; }

        .bottom-dock { display: flex; align-items: center; justify-content: space-between; gap: 10px; grid-row: 4; min-width: 0; }
        .mode-dock { display: grid; grid-template-columns: 1fr; align-content: start; flex: 0 1 auto; padding: 6px; }
        .mode-block { display: flex; align-items: center; }
        .mode-icons { gap: 8px; flex-wrap: nowrap; }
        .mode-icon { position: relative; min-width: 84px; padding: 0 12px; font-size: 12px; }
        .mode-icon svg { width: 20px; height: 20px; }
        .nav { flex: 0 0 auto; width: auto; padding: 6px; }
        .nav-items { justify-content: flex-end; gap: 6px; }
        .nav-item { min-width: 76px; padding: 0 12px; color: var(--ink-600); font-size: 12px; }
        .nav-item svg { width: 16px; height: 16px; }

        .modal-backdrop { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 44px; background: rgba(20, 19, 17, 0.42); }
        .lightbox { display: grid; grid-template-rows: auto 1fr; width: min(760px, 86vw); min-height: min(520px, 74vh); border: 1px solid rgba(20, 19, 17, 0.18); border-radius: 12px; background: linear-gradient(145deg, rgba(255, 251, 243, 0.98), rgba(232, 222, 205, 0.96)); box-shadow: 0 30px 80px rgba(22, 20, 16, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.9); }
        .lightbox-head { display: flex; align-items: start; justify-content: space-between; gap: 18px; padding: 22px 24px 14px; border-bottom: 1px solid rgba(20, 19, 17, 0.1); }
        .lightbox h2 { margin: 0; font-size: 28px; line-height: 1; font-weight: 950; }
        .lightbox p { margin: 8px 0 0; color: var(--ink-450); font-size: 13px; font-weight: 900; text-transform: uppercase; }
        .lightbox-close { background: var(--control-active-bg); color: var(--stone-50); border-color: var(--control-active-border); }
        .lightbox-empty { margin: 22px 24px 24px; border: 1px dashed rgba(20, 19, 17, 0.18); border-radius: 8px; background: repeating-linear-gradient(135deg, rgba(20, 19, 17, 0.026) 0, rgba(20, 19, 17, 0.026) 1px, transparent 1px, transparent 12px); }

        @media (max-width: 920px) {
          :host { height: auto; min-height: 980px; }
          .foyer-dashboard { grid-template-columns: 1fr; min-height: 980px; overflow-y: auto; }
          .control-layout { grid-template-rows: auto; }
          .lighting-panel { min-height: auto; }
          .intensity-buttons { padding-right: 0; }
          .primary-intensities, .secondary-intensities { grid-template-columns: 1fr; }
          .details-button { position: static; justify-self: end; margin-top: 8px; }
          .bottom-dock { flex-wrap: wrap; }
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

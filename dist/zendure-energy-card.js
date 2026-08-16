/* Zendure Energy Card v0.2.0 */
(() => {
  "use strict";

  const TAG = "zendure-energy-card";
  const CARD_TYPE = TAG;
  const SUFFIX = {
    grid: "_grid_off_power",
    solar: "_solar_input_power",
    soc: "_electric_level",
    packs: "_pack_num",
  };

  const number = (value) => {
    if (value === null || value === undefined || value === "unknown" || value === "unavailable") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const round = (value) => Math.round(value);
  const watts = (value) => `${Math.max(0, round(value)).toLocaleString("de-DE")} W`;
  const percent = (value) => value == null ? "—" : `${Math.max(0, Math.min(100, round(value)))} %`;

  const sensorsBySuffix = (states, suffix) => Object.entries(states || {})
    .filter(([id]) => id.startsWith("sensor.") && id.endsWith(suffix))
    .map(([entityId, state]) => ({ entityId, state }));

  const baseId = (entityId, suffix) => entityId.slice(0, -suffix.length);

  function collectData(states) {
    const grids = sensorsBySuffix(states, SUFFIX.grid);
    const solars = sensorsBySuffix(states, SUFFIX.solar);
    const socs = sensorsBySuffix(states, SUFFIX.soc);
    const packs = sensorsBySuffix(states, SUFFIX.packs);
    const systemIds = [...new Set(socs.map((item) => baseId(item.entityId, SUFFIX.soc)))];

    let gridOff = 0;
    let solar = 0;

    for (const item of grids) {
      const value = number(item.state?.state);
      if (value == null) continue;
      if (value >= 0) gridOff += value;
      else solar += Math.abs(value);
    }

    for (const item of solars) {
      const value = number(item.state?.state);
      if (value != null) solar += Math.max(0, value);
    }

    const socValues = socs.map((item) => number(item.state?.state)).filter((v) => v != null);
    const soc = socValues.length ? socValues.reduce((sum, v) => sum + v, 0) / socValues.length : null;

    const systems = systemIds.map((systemId, index) => {
      const socSensor = socs.find((item) => baseId(item.entityId, SUFFIX.soc) === systemId);
      const packSensor = packs.find((item) => baseId(item.entityId, SUFFIX.packs) === systemId);
      const packValue = packSensor ? number(packSensor.state?.state) : null;
      return {
        id: systemId,
        index,
        soc: number(socSensor?.state?.state),
        batteries: packValue == null ? 1 : Math.max(1, round(packValue)),
      };
    });

    return {
      systems: systems.length,
      batteries: systems.reduce((sum, system) => sum + system.batteries, 0),
      gridOff,
      solar,
      soc,
      systemDetails: systems,
    };
  }

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  class ZendureEnergyCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._config = {};
      this._hass = null;
      this._signature = "";
    }

    setConfig(config) {
      if (!config || typeof config !== "object") throw new Error("Invalid Zendure Energy Card configuration");
      this._config = config;
      this._signature = "";
      this._render();
    }

    set hass(hass) {
      this._hass = hass;
      this._render();
    }

    getCardSize() { return 5; }
    getGridOptions() { return { rows: 5, columns: 6, min_rows: 4, min_columns: 3 }; }

    _render() {
      if (!this._hass?.states) return;
      const data = collectData(this._hass.states);
      const signature = JSON.stringify(data);
      if (signature === this._signature) return;
      this._signature = signature;

      const title = this._config.title ?? "";
      this.shadowRoot.innerHTML = `
        <style>
          :host{display:block;--z-bg:var(--ha-card-background,var(--card-background-color,#fff));--z-text:var(--primary-text-color,#202124);--z-secondary:var(--secondary-text-color,#70757d);--z-divider:var(--divider-color,rgba(127,127,127,.22));--z-house:color-mix(in srgb,var(--z-bg) 88%,var(--z-text));--z-house-side:color-mix(in srgb,var(--z-bg) 72%,var(--z-text));--z-roof:color-mix(in srgb,var(--z-text) 76%,#4b5560);--z-roof-edge:color-mix(in srgb,var(--z-text) 58%,#5c6670);--z-panel:#242a31;--z-panel-line:#7b858e;--z-solar:#ffd44d;--z-battery:#3de0c0;--z-grid:#9275ff;--z-accent:var(--primary-color,#03a9f4);--z-shadow:rgba(0,0,0,.18)}
          ha-card{overflow:hidden;position:relative;background:var(--z-bg);color:var(--z-text);border-radius:18px}.wrap{position:relative;min-height:350px;padding:18px;box-sizing:border-box}.title{position:absolute;z-index:5;right:18px;top:18px;max-width:42%;color:var(--z-secondary);font-size:11px;text-align:right;opacity:.9}.metric{position:absolute;z-index:5;line-height:1.05;pointer-events:none;text-shadow:0 1px 7px color-mix(in srgb,var(--z-bg) 55%,transparent)}.metric .value{font-size:clamp(21px,5.2vw,32px);font-weight:760;letter-spacing:-.04em}.metric .label{margin-top:5px;color:var(--z-secondary);font-size:clamp(10px,2.3vw,14px);font-weight:520}.metric.grid{left:20px;top:18px}.metric.solar{left:50%;top:15px;transform:translateX(-50%);text-align:center}.metric.soc{left:20px;bottom:15px}.metric.soc .value{color:var(--z-accent)}.scene{position:absolute;inset:58px 0 56px;display:grid;place-items:center}svg{width:100%;height:100%;max-width:700px;overflow:visible}.house-front{fill:var(--z-house);stroke:var(--z-divider);stroke-width:1.1}.house-side{fill:var(--z-house-side);stroke:var(--z-divider);stroke-width:1.1}.roof{fill:var(--z-roof);stroke:var(--z-roof-edge);stroke-width:1.1}.roof-edge{fill:var(--z-roof-edge)}.window{fill:color-mix(in srgb,#f7dca2 78%,var(--z-bg));stroke:color-mix(in srgb,#f7dca2 28%,var(--z-divider));stroke-width:1}.window-cross{stroke:color-mix(in srgb,var(--z-text) 25%,transparent);stroke-width:1}.panel{fill:var(--z-panel);stroke:#69737e;stroke-width:1;filter:drop-shadow(0 2px 2px var(--z-shadow))}.panel-line{stroke:var(--z-panel-line);stroke-width:.55;opacity:.55}.storage{fill:var(--z-text);stroke:color-mix(in srgb,var(--z-text) 32%,transparent);stroke-width:1;filter:drop-shadow(0 3px 3px var(--z-shadow))}.storage-face{fill:color-mix(in srgb,var(--z-text) 66%,var(--z-bg))}.storage-display{fill:color-mix(in srgb,var(--z-bg) 25%,#111827);stroke:color-mix(in srgb,var(--z-text) 30%,transparent)}.battery{fill:color-mix(in srgb,var(--z-bg) 18%,#69737e);stroke:color-mix(in srgb,var(--z-text) 32%,transparent);stroke-width:1;filter:drop-shadow(0 2px 2px var(--z-shadow))}.battery-cell{fill:var(--z-battery);opacity:.9}.flow-solar,.flow-battery,.flow-grid{fill:none;stroke-linecap:round;filter:drop-shadow(0 0 4px currentColor)}.flow-solar{stroke:var(--z-solar);color:var(--z-solar);stroke-width:3.5}.flow-battery{stroke:var(--z-battery);color:var(--z-battery);stroke-width:3.5}.flow-grid{stroke:var(--z-grid);color:var(--z-grid);stroke-width:3.5}.device-label{fill:var(--z-secondary);font-size:8px;font-weight:600;text-anchor:middle}.device-count{fill:var(--z-text);font-size:10px;font-weight:760;text-anchor:middle}.center-label{fill:var(--z-text);font-size:11px;font-weight:720;text-anchor:middle}.center-sub{fill:var(--z-secondary);font-size:7.5px;font-weight:560;text-anchor:middle;letter-spacing:.03em}.empty{fill:var(--z-secondary);font-size:12px;text-anchor:middle}@media(max-width:430px){.wrap{min-height:315px;padding:14px}.scene{inset:56px 0 51px}.metric.grid{left:15px}.metric.soc{left:15px}.metric .value{font-size:20px}.metric .label{font-size:9px}.title{right:15px}}
        </style>
        <ha-card><div class="wrap">
          ${title ? `<div class="title">${escapeHtml(title)}</div>` : ""}
          <div class="metric grid"><div class="value">${watts(data.gridOff)}</div><div class="label">Off-Grid-Steckdosenlast</div></div>
          <div class="metric solar"><div class="value">${watts(data.solar)}</div><div class="label">Solarleistung</div></div>
          <div class="metric soc"><div class="value">${percent(data.soc)}</div><div class="label">Batterie-SoC · ${data.batteries} Batterie${data.batteries === 1 ? "" : "n"}</div></div>
          <div class="scene">${this._svg(data)}</div>
        </div></ha-card>`;
    }

    _svg(data) {
      if (!data.systems) return `<svg viewBox="0 0 720 300" aria-label="Keine Zendure Speichersysteme gefunden"><text class="empty" x="360" y="150">Keine Zendure-Speichersysteme gefunden</text></svg>`;
      const maxSystems = Math.min(4, Math.max(1, Number(this._config.max_systems) || 4));
      const maxBatteries = Math.min(8, Math.max(1, Number(this._config.max_batteries) || 8));
      const systems = data.systemDetails.slice(0, maxSystems);
      const batteryCount = Math.min(data.batteries, maxBatteries);
      const systemXs = systems.length === 1 ? [360] : systems.map((_, i) => 255 + i * (210 / Math.max(1, systems.length - 1)));
      const batteryXs = batteryCount === 1 ? [360] : Array.from({length:batteryCount}, (_, i) => 215 + i * (290 / Math.max(1, batteryCount - 1)));
      const panels = Array.from({length:6}, (_, i) => { const x=260+(i%3)*55,y=66+Math.floor(i/3)*27; return `<g transform="skewX(-12)"><rect class="panel" x="${x}" y="${y}" width="48" height="23" rx="1.8"/>${Array.from({length:5},(_,c)=>`<line class="panel-line" x1="${x+8+c*8}" y1="${y}" x2="${x+8+c*8}" y2="${y+23}"/>`).join("")}<line class="panel-line" x1="${x}" y1="${y+11.5}" x2="${x+48}" y2="${y+11.5}"/></g>`; }).join("");
      const storages = systems.map((system, i) => { const x=systemXs[i],y=150,w=systems.length===1?62:50,h=62,level=system.soc==null?0:Math.max(0,Math.min(100,system.soc)),levelHeight=38*level/100; return `<g><rect class="storage" x="${x-w/2}" y="${y}" width="${w}" height="${h}" rx="5"/><rect class="storage-face" x="${x-w/2+6}" y="${y+7}" width="${w-12}" height="${h-14}" rx="3"/><rect class="storage-display" x="${x-10}" y="${y+12}" width="20" height="38" rx="2"/><rect class="battery-cell" x="${x-7}" y="${y+15+(38-levelHeight)}" width="14" height="${levelHeight}" rx="1"/><circle cx="${x}" cy="${y+55}" r="2.2" fill="var(--z-battery)"/><text class="device-count" x="${x}" y="${y+77}">Speicher ${i+1}</text></g>`; }).join("");
      const batteries = batteryXs.map((x,i)=>`<g><rect class="battery" x="${x-18}" y="222" width="36" height="26" rx="4"/><rect class="battery-cell" x="${x-13}" y="227" width="26" height="4" rx="2"/><rect class="battery-cell" x="${x-13}" y="235" width="20" height="4" rx="2"/><text class="device-label" x="${x}" y="260">Batterie ${i+1}</text></g>`).join("");
      return `<svg viewBox="0 0 720 300" role="img" aria-label="${escapeHtml(`${data.systems} Speichersysteme, ${data.batteries} Batterien`)}"><path class="house-front" d="M95 146 L155 103 L565 103 L625 146 L625 220 L95 220 Z"/><path class="house-side" d="M625 146 L655 166 L655 220 L625 220 Z"/><path class="roof" d="M65 148 L155 55 L565 55 L655 148 L625 164 L565 92 L155 92 L95 164 Z"/><path class="roof-edge" d="M155 92 L565 92 L625 164 L612 172 L555 105 L165 105 L108 172 L95 164 Z"/>${panels}<g><rect class="window" x="122" y="154" width="53" height="45" rx="2"/><line class="window-cross" x1="148.5" y1="154" x2="148.5" y2="199"/><line class="window-cross" x1="122" y1="176.5" x2="175" y2="176.5"/></g><g><rect class="window" x="530" y="154" width="45" height="45" rx="2"/><line class="window-cross" x1="552.5" y1="154" x2="552.5" y2="199"/><line class="window-cross" x1="530" y1="176.5" x2="575" y2="176.5"/></g><path class="flow-solar" d="M360 91 C360 115 360 126 360 150"/><path class="flow-battery" d="M360 212 C360 218 360 220 360 222"/><path class="flow-grid" d="M620 220 C570 242 525 246 470 232"/>${storages}${batteries}<text class="center-label" x="360" y="279">${data.systems} Speicher · ${data.batteries} Batterien</text><text class="center-sub" x="360" y="291">ZENDURE SOLARFLOW</text></svg>`;
    }
  }

  if (!customElements.get(TAG)) customElements.define(TAG, ZendureEnergyCard);
  window.customCards = window.customCards || [];
  if (!window.customCards.some((item) => item.type === CARD_TYPE)) window.customCards.push({type:CARD_TYPE,name:"Zendure Energy Card",description:"Visualisiert Zendure Solarleistung, Off-Grid-Leistung, Batterie-SoC und Speicher/Batterie-Anzahl.",preview:true,documentationURL:"https://github.com/leonsio/zendure-energy-card"});
})();

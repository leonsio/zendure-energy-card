/* Zendure Energy Card v0.4.0 - tall portrait redesign with animated energy flows */
(() => {
  "use strict";
  const TAG = "zendure-energy-card";
  const SUFFIX = { grid: "_grid_off_power", solar: "_solar_input_power", soc: "_electric_level", packs: "_pack_num" };
  const num = v => { if (v == null || ["unknown","unavailable"].includes(String(v))) return null; const n = Number(v); return Number.isFinite(n) ? n : null; };
  const clamp = (n,a=0,b=100) => Math.max(a,Math.min(b,n));
  const W = n => `${Math.max(0,Math.round(n || 0)).toLocaleString("de-DE")} W`;
  const P = n => n == null ? "—" : `${Math.round(clamp(n))} %`;
  const sensors = (states,suffix) => Object.entries(states||{}).filter(([id]) => id.startsWith("sensor.") && id.endsWith(suffix)).map(([entityId,state])=>({entityId,state}));
  const base = (id,suffix) => id.slice(0,-suffix.length);
  function data(states) {
    const grid=sensors(states,SUFFIX.grid), solar=sensors(states,SUFFIX.solar), socs=sensors(states,SUFFIX.soc), packs=sensors(states,SUFFIX.packs);
    let off=0, pv=0;
    grid.forEach(x=>{const v=num(x.state?.state); if(v==null)return; if(v>=0) off+=v; else pv+=Math.abs(v);});
    solar.forEach(x=>{const v=num(x.state?.state); if(v!=null)pv+=Math.max(0,v);});
    const systems=[...new Set(socs.map(x=>base(x.entityId,SUFFIX.soc)))].map((id,i)=>{const s=socs.find(x=>base(x.entityId,SUFFIX.soc)===id);const p=packs.find(x=>base(x.entityId,SUFFIX.packs)===id);return {id,index:i,soc:num(s?.state?.state),batteries:Math.max(1,Math.round(num(p?.state?.state) ?? 1))};});
    const levels=socs.map(x=>num(x.state?.state)).filter(v=>v!=null);
    return {gridOff:off,solar:pv,soc:levels.length?levels.reduce((a,b)=>a+b,0)/levels.length:null,systems,batteries:systems.reduce((a,s)=>a+s.batteries,0)};
  }
  const esc=v=>String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

  class ZendureEnergyCard extends HTMLElement {
    constructor(){super();this.attachShadow({mode:"open"});this._hass=null;this._config={};this._sig="";}
    setConfig(c){if(!c||typeof c!=="object")throw new Error("Invalid Zendure Energy Card configuration");this._config=c;this._sig="";this.render();}
    set hass(h){this._hass=h;this.render();}
    getCardSize(){return 12;}
    getGridOptions(){return {columns:6,rows:12,min_columns:3,min_rows:8};}
    render(){if(!this._hass?.states)return;const d=data(this._hass.states),sig=JSON.stringify(d);if(sig===this._sig)return;this._sig=sig;this.shadowRoot.innerHTML=`
      <style>
        :host{display:block;--bg:var(--ha-card-background,var(--card-background-color,#081018));--fg:var(--primary-text-color,#f5f7fa);--muted:var(--secondary-text-color,#a9b1bd);--line:var(--divider-color,rgba(255,255,255,.12));--solar:#ffd43b;--bat:#12e6b0;--load:#3e9bff;--grid:#a675ff;--panel:#18222c;--glass:rgba(7,14,22,.78)}
        ha-card{overflow:hidden;border-radius:22px;background:radial-gradient(circle at 50% 25%,rgba(30,55,76,.28),transparent 40%),var(--bg);color:var(--fg);box-shadow:0 8px 35px rgba(0,0,0,.18)}
        .card{position:relative;height:min(78vh,1050px);min-height:680px;display:flex;flex-direction:column;box-sizing:border-box;padding:14px 12px 12px;overflow:hidden}
        .top{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;z-index:4}.metric{min-width:0;padding:9px 8px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.025));backdrop-filter:blur(10px)}.metric .v{font-size:clamp(16px,4.7vw,29px);font-weight:800;letter-spacing:-.045em;white-space:nowrap}.metric .l{font-size:clamp(8px,2.4vw,12px);color:var(--muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.metric.solar .v{color:var(--solar)}.metric.grid .v{color:var(--grid)}.metric.load .v{color:var(--load)}
        .scene{position:relative;flex:1;min-height:0;margin:7px -12px 0}.scene svg{width:100%;height:100%;display:block}.house{fill:#111a22;stroke:rgba(255,255,255,.15);stroke-width:1}.room{fill:#18222b;stroke:rgba(255,255,255,.1);stroke-width:1}.roof{fill:#151e27;stroke:#56616d;stroke-width:1.2}.roofedge{fill:#29333e}.window{fill:#d8c49c;opacity:.86;stroke:#7c715d}.window2{fill:#b8d4ef;opacity:.65}.panel{fill:#1d2a37;stroke:#7b8793;stroke-width:.7}.cell{stroke:#596774;stroke-width:.35;opacity:.55}.inverter{fill:#68727c;stroke:#b8c0c8;stroke-width:1}.invface{fill:#202b35}.battery{fill:#59636d;stroke:#a9b1b8;stroke-width:.7}.batface{fill:#222d36}.screen{fill:#071018;stroke:#69d6ff;stroke-width:.5}.labelbox{fill:var(--glass);stroke:rgba(255,255,255,.13);stroke-width:.8}.label{fill:var(--fg);font-size:10px;font-weight:700;text-anchor:middle}.small{fill:var(--muted);font-size:7px;text-anchor:middle}.flow{fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:5 9;animation:flow 1.2s linear infinite;filter:drop-shadow(0 0 4px currentColor)}.solarflow{stroke:var(--solar);color:var(--solar);stroke-width:3}.batflow{stroke:var(--bat);color:var(--bat);stroke-width:3}.loadflow{stroke:var(--load);color:var(--load);stroke-width:3}.gridflow{stroke:var(--grid);color:var(--grid);stroke-width:3}.arrow{fill:currentColor;filter:drop-shadow(0 0 4px currentColor)}@keyframes flow{to{stroke-dashoffset:-28}}
        .bottom{z-index:4;display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:7px;margin-top:6px;padding:9px;border:1px solid var(--line);border-radius:17px;background:linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025));backdrop-filter:blur(12px)}.summary{min-width:0;padding:2px 8px;text-align:center;border-right:1px solid var(--line)}.summary:last-child{border:0}.big{font-size:clamp(18px,5vw,27px);font-weight:800}.sub{font-size:8px;color:var(--muted);margin-top:2px}.ring{width:55px;height:55px;border-radius:50%;margin:auto;display:grid;place-items:center;background:conic-gradient(var(--bat) calc(var(--soc)*1%),rgba(255,255,255,.13) 0);position:relative}.ring:after{content:"";position:absolute;inset:6px;border-radius:50%;background:var(--bg)}.ring span{z-index:1;font-size:12px;font-weight:800}.foot{text-align:center;color:var(--muted);font-size:8px;margin-top:5px;z-index:4}.legend{display:flex;justify-content:center;gap:13px;font-size:7px;color:var(--muted);margin-top:4px}.dot{display:inline-block;width:18px;height:3px;border-radius:4px;vertical-align:middle;margin-right:3px}.dsolar{background:var(--solar)}.dbat{background:var(--bat)}.dload{background:var(--load)}.dgrid{background:var(--grid)}
        @media(max-width:430px){.card{height:78vh;min-height:650px;padding:10px 8px 9px}.top{gap:5px}.metric{padding:7px 6px}.metric .v{font-size:clamp(15px,5vw,22px)}.scene{margin-left:-8px;margin-right:-8px}.bottom{gap:2px;padding:7px 4px}.summary{padding:2px 4px}.ring{width:48px;height:48px}.legend{gap:7px;font-size:6.5px}}
        @media(prefers-reduced-motion:reduce){.flow{animation:none}}
      </style>
      <ha-card><div class="card">
        <div class="top"><div class="metric grid"><div class="v">${W(d.gridOff)}</div><div class="l">Off-Grid-Last</div></div><div class="metric solar"><div class="v">${W(d.solar)}</div><div class="l">Solarertrag</div></div><div class="metric load"><div class="v">${W(d.gridOff+d.solar)}</div><div class="l">Systemleistung</div></div></div>
        <div class="scene">${this.svg(d)}</div>
        <div class="bottom"><div class="summary"><div class="ring" style="--soc:${d.soc==null?0:clamp(d.soc)}"><span>${P(d.soc)}</span></div><div class="sub">Batterie Ø SoC</div></div><div class="summary"><div class="big">${d.systems.length}</div><div class="sub">Speicher</div><div class="sub">${d.batteries} Batterie${d.batteries===1?"":"n"}</div></div><div class="summary"><div class="big">${W(d.gridOff)}</div><div class="sub">Off-Grid-Last</div><div class="sub">Zendure SolarFlow</div></div></div>
        <div class="foot">Werte werden automatisch aktualisiert</div><div class="legend"><span><i class="dot dsolar"></i>Solar</span><span><i class="dot dbat"></i>Batterie</span><span><i class="dot dload"></i>Verbrauch</span><span><i class="dot dgrid"></i>Netz</span></div>
      </div></ha-card>`;}

    svg(d){
      if(!d.systems.length)return `<svg viewBox="0 0 400 700"><text class="label" x="200" y="350">Keine Zendure-Speichersysteme gefunden</text></svg>`;
      const systems=d.systems.slice(0,Math.min(4,Number(this._config.max_systems)||4));
      const totalBat=Math.min(d.batteries,Math.min(8,Number(this._config.max_batteries)||8));
      const xs=systems.length===1?[200]:systems.map((_,i)=>70+i*(260/Math.max(1,systems.length-1)));
      const bxs=totalBat===1?[200]:Array.from({length:totalBat},(_,i)=>80+i*(240/Math.max(1,totalBat-1)));
      const panels=Array.from({length:8},(_,i)=>{const x=95+(i%4)*55,y=125+Math.floor(i/4)*38;return `<g><rect class="panel" x="${x}" y="${y}" width="50" height="32" rx="2"/>${Array.from({length:6},(_,c)=>`<line class="cell" x1="${x+7+c*7.2}" y1="${y}" x2="${x+7+c*7.2}" y2="${y+32}"/>`).join("")}<line class="cell" x1="${x}" y1="${y+16}" x2="${x+50}" y2="${y+16}"/></g>`}).join("");
      const storage=systems.map((s,i)=>{const x=xs[i],soc=clamp(s.soc??0),h=64,w=70;return `<g><rect class="inverter" x="${x-35}" y="270" width="70" height="80" rx="7"/><rect class="invface" x="${x-24}" y="280" width="48" height="58" rx="4"/><rect class="screen" x="${x-13}" y="288" width="26" height="23" rx="2"/><text class="small" x="${x}" y="304">${Math.round(soc)}%</text><circle cx="${x}" cy="324" r="3" fill="var(--bat)"/><text class="label" x="${x}" y="364">SolarFlow ${i+1}</text></g>`}).join("");
      const bats=bxs.map((x,i)=>`<g><rect class="battery" x="${x-28}" y="440" width="56" height="34" rx="5"/><rect class="batface" x="${x-22}" y="446" width="44" height="22" rx="3"/><rect x="${x-17}" y="451" width="34" height="4" rx="2" fill="var(--bat)"/><rect x="${x-17}" y="459" width="24" height="4" rx="2" fill="var(--bat)" opacity=".65"/><text class="small" x="${x}" y="488">Batterie ${i+1}</text></g>`).join("");
      return `<svg viewBox="0 0 400 650" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="room" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#25313c"/><stop offset="1" stop-color="#0d151d"/></linearGradient></defs>
        <path class="roof" d="M28 190 L72 78 L328 78 L372 190 Z"/><path class="roofedge" d="M28 190 L372 190 L360 202 L40 202 Z"/>${panels}
        <path class="house" d="M45 195 L355 195 L355 530 L45 530 Z"/><rect class="room" x="55" y="215" width="290" height="300" rx="2" fill="url(#room)"/>
        <rect class="window" x="70" y="235" width="62" height="90" rx="3"/><rect class="window2" x="268" y="235" width="62" height="90" rx="3"/><rect class="window" x="72" y="350" width="55" height="70" rx="3" opacity=".55"/>
        <rect class="labelbox" x="135" y="208" width="130" height="38" rx="10"/><text class="label" x="200" y="224">${W(d.solar)}</text><text class="small" x="200" y="237">Solarertrag</text>
        <path class="flow solarflow" d="M200 158 C200 205 200 220 200 270"/><path class="flow loadflow" d="M235 310 C275 310 285 310 315 310"/><path class="flow gridflow" d="M165 310 C130 310 110 310 72 310"/>
        <path class="flow batflow" d="M200 350 C200 385 200 415 200 440"/>
        <polygon class="arrow" style="color:var(--solar)" points="200,252 195,263 205,263"/><polygon class="arrow" style="color:var(--load)" points="310,310 300,305 300,315"/><polygon class="arrow" style="color:var(--grid)" points="82,310 92,305 92,315"/><polygon class="arrow" style="color:var(--bat)" points="200,430 195,419 205,419"/>
        <rect class="labelbox" x="15" y="285" width="105" height="42" rx="10"/><text class="label" x="67" y="301">${W(d.gridOff)}</text><text class="small" x="67" y="315">Off-Grid-Last</text>
        <rect class="labelbox" x="280" y="285" width="105" height="42" rx="10"/><text class="label" x="332" y="301">${W(d.gridOff+d.solar)}</text><text class="small" x="332" y="315">Verbrauch</text>
        ${storage}${bats}
        <rect class="labelbox" x="150" y="515" width="100" height="42" rx="10"/><text class="label" x="200" y="531">${P(d.soc)}</text><text class="small" x="200" y="545">Batterie Ø SoC</text>
        <text class="small" x="200" y="585">${systems.length} Speicher · ${d.batteries} Batterien</text>
      </svg>`;
    }
  }
  if(!customElements.get(TAG))customElements.define(TAG,ZendureEnergyCard);
  window.customCards=window.customCards||[];if(!window.customCards.some(x=>x.type===TAG))window.customCards.push({type:TAG,name:"Zendure Energy Card",description:"Tall animated Zendure SolarFlow energy dashboard",preview:true});
})();

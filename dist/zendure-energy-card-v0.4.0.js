/* Zendure Energy Card v0.4.0 - photographic background + live HTML/CSS overlays */
(() => {
  "use strict";
  const TAG="zendure-energy-card";
  const IMG=new URL("../assets/D8115BEE-72BC-416B-BF22-7CD8CAB89625.png",import.meta.url).href;
  const S={grid:"_grid_off_power",solar:"_solar_input_power",soc:"_electric_level",packs:"_pack_num"};
  const n=v=>{if(v==null||["unknown","unavailable"].includes(String(v)))return null;const x=Number(v);return Number.isFinite(x)?x:null};
  const clamp=(x,a=0,b=100)=>Math.max(a,Math.min(b,x));
  const W=x=>`${Math.max(0,Math.round(x||0)).toLocaleString("de-DE")} W`;
  const P=x=>x==null?"—":`${Math.round(clamp(x))} %`;
  const sensors=(states,suf)=>Object.entries(states||{}).filter(([id])=>id.startsWith("sensor.")&&id.endsWith(suf)).map(([entityId,state])=>({entityId,state}));
  const base=(id,suf)=>id.slice(0,-suf.length);
  function data(states){
    const grid=sensors(states,S.grid),solar=sensors(states,S.solar),socs=sensors(states,S.soc),packs=sensors(states,S.packs);let off=0,pv=0;
    grid.forEach(x=>{const v=n(x.state?.state);if(v==null)return;if(v>=0)off+=v;else pv+=Math.abs(v)});
    solar.forEach(x=>{const v=n(x.state?.state);if(v!=null)pv+=Math.max(0,v)});
    const systems=[...new Set(socs.map(x=>base(x.entityId,S.soc)))].map((id,i)=>{const s=socs.find(x=>base(x.entityId,S.soc)===id),p=packs.find(x=>base(x.entityId,S.packs)===id);return{id,index:i,soc:n(s?.state?.state),batteries:Math.max(1,Math.round(n(p?.state?.state)??1))}});
    const levels=socs.map(x=>n(x.state?.state)).filter(x=>x!=null);
    return{gridOff:off,solar:pv,soc:levels.length?levels.reduce((a,b)=>a+b,0)/levels.length:null,systems,batteries:systems.reduce((a,s)=>a+s.batteries,0)};
  }
  class Card extends HTMLElement{
    constructor(){super();this.attachShadow({mode:"open"});this._hass=null;this._config={};this._sig=""}
    setConfig(c){if(!c||typeof c!=="object")throw new Error("Invalid Zendure Energy Card configuration");this._config=c;this._sig="";this.render()}
    set hass(h){this._hass=h;this.render()}
    getCardSize(){return 12}
    getGridOptions(){return{columns:6,rows:12,min_columns:3,min_rows:8}}
    render(){if(!this._hass?.states)return;const d=data(this._hass.states),sig=JSON.stringify(d);if(sig===this._sig)return;this._sig=sig;
      const systems=d.systems.slice(0,Math.min(4,Number(this._config.max_systems)||4));
      const batteries=Math.min(d.batteries,Math.min(8,Number(this._config.max_batteries)||8));
      this.shadowRoot.innerHTML=`<style>
      :host{display:block;--fg:var(--primary-text-color,#fff);--muted:var(--secondary-text-color,#c2c8cf);--solar:#ffd83d;--bat:#17e5b1;--load:#55a9ff;--grid:#a67bff}
      ha-card{overflow:hidden;border-radius:22px;background:#0b1015;color:var(--fg);box-shadow:0 8px 35px rgba(0,0,0,.24)}
      .card{height:min(78vh,1050px);min-height:650px;position:relative;overflow:hidden;background:#0b1015}.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:fill;display:block}.overlay{position:absolute;inset:0;pointer-events:none}
      .top{position:absolute;z-index:5;top:10px;left:10px;right:10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}.metric,.bottom,.center,.value{background:rgba(6,12,18,.70);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(11px);box-shadow:0 5px 18px rgba(0,0,0,.22)}.metric{padding:8px 6px;border-radius:14px;min-width:0}.metric b{display:block;font-size:clamp(15px,4.7vw,27px);line-height:1;font-weight:850;letter-spacing:-.04em;white-space:nowrap}.metric span{display:block;margin-top:3px;font-size:clamp(7px,2.2vw,11px);color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.solar b{color:var(--solar)}.grid b{color:var(--grid)}.load b{color:var(--load)}
      .value{position:absolute;transform:translate(-50%,-50%);z-index:4;border-radius:13px;padding:6px 9px;text-align:center;white-space:nowrap}.value b{font-size:clamp(12px,3.8vw,20px)}.value span{display:block;font-size:7px;color:#d5dbe1;margin-top:2px}.solarv b{color:var(--solar)}
      .system{position:absolute;transform:translate(-50%,-50%);z-index:4;min-width:72px;padding:6px 7px;border-radius:11px;background:rgba(4,10,15,.74);border:1px solid rgba(255,255,255,.15);backdrop-filter:blur(8px);text-align:center}.system b{font-size:13px}.system span{display:block;font-size:7px;color:#d2d8de;margin-top:2px}.bar{height:4px;margin-top:4px;border-radius:5px;background:rgba(255,255,255,.15);overflow:hidden}.bar i{display:block;height:100%;background:var(--bat);border-radius:5px}
      .battery{position:absolute;transform:translate(-50%,-50%);z-index:4;width:59px;padding:5px 4px;border-radius:10px;background:rgba(4,10,15,.73);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(8px);text-align:center}.battery .icon{position:relative;width:29px;height:17px;margin:auto auto 3px;border:2px solid #aeb7bf;border-radius:4px;box-sizing:border-box}.battery .icon:after{content:"";position:absolute;right:-5px;top:4px;width:3px;height:6px;background:#aeb7bf;border-radius:1px}.battery .fill{position:absolute;left:2px;bottom:2px;height:9px;width:var(--level);background:var(--bat);border-radius:2px}.battery b{font-size:10px}.battery span{display:block;font-size:7px;color:#d5dbe0}
      .flow{position:absolute;height:4px;border-radius:9px;overflow:hidden;z-index:3;filter:drop-shadow(0 0 5px currentColor);opacity:.95}.flow:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 9px,currentColor 9px 17px);background-size:34px 100%;animation:flow 1s linear infinite}.solarflow{color:var(--solar);background:rgba(255,216,61,.18)}.batflow{color:var(--bat);background:rgba(23,229,177,.18)}.loadflow{color:var(--load);background:rgba(85,169,255,.18)}.gridflow{color:var(--grid);background:rgba(166,123,255,.18)}.reverse:after{animation-direction:reverse}@keyframes flow{to{background-position:34px 0}}
      .center{position:absolute;left:50%;bottom:103px;transform:translateX(-50%);z-index:5;border-radius:14px;padding:7px 13px;text-align:center;white-space:nowrap}.center b{font-size:clamp(13px,4vw,20px)}.center span{display:block;font-size:7px;color:var(--muted);margin-top:2px}
      .bottom{position:absolute;z-index:5;left:10px;right:10px;bottom:10px;border-radius:17px;padding:7px 4px;display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:2px}.summary{text-align:center;border-right:1px solid rgba(255,255,255,.13);min-width:0}.summary:last-child{border:0}.big{font-size:clamp(17px,5vw,27px);font-weight:850}.sub{font-size:7px;color:var(--muted);margin-top:2px}.ring{width:48px;height:48px;margin:auto;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--bat) calc(var(--soc)*1%),rgba(255,255,255,.13) 0);position:relative}.ring:after{content:"";position:absolute;inset:5px;border-radius:50%;background:rgba(6,12,18,.88)}.ring span{z-index:1;font-size:11px;font-weight:850}.foot{position:absolute;bottom:2px;left:0;right:0;text-align:center;font-size:6px;color:rgba(255,255,255,.65);z-index:6}
      @media(max-width:430px){.card{height:78vh;min-height:650px}.top{top:8px;left:8px;right:8px;gap:5px}.metric{padding:7px 5px}.bottom{left:8px;right:8px;bottom:8px}.system{min-width:65px}.battery{width:55px}.center{bottom:101px}}
      @media(prefers-reduced-motion:reduce){.flow:after{animation:none}}
      </style><ha-card><div class="card"><img class="bg" src="${IMG}" alt="Zendure SolarFlow"><div class="overlay">
      <div class="top"><div class="metric grid"><b>${W(d.gridOff)}</b><span>Off-Grid-Last</span></div><div class="metric solar"><b>${W(d.solar)}</b><span>Solarleistung</span></div><div class="metric load"><b>${W(d.gridOff+d.solar)}</b><span>Gesamtfluss</span></div></div>
      <div class="value solarv" style="left:50%;top:27%"><b>${W(d.solar)}</b><span>Solarleistung</span></div>
      ${systems.map((s,i)=>{const x=systems.length===1?50:18+i*64/(systems.length-1),soc=clamp(s.soc??0);return `<div class="system" style="left:${x}%;top:54%"><b>${Math.round(soc)}%</b><span>SolarFlow ${i+1}</span><div class="bar"><i style="width:${soc}%"></i></div></div>`}).join("")}
      ${Array.from({length:batteries},(_,i)=>{const x=batteries===1?50:14+i*72/(batteries-1),sys=systems[Math.min(systems.length-1,Math.floor(i*systems.length/Math.max(1,batteries)))],soc=clamp(sys?.soc??d.soc??0);return `<div class="battery" style="left:${x}%;top:68%;--level:${soc}%"><div class="icon"><i class="fill"></i></div><b>${Math.round(soc)}%</b><span>Batterie ${i+1}</span></div>`}).join("")}
      <div class="flow solarflow" style="left:49%;top:37%;width:2%;transform:rotate(90deg)"></div><div class="flow batflow reverse" style="left:49%;top:58%;width:10%;transform:rotate(90deg)"></div><div class="flow loadflow" style="left:57%;top:53%;width:18%"></div><div class="flow gridflow reverse" style="left:25%;top:53%;width:18%"></div>
      <div class="center"><b>${systems.length} Speicher · ${batteries} Batterien</b><span>Zendure SolarFlow</span></div>
      </div><div class="bottom"><div class="summary"><div class="ring" style="--soc:${d.soc==null?0:clamp(d.soc)}"><span>${P(d.soc)}</span></div><div class="sub">Ø Batterie SoC</div></div><div class="summary"><div class="big">${d.systems.length}</div><div class="sub">Speicher</div><div class="sub">${d.batteries} Batterie${d.batteries===1?"":"n"}</div></div><div class="summary"><div class="big">${W(d.gridOff)}</div><div class="sub">Off-Grid-Last</div><div class="sub">Zendure SolarFlow</div></div></div><div class="foot">Zendure Energy Card · Live</div></div></ha-card>`;
    }
  }
  if(!customElements.get(TAG))customElements.define(TAG,Card);
  window.customCards=window.customCards||[];
  if(!window.customCards.some(x=>x.type===TAG))window.customCards.push({type:TAG,name:"Zendure Energy Card",description:"Zendure SolarFlow card with photographic background and live animated overlays",preview:true});
})();

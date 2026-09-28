// Alignment panel for the prologue zoom. Loaded only when the URL contains ?calibrate.
// Tuned values persist in this browser (localStorage) until exported into layers.json.
const KEY='grand-archive-voyage:calibration:v1';
const pct=v=>(v*100).toFixed(1)+'%';
const FIELDS=[
 ['focalX','Target X',0.3,0.7,0.0005,v=>(v*100).toFixed(2)+'%'],
 ['focalY','Target Y',0.3,0.7,0.0005,v=>(v*100).toFixed(2)+'%'],
 ['scale','Scale',2,12,0.01,v=>v.toFixed(2)+'x'],
 ['offsetX','Offset X',-300,300,1,v=>(v>0?'+':'')+v+'px'],
 ['offsetY','Offset Y',-300,300,1,v=>(v>0?'+':'')+v+'px'],
 ['blendStart','Blend start',0,1,0.005,pct],
 ['blendEnd','Blend end',0,1,0.005,pct],
 ['feather','Edge feather',0,0.25,0.005,pct],
];
const CSS=`#calib{position:fixed;right:12px;bottom:84px;z-index:200;width:min(340px,calc(100vw - 24px));max-height:calc(100svh - 120px);overflow:auto;background:rgba(10,14,16,.92);color:#eee;font:12px/1.4 'Space Mono',monospace;border:1px solid #fff3;border-radius:10px;padding:12px;backdrop-filter:blur(6px)}
#calib.min>:not(header){display:none}#calib header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-weight:700}
#calib label{display:grid;grid-template-columns:92px 1fr 64px;gap:8px;align-items:center;margin:5px 0}#calib input[type=range]{width:100%}
#calib .row{display:flex;flex-wrap:wrap;gap:8px 14px;margin:8px 0}#calib button{border:1px solid #fff5;border-radius:6px;padding:5px 8px;color:#eee}
#calib .out{opacity:.75;font-size:11px}#calib textarea{width:100%;height:120px;background:#000;color:#9f9;font:10px monospace}
#calib-drag{position:fixed;inset:0;z-index:150;cursor:move;touch-action:none}`;

export function startCalibration(zoom,onRebuild=()=>{}){
 const config=zoom.config;
 const pairs=config.layers.map((l,i)=>({l,i})).filter(({l,i})=>l.match&&i<config.layers.length-1);
 if(!pairs.length)return;
 const fileValues=JSON.parse(JSON.stringify(pairs.map(({l})=>l.match)));
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');pairs.forEach(({l})=>{if(saved[l.id])Object.assign(l.match,saved[l.id]);});}catch{}
 zoom.rebuild();onRebuild();
 let current=0,scrubP=0.9,scrubbing=true;
 const m=()=>pairs[current].l.match;

 document.head.insertAdjacentHTML('beforeend',`<style>${CSS}</style>`);
 const panel=document.createElement('div');panel.id='calib';
 panel.innerHTML=`<header><span>ZOOM CALIBRATION</span><button data-a="min">–</button></header>
 <label>Transition<select id="c-pair">${pairs.map(({l,i})=>`<option value="${i}">${i+1} → ${i+2} (${l.id})</option>`).join('')}</select><span></span></label>
 <label>Progress<input id="c-p" type="range" min="0" max="1" step="0.001"><span id="c-pv"></span></label>
 <div class="row"><label style="display:flex;gap:6px;margin:0"><input id="c-scrub" type="checkbox" checked>Scrub (ignore scroll)</label>
 <label style="display:flex;gap:6px;margin:0"><input id="c-ghost" type="checkbox">Ghost 50%</label>
 <label style="display:flex;gap:6px;margin:0"><input id="c-drag" type="checkbox">Drag to align</label></div>
 ${FIELDS.map(([k,t,a,b,s])=>`<label>${t}<input data-k="${k}" type="range" min="${a}" max="${b}" step="${s}"><input data-n="${k}" type="number" step="${s}" style="width:64px;background:#000;color:#eee;border:1px solid #fff3"></label>`).join('')}
 <div class="out" id="c-out"></div>
 <div class="row"><button data-a="copy">Copy JSON</button><button data-a="download">Download layers.json</button><button data-a="reset">Reset to file</button></div>
 <textarea id="c-json" readonly hidden></textarea>`;
 document.body.append(panel);
 const $=s=>panel.querySelector(s);
 const drag=document.createElement('div');drag.id='calib-drag';drag.hidden=true;document.body.append(drag);

 function sync(){
  FIELDS.forEach(([k,,,,,f])=>{$(`[data-k="${k}"]`).value=m()[k];$(`[data-n="${k}"]`).value=m()[k];});
  $('#c-p').value=scrubP;
 }
 function save(){const all={};pairs.forEach(({l})=>all[l.id]=l.match);try{localStorage.setItem(KEY,JSON.stringify(all));}catch{}}
 function update(){
  zoom.setScrub(scrubbing?{seg:pairs[current].i,p:scrubP}:null);
  const s=zoom.state;
  $('#c-pv').textContent=scrubP.toFixed(3);
  $('#c-out').innerHTML=FIELDS.map(([k,t,,,,f])=>`${t} ${f(m()[k])}`).join(' · ')+`<br>live: segment ${s.seg+1} · p ${s.p.toFixed(3)} · zoom ${s.Z.toFixed(2)}x · next opacity ${s.nextOpacity.toFixed(2)}`;
 }
 function set(k,v){v=+v;if(Number.isNaN(v))return;m()[k]=v;if(k==='scale')zoom.rebuild();onRebuild();save();sync();update();}

 panel.addEventListener('input',e=>{const t=e.target;
  if(t.dataset.k)set(t.dataset.k,t.value);else if(t.dataset.n)set(t.dataset.n,t.value);
  else if(t.id==='c-p'){scrubP=+t.value;update();}
  else if(t.id==='c-scrub'){scrubbing=t.checked;$('#c-drag').checked&&!scrubbing&&($('#c-drag').click());update();}
  else if(t.id==='c-ghost'){zoom.setGhost(t.checked);update();}
  else if(t.id==='c-drag'){drag.hidden=!t.checked;}
  else if(t.id==='c-pair'){current=pairs.findIndex(x=>x.i===+t.value);sync();update();}});
 panel.addEventListener('click',e=>{const a=e.target.dataset.a;if(!a)return;
  const json=JSON.stringify(config,null,2)+'\n';
  if(a==='min')panel.classList.toggle('min');
  if(a==='copy'){const box=$('#c-json');box.hidden=false;box.value=json;box.select();navigator.clipboard?.writeText(json).catch(()=>{});}
  if(a==='download'){const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='layers.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  if(a==='reset'){pairs.forEach(({l},j)=>Object.assign(l.match,fileValues[j]));zoom.rebuild();onRebuild();save();sync();update();}});

 // Dragging moves the next image relative to the current one by shifting the target point.
 let last=null;
 drag.addEventListener('pointerdown',e=>{last=[e.clientX,e.clientY];drag.setPointerCapture(e.pointerId);});
 drag.addEventListener('pointermove',e=>{if(!last)return;const s=zoom.state,dx=e.clientX-last[0],dy=e.clientY-last[1];last=[e.clientX,e.clientY];
  m().focalX+=dx/(s.Z*s.c)/s.W;m().focalY+=dy/(s.Z*s.c)/s.H;save();sync();update();});
 drag.addEventListener('pointerup',()=>{last=null;});

 sync();update();
}

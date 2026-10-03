// Other worlds (four doors that open wide on hover or tap) and the Ohara Library (columns of art
// drifting at different speeds as you pass, transform only).
import {$,esc,pic,data,part,through,view,motion,coarse} from '../core.js';
import {registerCollection,openCollection} from '../dialogs.js';

export function initWorlds(){
 const W=data.media.worlds,doors=$('#doors');
 registerCollection('world',i=>{const w=W[+i];return{title:w.name,eyebrow:w.series,ids:w.all};});
 doors.innerHTML=W.map((w,i)=>`<button class="door${i===0?' open':''}" data-door="${i}" aria-label="${esc(w.name)}, ${esc(w.series)}">${pic(w.cover,{alt:w.name,sizes:'(max-width:820px) 100vw, 60vw'})}<span class="door-copy"><small>${esc(w.series)}</small><b>${esc(w.name)}</b><span class="door-more">${w.all.length} photos →</span></span></button>`).join('');
 const all=[...doors.children];
 const open=d=>all.forEach(x=>x.classList.toggle('open',x===d));
 doors.addEventListener('pointerenter',e=>{const d=e.target.closest&&e.target.closest('.door');if(d&&!coarse)open(d);},true);
 doors.addEventListener('click',e=>{const d=e.target.closest('.door');if(!d)return;
  if(!d.classList.contains('open')){open(d);return;}
  openCollection(`world:${d.dataset.door}`);
 });
}

export function initLibrary(){
 const wall=$('#art-wall'),ids=data.media.wall;
 const SPEEDS=[-0.22,0.1,-0.34,0.04];
 let cols=[];
 function build(){const prev=wall.dataset.cols;const n=view.vw<=820?2:4,c=Array.from({length:n},()=>[]);ids.forEach((id,i)=>c[i%n].push(`<button data-view="wall" data-id="${id}" aria-label="Open artwork">${pic(id,{sizes:n===2?'50vw':'25vw'})}</button>`));wall.innerHTML=c.map(x=>`<div class="art-col">${x.join('')}</div>`).join('');wall.dataset.cols=n;cols=[...wall.children];if(prev)wall.querySelectorAll('img').forEach(i=>i.loading='eager');}
// The columns drift with transforms, which can hide them from native lazy-loading: load ahead instead.
 build();
 new IntersectionObserver(([e],io)=>{if(e.isIntersecting){wall.querySelectorAll('img').forEach(i=>{i.loading='eager';});io.disconnect();}},{rootMargin:'200% 0px'}).observe(wall);
 part({el:wall,measure(){if(String(view.vw<=820?2:4)!==wall.dataset.cols)build();},update(s){const q=through(this,s);cols.forEach((c,i)=>{c.style.transform=motion.reduced?'':`translate3d(0,${((q-0.5)*SPEEDS[i%4]*view.vh*1.4).toFixed(1)}px,0)`;});}});
}

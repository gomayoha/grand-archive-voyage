// 06 · The Anime Journey: every anime he has watched, in the order of his watch-list note
// (MY ANIME WATCH LIST.md → data/shelf.json), laid out along a sea route. A small ship sails down
// the line with the scroll and each stop lights up as the ship passes. What's still ahead (his
// want-to-watch list) waits on the horizon, and the route ends at his CURRENT SAVE FILE.
// Reorder the note and the route follows on the next sync.
import {$,$$,esc,pad,clamp,view,part,absTop,motion,data,onSight} from '../core.js';
import {openDialog} from '../dialogs.js';

const SHIP=`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 40h48l-7 11H15z" fill="#f3c969" stroke="#1a1208" stroke-width="2.5" stroke-linejoin="round"/><path d="M31 8v32" stroke="#1a1208" stroke-width="2.5"/><path d="M33 11c10 3 15 10 15 22H33z" fill="#fff" stroke="#1a1208" stroke-width="2.5" stroke-linejoin="round"/><circle cx="40" cy="24" r="4.2" fill="#1a1208"/><path d="M36 29l8 0M36 31.5l8-5M36 26.5l8 5" stroke="#1a1208" stroke-width="1.6"/><path d="M30 11c-8 3-12 10-12 22h12z" fill="#efe6d2" stroke="#1a1208" stroke-width="2.5" stroke-linejoin="round"/><path d="M27 6h8l-4 -3z" fill="#e0453a"/></svg>`;
const first=t=>String(t||'').split(/(?<=[.!?])\s/)[0];
const num=s=>{const n=parseFloat(s);return /^\d/.test(String(s))&&!isNaN(n)?n:null;};

export function initRoute(){
 const {shelf,posters}=data,R=data.route||{};
 const list=shelf.anime.filter(a=>a.status!=='want'),ahead=shelf.anime.filter(a=>a.status==='want');
 const poster=a=>posters[`anime:${a.t}`];
 const stops=$('#route-stops'),route=$('#route'),fill=$('#route-fill'),ship=$('#route-ship');
 ship.innerHTML=SHIP;
 $('#route-count').textContent=`${list.length} stories so far, in the order I watched them.`;
 stops.innerHTML=list.map((a,i)=>{const p=poster(a),n=num(a.s),st=a.status==='watching'?`Watching${a.progress?' · '+a.progress:''}`:a.status==='paused'?'On pause':'Completed';
  return `<li class="stop${i%2?' r':''}" style="--c:${(p&&p.color)||'#444'}">
   <span class="stop-node" aria-hidden="true"><b>${pad(i+1)}</b></span>
   <button class="stop-card" data-anime="${i}">
    <span class="sc-poster">${p?`<img src="${esc(p.img)}" alt="" loading="lazy" decoding="async">`:''}</span>
    <span class="sc-body"><small>${esc(st)}</small><b>${esc(a.t)}</b>${n!==null?`<em class="sc-score">${esc(String(a.s).replace('*',''))}<i>/10</i></em>`:''}<span class="sc-line">${esc(a.tagline||first(a.b))}</span></span>
   </button></li>`;}).join('');
 $('#route-ahead').innerHTML=ahead.length?`<p class="eyebrow">On the horizon · ${ahead.length} still to watch</p><div class="ahead-row">${ahead.map(a=>{const p=poster(a);return `<span class="ahead" title="${esc(a.t)}">${p?`<img src="${esc(p.img)}" alt="" loading="lazy" decoding="async">`:''}<small>${esc(a.t)}</small></span>`;}).join('')}</div>`:'';
 const nodes=$$('.stop');
 nodes.forEach(n=>onSight(n,t=>t.classList.add('is-in'),'0px 0px -10% 0px'));
 stops.addEventListener('click',e=>{const b=e.target.closest('[data-anime]');if(!b)return;const a=list[+b.dataset.anime],p=poster(a),n=num(a.s);
  openDialog(`<div class="rec-layout rec-poster">${p?`<img src="${esc(p.img)}" alt="${esc(a.t)} cover" style="aspect-ratio:auto">`:''}<div><p class="eyebrow">Anime Journey · No. ${pad(+b.dataset.anime+1)}</p><h2 id="dialog-title">${esc(a.t)}</h2>${a.s?`<p class="big-score">${esc(a.s)}${n!==null?' <small>/ 10</small>':''}</p>`:''}${a.tagline?`<p class="rec-tagline">“${esc(a.tagline)}”</p>`:''}${a.b?`<p>${esc(a.b)}</p>`:''}${a.ratingNote?`<p class="subtle">${esc(a.ratingNote)}</p>`:''}<p class="subtle">From my watch list${p?'. Cover art: AniList.':'.'}</p></div></div>`);});

 // The ship rides the line at the middle of the screen; stops it has passed stay lit.
 part({el:route,measure(){this.nodes=nodes.map(n=>absTop(n.querySelector('.stop-node'))-this.top);},update(s){
  const y=clamp(s+view.vh*0.55-this.top,0,this.h);
  fill.style.transform=`scaleY(${(y/this.h).toFixed(4)})`;
  ship.style.transform=`translate3d(-50%,${(y-28).toFixed(1)}px,0) rotate(${(Math.sin(y/60)*4).toFixed(2)}deg)`;
  this.nodes.forEach((t,i)=>{const on=y>=t;if(nodes[i]._on!==on){nodes[i]._on=on;nodes[i].classList.toggle('lit',on);}});
 }});

 // The save file types itself out the first time it's seen.
 const save=$('#save'),lines=R.save||[];
 if(!lines.length){save.hidden=true;return;}
 save.innerHTML=`<span class="save-head">■ CURRENT SAVE FILE</span>\n`;
 onSight(save,()=>{
  const full=lines.join('\n')+'\n\nTO BE CONTINUED… ☠️';
  if(motion.reduced){save.insertAdjacentText('beforeend',full);return;}
  const out=document.createElement('span');save.append(out);const cur=document.createElement('i');cur.className='caret';save.append(cur);
  let n=0;const tick=()=>{n+=2;out.textContent=full.slice(0,n);if(n<full.length)setTimeout(tick,18);};tick();
 },'0px 0px -20% 0px');
}

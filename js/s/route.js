// 06 · The Anime Journey: every anime he has watched, in the order of his watch-list note
// (MY ANIME WATCH LIST.md → data/shelf.json), drawn as an old sea chart. Each story is an island with
// its poster pasted beside it; the route is inked in behind a small ship as you scroll, and islands
// turn to land once the ship has passed. What's still ahead (his want-to-watch list) lies beyond the
// edge of the map, and the route ends at his CURRENT SAVE FILE. Reorder the note and the chart follows.
// Only the stretch of route being inked repaints; the rest is drawn once.
import {$,$$,esc,pad,clamp,view,part,absTop,motion,data,onSight} from '../core.js';
import {openDialog} from '../dialogs.js';

const SHIP=`<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 40h48l-7 11H15z" fill="#f3c969" stroke="#1a1208" stroke-width="2.5" stroke-linejoin="round"/><path d="M31 8v32" stroke="#1a1208" stroke-width="2.5"/><path d="M33 11c10 3 15 10 15 22H33z" fill="#fff" stroke="#1a1208" stroke-width="2.5" stroke-linejoin="round"/><circle cx="40" cy="24" r="4.2" fill="#1a1208"/><path d="M36 29l8 0M36 31.5l8-5M36 26.5l8 5" stroke="#1a1208" stroke-width="1.6"/><path d="M30 11c-8 3-12 10-12 22h12z" fill="#efe6d2" stroke="#1a1208" stroke-width="2.5" stroke-linejoin="round"/><path d="M27 6h8l-4 -3z" fill="#e0453a"/></svg>`;
const ROSE=`<svg class="chart-rose" viewBox="-60 -60 120 120" aria-hidden="true"><g fill="none" stroke="#3b2a17" stroke-width=".8" opacity=".55"><circle r="54"/><circle r="47"/><circle r="20"/></g><g class="rose-star"><path d="M0-52 6-6 0 0-6-6Z" fill="#3b2a17"/><path d="M0 52 6 6 0 0-6 6Z" fill="#a2865a"/><path d="M52 0 6 6 0 0 6-6Z" fill="#a2865a"/><path d="M-52 0-6 6 0 0-6-6Z" fill="#3b2a17"/><path d="M28-28 4 0 0 0 0-4Z" fill="#7a5c34" opacity=".7"/><path d="M-28 28-4 0 0 0 0 4Z" fill="#7a5c34" opacity=".7"/><path d="M28 28 0 4 0 0 4 0Z" fill="#c9b07e"/><path d="M-28-28 0-4 0 0-4 0Z" fill="#c9b07e"/></g><text y="-38" text-anchor="middle" font-family="Georgia,serif" font-size="9" fill="#3b2a17">N</text></svg>`;
const first=t=>String(t||'').split(/(?<=[.!?])\s/)[0];
const num=s=>{const n=parseFloat(s);return /^\d/.test(String(s))&&!isNaN(n)?n:null;};

// An island coastline, the same for the same stop every time (seeded), as a smooth closed curve.
function island(i){
 let s=(i+1)*7919;const r=()=>((s=(s*16807)%2147483647)/2147483647);
 const n=9,pts=[];for(let k=0;k<n;k++){const a=k/n*Math.PI*2+r()*0.3,rad=30+r()*15;pts.push([Math.cos(a)*rad*1.3,Math.sin(a)*rad*0.82]);}
 const f=v=>v.toFixed(1);let d=`M${f(pts[0][0])} ${f(pts[0][1])}`;
 for(let k=0;k<n;k++){const p0=pts[(k-1+n)%n],p1=pts[k],p2=pts[(k+1)%n],p3=pts[(k+2)%n];
  d+=`C${f(p1[0]+(p2[0]-p0[0])/6)} ${f(p1[1]+(p2[1]-p0[1])/6)} ${f(p2[0]-(p3[0]-p1[0])/6)} ${f(p2[1]-(p3[1]-p1[1])/6)} ${f(p2[0])} ${f(p2[1])}`;}
 return d+'Z';
}

export function initRoute(){
 const {shelf,posters}=data,R=data.route||{};
 const list=shelf.anime.filter(a=>a.status!=='want'),ahead=shelf.anime.filter(a=>a.status==='want');
 const poster=a=>posters[`anime:${a.t}`];
 const stops=$('#route-stops'),route=$('#route'),svg=$('#route-svg'),ship=$('#route-ship');
 ship.innerHTML=SHIP;$('#chart-rose').innerHTML=ROSE;
 $('#route-count').textContent=`${list.length} stories so far, in the order I watched them.`;
 stops.innerHTML=list.map((a,i)=>{const p=poster(a),n=num(a.s),st=a.status==='watching'?`Watching${a.progress?' · '+a.progress:''}`:a.status==='paused'?'On pause':'Completed';const d=island(i);
  return `<li class="stop${i%2?' r':''}" style="--tilt:${(((i*37)%9)-4)*0.5}deg">
   <span class="stop-isle" aria-hidden="true"><svg viewBox="-70 -50 140 100"><path class="isle-land" d="${d}"/><path class="isle-contour" d="${d}" transform="scale(.72)"/></svg><b>${pad(i+1)}</b></span>
   <button class="stop-card" data-anime="${i}">
    <span class="sc-poster">${p?`<img src="${esc(p.img)}" alt="" loading="lazy" decoding="async">`:''}</span>
    <span class="sc-body"><small>${esc(st)}</small><b>${esc(a.t)}</b>${n!==null?`<em class="sc-score">${esc(String(a.s).replace('*',''))}<i>/10</i></em>`:''}<span class="sc-line">${esc(a.tagline||first(a.b))}</span></span>
   </button></li>`;}).join('');
 $('#route-ahead').innerHTML=ahead.length?`<p class="ahead-k">Beyond the edge of the map · ${ahead.length} still to watch</p><div class="ahead-row">${ahead.map(a=>{const p=poster(a);return `<span class="ahead" title="${esc(a.t)}">${p?`<img src="${esc(p.img)}" alt="" loading="lazy" decoding="async">`:''}<small>${esc(a.t)}</small></span>`;}).join('')}</div>`:'';
 const nodes=$$('.stop');
 nodes.forEach(n=>onSight(n,t=>t.classList.add('is-in'),'0px 0px -10% 0px'));
 stops.addEventListener('click',e=>{const b=e.target.closest('[data-anime]');if(!b)return;const a=list[+b.dataset.anime],p=poster(a),n=num(a.s);
  openDialog(`<div class="rec-layout rec-poster">${p?`<img src="${esc(p.img)}" alt="${esc(a.t)} cover" style="aspect-ratio:auto">`:''}<div><p class="eyebrow">Anime Journey · No. ${pad(+b.dataset.anime+1)}</p><h2 id="dialog-title">${esc(a.t)}</h2>${a.s?`<p class="big-score">${esc(a.s)}${n!==null?' <small>/ 10</small>':''}</p>`:''}${a.tagline?`<p class="rec-tagline">“${esc(a.tagline)}”</p>`:''}${a.b?`<p>${esc(a.b)}</p>`:''}${a.ratingNote?`<p class="subtle">${esc(a.ratingNote)}</p>`:''}<p class="subtle">From my watch list${p?'. Cover art: AniList.':'.'}</p></div></div>`);});

 // The route: one curve per leg (start → island 1 → … → the save file), drawn in pencil, then inked over
 // as the ship sails the leg. Each leg keeps a few samples of (length, y) so the ship can find its place.
 const NS='http://www.w3.org/2000/svg',rose=$('.rose-star');let legs=[],isleY=[],roseAt=99;
 part({el:route,measure(){
  const W=route.clientWidth,H=route.offsetHeight,rt=route.getBoundingClientRect();
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('width',W);svg.setAttribute('height',H);svg.textContent='';
  const pts=nodes.map(n=>{const b=n.querySelector('.stop-isle').getBoundingClientRect();return[b.left+b.width/2-rt.left,b.top+b.height/2-rt.top];});
  isleY=pts.map(p=>p[1]);
  const all=[[pts[0][0],0],...pts,[W/2,H]];legs=[];
  for(let k=0;k<all.length-1;k++){const [x0,y0]=all[k],[x1,y1]=all[k+1],dy=(y1-y0)*0.55,d=`M${x0} ${y0}C${x0} ${y0+dy} ${x1} ${y1-dy} ${x1} ${y1}`;
   const pencil=document.createElementNS(NS,'path');pencil.setAttribute('d',d);pencil.setAttribute('class','leg-pencil');svg.appendChild(pencil);
   const ink=document.createElementNS(NS,'path');ink.setAttribute('d',d);ink.setAttribute('class','leg-ink');svg.appendChild(ink);
   const len=ink.getTotalLength();ink.style.strokeDasharray=`${len} ${len}`;ink.style.strokeDashoffset=len;
   const samples=[];for(let j=0;j<=16;j++){const p=ink.getPointAtLength(len*j/16);samples.push([len*j/16,p.y]);}
   legs.push({ink,len,y0,y1,samples,shown:len});}
 },update(s){
  const y=clamp(s+view.vh*0.55-this.top,0,this.h);let at=null;
  for(const L of legs){
   let off;if(y>=L.y1)off=0;else if(y<=L.y0)off=L.len;else{
    const S=L.samples;let j=1;while(j<S.length-1&&S[j][1]<y)j++;const [l0,ya]=S[j-1],[l1,yb]=S[j];const l=l0+(l1-l0)*clamp((y-ya)/Math.max(1,yb-ya));off=L.len-l;at={L,l};}
   if(Math.abs(off-L.shown)>0.5){L.shown=off;L.ink.style.strokeDashoffset=off.toFixed(1);}
  }
  // the ship sits at the head of the ink, turned along the route
  if(!at){const L=y<=0?legs[0]:legs[legs.length-1];at={L,l:y<=0?0:L.len};}
  const p=at.L.ink.getPointAtLength(at.l),q=at.L.ink.getPointAtLength(Math.min(at.L.len,at.l+6));
  const ang=Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI-90;
  ship.style.transform=`translate3d(${(p.x-29).toFixed(1)}px,${(p.y-40).toFixed(1)}px,0) rotate(${(clamp(ang,-35,35)*0.6).toFixed(2)}deg)`;
  isleY.forEach((t,i)=>{const on=y>=t-4;if(nodes[i]._on!==on){nodes[i]._on=on;nodes[i].classList.toggle('lit',on);}});
  // the compass needle drifts a little as you sail
  if(!motion.reduced){const r=Math.sin(s/900)*12;if(Math.abs(r-roseAt)>0.3){roseAt=r;rose.setAttribute('transform',`rotate(${r.toFixed(2)})`);}}
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

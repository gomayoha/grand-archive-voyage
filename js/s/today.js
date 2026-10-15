// 00 · The archive, opened. The first screen is a living wall of his whole collection (every character,
// crew, world, spread and library picture, about a thousand). Every few seconds one picture lifts out of the
// wall, opens to fill the screen and slowly drifts closer while its name appears; then it settles back and
// a few tiles reshuffle to new pictures. Tap any tile to open it, "Shuffle" to deal a new wall.
// Calm on purpose: one moving picture at a time, transform/opacity/clip only. Pauses when off screen.
// ("Anime is for losers", the old opening, is kept in s/opening.js for later.)
import {$,esc,data,jumpTo,absTop,motion,TH,FU,part,view,clamp,smooth,coarse} from '../core.js';
import {openViewer,registerCollection} from '../dialogs.js';
import {openTunnel} from '../tunnel.js';
import {onTilt} from '../tilt.js';

const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const wait=ms=>new Promise(r=>setTimeout(r,ms));

// Every picture, with where it lives and what to call it.
function pictures(){
 const m=data.media||{},out=[],seen=new Set();
 const add=(ids,label,to)=>{for(const id of ids||[])if(!seen.has(id)&&m.img?.[id]){seen.add(id);out.push({id,label,to});}};
 for(const c of m.characters||[])add(c.all,`${c.home} · The Character Log`,'characters');
 for(const c of m.crew||[])add(c.all,`${c.name} · The Crew`,'crew');
 for(const w of m.worlds||[])add(w.all,`${w.name} · ${w.series}`,'worlds');
 add(m.spreads?.all,'A colour spread · Eiichiro Oda','spreads');
 add(m.wall,'The Ohara Library','library');
 add(m.backgrounds?.all,'Between the sky and the sea','depths');
 return out;
}

export function initToday(){
 const sec=$('#home');if(!sec)return;
 // What's new: every picture the gallery sync added since his last visit (a new day = a new visit) is dealt
 // first, and the first picture to open is one of them.
 const today=new Date().toISOString().slice(0,10);let since;
 try{const v=JSON.parse(localStorage.getItem('grand-archive:visit')||'null');if(!v)since=new Date(Date.now()-7*864e5).toISOString().slice(0,10);else if(v.date!==today){since=v.date;localStorage.setItem('grand-archive:visit',JSON.stringify({date:today,since}));}else since=v.since;if(!v)localStorage.setItem('grand-archive:visit',JSON.stringify({date:today,since}));}catch{since=today;}
 const added=data.media?.added||{},isNew=id=>(added[id]||'')>since;
 const all=pictures(),fresh=shuffle(all.filter(p=>isNew(p.id))),pool=[...fresh,...shuffle(all.filter(p=>!isNew(p.id)))];if(pool.length<12)return;
 // pictures too small to fill the screen stay in the wall but never open full screen on their own
 const big=p=>{const d=data.media.img[p.id]||[0,0];return Math.max(d[0],d[1])>=900;};
 const wall=$('#ar-wall'),open=$('#ar-open'),oimg=open.querySelector('img'),cap=$('#ar-cap'),capName=$('#ar-name'),capWhere=$('#ar-where');
 $('#ar-date').textContent=`Goma's Grand Archive · ${new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}`;
 $('#ar-count').innerHTML=`${pool.length.toLocaleString('en-US')} pictures in the archive${fresh.length?` · <b class="ar-new">${fresh.length} new since your last visit</b>`:''}`;
 registerCollection('archive',()=>({title:'The archive',eyebrow:'Every picture',ids:pool.map(p=>p.id)}));
 let next=0;const deal=()=>pool[(next++)%pool.length];
 let tiles=[],cur=null,running=false,visible=true,busy=false,timer=0;

 function build(){
  const phone=innerWidth<=820,cols=phone?3:8,rows=phone?6:4;
  wall.style.setProperty('--cols',cols);wall.style.setProperty('--rows',rows);
  // each tile sits at its own small depth, so the wall has real thickness when it tilts
  wall.innerHTML=Array.from({length:cols*rows},(_,i)=>`<button class="ar-tile" style="--i:${i};--z:${Math.round(Math.random()*70)}px" aria-label="Open picture"><img alt="" decoding="async"></button>`).join('');
  tiles=[...wall.children].map(el=>({el,img:el.querySelector('img'),p:null}));
  tiles.forEach(t=>setTile(t,deal()));
 }
 function setTile(t,p){t.p=p;t.img.src=TH(p.id);t.el.setAttribute('aria-label',`Open: ${p.label}`);}
 // a tile turns over to a new picture
 async function turn(t){t.el.classList.add('turn');await wait(420);setTile(t,deal());await new Promise(r=>{if(t.img.complete)r();else{t.img.onload=r;setTimeout(r,800);}});t.el.classList.remove('turn');}

 // one picture lifts out of the wall and opens to fill the screen
 async function expand(t,hold){
  if(busy)return;busy=true;cur=t;flat(true);
  const W=sec.clientWidth,H=sec.clientHeight,r=t.el.getBoundingClientRect(),s=sec.getBoundingClientRect();
  const x=r.left-s.left,y=r.top-s.top,[iw,ih]=data.media.img[t.p.id]||[4,5];
  // the big image covers the screen; at the start it is scaled and clipped to sit exactly on the tile
  const cover=Math.max(W/iw,H/ih),tileCover=Math.max(r.width/iw,r.height/ih),k=tileCover/cover;
  const cx=x+r.width/2-W/2,cy=y+r.height/2-H/2;
  oimg.src=FU(t.p.id);try{await oimg.decode();}catch{}
  capName.textContent=t.p.label.split(' · ')[0];capWhere.textContent=t.p.label.split(' · ').slice(1).join(' · ')+(isNew(t.p.id)?` · New, ${new Date(added[t.p.id]+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})}`:'');
  const from=`inset(${y}px ${W-x-r.width}px ${H-y-r.height}px ${x}px round 10px)`,to='inset(0px 0px 0px 0px round 0px)';
  open.hidden=false;t.el.classList.add('lifted');
  const dur=motion.reduced?1:1100,ease='cubic-bezier(.2,.7,0,1)';
  open.animate([{clipPath:from},{clipPath:to}],{duration:dur,easing:ease,fill:'forwards'});
  const a=oimg.animate([{transform:`translate(${cx}px,${cy}px) scale(${k})`},{transform:'translate(0,0) scale(1)'}],{duration:dur,easing:ease,fill:'forwards'});
  sec.classList.add('opened');
  await a.finished;
  // the slow drift closer while it is open
  const drift=oimg.animate([{transform:'scale(1)'},{transform:'scale(1.07) translate(-1%,-1%)'}],{duration:hold+1600,easing:'linear',fill:'forwards'});
  await wait(hold);
  if(cur!==t){busy=false;return;}
  await close(t,drift);
 }
 async function close(t,drift){
  sec.classList.remove('opened');
  const W=sec.clientWidth,H=sec.clientHeight,r=t.el.getBoundingClientRect(),s=sec.getBoundingClientRect(),x=r.left-s.left,y=r.top-s.top;
  const [iw,ih]=data.media.img[t.p.id]||[4,5],k=Math.max(r.width/iw,r.height/ih)/Math.max(W/iw,H/ih);
  drift?.cancel();
  const dur=motion.reduced?1:900,ease='cubic-bezier(.65,0,.35,1)';
  open.animate([{clipPath:'inset(0px 0px 0px 0px round 0px)'},{clipPath:`inset(${y}px ${W-x-r.width}px ${H-y-r.height}px ${x}px round 10px)`}],{duration:dur,easing:ease,fill:'forwards'});
  await oimg.animate([{transform:'scale(1.07) translate(-1%,-1%)'},{transform:`translate(${x+r.width/2-W/2}px,${y+r.height/2-H/2}px) scale(${k})`}],{duration:dur,easing:ease,fill:'forwards'}).finished;
  open.hidden=true;t.el.classList.remove('lifted');cur=null;busy=false;flat(false);
  // a few tiles reshuffle, the opened one included
  const others=shuffle(tiles.filter(x=>x!==t)).slice(0,3);
  [t,...others].forEach((x,i)=>setTimeout(()=>turn(x),i*140));
 }
 async function loop(){
  if(running)return;running=true;
  while(running&&visible&&!motion.reduced){
   await wait(1800);if(!running||!visible)break;
   // new pictures open first (one per turn), then any picture big enough to fill the screen
   const cands=tiles.filter(x=>big(x.p)),fresh1=cands.filter(x=>isNew(x.p.id)&&!x.shown),from=fresh1.length?fresh1:cands.length?cands:tiles;
   const t=from[Math.floor(Math.random()*from.length)];t.shown=true;
   await expand(t,4200);
   await wait(900);
  }
  running=false;
 }
 build();
 /* ---------------- 3D: the wall assembles out of the dark, tilts under the mouse, folds away on scroll ---------------- */
 const tilt=$('#ar-tilt'),copy=sec.querySelector('.ar-copy');
 const T={x:0,y:0,tx:0,ty:0,fold:0,flat:false};
 const apply=()=>{const k=T.flat?0:1,f=T.fold;
  tilt.style.transform=`translate3d(0,${(f*-6).toFixed(2)}vh,${(f*-260).toFixed(1)}px) rotateX(${(f*34+T.y*4*k).toFixed(3)}deg) rotateY(${(T.x*6*k).toFixed(3)}deg)`;
  copy.style.transform=f?`translate3d(0,${(f*-90).toFixed(1)}px,0)`:'';copy.style.opacity=f?(1-smooth(clamp(f*1.4))).toFixed(3):'';};
 function flat(v){T.flat=v;if(v){T.tx=T.ty=0;}apply();}
 let traf=0;const ease=()=>{traf=0;T.x+=(T.tx-T.x)*0.07;T.y+=(T.ty-T.y)*0.07;apply();if(Math.abs(T.tx-T.x)+Math.abs(T.ty-T.y)>0.002)traf=requestAnimationFrame(ease);};
 if(!coarse)sec.addEventListener('pointermove',e=>{if(motion.reduced||T.flat)return;T.tx=e.clientX/innerWidth-0.5;T.ty=0.5-e.clientY/innerHeight;if(!traf)traf=requestAnimationFrame(ease);});
 sec.addEventListener('pointerleave',()=>{T.tx=T.ty=0;if(!traf)traf=requestAnimationFrame(ease);});
 // on a phone, the wall follows the way you hold it
 onTilt(t=>{if(motion.reduced||!coarse)return;
  // a picture that's open drifts with the phone too, like looking at it through a window
  open.style.scale=t.on?'1.05':'';open.style.translate=t.on?`${(t.x*-16).toFixed(1)}px ${(t.y*-12).toFixed(1)}px`:'';
  if(T.flat)return;T.tx=t.x*0.7;T.ty=-t.y*0.7;if(!traf)traf=requestAnimationFrame(ease);});
 part({el:sec,update(s){const f=motion.reduced?0:smooth(clamp(s/Math.max(1,view.vh)));if(f!==T.fold){T.fold=f;apply();}}});
 // The first time the site opens, every tile flies in from deep in the dark and lands in the wall.
 function assemble(){
  if(motion.reduced)return Promise.resolve();
  sec.classList.add('assembling');
  const W=innerWidth,H=innerHeight,anims=tiles.map((t,i)=>{
   const r=t.el.getBoundingClientRect(),dx=(r.left+r.width/2-W/2),dy=(r.top+r.height/2-H/2),d=Math.hypot(dx/W,dy/H);
   const z=-900-Math.random()*1600,rx=(Math.random()-0.5)*50,ry=(Math.random()-0.5)*70;
   return t.el.animate([{transform:`translate3d(${(dx*0.6).toFixed(0)}px,${(dy*0.6).toFixed(0)}px,${z.toFixed(0)}px) rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg)`,opacity:0},{transform:`translateZ(${t.el.style.getPropertyValue('--z')||'0px'})`,opacity:0.5}],{duration:1500+Math.random()*500,delay:120+d*700+Math.random()*260,easing:'cubic-bezier(.16,.84,.24,1)',fill:'backwards'});
  });
  return Promise.all(anims.map(a=>a.finished.catch(()=>{}))).then(()=>sec.classList.remove('assembling'));
 }
 assemble();
 if(!motion.reduced)setTimeout(loop,2600);
 new IntersectionObserver(([e])=>{visible=e.isIntersecting&&!document.hidden;if(visible)loop();},{threshold:0.35}).observe(sec);
 document.addEventListener('visibilitychange',()=>{visible=!document.hidden&&sec.getBoundingClientRect().bottom>innerHeight*0.35;if(visible)loop();});
 wall.addEventListener('click',e=>{const el=e.target.closest('.ar-tile');if(!el||busy)return;const t=tiles.find(x=>x.el===el);if(t)expand(t,5200);});
 open.addEventListener('click',()=>{if(cur)openViewer('archive',cur.p.id);});
 $('#ar-go').addEventListener('click',()=>{const to=cur?.p.to||'characters',el=document.getElementById(to);if(el)jumpTo(absTop(el));});
 $('#ar-dive').addEventListener('click',()=>openTunnel({title:'Every picture',eyebrow:`${pool.length.toLocaleString('en-US')} pictures · newest first`,ids:pool.map(p=>p.id)}));
 $('#ar-shuffle').addEventListener('click',()=>{if(busy)return;shuffle(tiles.slice()).forEach((t,i)=>setTimeout(()=>turn(t),i*35));});
 let rw=innerWidth;addEventListener('resize',()=>{if((innerWidth<=820)!==(rw<=820)){rw=innerWidth;if(!busy)build();}});
}

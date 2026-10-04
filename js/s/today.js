// 00 · The archive, opened. The first screen is a living wall of his whole collection (every character,
// crew, world, spread and library picture, about a thousand). Every few seconds one picture lifts out of the
// wall, opens to fill the screen and slowly drifts closer while its name appears; then it settles back and
// a few tiles reshuffle to new pictures. Tap any tile to open it, "Shuffle" to deal a new wall.
// Calm on purpose: one moving picture at a time, transform/opacity/clip only. Pauses when off screen.
// ("Anime is for losers", the old opening, is kept in s/opening.js for later.)
import {$,esc,data,jumpTo,absTop,motion,TH,FU} from '../core.js';
import {openViewer,registerCollection} from '../dialogs.js';

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
 return out;
}

export function initToday(){
 const sec=$('#home');if(!sec)return;
 const pool=shuffle(pictures());if(pool.length<12)return;
 const wall=$('#ar-wall'),open=$('#ar-open'),oimg=open.querySelector('img'),cap=$('#ar-cap'),capName=$('#ar-name'),capWhere=$('#ar-where');
 $('#ar-date').textContent=`Goma's Grand Archive · ${new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}`;
 $('#ar-count').textContent=`${pool.length.toLocaleString('en-US')} pictures in the archive`;
 registerCollection('archive',()=>({title:'The archive',eyebrow:'Every picture',ids:pool.map(p=>p.id)}));
 let next=0;const deal=()=>pool[(next++)%pool.length];
 let tiles=[],cur=null,running=false,visible=true,busy=false,timer=0;

 function build(){
  const phone=innerWidth<=820,cols=phone?3:8,rows=phone?6:4;
  wall.style.setProperty('--cols',cols);wall.style.setProperty('--rows',rows);
  wall.innerHTML=Array.from({length:cols*rows},(_,i)=>`<button class="ar-tile" style="--i:${i}" aria-label="Open picture"><img alt="" decoding="async"></button>`).join('');
  tiles=[...wall.children].map(el=>({el,img:el.querySelector('img'),p:null}));
  tiles.forEach(t=>setTile(t,deal()));
 }
 function setTile(t,p){t.p=p;t.img.src=TH(p.id);t.el.setAttribute('aria-label',`Open: ${p.label}`);}
 // a tile turns over to a new picture
 async function turn(t){t.el.classList.add('turn');await wait(420);setTile(t,deal());await new Promise(r=>{if(t.img.complete)r();else{t.img.onload=r;setTimeout(r,800);}});t.el.classList.remove('turn');}

 // one picture lifts out of the wall and opens to fill the screen
 async function expand(t,hold){
  if(busy)return;busy=true;cur=t;
  const W=sec.clientWidth,H=sec.clientHeight,r=t.el.getBoundingClientRect(),s=sec.getBoundingClientRect();
  const x=r.left-s.left,y=r.top-s.top,[iw,ih]=data.media.img[t.p.id]||[4,5];
  // the big image covers the screen; at the start it is scaled and clipped to sit exactly on the tile
  const cover=Math.max(W/iw,H/ih),tileCover=Math.max(r.width/iw,r.height/ih),k=tileCover/cover;
  const cx=x+r.width/2-W/2,cy=y+r.height/2-H/2;
  oimg.src=FU(t.p.id);try{await oimg.decode();}catch{}
  capName.textContent=t.p.label.split(' · ')[0];capWhere.textContent=t.p.label.split(' · ').slice(1).join(' · ');
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
  open.hidden=true;t.el.classList.remove('lifted');cur=null;busy=false;
  // a few tiles reshuffle, the opened one included
  const others=shuffle(tiles.filter(x=>x!==t)).slice(0,3);
  [t,...others].forEach((x,i)=>setTimeout(()=>turn(x),i*140));
 }
 async function loop(){
  if(running)return;running=true;
  while(running&&visible&&!motion.reduced){
   await wait(1800);if(!running||!visible)break;
   const t=tiles[Math.floor(Math.random()*tiles.length)];
   await expand(t,4200);
   await wait(900);
  }
  running=false;
 }
 build();
 if(!motion.reduced)setTimeout(loop,1400);
 new IntersectionObserver(([e])=>{visible=e.isIntersecting&&!document.hidden;if(visible)loop();},{threshold:0.35}).observe(sec);
 document.addEventListener('visibilitychange',()=>{visible=!document.hidden&&sec.getBoundingClientRect().bottom>innerHeight*0.35;if(visible)loop();});
 wall.addEventListener('click',e=>{const el=e.target.closest('.ar-tile');if(!el||busy)return;const t=tiles.find(x=>x.el===el);if(t)expand(t,5200);});
 open.addEventListener('click',()=>{if(cur)openViewer('archive',cur.p.id);});
 $('#ar-go').addEventListener('click',()=>{const to=cur?.p.to||'characters',el=document.getElementById(to);if(el)jumpTo(absTop(el));});
 $('#ar-shuffle').addEventListener('click',()=>{if(busy)return;shuffle(tiles.slice()).forEach((t,i)=>setTimeout(()=>turn(t),i*35));});
 let rw=innerWidth;addEventListener('resize',()=>{if((innerWidth<=820)!==(rw<=820)){rw=innerWidth;if(!busy)build();}});
}

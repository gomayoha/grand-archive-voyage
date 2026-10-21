// Gold: the coins in your pocket (the bounty is what the world thinks you're worth). He asked for a second
// currency you earn by doing things, to buy chests and sail faster (Oct 22 2026). Ways in:
//  - Sailing on: every screen you scroll yourself drops a coin (Auto voyage doesn't count; 40 a minute at most).
//  - Liking pictures: a heart in the full-screen viewer, or a double tap on a picture. Your likes become a
//    collection of their own, "My favourites".
//  - Floating treasure: now and then a coin drifts across the screen while you're here. Catch it before it's gone.
//    Most are a few coins, some a handful, and once in a while a golden doubloon.
//  - Days at sea in a row: a streak that pays more each day, up to a week.
//  - Today's treasure: one picture in the archive is marked every day. The Black Market says whose collection
//    it's hidden in; it glows wherever it appears. Open it to claim it.
//  - And every million berries of bounty drops a coin (bounty.js), duplicates sell for gold (treasure.js).
import {data,motion,coarse} from './core.js';
import {B,save,gainGold,goldTarget,earn,once,notice} from './bounty.js';

const today=()=>new Date().toLocaleDateString('en-CA');
const rnd=(a,b)=>a+Math.random()*(b-a);
const blocked=()=>document.documentElement.classList.contains('wm-on')||!!document.querySelector('dialog[open]');
let started=false;

// the viewer and collections only exist on the main page (story.html has neither)
const hooks=[];
export async function initGold(){
 if(started)return;started=true;
 streak();scrolling();likes();floating();hunt();
 if(!document.getElementById('dialog'))return;
 const {registerCollection,viewerHooks}=await import('./dialogs.js');
 viewerHooks.push(...hooks);
 registerCollection('fav',()=>({title:'My favourites',eyebrow:'Pictures I liked',ids:Object.keys(B.likes).sort((a,b)=>B.likes[b]-B.likes[a])}));
}

/* ---------------------------------------------------------------- days in a row */
export const streakPay=n=>25*Math.min(n,7)+(n>=7?50:0);
function streak(){
 const t=today(),s=B.streak||(B.streak={n:0,last:null});if(s.last===t)return;
 const y=new Date(Date.now()-864e5).toLocaleDateString('en-CA');
 s.n=s.last===y?s.n+1:1;s.last=t;save();
 setTimeout(()=>gainGold(streakPay(s.n),s.n>1?`${s.n} days at sea in a row`:'A new day at sea'),3400);
}

/* ---------------------------------------------------------------- scrolling */
function scrolling(){
 let last=scrollY,acc=0,minute=0,minStart=Date.now();
 addEventListener('scroll',()=>{
  const y=scrollY,d=Math.abs(y-last);last=y;
  if(document.body.classList.contains('auto-on')||d>innerHeight*3)return;   // the ship sailing itself, or a jump
  acc+=d;if(acc<innerHeight)return;
  const n=Math.floor(acc/innerHeight);acc-=n*innerHeight;
  if(Date.now()-minStart>60000){minStart=Date.now();minute=0;}
  const g=Math.min(n,40-minute);if(g<=0)return;minute+=g;gainGold(g,'',{quiet:true});
 },{passive:true});
}

/* ---------------------------------------------------------------- likes */
export const liked=id=>!!B.likes[id];
export function like(id,x,y){
 if(!id)return false;
 if(B.likes[id]){delete B.likes[id];save();return false;}
 B.likes[id]=Date.now();save();
 heart(x??innerWidth/2,y??innerHeight/2);
 // the first like of each picture pays; ten and fifty likes pay a little more
 if(!B.marks['like:'+id]){B.marks['like:'+id]=1;gainGold(5,'',{quiet:true});}
 const n=Object.keys(B.likes).length;
 if(n>=10)once('likes:10',3e6,'Ten pictures you love');
 if(n>=50)once('likes:50',10e6,'Fifty pictures you love');
 return true;
}
const HEART='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.2 0 3.6 1.2 4.3 2.4h2c.7-1.2 2.1-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>';
export const heartSVG=HEART;
function heart(x,y){
 const h=document.createElement('i');h.className='gl-heart';h.innerHTML=HEART;h.style.left=x+'px';h.style.top=y+'px';document.body.appendChild(h);
 h.animate([{transform:'translate(-50%,-50%) scale(.2)',opacity:0},{transform:'translate(-50%,-50%) scale(1.25)',opacity:1,offset:.3},{transform:'translate(-50%,-50%) scale(.95)',opacity:1,offset:.5},{transform:'translate(-50%,-80%) scale(1)',opacity:0}],{duration:motion.reduced?400:1000,easing:'cubic-bezier(.2,.9,.3,1.2)'}).finished.then(()=>h.remove());
}
// which picture an <img> shows (thumbnail or full size)
const idOf=im=>{const m=(im.currentSrc||im.src||'').match(/\/img\/[tf]\/([0-9a-f]{12})\.webp/);return m&&m[1];};
function likes(){
 // the heart in the full-screen viewer
 hooks.push(id=>{const b=document.getElementById('vw-like');if(!b)return;b.dataset.likeId=id;b.setAttribute('aria-pressed',String(liked(id)));});
 document.addEventListener('click',e=>{const b=e.target.closest('#vw-like');if(!b)return;const r=b.getBoundingClientRect();const on=like(b.dataset.likeId,r.left+r.width/2,r.top+r.height/2);b.setAttribute('aria-pressed',String(on));});
 // a double tap (or double click) on a picture
 let lt=0,lx=0,ly=0,lim=null;
 document.addEventListener('pointerup',e=>{
  const im=e.target instanceof Element&&e.target.closest('img');if(!im)return;
  const viewer=im.id==='viewer-img';
  if(!viewer&&(im.closest('button,a,[role=button],[data-collection],[data-view],[data-card],.tg')||!im.closest('main')))return;
  const now=performance.now();
  if(im===lim&&now-lt<340&&Math.hypot(e.clientX-lx,e.clientY-ly)<30){lt=0;const id=idOf(im);if(id&&!liked(id)){like(id,e.clientX,e.clientY);const b=document.getElementById('vw-like');if(viewer&&b)b.setAttribute('aria-pressed','true');}else if(id)heart(e.clientX,e.clientY);return;}
  lt=now;lx=e.clientX;ly=e.clientY;lim=im;
 },{passive:true});
}

/* ---------------------------------------------------------------- floating treasure */
const KINDS=[
 {k:'coin',w:70,min:12,max:22,name:'A gold coin'},
 {k:'stack',w:25,min:35,max:50,name:'A handful of gold'},
 {k:'doubloon',w:5,min:110,max:140,name:'A golden doubloon'}
];
function floating(){
 let active=Date.now(),sec=0,next=40;
 ['pointerdown','wheel','touchstart','keydown','scroll'].forEach(e=>addEventListener(e,()=>{active=Date.now();},{passive:true}));
 setInterval(()=>{
  if(document.hidden||Date.now()-active>25000||blocked())return;
  sec+=4;if(sec<next)return;sec=0;next=rnd(70,140);spawn();
 },4000);
}
export function spawn(kind){
 let x=Math.random()*100;const t=kind?KINDS.find(k=>k.k===kind):KINDS.find(k=>(x-=k.w)<0)||KINDS[0];
 const el=document.createElement('button');el.className=`gt gt-${t.k}`;el.setAttribute('aria-label',`${t.name}. Catch it`);
 el.innerHTML=t.k==='stack'?'<i class="gp-coin"></i><i class="gp-coin"></i><i class="gp-coin"></i>':'<i class="gp-coin"></i>';
 document.body.appendChild(el);
 const W=innerWidth,y=innerHeight*rnd(.28,.68),ltr=Math.random()<.5,dur=motion.reduced?9000:rnd(8500,11000);
 let anim;
 if(motion.reduced){el.style.left=(ltr?18:W-78)+'px';el.style.top=y+'px';anim=el.animate([{opacity:0},{opacity:1,offset:.1},{opacity:1,offset:.85},{opacity:0}],{duration:dur});}
 else{const f=[];for(let i=0;i<=8;i++){const k=i/8;f.push({transform:`translate3d(${(ltr?-90+k*(W+180):W+90-k*(W+180)).toFixed(0)}px,${(y+Math.sin(k*Math.PI*3)*34).toFixed(0)}px,0) rotate(${(Math.sin(k*9)*14).toFixed(1)}deg)`});}anim=el.animate(f,{duration:dur,easing:'linear'});}
 anim.finished.then(()=>el.remove()).catch(()=>{});
 el.addEventListener('pointerdown',e=>{
  e.stopPropagation();if(el.dataset.got)return;el.dataset.got=1;anim.pause();
  const n=Math.round(rnd(t.min,t.max)),r=el.getBoundingClientRect();
  burst(r.left+r.width/2,r.top+r.height/2,t.k==='doubloon'?16:t.k==='stack'?10:6);
  el.animate([{opacity:1,scale:'1'},{opacity:0,scale:'1.8'}],{duration:300,fill:'forwards'}).finished.then(()=>el.remove());
  setTimeout(()=>gainGold(n,t.name),motion.reduced?0:650);
  B.caught=(B.caught||0)+1;save();
  if(B.caught>=25)once('caught:25',10e6,'Caught 25 floating treasures');
 });
}
// coins fly from where you caught them into the purse
function burst(x,y,n){
 if(motion.reduced)return;const to=goldTarget();
 for(let i=0;i<n;i++){const c=document.createElement('i');c.className='gp-coin gt-fly';document.body.appendChild(c);
  const mx=x+rnd(-90,90),my=y+rnd(-110,-20);
  c.animate([{transform:`translate3d(${x}px,${y}px,0) scale(.6)`},{transform:`translate3d(${mx}px,${my}px,0) scale(1)`,offset:.35},{transform:`translate3d(${to.x}px,${to.y}px,0) scale(.5)`}],{duration:900+i*30,easing:'cubic-bezier(.3,.7,.3,1)'}).finished.then(()=>c.remove());}
}

/* ---------------------------------------------------------------- today's treasure */
// one picture a day, the same for the whole day, from the collections you can open (characters and crew)
export function todaysHunt(){
 const M=data.media;if(!M)return null;
 const cols=[...(M.characters||[]).map((c,i)=>({key:'char:'+i,name:c.home,ids:c.all})),...(M.crew||[]).map((c,i)=>({key:'crew:'+i,name:c.name,ids:c.all}))].filter(c=>c.ids?.length);
 if(!cols.length)return null;
 const t=today();let h=2166136261;for(const ch of t)h=Math.imul(h^ch.charCodeAt(0),16777619);h>>>=0;
 // bigger collections are likelier, but every collection gets its day
 const all=cols.flatMap(c=>c.ids.map(id=>({id,col:c})));const pick=all[h%all.length];
 return{date:t,id:pick.id,col:pick.col,found:B.hunt?.date===t&&B.hunt.found};
}
function hunt(){
 const h=todaysHunt();if(!h)return;
 if(B.hunt?.date!==h.date){B.hunt={date:h.date,found:false};save();}
 if(h.found)return;
 // it glows wherever it shows up
 const st=document.createElement('style');st.id='gl-hunt';
 st.textContent=`img[src*="${h.id}"]{outline:2px solid #ffd76a;outline-offset:-2px;animation:glHunt 1.6s ease-in-out infinite}[data-id="${h.id}"]{position:relative}[data-id="${h.id}"]:after{content:"✦";position:absolute;top:8px;right:10px;color:#ffe9a8;font-size:20px;text-shadow:0 0 10px #ffb300;pointer-events:none}`;
 document.head.appendChild(st);
 const claim=()=>{if(B.hunt.found)return;B.hunt.found=true;save();st.remove();
  setTimeout(()=>{gainGold(150,'You found today’s treasure');earn(5e6,'',{quiet:true});notice('Today’s treasure','Hidden in '+h.col.name+'. A new one tomorrow.');},500);};
 hooks.push(id=>{if(id===h.id)claim();});
 document.addEventListener('click',e=>{const t=e.target;if(!(t instanceof Element))return;if(t.closest(`[data-id="${h.id}"]`)||(t.tagName==='IMG'&&(t.currentSrc||t.src).includes(h.id)))claim();},true);
}

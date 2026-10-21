// The helm: "Where to, captain?" Right after the wall of every picture, the archive asks where you want to
// go. Every way in (each part of the page, the story's own page, and the new ways to sail it: Auto voyage,
// the Game Room, the Treasure Room, Surprise me) is a slab of his art on one big reel that turns as you
// scroll, like a ship's wheel laid on its side: each option rolls up from below, holds at the front for a
// beat, and rolls away over the top. The front slab lights up and the whole screen takes on its colours.
// Tap any slab to set sail: the picture opens to fill the screen and you land where it leads.
// Surprise me spins the reel like a slot machine and lets the sea decide.
// Per frame: one rotateX on the reel (eased toward the scroll, like the zoom) and a fade per slab.
import {$,esc,clamp,smooth,view,part,pinned,follower,motion,data,absTop,jumpTo,pic,FU,dims,loadNear,coarse,warm,kick} from '../core.js';
import {onTilt} from '../tilt.js';
import {G5} from '../gear5.js';
import {B,chests,title,money,onBounty,openTreasure,openGames} from '../bounty.js';
import {startAuto} from '../autovoyage.js';

const STEP=0.36;          // screens of scrolling per option
const LEAD=0.05,TAIL=0.03; // a short beat on the first and last option before the reel turns
// slows the reel near each option and speeds it between them, so every option clicks into place
const detent=u=>{const i=Math.floor(u),f=u-i;return i+f-0.8*Math.sin(2*Math.PI*f)/(2*Math.PI);};

function items(){
 const m=data.media||{},n=data.characters?.characters?.length||11,spread=m.spreads?.wall?.[31]||m.spreads?.wall?.[0];
 return [
  {to:'characters',id:'3358de4cd87c',k:`01 · ${n} records`,t:'The Character <em>Log</em>',line:'They each left something behind. The one word, and everything I wrote about them.',subs:[['characters','The records'],['crew','The Crew']]},
  {to:'strawhats',id:'9fdfff7bb2ea',k:'Ten dreams, one ship',t:'The Straw Hat <em>Pirates</em>',line:'A walk down the deck, one crew member at a time, in the order they joined.',subs:[['strawhats','The deck'],['crew','Every wanted poster']]},
  {to:'depths',id:'5b4d8ea99809',k:'03 · Sky, sea, ten paintings',t:'The <em>Voyage</em>',line:'A fall from Skypiea to Fish-Man Island, then ten seas hidden inside each other.',subs:[['depths','Between the sky and the sea'],['voyage','The ten seas'],['moments','Moments']]},
  {to:'spreads',id:spread,k:'04 · 05 · Ink and colour',t:'The <em>Manga</em>',line:'Oda’s colour spreads, then a volume of my favourite panels, read right to left.',subs:[['spreads','Colour spreads'],['panels','Favourite panels']]},
  {page:'story.html',id:'695560c960c1',k:'A page of its own',t:'The Story of <em>One Piece</em>',line:'The whole manga, arc by arc, from Roger’s execution to the chapter I’m reading now.',cta:'Open the story ↗'},
  {to:'journey',id:'b9638d43c913',k:'06 · 07 · Every anime, in order',t:'The Anime <em>Journey</em>',line:'A sea chart of every story I’ve watched, my top 10, every rating and the logbook.',subs:[['journey','The sea chart'],['top','Top 10'],['records','The Shelf'],['logbook','The Logbook']]},
  {to:'worlds',id:'e76799f07af1',k:'08 · 09 · 10 · Beyond the Grand Line',t:'Other <em>worlds</em>',line:'The stories that stayed, my cards, the scene I can’t stop replaying, the Ohara Library.',subs:[['worlds','Other worlds'],['vault','Card Vault'],['table','Card Table'],['scenes','Scenes'],['library','Ohara Library']]},
  {to:'sky',id:'3024e75b52de',k:'Every one of them',t:'The night <em>sky</em>',line:'Every character a constellation, every star something they taught me.',subs:[['sky','The night sky']]},
  {mode:'auto',id:'6ec6b336fb55',k:'New · a way to sail',t:'Auto <em>voyage</em>',line:'Sit back. The archive sails itself, chapter by chapter, all the way to the last page.',cta:'Start sailing ▸'},
  {room:'games',src:'assets/media/luffy_poster.jpg',k:'New · four games',t:'The Game <em>Room</em>',line:'Higher or lower, a gust of wanted posters, a quiz about me, and Observation Haki.',cta:'Play'},
  {room:'treasure',id:'c95409fbc40a',k:'New · your bounty',t:'The Treasure <em>Room</em>',line:'Every minute here and everything you learn earns berries. Milestones wash chests ashore.',cta:'Open'},
  {mode:'surprise',id:null,k:'Can’t decide?',t:'Surprise <em>me</em>',line:'Spin the wheel and let the sea decide where we go.',cta:'Spin the wheel'}
 ];
}
// a big picture from anywhere in the archive (Surprise me changes its face every time)
function randomPic(){const all=Object.entries(data.media?.img||{}).filter(([,d])=>Math.max(d[0],d[1])>=1100);return all.length?all[Math.floor(Math.random()*all.length)][0]:'5b4d8ea99809';}
const plain=t=>t.replace(/<[^>]+>/g,'');

export function initHelm(){
 const sec=$('#helm');if(!sec)return;
 const IT=items(),N=IT.length,D=360/N;
 const reel=$('#hm-reel'),tiltEl=$('#hm-tilt'),detail=$('#hm-detail'),ticks=$('#hm-ticks'),purse=$('#hm-purse'),bgs=[...sec.querySelectorAll('.hm-bg img')];
 IT[N-1].id=randomPic();
 // the reel's length: a third of a screen of scrolling for every option
 sec.style.setProperty('--span',((N-1)*STEP/(1-LEAD-TAIL)*100).toFixed(1)+'svh');
 const art=(it,sizes)=>it.src?`<img src="${esc(it.src)}" alt="" loading="lazy" decoding="async">`:pic(it.id,{sizes});
 const cta=it=>it.cta||'Set sail';
 reel.innerHTML=IT.map((it,i)=>`<button class="hm-item${it.room||it.mode?' hm-new':''}" data-i="${i}" style="--a:${(-i*D).toFixed(3)}deg" aria-label="${esc(plain(it.t))}: ${esc(it.line)}">
  <span class="hm-art">${art(it,'(max-width:820px) 92vw, 54vw')}</span><i class="hm-scrim"></i>
  <span class="hm-txt"><small>${esc(it.k)}</small><b>${it.t}</b></span>
  <span class="hm-cta">${esc(cta(it))}${it.to?' <i>→</i>':''}</span><i class="hm-sheen" aria-hidden="true"></i><i class="hm-dim" aria-hidden="true"></i></button>`).join('');
 const els=[...reel.children].map(el=>({el,dim:el.querySelector('.hm-dim'),sheen:el.querySelector('.hm-sheen'),o:-1,d:-1,vis:true}));
 ticks.innerHTML=IT.map((it,i)=>`<li><button data-tick="${i}" aria-label="${esc(plain(it.t))}"><span>${esc(plain(it.t))}</span></button></li>`).join('');
 const tickEls=[...ticks.querySelectorAll('button')];
 // the same options as a plain list for Motion Off
 const stat=$('#hm-static');
 stat.innerHTML=IT.map((it,i)=>`<li><button class="hm-st" data-i="${i}"><span class="hm-st-art">${art(it,'(max-width:820px) 46vw, 280px')}</span><small>${esc(it.k)}</small><b>${it.t}</b></button></li>`).join('');
 loadNear(sec);

 /* ---------------- the purse: your bounty, always in view while you choose ---------------- */
 function showPurse(){const c=chests(),t=title();purse.innerHTML=`<i class="bt-coin" aria-hidden="true">฿</i><span class="hm-purse-t"><b>${money(B.b)}</b><small>${esc(t[1])}${c.waiting?` · <em>${c.waiting} ${c.waiting>1?'chests':'chest'} waiting</em>`:''}</small></span><i class="hm-purse-go" aria-hidden="true">→</i>`;purse.classList.toggle('glow',c.waiting>0);}
 showPurse();onBounty(()=>{showPurse();if(IT[front]?.room)showDetail(front,true);});
 purse.addEventListener('click',()=>openTreasure());

 /* ---------------- the detail of the option at the front ---------------- */
 let front=-1;
 function showDetail(i,force){
  if(i===front&&!force)return;const changed=i!==front;front=i;const it=IT[i];
  let extra='';
  if(it.room==='treasure'){const c=chests();extra=`<p class="hm-stat"><b>฿${money(B.b)}</b> · ${esc(title()[1])}${c.waiting?` · <em>${c.waiting} ${c.waiting>1?'chests':'chest'} waiting</em>`:` · next chest at ฿${money(c.next)}`}</p>`;}
  if(it.room==='games'){const b=B.best;extra=`<p class="hm-stat">Best · Higher or lower <b>${b.hl||0}</b> · Wind <b>${b.wind||0}</b> · Quiz <b>${b.quiz||0}/10</b> · Haki <b>${b.haki||0}</b></p>`;}
  detail.innerHTML=`<p class="hm-dk">${esc(it.k)}</p><p class="hm-dl">${esc(it.line)}</p>${extra}${it.subs&&it.subs.length>1?`<div class="hm-subs">${it.subs.map(([id,l])=>`<button data-sub="${id}">${esc(l)}</button>`).join('')}</div>`:''}<button class="pill small hm-dgo" data-go>${esc(cta(it))}${it.to?' →':''}</button>`;
  if(changed){detail.classList.remove('in');void detail.offsetWidth;detail.classList.add('in');
   els.forEach((e,k)=>e.el.classList.toggle('front',k===i));tickEls.forEach((b,k)=>b.classList.toggle('now',k===i));
   // the screen takes on the colours of the option at the front (two layers cross-fade)
   const next=bgs.find(b=>!b.classList.contains('on'))||bgs[0],src=it.src||FU(it.id);
   if(!next.src.endsWith(src)){next.onload=()=>{bgs.forEach(b=>b.classList.toggle('on',b===next));};next.src=src;if(next.complete&&next.naturalWidth)next.onload();}
   else bgs.forEach(b=>b.classList.toggle('on',b===next));
  }
 }

 /* ---------------- the reel ---------------- */
 let R=600,W=600,H=260;
 const f=follower(120);let spin=null;
 const T={x:0,y:0,tx:0,ty:0};
 function size(){
  const phone=view.vw<=820;
  W=phone?Math.min(view.vw-28,560):Math.min(720,view.vw*0.52);H=Math.round(W*(phone?0.6:0.44));
  // the slabs touch edge to edge around the reel, with a hairline of dark between them
  R=Math.round((H+(phone?12:18))/(2*Math.sin(Math.PI/N)));
  tiltEl.style.width=W+'px';tiltEl.style.height=H+'px';reel.style.setProperty('--R',R+'px');
 }
 const xAt=(s)=>{
  const top=sec._top,h=sec._h,vh=view.vh;
  if(s<top)return -(1-smooth(clamp((s-(top-vh))/vh)))*1.7;
  if(s>top+h-vh)return N-1+clamp((s-(top+h-vh))/vh)*1.4;
  const p=pinned({top,h},s),u=clamp((p-LEAD)/(1-LEAD-TAIL))*(N-1);
  return detent(u);
 };
 // the scroll position that puts option i at the front
 const yFor=i=>sec._top+(LEAD+(i/(N-1))*(1-LEAD-TAIL))*(sec._h-view.vh);
 let lastX=null,lastG=-1;const copy=sec.querySelector('.hm-copy'),bgWrap=sec.querySelector('.hm-bg');
 function render(x,wrap=false){
  const g=G5.on?G5.beat:0;
  if(x===lastX&&g===lastG)return;lastX=x;lastG=g;
  reel.style.transform=`translateZ(${-R}px) rotateX(${(x*D).toFixed(3)}deg)${g?` scale(${(1+g*0.035).toFixed(4)})`:''}`;
  for(let i=0;i<N;i++){
   // scrolling, the reel is a list on a drum (nothing above the first option); spinning, it wraps round
   const e=els[i];let a=(x-i)*D;if(wrap){a%=360;if(a>180)a-=360;if(a<-180)a+=360;}
   const d=Math.abs(a),vis=d<100;
   if(vis!==e.vis){e.vis=vis;e.el.style.visibility=vis?'':'hidden';}
   if(!vis)continue;
   const dim=+(smooth(clamp(d/70))*0.82).toFixed(3);if(dim!==e.d){e.d=dim;e.dim.style.opacity=dim;}
   // a glint of light sweeps up each slab as it rolls into place, and is gone once it's there
   const off=a<0?-0.7+Math.min(-a,40)/30*1.4:-0.7;e.sheen.style.transform=`translate3d(0,${(off/3*100).toFixed(2)}%,0)`;
  }
  const i=wrap?((Math.round(x)%N)+N)%N:clamp(Math.round(x),0,N-1);if(i!==front)showDetail(i);
 }
 const sp=part({el:sec,measure(){sec._top=this.top;sec._h=this.h;size();lastX=null;},update(s){
  if(motion.reduced)return;
  f.target=xAt(s);let x=f.step(view.t);
  if(spin){const k=clamp((performance.now()-spin.t0)/spin.dur),e=1-Math.pow(1-k,4);x+=spin.from+(spin.to-spin.from)*e;if(k<1)kick();else if(!spin.done){spin.done=true;spin.land();}}
  render(x,!!spin);
  // the art blooms in as the reel rolls up out of the dark, and goes with it at the end
  const inn=smooth(clamp((s-(sec._top-view.vh*0.55))/(view.vh*0.55))),gone=smooth(clamp((s-(sec._top+sec._h-view.vh))/(view.vh*0.7))),bo=+(inn*(1-gone)).toFixed(3);
  if(bo!==this.bo){this.bo=bo;bgWrap.style.opacity=bo;}
  // the eyebrow and title lift away as the reel rolls off at the end
  const out=clamp((s-(sec._top+sec._h-view.vh))/(view.vh*0.6));copy.style.opacity=out?(1-smooth(out)).toFixed(3):'';copy.style.transform=out?`translate3d(0,${(-out*60).toFixed(1)}px,0)`:'';
 }});

 // the reel leans toward the mouse; on a phone it follows the way you hold it
 const lean=()=>{tiltEl.style.transform=`rotateY(${(T.x*9).toFixed(3)}deg) rotateX(${(T.y*-5).toFixed(3)}deg)`;els[front]?.el.style.setProperty('--mx',(50+T.x*60).toFixed(1)+'%');};
 let traf=0;const leanTo=()=>{traf=0;T.x+=(T.tx-T.x)*0.08;T.y+=(T.ty-T.y)*0.08;lean();if(Math.abs(T.tx-T.x)+Math.abs(T.ty-T.y)>0.002)traf=requestAnimationFrame(leanTo);};
 if(!coarse)sec.addEventListener('pointermove',e=>{if(motion.reduced)return;T.tx=e.clientX/innerWidth-0.5;T.ty=0.5-e.clientY/innerHeight;if(!traf)traf=requestAnimationFrame(leanTo);});
 sec.addEventListener('pointerleave',()=>{T.tx=T.ty=0;if(!traf)traf=requestAnimationFrame(leanTo);});
 onTilt(t=>{if(motion.reduced||!coarse)return;T.tx=t.x*0.6;T.ty=-t.y*0.6;if(!traf)traf=requestAnimationFrame(leanTo);});

 /* ---------------- setting sail ---------------- */
 let sailing=false;
 // the chosen picture opens out of its slab to fill the screen, then you land where it leads
 async function fly(it,el,then){
  const r=el.getBoundingClientRect(),Wd=innerWidth,Hd=innerHeight;
  const ov=document.createElement('div');ov.className='hm-fly';ov.innerHTML=`<img alt="" decoding="async"><div class="hm-fly-t"><small>${esc(it.k)}</small><b>${it.t}</b></div>`;
  const img=ov.querySelector('img');img.src=it.src||FU(it.id);document.body.appendChild(ov);
  try{await img.decode();}catch{}
  const [iw,ih]=it.src?[img.naturalWidth||4,img.naturalHeight||5]:dims(it.id);
  const k=Math.max(r.width/iw,r.height/ih)/Math.max(Wd/iw,Hd/ih),cx=r.left+r.width/2-Wd/2,cy=r.top+r.height/2-Hd/2;
  const dur=motion.reduced?1:950,easing='cubic-bezier(.2,.7,0,1)';
  ov.animate([{clipPath:`inset(${r.top}px ${Wd-r.right}px ${Hd-r.bottom}px ${r.left}px round 22px)`},{clipPath:'inset(0px 0px 0px 0px round 0px)'}],{duration:dur,easing,fill:'forwards'});
  await img.animate([{transform:`translate(${cx}px,${cy}px) scale(${k})`},{transform:'translate(0,0) scale(1.04)'}],{duration:dur,easing,fill:'forwards'}).finished;
  ov.classList.add('named');
  await new Promise(r=>setTimeout(r,motion.reduced?60:520));
  await then();
  ov.classList.add('gone');setTimeout(()=>ov.remove(),900);
 }
 const land=id=>{const el=document.getElementById(id);if(el){warm(el);jumpTo(absTop(el));}};
 async function go(i,sub){
  const it=IT[i];if(sailing)return;
  if(it.mode==='surprise')return surprise();
  if(it.mode==='auto'){startAuto({from:'helm'});return;}
  sailing=true;const el=els[i].el;
  try{
   if(it.room){await fly(it,el,async()=>{(it.room==='treasure'?openTreasure:openGames)();await new Promise(r=>setTimeout(r,250));});}
   else if(it.page){await fly(it,el,async()=>{location.href=it.page;await new Promise(r=>setTimeout(r,1500));});}
   else await fly(it,el,async()=>land(sub||it.to));
  }finally{sailing=false;}
 }
 // Surprise me: the reel spins like a slot machine and lands on a place to go
 function surprise(){
  if(spin&&!spin.done)return;
  const dests=IT.map((it,i)=>i).filter(i=>IT[i].to||IT[i].page),pickI=dests[Math.floor(Math.random()*dests.length)],it=IT[pickI];
  const sub=it.subs?it.subs[Math.floor(Math.random()*it.subs.length)][0]:null;
  const cur=f.v??0,base=Math.round(cur),turns=2*N;
  // land exactly on the picked slab after two full turns (the reel is a full circle, so it wraps)
  const to=(base+turns)+(((pickI-(base+turns))%N)+N)%N-cur;
  spin={t0:performance.now(),dur:motion.reduced?1:2600,from:0,to,done:false,land(){
   els[pickI].el.classList.add('picked');
   setTimeout(async()=>{const el=els[pickI].el;sailing=true;try{await fly(it,el,async()=>{if(it.page){location.href=it.page;await new Promise(r=>setTimeout(r,1500));}else land(sub||it.to);});}finally{sailing=false;els[pickI].el.classList.remove('picked');spin=null;lastX=null;
    // a new face for next time
    IT[N-1].id=randomPic();const s=els[N-1].el.querySelector('.hm-art');s.innerHTML=art(IT[N-1],'(max-width:820px) 92vw, 54vw');}},motion.reduced?50:650);
  }};
  kick();
 }
 reel.addEventListener('click',e=>{const b=e.target.closest('.hm-item');if(b)go(+b.dataset.i);});
 stat.addEventListener('click',e=>{const b=e.target.closest('.hm-st');if(b)go(+b.dataset.i);});
 detail.addEventListener('click',e=>{const b=e.target.closest('[data-sub]');if(b){go(front,b.dataset.sub);return;}if(e.target.closest('[data-go]'))go(front);});
 ticks.addEventListener('click',e=>{const b=e.target.closest('[data-tick]');if(b)scrollTo({top:yFor(+b.dataset.tick),behavior:motion.reduced?'instant':'smooth'});});
 // keyboard: a slab that takes focus comes round to the front
 reel.addEventListener('focusin',e=>{const b=e.target.closest('.hm-item');if(!b||!e.target.matches(':focus-visible'))return;const i=+b.dataset.i;if(i!==front)scrollTo({top:yFor(i),behavior:'instant'});});
 return{items:IT};
}

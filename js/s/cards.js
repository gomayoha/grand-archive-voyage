// 08 · The Card Vault: the ring grew into a spiral staircase. Every card he photographed stands on one
// helix, turned outward, rising through the six colours of the game (DON!! at the foot, then red, green,
// blue, purple, black, yellow). Scrolling turns the helix and climbs it, so each card comes round to face
// you; the room takes the front card's colour, the colour's name stands behind it, and the far side of
// the spiral shows the archive's own card backs. At the top the camera pulls back to the whole tower.
// One transform on the helix per frame; cards far up or down are hidden and their pictures let go.
import {$,esc,clamp,smooth,lerp,view,part,pinned,follower,motion,data,coarse,jumpTo,absTop,kick} from '../core.js';
import {G5} from '../gear5.js';
import {onTilt} from '../tilt.js';
import {COLORS,HUE,face,big,small,hue,rank,label,light,inspect,picturesOf} from '../tcg.js';

export function initCards(){
 const sec=$('#vault'),T=data.tcg;
 if(!T||!sec){if(sec)sec.hidden=true;return;}
 const band=c=>c.kind==='DON'?0:COLORS.indexOf(c.colors[0])+1;
 const cards=[...T.cards].sort((a,b)=>band(a)-band(b)||rank(a)-rank(b)||a.no.localeCompare(b.no));
 const N=cards.length,BANDS=['DON!!',...COLORS];
 const helix=$('#vt-helix'),info=$('#vt-info'),word=$('#vt-word'),ladder=$('#vt-ladder'),intro=$('#vt-intro'),pin=sec.querySelector('.pin');
 const src=coarse||view.vw<=820?small:big;

 helix.innerHTML=cards.map((c,i)=>`<button class="vt-card" data-card="${i}" aria-label="${esc(c.name)}, ${esc(label(c))}. Open"><span class="vt-front">${face(c,{src:()=>'',lazy:false})}<i class="vt-shade"></i></span><span class="vt-back" aria-hidden="true"><i></i><b>Grand Archive</b></span></button>`).join('');
 const els=[...helix.children],imgs=els.map(el=>el.querySelector('img')),shades=els.map(el=>el.querySelector('.vt-shade'));
 imgs.forEach(im=>{im.onload=()=>im.classList.add('ok');});
 // the side ladder: one rung per colour, with how many cards it holds
 const count=BANDS.map((_,b)=>cards.filter(c=>band(c)===b).length),first=BANDS.map((_,b)=>cards.findIndex(c=>band(c)===b));
 ladder.innerHTML=BANDS.map((b,k)=>count[k]?`<li><button data-vt="${first[k]}" style="--hue:${HUE[b]}"><i></i><span>${b}</span><small>${count[k]}</small></button></li>`:'').join('');
 const rungs=[...ladder.querySelectorAll('button')];
 $('#vt-count').textContent=N;

 /* ---------------- geometry ---------------- */
 let K=14,STEP=360/14,R=600,RISE=30,CW=200;
 function layout(){
  const phone=view.vw<=820;
  K=phone?11:14;STEP=360/K;
  CW=phone?Math.min(view.vw*0.44,190):Math.min(view.vh*0.3,236);
  helix.style.setProperty('--cw',CW+'px');
  R=Math.round(CW*1.16/(2*Math.tan(Math.PI/K)));
  RISE=CW*1.396*1.42/K;                                   // one full turn climbs a card and a half
  els.forEach((el,i)=>{el.style.transform=`translate3d(0,${(-i*RISE).toFixed(1)}px,0) rotateY(${(i*STEP).toFixed(2)}deg) translateZ(${R}px)`;});
  sec.style.height=motion.reduced?'auto':`${Math.round(N*(phone?7.2:8.4)+150)}svh`;
 }

 /* ---------------- the climb ---------------- */
 const f=follower(120),look={x:0,y:0};let front=-1,bandNow=-1,loaded=new Set();
 const sOf=p=>clamp((p-0.06)/0.84)*(N-1);
 const pOf=s=>0.06+s/(N-1)*0.84;
 const load=i=>{if(i<0||i>=N||loaded.has(i))return;loaded.add(i);imgs[i].src=src(cards[i]);};
 function render(p){
  const x=sOf(p),out=smooth(clamp((p-0.9)/0.09)),phone=view.vw<=820,io=1-smooth(clamp(p/0.05));
  // at the top the camera backs away to show the whole tower (and keeps it turning)
  const scale=lerp(1,phone?0.36:0.42,out),spin=out*STEP*5;
  let bob=0;if(G5.on&&!motion.reduced)bob=G5.beat*CW*0.12;
  helix.style.transform=`translateZ(${(-R).toFixed(1)}px) scale(${scale.toFixed(4)}) rotateX(${(look.y*5-out*8).toFixed(2)}deg) translate3d(0,${(x*RISE-out*(N-1)*RISE*0.5-bob+io*view.vh*(phone?0.27:0.24)).toFixed(1)}px,0) rotateY(${(-x*STEP-spin+look.x*10).toFixed(2)}deg)`;
  // only the nearby turns are drawn; the further a card is from the front, the darker
  const span=out>0.05?N:K*1.15;
  for(let i=0;i<N;i++){const d=Math.abs(i-x),el=els[i];
   if(d>span){if(el._v!==0){el._v=0;el.style.visibility='hidden';}continue;}
   if(el._v!==1){el._v=1;el.style.visibility='';}
   const o=Math.min(0.86,d*0.13+(d>K*0.6?0.25:0))*(1-out*0.6);if(Math.abs((el._o??-1)-o)>0.01){el._o=o;shades[i].style.opacity=o.toFixed(2);}
  }
  for(let i=Math.floor(x)-12;i<=Math.ceil(x)+12;i++)load(i);
  if(out>0.05)for(let i=0;i<N;i+=1)load(i);
  else for(const i of loaded)if(Math.abs(i-x)>26){loaded.delete(i);imgs[i].classList.remove('ok');imgs[i].removeAttribute('src');}
  const k=Math.round(x);
  if(k!==front){front=k;els.forEach((el,i)=>el.classList.toggle('front',i===k));const c=cards[k];
   info.innerHTML=`<b>${esc(c.name)}</b><span>${esc(label(c))}</span><small>${String(k+1).padStart(2,'0')} / ${N}${c.set&&c.kind!=='DON'?' · '+esc(c.set):''}</small>`;
   sec.style.setProperty('--hue',hue(c));
   const b=band(c);if(b!==bandNow){bandNow=b;word.textContent=BANDS[b].replace('!!','');word.style.setProperty('--hue',HUE[BANDS[b]]);word.classList.remove('swap');void word.offsetWidth;word.classList.add('swap');rungs.forEach(r=>r.classList.toggle('now',+r.dataset.vt===first[b]));}}
  intro.style.opacity=io.toFixed(3);intro.style.visibility=io<0.01?'hidden':'';
  info.style.opacity=((1-out)*(1-io)).toFixed(3);word.style.opacity=(1-out).toFixed(3);ladder.style.opacity=(Math.min(1-io,1-out)).toFixed(3);
  sec.classList.toggle('tower',out>0.5);
 }
 layout();
 part({el:sec,measure(){layout();},update(sc){
  if(motion.reduced)return;
  f.target=pinned(this,sc);
  if(f.v!==null&&Math.abs(f.target-f.v)>0.25)f.v=f.target;
  render(f.step(view.t));if(G5.on)kick();
 }});

 /* ---------------- touch, light, jumps ---------------- */
 let lraf=0;const tgt={x:0,y:0};
 const tick=()=>{lraf=0;look.x+=(tgt.x-look.x)*0.12;look.y+=(tgt.y-look.y)*0.12;render(f.v??0);if(Math.abs(tgt.x-look.x)+Math.abs(tgt.y-look.y)>0.004)lraf=requestAnimationFrame(tick);};
 const lookAt=(x,y)=>{tgt.x=x;tgt.y=y;if(!lraf&&!motion.reduced)lraf=requestAnimationFrame(tick);};
 if(!coarse){
  pin.addEventListener('pointermove',e=>{lookAt((e.clientX/view.vw-0.5)*2,(e.clientY/view.vh-0.5)*-2);const el=e.target.closest('.vt-card.front');if(el)light(el.querySelector('.tgf'),e.clientX,e.clientY);});
  pin.addEventListener('pointerleave',()=>lookAt(0,0));
 }
 onTilt(t=>{const r=sec.getBoundingClientRect();if(r.bottom>0&&r.top<view.vh){lookAt(t.x,-t.y);const el=els[front];if(el){const b=el.getBoundingClientRect();light(el.querySelector('.tgf'),b.left+b.width*(0.5+t.x*0.5),b.top+b.height*(0.5+t.y*0.5));}}});
 const goTo=i=>{const h=sec.offsetHeight-view.vh;jumpTo(absTop(sec)+pOf(i)*h);};
 helix.addEventListener('click',e=>{const b=e.target.closest('[data-card]');if(!b)return;const i=+b.dataset.card;
  if(i===front||motion.reduced)inspect(cards,i,{group:'The Card Vault',col:c=>picturesOf(c.char)});else goTo(i);});
 ladder.addEventListener('click',e=>{const b=e.target.closest('[data-vt]');if(b)goTo(+b.dataset.vt);});

 // Motion off: every card as a plain grid, in the same order
 const stat=$('#vt-static');
 const applyMotion=r=>{pin.hidden=r;stat.hidden=!r;
  if(r&&!stat.childElementCount)stat.innerHTML=cards.map((c,i)=>`<li><button data-vs="${i}" aria-label="${esc(c.name)}">${face(c)}</button><b>${esc(c.name)}</b><small>${esc(label(c))}</small></li>`).join('');
  sec.style.height=r?'auto':'';if(!r)layout();};
 stat.addEventListener('click',e=>{const b=e.target.closest('[data-vs]');if(b)inspect(cards,+b.dataset.vs,{group:'The Card Vault',col:c=>picturesOf(c.char)});});
 motion.listeners.push(applyMotion);applyMotion(motion.reduced);
 new IntersectionObserver(([e],io)=>{if(e.isIntersecting){for(let i=0;i<10;i++)load(i);io.disconnect();}},{rootMargin:'200% 0px'}).observe(sec);
}

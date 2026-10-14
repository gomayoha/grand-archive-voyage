// The Straw Hat Pirates: a walk down the deck, in 3D. Ten portraits stand along a dark walkway, each one
// turned toward you like a painting on an easel, their names written huge along the walls. Scrolling walks
// the camera forward; at every crew member it stops, turns its head to face them, and their record comes
// up beside them (role, dream, bounty, where they joined, and what stayed with him). Between two of them
// the camera swings from one side of the deck to the other, leaning into the turn. At the end of the deck
// the whole crew is waiting. On a desktop the mouse lets you look around a little.
// It is one CSS 3D scene: a single transform on the world per frame (the camera), plus fog (opacity) on
// the pieces near the edge of sight. Pieces behind the camera are hidden. Scrubbing eases like the Voyage.
import {$,esc,pad,clamp,smooth,lerp,view,part,pinned,follower,motion,data,coarse,FU,TH,jumpTo,absTop,kick} from '../core.js';
import {G5} from '../gear5.js';
import {registerCollection} from '../dialogs.js';

const ANG=34;                    // degrees each portrait is turned toward the walkway
const RAD=Math.PI/180;
const side=i=>i%2?-1:1;          // first portrait on the right, then alternating
const money=n=>n.toLocaleString('en-US');

export function initStrawHats(){
 const S=data.strawhats,sec=$('#strawhats');
 if(!S||!sec){if(sec)sec.hidden=true;return;}
 const crew=S.crew,N=crew.length,M=data.media;
 const photos=c=>{const p=c.photos||{};const col=p.char?M.characters.find(x=>x.home===p.char):M.crew.find(x=>x.name===p.crew);return col?col.all:[c.art];};
 registerCollection('sh',k=>{if(k==='all'){const c=M.crew.find(x=>x.name==='Straw Hats');return{title:'The Straw Hat Pirates',eyebrow:'The whole crew',ids:c?c.all:[]};}const c=crew.find(x=>x.id===k);return{title:c.short,eyebrow:`The Straw Hats · ${c.role}`,ids:photos(c)};});
 const dims=id=>M.img[id]||[4,5];

 const world=$('#sh-world'),cards=$('#sh-cards'),rail=$('#sh-rail'),intro=$('#sh-intro'),end=$('#sh-end'),stage=$('#sh-stage');

 /* ---------------- the scene ---------------- */
 world.innerHTML=crew.map((c,i)=>`
  <figure class="sh-panel" data-i="${i}" style="--tint:${c.tint}"><img alt="${esc(c.short)}" decoding="async" data-src="${FU(c.art)}"><figcaption>${esc(c.role)}</figcaption></figure>
  <figure class="sh-refl" data-i="${i}" aria-hidden="true"><img alt="" decoding="async" data-src="${TH(c.art)}"></figure>
  <i class="sh-pool" data-i="${i}" style="--tint:${c.tint}" aria-hidden="true"></i>
  <b class="sh-num" data-i="${i}" aria-hidden="true"><span>${pad(i+1)}</span></b>
  <b class="sh-wall" data-i="${i}" aria-hidden="true"><span>${esc(c.short.toUpperCase())}</span></b>`).join('')+
  `<figure class="sh-final"><img alt="The Straw Hat Pirates together" decoding="async" data-src="${FU(S.finale.art)}"></figure>
   <b class="sh-title3d" aria-hidden="true"><span data-w="sh.intro.title" data-wl="Title">Ten dreams.<br>One <em>ship.</em></span></b>`;
 const q=(cls)=>[...world.querySelectorAll(cls)];
 const panels=q('.sh-panel'),refls=q('.sh-refl'),pools=q('.sh-pool'),nums=q('.sh-num'),walls=q('.sh-wall'),final=world.querySelector('.sh-final'),title3d=world.querySelector('.sh-title3d');

 /* ---------------- the words beside each portrait ---------------- */
 cards.innerHTML=crew.map((c,i)=>{const k=`sh.${c.id}`,dr=c.draft?' data-wdraft':'';return `<article class="sh-card${side(i)>0?' l':' r'}" data-i="${i}" data-wg="${pad(i+1)} · ${esc(c.short)}" style="--tint:${c.tint}">
  <p class="sh-no"><b>${pad(i+1)}</b> / ${pad(N)} · ${esc(c.role)}</p>
  <h3>${esc(c.name)}</h3>
  <p class="sh-word"><small>What stayed with me</small><span data-w="${k}.word" data-wl="What stayed with me"${dr}>${esc(c.word)}</span></p>
  <p class="sh-lesson" data-w="${k}.lesson" data-wl="The lesson"${dr}>${esc(c.lesson)}</p>
  <blockquote class="sh-mine" data-w-wrap${c.mine?'':' hidden'}><span data-w="${k}.mine" data-wl="In my words">${c.mine?esc(c.mine.text):''}</span><cite>${esc(c.mine?c.mine.from:'In my words')}</cite></blockquote>
  <dl class="sh-facts"><div><dt>Dream</dt><dd>${esc(c.dream)}</dd></div><div><dt>Bounty</dt><dd>฿${money(c.bounty)}</dd></div><div><dt>Joined</dt><dd>${esc(c.joined)}</dd></div></dl>
  <div class="sh-acts"><button class="pill small" data-collection="sh:${c.id}">${photos(c).length} ${photos(c).length===1?'picture':'pictures'} →</button>${c.record?`<a class="link" href="#c-${c.record}" data-jump-record="${c.record}">My full record →</a>`:''}</div>
 </article>`;}).join('');
 const cardEls=[...cards.children];
 rail.innerHTML=crew.map((c,i)=>`<li><button data-sh="${i}" style="--tint:${c.tint}"><i></i><span>${esc(c.short)}</span></button></li>`).join('');
 const railBtns=[...rail.querySelectorAll('button')];
 $('#sh-total').textContent=`฿${money(S.total)}`;

 // The static version (Motion off): every member as a plain record.
 $('#sh-static').innerHTML=crew.map((c,i)=>`<li style="--tint:${c.tint}">${(()=>{const [w,h]=dims(c.art);return `<img src="${TH(c.art)}" width="${w}" height="${h}" alt="${esc(c.short)}" loading="lazy" decoding="async">`;})()}${cardEls[i].innerHTML}</li>`).join('');

 /* ---------------- geometry (re-measured on resize) ---------------- */
 let G=null,K=[];
 function layout(){
  const phone=view.vw<=820,vw=view.vw,vh=view.vh;
  const P=phone?760:1150;                                 // perspective = the distance a portrait is seen from
  const PH=phone?Math.min(vh*0.42,380):Math.min(vh*0.66,640);
  const X=phone?250:560,D=phone?1250:1600,dist=P;
  const floor=PH*0.5+(phone?26:40);
  G={phone,P,PH,X,D,dist,floor,vw,vh};
  stage.style.perspective=P+'px';
  const s=Math.sin(ANG*RAD),co=Math.cos(ANG*RAD);
  // how far the camera turns away from a portrait so it sits on its own half of the screen (desktop)
  const off=phone?0:Math.atan((vw*0.2)/P)/RAD;
  const lift=phone?vh*0.17:0;                             // phones: portrait high, words underneath
  const place=(el,x,y,z,ry=0,extra='')=>{el._p=[x,y,z];el.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateY(${ry}deg)${extra}`;};
  K=[];
  crew.forEach((c,i)=>{
   const sd=side(i),cx=sd*X,cz=-i*D,[w,h]=dims(c.art);
   const W=Math.min(PH*w/h,PH*1.25),H=W*h/w;
   for(const el of [panels[i],refls[i]]){el.style.width=W+'px';el.style.height=H+'px';el.style.marginLeft=-W/2+'px';el.style.marginTop=-H/2+'px';}
   place(panels[i],cx,floor-H/2,cz,-sd*ANG);
   place(refls[i],cx,floor+H/2+4,cz,-sd*ANG,' scaleY(-1)');
   pools[i].style.width=W*1.6+'px';pools[i].style.height=W*1.1+'px';pools[i].style.marginLeft=-W*0.8+'px';pools[i].style.marginTop=-W*0.55+'px';
   place(pools[i],cx,floor+1,cz,0,' rotateX(90deg)');
   const tx=Math.cos(ANG*RAD),tz=sd*Math.sin(ANG*RAD);       // the portrait's own sideways direction
   const nW=PH*0.62;nums[i].style.fontSize=nW+'px';
   place(nums[i],cx+sd*tx*(W/2+nW*0.62),floor-nW*0.5,cz+sd*tz*(W/2+nW*0.62)-30,-sd*ANG);
   const wf=PH*0.9;walls[i].style.fontSize=wf+'px';
   place(walls[i],sd*(X+(phone?520:900)),floor-wf*0.5,cz-D*0.35,-sd*90);
   // where the camera stands to face this portrait (straight on, then turned a little aside)
   const nx=-sd*s,nz=co,ex=cx+nx*dist,ez=cz+nz*dist;
   K.push({x:ex,y:lift,z:ez,yaw:sd*(ANG-off)});
  });
  // the start: at the head of the deck, looking down it; the end: facing the whole crew
  const zEnd=-(N-1)*D-D*1.15,[fw,fh]=dims(S.finale.art);
  const FH=phone?vh*0.5:vh*0.72,FW=FH*fw/fh;
  final.style.width=FW+'px';final.style.height=FH+'px';final.style.marginLeft=-FW/2+'px';final.style.marginTop=-FH/2+'px';
  place(final,0,floor-FH/2,zEnd);
  const tf=phone?96:Math.min(vw*0.13,190);title3d.style.fontSize=tf+'px';
  place(title3d,0,-tf*0.3,D*0.95);
  K.unshift({x:0,y:lift*0.4,z:D*1.9,yaw:0});
  K.push({x:0,y:phone?vh*0.16:vh*0.1,z:zEnd+P*(phone?1.25:1.12),yaw:0});
  sec.style.height=motion.reduced?'auto':`${Math.round((N+1)*(G.phone?78:88)+110)}svh`;
 }

 /* ---------------- the camera ---------------- */
 const f=follower(130),look={x:0,y:0,tx:0,ty:0};
 let cur=-2,loaded=new Set();
 const show=im=>{im.onload=()=>im.classList.add('ok');im.src=im.dataset.src;if(im.complete&&im.naturalWidth)im.classList.add('ok');};
 const load=i=>{if(i<0||i>=N||loaded.has(i))return;loaded.add(i);[panels[i],refls[i]].forEach(el=>show(el.querySelector('img')));};
 const sOf=p=>clamp((p-0.02)/0.96)*(N+1);
 const pOf=s=>0.02+s/(N+1)*0.96;
 function cam(s){
  const k0=Math.min(N,Math.floor(s)),fr=s-k0,a=K[k0],b=K[Math.min(N+1,k0+1)];
  // walk, then slow right down at each portrait (never fully still)
  const e=fr-Math.sin(2*Math.PI*fr)/(2*Math.PI)*0.86;
  const yaw=lerp(a.yaw,b.yaw,smooth(e));
  return{x:lerp(a.x,b.x,e),y:lerp(a.y,b.y,e)-Math.sin(Math.PI*e)*G.PH*0.05,z:lerp(a.z,b.z,e),yaw,
   roll:(b.yaw-a.yaw)*Math.sin(Math.PI*e)*0.045,pitch:-Math.sin(Math.PI*e)*1.2};
 }
 function render(s){
  const c=cam(s),yaw=c.yaw+look.x*7,pitch=c.pitch+look.y*4,{P}=G;
  // Gear 5: the whole deck bounces to the Drums of Liberation and sways like it's made of rubber
  if(G5.on&&!motion.reduced){const t=view.t||performance.now();c.y-=G5.beat*G.PH*0.14;c.roll+=Math.sin(t/620)*1.6+G5.beat*Math.sin(t/90)*1.2;}
  world.style.transform=`translateZ(${P}px) rotateZ(${c.roll.toFixed(3)}deg) rotateX(${pitch.toFixed(3)}deg) rotateY(${yaw.toFixed(3)}deg) translate3d(${(-c.x).toFixed(1)}px,${(-c.y).toFixed(1)}px,${(-c.z).toFixed(1)}px)`;
  // fog and culling: depth of a piece in front of the camera
  const sy=Math.sin(yaw*RAD),cy=Math.cos(yaw*RAD),far=G.phone?5200:7000,fogA=G.phone?2400:3200,fogL=G.phone?2400:3400;
  const fog=(el,near)=>{const [x,,z]=el._p,d=(x-c.x)*sy-(z-c.z)*cy;
   const o=d<near?0:(1-smooth(clamp((d-fogA)/fogL)))*smooth(clamp((d-near)/(near*1.2+60)));
   if(o<=0.002||d>far){if(el._o!==0){el._o=0;el.style.visibility='hidden';}return 0;}
   if(el._o===0)el.style.visibility='';
   if(Math.abs((el._o??-1)-o)>0.004){el._o=o;el.style.opacity=o.toFixed(3);}return o;};
  panels.forEach((el,i)=>{fog(el,G.PH*0.45);fog(refls[i],G.PH*0.45);fog(pools[i],G.PH*0.5);fog(nums[i],G.PH*0.6);fog(walls[i],G.PH*0.35);});
  fog(final,40);fog(title3d,G.P*0.62);
  // words: the record of whoever the camera is facing
  const k=Math.round(s)-1;
  cardEls.forEach((el,i)=>{const a=Math.abs(s-(i+1)),o=1-smooth(clamp((a-0.1)/0.3));
   if(o<=0.002){if(el._o!==0){el._o=0;el.style.visibility='hidden';el.classList.remove('live');}return;}
   if(el._o!==o&&!(el._o>0))el.style.visibility='visible';el._o=o;el.style.opacity=o.toFixed(3);
   el.style.transform=`translate3d(${((s-(i+1))*-60*side(i)).toFixed(1)}px,${((s-(i+1))*-30).toFixed(1)}px,0)`;el.classList.toggle('live',o>0.6);});
  const io=1-smooth(clamp(s/0.42));intro.style.opacity=io.toFixed(3);intro.style.visibility=io<0.01?'hidden':'visible';intro.style.transform=`translate3d(0,${(-s*80).toFixed(1)}px,0)`;
  const eo=smooth(clamp((s-N-0.45)/0.4));end.style.opacity=eo.toFixed(3);end.style.visibility=eo<0.01?'hidden':'visible';end.classList.toggle('live',eo>0.6);
  rail.style.opacity=(Math.min(1-io,1-eo)).toFixed(3);
  if(k!==cur){cur=k;railBtns.forEach((b,i)=>b.classList.toggle('now',i===k));}
  for(let i=Math.floor(s)-2;i<=Math.floor(s)+2;i++)load(i);
  // keep only the portraits near the camera decoded (phones run out of memory otherwise)
  for(const i of loaded)if(Math.abs(i+1-s)>4.2){loaded.delete(i);[panels[i],refls[i]].forEach(el=>{const im=el.querySelector('img');im.classList.remove('ok');im.removeAttribute('src');});}
  if(s>N-1.5&&!final._l){final._l=1;show(final.querySelector('img'));}
 }

 const pinEl=sec.querySelector('.pin');
 layout();
 part({el:sec,measure(){layout();},update(sc){
  if(motion.reduced)return;
  f.target=sOf(pinned(this,sc));
  if(f.v!==null&&Math.abs(f.target-f.v)>2.5)f.v=f.target;   // a jump from far away shouldn't replay the walk
  render(f.step(view.t));
  if(G5.on)kick();
 }});
 // look around with the mouse (desktop): the camera turns its head a few degrees toward the pointer
 if(!coarse){let raf=0;pinEl.addEventListener('pointermove',e=>{look.tx=(e.clientX/view.vw-0.5)*2;look.ty=(e.clientY/view.vh-0.5)*-2;if(!raf)raf=requestAnimationFrame(function tick(){raf=0;if(motion.reduced||!G)return;look.x+=(look.tx-look.x)*0.1;look.y+=(look.ty-look.y)*0.1;render(f.v??0);if(Math.abs(look.tx-look.x)+Math.abs(look.ty-look.y)>0.004)raf=requestAnimationFrame(tick);});});
  pinEl.addEventListener('pointerleave',()=>{look.tx=0;look.ty=0;pinEl.dispatchEvent(new PointerEvent('pointermove',{clientX:view.vw/2,clientY:view.vh/2}));});}
 // the rail: walk straight to someone
 rail.addEventListener('click',e=>{const b=e.target.closest('[data-sh]');if(!b)return;const p=sec.offsetHeight-view.vh;jumpTo(absTop(sec)+pOf(+b.dataset.sh+1)*p);f.v=null;});
 cards.addEventListener('click',e=>{const a=e.target.closest('[data-jump-record]');if(!a)return;e.preventDefault();const el=document.getElementById('c-'+a.dataset.jumpRecord);if(el)jumpTo(absTop(el));});

 const applyMotion=r=>{pinEl.hidden=r;$('#sh-static').hidden=!r;sec.style.height=r?'auto':'';if(!r)layout();};
 motion.listeners.push(applyMotion);applyMotion(motion.reduced);
 // pictures: start loading the first few before the section arrives
 new IntersectionObserver(([e],io)=>{if(e.isIntersecting){[0,1,2].forEach(load);io.disconnect();}},{rootMargin:'200% 0px'}).observe(sec);
}

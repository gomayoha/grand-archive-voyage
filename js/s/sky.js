// The night sky (the Dream Constellation). Every character who left something behind is a constellation:
// the bright star is the character, the stars around it are what they taught him (the lesson tags from his
// archive, and short fragments of his own notes for the newer ones). The camera stands at the centre of
// the celestial sphere; scrolling turns it from one constellation to the next, and each one's lines draw
// in as it comes round. At the end the camera looks straight up and the field of view opens: a thread of
// light runs from every constellation to a single star, the main quest from his save file.
// Stars, nebula and lines are painted on one canvas with the same projection the labels use, so the sky is
// genuinely 3D without hundreds of layers. The canvas only runs while the section is on screen.
import {$,esc,clamp,smooth,lerp,view,part,pinned,follower,motion,data,coarse,TH,jumpTo,absTop} from '../core.js';
import {G5} from '../gear5.js';
import {onTilt} from '../tilt.js';

const RAD=Math.PI/180;
// Lessons for the ones without tags in his old archive: fragments of his own notes, kept close to his words.
const EXTRA={'violet-evergarden':['Learn emotions','Understand people','Be a better person'],'sung-jinwoo':['Protect humanity','Become human again','Fight unseen'],
 kuma:['Sacrifice','Kindness','Carry pain silently'],'bon-clay':['Loyalty','The most unexpected person'],corazon:['Love','Change a life'],asta:['Outwork the limit','Build anyway']};
const slug=s=>String(s).toLowerCase().replace(/[^a-z]+/g,'-').replace(/^-|-$/g,'');
// a seeded random, so every constellation keeps its shape
const rng=seed=>()=>((seed=(seed*16807)%2147483647)/2147483647);

export function initSky(){
 const sec=$('#sky');if(!sec)return;
 const CH=data.characters?.characters||[],SUP=data.characters?.supporting||[],ARCH=data.archive?.characters||[];
 const key4=s=>String(s).toLowerCase().slice(0,4);
 const list=[
  ...CH.map(c=>({id:c.id,name:c.name,series:c.series,word:c.word||'',line:c.left||'',record:c.id,img:c.image&&`assets/chars/m/${c.image.id}.webp`,tint:c.image?.color,lessons:(ARCH.find(a=>key4(a.name)===key4(c.name))?.lessons)||EXTRA[c.id]||[]})),
  ...SUP.map(c=>({id:slug(c.name),name:c.name,series:c.series||'Black Clover',word:c.word||'',line:c.line,img:{Kuma:TH('150990e0419f'),Asta:data.posters?.['anime:Black Clover']?.img}[c.name]||null,lessons:EXTRA[slug(c.name)]||[]}))
 ].filter(c=>c.lessons.length);
 const N=list.length;if(!N){sec.hidden=true;return;}
 const quest=((data.route?.save||[]).find(l=>/^MAIN QUEST/i.test(l))||'MAIN QUEST: Become a better version of myself').split(':').slice(1).join(':').trim();

 /* ---------------- the sphere: where every star sits ---------------- */
 const dir=(th,ph)=>[Math.sin(th)*Math.cos(ph),-Math.sin(ph),-Math.cos(th)*Math.cos(ph)];
 const norm=v=>{const l=Math.hypot(...v);return v.map(x=>x/l);};
 const cons=list.map((c,i)=>{
  const r=rng((i+3)*7919),th=i*(360/N)*RAD,ph=[9,-8,13,-4,6,-11,11,-2,7,-9,12,-5,4,-12,8][i%15]*RAD;
  // tangent directions on the sky around this constellation's centre: east, and up
  const C=dir(th,ph),east=[Math.cos(th),0,Math.sin(th)],up=[-Math.sin(th)*Math.sin(ph),-Math.cos(ph),Math.cos(th)*Math.sin(ph)];
  const pts=[[0,0]];c.lessons.forEach((_,k)=>{const a=(k/c.lessons.length)*Math.PI*2+r()*0.9+0.4,d=0.09+r()*0.07;pts.push([Math.cos(a)*d*1.25,Math.sin(a)*d]);});
  const stars=pts.map(([x,y])=>norm(C.map((cc,k)=>cc+east[k]*x+up[k]*y)));
  // lines: the character to the nearest lesson, then lesson to lesson around, one spoke back
  const edges=[];for(let k=1;k<stars.length;k++)edges.push(k===1?[0,1]:[k-1,k]);if(stars.length>3)edges.push([0,stars.length-1]);
  return{...c,th,ph,C,stars,edges};
 });
 const ZEN=[0,-1,0];

 /* ---------------- labels (DOM) ---------------- */
 const layer=$('#sk-stars');
 layer.innerHTML=cons.map((c,i)=>`<button class="sk-star main" data-k="${i}" style="--tint:${c.tint||'#f3c969'}" aria-label="${esc(c.name)}">${c.img?`<img src="${esc(c.img)}" alt="" decoding="async">`:`<b>${esc(c.name[0])}</b>`}<span>${esc(c.name)}</span></button>`+
  c.lessons.map((l,k)=>`<span class="sk-star" data-k="${i}" data-l="${k}" aria-hidden="true"><i></i><span>${esc(l)}</span></span>`).join('')).join('')+
  `<span class="sk-star north" aria-hidden="true"><i></i></span>`;
 const els=[...layer.children],north=layer.querySelector('.north');
 cons.forEach((c,i)=>{c.els=els.filter(e=>+e.dataset.k===i);});
 $('#sk-quest').innerHTML=(()=>{const w=esc(quest).split(' ');const last=w.pop();return `${w.join(' ')} <em>${last}</em>`;})();

 /* ---------------- background stars + a faint band of the galaxy ---------------- */
 const bg=[];{const r=rng(424242);
  for(let k=0;k<900;k++){const u=r()*2-1,a=r()*Math.PI*2,s=Math.sqrt(1-u*u);bg.push({v:[s*Math.cos(a),u,s*Math.sin(a)],m:r()**3*2.1+0.5,b:0.35+r()*0.65,p:r()*6.28,c:r()<0.12?'#cfe0ff':r()<0.08?'#ffe1b0':'#ffffff'});}
  // the band: a tilted great circle, densely starred
  const tilt=0.5;for(let k=0;k<700;k++){const a=r()*Math.PI*2,off=(r()+r()+r()-1.5)*0.16;const v=norm([Math.cos(a),Math.sin(a)*Math.sin(tilt)+off,Math.sin(a)*Math.cos(tilt)+off*0.5]);bg.push({v,m:r()**4*1.4+0.45,b:0.25+r()*0.5,p:r()*6.28,c:'#ffffff'});}
 }
 const neb=[];{const r=rng(99);for(let k=0;k<26;k++){const a=k/26*Math.PI*2+r()*0.2;neb.push({v:norm([Math.cos(a),Math.sin(a)*Math.sin(0.5)+(r()-0.5)*0.1,Math.sin(a)*Math.cos(0.5)]),s:0.18+r()*0.2,h:r()<0.5?'120,150,255':'200,140,255',a:0.05+r()*0.06});}}

 /* ---------------- camera ---------------- */
 const cv=$('#sk-canvas'),cx=cv.getContext('2d');let W=0,H=0,DPR=1,P0=900,phone=false;
 function size(){phone=view.vw<=820;DPR=Math.min(2,devicePixelRatio||1);W=view.vw;H=view.vh;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);cv.style.width=W+'px';cv.style.height=H+'px';P0=phone?Math.max(420,W*1.4):Math.min(1050,W*0.78);}
 // key views: the opening (looking up into empty sky), one per constellation, then straight up
 const keys=()=>{const off=phone?0:13*RAD,lift=phone?9*RAD:2*RAD;
  return[{yaw:cons[0].th-38*RAD,pitch:16*RAD,fov:1},...cons.map(c=>({yaw:c.th-off,pitch:c.ph+lift,fov:1})),{yaw:cons[N-1].th+24*RAD,pitch:86*RAD,fov:phone?0.5:0.42}];};
 let K=[];
 const look={x:0,y:0,tx:0,ty:0};
 function camAt(s){const k0=Math.min(N,Math.floor(s)),fr=s-k0,a=K[k0],b=K[Math.min(N+1,k0+1)],e=fr-Math.sin(2*Math.PI*fr)/(2*Math.PI)*0.8;
  return{yaw:lerp(a.yaw,b.yaw,smooth(e))+look.x*6*RAD,pitch:lerp(a.pitch,b.pitch,smooth(e))+look.y*4*RAD,fov:lerp(a.fov,b.fov,smooth(e)),roll:(b.yaw-a.yaw)*Math.sin(Math.PI*e)*0.06};}
 let cam=null;
 const project=(v,R=1)=>{const {yaw:y,pitch:p,roll:rl}=cam,cy=Math.cos(y),sy=Math.sin(y),cp=Math.cos(p),sp=Math.sin(p);
  const x1=v[0]*cy+v[2]*sy,z1=-v[0]*sy+v[2]*cy,y2=v[1]*cp-z1*sp,z2=v[1]*sp+z1*cp;if(z2>-0.05)return null;
  const P=P0*cam.fov,f=P/-z2,cr=Math.cos(rl),sr=Math.sin(rl),X=x1*f,Y=y2*f;return[W/2+X*cr-Y*sr,H/2+X*sr+Y*cr,f];};

 /* ---------------- drawing ---------------- */
 let sNow=0,tNow=0;
 function render(s){
  sNow=s;cam=camAt(s);const t=tNow,beat=G5.on?G5.beat:0;
  cx.setTransform(DPR,0,0,DPR,0,0);cx.clearRect(0,0,W,H);
  // nebula
  for(const n of neb){const q=project(n.v);if(!q)continue;const r=n.s*q[2];if(r<4)continue;const g=cx.createRadialGradient(q[0],q[1],0,q[0],q[1],r);g.addColorStop(0,`rgba(${n.h},${n.a})`);g.addColorStop(1,`rgba(${n.h},0)`);cx.fillStyle=g;cx.fillRect(q[0]-r,q[1]-r,r*2,r*2);}
  // stars
  for(const st of bg){const q=project(st.v);if(!q||q[0]<-4||q[0]>W+4||q[1]<-4||q[1]>H+4)continue;
   const tw=0.65+0.35*Math.sin(t*0.0016+st.p*3+beat*4);cx.globalAlpha=Math.min(1,st.b*tw+beat*0.3);cx.fillStyle=st.c;const m=st.m*(0.8+q[2]/P0*0.25);
   if(m<1.1)cx.fillRect(q[0],q[1],m,m);else{cx.beginPath();cx.arc(q[0],q[1],m/1.6,0,6.283);cx.fill();}}
  cx.globalAlpha=1;
  // constellations: lines draw in as each one comes round
  const fin=smooth(clamp((s-N-0.15)/0.7));
  cons.forEach((c,i)=>{
   const a=1-smooth(clamp((Math.abs(s-(i+1))-0.12)/0.55)),act=Math.max(a,fin*0.55);
   c.act=a;const Q=c.stars.map(v=>project(v));c.Q=Q;
   cx.strokeStyle=`rgba(243,201,105,${(0.13+0.75*act).toFixed(3)})`;cx.lineWidth=(0.8+act*0.9+beat*1.5);cx.lineCap='round';
   const grow=0.18+0.82*smooth(clamp(act*1.35));
   for(const [p,q] of c.edges){const A=Q[p],B=Q[q];if(!A||!B)continue;cx.beginPath();cx.moveTo(A[0],A[1]);cx.lineTo(A[0]+(B[0]-A[0])*grow,A[1]+(B[1]-A[1])*grow);cx.stroke();}
  });
  // the finale: a thread from every constellation up to one star
  const Zq=project(ZEN);
  if(fin>0.001){cx.lineWidth=1.2;cons.forEach((c,i)=>{const from=c.stars[0],u0=0,u1=fin;cx.strokeStyle=`rgba(255,238,200,${(0.5*fin).toFixed(3)})`;cx.beginPath();let first=true;
    for(let k=0;k<=24;k++){const u=u0+(u1-u0)*k/24,ang=Math.acos(Math.max(-1,Math.min(1,from[1]*-1))),sa=Math.sin(ang)||1,w1=Math.sin((1-u)*ang)/sa,w2=Math.sin(u*ang)/sa,v=[from[0]*w1+ZEN[0]*w2,from[1]*w1+ZEN[1]*w2,from[2]*w1+ZEN[2]*w2],q=project(v);if(!q){first=true;continue;}if(first){cx.moveTo(q[0],q[1]);first=false;}else cx.lineTo(q[0],q[1]);}
    cx.stroke();});
   if(Zq){const r=40+fin*90,g=cx.createRadialGradient(Zq[0],Zq[1],0,Zq[0],Zq[1],r);g.addColorStop(0,`rgba(255,246,220,${0.9*fin})`);g.addColorStop(0.2,`rgba(243,201,105,${0.35*fin})`);g.addColorStop(1,'rgba(243,201,105,0)');cx.fillStyle=g;cx.fillRect(Zq[0]-r,Zq[1]-r,r*2,r*2);}}
  // labels follow their stars
  const scl=phone?0.8:1;
  cons.forEach((c,i)=>{c.els.forEach((el,k)=>{const q=c.Q[k];if(!q||q[0]<-120||q[0]>W+120||q[1]<-80||q[1]>H+80){if(el._v!==0){el._v=0;el.style.visibility='hidden';}return;}
    if(el._v!==1){el._v=1;el.style.visibility='visible';}
    const z=Math.max(0.55,Math.min(1.25,q[2]/P0))*scl;el.style.transform=`translate3d(${q[0].toFixed(1)}px,${q[1].toFixed(1)}px,0) scale(${z.toFixed(3)})`;
    const o=k===0?0.45+0.55*Math.max(c.act,fin):0.22+0.78*c.act;if(Math.abs((el._o??-1)-o)>0.01){el._o=o;el.style.opacity=o.toFixed(3);el.classList.toggle('on',c.act>0.5);}});});
  if(Zq&&fin>0.01){north.style.visibility='visible';north.style.opacity=fin.toFixed(3);north.style.transform=`translate3d(${Zq[0].toFixed(1)}px,${Zq[1].toFixed(1)}px,0)`;}else north.style.visibility='hidden';
  overlays(s,fin);
 }

 /* ---------------- words on screen ---------------- */
 const card=$('#sk-card'),intro=$('#sk-intro'),northCopy=$('#sk-north');let shown=-2;
 function overlays(s,fin){
  const io=1-smooth(clamp(s/0.45));intro.style.opacity=io.toFixed(3);intro.style.visibility=io<0.01?'hidden':'visible';
  const k=Math.round(s)-1,near=Math.abs(s-(k+1)),co=k>=0&&k<N?1-smooth(clamp((near-0.18)/0.3)):0;
  if(k!==shown&&k>=0&&k<N){shown=k;const c=cons[k];
   card.innerHTML=`<p class="sk-series">${esc(c.series||'')}</p><h3>${esc(c.name)}</h3>${c.word?`<p class="sk-word"><small>Left behind</small><span>${esc(c.word)}</span></p>`:''}${c.line?`<p class="sk-line">${esc(c.line)}</p>`:''}<ul class="sk-lessons">${c.lessons.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>${c.record?`<a class="link" href="#c-${esc(c.record)}" data-sk-record="${esc(c.record)}">My record →</a>`:''}`;
   card.style.setProperty('--tint',c.tint||'#f3c969');card.classList.remove('in');void card.offsetWidth;card.classList.add('in');}
  card.style.opacity=co.toFixed(3);card.style.visibility=co<0.01?'hidden':'visible';card.classList.toggle('live',co>0.6);
  northCopy.style.opacity=smooth(clamp((fin-0.45)/0.5)).toFixed(3);northCopy.style.visibility=fin<0.46?'hidden':'visible';
 }

 /* ---------------- scroll, pointer, twinkle ---------------- */
 const f=follower(130),pinEl=sec.querySelector('.pin');
 const sOf=p=>clamp((p-0.02)/0.96)*(N+1),pOf=s=>0.02+s/(N+1)*0.96;
 function layout(){size();K=keys();sec.style.height=motion.reduced?'auto':`${Math.round((N+1)*(phone?62:70)+120)}svh`;}
 layout();
 part({el:sec,measure(){const was=phone;layout();if(was!==phone)shown=-2;},update(sc){if(motion.reduced)return;f.target=sOf(pinned(this,sc));if(f.v!==null&&Math.abs(f.target-f.v)>3)f.v=f.target;tNow=performance.now();render(f.step(view.t));}});
 // the sky keeps twinkling while it's on screen, even when you stop scrolling
 let visible=false,raf=0,last=0;
 const tick=t=>{raf=0;if(!visible||motion.reduced)return;if(t-last>33){last=t;tNow=t;look.x+=(look.tx-look.x)*0.12;look.y+=(look.ty-look.y)*0.12;render(f.v??sOf(pinned({top:absTop(sec),h:sec.offsetHeight})));}raf=requestAnimationFrame(tick);};
 new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible&&!raf)raf=requestAnimationFrame(tick);},{threshold:0}).observe(sec);
 if(!coarse){pinEl.addEventListener('pointermove',e=>{look.tx=(e.clientX/W-0.5)*2;look.ty=(0.5-e.clientY/H)*2;});pinEl.addEventListener('pointerleave',()=>{look.tx=look.ty=0;});}
 onTilt(t=>{look.tx=t.x*1.4;look.ty=-t.y*1.4;});
 // tap a character's star to turn the sky to them
 layer.addEventListener('click',e=>{const b=e.target.closest('.sk-star.main');if(!b)return;const k=+b.dataset.k;jumpTo(absTop(sec)+pOf(k+1)*(sec.offsetHeight-view.vh));f.v=null;});
 card.addEventListener('click',e=>{const a=e.target.closest('[data-sk-record]');if(!a)return;e.preventDefault();const el=document.getElementById('c-'+a.dataset.skRecord);if(el)jumpTo(absTop(el));});
 // Motion off: no sky, just the constellations written out
 $('#sk-static').innerHTML=cons.map(c=>`<li><b>${esc(c.name)}</b>${c.word?` <i>${esc(c.word)}</i>`:''}<span>${c.lessons.map(esc).join(' · ')}</span></li>`).join('')+`<li class="q"><b>Main quest</b><span>${esc(quest)}</span></li>`;
 const applyMotion=r=>{pinEl.hidden=r;$('#sk-static').hidden=!r;layout();};
 motion.listeners.push(applyMotion);applyMotion(motion.reduced);
}

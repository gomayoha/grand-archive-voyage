// Dive in: fly through a collection in 3D. Every picture hangs in the dark along a long tunnel, spiralling
// round the centre (golden-angle spacing, so they never line up), all turned toward you. The camera drifts
// forward on its own; scroll, swipe or drag to fly faster, back up, or stop. The tunnel slowly turns, so it
// feels like falling through a vortex of everything you saved. Tap a picture to open it full size.
// Only the ~40 pictures nearest the camera exist at any time (a recycled pool), so a thousand pictures
// cost the same as forty.
import {esc,data,motion,coarse,TH,FU} from './core.js';
import {openViewer,registerCollection} from './dialogs.js';
import {G5} from './gear5.js';
import {onTilt} from './tilt.js';
onTilt(t=>{if(state){state.lx=t.x*0.6;state.ly=t.y*0.6;}});

const GOLD=137.508*Math.PI/180,POOL=44;
let box=null,state=null;

function build(){
 box=document.createElement('div');box.className='tn';box.hidden=true;box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','Dive in');
 box.innerHTML=`<div class="tn-stage"><div class="tn-world"></div><i class="tn-core" aria-hidden="true"></i></div>
  <header class="tn-top"><div><p class="eyebrow" id="tn-k"></p><h2 id="tn-title"></h2></div><button class="tn-close" id="tn-close">Close ✕</button></header>
  <p class="tn-count" id="tn-count"></p><p class="tn-hint" id="tn-hint">${coarse?'Swipe up to fly · tap a picture to open it':'Scroll to fly · tap a picture to open it'}</p>`;
 document.body.append(box);
 const world=box.querySelector('.tn-world');
 for(let i=0;i<POOL;i++){const b=document.createElement('button');b.className='tn-card';b.innerHTML='<img alt="" decoding="async">';b.style.visibility='hidden';world.append(b);}
 box.querySelector('#tn-close').addEventListener('click',close);
 box.addEventListener('click',e=>{const c=e.target.closest('.tn-card');if(!c||c.dataset.i==null||state.dragged)return;const s=state;registerCollection('tunnel',()=>({title:s.title,eyebrow:s.eyebrow,ids:s.ids}));openViewer('tunnel',s.ids[+c.dataset.i]);});
 // fly: wheel, touch and drag push the camera; it coasts and settles back to its cruising speed
 box.addEventListener('wheel',e=>{e.preventDefault();state.vel+=e.deltaY*(e.deltaMode?40:1)*2.2;},{passive:false});
 let ty=null,lastY=0,lastT=0;
 box.addEventListener('pointerdown',e=>{if(e.target.closest('.tn-close'))return;ty=e.clientY;lastY=e.clientY;lastT=performance.now();state.dragged=false;});
 addEventListener('pointermove',e=>{if(ty===null||!state)return;const dy=lastY-e.clientY,now=performance.now();if(Math.abs(e.clientY-ty)>6)state.dragged=true;state.z-=dy*6;state.vel=dy*6/Math.max(8,now-lastT)*16*8;lastY=e.clientY;lastT=now;});
 addEventListener('pointerup',()=>{ty=null;setTimeout(()=>{if(state)state.dragged=false;},0);});
 box.addEventListener('pointermove',e=>{if(!state||coarse)return;state.lx=(e.clientX/innerWidth-0.5);state.ly=(e.clientY/innerHeight-0.5);});
 addEventListener('keydown',e=>{if(!state||box.hidden)return;if(e.key==='Escape'&&!document.querySelector('dialog[open]'))close();if(e.key==='ArrowDown'||e.key===' ')state.vel+=900;if(e.key==='ArrowUp')state.vel-=900;});
}

export function openTunnel({title,eyebrow='Dive in',ids}){
 ids=(ids||[]).filter(id=>data.media?.img?.[id]);if(!ids.length)return;
 if(!box)build();
 const phone=innerWidth<=820,gap=phone?150:130;
 state={title,eyebrow,ids,z:-300,vel:0,rot:0,lx:0,ly:0,mx:0,my:0,gap,phone,last:performance.now(),raf:0,dragged:false,
  pos:ids.map((id,i)=>{const r=(i*7919%997)/997;return{a:i*GOLD,rad:(phone?0.42:0.34)+r*(phone?0.5:0.48),z:-i*gap-600};})};
 box.querySelector('#tn-k').textContent=eyebrow;box.querySelector('#tn-title').textContent=title;
 box.hidden=false;document.documentElement.style.overflow='hidden';
 box.classList.remove('in');void box.offsetWidth;box.classList.add('in');
 state.raf=requestAnimationFrame(loop);
}
function close(){if(!state)return;cancelAnimationFrame(state.raf);box.classList.remove('in');document.documentElement.style.overflow='';const b=box;setTimeout(()=>{if(!state)b.hidden=true;},motion.reduced?0:380);state=null;}

function loop(t){
 const s=state;if(!s)return;s.raf=requestAnimationFrame(loop);
 const dt=Math.min(0.05,(t-s.last)/1000);s.last=t;
 const cruise=motion.reduced?0:(160+(G5.on?G5.beat*900:0));
 s.vel+=(cruise-s.vel)*Math.min(1,dt*1.6);s.z-=s.vel*dt;
 const end=-(s.ids.length*s.gap)-400;if(s.z<end)s.z=end;if(s.z>-200){s.z=-200;if(s.vel<0)s.vel=0;}
 s.rot+=dt*(motion.reduced?0:0.06+Math.min(0.5,Math.abs(s.vel)/9000));s.mx+=(s.lx-s.mx)*0.06;s.my+=(s.ly-s.my)*0.06;
 const W=innerWidth,H=innerHeight,R=Math.max(W,H)*0.62,P=s.phone?620:900,far=s.phone?3600:4600;
 const world=box.querySelector('.tn-world'),cards=world.children;
 box.firstChild.style.perspective=P+'px';
 world.style.transform=`rotateZ(${(s.rot*57.3).toFixed(2)}deg) rotateY(${(s.mx*10).toFixed(2)}deg) rotateX(${(-s.my*8).toFixed(2)}deg)`;
 // which pictures are near the camera
 const i0=Math.max(0,Math.floor((-s.z-600)/s.gap)-1),i1=Math.min(s.ids.length-1,i0+Math.ceil(far/s.gap));
 let k=0;
 for(let i=i0;i<=i1&&k<cards.length;i++){
  const p=s.pos[i],d=p.z-s.z;               // how far in front of the camera (negative = ahead)
  const depth=-d;if(depth<-60||depth>far)continue;
  const el=cards[k++],id=s.ids[i],[w,h]=data.media.img[id];
  if(el.dataset.i!==String(i)){el.dataset.i=i;const im=el.firstChild;im.classList.remove('ok');im.onload=()=>im.classList.add('ok');im.src=TH(id);el.style.aspectRatio=`${w}/${h}`;el.style.setProperty('--w',(s.phone?150:220)*Math.min(1.25,Math.sqrt((w/h)))+'px');}
  const x=Math.cos(p.a)*p.rad*R,y=Math.sin(p.a)*p.rad*R;
  const o=Math.min(1,(far-depth)/(far*0.35))*Math.min(1,(depth+60)/260);
  el.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${d.toFixed(1)}px) rotateZ(${(-s.rot*57.3).toFixed(2)}deg)`;
  el.style.opacity=Math.max(0,o).toFixed(3);el.style.visibility='visible';el.style.zIndex=String(Math.round(10000-depth));
 }
 for(;k<cards.length;k++){if(cards[k].style.visibility!=='hidden'){cards[k].style.visibility='hidden';cards[k].dataset.i='';}}
 const at=Math.min(s.ids.length,Math.max(1,Math.round((-s.z-600)/s.gap)+1));
 box.querySelector('#tn-count').textContent=`${at.toLocaleString('en-US')} / ${s.ids.length.toLocaleString('en-US')}`;
}

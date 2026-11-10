// The lake of Ohara (Nov 2026). When Ohara burned, the scholars threw the books into the lake so they would outlive
// the fire. The Library's pictures (media.wall) float on that lake: scroll rows you across it in 3D, every picture
// lies on the water far away and rises to face you as you reach it, then slips past. Tap one to open it.
// A pool of tiles is recycled row by row, so only ~25 pictures exist at any time. Motion Off keeps the old wall.
import {$,data,part,pinned,view,motion,follower,clamp,smooth,lite,TH,dims,coarse} from '../core.js';

export function initLake(){
 const sec=$('#lake'),cam=$('#lk-cam');if(!sec||!cam)return;
 const ids=data.media?.wall||[];if(!ids.length)return;
 const count=$('#lk-count'),caps=[...sec.querySelectorAll('.lk-cap')],embers=$('#lk-embers');
 const CAP=[[-0.02,0.2],[0.3,0.55],[0.78,1.02]];
 let cols,D,W,lanes,R,rows,tiles=[],lines=[],camH,total,FAR,NEAR=-520;
 const rnd=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};

 function build(){
  const phone=view.vw<=820;
  cols=phone?2:3;D=phone?470:660;W=phone?230:330;FAR=phone?2900:3800;
  lanes=phone?[[-170,150],[-130,190]]:[[-520,60,640],[-360,230,800]];
  rows=Math.ceil(ids.length/cols);total=rows*D;
  R=Math.ceil((FAR-NEAR)/D)+1;
  cam.innerHTML='';tiles=[];lines=[];
  for(let j=0;j<R;j++)for(let c=0;c<cols;c++){
   const b=document.createElement('button');b.className='lk-t';b.type='button';b.dataset.view='wall';b.setAttribute('aria-label','Open this picture');
   b.innerHTML=`<span class="lk-b" style="animation-delay:${(-rnd(j*7+c)*6).toFixed(2)}s"><img alt="" decoding="async" draggable="false"></span>`;
   cam.appendChild(b);tiles.push({el:b,img:b.querySelector('img'),j,c,row:null});
  }
  // ripples of light lying on the water: they pass under you too, which is what makes it feel like moving
  const L=lite?6:11;for(let k=0;k<L;k++){const i=document.createElement('i');i.className='lk-l';cam.appendChild(i);lines.push({el:i,k});}
  sec.dataset.cols=cols;
 }
 function measure(){
  if(String(view.vw<=820?2:3)!==sec.dataset.cols)build();
  camH=Math.round(view.vh*(view.vw<=820?0.56:0.58));
 }
 function assign(t,row){
  t.row=row;const i=row*cols+t.c;
  if(row<0||i>=ids.length){t.id=null;t.el.hidden=true;return;}
  const id=ids[i],[w,h]=dims(id),tw=w>h*1.15?W*1.3:W,th=tw*h/w;
  t.id=id;t.el.hidden=false;t.el.dataset.id=id;t.w=tw;t.h=th;
  t.el.style.width=tw+'px';t.el.style.height=th+'px';t.el.style.left=(-tw/2)+'px';t.el.style.top=(-th)+'px';
  t.img.src=TH(id);
  const lane=lanes[((row%2)+2)%2];
  t.x=lane[t.c]+(rnd(row*13+t.c*5)-.5)*120;t.dz=(t.c-(cols-1)/2)*D*.28*(row%2?1:-1)+(rnd(row*3+t.c*11)-.5)*D*.12;t.ry=(rnd(row*17+t.c)-.5)*14;
 }
 let lastN=-1;
 function render(u,mx){
  const o=-FAR*0.55+u*(total+FAR*0.55-D*1.2);
  const rmin=Math.ceil((o+NEAR)/D);
  for(const t of tiles){
   const row=rmin+((t.j-rmin)%R+R)%R;
   if(t.row!==row)assign(t,row);
   if(!t.id)continue;
   const z=row*D-o+t.dz;
   const op=smooth(clamp((FAR-z)/700))*smooth(clamp((z-NEAR)/260));
   if(op<0.01){if(t.v!==0){t.v=0;t.el.style.visibility='hidden';}continue;}
   if(t.v!==1){t.v=1;t.el.style.visibility='visible';}
   const rise=smooth(clamp((2300-z)/2300)),ang=74-52*rise;
   t.el.style.transform=`translate3d(${(t.x-mx).toFixed(1)}px,${camH}px,${(-z).toFixed(1)}px) rotateY(${(t.ry*(1-rise*.6)).toFixed(2)}deg) rotateX(${ang.toFixed(2)}deg)`;
   t.el.style.opacity=op.toFixed(3);
   t.el.style.pointerEvents=z<1500&&z>NEAR+200?'auto':'none';
  }
  const span=FAR-NEAR;
  for(const l of lines){
   const z=NEAR+(((l.k/lines.length)*span-o*1)%span+span)%span;
   const op=smooth(clamp((FAR-z)/900))*smooth(clamp((z-NEAR)/300))*.5;
   l.el.style.transform=`translate3d(${((rnd(l.k)-.5)*1400-mx).toFixed(1)}px,${camH}px,${(-z).toFixed(1)}px) rotateX(90deg)`;
   l.el.style.opacity=op.toFixed(3);
  }
  const n=clamp(Math.round((o+200)/D*cols),0,ids.length);
  if(n!==lastN){lastN=n;count.innerHTML=`<b>${String(n).padStart(2,'0')}</b> / ${ids.length} saved from the fire`;}
  caps.forEach((el,i)=>{const [a,b]=CAP[i],v=smooth(clamp((u-a)/0.05))*(1-smooth(clamp((u-b)/0.05)));if(v<0.01){if(el._v!==0){el._v=0;el.style.visibility='hidden';}return;}if(el._v!==1){el._v=1;el.style.visibility='visible';}el.style.opacity=v.toFixed(3);el.style.transform=`translate3d(0,${((1-v)*14).toFixed(1)}px,0)`;});
 }
 // embers from the fire on the horizon, drifting up (CSS only)
 if(embers)embers.innerHTML=Array.from({length:lite?8:16},(_,i)=>`<i style="left:${(22+rnd(i)*56).toFixed(1)}%;animation-duration:${(7+rnd(i+9)*8).toFixed(1)}s;animation-delay:${(-rnd(i+3)*12).toFixed(1)}s;--dx:${((rnd(i+5)-.5)*90).toFixed(0)}px"></i>`).join('');
 build();measure();
 const f=follower(130),mf=follower(260);let u=0,ptr=0;
 if(!coarse)sec.addEventListener('pointermove',e=>{ptr=(e.clientX/view.vw-.5)*2;},{passive:true});
 part({el:sec,measure,update(s){if(motion.reduced)return;f.target=pinned(this,s);if(f.v!==null&&Math.abs(f.target-f.v)>0.3)f.v=f.target;u=f.step(view.t);mf.target=ptr*70;render(u,mf.step(view.t)||0);}});
 // the camera keeps easing toward the mouse after the scroll stops
 let vis=false,raf=0;const tick=()=>{raf=0;if(!vis||motion.reduced||coarse)return;if(Math.abs(mf.target-(mf.v||0))>0.3)render(f.v??u,mf.step(performance.now())||0);raf=requestAnimationFrame(tick);};
 new IntersectionObserver(([e])=>{vis=e.isIntersecting;sec.classList.toggle('live',vis);if(vis&&!raf)raf=requestAnimationFrame(tick);}).observe(sec);
}

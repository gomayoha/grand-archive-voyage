// Look closer (Oct 30 2026). His Pinterest collages: one Straw Hat cut out in front of a wall of every cover
// and colour page Oda gave them. He loves them for the small things behind the character, so that is the idea:
// each one starts with the camera deep inside the wall, on one little cover, then pulls all the way back
// until the whole collage stands there with its character in front. A lens (hover, or press and hold on a
// phone) magnifies whatever you point at. Ends on all of them side by side. Each is a Mosaic card in the
// Treasure Room. One transform per frame on the current collage; the others are hidden.
import {$,esc,clamp,smooth,ease,lerp,view,part,pinned,FU,TH,dims,data,motion,coarse,loadNear,pad} from '../core.js';
import {registerCollection} from '../dialogs.js';

// where the camera starts: one little cover in the wall behind them (0..1 of the picture), and how deep
const FOCUS={'297876935b5a':[.31,.06],'9903097351d2':[.81,.062],'baf64606db04':[.58,.06],'0052f34dd9e9':[.92,.06],'6053e31a189f':[.81,.06],'146aefd0a28b':[.31,.062],'5236a4a36488':[.42,.06],'39cd880aa79e':[.56,.0625],'f844020d144b':[.083,.06],'29c5cb89c10c':[.07,.135]};
const ORDER=['Luffy','Zoro','Nami','Usopp','Sanji','Chopper','Robin','Franky','Brook'];
const Z=2.7;

export function initCloser(){
 const sec=$('#closer');if(!sec)return;
 const list=(data.media.collages||[]).slice(),crew=data.strawhats?.crew||[];
 if(!list.length){sec.hidden=true;return;}
 // in the order they joined the crew; the panorama of Robin's outfits closes it
 list.sort((a,b)=>{const r=x=>x.id==='29c5cb89c10c'?99:ORDER.indexOf(x.who);return r(a)-r(b);});
 const N=list.length,role=w=>crew.find(c=>c.short===w)?.role||'';
 registerCollection('closer',()=>({title:'Look closer',eyebrow:'Every collage',ids:list.map(x=>x.id)}));
 sec.style.setProperty('--n',N);
 const stage=$('#lc-stage'),caps=$('#lc-caps'),dots=$('#lc-dots');
 stage.innerHTML=list.map((x,i)=>{const [w,h]=dims(x.id);return `<figure class="lc-f" data-i="${i}" style="--ar:${w}/${h}"><div class="lc-art"><img alt="${esc(x.who)}, a collage of every cover" decoding="async" ${i<2?'':'loading="lazy" '}src="${FU(x.id)}" width="${w}" height="${h}"></div><i class="lc-ring" aria-hidden="true"></i></figure>`;}).join('');
 caps.innerHTML=list.map((x,i)=>{const pano=x.id==='29c5cb89c10c';return `<div class="lc-cap" data-i="${i}"><p class="lc-k">${pad(i+1)} / ${pad(N)}${role(x.who)&&!pano?` · ${esc(role(x.who))}`:''}</p><h3>${pano?'Seven <em>Robins.</em>':`${esc(x.who)}<em>.</em>`}</h3><p class="lc-l">${pano?'One woman, seven islands, seven outfits. Look at the details.':'Every little square behind them is another cover. Move the lens over it.'}</p><button class="lc-full" data-view="closer" data-id="${x.id}">Full size ↗</button></div>`;}).join('');
 dots.innerHTML=list.map((x,i)=>`<i data-i="${i}"></i>`).join('');
 const F=[...stage.children].map(el=>({el,art:el.querySelector('.lc-art'),img:el.querySelector('img'),vis:false,t:''})),C=[...caps.children],D=[...dots.children];
 loadNear(sec,'150% 0px');
 const intro=$('#lc-intro'),grid=$('#lc-grid'),endEl=sec.querySelector('.lc-end');
 grid.innerHTML=list.map((x,i)=>`<button class="lc-g" data-view="closer" data-id="${x.id}" style="--d:${i*50}ms" aria-label="${esc(x.who)}"><img src="${TH(x.id)}" alt="" loading="lazy" decoding="async"><span>${esc(x.who)}</span></button>`).join('');

 // the scroll: a short intro, then one beat per collage (dive out of the wall, hold), then all of them
 const A=0.06,B=0.9;// collages live between A and B of the pinned progress
 let cur=-1;
 // every collage is fitted inside the stage box at its own shape
 const fit=()=>{const r=stage.getBoundingClientRect(),bw=r.width||view.vw,bh=r.height||view.vh;F.forEach((x,k)=>{const [w,h]=dims(list[k].id),k2=Math.min(bw/w,bh/h);x.el.style.width=(w*k2).toFixed(1)+'px';x.el.style.height=(h*k2).toFixed(1)+'px';x.t='';});};
 part({el:sec,measure(){fit();},update(s){
  const p=motion.reduced?0.5:pinned(this,s),q=clamp((p-A)/(B-A))*N,i=Math.min(N-1,Math.floor(q)),f=q-i;
  const io=1-smooth(clamp((p-0.01)/0.04));intro.style.opacity=io.toFixed(3);intro.style.visibility=p>0.06?'hidden':'';caps.style.opacity=(1-io).toFixed(3);
  const end=smooth(clamp((p-B)/0.06));endEl.style.setProperty('--o',end.toFixed(3));grid.classList.toggle('on',end>0.5);sec.classList.toggle('lc-done',end>0.02);
  if(i!==cur){cur=i;C.forEach((c,k)=>c.classList.toggle('on',k===i));D.forEach((d,k)=>d.classList.toggle('on',k<=i));
   // warm the next two
   [i+1,i+2].forEach(k=>{if(F[k]&&F[k].img.loading==='lazy')F[k].img.loading='eager';});}
  F.forEach((x,k)=>{
   // the one before fades out as the next one dives in on top of it
   const show=k===i||(k===i-1&&f<0.18)||(k===i+1&&f>0.86);
   if(show!==x.vis){x.vis=show;x.el.style.visibility=show?'visible':'hidden';}
   if(!show)return;
   const ff=k===i?f:k<i?1+f:f-1;
   // 0..0.5: pull back out of the little cover; 0.5..0.86: hold the whole picture, drifting; then hand over
   const out=ease(clamp(ff/0.5)),z=motion.reduced?1:lerp(Z,1,out)*(1+0.03*clamp((ff-0.5)/0.4)),a=(z-1)/(Z-1||1);
   const [fx,fy]=FOCUS[list[k].id]||[.5,.1],W=x.el.offsetWidth,H=x.el.offsetHeight;
   // centred on the little cover, but never past the picture's own edges
   const tx=clamp(a*(W/2-fx*W*z),W-W*z,0),ty=clamp(a*(H/2-fy*H*z),H-H*z,0);
   const op=ff<0?smooth(clamp((ff+0.14)/0.14)):ff>1?1-smooth(clamp((ff-1)/0.16)):1;
   const t=`translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) scale(${z.toFixed(4)})`;
   if(t!==x.t){x.t=t;x.art.style.transform=t;}
   x.el.style.opacity=op.toFixed(3);x.el.style.zIndex=k===i+1?3:k===i?2:1;
   x.el.classList.toggle('deep',z>1.6);
  });
 }});

 /* ---------------- the lens: look closer at anything ---------------- */
 const lens=$('#lc-lens');let on=null,hold=0,start=null;
 const place=(x,y)=>{
  const fig=on;if(!fig)return;const r=fig.getBoundingClientRect(),img=fig.querySelector('img'),ir=img.getBoundingClientRect();
  if(x<r.left||x>r.right||y<r.top||y>r.bottom){lens.classList.remove('on');return;}
  const M=coarse?2.6:2.4,S=lens.offsetWidth,u=(x-ir.left)/ir.width,v=(y-ir.top)/ir.height;
  lens.style.backgroundImage=`url("${img.currentSrc||img.src}")`;
  lens.style.backgroundSize=`${(ir.width*M).toFixed(0)}px ${(ir.height*M).toFixed(0)}px`;
  lens.style.backgroundPosition=`${(-u*ir.width*M+S/2).toFixed(1)}px ${(-v*ir.height*M+S/2).toFixed(1)}px`;
  // on a phone the lens floats above the finger, so the finger doesn't cover what it shows
  lens.style.transform=`translate3d(${(x-S/2).toFixed(1)}px,${(y-S/2-(coarse?S*0.75:0)).toFixed(1)}px,0)`;
  lens.classList.add('on');
 };
 const figAt=t=>{const f=t.closest&&t.closest('.lc-f');return f&&f.style.visibility!=='hidden'&&!f.classList.contains('deep')?f:null;};
 if(!coarse){
  stage.addEventListener('pointermove',e=>{on=figAt(e.target);if(on)place(e.clientX,e.clientY);else lens.classList.remove('on');});
  stage.addEventListener('pointerleave',()=>{on=null;lens.classList.remove('on');});
  addEventListener('scroll',()=>{if(on)lens.classList.remove('on');},{passive:true});
 }else{
  // press and hold to pick up the lens; then the finger moves it instead of scrolling the page
  stage.addEventListener('touchstart',e=>{const t=e.touches[0];start=[t.clientX,t.clientY];const f=figAt(e.target);clearTimeout(hold);if(!f)return;hold=setTimeout(()=>{on=f;sec.classList.add('lensing');place(start[0],start[1]);},280);},{passive:true});
  stage.addEventListener('touchmove',e=>{const t=e.touches[0];if(on){e.preventDefault();place(t.clientX,t.clientY);}else if(start&&Math.hypot(t.clientX-start[0],t.clientY-start[1])>10)clearTimeout(hold);},{passive:false});
  const up=()=>{clearTimeout(hold);on=null;start=null;sec.classList.remove('lensing');lens.classList.remove('on');};
  stage.addEventListener('touchend',up);stage.addEventListener('touchcancel',up);
  stage.addEventListener('contextmenu',e=>e.preventDefault());
 }
}

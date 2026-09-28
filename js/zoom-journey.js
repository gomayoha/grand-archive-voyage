// Continuous nested-image zoom ("infinite zoom") driven by a scroll progress value.
//
// One camera, one coordinate space. Each layer's `match` says where the NEXT image already lives
// inside it: centred on (focalX, focalY) of the current image, shrunk `scale` times, nudged by
// (offsetX, offsetY) in the next image's own source pixels. The camera zooms toward that spot and
// draws the next image in the same space at 1/scale, so at zoom === scale the next image sits
// exactly on its own full-screen framing and becomes the base layer with no jump.
//
// Zoom is exponential: scroll is spent per doubling of magnification, so perceived speed is
// constant through every hand-off. Easing happens only at the very start and end of the journey.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);
const EASE=0.08;
const N_EASE=1-EASE;
function ease(g){if(g<EASE)return g*g/(2*EASE)/N_EASE;if(g>1-EASE)return 1-(1-g)*(1-g)/(2*EASE)/N_EASE;return(g-EASE/2)/N_EASE;}
function unease(e){const a=EASE/(2*N_EASE);if(e<a)return Math.sqrt(e*2*EASE*N_EASE);if(e>1-a)return 1-Math.sqrt((1-e)*2*EASE*N_EASE);return e*N_EASE+EASE/2;}

export function createJourney({section,layerHost,config,reverse=false,caption=null,onChange=null}){
 const stage=section.querySelector('.pin');
 let layers=config.layers,els=[],cum=[0],total=1,pinned=1,box={w:1,h:1},scrub=null,ghost=false,lastSeg=-1,lastCaption=-1;
 const state={seg:0,p:0,Z:1,c:1,W:1,H:1,g:0,nextOpacity:0};

 layerHost.innerHTML=layers.map((l,i)=>`<img class="jl" alt="${String(l.title||'').replace(/"/g,'&quot;')}" decoding="async" draggable="false"${i===0?' fetchpriority="high"':''}>`).join('');
 els=[...layerHost.querySelectorAll('.jl')];

 function rebuild(){
  const per=config.svhPerDoubling||46;
  cum=[0];
  layers.forEach((l,i)=>{const len=l.match&&i<layers.length-1?Math.log2(Math.max(1.01,l.match.scale)):(config.tailVh||90)/per;cum.push(cum[i]+len);});
  total=cum[cum.length-1];
  section.style.height=(100+per*total/N_EASE).toFixed(1)+'svh';
 }
 function measure(){box={w:layerHost.clientWidth||innerWidth,h:layerHost.clientHeight||innerHeight};pinned=Math.max(1,section.offsetHeight-stage.offsetHeight);}
 function progress(){return clamp(-section.getBoundingClientRect().top/pinned,0,1);}
 // Scroll position (document px) at which a given segment starts, for the chapter rail.
 function scrollYFor(seg,p=0.02){const J=cum[seg]+p*(cum[seg+1]-cum[seg]);let e=J/total;if(reverse)e=1-e;return section.offsetTop+pinned*unease(clamp(e,0,1));}
 function keepLoaded(seg){els.forEach((el,i)=>{const want=i>=seg-1&&i<=seg+2;if(want&&!el.getAttribute('src'))el.src=layers[i].image;else if(!want&&el.getAttribute('src')&&Math.abs(i-seg)>3)el.removeAttribute('src');});}
 function show(el,on){if(el._on===on)return;el._on=on;el.style.visibility=on?'visible':'hidden';el.style.willChange=on?'transform,opacity':'auto';}
 function setMask(el,f){const m=f>0.5?`linear-gradient(to right,transparent,#000 ${f.toFixed(1)}px,#000 calc(100% - ${f.toFixed(1)}px),transparent),linear-gradient(to bottom,transparent,#000 ${f.toFixed(1)}px,#000 calc(100% - ${f.toFixed(1)}px),transparent)`:'none';if(el._mask!==m){el._mask=m;el.style.webkitMaskImage=m;el.style.maskImage=m;}}

 function render(gIn){
  const g=gIn??progress();state.g=g;
  let e=ease(g);if(reverse)e=1-e;
  const J=scrub?cum[scrub.seg]+scrub.p*(cum[scrub.seg+1]-cum[scrub.seg]):total*e;
  let i=0;while(i<layers.length-1&&J>=cum[i+1])i++;
  const segLen=cum[i+1]-cum[i],local=clamp(J-cum[i],0,segLen),p=segLen?local/segLen:1;
  const L=layers[i],m=i<layers.length-1?L.match:null,W=L.width,H=L.height;
  const Z=Math.pow(2,local),c=Math.max(box.w/W,box.h/H);
  const S=m?m.scale:Math.pow(2,segLen);
  const Ax=m?m.focalX*W+m.offsetX*(W/layers[i+1].width)/m.scale:(L.focalX??.5)*W;
  const Ay=m?m.focalY*H+m.offsetY*(H/layers[i+1].height)/m.scale:(L.focalY??.5)*H;
  const w=S>1.0001?(1-1/Z)/(1-1/S):0;
  const Lx=W/2+(Ax-W/2)*w,Ly=H/2+(Ay-H/2)*w;
  Object.assign(state,{seg:i,p,Z,c,W,H,nextOpacity:0});
  if(i!==lastSeg){keepLoaded(i);lastSeg=i;onChange?.(i);}
  els.forEach((el,k)=>{if(k!==i&&k!==i+1)show(el,false);});
  const base=els[i];show(base,true);setMask(base,0);
  base.style.opacity=m?'1':String(1-smooth(clamp((p-0.55)/0.4,0,1)));
  base.style.transform=`translate3d(${(Z*c*(W/2-Lx)).toFixed(2)}px,${(Z*c*(H/2-Ly)).toFixed(2)}px,0) scale(${Z.toFixed(5)})`;
  if(m&&els[i+1]){
   const N=layers[i+1],next=els[i+1],cn=Math.max(box.w/N.width,box.h/N.height);
   const k=(Z/m.scale)*(c*W)/(cn*N.width);
   const op=ghost?0.5:smooth(clamp((p-m.blendStart)/Math.max(0.001,m.blendEnd-m.blendStart),0,1));
   state.nextOpacity=op;show(next,op>0);next.style.opacity=op.toFixed(3);
   next.style.transform=`translate3d(${(Z*c*(Ax-Lx)).toFixed(2)}px,${(Z*c*(Ay-Ly)).toFixed(2)}px,0) scale(${k.toFixed(5)})`;
   setMask(next,(ghost?0:m.feather*Math.min(box.w,box.h)*clamp((1-p)/Math.max(0.001,1-m.blendEnd),0,1))/k);
  }
  if(caption){
   const inAt=i===0?0.1:0.03,outAt=m?0.42:0.5;
   const o=smooth(clamp((p-inAt)/0.12,0,1))*(1-smooth(clamp((p-outAt)/0.1,0,1)));
   if(i!==lastCaption&&o<0.02){caption.set(L,i,layers.length);lastCaption=i;}
   caption.el.style.opacity=(i===lastCaption?o:0).toFixed(3);
   caption.el.style.transform=`translate3d(0,${((1-o)*24).toFixed(1)}px,0)`;
  }
 }
 function renderStatic(){keepLoaded(0);lastSeg=0;els.forEach((el,i)=>{show(el,i===0);el.style.opacity='1';el.style.transform='';setMask(el,0);});if(caption){caption.set(layers[0],0,layers.length);caption.el.style.opacity='1';caption.el.style.transform='';}}

 rebuild();
 return{render,renderStatic,measure,rebuild,progress,scrollYFor,state,config,
  get cum(){return cum;},
  setScrub(v){scrub=v;render();},setGhost(v){ghost=v;render();}};
}

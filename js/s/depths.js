// Between the sky and the sea: Skypiea is ten thousand metres above the sea, Fish-Man Island ten thousand
// below. This section falls the whole way in one scroll. His four background pictures are the plates (the
// Merry in the open sky, the White-White Sea, the octopus balloon they rode down on, Fish-Man Island),
// laid one under the next and melted into each other. In front of them the world has real depth: clouds at
// many distances rush past the camera (the near ones fast and huge), then the camera breaks the sea surface
// and bubbles rise past it while light falls in from above. An altimeter counts the fall.
// It's parallax by depth: everything moves by (its height − the camera's) × (its nearness), transform only,
// and only while the section is on screen.
import {$,esc,clamp,smooth,lerp,view,part,pinned,follower,motion,data,FU} from '../core.js';
import {G5} from '../gear5.js';

// plates, top to bottom (gallery ids from the "Backgrounds Op" folder), and where the fall stops for each
const PLATES=[
 {id:'6ec6b336fb55',focus:'12% 62%',u:0.12,alt:10000,k:'Skypiea',t:'10,000 m above the sea',line:'The Knock Up Stream threw the Merry into the sky.'},
 {id:'5b4d8ea99809',focus:'54% 62%',u:0.34,alt:7000,k:'The White-White Sea',t:'A sea made of clouds',line:'Fish swim through the sky up here.'},
 {id:'a352eedbb5a9',focus:'58% 42%',u:0.56,alt:3000,k:'The way down',t:'Hanging from an octopus',line:'They left the sky on a giant octopus balloon.'},
 {id:'4a1ac1bb9ec8',focus:'62% 50%',u:0.92,alt:-10000,k:'Fish-Man Island',t:'10,000 m below the sea',line:'All the way down, a whole island lives in a bubble.'}
];
const SURFACE=0.745;
// altitude along the fall (piecewise between these points)
const ALT=[[0,11200],[0.12,10000],[0.34,7000],[0.56,3000],[SURFACE,0],[0.92,-10000],[1,-10400]];
const rng=seed=>()=>((seed=(seed*16807)%2147483647)/2147483647);
const fmt=n=>(n>0?'+':n<0?'−':'')+Math.abs(Math.round(n/10)*10).toLocaleString('en-US');

export function initDepths(){
 const sec=$('#depths');if(!sec)return;
 const have=new Set(data.media?.backgrounds?.all||[]);
 if(!PLATES.every(p=>have.has(p.id))){sec.hidden=true;return;}
 const world=$('#dp-world'),r=rng(2024);
 // pieces of the world: plates (far), the sea surface, clouds, light rays and bubbles (many distances)
 const bits=[];
 const mk=(cls,html='')=>{const el=document.createElement('div');el.className=cls;el.innerHTML=html;world.append(el);return el;};
 PLATES.forEach((p,i)=>bits.push({el:mk('dp-plate'+(i===PLATES.length-1?' deep':''),`<img alt="" decoding="async" src="${FU(p.id)}" style="object-position:${p.focus}">`),kind:'plate',u:p.u,k:0.35}));
 bits.push({el:mk('dp-surface','<i></i>'),kind:'surface',u:SURFACE,k:0.35});
 bits.push({el:mk('dp-flash'),kind:'flash',u:SURFACE,k:1.35});
 for(let i=0;i<26;i++){const k=0.45+r()*1.6;bits.push({el:mk('dp-cloud'),kind:'cloud',u:r()*0.66,x:(r()-0.5)*1.5,k,s:(0.6+r()*0.8),drift:(r()-0.5)*14,o:0.5+r()*0.5});}
 for(let i=0;i<7;i++)bits.push({el:mk('dp-ray'),kind:'ray',u:SURFACE+0.03+r()*0.08,x:(r()-0.5)*1.1,k:0.55+r()*0.25,s:0.6+r()*0.7,ph:r()*6.28});
 for(let i=0;i<52;i++){const k=0.45+r()*1.3;bits.push({el:mk('dp-bubble'),kind:'bubble',u:SURFACE+0.02+r()*0.3,x:(r()-0.5)*1.3,k,s:4+r()*14,rise:20+r()*70,wob:r()*6.28});}
 const alt=u=>{for(let i=1;i<ALT.length;i++)if(u<=ALT[i][0]){const [u0,a0]=ALT[i-1],[u1,a1]=ALT[i];return lerp(a0,a1,smooth((u-u0)/(u1-u0)));}return ALT[ALT.length-1][1];};

 const caps=$('#dp-caps'),altNum=$('#dp-alt-num'),altBar=$('#dp-alt-fill'),grade=$('#dp-grade'),intro=$('#dp-intro'),caust=$('#dp-caustics');
 caps.innerHTML=PLATES.map(p=>`<div class="dp-cap"><p class="eyebrow">${esc(p.k)}</p><h3>${esc(p.t)}</h3><p>${esc(p.line)}</p></div>`).join('')+`<div class="dp-cap sea"><p class="eyebrow">Sea level</p><h3>0 m</h3><p>Hold your breath.</p></div>`;
 const capEls=[...caps.children],capU=[...PLATES.map(p=>p.u),SURFACE];

 let T=1,vw=1,vh=1,t0=performance.now();
 const measure=()=>{vw=view.vw;vh=view.vh;T=vh*13;sec.style.height=motion.reduced?'auto':(view.vw<=820?'640svh':'720svh');};
 function render(u){
  const cam=u*T,t=(performance.now()-t0)/1000,beat=G5.on?G5.beat:0;
  for(const b of bits){
   const wy=b.u*T,y=(wy-cam)*b.k;
   let sx=0,sy=y,sc=1,o=1;
   if(b.kind==='plate'||b.kind==='surface'){if(Math.abs(y)>vh*1.6){if(b.vis!==0){b.vis=0;b.el.style.visibility='hidden';}continue;}}
   else if(b.kind==='flash'){o=1-smooth(clamp(Math.abs(y)/(vh*0.5)));}
   else{
    if(b.kind==='bubble')sy=y-((t*b.rise*b.k)%(vh*2.4))+vh*1.2;
    sx=b.x*vw+(b.kind==='cloud'?Math.sin(t*0.05+b.u*40)*b.drift*b.k*10:b.kind==='bubble'?Math.sin(t*1.4+b.wob)*6*b.k:0);
    sc=b.k*(b.kind==='bubble'?b.s/10*(1+beat*0.4):(b.s||1));
    if(Math.abs(sy)>vh*0.9+300*sc){if(b.vis!==0){b.vis=0;b.el.style.visibility='hidden';}continue;}
    if(b.kind==='cloud')o=b.o*(b.k>1.4?0.55:1);
    if(b.kind==='ray')o=(0.35+0.25*Math.sin(t*0.7+b.ph))*smooth(clamp((u-SURFACE+0.01)/0.06));
   }
   if(b.vis!==1){b.vis=1;b.el.style.visibility='visible';}
   b.el.style.transform=`translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0) scale(${sc.toFixed(3)})`;
   if(o!==b.o2){b.o2=o;b.el.style.opacity=o.toFixed(3);}
  }
  // under the surface the world turns blue and the light starts to ripple
  const sea=smooth(clamp((u-SURFACE+0.012)/0.05));grade.style.opacity=(sea*0.55).toFixed(3);caust.style.opacity=(sea*smooth(clamp((0.97-u)/0.1))*0.5).toFixed(3);
  const a=alt(u);altNum.textContent=`${fmt(a)} m`;altBar.style.transform=`scaleY(${(1-(a+10400)/21600).toFixed(4)})`;
  sec.classList.toggle('under',sea>0.5);
  capEls.forEach((el,i)=>{const d=Math.abs(u-capU[i]),o=1-smooth(clamp((d-0.025)/0.05));if(o<0.01){if(el._v){el._v=0;el.style.visibility='hidden';}return;}if(!el._v){el._v=1;el.style.visibility='visible';}el.style.opacity=o.toFixed(3);el.style.transform=`translate3d(0,${((u-capU[i])*-600).toFixed(1)}px,0)`;});
  const io=1-smooth(clamp(u/0.06));intro.style.opacity=io.toFixed(3);intro.style.visibility=io<0.01?'hidden':'visible';
 }
 const f=follower(120);let u=0;
 measure();
 part({el:sec,measure,update(s){if(motion.reduced)return;f.target=pinned(this,s);if(f.v!==null&&Math.abs(f.target-f.v)>0.3)f.v=f.target;u=f.step(view.t);render(u);}});
 // the clouds drift and the bubbles rise even when you stop scrolling
 let visible=false,raf=0;
 const tick=()=>{raf=0;if(!visible||motion.reduced)return;render(f.v??u);raf=requestAnimationFrame(tick);};
 new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible&&!raf)raf=requestAnimationFrame(tick);}).observe(sec);
 const pinEl=sec.querySelector('.pin');
 const applyMotion=red=>{pinEl.classList.toggle('still',red);measure();if(red)render(0.92);};
 motion.listeners.push(applyMotion);applyMotion(motion.reduced);
}

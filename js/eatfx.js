// Eating a Devil Fruit (Oct 22 2026): he asked that eating feel like eating, in the fruit's own colours.
// The fruit drops in front of you, swirls and all, glowing. Tap it to take a bite (it bites by itself if you
// wait): crumbs fly, the fruit squashes, and the captions are what everyone says about the taste. After the
// third bite the power hits: a wave of the fruit's colour floods the screen, its swirl turns, its name stamps
// in, and the archive takes on its colours (js/themes.js). The fruit is drawn in SVG; the bites are holes in
// its mask. It plays in a <dialog> of its own, so it sits above the Treasure Room.
import {motion,coarse} from './core.js';

const NS='http://www.w3.org/2000/svg';
const rnd=(a,b)=>a+Math.random()*(b-a);
const spiral=(cx,cy,r,turns=2.2)=>{let d='';for(let t=0;t<=turns*Math.PI*2;t+=0.25){const k=t/(turns*Math.PI*2),x=cx+Math.cos(t)*r*k,y=cy+Math.sin(t)*r*k;d+=(d?'L':'M')+x.toFixed(1)+' '+y.toFixed(1);}return d;};
// a devil fruit: a lumpy round body covered in swirls, a curled stem and a leaf
function fruitSVG(h1,h2,uid){
 let body='';for(let i=0;i<=72;i++){const a=i/72*Math.PI*2,r=78+5*Math.sin(a*7)+3*Math.sin(a*3+1);body+=(i?'L':'M')+(100+Math.cos(a)*r).toFixed(1)+' '+(128+Math.sin(a)*r*0.94).toFixed(1);}
 const sw=[[100,128,22],[64,104,17],[136,102,17],[58,152,17],[142,154,17],[100,172,15],[100,82,14],[78,128,10],[122,128,10],[38,124,11],[162,126,11],[80,190,10],[120,190,10]];
 return `<svg viewBox="0 0 200 230" class="ef-svg" aria-hidden="true"><defs>
  <radialGradient id="g${uid}" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".12" stop-color="${h2}"/><stop offset=".55" stop-color="${h1}"/><stop offset="1" stop-color="color-mix(in srgb, ${h1} 40%, #000)"/></radialGradient>
  <clipPath id="c${uid}"><path d="${body}"/></clipPath>
  <mask id="m${uid}" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="230"><rect width="200" height="230" fill="#fff"/><g class="ef-bites"></g></mask></defs>
  <g mask="url(#m${uid})"><g class="ef-fruit">
   <path d="${body}" fill="url(#g${uid})"/>
   <g clip-path="url(#c${uid})" fill="none" stroke-linecap="round">${sw.map(([x,y,r],i)=>`<path d="${spiral(x,y,r,i%2?2:2.4)}" stroke="rgba(0,0,0,.28)" stroke-width="4.2"/><path d="${spiral(x-1,y-1,r,i%2?2:2.4)}" stroke="rgba(255,255,255,.35)" stroke-width="1.6"/>`).join('')}</g>
   <ellipse cx="74" cy="86" rx="22" ry="12" fill="rgba(255,255,255,.35)" transform="rotate(-30 74 86)"/>
   <path d="M100 56 C 98 40, 108 30, 118 34 C 128 38, 122 50, 114 46" fill="none" stroke="#5a3b1c" stroke-width="6" stroke-linecap="round"/>
   <path d="M104 44 C 84 22, 58 26, 52 38 C 72 48, 92 48, 104 44 Z" fill="#3f8a33"/><path d="M104 44 C 84 36, 68 36, 56 37" fill="none" stroke="#2a5e22" stroke-width="2"/>
  </g></g></svg>`;
}
let uid=0;
export function ceremony(f,info={}){
 return new Promise(done=>{
  const id=++uid,d=document.createElement('dialog');d.className='ef';d.setAttribute('aria-label',`Eating the ${f.name}`);
  d.style.setProperty('--h1',f.h1);d.style.setProperty('--h2',f.h2);
  d.innerHTML=`<div class="ef-kana" aria-hidden="true">${f.kana}</div>
   <div class="ef-stage"><i class="ef-aura"></i><i class="ef-aura b"></i><button class="ef-btn" aria-label="Take a bite">${fruitSVG(f.h1,f.h2,id)}</button></div>
   <p class="ef-cap" aria-live="polite">${coarse?'Tap':'Click'} the fruit to take a bite.</p>
   <div class="ef-wave" aria-hidden="true"><i></i></div>
   <div class="ef-end"><p class="eyebrow">${info.user?`The power of ${info.user}`:'A Devil Fruit'}</p><p class="ef-kana2">${f.kana}</p><h2>${f.name}</h2><p class="ef-pow">${info.power||''}</p><p class="ef-sea">From now on the sea will never let you swim again.</p><div class="ef-acts"><button class="pill" data-ef-go>Feel the power →</button></div></div>
   <div class="ef-crumbs" aria-hidden="true"></div>`;
  document.body.appendChild(d);d.showModal();
  const btn=d.querySelector('.ef-btn'),fruit=d.querySelector('.ef-fruit'),bites=d.querySelector('.ef-bites'),cap=d.querySelector('.ef-cap'),crumbs=d.querySelector('.ef-crumbs');
  let n=0,busy=false,timer=0,finished=false;
  const finish=()=>{if(finished)return;finished=true;clearTimeout(timer);d.close();d.remove();done();};
  d.addEventListener('cancel',e=>{e.preventDefault();finish();});
  d.querySelector('[data-ef-go]').addEventListener('click',finish);
  if(motion.reduced){d.classList.add('ended','still');return;}
  // where the bites land: the upper right first, then round the side
  const SPOTS=[[150,70],[168,140],[132,200]];
  const CAPS=['It tastes awful.','Really, truly awful.',''];
  const bite=()=>{
   if(busy||n>=3)return;busy=true;clearTimeout(timer);
   const [bx,by]=SPOTS[n];
   // a bite is a row of teeth marks: overlapping circles along the edge
   const ang=Math.atan2(by-128,bx-100)+Math.PI/2;
   for(let k=-2;k<=2;k++){const c=document.createElementNS(NS,'circle');c.setAttribute('cx',(bx+Math.cos(ang)*k*13).toFixed(1));c.setAttribute('cy',(by+Math.sin(ang)*k*13).toFixed(1));c.setAttribute('r',(19-Math.abs(k)*2.5).toFixed(1));c.setAttribute('fill','#000');bites.appendChild(c);}
   btn.animate([{transform:'scale(1)'},{transform:'scale(1.08,.9)',offset:.25},{transform:'scale(.95,1.05)',offset:.55},{transform:'scale(1)'}],{duration:420,easing:'ease-out'});
   const r=btn.getBoundingClientRect(),sx=r.left+r.width*bx/200,sy=r.top+r.height*by/230;
   for(let i=0;i<14;i++){const c=document.createElement('i');c.style.background=i%3?f.h1:f.h2;c.style.left=sx+'px';c.style.top=sy+'px';crumbs.appendChild(c);
    const a=rnd(-Math.PI,Math.PI),v=rnd(60,180);c.animate([{transform:'translate(-50%,-50%) scale(1)',opacity:1},{transform:`translate(calc(-50% + ${(Math.cos(a)*v).toFixed(0)}px),calc(-50% + ${(Math.sin(a)*v+120).toFixed(0)}px)) scale(.4) rotate(${rnd(-200,200).toFixed(0)}deg)`,opacity:0}],{duration:rnd(700,1100),easing:'cubic-bezier(.2,.7,.4,1)'}).finished.then(()=>c.remove());}
   n++;cap.textContent=CAPS[n-1];
   setTimeout(()=>{busy=false;if(n>=3)power();else timer=setTimeout(bite,2600);},440);
  };
  const power=()=>{
   d.classList.add('gulp');
   fruit.parentNode.parentNode.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.2)'}],{duration:380,fill:'forwards',easing:'ease-in'});
   setTimeout(()=>{d.classList.add('wave');setTimeout(()=>{d.classList.add('ended');d.dispatchEvent(new Event('ate'));},900);},360);
  };
  btn.addEventListener('click',bite);
  // it drops in, then waits for you; after a moment it takes the bites for you
  btn.animate([{transform:'translate3d(0,-60vh,0) rotate(-20deg)'},{transform:'translate3d(0,0,0) rotate(4deg)',offset:.7},{transform:'translate3d(0,-14px,0) rotate(-2deg)',offset:.85},{transform:'none'}],{duration:900,easing:'cubic-bezier(.3,.7,.4,1)'});
  timer=setTimeout(bite,3800);
 });
}

// Cover stories (Nov 2026). The serials Oda draws on the chapter title pages are little side adventures of the same
// manga, so each one plays as its own cheerful picture film: a bright stage in the serial's colour, a title card,
// then every episode's drawing tossed onto the stage one after another while its caption pops in, word by word.
// It runs by itself; tap the right side to go on, the left to go back, the button to pause. The pictures and the
// words (chapter, chapter title, caption) come from his Cover Pages folder via tools/covers/build.py.
import {$,esc,data,S,ROOT,reduced,see,earn} from './store.js';
import {pushLayer,popLayer,toast} from './ui.js';

const src=(s,p)=>`${ROOT}assets/covers/${s.id}/${p.f}.webp`;
export const serials=()=>data.covers?.serials||[];
export const serialCover=s=>`${ROOT}assets/covers/${s.id}/cover.webp`;
// dark ink on a bright colour, white on a deep one
const ink=hex=>{const n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;return (r*299+g*587+b*114)/1000>165?'#14110f':'#ffffff';};
const words=t=>esc(t).split(/\s+/).map((w,i)=>`<span class="w" style="--i:${i}">${w}</span>`).join(' ');
// the drawing inside the page: the picture is shown through a window the size of its box
const pic=(s,p)=>{const [x,y,w,h]=p.box;return `<span class="sf-win" style="aspect-ratio:${(w*p.w).toFixed(1)}/${(h*p.h).toFixed(1)}"><img src="${src(s,p)}" alt="" decoding="async" style="width:${(100/w).toFixed(3)}%;left:${(-x/w*100).toFixed(3)}%;top:${(-y/h*100).toFixed(3)}%"></span>`;};
const IN=[
 [{transform:'translate3d(70vw,18vh,0) rotate(18deg) scale(.86)',opacity:0},{transform:'translate3d(0,0,0) rotate(var(--r)) scale(1)',opacity:1}],
 [{transform:'translate3d(0,40vh,0) rotate(-10deg) scale(.6)',opacity:0},{transform:'translate3d(0,0,0) rotate(var(--r)) scale(1)',opacity:1}],
 [{transform:'translate3d(-70vw,-10vh,0) rotate(-16deg) scale(.86)',opacity:0},{transform:'translate3d(0,0,0) rotate(var(--r)) scale(1)',opacity:1}],
 [{transform:'translate3d(0,-50vh,0) rotate(8deg) scale(1.15)',opacity:0},{transform:'translate3d(0,0,0) rotate(var(--r)) scale(1)',opacity:1}]
];
const OUT=[{transform:'translate3d(-80vw,8vh,0) rotate(-20deg) scale(.8)',opacity:0},{transform:'translate3d(0,46vh,0) rotate(12deg) scale(.7)',opacity:0},{transform:'translate3d(80vw,-6vh,0) rotate(20deg) scale(.8)',opacity:0},{transform:'translate3d(0,-46vh,0) rotate(-8deg) scale(.8)',opacity:0}];

export function openSerial(id,{start=-1}={}){
 const list=serials(),s=list.find(x=>x.id===id);if(!s)return;
 const N=s.pages.length,next=list[(list.indexOf(s)+1)%list.length];
 const el=document.createElement('div');el.className='sf';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label',s.title);
 el.style.setProperty('--c',s.color);el.style.setProperty('--ink',ink(s.color));
 el.innerHTML=`<div class="sf-bg" aria-hidden="true"><i></i><i></i><i></i></div>
  <header class="sf-top"><p class="sf-name">${esc(s.title)}</p><p class="sf-count" id="sf-count"></p><button class="sf-x" data-sf="close" aria-label="Close"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2.800" stroke-linecap="round"/></svg></button></header>
  <div class="sf-line" aria-hidden="true"><i id="sf-prog"></i></div>
  <div class="sf-stage" id="sf-stage"></div>
  <div class="sf-copy" id="sf-copy"></div>
  <footer class="sf-ctrl"><button data-sf="prev" aria-label="Back"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="sf-play" data-sf="play" aria-label="Pause"></button><button data-sf="next" aria-label="Next"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="sf-all" data-sf="all">All parts</button><button class="sf-page" data-sf="page">The page</button></footer>`;
 const stage=$('#sf-stage',el),copy=$('#sf-copy',el),count=$('#sf-count',el),prog=$('#sf-prog',el);
 let i=-2,timer=0,paused=false,closed=false,card=null;
 const PLAY='<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5.500v13l11-6.500z" fill="currentColor"/></svg>',PAUSE='<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5.500v13M16 5.500v13" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
 const setPlay=()=>{const b=$('.sf-play',el);b.innerHTML=paused?PLAY:PAUSE;b.setAttribute('aria-label',paused?'Play':'Pause');el.classList.toggle('paused',paused);};
 const after=ms=>{clearTimeout(timer);if(!paused&&!reduced())timer=setTimeout(()=>go(i+1),ms);};
 function swap(html,k,cls='',a=1.25){
  const old=card;card=document.createElement('div');card.className='sf-card '+cls;card.style.setProperty('--a',a);card.style.setProperty('--r',`${((k*37)%7-3)*0.6}deg`);card.innerHTML=html;stage.appendChild(card);
  if(reduced()){old?.remove();return;}
  card.animate(IN[((k%4)+4)%4],{duration:760,easing:'cubic-bezier(.34,1.4,.5,1)',fill:'backwards'});
  if(old){const a=old.animate([{opacity:1},OUT[((k%4)+4)%4]],{duration:420,easing:'cubic-bezier(.5,0,.9,.4)',fill:'forwards'});a.onfinish=()=>old.remove();}
 }
 function go(n){
  if(closed)return;clearTimeout(timer);
  n=Math.max(-1,Math.min(N,n));i=n;el.dataset.at=n<0?'title':n>=N?'end':'part';
  prog.style.transform=`scaleX(${n<0?0:Math.min(1,(n+1)/N)})`;
  count.textContent=n<0||n>=N?'':`${String(n+1).padStart(2,'0')} / ${N}`;
  if(n<0){
   swap(`<div class="sf-fan">${[s.pages[0],s.pages[Math.min(1,N-1)],s.pages[Math.min(2,N-1)]].map((p,k)=>`<span style="--k:${k}">${pic(s,p)}</span>`).join('')}</div>`,0,'fan',0.9);
   copy.innerHTML=`<p class="sf-k">A cover story in ${N} parts${s.from?` · Chapters ${s.from} to ${s.to}`:''}</p><h2 class="sf-h">${words(s.title)}</h2><p class="sf-about">${esc(s.about)}</p>`;
   after(4200);
  }else if(n>=N){
   see('serial:'+s.id);if(!S.seen['paid:serial:'+s.id]){S.seen['paid:serial:'+s.id]=Date.now();earn(3e6,'A cover story, start to finish');}
   swap(`<div class="sf-grid">${s.pages.map((p,k)=>`<button data-sf-part="${k}" style="--k:${k}" aria-label="Part ${k+1}">${pic(s,p)}</button>`).join('')}</div>`,1,'wall');
   copy.innerHTML=`<p class="sf-k">${esc(s.title)}</p><h2 class="sf-h">${words('The end.')}</h2><div class="sf-btns"><button class="sf-b" data-sf="again">Play it again</button>${next&&next!==s?`<button class="sf-b ghost" data-sf="nextserial">Next: ${esc(next.title)}</button>`:''}</div>`;
  }else{
   const p=s.pages[n],line=p.line||'';
   swap(pic(s,p),n,'',((p.box[2]*p.w)/(p.box[3]*p.h)).toFixed(3));
   copy.innerHTML=`<p class="sf-k"><b>Part ${n+1}</b>${p.ch?` · Chapter ${p.ch}`:''}${p.ct?` · ${esc(p.ct)}`:''}</p>${line?`<h2 class="sf-h ${line.length<26?'xl':line.length<56?'l':line.length<100?'m':'s'}">${words(line)}</h2>`:''}`;
   const nx=s.pages[n+1];if(nx){const im=new Image();im.src=src(s,nx);}
   after(3000+Math.min(3600,line.split(/\s+/).length*260));
  }
 }
 const layer={close(){if(closed)return;closed=true;clearTimeout(timer);popLayer(layer);el.classList.add('out');setTimeout(()=>el.remove(),reduced()?0:320);},
  key(e){if(e.key==='ArrowRight'){go(i+1);}if(e.key==='ArrowLeft')go(i-1);if(e.key===' '){e.preventDefault();paused=!paused;setPlay();if(!paused)after(900);else clearTimeout(timer);}}};
 el.addEventListener('click',e=>{
  const part=e.target.closest('[data-sf-part]');if(part){paused=false;setPlay();go(+part.dataset.sfPart);return;}
  const b=e.target.closest('[data-sf]');
  if(b){const a=b.dataset.sf;
   if(a==='close')layer.close();else if(a==='prev')go(i-1);else if(a==='next')go(i+1);else if(a==='again'){paused=false;setPlay();go(-1);}
   else if(a==='all'){paused=true;setPlay();go(N);}
   else if(a==='nextserial'){layer.close();setTimeout(()=>openSerial(next.id),reduced()?0:240);}
   else if(a==='play'){paused=!paused;setPlay();if(!paused)after(700);else clearTimeout(timer);}
   else if(a==='page'&&i>=0&&i<N){paused=true;setPlay();clearTimeout(timer);const v=document.createElement('button');v.className='sf-whole';v.setAttribute('aria-label','Close the page');v.innerHTML=`<img src="${src(s,s.pages[i])}" alt="">`;v.addEventListener('click',ev=>{ev.stopPropagation();v.remove();});el.appendChild(v);}
   return;}
  if(e.target.closest('.sf-whole'))return;
  const x=e.clientX/innerWidth;go(x<.28?i-1:i+1);
 });
 let x0=null,sw=false;el.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;sw=false;},{passive:true});
 el.addEventListener('touchend',e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>60){sw=true;go(i+(dx<0?1:-1));}},{passive:true});
 el.addEventListener('click',e=>{if(sw){sw=false;e.stopPropagation();}},true);
 document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('in'));pushLayer(layer);setPlay();go(start);
 return layer;
}

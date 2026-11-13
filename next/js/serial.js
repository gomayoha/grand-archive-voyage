// Cover stories (Nov 2026). The serials Oda draws on the chapter title pages are little side adventures of the same
// manga, so each one plays as its own cheerful picture film.
// Second cut (he asked: "don't crop the photo, put the whole cover story", and a background that belongs to the story
// and is alive, "pictures in the back"): every episode is shown as the WHOLE page, the way it was printed, tossed
// onto the stage with a bounce while its caption pops in word by word. Behind it the story's own scenes drift past
// as a tilted wall in the serial's colour, and the scene you are on lights up there as it goes by.
// It runs by itself; tap the right side to go on, the left to go back. Pictures and words come from his Cover Pages
// folder via tools/covers/build.py. (Class prefix: cvf. The shelf already owns "sf".)
import {$,esc,data,S,ROOT,reduced,see,earn} from './store.js';
import {pushLayer,popLayer} from './ui.js';

const src=(s,p)=>`${ROOT}assets/covers/${s.id}/${p.f}.webp`,thumb=(s,p)=>`${ROOT}assets/covers/${s.id}/t/${p.f}.webp`;
export const serials=()=>data.covers?.serials||[];
export const serialCover=s=>`${ROOT}assets/covers/${s.id}/cover.webp`;
// dark ink on a bright colour, white on a deep one
const ink=hex=>{const n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;return (r*299+g*587+b*114)/1000>165?'#14110f':'#ffffff';};
const words=t=>esc(t).split(/\s+/).map((w,i)=>`<span class="w" style="--i:${i}">${w}</span>`).join(' ');
const page=(s,p)=>`<img class="cvf-pg" src="${src(s,p)}" alt="" decoding="async" width="${p.w}" height="${p.h}">`;
const IN=r=>[
 [{transform:'translate3d(70vw,18vh,0) rotate(18deg) scale(.86)',opacity:0},{transform:`rotate(${r}deg)`,opacity:1}],
 [{transform:'translate3d(0,44vh,0) rotate(-10deg) scale(.6)',opacity:0},{transform:`rotate(${r}deg)`,opacity:1}],
 [{transform:'translate3d(-70vw,-10vh,0) rotate(-16deg) scale(.86)',opacity:0},{transform:`rotate(${r}deg)`,opacity:1}],
 [{transform:'translate3d(0,-54vh,0) rotate(8deg) scale(1.12)',opacity:0},{transform:`rotate(${r}deg)`,opacity:1}]
];
const OUT=['translate3d(-80vw,8vh,0) rotate(-20deg) scale(.8)','translate3d(0,48vh,0) rotate(12deg) scale(.7)','translate3d(80vw,-6vh,0) rotate(20deg) scale(.8)','translate3d(0,-48vh,0) rotate(-8deg) scale(.8)'];

export function openSerial(id,{start=-1}={}){
 const list=serials(),s=list.find(x=>x.id===id);if(!s)return;
 const N=s.pages.length,next=list[(list.indexOf(s)+1)%list.length];
 const el=document.createElement('div');el.className='cvf';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label',s.title);
 el.style.setProperty('--c',s.color);el.style.setProperty('--ink',ink(s.color));
 // the wall behind: three columns of the story's own scenes, each drifting at its own pace (two copies, so it never ends)
 const cols=[0,1,2].map(c=>s.pages.map((p,k)=>({p,k})).filter(x=>x.k%3===c));
 const wall=cols.map((col,c)=>`<div class="cvf-col" style="--d:${46+c*13}s;--dir:${c%2?'reverse':'normal'}">${[0,1].map(()=>col.map(x=>`<i data-k="${x.k}"><img src="${thumb(s,x.p)}" alt="" loading="lazy" decoding="async"></i>`).join('')).join('')}</div>`).join('');
 el.innerHTML=`<div class="cvf-wall" aria-hidden="true">${wall}</div><div class="cvf-tint" aria-hidden="true"></div>
  <header class="cvf-top"><p class="cvf-name">${esc(s.title)}</p><p class="cvf-count" id="cvf-count"></p><button class="cvf-x" data-cvf="close" aria-label="Close"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2.800" stroke-linecap="round"/></svg></button></header>
  <div class="cvf-line" aria-hidden="true"><i id="cvf-prog"></i></div>
  <div class="cvf-stage" id="cvf-stage"></div>
  <div class="cvf-copy" id="cvf-copy"></div>
  <footer class="cvf-ctrl"><button data-cvf="prev" aria-label="Back"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="cvf-play" data-cvf="play" aria-label="Pause"></button><button data-cvf="next" aria-label="Next"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="cvf-all" data-cvf="all">All parts</button><button class="cvf-zoom" data-cvf="zoom">Zoom</button></footer>`;
 const stage=$('#cvf-stage',el),copy=$('#cvf-copy',el),count=$('#cvf-count',el),prog=$('#cvf-prog',el);
 let i=-2,timer=0,paused=false,closed=false,card=null;
 const PLAY='<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5.500v13l11-6.500z" fill="currentColor"/></svg>',PAUSE='<svg viewBox="0 0 24 24" width="20" height="20"><path d="M8 5.500v13M16 5.500v13" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
 const setPlay=()=>{const b=$('.cvf-play',el);b.innerHTML=paused?PLAY:PAUSE;b.setAttribute('aria-label',paused?'Play':'Pause');el.classList.toggle('paused',paused);};
 const after=ms=>{clearTimeout(timer);if(!paused&&!reduced())timer=setTimeout(()=>go(i+1),ms);};
 function swap(html,k,cls='',a=0.633){
  const old=card,r=((k*37)%7-3)*0.5;card=document.createElement('div');card.className='cvf-card '+cls;card.style.setProperty('--a',a);card.style.transform=`rotate(${r}deg)`;card.innerHTML=html;stage.appendChild(card);
  if(reduced()){old?.remove();return;}
  card.animate(IN(r)[((k%4)+4)%4],{duration:760,easing:'cubic-bezier(.34,1.4,.5,1)'});
  if(old){const a2=old.animate([{transform:old.style.transform||'none',opacity:1},{transform:OUT[((k%4)+4)%4],opacity:0}],{duration:420,easing:'cubic-bezier(.5,0,.9,.4)',fill:'forwards'});a2.onfinish=()=>old.remove();}
 }
 function go(n){
  if(closed)return;clearTimeout(timer);
  n=Math.max(-1,Math.min(N,n));i=n;el.dataset.at=n<0?'title':n>=N?'end':'part';
  prog.style.transform=`scaleX(${n<0?0:Math.min(1,(n+1)/N)})`;
  count.textContent=n<0||n>=N?'':`${String(n+1).padStart(2,'0')} / ${N}`;
  el.querySelectorAll('.cvf-col i.on').forEach(x=>x.classList.remove('on'));
  if(n>=0&&n<N)el.querySelectorAll(`.cvf-col i[data-k="${n}"]`).forEach(x=>x.classList.add('on'));
  if(n<0){
   swap(`<div class="cvf-fan">${[s.pages[0],s.pages[Math.min(1,N-1)],s.pages[Math.min(2,N-1)]].map((p,k)=>`<span style="--k:${k}">${page(s,p)}</span>`).join('')}</div>`,0,'fan',0.78);
   copy.innerHTML=`<p class="cvf-k">A cover story in ${N} parts${s.from?` · Chapters ${s.from} to ${s.to}`:''}</p><h2 class="cvf-h">${words(s.title)}</h2><p class="cvf-about">${esc(s.about)}</p>`;
   after(4400);
  }else if(n>=N){
   see('serial:'+s.id);if(!S.seen['paid:serial:'+s.id]){S.seen['paid:serial:'+s.id]=Date.now();earn(3e6,'A cover story, start to finish');}
   swap(`<div class="cvf-grid">${s.pages.map((p,k)=>`<button data-cvf-part="${k}" style="--k:${k}" aria-label="Part ${k+1}"><img src="${thumb(s,p)}" alt="" loading="lazy" decoding="async"><b>${k+1}</b></button>`).join('')}</div>`,1,'wall',1.1);
   copy.innerHTML=`<p class="cvf-k">${esc(s.title)}</p><h2 class="cvf-h">${words('The end.')}</h2><div class="cvf-btns"><button class="cvf-b" data-cvf="again">Play it again</button>${next&&next!==s?`<button class="cvf-b ghost" data-cvf="nextserial">Next: ${esc(next.title)}</button>`:''}</div>`;
  }else{
   const p=s.pages[n],line=p.line||'';
   swap(page(s,p),n,'',(p.w/p.h).toFixed(3));
   copy.innerHTML=`<p class="cvf-k"><b>Part ${n+1}</b>${p.ch?` · Chapter ${p.ch}`:''}</p>${line?`<h2 class="cvf-h ${line.length<26?'xl':line.length<56?'l':line.length<100?'m':'s'}">${words(line)}</h2>`:''}`;
   const nx=s.pages[n+1];if(nx){const im=new Image();im.src=src(s,nx);}
   after(3400+Math.min(3600,line.split(/\s+/).length*260));
  }
 }
 const layer={close(){if(closed)return;closed=true;clearTimeout(timer);popLayer(layer);el.classList.add('out');setTimeout(()=>el.remove(),reduced()?0:320);},
  key(e){if(e.key==='ArrowRight'){go(i+1);}if(e.key==='ArrowLeft')go(i-1);if(e.key===' '){e.preventDefault();paused=!paused;setPlay();if(!paused)after(900);else clearTimeout(timer);}}};
 el.addEventListener('click',e=>{
  const part=e.target.closest('[data-cvf-part]');if(part){paused=false;setPlay();go(+part.dataset.cvfPart);return;}
  const b=e.target.closest('[data-cvf]');
  if(b){const a=b.dataset.cvf;
   if(a==='close')layer.close();else if(a==='prev')go(i-1);else if(a==='next')go(i+1);else if(a==='again'){paused=false;setPlay();go(-1);}
   else if(a==='all'){paused=true;setPlay();go(N);}
   else if(a==='nextserial'){layer.close();setTimeout(()=>openSerial(next.id),reduced()?0:240);}
   else if(a==='play'){paused=!paused;setPlay();if(!paused)after(700);else clearTimeout(timer);}
   else if(a==='zoom'&&i>=0&&i<N){paused=true;setPlay();clearTimeout(timer);const v=document.createElement('div');v.className='cvf-whole';v.innerHTML=`<img src="${src(s,s.pages[i])}" alt=""><button aria-label="Close the page">Done</button>`;v.querySelector('button').addEventListener('click',ev=>{ev.stopPropagation();v.remove();});v.querySelector('img').addEventListener('click',()=>v.classList.toggle('big'));v.addEventListener('click',ev=>ev.stopPropagation());el.appendChild(v);}
   return;}
  if(e.target.closest('.cvf-whole'))return;
  const x=e.clientX/innerWidth;go(x<.28?i-1:i+1);
 });
 let x0=null,sw=false;el.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;sw=false;},{passive:true});
 el.addEventListener('touchend',e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>60&&!el.querySelector('.cvf-whole')){sw=true;go(i+(dx<0?1:-1));}},{passive:true});
 el.addEventListener('click',e=>{if(sw){sw=false;e.stopPropagation();}},true);
 document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('in'));pushLayer(layer);setPlay();go(start);
 return layer;
}

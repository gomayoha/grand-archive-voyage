// Shared pieces of the app: the morph between a card and its full screen, sheets, the story reader,
// the picture viewer, toasts and the rise-in of text as it enters the screen.
import {$,$$,esc,reduced,FU,TH,data} from './store.js';

/* ------------------------------------------------------------------ morph (View Transitions, with a plain fallback) */
const canVT=()=>!!document.startViewTransition&&!reduced();
export function morph(from,update,to){
 if(!canVT()){update();return Promise.resolve();}
 if(from)from.style.viewTransitionName='hero';
 const t=document.startViewTransition(()=>{if(from)from.style.viewTransitionName='';update();const el=to?.();if(el)el.style.viewTransitionName='hero';});
 return t.finished.catch(()=>{}).finally(()=>{const el=to?.();if(el)el.style.viewTransitionName='';});
}

/* ------------------------------------------------------------------ layers (anything that covers the app) */
const stack=[];
const lock=()=>document.documentElement.classList.toggle('locked',stack.length>0);
function push(layer){stack.push(layer);lock();}
function pop(layer){const i=stack.indexOf(layer);if(i>=0)stack.splice(i,1);lock();}
addEventListener('keydown',e=>{const top=stack[stack.length-1];if(!top)return;if(e.key==='Escape'){e.preventDefault();top.close();}else top.key?.(e);});
// pull down from the top of a layer to close it (phones)
function pullToClose(el,scroller,close){
 let y0=null,dy=0;
 el.addEventListener('touchstart',e=>{y0=(scroller?scroller.scrollTop:0)<=0?e.touches[0].clientY:null;dy=0;},{passive:true});
 el.addEventListener('touchmove',e=>{if(y0===null)return;dy=e.touches[0].clientY-y0;if(dy>0&&(!scroller||scroller.scrollTop<=0))el.style.transform=`translate3d(0,${(dy*.55).toFixed(1)}px,0) scale(${(1-Math.min(dy,400)/4000).toFixed(4)})`;},{passive:true});
 el.addEventListener('touchend',()=>{if(y0===null)return;el.style.transition='transform .35s cubic-bezier(.32,.72,0,1)';const go=dy>130;el.style.transform='';setTimeout(()=>{el.style.transition='';},360);y0=null;if(go)close();});
}

/* ------------------------------------------------------------------ sheet: a card grown to full screen */
// opts.from = the element it grows out of; html must contain one .sh-hero for the morph to land on
export function openSheet(html,{from=null,cls='',onOpen,onClose}={}){
 const el=document.createElement('div');el.className='sheet '+cls;el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
 el.innerHTML=`<div class="sh-scrim" data-x></div><div class="sh-card"><button class="sh-x" data-x aria-label="Close"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></button><div class="sh-body">${html}</div></div>`;
 const hero=()=>el.isConnected?el.querySelector('.sh-hero')||el.querySelector('.sh-card'):null;
 let closed=false;
 const layer={close(){if(closed)return;closed=true;pop(layer);onClose?.();
   const back=from&&from.isConnected?from:null,h=hero();
   if(canVT()&&back&&h){h.style.viewTransitionName='hero';const t=document.startViewTransition(()=>{h.style.viewTransitionName='';el.remove();back.style.viewTransitionName='hero';});t.finished.catch(()=>{}).finally(()=>{back.style.viewTransitionName='';});}
   else{el.classList.add('out');setTimeout(()=>el.remove(),reduced()?0:320);}
  }};
 el.addEventListener('click',e=>{if(e.target.closest('[data-x]'))layer.close();});
 morph(from,()=>{document.body.appendChild(el);if(!canVT()||!from)el.classList.add('in');},hero);
 push(layer);pullToClose(el.querySelector('.sh-card'),el.querySelector('.sh-body'),()=>layer.close());
 onOpen?.(el,layer);requestAnimationFrame(()=>el.querySelector('.sh-x')?.focus({preventScroll:true}));
 return layer;
}

/* ------------------------------------------------------------------ story: pages you tap through, like a memory */
// pages: [{kicker,title,text,quote,img,foot,tint,html}]
export function openStory(pages,{from=null,start=0,onEnd}={}){
 pages=pages.filter(Boolean);if(!pages.length)return;
 const el=document.createElement('div');el.className='story';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
 el.innerHTML=`<div class="st-bars">${pages.map(()=>'<i><b></b></i>').join('')}</div><button class="sh-x st-x" aria-label="Close"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></button><div class="st-stage"></div><button class="st-nav prev" aria-label="Back"></button><button class="st-nav next" aria-label="Next"></button><p class="st-hint">Tap to continue</p>`;
 const stage=el.querySelector('.st-stage'),bars=[...el.querySelectorAll('.st-bars i')];let i=-1,closed=false;
 const size=t=>{const n=(t||'').length;return n<90?'xl':n<200?'l':n<420?'m':'s';};
 const pageHTML=p=>p.html||`${p.img?`<div class="st-pic"><img src="${p.img}" alt="" decoding="async"></div>`:''}<div class="st-copy">${p.kicker?`<p class="st-k">${esc(p.kicker)}</p>`:''}${p.title?`<h2 class="st-t">${p.title}</h2>`:''}${p.quote?`<p class="st-q ${size(p.quote)}">${esc(p.quote)}</p>`:''}${p.text?`<p class="st-p ${size(p.text)}">${esc(p.text)}</p>`:''}${p.foot?`<p class="st-f">${esc(p.foot)}</p>`:''}</div>`;
 function show(n,dir=1){
  if(n<0)return;if(n>=pages.length){onEnd?.();layer.close();return;}
  i=n;const p=pages[n],old=stage.firstElementChild,pg=document.createElement('section');
  pg.className='st-page'+(p.img?' has-pic':'')+(p.cls?' '+p.cls:'');if(p.tint)pg.style.setProperty('--tint',p.tint);pg.innerHTML=pageHTML(p);stage.appendChild(pg);
  bars.forEach((b,k)=>{b.classList.toggle('done',k<n);b.classList.toggle('on',k===n);});
  el.classList.toggle('first',n===0);
  if(reduced()){old?.remove();return;}
  pg.animate([{opacity:0,transform:`translate3d(${dir*36}px,0,0)`},{opacity:1,transform:'none'}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'});
  if(old){const a=old.animate([{opacity:1,transform:'none'},{opacity:0,transform:`translate3d(${dir*-28}px,0,0)`}],{duration:260,easing:'ease-out'});a.onfinish=()=>old.remove();}
 }
 const layer={close(){if(closed)return;closed=true;pop(layer);el.classList.add('out');setTimeout(()=>el.remove(),reduced()?0:300);},
  key(e){if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();show(i+1,1);}if(e.key==='ArrowLeft')show(i-1,-1);}};
 el.querySelector('.st-x').addEventListener('click',()=>layer.close());
 el.querySelector('.next').addEventListener('click',()=>show(i+1,1));el.querySelector('.prev').addEventListener('click',()=>show(i-1,-1));
 // tap the right side to go on, the left edge to go back; swipes work too
 let x0=null,swiped=false;el.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;swiped=false;},{passive:true});
 el.addEventListener('touchend',e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>60){swiped=true;show(i+(dx<0?1:-1),dx<0?1:-1);}},{passive:true});
 el.addEventListener('click',e=>{if(swiped){swiped=false;return;}if(e.target.closest('button,a'))return;const back=e.clientX/innerWidth<.28;show(i+(back?-1:1),back?-1:1);});
 document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('in'));push(layer);pullToClose(el,null,()=>layer.close());show(start);
 return layer;
}

/* ------------------------------------------------------------------ pictures, full size */
export function openViewer(ids,start=0,{caption}={}){
 if(!ids.length)return;const el=document.createElement('div');el.className='viewer';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
 el.innerHTML=`<button class="sh-x vw-x" aria-label="Close"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></button><div class="vw-stage"><img alt="" decoding="async"></div><p class="vw-cap"></p><button class="vw-nav prev" aria-label="Previous picture">‹</button><button class="vw-nav next" aria-label="Next picture">›</button>`;
 const img=el.querySelector('img'),cap=el.querySelector('.vw-cap');let i=start,closed=false;
 const show=(n,dir=0)=>{i=(n+ids.length)%ids.length;img.src=FU(ids[i]);cap.textContent=`${caption?caption+' · ':''}${i+1} / ${ids.length}`;
  if(dir&&!reduced())img.animate([{opacity:0,transform:`translate3d(${dir*40}px,0,0) scale(.98)`},{opacity:1,transform:'none'}],{duration:380,easing:'cubic-bezier(.2,.8,.2,1)'});
  const nx=new Image();nx.src=FU(ids[(i+1)%ids.length]);};
 const layer={close(){if(closed)return;closed=true;pop(layer);el.classList.add('out');setTimeout(()=>el.remove(),reduced()?0:260);},key(e){if(e.key==='ArrowRight')show(i+1,1);if(e.key==='ArrowLeft')show(i-1,-1);}};
 el.querySelector('.vw-x').addEventListener('click',()=>layer.close());
 el.querySelector('.next').addEventListener('click',()=>show(i+1,1));el.querySelector('.prev').addEventListener('click',()=>show(i-1,-1));
 el.querySelector('.vw-stage').addEventListener('click',e=>{if(e.target===e.currentTarget)layer.close();});
 let x0=null;el.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;},{passive:true});
 el.addEventListener('touchend',e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>50)show(i+(dx<0?1:-1),dx<0?1:-1);},{passive:true});
 document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('in'));push(layer);pullToClose(el,null,()=>layer.close());show(start);
 return layer;
}
// a whole collection as a wall of pictures, in a sheet
export function openGallery(name,ids,{from=null,sub=''}={}){
 let shown=0;const PAGE=36;
 const cells=()=>{const part=ids.slice(shown,shown+PAGE).map((id,k)=>{const [w,h]=data.media.img[id]||[4,5];return `<button class="gl-c press" data-i="${shown+k}" style="aspect-ratio:${w}/${h}"><img src="${TH(id)}" alt="" loading="lazy" decoding="async"></button>`;}).join('');shown+=PAGE;return part;};
 openSheet(`<header class="sh-head"><p class="eyebrow">${esc(sub||'Collection')}</p><h2 class="sh-title">${esc(name)}</h2><p class="sh-sub">${ids.length} picture${ids.length===1?'':'s'}</p></header><div class="gl sh-hero-none" id="gl">${cells()}</div>${ids.length>PAGE?'<button class="btn ghost gl-more" id="gl-more">Show more</button>':''}`,{from,cls:'wide',onOpen(el){
  el.addEventListener('click',e=>{const c=e.target.closest('.gl-c');if(c)openViewer(ids,+c.dataset.i,{caption:name});
   if(e.target.closest('#gl-more')){el.querySelector('#gl').insertAdjacentHTML('beforeend',cells());if(shown>=ids.length)e.target.closest('#gl-more').remove();}});
 }});
}

/* ------------------------------------------------------------------ toasts: one line at the top, like a notification */
let tq=[],tBusy=false;
export function toast(title,sub=''){tq.push([title,sub]);if(!tBusy)nextToast();}
function nextToast(){
 const it=tq.shift();if(!it){tBusy=false;return;}tBusy=true;
 const el=document.createElement('div');el.className='toast';el.setAttribute('role','status');el.innerHTML=`<b>${esc(it[0])}</b>${it[1]?`<span>${esc(it[1])}</span>`:''}`;
 document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('in'));
 setTimeout(()=>{el.classList.remove('in');setTimeout(()=>{el.remove();nextToast();},380);},2300);
}

/* ------------------------------------------------------------------ rise: text and cards ease in as they enter */
const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}},{rootMargin:'0px 0px -8% 0px'});
export function rise(root=document){$$('[data-rise]:not(.in)',root).forEach((el,i)=>{if(!el.style.getPropertyValue('--d'))el.style.setProperty('--d',`${Math.min(i%6,5)*60}ms`);io.observe(el);});}

// count a number up (bounty, totals)
export function countUp(el,to,{from=0,ms=1100,prefix=''}={}){
 if(reduced()){el.textContent=prefix+Math.round(to).toLocaleString('en-US');return;}
 const t0=performance.now();const tick=t=>{const p=Math.min(1,(t-t0)/ms),e=1-Math.pow(1-p,4);el.textContent=prefix+Math.round(from+(to-from)*e).toLocaleString('en-US');if(p<1)requestAnimationFrame(tick);};requestAnimationFrame(tick);
}
export const imgTag=(src,cls='')=>`<img class="${cls}" src="${src}" alt="" loading="lazy" decoding="async">`;

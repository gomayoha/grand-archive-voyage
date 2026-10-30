// The Character Log, opened on purpose (Oct 30 2026). He asked that the records stop rolling past on the way
// down the page and only appear when he chooses to go there. They wait tied up in a bundle (#characters,
// s/characters.js); breaking its seal opens this room.
// It is a character select, like a fighting game: the roster along the bottom (the eleven records, then the
// ones who "still left something"), the chosen one up front with the word they left behind, and a menu of
// what you can do with them: read everything he wrote, turn over the first impression, open their pictures,
// or watch the records play one after another like stories (tap to skip, hold to pause).
// Every word is his, from his notes; nothing is shortened except the quote on the front, and the reader has it all.
import {esc,pad,data,motion,coarse,TH,FU} from './core.js';
import {CI,CM,UPDATES,word,lineFor,photosFor,supCol,supArt} from './s/characters.js';
import {bindTexts} from './texts.js';

let css=null;
const sheet=()=>css||(css=new Promise(res=>{const l=document.createElement('link');l.rel='stylesheet';l.href='css/charlog.css';l.onload=res;l.onerror=res;document.head.appendChild(l);}));
const WATCH=10500;// ms per record in Watch mode

let dlg=null,L=[],sel=0,watch=null;
const $d=s=>dlg.querySelector(s);

function entries(){
 const CH=data.characters.characters,SUP=data.characters.supporting||[];
 return [
  ...CH.map((c,i)=>({k:'rec',i,c,name:c.name,series:c.series||'',tint:c.image.color,img:CM(c.image.id),big:CI(c.image.id),ar:`${c.image.w}/${c.image.h}`,word:word(c)})),
  ...SUP.map(c=>{const col=supCol(c.name),art=supArt(c);return{k:'sup',c,name:c.name,series:c.series||'Black Clover',tint:'#2a2116',img:art,big:col?.cover?FU(col.cover):art,ar:'3/4',word:c.word||'',col};})
 ];
}

export async function openCharLog(at,{watch:w=false}={}){
 await sheet();
 if(!dlg)build();
 if(at!=null&&L[at])sel=at;
 if(!dlg.open){dlg.showModal();document.documentElement.style.overflow='hidden';document.documentElement.classList.add('room-open');}
 if(location.hash!=='#charlog')history.replaceState(null,'','#charlog');
 show(sel,0,true);
 dlg.classList.remove('dealt');void dlg.offsetWidth;dlg.classList.add('dealt');
 if(w)startWatch(at??0);
}

function build(){
 L=entries();const N=data.characters.characters.length;
 dlg=document.createElement('dialog');dlg.className='cl';dlg.setAttribute('aria-labelledby','cl-title');
 dlg.innerHTML=`<div class="cl-bg" aria-hidden="true"><img alt="" decoding="async"></div><i class="cl-vig" aria-hidden="true"></i>
  <header class="cl-top">
   <div class="cl-t"><p class="eyebrow">01 · The Character Log</p><h2 id="cl-title">Choose a <em>record.</em></h2></div>
   <div class="cl-acts"><button class="cl-watchall" data-cl-watch="0"><i aria-hidden="true">▶</i> Watch<span class="cl-long"> them all</span></button><button class="cl-x" data-cl-close>Close ✕</button></div>
  </header>
  <div class="cl-main">
   <div class="cl-stage"><div class="cl-tilt"><figure class="cl-card"><img alt="" decoding="async"><i class="cl-glare" aria-hidden="true"></i></figure></div><button class="cl-arrow prev" data-cl-step="-1" aria-label="Previous">‹</button><button class="cl-arrow next" data-cl-step="1" aria-label="Next">›</button></div>
   <div class="cl-info" aria-live="polite"></div>
  </div>
  <div class="cl-roster" role="listbox" aria-label="Every record">${L.map((e,j)=>`${j===N?`<span class="cl-div" aria-hidden="true"><small>They still left something</small></span>`:''}<button class="cl-r${e.k==='sup'?' sup':''}" role="option" data-cl-pick="${j}" style="--tint:${e.tint};--d:${(j*28)}ms" aria-label="${esc(e.name)}">${e.img?`<img src="${esc(e.img)}" alt="" decoding="async" loading="lazy">`:`<span class="cl-r-mark">${esc(e.name[0])}</span>`}<b>${e.k==='rec'?pad(e.i+1):'+'}</b></button>`).join('')}</div>
  <div class="cl-watch" hidden></div>`;
 document.body.appendChild(dlg);
 dlg.addEventListener('close',()=>{stopWatch();document.documentElement.style.overflow='';document.documentElement.classList.remove('room-open');if(location.hash==='#charlog')history.replaceState(null,'',location.pathname+location.search);});
 dlg.addEventListener('cancel',e=>{if(watch){e.preventDefault();stopWatch();}});
 dlg.addEventListener('click',e=>{
  const t=e.target;
  if(t.closest('[data-cl-close]')){dlg.close();return;}
  const p=t.closest('[data-cl-pick]');if(p){show(+p.dataset.clPick,+p.dataset.clPick>sel?1:-1);return;}
  const s=t.closest('[data-cl-step]');if(s){step(+s.dataset.clStep);return;}
  const w=t.closest('[data-cl-watch]');if(w){startWatch(+w.dataset.clWatch);return;}
  const j=t.closest('.judge');if(j)j.setAttribute('aria-pressed',String(j.getAttribute('aria-pressed')!=='true'));
 });
 dlg.addEventListener('keydown',e=>{if(watch||e.target.closest('input,textarea,[contenteditable]'))return;if(e.key==='ArrowRight'){e.preventDefault();step(1);}if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}});
 // the portrait leans toward the mouse; a swipe on it (phones) changes the record
 const stage=$d('.cl-stage'),tilt=$d('.cl-tilt');
 if(!coarse)stage.addEventListener('pointermove',e=>{if(motion.reduced)return;const r=stage.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;tilt.style.transform=`rotateY(${(x*14).toFixed(2)}deg) rotateX(${(-y*10).toFixed(2)}deg)`;tilt.style.setProperty('--gx',(50+x*90).toFixed(1)+'%');});
 stage.addEventListener('pointerleave',()=>{tilt.style.transform='';});
 let sx=null,sy=0;
 stage.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY;},{passive:true});
 stage.addEventListener('touchend',e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;sx=null;if(Math.abs(dx)>46&&Math.abs(dx)>Math.abs(dy))step(dx<0?1:-1);},{passive:true});
}
const step=d=>show((sel+d+L.length)%L.length,d);

/* ---------------------------------------------------------------- the chosen record */
function info(e){
 if(e.k==='sup'){
  const c=e.c,k=c.name.toLowerCase().replace(/[^a-z]+/g,'-'),n=e.col?.all?.length||0;
  return `<p class="cl-no k">They still left something · ${esc(e.series)}</p>
   <h3 class="cl-name k">${esc(c.name)}</h3>
   ${c.word?`<p class="cl-word k"><small>Left behind</small><span data-w="also.${k}.word" data-wl="Left behind">${esc(c.word)}</span></p>`:''}
   <p class="cl-left k" data-w="also.${k}.line" data-wl="What stayed with me">${esc(c.line)}</p>
   <p class="cl-src k">Not a full record yet. ${esc(c.source||'')}</p>
   <div class="cl-menu k">${n?`<button class="cl-m" data-collection="sup:${esc(c.name)}"><b>Their pictures</b><small>${n} ${n===1?'picture':'pictures'}</small><i>→</i></button>`:''}</div>`;
 }
 const c=e.c,i=e.i,N=data.characters.characters.length,ph=photosFor(c),n=ph?ph.all.length:0,up=UPDATES[c.id];
 return `<p class="cl-no k"><b>${pad(i+1)}</b> / ${pad(N)}${c.series?` · ${esc(c.series)}`:''}</p>
  <h3 class="cl-name k">${esc(c.name)}</h3>
  ${e.word?`<p class="cl-word k"><small>Left behind</small><span data-w="char.${c.id}.word" data-wl="Left behind">${esc(e.word)}</span></p>`:''}
  ${c.left?`<p class="cl-left k" data-w="char.${c.id}.left" data-wl="What it means">${esc(c.left)}</p>`:''}
  <blockquote class="cl-quote k">“${esc(lineFor(c))}”</blockquote>
  ${up?`<p class="cl-up k"><small>${esc(up.when)}</small>${esc(up.text)}</p>`:''}
  <div class="cl-menu k">
   <button class="cl-m" data-read="${i}"><b>Read everything I wrote</b><small>${c.paras.length} ${c.paras.length===1?'paragraph':'paragraphs'}, word for word</small><i>→</i></button>
   <button class="cl-m" data-cl-watch="${i}"><b>Watch from here</b><small>The records, one after another</small><i>▶</i></button>
   ${n?`<button class="cl-m" data-collection="char:${i}"><b>Their pictures</b><small>${n} ${n===1?'picture':'pictures'}</small><i>→</i></button>`:''}
  </div>
  ${c.first?`<button class="judge k" data-i="${i}" aria-pressed="false" aria-label="First impression versus current opinion"><span class="judge-face judge-f"><small>First impression</small><b>“${esc(c.first)}”</b><i>Tap for the verdict</i></span><span class="judge-face judge-b"><small>Current opinion</small><b>${esc(c.now.slice(0,3).join(' '))}</b></span></button>`:''}`;
}
function show(j,dir=0,first=false){
 const e=L[j];if(!e)return;const was=sel;sel=j;
 dlg.style.setProperty('--tint',e.tint);
 const card=$d('.cl-card'),img=card.querySelector('img'),bg=$d('.cl-bg img');
 // the old portrait slides away as the new one deals in from the side you moved toward
 if(!first&&!motion.reduced&&was!==j){
  const ghost=card.cloneNode(true);ghost.classList.add('ghost');card.parentNode.appendChild(ghost);
  ghost.animate([{transform:'none',opacity:1},{transform:`translate3d(${dir>=0?-34:34}%,0,-120px) rotateY(${dir>=0?24:-24}deg)`,opacity:0}],{duration:520,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}).finished.then(()=>ghost.remove());
  card.animate([{transform:`translate3d(${dir>=0?30:-30}%,0,-160px) rotateY(${dir>=0?-26:26}deg)`,opacity:0},{transform:'none',opacity:1}],{duration:720,easing:'cubic-bezier(.2,.8,.2,1)'});
 }
 card.style.setProperty('--ar',e.ar);img.src=e.big||e.img||'';img.alt=e.name;
 if(bg){bg.src=e.img||'';}
 const inf=$d('.cl-info');inf.innerHTML=info(e);bindTexts(inf);
 inf.classList.remove('in');void inf.offsetWidth;inf.classList.add('in');
 dlg.querySelectorAll('.cl-r').forEach((b,k)=>{b.setAttribute('aria-selected',String(k===j));});
 // the roster scrolls itself (scrollIntoView would also slide the whole room sideways)
 const cur=dlg.querySelectorAll('.cl-r')[j],ro=$d('.cl-roster');if(cur)ro.scrollTo({left:cur.offsetLeft-ro.clientWidth/2+cur.offsetWidth/2,behavior:first||motion.reduced?'instant':'smooth'});
 $d('#cl-title').innerHTML=e.k==='rec'?'Choose a <em>record.</em>':'They still left <em>something.</em>';
 // warm the neighbours so stepping never waits
 [1,-1].forEach(d=>{const n=L[(j+d+L.length)%L.length];if(n?.big){const i=new Image();i.src=n.big;}});
}

/* ---------------------------------------------------------------- Watch: the records as stories */
function slide(e){
 const c=e.c,up=e.k==='rec'?UPDATES[c.id]:null;
 return `<div class="cw-s" style="--tint:${e.tint}">
  <div class="cw-bg" aria-hidden="true"><img src="${esc(e.img||'')}" alt=""></div>
  <figure class="cw-pic" style="--ar:${e.ar}"><img src="${esc(e.big||e.img||'')}" alt="${esc(e.name)}"></figure>
  <div class="cw-copy">
   <p class="cw-no">${e.k==='rec'?`${pad(e.i+1)} / ${pad(data.characters.characters.length)}`:'They still left something'}${e.series?` · ${esc(e.series)}`:''}</p>
   <h3 class="cw-name">${esc(e.name)}</h3>
   ${e.word?`<p class="cw-word"><small>Left behind</small><span>${esc(e.word)}</span></p>`:''}
   <p class="cw-left">${esc(e.k==='rec'?(c.left||''):c.line)}</p>
   ${e.k==='rec'?`<blockquote class="cw-q">“${esc(lineFor(c))}”</blockquote>`:''}
   ${up?`<p class="cw-up"><small>${esc(up.when)}</small>${esc(up.text)}</p>`:''}
   ${e.k==='rec'?`<button class="cw-read" data-read="${e.i}">Read everything I wrote →</button>`:''}
  </div></div>`;
}
function startWatch(from=0){
 stopWatch();const box=$d('.cl-watch');box.hidden=false;
 box.innerHTML=`<div class="cw-bars">${L.map(()=>'<i><b></b></i>').join('')}</div><div class="cw-stage"></div><button class="cw-x" aria-label="Stop watching">✕</button><p class="cw-tip">Tap to skip · hold to pause</p>`;
 const bars=[...box.querySelectorAll('.cw-bars i')],stage=box.querySelector('.cw-stage');
 let i=from,t0=0,left=WATCH,paused=false,timer=0,downAt=0,downX=0;
 const go=k=>{
  if(k>=L.length){stopWatch();show(L.length-1);return;}
  if(k<0)k=0;i=k;show(i,0,true);
  bars.forEach((b,n)=>{b.className=n<i?'done':n===i?'now':'';b.firstChild.style.animation='none';});
  void box.offsetWidth;const bar=bars[i].firstChild;bar.style.animation=`cwFill ${WATCH}ms linear forwards`;
  stage.innerHTML=slide(L[i]);stage.firstChild.classList.add('go');
  left=WATCH;t0=performance.now();clearTimeout(timer);timer=setTimeout(()=>go(i+1),left);
 };
 const pause=p=>{if(p===paused)return;paused=p;box.classList.toggle('paused',p);const bar=bars[i].firstChild;bar.style.animationPlayState=p?'paused':'running';stage.querySelectorAll('.cw-pic img,.cw-bg img').forEach(im=>im.style.animationPlayState=p?'paused':'running');
  if(p){clearTimeout(timer);left-=performance.now()-t0;}else{t0=performance.now();timer=setTimeout(()=>go(i+1),Math.max(200,left));}};
 box.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;downAt=performance.now();downX=e.clientX;box._hold=setTimeout(()=>pause(true),220);});
 box.addEventListener('pointerup',e=>{if(e.target.closest('button'))return;clearTimeout(box._hold);if(paused){pause(false);return;}if(performance.now()-downAt<400)go(downX<innerWidth*0.3?i-1:i+1);});
 box.addEventListener('pointercancel',()=>{clearTimeout(box._hold);if(paused)pause(false);});
 box.querySelector('.cw-x').addEventListener('click',()=>stopWatch());
 // opening the reader from a story pauses it; closing the reader carries on
 box.addEventListener('click',e=>{if(e.target.closest('[data-read]'))pause(true);});
 const dlgMain=document.getElementById('dialog');const onClose=()=>{if(watch&&paused)pause(false);};dlgMain.addEventListener('close',onClose);
 watch={stop(){clearTimeout(timer);clearTimeout(box._hold);dlgMain.removeEventListener('close',onClose);}};
 dlg.classList.add('watching');go(i);
}
function stopWatch(){if(!watch)return;watch.stop();watch=null;const box=$d('.cl-watch');box.hidden=true;box.innerHTML='';box.replaceWith(box.cloneNode(false));dlg.classList.remove('watching');}

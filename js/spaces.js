// Worlds of their own (Oct 31 2026): a space for each anime that changed him besides One Piece, opened on
// purpose like the Character Log. He asked for the story told beautifully, the characters and how they grow,
// his Pinterest pictures, and cards; each space has its own idea:
//  · Violet Evergarden, letters: an envelope with the Major's emerald for a seal; the story is typed out letter
//    by letter on cream paper, Anne's fifty birthday letters are delivered one by one, and at the end letters
//    fall over the city like the Air Show.
//  · Re:Zero, Return by Death: the room counts how many times you've come back ("nobody else remembers");
//    the first time you read past a death in an arc, the Witch's hands close in and you wake at the save point.
//    Beatrice hides behind one of five doors.
//  · Omniscient Reader's Viewpoint, the Fourth Wall: the novel as a reader's screen with system windows and
//    constellations in the margin; nothing past the chapter he has read is written here (the shelf knows it).
// Every chapter you reach unlocks a card of that world's set (one-piece-TCG style, made from his pictures),
// kept in grand-archive:spaces with a small bounty each. Words: js/spaces-text.js.
import {esc,data,motion,coarse,TH,FU} from './core.js';
import {registerCollection} from './dialogs.js';
import {once} from './bounty.js';
import {SPACES} from './spaces-text.js';

const KEY='grand-archive:spaces';
let S={cards:{},loops:{},died:{},door:0};
try{S={...S,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S));}catch{}};
export const state=()=>S;

let css=null;
const sheet=()=>css||(css=new Promise(res=>{const l=document.createElement('link');l.rel='stylesheet';l.href='css/spaces.css';l.onload=res;l.onerror=res;document.head.appendChild(l);}));

// his pictures from that board (data/spaces.json pins), by index, and who is in them
let PINS={};
async function pins(){if(Object.keys(PINS).length)return PINS;const j=await fetch('data/spaces.json').then(r=>r.json()).catch(()=>({}));for(const k in SPACES)PINS[k]=(j[SPACES[k].board]||{}).pins||[];return PINS;}
const pid=(k,i)=>(PINS[k][i]||PINS[k][0]||{}).id;
const img=(id,cls='',sizes='(max-width:820px) 90vw, 46vw')=>id?`<img${cls?` class="${cls}"`:''} src="${TH(id)}" srcset="${TH(id)} 720w, ${FU(id)} 1800w" sizes="${sizes}" alt="" decoding="async" loading="lazy">`:'';
registerCollection('space',k=>{const [key,who]=k.split('~');const sp=SPACES[key];const ids=(PINS[key]||[]).filter(p=>!who||p.who===who).map(p=>p.id);return{title:who||sp.title,eyebrow:who?sp.title:'My Pinterest board',ids};});

// how far he has read (Omniscient Reader) and his record on the shelf
const rec=sp=>(data.shelf?.[sp.shelf[0]]||[]).find(r=>r.t===sp.shelf[1])||{};
const readTo=sp=>+(String(rec(sp).chapter||'').match(/\d+/)||[0])[0];

/* ---------------------------------------------------------------- cards */
const RN={L:'Leader',SEC:'Secret Rare',SR:'Super Rare',R:'Rare',C:'Common'};
const sealedFor=(sp,c)=>c.sealed&&readTo(sp)<100;
export function cardHTML(key,c,{big=false}={}){
 const sp=SPACES[key];
 return `<div class="spc spc-${key} r-${c.rare.toLowerCase()}${big?' big':''}${sealedFor(sp,c)?' sealed':''}" data-spc="${c.id}">
  <div class="spc-art">${img(pid(key,c.pic),'',big?'(max-width:820px) 80vw, 420px':'(max-width:820px) 45vw, 220px')}</div>
  <b class="spc-cost">${c.cost}</b>${c.power?`<b class="spc-pow">${c.power.toLocaleString('en-US')}</b>`:''}
  <div class="spc-plate"><small>${esc(c.kind)}</small><b>${esc(c.name)}</b><span>${esc(c.type)}</span></div>
  <p class="spc-fx">${esc(c.fx)}</p>
  <div class="spc-foot"><span>${esc(c.id)}</span><span>${esc(c.rare)}</span></div>
 </div>`;
}
function unlock(key,c){
 if(S.cards[c.id]||sealedFor(SPACES[key],c))return;
 S.cards[c.id]=new Date().toISOString().slice(0,10);save();
 once('sp:'+c.id,2e6,`Card: ${c.name}`);
 const sp=SPACES[key];if(sp.cards.every(x=>S.cards[x.id]||sealedFor(sp,x)))once('sp:set:'+key,20e6,`Every ${sp.title} card`);
 paintBinder();
}
const owned=key=>SPACES[key].cards.filter(c=>S.cards[c.id]).length;
export const progress=key=>[owned(key),SPACES[key].cards.length];

/* ---------------------------------------------------------------- the room */
let dlg=null,cur=null,io=null;
const $d=s=>dlg.querySelector(s);

export async function openSpace(key){
 if(!SPACES[key])return;
 await Promise.all([sheet(),pins()]);
 if(!dlg)make();
 cur=key;const sp=SPACES[key];
 if(key==='rezero'){S.loops.rezero=(S.loops.rezero||0)+1;save();}
 dlg.className=`sp sp-${key}`;
 dlg.innerHTML=`<div class="sp-scroll" id="sp-scroll">
  <header class="sp-bar"><span class="sp-t"><small>${esc(sp.kicker)}</small><b>${esc(sp.title)}</b></span><span class="sp-have" id="sp-have"></span><button class="sp-x" data-sp-close>Close ✕</button></header>
  ${OPEN[key](sp)}
  ${sp.chapters.map((c,i)=>chapter(key,sp,c,i)).join('')}
  ${END[key](sp)}
  ${hisWords(key,sp)}
  ${cast(key,sp)}
  <section class="sp-binder"><p class="sp-eyebrow">The ${esc(sp.title)} set</p><h3>Cards you've <em>found here.</em></h3><p class="sp-sub">One for every chapter you reach. They stay in your binder.</p><div class="sp-cards" id="sp-cards"></div></section>
  <footer class="sp-foot"><button class="sp-x" data-sp-close>Close the space</button></footer>
 </div><div class="sp-over" id="sp-over" aria-hidden="true"></div>`;
 if(!dlg.open){dlg.showModal();document.documentElement.style.overflow='hidden';document.documentElement.classList.add('room-open');}
 if(location.hash!=='#space:'+key)history.replaceState(null,'','#space:'+key);
 once('sp:open:'+key,5e6,`Entered ${sp.title}`);
 $d('#sp-scroll').scrollTop=0;
 paintBinder();watch(key,sp);
 if(key==='violet')typeify();
}

function make(){
 dlg=document.createElement('dialog');document.body.appendChild(dlg);
 dlg.addEventListener('close',()=>{io?.disconnect();io?.trips?.disconnect();document.documentElement.style.overflow='';document.documentElement.classList.remove('room-open');if(location.hash.startsWith('#space'))history.replaceState(null,'',location.pathname+location.search);dlg.innerHTML='';});
 dlg.addEventListener('cancel',e=>{if($d('.spc-zoom')){e.preventDefault();$d('.spc-zoom').remove();}});
 dlg.addEventListener('click',e=>{const t=e.target;
  if(t.closest('[data-sp-close]')){dlg.close();return;}
  if(t.closest('.ve-env:not(.opened)')){openEnvelope();return;}
  const d=t.closest('[data-door]');if(d){door(d);return;}
  if(t.closest('.orv-wall')){const w=t.closest('.orv-wall');w.classList.remove('push');void w.offsetWidth;w.classList.add('push');w.querySelector('.orv-firm').textContent=['[The Fourth Wall is firm.]','[The Fourth Wall does not move.]','[The Fourth Wall is amused by your effort.]','[Read further to break it.]'][(w._n=(w._n||0)+1)%4];return;}
  if(t.closest('[data-sp-again]')){S.loops.rezero=(S.loops.rezero||0)+1;save();$d('#rz-loop').textContent=S.loops.rezero;$d('#sp-scroll').scrollTo({top:0,behavior:motion.reduced?'auto':'smooth'});return;}
  const z=t.closest('.spc-zoom');if(z){z.remove();return;}
  const c=t.closest('.sp-cards .spc:not(.locked)');if(c){zoom(c.dataset.spc);return;}
 });
}

/* every chapter: comes in as you reach it, and unlocks its card */
function chapter(key,sp,c,i){
 const pics=PINS[key];
 const body=(c.p||[]).map(p=>`<p>${p}</p>`).join('')+(c.window?scenario(c.window):'')+(c.p2||[]).map(p=>`<p>${p}</p>`).join('');
 const extra=key==='violet'&&i===5?fifty():key==='rezero'&&c.door?doors():'';
 const msgs=c.msgs?`<div class="orv-cm">${c.msgs.map((m,k)=>`<p style="--k:${k}">${esc(m)}</p>`).join('')}</div>`:'';
 const sys=c.sys?`<p class="orv-sys">${esc(c.sys)}</p>`:'';
 return `<section class="sp-ch${i%2?' flip':''}" data-ch="${i}">
  ${key==='rezero'?`<p class="rz-save" id="rz-save-${i}">${S.died[i]?`Save point · you remember: ${esc(c.death||'')}`:`Save point · ${esc(c.arc||'')}`}</p>`:''}
  <figure class="sp-pic">${img(pid(key,c.pic))}</figure>
  <div class="sp-text">
   <p class="sp-num">${key==='violet'?esc(c.n):key==='orv'?`Chapter ${esc(c.n)}`:esc(c.arc||'')}</p>
   <h3>${esc(c.t)}</h3>${sys}${body}${msgs}
  </div>${extra}
  ${key==='rezero'&&c.death?`<i class="rz-trip" data-trip="${i}" aria-hidden="true"></i>`:''}
 </section>`;
}
function watch(key,sp){
 io?.disconnect();io?.trips?.disconnect();
 const root=$d('#sp-scroll');
 io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const el=e.target;
  el.classList.add('in');
  if(el.dataset.ch!=null){const i=+el.dataset.ch;sp.cards.filter(c=>c.ch===i).forEach(c=>unlock(key,c));}
  if(el.classList.contains('sp-end'))sp.cards.filter(c=>c.ch===sp.chapters.length).forEach(c=>unlock(key,c));
 }),{root,threshold:0.18});
 dlg.querySelectorAll('.sp-ch,.sp-end,.sp-his,.sp-cast,.sp-binder,.sp-open').forEach(el=>io.observe(el));
 // a death only once the end of the arc has been read: its marker has to reach the top half of the screen
 const trips=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)die(+e.target.dataset.trip);}),{root,rootMargin:'0px 0px -55% 0px'});
 dlg.querySelectorAll('.rz-trip').forEach(el=>trips.observe(el));io.trips=trips;
}
function paintBinder(){
 if(!dlg?.open||!cur)return;const sp=SPACES[cur],box=$d('#sp-cards');if(!box)return;
 box.innerHTML=sp.cards.map(c=>S.cards[c.id]?cardHTML(cur,c):`<div class="spc spc-${cur} locked"><i class="spc-back" aria-hidden="true"></i><span>${c.sealed?`Sealed until chapter 100`:c.ch==='door'?'Behind one of the doors':`Reach ${cur==='orv'?'chapter':cur==='violet'?'letter':'arc'} ${esc(sp.chapters[c.ch]?.n??'the end')}`}</span></div>`).join('');
 const [a,b]=progress(cur);$d('#sp-have').textContent=`${a} / ${b} cards`;
}
function zoom(id){const c=SPACES[cur].cards.find(x=>x.id===id);if(!c)return;const z=document.createElement('div');z.className='spc-zoom';z.innerHTML=`${cardHTML(cur,c,{big:true})}<p>${esc(RN[c.rare]||c.rare)} · found ${esc(S.cards[id]||'')} · tap to put it back</p>`;dlg.appendChild(z);
 const card=z.querySelector('.spc');if(!coarse)z.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--ry',(((e.clientX-r.left)/r.width-.5)*16).toFixed(1)+'deg');card.style.setProperty('--rx',((.5-(e.clientY-r.top)/r.height)*12).toFixed(1)+'deg');});}

function hisWords(key,sp){
 const r=rec(sp);
 return `<section class="sp-his"><p class="sp-eyebrow">In my own words</p><h3>${esc(sp.his.title)}</h3>
  ${sp.his.lines.map(l=>`<p>${esc(l)}</p>`).join('')}
  ${r.s?`<p class="sp-rate"><b>${esc(r.s)}</b> / 10${r.tagline?` · <i>${esc(r.tagline)}</i>`:''}</p>`:''}
  <button class="pill small ghost" data-shelf-open="${esc(sp.shelf[0])}:${esc(sp.shelf[1])}">Read everything I wrote →</button></section>`;
}
function cast(key,sp){
 const P=PINS[key],whos=[...new Set(P.map(p=>p.who).filter(Boolean))];
 const groups=whos.length>1?whos.map(w=>({w,ids:P.filter(p=>p.who===w).map(p=>p.id)})):[{w:null,ids:P.map(p=>p.id)}];
 return `<section class="sp-cast"><p class="sp-eyebrow">My board</p><h3>${whos.length>1?'The people <em>in it.</em>':'Every picture <em>I kept.</em>'}</h3>
  <div class="sp-groups">${groups.map(g=>`<button class="sp-group" data-collection="space:${key}${g.w?'~'+esc(g.w):''}"><span class="sp-stack">${g.ids.slice(0,3).map((id,k)=>`<i style="--k:${k}">${img(id,'','160px')}</i>`).join('')}</span><b>${esc(g.w||sp.title)}</b><small>${g.ids.length} pictures</small></button>`).join('')}</div>
  <button class="link" data-collection="space:${key}">All ${P.length} pictures →</button></section>`;
}

/* ---------------------------------------------------------------- Violet: the envelope, typing, fifty letters, the Air Show */
const OPEN={
 violet:sp=>`<section class="sp-open ve-open"><button class="ve-env" aria-label="Break the seal">
   <span class="ve-back" aria-hidden="true"></span>
   <span class="ve-letter"><small>${esc(sp.open.from)}</small><b>Violet Evergarden</b><i>${esc(sp.hook)}</i></span>
   <span class="ve-front" aria-hidden="true"><em>${esc(sp.open.to)}</em></span>
   <span class="ve-flap" aria-hidden="true"></span>
   <span class="ve-seal" aria-hidden="true"><i></i></span>
  </button><p class="ve-hint">Tap the seal</p></section>`,
 rezero:sp=>{const n=S.loops.rezero||1;return `<section class="sp-open rz-open">
   <div class="rz-clock" aria-hidden="true"><i class="h"></i><i class="m"></i></div>
   <p class="rz-loop">Loop <b id="rz-loop">${n}</b></p>
   <h2>${n>1?'You\'ve been here before.':'Return by <em>Death.</em>'}</h2>
   <p class="rz-sub">${n>1?`This is the ${ord(n)} time you've opened this world. Nobody else remembers the others. Only you.`:esc(sp.hook)}</p>
   <figure class="rz-cover">${img(pid('rezero',sp.cover),'','(max-width:820px) 90vw, 50vw')}</figure>
   <p class="rz-down">Scroll. If you die, you'll come back.</p></section>`;},
 orv:sp=>{const ch=readTo(sp);return `<section class="sp-open orv-open">
   <div class="orv-reader"><p class="orv-app">Three Ways to Survive in a Ruined World</p><p class="orv-chap">Chapter 3,149 · Epilogue</p>
   <div class="orv-lines" aria-hidden="true">${Array.from({length:9},(_,k)=>`<i style="--w:${55+((k*37)%40)}%"></i>`).join('')}</div>
   <p class="orv-sys big">[A new scenario has arrived.]</p></div>
   <h2>Omniscient Reader's <em>Viewpoint.</em></h2><p class="orv-sub">${esc(sp.hook)}</p>
   <p class="orv-progress">[You have read up to chapter ${ch||'?'}.] Everything past it stays behind the Fourth Wall.</p></section>`;}
};
const ord=n=>n+(['th','st','nd','rd'][(n%100>10&&n%100<14)?0:Math.min(n%10,4)%4]||'th');
const END={
 violet:sp=>`<section class="sp-end ve-air"><div class="ve-fall" aria-hidden="true">${PINS.violet.slice(0,14).map((p,k)=>`<i style="--k:${k};--x:${(k*37)%100}%;--r:${(k*53)%40-20}deg"><img src="${TH(p.id)}" alt="" loading="lazy" decoding="async"></i>`).join('')}</div>
  <div class="ve-air-copy"><p class="sp-eyebrow">The Air Show</p><h3>Letters falling <em>over the city.</em></h3><p>For anyone who has someone they could never write to.</p></div></section>`,
 rezero:sp=>`<section class="sp-end rz-end"><p class="rz-loop">Loop <b>${S.loops.rezero||1}</b></p><h2>Fine. <em>One more try.</em></h2><button class="pill small ghost" data-sp-again>Return to the save point ↺</button></section>`,
 orv:sp=>{const ch=readTo(sp);return `<section class="sp-end orv-wall-sec"><button class="orv-wall" aria-label="The Fourth Wall">
   <span class="orv-redact" aria-hidden="true">${Array.from({length:14},(_,k)=>`<i style="--w:${40+((k*29)%55)}%"></i>`).join('')}</span>
   <span class="orv-wall-msg"><b>[The Fourth Wall is blocking this part of the story.]</b><span>[You have read up to chapter ${ch||'?'}.]</span><span class="orv-firm">[Tap it. It won't move.]</span></span></button>
   <p class="orv-after">This page is a reader's viewpoint: it only knows what I've read. When I read further, the wall moves with me.</p></section>`;}
};
function openEnvelope(){
 const env=$d('.ve-env');env.classList.add('opened');
 setTimeout(()=>{const n=$d('.sp-ch');if(n)$d('#sp-scroll').scrollTo({top:n.offsetTop-40,behavior:motion.reduced?'auto':'smooth'});},motion.reduced?0:1500);
}
// each word comes in like it is being typed (only the letters, only once each)
function typeify(){
 if(motion.reduced)return;
 dlg.querySelectorAll('.sp-violet .sp-text').forEach(t=>{let k=0;t.querySelectorAll(':scope>p:not(.sp-num)').forEach(p=>{
  const walk=n=>{[...n.childNodes].forEach(c=>{if(c.nodeType===3){const f=document.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(w=>{if(!w)return;if(/^\s+$/.test(w)){f.appendChild(document.createTextNode(w));return;}const s=document.createElement('span');s.className='w';s.style.setProperty('--i',k++);s.textContent=w;f.appendChild(s);});c.replaceWith(f);}else if(c.nodeType===1)walk(c);});};
  walk(p);});});
}
const fifty=()=>`<div class="ve-fifty" aria-label="Fifty birthday letters">${Array.from({length:50},(_,k)=>`<i style="--k:${k}"><b>${k+1}</b></i>`).join('')}<p>One for every birthday. Fifty years.</p></div>`;

/* ---------------------------------------------------------------- Re:Zero: deaths and the doors */
function die(i){
 if(S.died[i]||cur!=='rezero')return;
 S.died[i]=Date.now();save();
 const c=SPACES.rezero.chapters[i],over=$d('#sp-over'),sc=$d('#sp-scroll');
 const back=()=>{const sec=$d(`[data-ch="${i}"]`);sc.scrollTo({top:sec.offsetTop-20,behavior:'auto'});const s=$d('#rz-save-'+i);if(s){s.textContent=`Save point · you remember: ${c.death}`;s.classList.add('now');}};
 if(motion.reduced){back();return;}
 over.innerHTML=`<div class="rz-death"><span class="rz-hands"><i></i><i></i><i></i><i></i><i></i><i></i></span><p class="rz-rbd">Return by Death</p><p class="rz-why">${esc(c.death)}</p></div>`;
 over.classList.add('on');sc.style.overflow='hidden';
 setTimeout(back,1900);
 setTimeout(()=>{over.classList.remove('on');sc.style.overflow='';},2500);
}
const doors=()=>`<div class="rz-doors"><p class="sp-eyebrow">Door Crossing</p><p class="rz-dq">Somewhere in the mansion, one door opens onto the Forbidden Library. Which one?</p><div class="rz-row">${Array.from({length:5},(_,k)=>`<button class="rz-door" data-door="${k}" aria-label="Door ${k+1}"><i></i></button>`).join('')}</div><p class="rz-dmsg" id="rz-dmsg"></p></div>`;
function door(d){
 const box=d.closest('.rz-doors');if(box.classList.contains('found'))return;
 S.door=(S.door||0)+1;save();
 // she hides behind a different door every time; the fourth try always finds her
 const right=S.door%4===0||Math.random()<0.2;
 const m=$d('#rz-dmsg');
 if(!right){d.classList.add('wrong');m.textContent=['Just a corridor. The doors have moved.','A broom cupboard. The doors have moved.','Ram\'s room. Close it, quickly.'][S.door%3];setTimeout(()=>box.querySelectorAll('.rz-door').forEach(x=>x.classList.remove('wrong')),900);return;}
 d.classList.add('right');box.classList.add('found');
 const b=(PINS.rezero.find(p=>p.who==='Beatrice')||{}).id;
 m.innerHTML=`So you found it, I suppose. ${b?`<span class="rz-betty">${img(b,'','300px')}</span>`:''}`;
 const c=SPACES.rezero.cards.find(x=>x.ch==='door'||x.id==='RZ-04');if(c)unlock('rezero',c);
}

/* ---------------------------------------------------------------- ORV: the scenario window */
const scenario=w=>`<div class="orv-win-s"><p class="orv-win-h">&lt;${esc(w.h)}&gt;</p><dl>${w.rows.map(([a,b])=>`<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')}</dl></div>`;

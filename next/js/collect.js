// Collect: one game instead of many. Packs of five pictures; every picture of the archive is a card with a fixed
// rarity (the same rarity it has in the classic Treasure Room, so nothing found there is lost). New cards raise the bounty.
import {$,$$,esc,data,S,ROOT,TH,FU,pool,collections,rarity,TIERS,RNAME,RWORTH,changed,onChange,title,nextTitle,money,pick,reduced,finish,TODAY} from './store.js';
import {openSheet,openViewer,rise,countUp,toast} from './ui.js';
import {questsHTML,claim,readyCount} from './quests.js';
import {FRUITS} from './fruitlist.js';

const byId=id=>pool().find(p=>p.id===id);
export const cardHTML=(p,{big=false,back=false,tag=''}={})=>{const r=rarity(p.id);return `<div class="cd r-${r}${big?' big':''}" data-card="${p.id}"><div class="cd-in"><div class="cd-f"><img src="${big?FU(p.id):TH(p.id)}" alt="" decoding="async"${big?'':' loading="lazy"'}><i class="cd-fx" aria-hidden="true"></i><span class="cd-l"><b>${esc(p.col)}</b><small>No. ${p.i} / ${p.of}</small></span><span class="cd-r">${RNAME[r]}</span>${tag?`<span class="cd-tag">${tag}</span>`:''}</div>${back?'<div class="cd-b" aria-hidden="true"><i></i><b>Grand Archive</b></div>':''}</div></div>`;};
const packHTML=(cls='')=>{const cov=pool().length?pool()[(S.opened*37)%pool().length].id:null;return `<span class="pack ${cls}">${cov?`<img src="${TH(cov)}" alt="">`:''}<i></i><b>Grand Archive</b><small>5 cards</small><u class="pack-top"></u></span>`;};

/* ------------------------------------------------------------------ rolling a pack */
function roll(){
 const P=pool(),out=[],no=S.opened+1,miss=P.filter(p=>!S.cards[p.id]&&rarity(p.id)!=='conq');
 while(out.length<5&&P.length){
  const from=miss.length&&Math.random()<.78?miss:P.filter(p=>rarity(p.id)!=='conq'),c=pick(from);
  if(!out.includes(c))out.push(c);
 }
 // his one-of-one Conqueror card only ever comes in pack No. 11 (or the first pack after it, if 11 is long gone)
 const conq=P.find(p=>rarity(p.id)==='conq');if(conq&&!S.cards[conq.id]&&no>=11)out[4]=conq;
 out.sort((a,b)=>TIERS.indexOf(rarity(b.id))-TIERS.indexOf(rarity(a.id)));
 let sum=0;const res=out.map(p=>{const isNew=!S.cards[p.id],gain=isNew?RWORTH[rarity(p.id)]:5e5;sum+=gain;if(isNew)S.cards[p.id]=Date.now();return {p,isNew,gain};});
 S.packs-=1;S.opened+=1;S.b+=sum;
 // some packs carry a Devil Fruit (the classic order: pack 1, 2, 3, 4, 6 ... Hana Hana last, in pack 30)
 const fruit=FRUITS.find(f=>f.at===S.opened&&!S.fruits.includes(f.id))||null;if(fruit)S.fruits.push(fruit.id);
 changed();finish('pack');
 return {res,sum,fruit};
}

/* ------------------------------------------------------------------ the ceremony */
export function openPack(){
 if(S.packs<=0){toast('No packs left','One arrives tomorrow. Games and the daily question give more.');return;}
 const el=document.createElement('div');el.className='rip';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
 el.innerHTML=`<button class="sh-x rip-x" aria-label="Close"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></button><p class="rip-word" aria-hidden="true"></p><div class="rip-stage"><button class="rip-pack" aria-label="Open the pack">${packHTML('big')}</button></div><p class="rip-hint">Tap the pack</p>`;
 document.body.appendChild(el);document.documentElement.classList.add('locked');requestAnimationFrame(()=>el.classList.add('in'));
 const stage=$('.rip-stage',el),hint=$('.rip-hint',el),word=$('.rip-word',el);let R=null,i=-1,busy=false,done=false;
 const close=()=>{el.classList.remove('in');el.classList.add('out');document.documentElement.classList.remove('locked');removeEventListener('keydown',key);setTimeout(()=>el.remove(),reduced()?0:300);};
 const key=e=>{if(e.key==='Escape')close();if(e.key===' '||e.key==='Enter'||e.key==='ArrowRight'){e.preventDefault();step();}};
 addEventListener('keydown',key);$('.rip-x',el).addEventListener('click',close);
 const wait=ms=>new Promise(r=>setTimeout(r,reduced()?0:ms));
 function flip(k){
  const c=stage.children[k],r=rarity(R.res[k].p.id);if(!c)return;
  c.classList.add('up');el.dataset.r=r;if(TIERS.indexOf(r)<=TIERS.indexOf('sr')){el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');}word.textContent=RNAME[r];word.classList.remove('in');void word.offsetWidth;word.classList.add('in');
  hint.textContent=k<4?'Tap for the next card':'Tap to finish';
 }
 async function step(){
  if(busy||done)return;busy=true;
  if(!R){
   R=roll();const pk=$('.rip-pack',el);pk.classList.add('open');hint.textContent='';await wait(620);
   stage.innerHTML=R.res.map(({p,isNew},k)=>`<div class="rip-c" style="--k:${k}">${cardHTML(p,{big:true,back:true,tag:isNew?'New':''})}</div>`).join('');
   await wait(520);i=0;flip(0);
  }else if(i<4){
   const c=stage.children[i];c.classList.add('gone');i++;await wait(160);flip(i);await wait(240);
  }else{
   done=true;stage.children[4].classList.add('gone');await wait(260);summary();
  }
  busy=false;
 }
 function summary(){
  el.classList.add('sum');delete el.dataset.r;word.textContent='';hint.textContent='';
  const fresh=R.res.filter(x=>x.isNew).length;
  stage.innerHTML=`<div class="rip-sum"><p class="eyebrow">Pack No. ${S.opened}</p><h2>${fresh?`${fresh} new card${fresh===1?'':'s'}.`:'All duplicates.'}</h2><p class="rip-gain">+฿${money(R.sum)} on your bounty</p>
   ${R.fruit?`<button class="rip-fruit press" data-fruit="${R.fruit.id}" style="--h1:${R.fruit.hue};--h2:${R.fruit.hue2}"><i class="orb"><b>${R.fruit.kana.slice(0,2)}</b></i><span><small>A Devil Fruit was inside</small><b>${esc(R.fruit.name)}</b><em>The power of ${esc(R.fruit.user)}</em></span></button>`:''}
   <div class="rip-row">${R.res.map(({p,isNew},k)=>`<button class="rip-s press" style="--k:${k}" data-card-open="${p.id}">${cardHTML(p,{tag:isNew?'New':'Duplicate'})}</button>`).join('')}</div>
   <div class="row-btns center">${S.packs>0?`<button class="btn" id="rip-again">Open another · ${S.packs} left</button>`:''}<button class="btn ghost" id="rip-done">Done</button></div></div>`;
 }
 el.addEventListener('click',e=>{
  if(e.target.closest('.rip-x'))return;
  if(e.target.closest('#rip-done')){close();return;}
  if(e.target.closest('#rip-again')){close();setTimeout(openPack,reduced()?0:320);return;}
  const co=e.target.closest('[data-card-open]');if(co){openCard(co.dataset.cardOpen,co);return;}
  const fr=e.target.closest('[data-fruit]');if(fr){openFruit(fr.dataset.fruit,fr);return;}
  if(!done)step();
 });
 let x0=null;el.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;},{passive:true});
}

/* ------------------------------------------------------------------ a card, up close */
export function openCard(id,from){
 const p=byId(id);if(!p)return;const r=rarity(id),when=S.cards[id];
 openSheet(`<div class="card-sheet"><div class="cs-card sh-hero">${cardHTML(p,{big:true})}</div><div class="cs-txt"><p class="eyebrow r-t-${r}">${RNAME[r]}</p><h2 class="sh-title">${esc(p.col)}</h2><p class="sh-sub">No. ${p.i} of ${p.of}</p>
 <dl class="facts"><div><dt>Found</dt><dd>${when?new Date(when).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'Not yet'}</dd></div><div><dt>Worth</dt><dd>฿${money(RWORTH[r])}</dd></div></dl>
 <div class="row-btns"><button class="btn" data-open="pic:${id}">See the picture</button><button class="btn ghost" data-open="gallery:${esc(p.col)}">The collection</button></div></div></div>`,{from,onOpen(el){tilt(el.querySelector('.cs-card'),r);}});
}
// held up close, a card leans toward your finger or the mouse, and light slides across it
function tilt(box,r){
 const cd=box?.querySelector('.cd');if(!cd||reduced())return;
 if(r!=='c')cd.classList.add('shine');
 const move=e=>{const b=box.getBoundingClientRect(),x=(e.clientX-b.left)/b.width,y=(e.clientY-b.top)/b.height;cd.classList.add('live');cd.style.setProperty('--ry',((x-.5)*22).toFixed(2)+'deg');cd.style.setProperty('--rx',((.5-y)*18).toFixed(2)+'deg');cd.style.setProperty('--mx',(x*100).toFixed(1)+'%');cd.style.setProperty('--my',(y*100).toFixed(1)+'%');};
 const rest=()=>{cd.classList.remove('live');cd.style.setProperty('--ry','0deg');cd.style.setProperty('--rx','0deg');};
 box.addEventListener('pointermove',move);box.addEventListener('pointerleave',rest);box.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')rest();});box.addEventListener('pointercancel',rest);
}
/* ------------------------------------------------------------------ Devil Fruits */
const orb=(f,own)=>`<i class="orb${own?'':' off'}"><b>${own?f.kana.slice(0,2):'?'}</b></i>`;
export async function openFruit(id,from){
 const f=FRUITS.find(x=>x.id===id);if(!f||!S.fruits.includes(id))return;
 const {fruitSVG}=await import('./eatfx.js'),eaten=S.eat===id;
 openSheet(`<div class="fruit-sheet" style="--h1:${f.hue};--h2:${f.hue2}"><div class="fs-pic sh-hero">${fruitSVG(f.hue,f.hue2,'s'+id)}</div><div class="fs-txt"><p class="eyebrow" style="color:${f.hue}">The power of ${esc(f.user)}</p><h2 class="sh-title">${esc(f.name)}</h2><p class="fs-kana">${f.kana}</p><p class="prose"><span>${esc(f.power)}</span></p>
 <p class="fine">In the app a power answers a press and hold, anywhere on a screen. One fruit at a time: eating another replaces this one.</p>
 <div class="row-btns">${eaten?'<button class="btn ghost" data-spit>Spit it out</button>':`<button class="btn" data-eat="${id}">Eat it</button>`}</div></div></div>`,{from,onOpen(el,layer){
  el.addEventListener('click',async e=>{
   if(e.target.closest('[data-eat]')){layer.close();const m=await import('./fruits.js');setTimeout(()=>m.eat(id,{fromRoom:true}),reduced()?0:360);}
   if(e.target.closest('[data-spit]')){layer.close();(await import('./fruits.js')).spit();}
  });
 }});
}
document.addEventListener('ga:fruit',()=>{if(S.eat)openFruit(S.eat,document.querySelector('.df-badge'));});
function openBinder(name,from){
 const col=collections().find(c=>c.name===name);if(!col)return;const got=col.cards.filter(p=>S.cards[p.id]).length;
 openSheet(`<header class="sh-head"><p class="eyebrow">Binder</p><h2 class="sh-title">${esc(name)}</h2><p class="sh-sub">${got} of ${col.cards.length} found</p><div class="bar"><i style="--p:${got/col.cards.length}"></i></div></header>
 <div class="bd-grid">${col.cards.map(p=>S.cards[p.id]?`<button class="press" data-card-open="${p.id}">${cardHTML(p)}</button>`:`<div class="bd-slot"><span>${p.i}</span></div>`).join('')}</div>`,{from,cls:'wide',onOpen(el){el.addEventListener('click',e=>{const c=e.target.closest('[data-card-open]');if(c)openCard(c.dataset.cardOpen,c);});}});
}
export function openTcg(id,from){
 const c=data.tcg.cards.find(x=>x.id===id);if(!c)return;
 openSheet(`<div class="card-sheet tcg"><div class="cs-card sh-hero"><img class="tcg-img" src="${ROOT}assets/tcg/${c.id}.webp" alt="${esc(c.name)}"></div><div class="cs-txt"><p class="eyebrow">${esc(c.rarity||'')} · ${esc(c.no||c.id)}</p><h2 class="sh-title">${esc(c.name)}</h2><p class="sh-sub">${esc(c.set||'')}</p>
 <dl class="facts">${c.kind?`<div><dt>Kind</dt><dd>${esc(c.kind)}</dd></div>`:''}${c.cost!=null&&c.cost!=='None'?`<div><dt>Cost</dt><dd>${esc(c.cost)}</dd></div>`:''}${c.power&&c.power!=='None'?`<div><dt>Power</dt><dd>${esc(c.power)}</dd></div>`:''}${(c.colors||[]).length?`<div><dt>Colour</dt><dd>${esc(c.colors.join(' / '))}</dd></div>`:''}</dl>
 ${c.effect&&c.effect!=='None'?`<p class="prose"><span>${esc(c.effect)}</span></p>`:''}</div></div>`,{from});
}

/* ------------------------------------------------------------------ the screen */
export function renderCollect(root){
 // a fruit whose pack number has already gone by is handed over (packs opened before the fruits arrived)
 const owed=FRUITS.filter(f=>f.at<=S.opened&&!S.fruits.includes(f.id));if(owed.length){owed.forEach(f=>S.fruits.push(f.id));changed();setTimeout(()=>toast(owed.length===1?owed[0].name:`${owed.length} Devil Fruits`,'Waiting for you in Collect'),1600);}
 const draw=()=>{
  const P=pool(),got=P.filter(p=>S.cards[p.id]),t=title(),nx=nextTitle(),cols=collections().map(c=>({...c,got:c.cards.filter(p=>S.cards[p.id]).length})).sort((a,b)=>b.got/b.cards.length-a.got/a.cards.length||b.cards.length-a.cards.length);
  const best=got.slice().sort((a,b)=>TIERS.indexOf(rarity(a.id))-TIERS.indexOf(rarity(b.id))||S.cards[b.id]-S.cards[a.id]).slice(0,10);
  const tcg=data.tcg?.cards||[];
  root.innerHTML=`
  <header class="lt"><p class="lt-date">${got.length.toLocaleString('en-US')} of ${P.length.toLocaleString('en-US')} cards found</p><h1 class="lt-title">Collect</h1></header>
  <section class="bounty" data-rise><p class="eyebrow">Your bounty</p><p class="bn-n" id="bn-n">฿${money(S.b)}</p><p class="bn-t">${esc(t[1])}</p>${nx?`<div class="bar"><i style="--p:${Math.min(1,(S.b-t[0])/(nx[0]-t[0]))}"></i></div><p class="fine">฿${money(nx[0]-S.b)} to ${esc(nx[1])}</p>`:''}</section>
  <section class="packs" data-rise><button class="pk-stage press" data-open="pack" aria-label="Open a pack">${packHTML('big')}${S.packs>1?packHTML('big behind'):''}</button>
   <div class="pk-side"><h2>${S.packs>0?`${S.packs} pack${S.packs===1?'':'s'} <span>waiting.</span>`:'No packs <span>right now.</span>'}</h2><p>Five pictures from the archive in every pack. New ones raise your bounty.</p>
   <button class="btn" data-open="pack"${S.packs>0?'':' disabled'}>Open a pack</button>
   <ul class="earn"><li><b>Every day</b><span>one pack, just for showing up</span></li><li><b>Question of the day</b><span>a right answer</span></li><li><b>Finish today’s edition</b><span>all six parts</span></li><li><b>Games</b><span>the first win of the day in each</span></li></ul></div></section>
  <section class="row"><div class="row-head" data-rise><h2>Quests. <span>The long games.</span></h2></div>${questsHTML()}</section>
  <section class="row"><div class="row-head" data-rise><h2>Devil Fruits. <span>One at a time.</span></h2><p>${S.fruits.length} of ${FRUITS.length}</p></div>
   <div class="rail-wrap"><div class="rail fruits">${FRUITS.map(f=>{const own=S.fruits.includes(f.id);return `<button class="fr press${own?'':' off'}${S.eat===f.id?' eaten':''}" ${own?`data-fruit="${f.id}"`:'disabled'} style="--h1:${f.hue};--h2:${f.hue2}">${orb(f,own)}<b>${own?esc(f.name.replace(' no Mi','')):'Not found'}</b><small>${own?(S.eat===f.id?'Eaten':esc(f.user)):`Pack No. ${f.at}`}</small></button>`;}).join('')}</div><button class="rail-btn prev" aria-label="Scroll back" data-rail="-1">‹</button><button class="rail-btn next" aria-label="Scroll on" data-rail="1">›</button></div></section>
  ${best.length?`<section class="row"><div class="row-head" data-rise><h2>Rarest finds. <span>Your best ten.</span></h2></div><div class="rail-wrap"><div class="rail cards">${best.map(p=>`<button class="press" data-card-open="${p.id}">${cardHTML(p)}</button>`).join('')}</div></div></section>`:''}
  <section class="row"><div class="row-head" data-rise><h2>The binder. <span>Every collection.</span></h2></div>
   <div class="bd-list">${cols.map(c=>`<button class="bd press" data-binder="${esc(c.name)}" data-rise><img src="${TH(c.cards[0].id)}" alt="" loading="lazy"><span><b>${esc(c.name)}</b><small>${c.got} / ${c.cards.length}</small><span class="bar"><i style="--p:${c.got/c.cards.length}"></i></span></span></button>`).join('')}</div></section>
  ${tcg.length?`<section class="row"><div class="row-head" data-rise><h2>The real ones. <span>My One Piece cards.</span></h2><p>${tcg.length} cards</p></div><div class="rail-wrap"><div class="rail tcgs">${tcg.map(c=>`<button class="tcg-c press" data-tcg="${esc(c.id)}"><img src="${ROOT}assets/tcg/s/${c.id}.webp" alt="${esc(c.name)}" loading="lazy" decoding="async"></button>`).join('')}</div><button class="rail-btn prev" aria-label="Scroll back" data-rail="-1">‹</button><button class="rail-btn next" aria-label="Scroll on" data-rail="1">›</button></div></section>`:''}`;
  rise(root);
 };
 const sig=()=>JSON.stringify([S.packs,S.opened,Object.keys(S.cards).length,Object.keys(S.q).length,Object.keys(S.seen).length,Object.keys(S.likes).length,S.fullDays,S.streak.n,S.best,readyCount(),S.fruits.length,S.eat]);
 draw();let last=sig();
 onChange(()=>{const now=sig();if(now!==last){last=now;draw();}else{const n=$('#bn-n',root);if(n)n.textContent='฿'+money(S.b);}});
 root.addEventListener('click',e=>{
  const c=e.target.closest('[data-card-open]');if(c){openCard(c.dataset.cardOpen,c);return;}
  const cl=e.target.closest('[data-claim]');if(cl){claim(cl.dataset.claim,toast);return;}
  const fr=e.target.closest('[data-fruit]');if(fr){openFruit(fr.dataset.fruit,fr);return;}
  const b=e.target.closest('[data-binder]');if(b){openBinder(b.dataset.binder,b);return;}
  const t=e.target.closest('[data-tcg]');if(t){openTcg(t.dataset.tcg,t);return;}
  const rb=e.target.closest('[data-rail]');if(rb){const r=rb.parentNode.querySelector('.rail');r.scrollBy({left:+rb.dataset.rail*r.clientWidth*.82,behavior:'smooth'});}
 });
}
export const onShowCollect=root=>{const n=$('#bn-n',root);if(n)countUp(n,S.b,{from:S.b*.92,prefix:'฿',ms:900});};

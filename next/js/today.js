// Today: a new edition every day. The date decides what is dealt (the same day always shows the same edition),
// so it is worth coming back tomorrow: a picture, a character, one of his lines, a moment, a question, a pack.
import {$,$$,esc,data,S,TH,FU,TODAY,dayKey,rng,pick,shuffle,pool,poster,day,finish,givePack,earn,PARTS,onChange,rarity,RNAME} from './store.js';
import {rise,openSheet} from './ui.js';
import {charImg,momentArt} from './stories.js';

const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const dayNo=k=>Math.round((new Date(k+'T12:00:00')-new Date('2026-01-01T12:00:00'))/864e5);
export function edition(key=TODAY){
 const r=rng('ga:'+key),n=dayNo(key),m=data.media;
 // the picture: an upright one, so it fills the tall card
 const tall=pool().filter(p=>{const [w,h]=m.img[p.id];return h/w>1.15&&h/w<1.9&&Math.min(w,h)>=700;});
 const picture=pick(tall.length?tall:pool(),r);
 const C=data.characters.characters,character=C[((n*7)%C.length+C.length)%C.length];
 const said=[...data.shelf.anime,...data.shelf.manga,...data.shelf.tv].filter(a=>a.tagline&&a.tagline.length>12);
 const words=pick(said,r);
 const M=data.route.moments,moment=M[((n*5)%M.length+M.length)%M.length];
 const Q=data.trivia.levels.flatMap(l=>l.qs.map(q=>({...q,level:l.name}))),question=pick(Q,r);
 return {picture,character,words,moment,mi:M.indexOf(moment),question,answers:shuffle([question.a,...question.w],r)};
}
let E=null;
const tick=p=>`<span class="tick${day().done[p]?' on':''}" data-tick="${p}" aria-hidden="true"><svg viewBox="0 0 24 24" width="12" height="12"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
function questionHTML(){
 const d=day(),q=E.question,ans=d.answer;
 return `<p class="eyebrow">Question of the day · ${esc(q.level)}</p><h3 class="q-t">${esc(q.q)}</h3>
 <div class="q-as">${E.answers.map(a=>`<button class="q-a press${ans?(a===q.a?' right':a===ans?' wrong':' off'):''}" data-answer="${esc(a)}"${ans?' disabled':''}>${esc(a)}</button>`).join('')}</div>
 <p class="q-note">${ans?`${ans===q.a?'Right.':'Not this time.'} ${esc(q.note||'')}`:'One try. A right answer is worth a pack.'}</p>${tick('question')}`;
}
function endHTML(){
 const d=day(),n=PARTS.filter(p=>d.done[p]).length,all=n===PARTS.length;
 return `<div class="ring" style="--p:${n/PARTS.length}"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27"/><circle class="v" cx="32" cy="32" r="27" pathLength="1"/></svg><b>${n}<small>/${PARTS.length}</small></b></div>
 <div><h3>${all?'That’s today.':'Today, so far.'}</h3><p>${all?'Everything in this edition is done. The bonus pack is yours.':'Finish all six and a bonus pack is yours.'}</p><p class="next-in">The next edition arrives in <b id="next-in">--:--:--</b></p></div>`;
}
export function renderToday(root){
 E=edition();const d=new Date(),{picture:p,character:c,words:w,moment:m}=E,art=momentArt(m)[0],wp=poster(w.k,w.t),r=rarity(p.id);
 root.innerHTML=`
 <header class="lt"><p class="lt-date">${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}</p><h1 class="lt-title">Today</h1><button class="streak press" data-open="tab:me" aria-label="Day streak"><b>${S.streak.n}</b><span>day${S.streak.n===1?'':'s'} in a row</span></button></header>
 <div class="tg">
  <button class="card c-pic press" data-part="picture" data-open="today:picture" data-rise><img src="${FU(p.id)}" alt="" decoding="async" fetchpriority="high"><span class="card-t"><span class="eyebrow">Picture of the day</span><b>${esc(p.col)}</b><small>No. ${p.i} of ${p.of} · ${RNAME[r]} card</small></span>${tick('picture')}</button>
  <button class="card c-char press" data-part="character" data-open="char:${c.id}" data-rise style="--c:${c.image.color}"><img src="${charImg(c)}" alt="" loading="lazy" decoding="async"><span class="card-t"><span class="eyebrow">Character of the day</span><b>${esc(c.name)}</b><small>${c.word?`Left behind: ${esc(c.word)}`:esc(c.series)}</small></span>${tick('character')}</button>
  <button class="card c-words press" data-part="words" data-open="record:${w.k}:${esc(w.t)}" data-rise${wp?.color?` style="--c:${wp.color}"`:''}><span class="eyebrow">In my words</span><span class="say">“${esc(w.tagline)}”</span><span class="say-of">${wp?`<img src="${wp.img}" alt="" loading="lazy" decoding="async">`:''}<span><b>${esc(w.t)}</b><small>${w.s?`${esc(String(w.s).replace('*',''))} / 10`:''}</small></span></span>${tick('words')}</button>
  <button class="card c-mo press" data-part="moment" data-open="moment:${E.mi}" data-rise>${art?`<img src="${art}" alt="" loading="lazy" decoding="async">`:''}<span class="card-t"><span class="eyebrow">A moment that lives in my head</span><b>${esc(m.title)}</b><small>${esc(m.series)} · ${esc(m.emotion||'')}</small></span>${tick('moment')}</button>
  <div class="card c-q" id="c-q" data-rise>${questionHTML()}</div>
  <button class="card c-pack press" data-open="pack" data-rise><span class="pk-art"><span class="pack sm"><img src="${TH(p.id)}" alt=""><i></i><b>Grand Archive</b></span></span><span class="pk-t"><span class="eyebrow">Your packs</span><b id="pk-n"></b><small>Five pictures from the archive in each. One arrives every day.</small></span>${tick('pack')}</button>
 </div>
 <div class="today-end" id="today-end" data-rise>${endHTML()}</div>
 <section class="row"><div class="row-head" data-rise><h2>Earlier. <span>The last six editions.</span></h2></div>
  <div class="rail-wrap"><div class="rail">${past().map(x=>`<button class="pc col press" data-open="edition:${x.key}"><img src="${TH(x.e.picture.id)}" alt="" loading="lazy" decoding="async"><span class="pc-t"><b>${x.label}</b><small>${esc(x.e.character.name)} · ${esc(x.e.picture.col)}</small></span></button>`).join('')}</div></div></section>`;
 const sync=()=>{const n=$('#pk-n',root);if(n)n.textContent=S.packs>0?`${S.packs} pack${S.packs===1?'':'s'} waiting`:'No packs left today';
  $$('[data-tick]',root).forEach(t=>t.classList.toggle('on',!!day().done[t.dataset.tick]));const e=$('#today-end',root);if(e){const n2=String(PARTS.filter(x=>day().done[x]).length);if(e.dataset.n!==n2){e.dataset.n=n2;e.innerHTML=endHTML();cd();}}};
 // the countdown to midnight
 const cd=()=>{const el=document.getElementById('next-in');if(!el)return;const n=new Date(),t=new Date(n);t.setHours(24,0,0,0);const s=Math.max(0,Math.floor((t-n)/1000)),f=x=>String(x).padStart(2,'0');el.textContent=`${f(Math.floor(s/3600))}:${f(Math.floor(s/60)%60)}:${f(s%60)}`;};
 sync();onChange(sync);cd();setInterval(cd,1000);
 root.addEventListener('click',e=>{
  const a=e.target.closest('[data-answer]');if(!a||day().answer)return;
  const d2=day(),q=E.question;d2.answer=a.dataset.answer;finish('question');
  if(d2.answer===q.a){givePack(1,'Question of the day');earn(2e6,'Right answer');}
  $('#c-q',root).innerHTML=questionHTML();
 });
 rise(root);
}
// the six days before today, newest first
function past(){return Array.from({length:6},(_,i)=>{const d=new Date(TODAY+'T12:00:00');d.setDate(d.getDate()-i-1);const key=dayKey(d);return {key,e:edition(key),label:i?`${DAYS[d.getDay()]}`:'Yesterday',date:`${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`};});}
// an earlier edition, to look back at (nothing to earn there)
export function openEdition(key,from){
 const x=past().find(p=>p.key===key);if(!x)return;const e=x.e,art=momentArt(e.moment)[0],wp=poster(e.words.k,e.words.t);
 const row=(img,k,t,s,open)=>`<button class="sr press" data-open="${esc(open)}">${img?`<img src="${img}" alt="" loading="lazy">`:'<i></i>'}<span><small>${k}</small><b>${esc(t)}</b>${s?`<small>${esc(s)}</small>`:''}</span></button>`;
 openSheet(`<header class="sh-head"><p class="eyebrow">An earlier edition</p><h2 class="sh-title">${x.date}</h2></header><div class="ed-rows">
  ${row(TH(e.picture.id),'Picture of the day',e.picture.col,`No. ${e.picture.i} of ${e.picture.of}`,`pic:${e.picture.id}`)}
  ${row(charImg(e.character),'Character of the day',e.character.name,e.character.word?`Left behind: ${e.character.word}`:e.character.series,`char:${e.character.id}`)}
  ${row(wp?.img,'In my words',`“${e.words.tagline}”`,e.words.t,`record:${e.words.k}:${e.words.t}`)}
  ${row(art,'A moment that lives in my head',e.moment.title,e.moment.series,`moment:${e.mi}`)}
 </div>`,{from});
}
// the picture of the day, opened
export function openPicture(from){
 const p=E.picture,ids=pool().filter(x=>x.col===p.col).map(x=>x.id),more=ids.filter(id=>id!==p.id).slice(0,8),found=!!S.cards[p.id];
 openSheet(`<div class="pic-sheet"><div class="sh-hero ps-pic"><img src="${FU(p.id)}" alt=""></div><div class="ps-txt"><p class="eyebrow">Picture of the day</p><h2 class="sh-title">${esc(p.col)}</h2><p class="sh-sub">No. ${p.i} of ${p.of} · ${RNAME[rarity(p.id)]} card · ${found?'in your binder':'not found in a pack yet'}</p>
 <div class="row-btns"><button class="btn" data-open="pic:${p.id}">Full screen</button><button class="btn ghost" data-open="gallery:${esc(p.col)}">All ${ids.length} of ${esc(p.col)}</button></div>
 ${more.length?`<p class="eyebrow more">More of ${esc(p.col)}</p><div class="ps-more">${more.map(id=>`<button class="press" data-open="pic:${id}"><img src="${TH(id)}" alt="" loading="lazy"></button>`).join('')}</div>`:''}</div></div>`,{from,cls:'wide'});
}

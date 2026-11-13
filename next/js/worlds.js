// Worlds (Nov 2026). He asked for Grand Archive to be his daily app, not only anime: his other two sites live here
// as worlds of their own, each with its own colour, and Today takes something from each.
//   Anime      the archive as it was (stories.js)
//   Mysteries  his "Rabbit Hole Archive" (data/mysteries.json, copied from Desktop/Mysteries): 25 case files
//   Behold     his site on the life of Jesus (data/behold.json, converted from Desktop/Gospel/js/*-data.js)
// Every word of the case files and of Behold is his sites' own text; only labels and buttons are written here.
// Class prefixes: ws (the switch), cf (case files), bh (Behold).
import {$,$$,esc,data,S,TODAY,rng,pick,changed,see,earn,givePack,reduced} from './store.js';
import {openSheet,rise} from './ui.js';
import {renderStories} from './stories.js';

export const WORLDS=[['anime','Anime'],['mysteries','Mysteries'],['behold','Behold']];
const fmt=t=>esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\*(.+?)\*/g,'<em>$1</em>');
const plain=t=>String(t).replace(/\*+/g,'');
// Wikimedia pictures at a sensible size (the sites link the originals, which can be 4000px wide)
const WM=/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/([0-9a-f]\/[0-9a-f]{2})\/([^/]+\.(?:jpe?g|png))$/i;
export const wm=(src,w=500)=>{const m=WM.exec(src||'');return m?`${m[1]}/thumb/${m[2]}/${m[3]}/${w}px-${m[3]}`:(src||'');};
const dayN=()=>Math.round((new Date(TODAY+'T12:00:00')-new Date('2026-01-01T12:00:00'))/864e5);

/* ================================================================== Mysteries */
const cases=()=>data.mysteries?.stories||[];
const VERD={debunked:['Debunked','#ff6b57'],unproven:['Unproven','#f3c969'],unsolved:['Unsolved','#6cc3ff'],true:['Actually true','#30d158']};
const CATS=[['conspiracy-theories','Conspiracy theories','Big claims about hidden plots, checked against the evidence.'],['unsolved-mysteries','Unsolved mysteries','Real cases with real clues and no final answer yet.'],['hidden-history','Hidden history','True events so strange they sound invented.'],['strange-places','Strange places','Spooky seas, odd lakes and places with a reputation.']];
const catName=id=>(CATS.find(c=>c[0]===id)||[,''])[1];
const stamp=c=>{const v=VERD[c.verdict]||[c.verdict,'#aaa'];return `<span class="cf-stamp" style="--v:${v[1]}">${esc(v[0])}</span>`;};
const holes=c=>`<span class="cf-holes" aria-label="Rabbit hole level ${c.rabbitHoleLevel} of 5">${[1,2,3,4,5].map(i=>`<i class="${i<=c.rabbitHoleLevel?'on':''}"></i>`).join('')}</span>`;
const caseCard=(c,cls='')=>`<button class="cf press ${cls}" data-open="case:${c.id}"><img src="${wm(c.hero?.src,cls?1280:500)}" alt="" loading="lazy" decoding="async"><span class="cf-t">${stamp(c)}<b>${fmt(c.title)}</b><small>${esc(c.year||'')} · ${esc(c.readMinutes)} min${S.seen['case:'+c.id]?' · read':''}</small></span></button>`;
export const caseOfDay=()=>{const L=cases();return L.length?L[((dayN()*11)%L.length+L.length)%L.length]:null;};

function renderMysteries(root){
 const L=cases(),people=L.reduce((n,c)=>n+(c.people||[]).length,0),cd=caseOfDay();
 if(!L.length){root.innerHTML='<p class="fine" style="padding:60px 0">The case files did not load. Pull down to try again.</p>';return;}
 root.innerHTML=`
 <header class="lt"><p class="lt-date">${L.length} case files · ${people} people · sorted by what we actually know</p><h1 class="lt-title">Mysteries</h1></header>
 <section class="row" style="margin-top:8px"><div class="row-head" data-rise><h2>Case of the day. <span>${esc(catName(cd.category))}.</span></h2></div>
  <div data-rise>${caseCard(cd,'big')}</div><p class="cf-hook" data-rise>${fmt(cd.hook)}</p></section>
 ${CATS.map(([id,name,blurb])=>{const list=L.filter(c=>c.category===id);return list.length?`<section class="row"><div class="row-head" data-rise><h2>${name}. <span>${esc(blurb)}</span></h2><p>${list.length} files</p></div>
  <div class="rail-wrap"><div class="rail">${list.map(c=>caseCard(c)).join('')}</div><button class="rail-btn prev" aria-label="Scroll back" data-rail="-1">‹</button><button class="rail-btn next" aria-label="Scroll on" data-rail="1">›</button></div></section>`:'';}).join('')}
 <section class="row"><div class="row-head" data-rise><h2>Four verdicts. <span>Every file carries one.</span></h2></div>
  <div class="cf-verds" data-rise>${Object.entries(VERD).map(([k,[n,col]])=>`<div style="--v:${col}"><b>${L.filter(c=>c.verdict===k).length}</b><span>${n}</span></div>`).join('')}</div></section>
 <section class="row"><div class="row-head" data-rise><h2>The whole archive.</h2></div>
  <div class="links" data-rise><a class="lk press" href="https://gomayoha.github.io/Mysteries/" target="_blank" rel="noopener"><b>The Rabbit Hole Archive</b><span>The full site: the wall, the Who's Who, your clearance card</span></a><a class="lk press" href="https://gomayoha.github.io/Mysteries/people.html" target="_blank" rel="noopener"><b>Who's Who</b><span>Every person in every file</span></a></div></section>`;
 rise(root);
}
export function openCase(id,from){
 const c=cases().find(x=>x.id===id);if(!c)return;see('case:'+id);
 const list=(arr,cls='')=>`<ul class="cf-list ${cls}">${(arr||[]).map(t=>`<li>${fmt(t)}</li>`).join('')}</ul>`;
 openSheet(`<article class="cfa"><div class="cfa-hero sh-hero"><img src="${wm(c.hero?.src,1280)}" alt=""></div>
  <div class="cfa-in"><p class="eyebrow">Case No. ${esc(c.caseNo)} · ${esc(catName(c.category))}${c.year?` · ${esc(c.year)}`:''}</p><h2 class="sh-title">${fmt(c.title)}</h2>
  <p class="cfa-v">${stamp(c)}${holes(c)}<small>${esc(c.location?.name||'')}</small></p><p class="cfa-note">${fmt(c.verdictNote||'')}</p>
  <p class="cfa-hook">${fmt(c.hook)}</p><div class="prose">${(c.story||[]).map(p=>`<p>${fmt(p)}</p>`).join('')}</div>
  ${(c.gallery||[]).length?`<div class="cfa-gal">${c.gallery.map(g=>`<figure><img src="${wm(g.src,960)}" alt="" loading="lazy"><figcaption>${fmt(g.caption||g.credit||'')}</figcaption></figure>`).join('')}</div>`:''}
  ${(c.timeline||[]).length?`<h3>The timeline</h3><ol class="cfa-time">${c.timeline.map(t=>`<li><time>${esc(t.dateLabel||t.date||'')}</time><b>${fmt(t.label||'')}</b><span>${fmt(t.detail||'')}</span></li>`).join('')}</ol>`:''}
  <div class="cfa-two"><div><h3>What we know</h3>${list(c.known,'known')}</div><div><h3>What is speculation</h3>${list(c.speculation,'spec')}</div></div>
  ${(c.whyPeopleWonder||[]).length?`<h3>Why people wonder</h3>${list(c.whyPeopleWonder)}`:''}
  ${c.funFact?.text?`<p class="cfa-fact"><b>Strange but true</b>${fmt(c.funFact.text)}</p>`:''}
  ${(c.people||[]).length?`<h3>Persons of interest</h3><div class="cfa-people">${c.people.map(p=>`<details><summary>${p.photo?.src?`<img src="${wm(p.photo.src,250)}" alt="" loading="lazy">`:'<i></i>'}<span><b>${esc(p.name)}</b><small>${esc(p.tag||p.role||'')}</small></span></summary><p>${p.life?`<em>${esc(p.life)}</em> `:''}${fmt(p.summary||p.status||'')}</p></details>`).join('')}</div>`:''}
  ${(c.quiz||[]).length?`<h3>Close the file</h3><div class="cfa-quiz" id="cfa-quiz">${c.quiz.map((q,i)=>`<div class="cfa-q" data-q="${i}"><p>${fmt(q.q)}</p><div class="q-as">${q.options.map((o,k)=>`<button class="q-a press" data-opt="${k}">${fmt(o)}</button>`).join('')}</div><p class="q-note"></p></div>`).join('')}<p class="fine" id="cfa-done">${S.seen['solved:'+id]?'You have closed this file.':'Three right answers close the file and pay a pack.'}</p></div>`:''}
  ${c.depthNote?`<p class="cfa-depth"><b>How deep does it go?</b> ${fmt(c.depthNote)}</p>`:''}
  ${(c.sources||[]).length?`<h3>Sources</h3><ul class="cfa-src">${c.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a><small>${esc(s.publisher||'')}</small></li>`).join('')}</ul>`:''}
  ${(c.related||[]).length?`<h3>Further down the hole</h3><div class="row-btns">${c.related.map(r=>{const x=cases().find(y=>y.id===r);return x?`<button class="btn ghost" data-open="case:${x.id}">${esc(plain(x.title))}</button>`:'';}).join('')}</div>`:''}
  </div></article>`,{from,cls:'wide',onOpen(el){
   let right=0,done=0;const N=(c.quiz||[]).length;
   el.addEventListener('click',e=>{const b=e.target.closest('[data-opt]');if(!b)return;const box=b.closest('.cfa-q');if(box.dataset.done)return;box.dataset.done=1;
    const q=c.quiz[+box.dataset.q],ok=+b.dataset.opt===q.answer;if(ok)right++;done++;
    $$('[data-opt]',box).forEach(x=>{x.disabled=true;x.classList.add(+x.dataset.opt===q.answer?'right':x===b?'wrong':'off');});box.querySelector('.q-note').innerHTML=fmt(q.explain||q.why||'');
    if(done===N){const d=$('#cfa-done',el);if(right===N){if(!S.seen['solved:'+id]){S.seen['solved:'+id]=Date.now();changed();givePack(1,'Case closed');earn(2e6,'Case closed');}d.textContent='File closed. All three right.';}else d.textContent=`${right} of ${N}. Open the file again to try once more.`;}
   });
  }});
}

/* ================================================================== Behold */
const B=()=>data.behold||{};
const art=(k,w=500)=>{const a=B().ART?.[k];return a?{...a,img:wm(a.src,w)||a.src}:null;};
const weekday=()=>['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
export const verseOfDay=()=>{const V=B().VERSES||[];return V.length?V[((dayN()*5)%V.length+V.length)%V.length]:null;};
export const saintOfDay=()=>{const L=B().SAINTS||[];return L.length?L[((dayN()*3)%L.length+L.length)%L.length]:null;};
const TYPE={healing:'#7dd3a8',miracle:'#e9c46a',encounter:'#9ec5ff',teaching:'#d6b4ff'};
const pcard=(open,img,small,name,em,pos)=>`<button class="pc press" data-open="${open}">${img?`<img src="${img}" alt="" loading="lazy" decoding="async"${pos?` style="object-position:${pos}"`:''}>`:''}<span class="pc-t"><small>${esc(small||'')}</small><b>${esc(name)}</b>${em?`<em>${esc(em)}</em>`:''}</span></button>`;
const rail=inner=>`<div class="rail-wrap"><div class="rail">${inner}</div><button class="rail-btn prev" aria-label="Scroll back" data-rail="-1">‹</button><button class="rail-btn next" aria-label="Scroll on" data-rail="1">›</button></div>`;

function renderBehold(root){
 const b=B();if(!b.ENCOUNTERS){root.innerHTML='<p class="fine" style="padding:60px 0">Behold did not load. Pull down to try again.</p>';return;}
 const v=verseOfDay(),s=saintOfDay(),sp=art(s.portrait,960),my=Object.values(b.MYSTERIES||{}).find(m=>m.days.includes(weekday()));
 root.innerHTML=`
 <header class="lt"><p class="lt-date">${esc(b.SITE?.tagline||'')}</p><h1 class="lt-title">Behold</h1></header>
 <section class="bh-verse" data-rise data-open="bh:verse"><p class="eyebrow">Verse of the day</p><blockquote>${esc(v.t)}</blockquote><cite>${esc(v.r)}</cite></section>
 <section class="row"><div class="row-head" data-rise><h2>Saint of the day. <span>${esc(s.title||'')}</span></h2></div>
  <button class="bh-saint press" data-open="saint:${s.id}" data-rise style="--c:${s.color||'#d8b56a'}">${sp?`<img src="${sp.img}" alt="" loading="lazy" decoding="async" style="object-position:${s.pos||'50% 20%'}">`:''}<span><small>${esc(s.feast?`Feast: ${s.feast}`:'')}</small><b>${esc(s.full||s.name)}</b><em>One thing to do today</em><i>${esc(s.practice||'')}</i></span></button></section>
 <section class="row"><div class="row-head" data-rise><h2>The Story. <span>Every person He met, in nine acts.</span></h2><p>${b.ENCOUNTERS.length} encounters</p></div>
  ${rail(b.ACTS.map((a,i)=>{const p=art(a.img,960);return `<button class="wc stop press" data-open="act:${i}">${p?`<img src="${p.img}" alt="" loading="lazy" decoding="async"${a.pos?` style="object-position:${a.pos}"`:''}>`:''}<span class="wc-t"><small>Act ${esc(a.num)} · ${esc(a.era||'')}</small><b>${esc(a.title)}</b><i>${esc(a.places||'')}</i></span></button>`;}).join(''))}</section>
 <section class="row"><div class="row-head" data-rise><h2>The Saints. <span>A story, three lessons, one thing to do.</span></h2><p>${b.SAINTS.length} saints</p></div>
  ${rail(b.SAINTS.map(x=>{const p=art(x.portrait);return pcard(`saint:${x.id}`,p?.img,x.lived,x.name,x.title,x.pos);}).join(''))}</section>
 <section class="row"><div class="row-head" data-rise><h2>The Apostles. <span>The Twelve, and Paul.</span></h2></div>
  ${rail([...b.APOSTLES,{...b.PAUL,id:'paul',epithet:'Apostle to the Gentiles'}].map(x=>{const p=art(x.portrait);return pcard(`apostle:${x.id}`,p?.img,x.trade||x.also||'',x.name,x.epithet||'');}).join(''))}</section>
 <section class="row"><div class="row-head" data-rise><h2>“I am.” <span>Seven sayings.</span></h2></div>
  ${rail((b.I_AM||[]).map(x=>`<div class="bh-iam"><small>${esc(x.r)}</small><b>I am ${esc(x.t)}.</b><span>${esc(x.line||'')}</span></div>`).join(''))}</section>
 <section class="row"><div class="row-head" data-rise><h2>Mary, and prayer.</h2></div>
  <div class="links" data-rise><button class="lk press" data-open="bh:mary"><b>Mother Mary</b><span>Her life in ten chapters, and her words</span></button><button class="lk press" data-open="bh:pray"><b>Pray</b><span>${my?`Today: the ${esc(my.name)} Mysteries`:'The Rosary and the prayers'}</span></button><button class="lk press" data-open="bh:last"><b>The seven last words</b><span>From the Cross</span></button></div></section>
 <section class="row"><div class="row-head" data-rise><h2>The whole site.</h2></div>
  <div class="links" data-rise><a class="lk press" href="https://gomayoha.github.io/Behold/" target="_blank" rel="noopener"><b>Behold</b><span>The full site, with the maps and the gallery</span></a><a class="lk press" href="https://gomayoha.github.io/Behold/scarlet-thread/" target="_blank" rel="noopener"><b>The Scarlet Thread</b><span>The whole Bible as one story</span></a></div>
  <p class="fine" style="margin-top:22px">${esc(b.SITE?.dedication||'')}</p></section>`;
 rise(root);
}
const quote=(t,r)=>t?`<blockquote class="bh-q">${esc(t)}<cite>${esc(r||'')}</cite></blockquote>`:'';
const hero=(a,pos)=>a?`<div class="cfa-hero sh-hero"><img src="${wm(a.src,1280)||a.src}" alt=""${pos?` style="object-position:${pos}"`:''}></div>`:'';
const credit=a=>a?`<p class="fine">${esc(a.title||'')}${a.artist?`, ${esc(a.artist)}`:''}${a.year?`, ${esc(a.year)}`:''}</p>`:'';
function openBehold(k,a,from){
 const b=B();
 if(k==='act'){const act=b.ACTS[+a],list=b.ENCOUNTERS.filter(e=>+e.act===+a),p=b.ART[act.img];
  openSheet(`<article class="cfa">${hero(p,act.pos)}<div class="cfa-in"><p class="eyebrow">Act ${esc(act.num)} · ${esc(act.era||'')}</p><h2 class="sh-title">${esc(act.title)}</h2><p class="sh-sub">${esc(act.places||'')}</p>${quote(act.verse?.t,act.verse?.r)}
   <div class="bh-encs">${list.map(e=>`<button class="sr press" data-open="enc:${e.id}"><i style="background:${TYPE[e.type]||'#888'}"></i><span><b>${esc(e.name)}</b><small>${esc(e.role||'')}</small></span></button>`).join('')}</div>${credit(p)}</div></article>`,{from,cls:'wide'});}
 else if(k==='enc'){const e=b.ENCOUNTERS.find(x=>x.id===a);if(!e)return;const p=b.ART[b.ENC_ART[e.id]];see('enc:'+e.id);
  openSheet(`<article class="cfa">${hero(p)}<div class="cfa-in"><p class="eyebrow" style="color:${TYPE[e.type]||''}">${esc(e.type||'')} · ${esc(e.place||'')}</p><h2 class="sh-title">${esc(e.name)}</h2><p class="sh-sub">${esc(e.role||'')}</p><div class="prose"><p>${esc(e.text)}</p></div>${quote(e.quote,e.qref)}${credit(p)}</div></article>`,{from});}
 else if(k==='saint'){const s=b.SAINTS.find(x=>x.id===a);if(!s)return;const p=b.ART[s.portrait];see('saint:'+s.id);
  openSheet(`<article class="cfa">${hero(p,s.pos)}<div class="cfa-in"><p class="eyebrow" style="color:${s.color||''}">${esc(s.lived||'')}${s.from?` · ${esc(s.from)}`:''}</p><h2 class="sh-title">${esc(s.full||s.name)}</h2><p class="rec-say">${esc(s.title||'')}</p>
   <dl class="facts">${s.feast?`<div><dt>Feast</dt><dd>${esc(s.feast)}</dd></div>`:''}${s.patron?`<div><dt>Patron of</dt><dd>${esc(s.patron)}</dd></div>`:''}</dl>
   <div class="prose">${(s.story||[]).map(t=>`<p>${esc(t)}</p>`).join('')}</div>${quote(s.quote?.t,[s.quote?.by,s.quote?.r].filter(Boolean).join(' · '))}
   ${s.end?.text?`<h3>How the story ends</h3><div class="prose"><p>${esc(s.end.text)}</p></div>`:''}
   ${(s.lessons||[]).length?`<h3>Three lessons</h3><ol class="bh-less">${s.lessons.map(l=>`<li><b>${esc(l.t)}</b><span>${esc(l.d)}</span></li>`).join('')}</ol>`:''}
   ${s.practice?`<p class="cfa-fact"><b>One thing to do today</b>${esc(s.practice)}</p>`:''}${credit(p)}</div></article>`,{from,cls:'wide'});}
 else if(k==='apostle'){const x=a==='paul'?b.PAUL:b.APOSTLES.find(y=>y.id===a);if(!x)return;const p=b.ART[x.portrait];
  openSheet(`<article class="cfa">${hero(p)}<div class="cfa-in"><p class="eyebrow" style="color:${x.color||''}">${esc(x.epithet||x.also||'')}</p><h2 class="sh-title">${esc(x.full||x.name)}</h2><p class="sh-sub">${esc(x.also||'')}</p>
   <dl class="facts">${x.origin?`<div><dt>From</dt><dd>${esc(x.origin)}</dd></div>`:''}${x.trade?`<div><dt>Trade</dt><dd>${esc(x.trade)}</dd></div>`:''}${x.feast?`<div><dt>Feast</dt><dd>${esc(x.feast)}</dd></div>`:''}</dl>
   ${x.call?.t?`<h3>The calling</h3><div class="prose"><p>${esc(x.call.t)}</p></div>`:''}${x.before?.text?`<h3>Before</h3><div class="prose"><p>${esc(x.before.text)}</p></div>`:''}
   ${(x.moments||[]).length?`<h3>Moments</h3><ul class="cf-list">${x.moments.map(m=>`<li>${esc(m[0])} <small>${esc(m[1]||'')}</small></li>`).join('')}</ul>`:''}${quote(x.quote?.t,x.quote?.r)}
   ${x.after?`<h3>Afterwards</h3><div class="prose"><p>${esc(x.after)}</p></div>`:''}${x.death?`<dl class="facts"><div><dt>Death</dt><dd>${esc(x.death.how||'')}</dd></div><div><dt>Where and when</dt><dd>${esc([x.death.where,x.death.when].filter(Boolean).join(', '))}</dd></div></dl>`:''}
   ${x.legacy?`<p class="cfa-fact"><b>Legacy</b>${esc(x.legacy)}</p>`:''}${credit(p)}</div></article>`,{from,cls:'wide'});}
 else if(k==='bh'&&a==='mary'){openSheet(`<article class="cfa"><div class="cfa-in"><p class="eyebrow">Mother Mary</p><h2 class="sh-title">Her life.</h2>${(b.MARY_LIFE||[]).map(m=>`<h3>${esc(m.title)}</h3><p class="fine">${esc(m.tag||'')}${m.ref?` · ${esc(m.ref)}`:''}</p><div class="prose"><p>${esc(m.text)}</p></div>`).join('')}<h3>Her words</h3>${(b.MARY_WORDS||[]).map(w=>quote(w.t,`${w.r} · ${w.to||''}`)).join('')}</div></article>`,{from,cls:'wide'});}
 else if(k==='bh'&&a==='pray'){const my=Object.values(b.MYSTERIES||{}).find(m=>m.days.includes(weekday()));
  openSheet(`<article class="cfa"><div class="cfa-in"><p class="eyebrow">${weekday()}</p><h2 class="sh-title">Pray.</h2>${my?`<h3 style="color:${my.color}">The ${esc(my.name)} Mysteries</h3><p class="fine">${esc(my.days)}</p><ol class="bh-less">${my.list.map(m=>`<li><b>${esc(typeof m==='string'?m:(m.t||m.name||m.title||''))}</b><span>${esc(typeof m==='string'?'':(m.fruit||m.ref||m.d||''))}</span></li>`).join('')}</ol>`:''}
   <h3>The prayers</h3>${Object.values(b.PRAYERS||{}).map(p=>`<details class="bh-pr"><summary>${esc(p.name)}</summary><p>${esc(p.text)}</p></details>`).join('')}</div></article>`,{from});}
 else if(k==='bh'&&a==='last'){openSheet(`<article class="cfa"><div class="cfa-in"><p class="eyebrow">From the Cross</p><h2 class="sh-title">The seven last words.</h2>${(b.LAST_WORDS||[]).map(w=>quote(w.t,w.r)).join('')}</div></article>`,{from});}
 else if(k==='bh'&&a==='verse'){const v=verseOfDay();openSheet(`<article class="cfa"><div class="cfa-in bh-big"><p class="eyebrow">Verse of the day</p>${quote(v.t,v.r)}<h3>More</h3>${shuffleDay(b.VERSES).slice(0,5).map(x=>quote(x.t,x.r)).join('')}</div></article>`,{from});}
}
const shuffleDay=arr=>{const r=rng('v:'+TODAY),a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};

/* ================================================================== the switch, and what Today takes */
export function open(what,from){
 const [k,...r]=what.split(':'),a=r.join(':');
 if(k==='case'){openCase(a,from);return true;}
 if(['act','enc','saint','apostle','bh'].includes(k)){openBehold(k,a,from);return true;}
 if(k==='world'){setWorld(a);return true;}
 return false;
}
let host=null;const drawn={};
export function setWorld(w,{quiet=false}={}){
 if(!WORLDS.some(x=>x[0]===w))w='anime';
 S.world=w;changed();document.documentElement.dataset.world=w;if(!host)return;
 $$('[data-world]',host).forEach(b=>b.setAttribute('aria-selected',String(b.dataset.world===w)));
 WORLDS.forEach(([id])=>{const el=$('#w-'+id,host);el.hidden=id!==w;});
 const el=$('#w-'+w,host);
 if(!drawn[w]){drawn[w]=true;(w==='mysteries'?renderMysteries:w==='behold'?renderBehold:renderStories)(el);}
 if(!quiet){scrollTo(0,0);if(!reduced())el.animate([{opacity:0,transform:'translate3d(0,16px,0)'},{opacity:1,transform:'none'}],{duration:480,easing:'cubic-bezier(.2,.8,.2,1)'});}
 rise(el);
}
export function renderWorlds(root){
 host=root;
 root.innerHTML=`<nav class="ws" aria-label="Worlds" role="tablist">${WORLDS.map(([id,n])=>`<button role="tab" data-world="${id}" data-open="world:${id}" aria-selected="false">${n}</button>`).join('')}</nav>${WORLDS.map(([id])=>`<div class="w" id="w-${id}" hidden></div>`).join('')}`;
 root.addEventListener('click',e=>{const rb=e.target.closest('.w:not(#w-anime) [data-rail]');if(rb){const r=rb.parentNode.querySelector('.rail');r.scrollBy({left:+rb.dataset.rail*r.clientWidth*.82,behavior:'smooth'});}});
 setWorld(S.world||'anime',{quiet:true});
}
// Today: one thing from each of the other worlds
export function todayExtras(){
 const c=caseOfDay(),v=verseOfDay(),s=saintOfDay(),sp=s&&art(s.portrait,960);
 if(!c&&!v)return '';
 return `<section class="row"><div class="row-head" data-rise><h2>From your other worlds.</h2></div><div class="tx">
  ${c?`<button class="card cx-case press" data-open="case:${c.id}" data-rise><img src="${wm(c.hero?.src,960)}" alt="" loading="lazy" decoding="async"><span class="card-t"><span class="eyebrow">Mysteries · case of the day</span><b>${fmt(c.title)}</b><small>${esc((VERD[c.verdict]||[''])[0])} · ${esc(c.readMinutes)} min</small></span></button>`:''}
  ${v?`<button class="card cx-verse press" data-open="bh:verse" data-rise><span class="eyebrow">Behold · verse of the day</span><span class="say">${esc(v.t)}</span><span class="say-of"><span><b>${esc(v.r)}</b></span></span></button>`:''}
  ${s?`<button class="card cx-saint press" data-open="saint:${s.id}" data-rise style="--c:${s.color||'#d8b56a'}">${sp?`<img src="${sp.img}" alt="" loading="lazy" decoding="async" style="object-position:${s.pos||'50% 20%'}">`:''}<span class="card-t"><span class="eyebrow">Behold · saint of the day</span><b>${esc(s.name)}</b><small>${esc(s.practice||s.title||'')}</small></span></button>`:''}
 </div></section>`;
}

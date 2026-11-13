// Stories: everything he wrote and kept, as rails you swipe and full-screen stories you tap through.
// His words are shown exactly as his notes have them; only labels and buttons are written here.
import {$,$$,esc,data,S,ROOT,TH,FU,poster,findRecord,collections,money,see,onChange} from './store.js';
import {openSheet,openStory,openGallery,openViewer,rise,toast} from './ui.js';
import {serials,serialCover} from './serial.js';

const ART=ROOT+'assets/moments/';
// which picture goes with which moment (same map as the classic site)
const PICK={'One Piece-01':[{crew:'Nami'}],'One Piece-02':[{ch:'sanji'}],'One Piece-03':['brook-laboon.webp'],'One Piece-04':[{ch:'robin'},'sniper-king.webp'],'One Piece-05':['elbaf-warriors.webp','elbaf-crew.webp'],'One Piece-06':[{ch:'zoro'}],'One Piece-07':['ace-yamato-luffy.webp'],'One Piece-08':['rubberman.webp','spider-man-1000.webp'],'One Piece-09':['heartbeat-2.webp','heartbeat-1.webp'],'One Piece-10':['kuma-bonney.webp'],'One Piece-11':['elbaf-mural.webp','joyboy.webp'],'One Piece-12':['usopp-memories.webp'],'Re:Zero-01':['rem-frame.webp'],'Re:Zero-02':['rezero-ep9.webp'],'Re:Zero-03':['subaru-raging.webp',{ch:'subaru-natsuki'}],'Violet Evergarden-01':[{img:'2055c4135ff6'},{img:'38583bab47bc'}]};
const chars=()=>data.characters?.characters||[];
export const charImg=(c,big=false)=>`${ROOT}assets/chars/${big?'':'m/'}${c.image.id}.webp`;
export function momentArt(m){
 const src=p=>{if(typeof p==='string')return ART+p;if(p.ch){const c=chars().find(x=>x.id===p.ch);return c&&charImg(c);}if(p.crew){const c=data.media.crew.find(x=>x.name===p.crew);return c&&FU(c.cover);}if(p.img)return FU(p.img);return null;};
 return (PICK[`${m.series}-${m.n}`]||[]).map(src).filter(Boolean);
}
const blocks=list=>(list||[]).map(b=>typeof b==='string'?b:(b.p||b.q||b.h||Object.values(b)[0])).filter(x=>typeof x==='string'&&x.trim());
const idsOf=name=>collections().find(c=>c.name===name)?.cards.map(p=>p.id)||[];
const stopPoster=s=>{if(!s.title)return null;const a=findRecord(s.title);return (a&&poster(a.k,a.t))||poster('anime',s.title);};
const score=a=>{const n=parseFloat(a?.s);return a&&/^\d/.test(String(a.s))&&!isNaN(n)?n:null;};

/* ------------------------------------------------------------------ openers (used by every screen) */
export function openCharacter(c,from){
 const pics=idsOf(c.name.split(' ')[0])||[];const home=(data.media.characters||[]).find(x=>c.name.toLowerCase().includes(x.home.toLowerCase()));
 const ids=home?home.all:pics;
 openStory([
  {img:charImg(c),kicker:c.series,title:esc(c.name),quote:c.word?`${c.word}.`:'',foot:c.word?'The word they left behind':'',tint:c.image.color,cls:'cover'},
  c.left&&{kicker:'What stayed',quote:c.left,tint:c.image.color},
  c.first&&{kicker:'First impression',quote:`“${c.first}”`,tint:c.image.color},
  ...(c.now?.length?[{kicker:'Now',text:c.now.join(' '),tint:c.image.color}]:[]),
  ...(c.changed||[]).map(t=>({kicker:'What changed in me',quote:t,tint:c.image.color})),
  ...(c.paras||[]).map((t,i)=>({kicker:i?'':'Everything I wrote',text:t,tint:c.image.color})),
  ...(c.quotes||[]).map(q=>({kicker:'A line I kept',quote:typeof q==='string'?q:(q.text||q.q||''),foot:typeof q==='string'?'':(q.who||q.by||''),tint:c.image.color})),
  ids.length?{tint:c.image.color,html:`<div class="st-copy st-end"><p class="st-k">${esc(c.name)}</p><h2 class="st-t">${ids.length} picture${ids.length===1?'':'s'} kept.</h2><div class="st-thumbs">${ids.slice(0,6).map(id=>`<img src="${TH(id)}" alt="">`).join('')}</div><button class="btn" data-open="gallery:${esc(home?home.home:c.name)}">See them all</button></div>`}:null
 ],{from});
}
export function openMoment(m,from){
 const art=momentArt(m),t=blocks(m.text);
 openStory([
  {img:art[0],kicker:`${m.series} · ${m.emotion||''}`,title:esc(m.title),cls:'cover'},
  ...t.map((p,i)=>({kicker:i?'':'In my words',text:p,img:i===Math.floor(t.length/2)&&art[1]?art[1]:null}))
 ],{from});
}
export function openStop(s,from){
 const p=stopPoster(s);
 openStory([
  {img:p?.img,kicker:`Phase ${s.phase} · ${s.when||''}`,title:esc(s.name),foot:s.title,cls:'cover'},
  ...blocks(s.blocks).map(t=>({text:t})),
  s.tags?.length?{html:`<div class="st-copy st-end"><p class="st-k">${esc(s.name)}</p><div class="tags big">${s.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div></div>`}:null
 ],{from});
}
export function openRecord(a,from,{rank=null,why=''}={}){
 if(!a)return;const p=poster(a.k,a.t),n=score(a),kind={anime:'Anime',manga:'Manga',tv:'Live action'}[a.k]||'Record';
 const body=String(a.b||'').split(/\n\s*\n/).filter(Boolean).map(t=>`<p>${esc(t)}</p>`).join('');
 openSheet(`<div class="rec">
  <div class="rec-pic sh-hero"${p?.color?` style="--c:${p.color}"`:''}>${p?`<img src="${p.img}" alt="${esc(a.t)} cover">`:`<span>${esc(a.t)}</span>`}</div>
  <div class="rec-txt"><p class="eyebrow">${kind}${rank?` · My top ten, No. ${rank}`:''}</p><h2 class="sh-title">${esc(a.t)}</h2>
  ${n!==null?`<p class="rec-score"><b>${esc(String(a.s).replace('*',''))}</b><span>/ 10</span></p>`:a.chapter||a.progress?`<p class="rec-score small"><b>${esc(a.chapter||a.progress)}</b></p>`:''}
  ${a.tagline?`<p class="rec-say">“${esc(a.tagline)}”</p>`:''}${why?`<p class="rec-why">${esc(why)}</p>`:''}<div class="prose">${body}</div>
  ${(a.extra||[]).length?`<div class="tags">${a.extra.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}<p class="fine">From my notes.${p?' Cover art: AniList / TVmaze.':''}</p></div></div>`,{from});
}
export function openCrew(c,from){
 const ids=c.photos?.char?(data.media.characters.find(x=>x.home===c.photos.char)?.all||[]):c.photos?.crew?idsOf(c.photos.crew):idsOf(c.short);
 const mine=c.mine&&!c.mine.draft&&!c.draft?c.mine.text:'';
 openSheet(`<div class="rec crew">
  <div class="rec-pic sh-hero" style="--c:${c.tint||'#333'}"><img src="${FU(c.art)}" alt="${esc(c.name)}"></div>
  <div class="rec-txt"><p class="eyebrow" style="color:${c.tint||''}">${esc(c.role||'')}</p><h2 class="sh-title">${esc(c.name)}</h2>
  ${c.bounty?`<p class="rec-score small"><b>฿${money(c.bounty)}</b></p>`:''}
  <dl class="facts">${c.dream?`<div><dt>Dream</dt><dd>${esc(c.dream)}</dd></div>`:''}${c.joined?`<div><dt>Joined at</dt><dd>${esc(c.joined)}</dd></div>`:''}${c.word?`<div><dt>Left behind</dt><dd>${esc(c.word)}</dd></div>`:''}</dl>
  ${mine?`<p class="rec-say">“${esc(mine)}”</p>`:''}
  <div class="row-btns">${c.record&&chars().some(x=>x.id===c.record)?`<button class="btn" data-open="char:${esc(c.record)}">Read their story</button>`:''}${ids.length?`<button class="btn ghost" data-open="gallery:${esc(c.photos?.char||c.photos?.crew||c.short)}">${ids.length} pictures</button>`:''}</div></div></div>`,{from});
}
// the ones outside the Character Log who "still left something" (his line, word for word)
const supportArt=c=>{const m=data.media,s=(m.supporting||[]).find(x=>x.name===c.name);if(s)return {img:FU(s.cover),col:s.name};const k=(m.crew||[]).find(x=>x.name===c.name);if(k)return {img:FU(k.cover),col:k.name};const p=c.name==='Asta'&&poster('anime','Black Clover');return {img:p?p.img:null,col:null};};
export function openSupport(c,from){
 const a=supportArt(c),n=a.col?idsOf(a.col).length:0;
 openSheet(`<div class="rec crew"><div class="rec-pic sh-hero">${a.img?`<img src="${a.img}" alt="${esc(c.name)}">`:''}</div><div class="rec-txt"><p class="eyebrow">${esc(c.series||'Black Clover')}</p><h2 class="sh-title">${esc(c.name)}</h2>${c.word?`<p class="rec-score small"><b>${esc(c.word)}</b></p>`:''}<p class="rec-say">“${esc(c.line)}”</p><p class="fine">${esc(c.source||'From my notes')}</p>${n?`<div class="row-btns"><button class="btn ghost" data-open="gallery:${esc(a.col)}">${n} picture${n===1?'':'s'}</button></div>`:''}</div></div>`,{from});
}
const books=()=>(data.collection?.shelves||[]).flatMap(s=>s.books.map(b=>({...b,shelfName:s.name})));
export function openBook(b,from){
 const added=b.added?new Date(b.added+'-15').toLocaleDateString('en-GB',{month:'long',year:'numeric'}):'';
 openSheet(`<div class="rec"><div class="rec-pic sh-hero" style="--c:${b.spine||'#333'}">${b.cover?`<img src="${ROOT}${b.cover}" alt="">`:`<span class="bk-plain" style="background:${b.spine||'#333'};color:${b.ink||'#fff'}">${esc(b.title)}</span>`}</div><div class="rec-txt"><p class="eyebrow">On my shelf · ${esc(b.shelfName)}</p><h2 class="sh-title">${esc(b.title)}</h2><p class="sh-sub">${esc(b.edition||'')}</p>
 <dl class="facts">${b.vol?`<div><dt>Volume</dt><dd>${esc(b.vol)}</dd></div>`:''}${b.author?`<div><dt>Author</dt><dd>${esc(b.author)}</dd></div>`:''}${added?`<div><dt>Added</dt><dd>${added}</dd></div>`:''}</dl>${b.note?`<p class="rec-say">“${esc(b.note)}”</p>`:''}</div></div>`,{from});
}
// one address for everything that can be opened: "kind:argument" (cards carry it in data-open)
export function open(what,from){
 const [k,...r]=what.split(':'),a=r.join(':'),m=data.media;
 if(k==='char'){const c=chars().find(x=>x.id===a);if(c){see(what);openCharacter(c,from);}}
 else if(k==='moment'){const x=data.route.moments[+a];if(x){see(what);openMoment(x,from);}}
 else if(k==='stop'){const x=data.route.stops[+a];if(x){see(what);openStop(x,from);}}
 else if(k==='support'){const x=data.characters.supporting[+a];if(x)openSupport(x,from);}
 else if(k==='book'){const x=books().find(b=>b.id===a);if(x)openBook(x,from);}
 else if(what==='gallery:fav'){const ids=Object.keys(S.likes).sort((x,y)=>S.likes[y]-S.likes[x]);if(ids.length)openGallery('My favourites',ids,{from,sub:'Hearted'});else toast('No favourites yet','Tap the heart on any picture');}
 else if(k==='crew'){const x=data.strawhats.crew.find(c=>c.id===a);if(x)openCrew(x,from);}
 else if(k==='top'){const t=data.shelf.top10[+a];if(t)openRecord(findRecord(t.title)||{t:t.title,k:'anime'},from,{rank:+a+1,why:t.body});}
 else if(k==='record'){const [kk,...t]=a.split(':');openRecord(data.shelf[kk]?.find(x=>x.t===t.join(':')),from);}
 else if(k==='gallery'){const col=collections().find(c=>c.name===a);if(col)openGallery(col.name,col.cards.map(p=>p.id),{from});}
 else if(k==='pic'){const col=collections().find(c=>c.cards.some(p=>p.id===a));const ids=col?col.cards.map(p=>p.id):[a];openViewer(ids,Math.max(0,ids.indexOf(a)),{caption:col?.name});}
 else return false;
 return true;
}

/* ------------------------------------------------------------------ the screen */
const rail=(id,inner)=>`<div class="rail-wrap"><div class="rail" id="${id}">${inner}</div><button class="rail-btn prev" aria-label="Scroll back" data-rail="-1">‹</button><button class="rail-btn next" aria-label="Scroll on" data-rail="1">›</button></div>`;
const head=(a,b,n='')=>`<div class="row-head" data-rise><h2>${a} <span>${b}</span></h2>${n?`<p>${n}</p>`:''}</div>`;
let tab='anime',q='',all=false;
function shelfHTML(){
 const SH=data.shelf,list=(SH[tab]||[]).filter(a=>a.t.toLowerCase().includes(q)).filter(a=>q||tab==='tv'||!['want','next'].includes(a.status)).sort((a,b)=>(score(b)??-1)-(score(a)??-1));
 const show=all||q?list:list.slice(0,12);
 return `<div class="sf-grid">${show.map(a=>{const p=poster(a.k,a.t),n=score(a);return `<button class="sf press" data-open="record:${a.k}:${esc(a.t)}"><span class="sf-pic"${p?.color?` style="--c:${p.color}"`:''}>${p?`<img src="${p.img}" alt="" loading="lazy" decoding="async">`:`<i>${esc(a.t)}</i>`}</span><span class="sf-meta"><b>${esc(a.t)}</b><small>${n!==null?`${esc(String(a.s).replace('*',''))} / 10`:esc(a.chapter||a.progress||a.status||'')}</small></span></button>`;}).join('')||'<p class="fine">Nothing on the shelf matches that.</p>'}</div>${!all&&!q&&list.length>12?`<button class="btn ghost" id="sf-all">Show all ${list.length}</button>`:''}`;
}
export function renderStories(root){
 // rewatches he told me about in chat that his notes don't list yet (his words; same line as the classic shelf)
 const RW_ADD=[{title:'Violet Evergarden',count:'2×',body:'Rewatched the entire show again with my family (October 2026). It increased my understanding of the character.'}];
 const RW=[...data.shelf.rewatches,...RW_ADD.filter(a=>!data.shelf.rewatches.some(r=>r.title===a.title))];
 const C=chars(),R=data.route,SH=data.shelf,cols=collections().sort((a,b)=>b.cards.length-a.cards.length);
 root.innerHTML=`
 <header class="lt"><p class="lt-date">${Object.keys(data.media.img).length.toLocaleString('en-US')} pictures · ${C.length} characters · ${SH.anime.length+SH.manga.length+SH.tv.length} records</p><h1 class="lt-title">Stories</h1></header>
 <section class="row">${head('Characters.','What they left behind.',`${C.length} records`)}
  ${rail('r-chars',C.map(c=>`<button class="pc press" data-open="char:${c.id}" style="--c:${c.image.color}"><img src="${charImg(c)}" alt="" loading="lazy" decoding="async"><span class="pc-t"><small>${esc(c.series)}</small><b>${esc(c.name)}</b>${c.word?`<em>${esc(c.word)}</em>`:''}</span></button>`).join(''))}</section>
 <section class="row">${head('Top ten.','The countdown.')}
  ${rail('r-top',SH.top10.map((t,i)=>{const a=findRecord(t.title),p=a&&poster(a.k,a.t);return `<button class="tt press" data-open="top:${i}"><span class="tt-n">${i+1}</span><span class="tt-pic">${p?`<img src="${p.img}" alt="" loading="lazy" decoding="async">`:''}</span><span class="tt-t">${esc(t.title)}</span></button>`;}).join(''))}</section>
 <section class="row">${head('Moments.','The ones that live in my head.',`${R.moments.length} moments`)}
  ${rail('r-mo',R.moments.map((m,i)=>{const a=momentArt(m)[0];return `<button class="wc press" data-open="moment:${i}">${a?`<img src="${a}" alt="" loading="lazy" decoding="async">`:''}<span class="wc-t"><small>${esc(m.series)} · ${esc(m.emotion||'')}</small><b>${esc(m.title)}</b></span></button>`;}).join(''))}</section>
 ${serials().length?`<section class="row">${head('Cover stories.','The side adventures, as little films.',`${serials().length} serials`)}
  ${rail('r-serials',serials().map(s=>`<button class="cv press" data-open="serial:${s.id}" style="--c:${s.color}"><span class="cv-pic"><img src="${serialCover(s)}" alt="" loading="lazy" decoding="async"></span><span class="cv-t"><b>${esc(s.title)}</b><small>${s.pages.length} parts${s.from?` · ch. ${s.from}–${s.to}`:''}${S.seen['serial:'+s.id]?' · watched':''}</small></span></button>`).join(''))}</section>`:''}
 <section class="row">${head('The Straw Hats.','Ten dreams, one ship.',`฿${money(data.strawhats.total)}`)}
  ${rail('r-crew',data.strawhats.crew.map(c=>`<button class="cr press" data-open="crew:${c.id}" style="--c:${c.tint}"><span class="cr-pic"><img src="${TH(c.art)}" alt="" loading="lazy" decoding="async"></span><b>${esc(c.short)}</b><small>${esc(c.role)}</small></button>`).join(''))}</section>
 <section class="row">${head('They still left something.','')}
  ${rail('r-sup',data.characters.supporting.map((c,i)=>{const a=supportArt(c);return `<button class="wc press" data-open="support:${i}">${a.img?`<img src="${a.img}" alt="" loading="lazy" decoding="async">`:''}<span class="wc-t"><small>${esc(c.series||'Black Clover')}</small><b>${esc(c.name)}</b></span></button>`;}).join(''))}</section>
 <section class="row">${head('The journey.','How it started, phase by phase.')}
  ${rail('r-stops',R.stops.map((s,i)=>{const p=stopPoster(s);return `<button class="wc stop press" data-open="stop:${i}">${p?`<img src="${p.img}" alt="" loading="lazy" decoding="async">`:`<span class="wc-no">${esc(s.phase)}</span>`}<span class="wc-t"><small>Phase ${esc(s.phase)} · ${esc(s.when||'')}</small><b>${esc(s.name)}</b><i>${esc(s.title)}</i></span></button>`;}).join(''))}</section>
 <section class="row shelf">${head('The shelf.','Rated, preserved as written.')}
  <div class="sf-bar" data-rise><div class="seg" role="tablist">${[['anime','Anime'],['manga','Manga'],['tv','Live action']].map(([k,l])=>`<button role="tab" data-seg="${k}" aria-selected="${k===tab}">${l}</button>`).join('')}</div><input type="search" id="sf-q" placeholder="Find a story" aria-label="Search the shelf"></div>
  <div id="sf-out">${shelfHTML()}</div></section>
 <section class="row">${head('Rewatches.','Some stories gained company.')}
  ${rail('r-rw',RW.map(r=>{const a=findRecord(r.title),p=a&&poster(a.k,a.t);return `<button class="rw press"${a?` data-open="record:${a.k}:${esc(a.t)}"`:''}>${p?`<img src="${p.img}" alt="" loading="lazy" decoding="async">`:''}<span><b>${esc(r.count)}</b><strong>${esc(r.title)}</strong><small>${esc(r.body)}</small></span></button>`;}).join(''))}</section>
 ${books().length?`<section class="row">${head('Books I can hold.','My manga collection.')}
  ${rail('r-books',books().map(b=>`<button class="pc col bk press" data-open="book:${esc(b.id)}" style="--c:${b.spine||'#333'}">${b.cover?`<img src="${ROOT}${b.cover}" alt="" loading="lazy" decoding="async">`:''}<span class="pc-t"><b>${esc(b.title)}</b><small>${esc(b.edition||b.vol||'')}</small></span></button>`).join(''))}</section>`:''}
 <section class="row">${head('Pictures.','Every collection.',`${Object.keys(data.media.img).length.toLocaleString('en-US')} kept`)}
  ${rail('r-cols',`<button class="pc col fav press" id="fav-card" data-open="gallery:fav" hidden><img alt="" decoding="async"><span class="pc-t"><b>My favourites</b><small></small></span></button>`+cols.map(c=>`<button class="pc col press" data-open="gallery:${esc(c.name)}"><img src="${TH(c.cards[0].id)}" alt="" loading="lazy" decoding="async"><span class="pc-t"><b>${esc(c.name)}</b><small>${c.cards.length} picture${c.cards.length===1?'':'s'}</small></span></button>`).join(''))}</section>
 <section class="row">${head('Pages of their own.','')}
  <div class="links" data-rise><a class="lk press" href="${ROOT}story.html"><b>The Story of One Piece</b><span>The whole manga, arc by arc</span></a><a class="lk press" href="${ROOT}index.html"><b>The classic archive</b><span>The long scroll, exactly as it was</span></a><a class="lk press" href="${ROOT}index.html#life"><b>Book II</b><span>Behind the magic words</span></a></div></section>`;
 const out=$('#sf-out',root),redo=()=>{out.innerHTML=shelfHTML();};
 root.addEventListener('click',e=>{
  const s=e.target.closest('[data-seg]');if(s){tab=s.dataset.seg;all=false;$$('[data-seg]',root).forEach(b=>b.setAttribute('aria-selected',String(b===s)));redo();}
  if(e.target.closest('#sf-all')){all=true;redo();}
  const rb=e.target.closest('[data-rail]');if(rb){const r=rb.parentNode.querySelector('.rail');r.scrollBy({left:+rb.dataset.rail*r.clientWidth*.82,behavior:'smooth'});}
 });
 $('#sf-q',root).addEventListener('input',e=>{q=e.target.value.toLowerCase().trim();redo();});
 const fav=()=>{const el=$('#fav-card',root),ids=Object.keys(S.likes).sort((x,y)=>S.likes[y]-S.likes[x]);el.hidden=!ids.length;if(ids.length){$('img',el).src=TH(ids[0]);$('small',el).textContent=`${ids.length} picture${ids.length===1?'':'s'}`;}};fav();onChange(fav);
 rise(root);
}

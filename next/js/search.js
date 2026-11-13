// Search everything: characters, the crew, every record on the shelf, moments, phases, collections and his real cards.
import {$,esc,data,ROOT,TH,poster,collections,shuffle} from './store.js';
import {openSheet} from './ui.js';
import {charImg,momentArt} from './stories.js';
import {wm} from './worlds.js';

let INDEX=null;
function build(){
 const out=[],add=(kind,t,s,img,open)=>out.push({kind,t,s,img,open,k:`${t} ${s}`.toLowerCase()}),m=data.media,SH=data.shelf;
 data.characters.characters.forEach(c=>add('Characters',c.name,c.series,charImg(c),`char:${c.id}`));
 data.characters.supporting.forEach((c,i)=>add('Characters',c.name,c.series||'Left something behind',null,`support:${i}`));
 data.strawhats.crew.forEach(c=>add('The Straw Hats',c.name,c.role,TH(c.art),`crew:${c.id}`));
 [['anime','Anime'],['manga','Manga'],['tv','Live action']].forEach(([k,l])=>(SH[k]||[]).forEach(a=>{const n=parseFloat(a.s);add('The shelf',a.t,`${l}${/^\d/.test(String(a.s))&&!isNaN(n)?` · ${String(a.s).replace('*','')} / 10`:a.chapter?` · ${a.chapter}`:''}`,poster(k,a.t)?.img,`record:${k}:${a.t}`);}));
 data.route.moments.forEach((x,i)=>add('Moments',x.title,x.series,momentArt(x)[0],`moment:${i}`));
 data.route.stops.forEach((x,i)=>add('The journey',x.name,x.title||`Phase ${x.phase}`,null,`stop:${i}`));
 (data.covers?.serials||[]).forEach(s=>add('Cover stories',s.title,`${s.pages.length} parts`,`${ROOT}assets/covers/${s.id}/cover.webp`,`serial:${s.id}`));
 (data.mysteries?.stories||[]).forEach(c=>add('Mysteries',String(c.title).replace(/\*/g,''),`Case file · ${c.year||''}`,wm(c.hero?.src,250),`case:${c.id}`));
 (data.behold?.SAINTS||[]).forEach(x=>add('Behold',x.full||x.name,x.title||'Saint',wm(data.behold.ART?.[x.portrait]?.src,250),`saint:${x.id}`));
 (data.behold?.APOSTLES||[]).forEach(x=>add('Behold',x.full||x.name,x.epithet||'Apostle',wm(data.behold.ART?.[x.portrait]?.src,250),`apostle:${x.id}`));
 (data.behold?.ENCOUNTERS||[]).forEach(x=>add('Behold',x.name,x.role||'Encounter',null,`enc:${x.id}`));
 collections().forEach(c=>add('Pictures',c.name,`${c.cards.length} picture${c.cards.length===1?'':'s'}`,TH(c.cards[0].id),`gallery:${c.name}`));
 (data.tcg?.cards||[]).forEach(c=>add('My real cards',c.name,`${c.rarity||''} · ${c.no||c.id}`,`${ROOT}assets/tcg/s/${c.id}.webp`,`tcg:${c.id}`));
 return out;
}
const ORDER=['Characters','The Straw Hats','Cover stories','Mysteries','Behold','The shelf','Moments','The journey','Pictures','My real cards'];
const row=r=>`<button class="sr press" data-open="${esc(r.open)}">${r.img?`<img src="${r.img}" alt="" loading="lazy" decoding="async">`:`<i>${esc(r.t[0]||'')}</i>`}<span><b>${esc(r.t)}</b><small>${esc(r.s)}</small></span></button>`;
function results(q){
 const tok=q.toLowerCase().split(/\s+/).filter(Boolean);if(!tok.length)return '';
 const hit=INDEX.filter(r=>tok.every(t=>r.k.includes(t))).sort((a,b)=>(b.t.toLowerCase().startsWith(tok[0])-a.t.toLowerCase().startsWith(tok[0])));
 if(!hit.length)return `<p class="sr-none">Nothing in the archive matches “${esc(q)}”.</p>`;
 return ORDER.map(k=>{const g=hit.filter(r=>r.kind===k).slice(0,12);return g.length?`<p class="eyebrow sr-h">${k}</p>${g.map(row).join('')}`:'';}).join('');
}
export function openSearch(from){
 INDEX??=build();
 const tries=shuffle(INDEX.filter(r=>['Characters','The shelf','Pictures'].includes(r.kind))).slice(0,7).map(r=>r.t);
 openSheet(`<div class="search"><div class="se-top"><input type="search" id="se-q" placeholder="Search the archive" aria-label="Search the archive" autocomplete="off" autocapitalize="off" spellcheck="false"></div>
 <div class="se-out" id="se-out"><p class="eyebrow sr-h">Try</p><div class="tags big">${tries.map(t=>`<button data-try="${esc(t)}"><span>${esc(t)}</span></button>`).join('')}</div></div></div>`,{from,cls:'search-sheet',onOpen(el){
  const q=$('#se-q',el),out=$('#se-out',el),first=out.innerHTML;
  const run=()=>{out.innerHTML=results(q.value.trim())||first;};
  q.addEventListener('input',run);
  el.addEventListener('click',e=>{const t=e.target.closest('[data-try]');if(t){q.value=t.dataset.try;run();}});
  setTimeout(()=>q.focus({preventScroll:true}),60);
 }});
}

// My manga collection (Oct 31 2026): the books on his real shelf, starting with 20th Century Boys (Perfect Edition,
// the finale) and Vagabond (Deluxe Edition, Volume 1). He said more are coming, so the shelf keeps empty places for
// them. Each book is a box in CSS 3D standing spine out; tap one and it slides off the shelf and turns to show its
// cover. The list is data/collection.json, so a new book is one entry.
import {$,esc,data,onSight,motion} from '../core.js';

const J=u=>fetch(u).then(r=>r.ok?r.json():null).catch(()=>null);
const month=m=>{const [y,mo]=String(m||'').split('-');return mo?new Date(+y,+mo-1,1).toLocaleDateString('en-GB',{month:'long',year:'numeric'}):'';};

export async function initCollection(){
 const sec=$('#collection');if(!sec)return;
 const C=await J('data/collection.json');if(!C||!C.books?.length){sec.hidden=true;return;}
 const B=C.books,shelf=$('#mc-shelf'),info=$('#mc-info'),count=$('#mc-count');
 count.innerHTML=`<b>${B.length}</b> ${B.length===1?'book':'books'} on the shelf · more on the way`;
 const spineT=b=>`<span class="mc-st">${esc(b.title)}</span><span class="mc-se">${esc(b.edition)}${b.vol?` · ${esc(b.vol)}`:''}</span><span class="mc-sa">${esc(b.author||'')}</span>`;
 shelf.innerHTML=B.map((b,i)=>`<button class="mc-b" data-i="${i}" style="--c:${b.spine};--band:${b.band||'#c8a24a'};--ink:${b.ink||'#111'};--k:${i}" aria-label="${esc(b.title)}, ${esc(b.edition)} ${esc(b.vol||'')}"><span class="mc-in"><i class="mc-spine">${spineT(b)}</i><i class="mc-cover"><img src="${esc(b.cover)}" alt="" loading="lazy" decoding="async"></i><i class="mc-back"></i><i class="mc-top"></i><i class="mc-edge"></i></span></button>`).join('')
  +Array.from({length:C.slots||0},(_,k)=>`<span class="mc-slot" style="--k:${B.length+k}" aria-hidden="true">${k===0?'<small>Yet to come</small>':''}</span>`).join('');
 const books=[...shelf.querySelectorAll('.mc-b')];
 const show=i=>{
  books.forEach((b,k)=>b.classList.toggle('on',k===i));const b=B[i];if(!b)return;
  const rec=(data.shelf?.manga||[]).find(r=>r.t===b.shelf);
  info.innerHTML=`<p class="eyebrow">On my shelf${b.added?` since ${esc(month(b.added))}`:''}</p><h3>${esc(b.title)}</h3><p class="mc-ed">${esc(b.edition)}${b.vol?` · <b>${esc(b.vol)}</b>`:''}</p><p class="mc-au">${esc(b.author||'')}</p>${rec?`<p class="mc-rd">${rec.status==='reading'?'Reading':rec.status==='finished'||rec.status==='completed'?'Read':'On my list'}${rec.chapter?` · ${esc(rec.chapter)}`:''}</p>`:''}`;
  info.classList.remove('in');void info.offsetWidth;info.classList.add('in');
 };
 shelf.addEventListener('click',e=>{const b=e.target.closest('.mc-b');if(b)show(+b.dataset.i);});
 // the books slide onto the shelf the first time you reach it, and the first one turns to show you its cover
 onSight(sec,()=>{sec.classList.add('in');setTimeout(()=>show(0),motion.reduced?0:900+B.length*120);},'0px 0px -25% 0px');
}

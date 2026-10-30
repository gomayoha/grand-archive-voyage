// My manga collection (Oct 31 2026): the books on his real shelf. Two shelves: One Piece (the Japanese East Blue
// special edition he bought because it felt special, the English volumes 1 to 24 as a row of real spines in their
// colours, the Egghead and Gear 5 volumes) and the rest (20th Century Boys, Vagabond), with empty places kept for
// what's still to come. Every book is a box in CSS 3D standing spine out; tap one and it slides off the shelf and
// turns to show its cover (a photo of his own copy where he sent one). The list is data/collection.json.
import {$,esc,data,onSight,motion} from '../core.js';

const J=u=>fetch(u).then(r=>r.ok?r.json():null).catch(()=>null);
const month=m=>{const [y,mo]=String(m||'').split('-');return mo?new Date(+y,+mo-1,1).toLocaleDateString('en-GB',{month:'long',year:'numeric'}):'';};
// a light spine gets dark ink, a dark one light ink
const inkOn=hex=>{const n=parseInt(hex.slice(1),16),l=(0.299*(n>>16)+0.587*(n>>8&255)+0.114*(n&255))/255;return l>0.6?'#151515':'#fbf6ea';};

export async function initCollection(){
 const sec=$('#collection');if(!sec)return;
 const C=await J('data/collection.json');const SH=C?.shelves||(C?.books?[{name:'',books:C.books,slots:C.slots}]:[]);
 if(!SH.length){sec.hidden=true;return;}
 const B=SH.flatMap(s=>s.books),info=$('#mc-info');
 const vols=B.reduce((n,b)=>n+(b.set?b.set.to-b.set.from+1:1),0);
 $('#mc-count').innerHTML=`<b>${vols}</b> books on the shelf · more on the way`;
 let k=0;
 const cover=b=>b.cover?`<img src="${esc(b.cover)}" alt="" loading="lazy" decoding="async">`:`<span class="mc-print" style="--band:${b.band||'#c8a24a'}"><small>${esc(b.author||'')}</small><b>${esc(b.title)}</b><em>${esc(b.edition)}</em><span>${esc(b.vol||'')}</span></span>`;
 const book=(b,i,{n=null,c=null}={})=>{const sp=c||b.spine,ink=c?inkOn(c):b.ink||'#111';return `<button class="mc-b${n!=null?' thin':''}" data-i="${i}" style="--c:${sp};--band:${b.band||'#c8a24a'};--ink:${ink};--k:${k++};${b.thick?`--tk:${b.thick};`:''}" aria-label="${esc(b.title)}, ${esc(b.edition)}${n!=null?` volume ${n}`:` ${esc(b.vol||'')}`}"><span class="mc-in"><i class="mc-spine">${n!=null?`<span class="mc-sn">${n}</span><span class="mc-st sm">ONE PIECE</span>`:`<span class="mc-st">${esc(b.title)}</span><span class="mc-se">${esc(b.edition.split(' · ')[0])}</span><span class="mc-sa">${esc(b.author||'')}</span>`}</i><i class="mc-cover">${cover(b)}</i><i class="mc-back"></i><i class="mc-top"></i><i class="mc-edge"></i></span></button>`;};
 let idx=0;
 $('#mc-cases').innerHTML=SH.map(s=>{const html=s.books.map(b=>{const i=idx++;if(b.set){const a=[];for(let v=b.set.from;v<=b.set.to;v++)a.push(book(b,i,{n:v,c:b.set.colors?.[v-b.set.from]||'#ddd'}));return `<span class="mc-set" data-i="${i}">${a.join('')}</span>`;}return book(b,i);}).join('');
  return `<div class="mc-case">${s.name?`<p class="mc-sh">${esc(s.name)}</p>`:''}<div class="mc-shelf">${html}${Array.from({length:s.slots||0},(_,j)=>`<span class="mc-slot" style="--k:${k++}" aria-hidden="true">${j===0?'<small>Yet to come</small>':''}</span>`).join('')}</div><i class="mc-plank" aria-hidden="true"></i></div>`;}).join('');
 const els=[...sec.querySelectorAll('.mc-b')];
 const show=(i,el)=>{
  // a book from the right half of its shelf swings out to the left, so it never covers the words beside it
  if(el){const sh=el.closest('.mc-shelf');el.classList.toggle('lft',el.offsetLeft+el.offsetWidth/2>sh.clientWidth*0.5);}
  els.forEach(b=>b.classList.toggle('on',b===el));const b=B[i];if(!b)return;
  const rec=(data.shelf?.manga||[]).find(r=>r.t===b.shelf);
  info.innerHTML=`<p class="eyebrow">On my shelf${b.added?` since ${esc(month(b.added))}`:''}</p><h3>${esc(b.title)}</h3><p class="mc-ed">${esc(b.edition)}${b.vol?` · <b>${esc(b.vol)}</b>`:''}</p><p class="mc-au">${esc(b.author||'')}</p>${b.note?`<p class="mc-note">${esc(b.note)}</p>`:''}${b.set?`<figure class="mc-photo"><img src="${esc(b.cover)}" alt="${esc(b.title)} volumes ${b.set.from} to ${b.set.to} on my shelf" loading="lazy"></figure>`:''}${rec?`<p class="mc-rd">${rec.status==='reading'?'Reading':/finish|complet/.test(rec.status)?'Read':'On my list'}${rec.chapter?` · ${esc(rec.chapter)}`:''}</p>`:''}`;
  info.classList.remove('in');void info.offsetWidth;info.classList.add('in');
 };
 sec.addEventListener('click',e=>{const b=e.target.closest('.mc-b');if(b)show(+b.dataset.i,b);});
 // the books slide onto the shelves the first time you reach them, and the first one turns to show its cover
 onSight(sec,()=>{sec.classList.add('in');setTimeout(()=>show(0,els[0]),motion.reduced?0:1100);},'0px 0px -25% 0px');
}

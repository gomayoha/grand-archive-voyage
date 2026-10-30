// 01 · The characters who left something behind.
// Since Oct 30 2026 the records no longer roll past on the way down the page (he found scrolling through
// every one of them tiring): they wait here tied up like a present, a bundle of their portraits with a gold
// ribbon and a wax seal. Break the seal (or tap a face) and the Character Log opens as a room of its own
// (js/charlog.js): pick a record, read everything he wrote, turn over a first impression, or watch them all.
// Everything shown is from his notes, word for word; "Read everything I wrote" opens the full note.
import {$,esc,pad,data,motion,TH} from '../core.js';
import {openDialog,registerCollection} from '../dialogs.js';
import {openCharLog} from '../bounty.js';

export const CI=id=>`assets/chars/${id}.webp`,CM=id=>`assets/chars/m/${id}.webp`;
// Pull lines: his ==highlight== when he made one; otherwise a sentence lifted verbatim from his note.
const LINES={luffy:"People's dreams never end",zoro:'always aim higher as possible that one day after looking back you won’t even believe how far you’ve come','all-might':'the hope he represent is more than enough reason to like him as a character',guts:'no matter what he has to face he always prevails',ayanakoji:'emotional control, overall awareness and the ability to handle most complex scenarios','subaru-natsuki':'no matter how hard you wanna be someone you can’t change the fact about who you are as a person',rudeus:"we need to face them head on while accepting who we're and living life with no regrets at all",sanji:'how precious the food on the table is','sung-jinwoo':'He chose to become human again'};
// Sung Jinwoo isn't in the "left something behind" list of the Anime Journey note yet; this word is a placeholder.
const WORD_FALLBACK={'sung-jinwoo':'Sacrifice'};
// What he told me in chat that his note doesn't say yet (his words, Oct 30 2026). Shown as an update on the record.
export const UPDATES={'violet-evergarden':{when:'October 2026 · after the rewatch',text:"I rewatched the entire show again with my family. My opinion of it became very good, even more positive, a lot more, and it increased my understanding of the character. She's one of the best characters I've ever seen. Simple, but more than enough for a human, and very realistic. As a character she also has some really good thoughtfulness."}};

export const word=c=>c.word||WORD_FALLBACK[c.id]||'';
export const lineFor=c=>{const t=c.paras.join(' '),l=LINES[c.id];return (c.quotes[0]||(l&&t.includes(l)?l:c.paras[0].split(/(?<=[.!?])\s/)[0])).replace(/^["“\s]+|["”\s]+$/g,'');};
export const photosFor=c=>{const k=c.name.toLowerCase().slice(0,4);return (data.media.characters||[]).find(a=>a.home.toLowerCase().slice(0,4)===k)||null;};
// The ones without a full record yet, who still left something (his One Piece table and Asta), word for word.
// their pictures: his Bon Clay / Corazon folders (media.supporting), Kuma's poster collection, Asta's cover
export const supCol=n=>(data.media.supporting||[]).find(x=>x.name===n)||(data.media.crew||[]).find(x=>x.name===n);
export const supArt=c=>{const col=supCol(c.name);return col&&col.cover?TH(col.cover):c.name==='Asta'?data.posters?.['anime:Black Clover']?.img:null;};

export function initCharacters(){
 const CH=data.characters.characters,N=CH.length,SUP=data.characters.supporting||[];
 registerCollection('char',i=>{const c=CH[+i],m=photosFor(c);return{title:c.name,eyebrow:'Character Log',ids:m?m.all:[]};});
 registerCollection('sup',n=>{const c=supCol(n);return{title:n,eyebrow:'They still left something',ids:c?c.all:[]};});

 // the intro counts the records, so it stays right as his note grows
 const NUM=['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen','Twenty'];
 const lede=$('#characters .cl-e-lede');if(lede)lede.innerHTML=lede.innerHTML.replace(/\b[A-Z][a-z]+ records/,`${NUM[N]||N} records`);

 // the bundle: every portrait stacked a little askew, tied with a ribbon, sealed
 const pack=$('#cl-pack'),faces=$('#cl-faces');
 pack.querySelector('.cl-stack').innerHTML=CH.slice().reverse().map((c,k)=>{const i=N-1-k,r=((i*37)%11-5)*1.15;return `<span class="cl-sc" style="--r:${r.toFixed(2)}deg;--k:${i};--tint:${c.image.color}"><img src="${CM(c.image.id)}" alt="" loading="lazy" decoding="async"></span>`;}).join('');
 faces.innerHTML=CH.map((c,i)=>`<button class="cl-face" data-charlog="${i}" style="--tint:${c.image.color}" aria-label="Open ${esc(c.name)}'s record"><img src="${CM(c.image.id)}" alt="" loading="lazy" decoding="async"><span>${esc(c.name.split(' ')[0])}</span></button>`).join('')+(SUP.length?`<span class="cl-face-more">+${SUP.length} more</span>`:'');

 let opening=false;
 // breaking the seal: the ribbon snaps, the seal drops, the portraits lift off the stack, then the room opens
 async function unwrap(at){
  if(opening)return;opening=true;
  try{
   if(!motion.reduced&&at==null){
    pack.classList.add('open');
    await new Promise(r=>setTimeout(r,620));
   }
   await openCharLog(at);
  }finally{opening=false;setTimeout(()=>pack.classList.remove('open'),900);}
 }
 document.addEventListener('click',e=>{if(e.target.closest('[data-charlog-watch]')){openCharLog(0,{watch:true});return;}const b=e.target.closest('[data-charlog]');if(!b)return;e.preventDefault();const v=b.dataset.charlog;unwrap(v===''?null:+v);});

 /* ---------------- the reader: everything he wrote, untouched ---------------- */
 const mark=(p,qs)=>{let h=esc(p);qs.forEach(q=>{const e=esc(q);if(e&&h.includes(e))h=h.replace(e,`<mark>${e}</mark>`);});return h;};
 function reader(i){
  const c=CH[i],im=c.image,prev=CH[(i-1+N)%N],next=CH[(i+1)%N],up=UPDATES[c.id];
  openDialog(`<div class="reader" style="--tint:${im.color}">
   <figure class="reader-pic"><img src="${CI(im.id)}" width="${im.w}" height="${im.h}" alt="${esc(c.name)}"></figure>
   <div class="reader-text">
    <p class="eyebrow">Character Log · ${pad(i+1)} / ${pad(N)}${c.series?' · '+esc(c.series):''}</p>
    <h2 id="dialog-title">${esc(c.name)}</h2>
    ${word(c)?`<p class="reader-word">${esc(word(c))}</p>`:''}
    <div class="reader-body">${c.paras.map(p=>`<p>${mark(p,c.quotes)}</p>`).join('')}</div>
    ${up?`<div class="reader-box"><small>${esc(up.when)}</small><p>${esc(up.text)}</p></div>`:''}
    ${c.changed?`<div class="reader-box"><small>How he changed me</small><h3>${esc(c.changed[0])}</h3>${c.changed.slice(1).map(p=>`<p>${esc(p)}</p>`).join('')}</div>`:''}
    ${c.first?`<div class="reader-box"><small>First impression</small><p class="reader-first">“${esc(c.first)}”</p><small>Current opinion</small>${c.now.map(p=>`<p>${esc(p)}</p>`).join('')}</div>`:''}
    <nav class="reader-nav"><button class="link" data-read="${(i-1+N)%N}">← ${esc(prev.name)}</button><button class="link" data-read="${(i+1)%N}">${esc(next.name)} →</button></nav>
   </div>
  </div>`,'is-reader');
 }
 document.addEventListener('click',e=>{const b=e.target.closest('[data-read]');if(b)reader(+b.dataset.read);});
 return{CH};
}

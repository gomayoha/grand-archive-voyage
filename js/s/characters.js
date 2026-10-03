// 01 · The characters who left something behind.
// Ten full-screen records stacked like cards: each one slides up over the last (native sticky, no JS
// scrolling), the outgoing one sinks back into the dark. Each record carries the one word he says the
// character left behind, his line about it, and a pull quote, all from his notes, word for word.
// "Read everything I wrote" opens the full note in a reader; nothing is ever shortened.
import {$,$$,esc,pad,clamp,smooth,ease,view,part,absTop,motion,data,remeasure} from '../core.js';
import {openDialog,registerCollection} from '../dialogs.js';

const CI=id=>`assets/chars/${id}.webp`,CM=id=>`assets/chars/m/${id}.webp`;
// Pull lines: his ==highlight== when he made one; otherwise a sentence lifted verbatim from his note.
const LINES={luffy:"People's dreams never end",zoro:'always aim higher as possible that one day after looking back you won’t even believe how far you’ve come','all-might':'the hope he represent is more than enough reason to like him as a character',guts:'no matter what he has to face he always prevails',ayanakoji:'emotional control, overall awareness and the ability to handle most complex scenarios','subaru-natsuki':'no matter how hard you wanna be someone you can’t change the fact about who you are as a person',rudeus:"we need to face them head on while accepting who we're and living life with no regrets at all",sanji:'how precious the food on the table is','sung-jinwoo':'He chose to become human again'};
// Sung Jinwoo isn't in the "left something behind" list of the Anime Journey note yet; this word is a placeholder.
const WORD_FALLBACK={'sung-jinwoo':'Sacrifice'};

export function initCharacters(){
 const CH=data.characters.characters,{archive,media}=data,N=CH.length;
 const lineFor=c=>{const t=c.paras.join(' '),l=LINES[c.id];return (c.quotes[0]||(l&&t.includes(l)?l:c.paras[0].split(/(?<=[.!?])\s/)[0])).replace(/^["“\s]+|["”\s]+$/g,'');};
 const photosFor=c=>{const k=c.name.toLowerCase().slice(0,4);const i=archive.characters.findIndex(a=>a.name.toLowerCase().slice(0,4)===k);return i<0?null:media.characters[i];};
 registerCollection('char',i=>{const c=CH[+i],m=photosFor(c);return{title:c.name,eyebrow:'Character Log',ids:m?m.all:[]};});
 const word=c=>c.word||WORD_FALLBACK[c.id]||'';

 const cast=$('#cast');
 cast.innerHTML=CH.map((c,i)=>{const ph=photosFor(c),im=c.image;return `<article class="role" id="c-${c.id}" data-i="${i}" style="--tint:${im.color}">
  <div class="role-bg" aria-hidden="true"><img src="${CM(im.id)}" alt="" loading="lazy" decoding="async"></div>
  <div class="role-in">
   <figure class="role-pic" style="--ar:${im.w}/${im.h}"><img src="${CM(im.id)}" srcset="${CM(im.id)} 1000w, ${CI(im.id)} ${im.w}w" sizes="(max-width:820px) 92vw, 46vw" width="${im.w}" height="${im.h}" alt="${esc(c.name)}" loading="lazy" decoding="async"></figure>
   <div class="role-copy">
    <p class="role-no k"><b>${pad(i+1)}</b> / ${pad(N)}${c.series?` · ${esc(c.series)}`:''}</p>
    <h3 class="role-name k">${esc(c.name)}</h3>
    ${word(c)?`<p class="role-word k"><small>Left behind</small><span>${esc(word(c))}</span></p>`:''}
    ${c.left?`<p class="role-left k">${esc(c.left)}</p>`:''}
    <blockquote class="role-quote k">“${esc(lineFor(c))}”</blockquote>
    ${c.first?`<button class="judge k" aria-pressed="false" aria-label="First impression versus current opinion"><span class="judge-face judge-f"><small>First impression</small><b>“${esc(c.first)}”</b><i>Tap for the verdict</i></span><span class="judge-face judge-b"><small>Current opinion</small><b>${esc(c.now.slice(0,3).join(' '))}</b></span></button>`:''}
    <div class="role-actions k"><button class="pill small" data-read="${i}">Read everything I wrote</button>${ph&&ph.all.length>1?`<button class="link" data-collection="char:${i}">${ph.all.length} photos →</button>`:''}</div>
   </div>
  </div>
  <i class="role-shade" aria-hidden="true"></i>
 </article><div class="dwell" aria-hidden="true"></div>`;}).join('');
 const roles=$$('.role'),slides=roles.map(r=>({el:r,pic:r.querySelector('.role-pic img'),shade:r.querySelector('.role-shade')}));
 cast.addEventListener('click',e=>{const j=e.target.closest('.judge');if(j)j.setAttribute('aria-pressed',String(j.getAttribute('aria-pressed')!=='true'));});

 // Each record is a sticky full-screen slide followed by a transparent "dwell" spacer, so it holds
 // still while you read before the next one slides over it.
 let dwell=0;
 part({el:cast,measure(){const d=cast.querySelector('.dwell');dwell=d?d.offsetHeight:0;this.tops=roles.map((_,i)=>absTop(cast)+i*(view.vh+dwell));},update(s){
  const vh=view.vh,red=motion.reduced;
  const enter=this.tops.map(t=>clamp((s-(t-vh))/vh));
  slides.forEach((sl,i)=>{
   const e=red?1:enter[i],c=red?0:(enter[i+1]??0),gone=(enter[i+2]??0)>=1;
   if(gone!==sl.gone){sl.gone=gone;sl.el.style.visibility=gone?'hidden':'';}
   if(gone)return;
   // the portrait keeps settling while you read, so the record never feels frozen
   const q=ease(e),hold=red?0:clamp((s-this.tops[i])/(vh*0.42+dwell)),z=1.14-0.14*q-0.05*hold;
   if(sl.z!==z){sl.z=z;sl.el.style.setProperty('--e',q.toFixed(4));sl.el.style.setProperty('--hold',hold.toFixed(4));sl.pic.style.transform=`scale(${z.toFixed(4)})`;}
   sl.el.style.transform=c>0?`scale(${(1-0.07*smooth(c)).toFixed(4)})`:'';
   sl.shade.style.opacity=(smooth(c)*0.75).toFixed(3);
  });
 }});

 /* ---------------- the reader: everything he wrote, untouched ---------------- */
 const mark=(p,qs)=>{let h=esc(p);qs.forEach(q=>{const e=esc(q);if(e&&h.includes(e))h=h.replace(e,`<mark>${e}</mark>`);});return h;};
 function reader(i){
  const c=CH[i],im=c.image,prev=CH[(i-1+N)%N],next=CH[(i+1)%N];
  openDialog(`<div class="reader" style="--tint:${im.color}">
   <figure class="reader-pic"><img src="${CI(im.id)}" width="${im.w}" height="${im.h}" alt="${esc(c.name)}"></figure>
   <div class="reader-text">
    <p class="eyebrow">Character Log · ${pad(i+1)} / ${pad(N)}${c.series?' · '+esc(c.series):''}</p>
    <h2 id="dialog-title">${esc(c.name)}</h2>
    ${word(c)?`<p class="reader-word">${esc(word(c))}</p>`:''}
    <div class="reader-body">${c.paras.map(p=>`<p>${mark(p,c.quotes)}</p>`).join('')}</div>
    ${c.changed?`<div class="reader-box"><small>How he changed me</small><h3>${esc(c.changed[0])}</h3>${c.changed.slice(1).map(p=>`<p>${esc(p)}</p>`).join('')}</div>`:''}
    ${c.first?`<div class="reader-box"><small>First impression</small><p class="reader-first">“${esc(c.first)}”</p><small>Current opinion</small>${c.now.map(p=>`<p>${esc(p)}</p>`).join('')}</div>`:''}
    <nav class="reader-nav"><button class="link" data-read="${(i-1+N)%N}">← ${esc(prev.name)}</button><button class="link" data-read="${(i+1)%N}">${esc(next.name)} →</button></nav>
   </div>
  </div>`,'is-reader');
 }
 document.addEventListener('click',e=>{const b=e.target.closest('[data-read]');if(b)reader(+b.dataset.read);});
 return{CH};
}

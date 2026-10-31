// The display case (Oct 31 2026): after the spiral, the cards he keeps behind glass. Every Secret Rare, Leader and
// Super Rare in his binder stands in a clear graded slab with a label plate, on three shelves of a velvet cabinet:
// the Secret Rares on top under their own spotlights (they sway, slowly), then the Leaders, then the Super Rares by
// colour. The slab leans toward the mouse; tap a slab to hold the card up close (js/tcg.js).
import {$,esc,data,coarse,onSight} from '../core.js';
import {COLORS,face,big,inspect,picturesOf,RNAME} from '../tcg.js';

export function initCase(){
 const sec=$('#case'),T=data.tcg;if(!sec||!T){if(sec)sec.hidden=true;return;}
 const col=c=>COLORS.indexOf(c.colors[0]);
 const by=r=>T.cards.filter(c=>c.rarity===r).sort((a,b)=>col(a)-col(b)||a.no.localeCompare(b.no));
 const SH=[['SEC','Secret Rares','The rarest in the binder',by('SEC')],['L','Leaders','The ones a deck is built around',by('L')],['SR','Super Rares','Holo, every one of them',by('SR')]].filter(s=>s[3].length);
 if(!SH.length){sec.hidden=true;return;}
 // the full-size faces everywhere (the slabs are held up to be looked at); they load as the shelves come near
 const all=SH.flatMap(s=>s[3]),src=big;
 $('#cs-count').innerHTML=SH.map(s=>`<b>${s[3].length}</b> ${s[3].length===1?s[1].replace(/s$/,''):s[1]}`).join(' · ');
 const slab=(c,k)=>`<button class="cs-slab r-${c.rarity.toLowerCase()}" data-k="${all.indexOf(c)}" style="--d:${k*55}ms" aria-label="${esc(c.name)}, ${esc(RNAME[c.rarity]||c.rarity)}">
   <span class="cs-plate"><b>${esc(c.rarity==='L'?'LEADER':c.rarity)}</b><span>${esc(c.name.replace(/\./g,'. ').replace(/"/g,'“').replace(/\s+/g,' '))}</span><small>${esc(c.no)}${c.print?' · '+esc(c.print):''} · ${esc(c.set||'')}</small></span>
   <span class="cs-card">${face(c,{src})}</span><i class="cs-glass" aria-hidden="true"></i></button>`;
 $('#cs-cab').innerHTML=SH.map(([r,name,line,list])=>`<section class="cs-shelf s-${r.toLowerCase()}"><header><p class="eyebrow">${esc(name)}</p><span>${esc(line)} · ${list.length}</span></header><div class="cs-row">${r==='SEC'?'<i class="cs-spot" aria-hidden="true"></i>':''}${list.map(slab).join('')}</div><i class="cs-board" aria-hidden="true"></i></section>`).join('');
 // each shelf lights up as it comes into view
 sec.querySelectorAll('.cs-shelf').forEach(s=>onSight(s,()=>s.classList.add('lit'),'0px 0px -15% 0px'));
 const cab=$('#cs-cab');
 cab.addEventListener('click',e=>{const b=e.target.closest('.cs-slab');if(b)inspect(all,+b.dataset.k,{group:'The display case',col:c=>picturesOf(c.char)});});
 if(!coarse)cab.addEventListener('pointermove',e=>{const b=e.target.closest('.cs-slab');if(!b)return;
  const r=b.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;b.style.setProperty('--ry',(x*16).toFixed(2)+'deg');b.style.setProperty('--rx',(-y*12).toFixed(2)+'deg');});
 cab.addEventListener('pointerout',e=>{const b=e.target.closest('.cs-slab');if(b&&!b.contains(e.relatedTarget)){b.style.removeProperty('--ry');b.style.removeProperty('--rx');}});
}

// 08 · The Card Vault as a turning ring: the twelve cards stand in a circle in 3D, and scrolling turns
// the ring so each one comes round to face you (one rotateY on the ring; the cards never repaint).
// Mouse over the front card and its foil catches the light.
import {$,esc,clamp,smooth,view,part,pinned,motion,data,coarse} from '../core.js';
import {openDialog} from '../dialogs.js';

export function initCards(){
 const cards=data.archive.cards,N=cards.length,ring=$('#ring'),info=$('#ring-info'),sec=$('#vault');
 ring.innerHTML=cards.map((c,i)=>`<button class="rcard" data-card="${i}" style="--a:${(i*360/N).toFixed(3)}deg" aria-label="${esc(`${c.number} ${c.name}, ${c.rarity}${c.variant?', '+c.variant:''}. Open details`)}">${c.image?`<img src="${esc(c.image)}" alt="" loading="lazy" decoding="async">`:`<span class="ph"><b>${esc(c.name)}</b></span>`}<i class="foil" aria-hidden="true"></i></button>`).join('');
 $('#decks').innerHTML=data.archive.decks.map(d=>`<div class="deck"><small>${esc(d.color)} starter deck</small><b>${esc(d.name)}</b></div>`).join('');
 const els=[...ring.children];
 new IntersectionObserver(([e],io)=>{if(e.isIntersecting){ring.querySelectorAll('img').forEach(i=>{i.loading='eager';i.decode?.().catch(()=>{});});io.disconnect();}},{rootMargin:'150% 0px'}).observe(sec);
 let R=400,front=-1;
 part({el:sec,measure(){const w=els[0].offsetWidth||200;R=Math.round((w*1.18)/(2*Math.tan(Math.PI/N)));ring.style.setProperty('--R',R+'px');},update(s){
  const p=motion.reduced?0:pinned(this,s),x=clamp(p*1.06-0.03)*(N-1);
  ring.style.transform=`translateZ(${-R}px) rotateY(${(-x*360/N).toFixed(3)}deg)`;
  const k=Math.round(x)%N;
  if(k!==front){front=k;els.forEach((el,i)=>el.classList.toggle('front',i===k));const c=cards[k];info.innerHTML=`<b>${esc(c.name)}</b><span>${esc(c.number)} · ${esc(c.rarity)}${c.variant?' · '+esc(c.variant):''} · Entry ${c.entry} of ${N}</span>`;}
 }});
 if(!coarse)ring.addEventListener('pointermove',e=>{const el=e.target.closest('.rcard.front');if(!el)return;const r=el.getBoundingClientRect();el.style.setProperty('--mx',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');el.style.setProperty('--my',((e.clientY-r.top)/r.height*100).toFixed(1)+'%');});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-card]');if(!b)return;const c=cards[+b.dataset.card],u='<em>Not recorded</em>';
  openDialog(`<div class="rec-layout">${c.image?`<img src="${esc(c.image)}" alt="${esc(c.number)} catalog artwork" style="aspect-ratio:5/7;object-fit:contain">`:''}<div><p class="eyebrow">Card Vault · Entry ${c.entry} of ${N}</p><h2 id="dialog-title">${esc(c.name)}</h2><div class="list"><div><strong>Card number</strong><span>${esc(c.number)}</span></div><div><strong>Rarity / type</strong><span>${esc(c.rarity)}</span></div><div><strong>Variant</strong><span>${esc(c.variant||'Not specified')}</span></div><div><strong>Quantity</strong><span>${u}</span></div><div><strong>Language · Condition</strong><span>${u}</span></div><div><strong>Purchase · Value</strong><span>${u}</span></div></div>${c.imageNote?`<p class="subtle" style="margin-top:18px">${esc(c.imageNote)}</p>`:''}${c.variant==='Alternate Art / Parallel'?'<p class="subtle">This is the Parallel (alternate art) printing of OP14-112, shown separately from the regular one.</p>':''}</div></div>`);});
}

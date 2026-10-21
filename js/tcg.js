// His One Piece cards (data/tcg.json): shared by the Card Vault spiral (s/cards.js) and the Card Table
// (s/table.js). Faces are the official card images (DON!! cards: his own photos); the foil on each one
// follows the card's real rarity. Opening a card shows it big, tilting under the mouse or the
// phone, with everything printed on it; the archive remembers which cards you've held up close.
import {esc,clamp,coarse,motion,data} from './core.js';
import {openDialog,dialogBody} from './dialogs.js';
import {onTilt} from './tilt.js';
import {once,earn} from './bounty.js';

export const big=c=>`assets/tcg/${c.id}.webp`,small=c=>`assets/tcg/s/${c.id}.webp`;
export const COLORS=['Red','Green','Blue','Purple','Black','Yellow'];
export const HUE={Red:'#e2412f',Green:'#1f9a6a',Blue:'#2b86d6',Purple:'#8b4fc4',Black:'#6d7178',Yellow:'#f0c531','DON!!':'#c8922f'};
export const RNAME={L:'Leader',SR:'Super Rare',R:'Rare',UC:'Uncommon',C:'Common',P:'Promo',DON:'DON!!'};
// how the foil behaves: parallels and special frames are full rainbow, leaders and SRs holo, Rares a silver sheen
export const tier=c=>c.kind==='DON'?'don':c.print?'alt':c.rarity==='L'?'lead':c.rarity==='SR'?'sr':c.rarity==='R'||c.rarity==='P'?'r':'c';
const RANK={alt:6,lead:5,sr:4,r:3,c:1,don:0};
export const rank=c=>RANK[tier(c)]*10+(c.rarity==='UC'?1:0);
export const hue=c=>HUE[c.colors[0]]||HUE['DON!!'];
export const label=c=>c.kind==='DON'?'DON!!':`${c.no} · ${RNAME[c.rarity]||c.rarity}${c.print?' · '+c.print:''}`;

// one card face: the picture, a foil layer and a glare that follow the light (--mx/--my)
export const face=(c,{src=small,lazy=true}={})=>`<span class="tgf t-${tier(c)}" style="--hue:${hue(c)}"><img${src(c)?` src="${src(c)}"`:''} alt="" decoding="async"${lazy?' loading="lazy"':''}><i class="tgf-foil" aria-hidden="true"></i><i class="tgf-glare" aria-hidden="true"></i></span>`;
// point the light at (x,y) on a face element
export function light(el,x,y){const r=el.getBoundingClientRect();if(!r.width)return;el.style.setProperty('--mx',(clamp((x-r.left)/r.width)*100).toFixed(1)+'%');el.style.setProperty('--my',(clamp((y-r.top)/r.height)*100).toFixed(1)+'%');}

/* ---------------------------------------------------------------- held up close */
const SEEN='grand-archive:tcg-seen';
let seen=new Set();try{seen=new Set(JSON.parse(localStorage.getItem(SEEN)||'[]'));}catch{}
const subs=new Set();
export const onSeen=fn=>{subs.add(fn);fn(seen);};
export const seenCount=()=>seen.size;
function markSeen(c){
 if(seen.has(c.id))return;seen.add(c.id);try{localStorage.setItem(SEEN,JSON.stringify([...seen]));}catch{}
 earn(500000,null,{quiet:true});
 const all=data.tcg.cards.length;
 if(seen.size>=10)once('tcg:10',5e6,'Ten cards, held up close');
 if(seen.size>=all)once('tcg:all',30e6,'Every card in the binder, held');
 subs.forEach(f=>f(seen));
}

/* ---------------------------------------------------------------- one card, up close */
let ctx=null;
const stat=(k,v)=>v==null?'':`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`;
// list = the cards you can step through with ‹ › (the pile, the row, the spiral), i = where to start
export function inspect(list,i,{group,col}={}){
 ctx={list,i,group,col};render();
}
function render(){
 const {list,i,group,col}=ctx,c=list[i],n=list.length,all=data.tcg.cards,no=all.indexOf(c)+1;
 markSeen(c);
 const pics=col&&col(c);
 openDialog(`<div class="ti" style="--hue:${hue(c)}">
  <div class="ti-stage"><div class="ti-card">${face(c,{src:big,lazy:false})}</div></div>
  <div class="ti-info">
   <p class="eyebrow">${group?esc(group)+' · ':''}${n>1?`${i+1} of ${n}`:'The Card Vault'}</p>
   <h2 id="dialog-title">${esc(c.name)}</h2>
   <p class="ti-sub"><span class="ti-r t-${tier(c)}">${esc(RNAME[c.rarity]||c.rarity)}</span>${esc(c.kind==='DON'?c.print:c.no)}${c.print&&c.kind!=='DON'?` · ${esc(c.print)}`:''}</p>
   ${c.colors.length?`<p class="ti-cols">${c.colors.map(k=>`<span><i style="background:${HUE[k]}"></i>${k}</span>`).join('')}<span>${esc(c.kind)}</span></p>`:''}
   <dl class="ti-stats">${stat(c.kind==='Leader'?'Life':'Cost',c.cost)}${stat('Power',c.power?.toLocaleString('en-US'))}${stat('Counter',c.counter?'+'+c.counter.toLocaleString('en-US'):null)}${stat('Attribute',c.attr)}</dl>
   ${c.types?`<p class="ti-types">${esc(c.types.replace(/\//g,' · '))}</p>`:''}
   ${c.effect?`<p class="ti-fx">${esc(c.effect).replace(/\n/g,'<br>')}</p>`:''}
   ${c.trigger?`<p class="ti-fx"><b>Trigger</b> ${esc(c.trigger)}</p>`:''}
   <p class="ti-set">${c.kind==='DON'?'A DON!! card':`From <b>${esc(c.set)}</b>${c.setCode&&c.setCode!=='P'?` (${esc(c.setCode)})`:''}`}</p>
   <div class="ti-acts">${n>1?'<button class="ti-nav" data-ti="-1" aria-label="Previous card">‹</button><button class="ti-nav" data-ti="1" aria-label="Next card">›</button>':''}${pics?`<button class="link" data-collection="${pics.key}">My pictures of ${esc(pics.name)} (${pics.n}) →</button>`:''}</div>
   <p class="fine ti-note">Card ${no} of ${all.length} in my binder${c.kind==='DON'?', from my own photo':' · official card image'}.</p>
  </div></div>`,'is-card');
 dialogBody.parentElement.style.setProperty('--hue',hue(c));
 const card=dialogBody.querySelector('.ti-card'),f=card.querySelector('.tgf');
 // it arrives with a half turn, like a card being flipped into your hand
 if(!motion.reduced){card.classList.add('in');setTimeout(()=>card.classList.remove('in'),900);}
 const tilt=(mx,my)=>{card.style.setProperty('--rx',((mx-0.5)*24).toFixed(2)+'deg');card.style.setProperty('--ry',((0.5-my)*18).toFixed(2)+'deg');f.style.setProperty('--mx',(mx*100).toFixed(1)+'%');f.style.setProperty('--my',(my*100).toFixed(1)+'%');};
 tilt(0.62,0.3);
 if(!coarse)dialogBody.querySelector('.ti-stage').onpointermove=e=>{const r=card.getBoundingClientRect();tilt(clamp((e.clientX-r.left)/r.width),clamp((e.clientY-r.top)/r.height));};
 ctx.tilt=tilt;
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-ti]');if(!b||!ctx)return;step(+b.dataset.ti);});
function step(d){if(!ctx||!dialogBody.querySelector('.ti'))return;ctx.i=(ctx.i+d+ctx.list.length)%ctx.list.length;render();}
addEventListener('keydown',e=>{if(!dialogBody.querySelector('.ti'))return;if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1);});
let sx=null;
dialogBody.addEventListener('touchstart',e=>{if(e.target.closest('.ti-stage'))sx=e.touches[0].clientX;},{passive:true});
dialogBody.addEventListener('touchend',e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>50)step(dx<0?1:-1);},{passive:true});
onTilt(t=>{if(ctx?.tilt&&dialogBody.querySelector('.ti'))ctx.tilt(clamp(0.5+t.x*0.6),clamp(0.5+t.y*0.6));});

// his own pictures of whoever is on the card (the Character Log, the crew collections, the supporting cast)
export function picturesOf(name){
 const M=data.media;if(!M)return null;
 const alias={'Five Elders':null,'DON!!':null,Hancock:'Hancock',Law:'Law'};const n=name in alias?alias[name]:name;if(!n)return null;
 const ci=M.characters.findIndex(x=>x.home===n);if(ci>=0)return{key:`tcgc:c${ci}`,name:n,n:M.characters[ci].all.length};
 const cr=M.crew.findIndex(x=>x.name===n);if(cr>=0)return{key:`tcgc:k${cr}`,name:n,n:M.crew[cr].all.length};
 const s=(M.supporting||[]).findIndex(x=>x.name===n);if(s>=0)return{key:`tcgc:s${s}`,name:n,n:M.supporting[s].all.length};
 return null;
}
export function collectionFor(k){const M=data.media,t=k[0],i=+k.slice(1);const x=t==='c'?M.characters[i]:t==='k'?M.crew[i]:M.supporting[i];return{title:x.home||x.name,eyebrow:'From the Card Table',ids:x.all};}

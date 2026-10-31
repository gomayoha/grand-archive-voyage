// Worlds of their own (#spaces, Oct 31 2026): the way into the anime spaces (js/spaces.js). Three volumes on
// the page, each dressed as its own world: a sealed letter (Violet Evergarden), a loop counter (Re:Zero) and a
// system window (Omniscient Reader). Tap one and its room opens; [data-space] anywhere opens one too.
import {$,esc,data,TH,FU,onSight} from '../core.js';
import {openSpace} from '../bounty.js';

const GATES=[
 {k:'violet',board:'violet-evergarden',cover:1,title:'Violet <em>Evergarden.</em>',kick:'A story told in letters',line:'A girl raised as a weapon learns what three words mean, one letter at a time.',shelf:['anime','Violet Evergarden'],cards:10},
 {k:'rezero',board:'re-zero',cover:8,title:'Re:<em>Zero.</em>',kick:'Return by Death',line:'A boy with no power, and a curse that brings him back every time he dies. Nobody else remembers.',shelf:['anime','Re:Zero'],cards:10},
 {k:'orv',board:'omniscient-readers-viewpoint',cover:11,title:'Omniscient Reader\'s <em>Viewpoint.</em>',kick:'The Fourth Wall',line:'The only reader of a novel nobody else read, the day it starts coming true.',shelf:['manga','Omniscient Reader'],cards:8}
];

export function initSpaces(){
 const box=$('#sp-gates');if(!box)return;
 let st={};try{st=JSON.parse(localStorage.getItem('grand-archive:spaces')||'{}');}catch{}
 const have=k=>Object.keys(st.cards||{}).filter(id=>id.startsWith({violet:'VE-',rezero:'RZ-',orv:'ORV-'}[k])).length;
 const rec=g=>(data.shelf?.[g.shelf[0]]||[]).find(r=>r.t===g.shelf[1])||{};
 const badge=g=>{const r=rec(g);return g.k==='orv'?`[Chapter ${esc(String(r.chapter||'').replace(/\D/g,'')||'?')}]`:g.k==='rezero'?`Loop ${(st.loops||{}).rezero||0}`:r.s?`${esc(r.s)} / 10`:'';};
 const paint=pins=>{box.innerHTML=GATES.map(g=>{const id=(pins[g.board]?.pins||[])[g.cover]?.id;return `<button class="sg sg-${g.k}" data-space="${g.k}" aria-label="Open ${esc(g.title.replace(/<[^>]+>/g,''))}">
   <span class="sg-pic">${id?`<img src="${TH(id)}" srcset="${TH(id)} 720w, ${FU(id)} 1800w" sizes="(max-width:820px) 92vw, 32vw" alt="" loading="lazy" decoding="async">`:''}</span>
   <span class="sg-badge">${badge(g)}</span>${g.k==='violet'?'<i class="sg-seal" aria-hidden="true"></i>':''}
   <span class="sg-copy"><small>${esc(g.kick)}</small><b>${g.title}</b><span>${esc(g.line)}</span><em>Enter <i aria-hidden="true">→</i> <u>${have(g.k)} / ${g.cards} cards</u></em></span>
  </button>`;}).join('');};
 paint({});
 onSight($('#spaces'),()=>fetch('data/spaces.json').then(r=>r.json()).then(paint).catch(()=>{}),'0px 0px 150% 0px');
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-space]');if(b){e.preventDefault();openSpace(b.dataset.space);}});

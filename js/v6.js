// V6 chrome: the page is seven Books. Every chapter gets a catalogue number (II·03), the bar names the chapter
// you are in (click = Log Pose), and on laptops a rail of the seven Books runs down the left edge.
import {$,part,absTop,jumpTo,view,pad,data,onSight} from './core.js';

export const BOOKS=[
 ['','Prologue',['home','helm']],
 ['I','The Crew',['characters','strawhats','closer','crew']],
 ['II','The Sea',['depths','voyage','moments']],
 ['III','The Ink',['spreads','panels','story-show']],
 ['IV','The Record',['journey','top','records','collection','logbook']],
 ['V','Other Worlds',['spaces','worlds','orv']],
 ['VI','The Cards',['vault','case','table']],
 ['VII','What Stays',['scenes','library','sky','life','outro']],
];
const NAME={home:'The archive, opened',helm:'Where to, captain?',characters:'The Character Log',strawhats:'The Straw Hat Pirates',closer:'Look closer',crew:'Wanted',depths:'Between the sky and the sea',voyage:'The Voyage',moments:'Moments that live in my head',spreads:'Colour spreads',panels:'Between the panels','story-show':'The Story of One Piece',journey:'The Anime Journey',top:'My top ten',records:'The Shelf',collection:'Books I can hold',logbook:'The Logbook',spaces:'Worlds of their own',worlds:'Other worlds',orv:'The Star Stream',vault:'The Card Vault',case:'The display case',table:'The Card Table',scenes:'Scenes that stay',library:'The Ohara Library',sky:'The night sky',life:'Book II',outro:'The last page'};

export function initV6(){
 const bar=$('#bar');if(!bar)return;
 // catalogue numbers on every chapter's eyebrow
 const secs=[];
 BOOKS.forEach(([rom,book,ids],b)=>ids.forEach((id,j)=>{
  const el=document.getElementById(id);if(!el)return;
  secs.push({id,el,b,rom,book});
  if(!rom)return;
  const eb=el.querySelector('.eyebrow,.ink-kicker');if(eb)eb.dataset.no=`${rom}·${pad(j+1)}`;
 }));
 // the bar: where you are
 const now=document.createElement('button');now.className='bar-now';now.type='button';now.title='Log Pose: every chapter';
 now.innerHTML='<i></i><b></b>';bar.insertBefore(now,bar.querySelector('.bar-toggles'));
 now.addEventListener('click',()=>$('#logpose-btn')?.click());
 // the rail: one stroke per Book, as long as the Book is
 const rail=document.createElement('nav');rail.className='v6-rail';rail.setAttribute('aria-label','Books');
 rail.innerHTML=BOOKS.slice(1).map(([rom,book])=>`<button type="button" aria-label="Book ${rom}: ${book}"><span>${rom} · ${book}</span></button>`).join('');
 document.body.appendChild(rail);
 const segs=[...rail.children];
 segs.forEach((s,i)=>s.addEventListener('click',()=>{const f=secs.find(x=>x.b===i+1&&!x.el.hidden);if(f)jumpTo(absTop(f.el));}));
 let cur=null,curB=-1;
 part({always:true,
  measure(){
   this.z=secs.filter(s=>!s.el.hidden&&s.el.offsetHeight).map(s=>({...s,top:absTop(s.el),h:s.el.offsetHeight}));
   this.bk=BOOKS.map((_,b)=>{const z=this.z.filter(s=>s.b===b);return z.length?[z[0].top,z[z.length-1].top+z[z.length-1].h]:null;});
   segs.forEach((s,i)=>{const r=this.bk[i+1];s.style.flexGrow=r?Math.max(1,(r[1]-r[0])/1000).toFixed(2):0;s.hidden=!r;});
  },
  update(s){
   if(!this.z)return;
   const y=s+view.vh*.45;let at=this.z[0];for(const z of this.z)if(y>=z.top)at=z;
   if(at.id!==cur){
    cur=at.id;
    now.querySelector('i').textContent=at.rom?`Book ${at.rom}`:at.book;now.querySelector('b').textContent=NAME[at.id]||'';
    now.classList.toggle('on',at.id!=='home');now.classList.remove('swap');void now.offsetWidth;now.classList.add('swap');
    rail.classList.toggle('on',at.b>0);
    if(at.b!==curB){curB=at.b;segs.forEach((g,i)=>g.classList.toggle('cur',i+1===at.b));}
   }
   segs.forEach((g,i)=>{const r=this.bk[i+1];if(!r)return;const p=Math.max(0,Math.min(1,(y-r[0])/(r[1]-r[0])));const v=p.toFixed(3);if(g._p!==v){g._p=v;g.style.setProperty('--p',v);}});
  }});
 colophon();
}

// The last page, like the back of an art book: what the archive holds today, counted from the data itself.
function colophon(){
 const box=$('#co-nums');if(!box)return;
 const sh=data.shelf||{},done=k=>(sh[k]||[]).filter(a=>a.status==='completed'||a.status==='finished').length;
 const rows=[[Object.keys(data.media?.img||{}).length,'pictures kept'],[(data.characters?.characters||[]).length,'character records'],[done('anime'),'anime finished'],[done('manga'),'manga finished'],[(data.tcg?.cards||data.tcg||[]).length,'cards in the binder'],[(sh.tv||[]).length,'shows logged']].filter(r=>r[0]>0);
 box.innerHTML=rows.map(([n,l])=>`<div><dt>${l}</dt><dd data-n="${n}">0</dd></div>`).join('');
 onSight(box,()=>box.querySelectorAll('dd').forEach((d,i)=>{const n=+d.dataset.n,t0=performance.now()+i*90;const tick=t=>{const p=Math.max(0,Math.min(1,(t-t0)/1100)),e=1-Math.pow(1-p,3);d.textContent=Math.round(n*e).toLocaleString('en');if(p<1)requestAnimationFrame(tick);};requestAnimationFrame(tick);}));
}

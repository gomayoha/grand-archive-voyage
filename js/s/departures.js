// Departures (Nov 2026). The other worlds are destinations beyond the Grand Line, so the section is a harbour's
// departures hall: a split-flap board lists every world (letters clatter into place), and beside it a rotating
// billboard of three-sided slats turns in a wave to show the world you are about to leave for. Scroll calls the
// next departure; tap the sign, a row or "Step through" to open that world's pictures. Motion Off keeps the doors.
import {$,data,part,pinned,view,motion,follower,clamp,smooth,esc,pad,FU,dims,lite} from '../core.js';

const GLYPH='ABCDEFGHIJKLMNOPQRSTUVWXYZ&:\' ';
const CELLS=18;

export function initDepartures(){
 const sec=$('#dep'),sign=$('#dep-sign'),board=$('#dep-rows'),now=$('#dep-now'),meta=$('#dep-meta'),go=$('#dep-go'),ticks=$('#dep-ticks');
 const W=data.media?.worlds||[],N=W.length;if(!sec||!sign||!N)return;
 sec.style.height=`${100+N*72}svh`;
 const cells=t=>{const s=t.toUpperCase().slice(0,CELLS).padEnd(CELLS,' ');return [...s].map(c=>`<i>${c===' '?'&nbsp;':esc(c)}</i>`).join('');};
 board.innerHTML=W.map((w,i)=>`<button class="dp-row" data-collection="world:${i}" aria-label="${esc(w.name)}, ${esc(w.series)}: ${w.all.length} pictures"><span class="dp-no">${pad(i+1)}</span><span class="dp-dest"><span class="dp-name fl" data-t="${esc(w.name)}">${cells('')}</span><span class="dp-from">${esc(w.series)}</span></span><span></span><span class="dp-n">${w.all.length}</span><span class="dp-st"></span></button>`).join('');
 now.innerHTML=cells('');ticks.innerHTML=W.map(()=>'<i></i>').join('');
 const rows=[...board.children];
 // one letter cell flips through a couple of wrong letters before it settles, like a Solari board
 function flap(el,text,gap=26){
  const want=[...text.toUpperCase().slice(0,CELLS).padEnd(CELLS,' ')];
  [...el.children].forEach((c,j)=>{
   const cur=c.textContent===' '?' ':c.textContent;if(cur===want[j])return;
   const seq=[GLYPH[(j*7+want[j].charCodeAt(0))%GLYPH.length],GLYPH[(j*13+5)%GLYPH.length],want[j]];
   seq.forEach((ch,k)=>setTimeout(()=>{c.textContent=ch===' '?' ':ch;c.classList.remove('f');void c.offsetWidth;c.classList.add('f');},j*gap+k*85));
  });
 }
 // the rotating sign: slats with three faces each
 let n,slats=[],SW,SH,built='';
 function build(){
  const phone=view.vw<=820;n=phone?8:12;
  const r=sign.getBoundingClientRect();SW=Math.round(sign.offsetWidth);SH=Math.round(sign.offsetHeight);if(!SW||!SH)return;
  const key=`${n}:${SW}:${SH}`;if(key===built)return;built=key;
  const w=SW/n,rad=w*0.2887;
  sign.innerHTML=Array.from({length:n},(_,i)=>`<div class="dp-s" style="left:${(i*w).toFixed(2)}px;width:${(w+.6).toFixed(2)}px"><b style="transform:rotateY(0deg) translateZ(${rad.toFixed(2)}px)"></b><b style="transform:rotateY(120deg) translateZ(${rad.toFixed(2)}px)"></b><b style="transform:rotateY(240deg) translateZ(${rad.toFixed(2)}px)"></b></div>`).join('')+'<span class="dp-glint" aria-hidden="true"></span>';
  slats=[...sign.querySelectorAll('.dp-s')].map((el,i)=>({el,i,f:[...el.children],on:[-1,-1,-1],rad,w}));
 }
 function paint(sl,face,world){
  if(sl.on[face]===world)return;sl.on[face]=world;const b=sl.f[face];
  if(world<0||world>=N){b.style.backgroundImage='none';return;}
  const id=W[world].cover,[iw,ih]=dims(id),sc=Math.max(SW/iw,SH/ih),bw=iw*sc,bh=ih*sc;
  b.style.backgroundImage=`url(${FU(id)})`;b.style.backgroundSize=`${bw.toFixed(1)}px ${bh.toFixed(1)}px`;
  b.style.backgroundPosition=`${(-(sl.i*sl.w)-(bw-SW)/2).toFixed(1)}px ${(-(bh-SH)*0.3).toFixed(1)}px`;
 }
 let cur=-1,lit=false;
 function render(u){
  if(!slats.length)return;
  const x=clamp(u*1.04-0.02)*(N-1),j=Math.min(N-2,Math.floor(x)),fr=x-j,t=clamp((fr-0.28)/0.5);
  for(const sl of slats){
   const local=smooth(clamp(t*1.6-(sl.i/(n-1))*0.6)),v=j+local,f0=Math.floor(v+1e-6);
   paint(sl,((f0%3)+3)%3,f0);paint(sl,(((f0+1)%3)+3)%3,f0+1);
   if(local<0.02||local>0.98)paint(sl,(((f0+2)%3)+3)%3,f0+2);
   sl.el.style.transform=`translateZ(${(-sl.rad).toFixed(2)}px) rotateY(${(-v*120).toFixed(2)}deg)`;
  }
  const k=Math.min(N-1,Math.round(x+0.02));
  if(k!==cur&&lit){cur=k;const w=W[k];
   rows.forEach((r,i)=>{r.classList.toggle('on',i===k);r.querySelector('.dp-st').textContent=i===k?'Boarding':i<k?'Departed':'On time';});
   flap(now,w.name,22);meta.innerHTML=`<b>${pad(k+1)} / ${pad(N)}</b><span>${esc(w.series)}</span>`;
   go.dataset.collection=`world:${k}`;go.innerHTML=`Step through · ${w.all.length} pictures <i aria-hidden="true">→</i>`;sign.dataset.collection=`world:${k}`;
   [...ticks.children].forEach((t,i)=>t.classList.toggle('on',i===k));
  }
 }
 const f=follower(110);
 const p=part({el:sec,measure(){build();},update(s){if(motion.reduced)return;f.target=pinned(this,s);if(f.v!==null&&Math.abs(f.target-f.v)>0.3)f.v=f.target;render(f.step(view.t));}});
 // the board fills in when the hall comes into view
 new IntersectionObserver(([e])=>{sec.classList.toggle('live',e.isIntersecting);if(e.isIntersecting&&!lit&&!motion.reduced){lit=true;build();rows.forEach((r,i)=>setTimeout(()=>flap(r.querySelector('.dp-name'),r.querySelector('.dp-name').dataset.t,lite?12:20),i*110));cur=-1;render(f.v??0);}},{rootMargin:'0px 0px -30% 0px'}).observe(sec);
}

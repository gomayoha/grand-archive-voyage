// 00 · Opening. His own confession from "Anime Journey": "Anime is for losers." A red ink stroke
// crosses it out as you scroll, "I was completely wrong" takes its place, and the wall of every story
// he has rated since rises up behind the counter, until the archive's name settles over it.
import {$,esc,clamp,smooth,ease,band,lerp,view,part,pinned,motion,data} from '../core.js';

export function initOpening(){
 const sec=$('#home'),wall=$('#op-wall'),shade=$('#op-shade'),confess=$('#op-confess'),quote=confess.querySelector('.op-quote span'),strike=$('#op-strike');
 const wrong=$('#op-wrong'),count=$('#op-count'),title=$('#op-title'),cue=$('#op-cue');
 const {posters,shelf}=data;

 // Every record that has cover art, the ones he rated highest first so the wall opens on favourites.
 const seen=new Set(),covers=[];
 const score=s=>{const n=parseFloat(s);return isNaN(n)?-1:n;};
 // Anime and manga lead, interleaved; live action fills in after.
 const byScore=k=>shelf[k].map(r=>({...r,k})).sort((a,b)=>score(b.s)-score(a.s));
 const A=byScore('anime'),Mg=byScore('manga'),mix=[];for(let i=0;i<Math.max(A.length,Mg.length);i++){if(A[i])mix.push(A[i]);if(i%2===0&&Mg[i/2])mix.push(Mg[i/2]);}Mg.slice(Math.ceil(A.length/2)).forEach(r=>mix.includes(r)||mix.push(r));
 [...mix,...byScore('tv')].forEach(r=>{const p=posters[`${r.k}:${r.t}`];if(p&&!seen.has(p.img)){seen.add(p.img);covers.push(p.img);}});
 const cols=()=>view.vw<view.vh?5:9;
 function buildWall(){
  const n=cols(),rows=Math.ceil(Math.min(covers.length,n*14)/n),list=[];
  for(let i=0;i<n*rows;i++)list.push(covers[i%covers.length]);
  wall.style.setProperty('--cols',n);wall.dataset.cols=n;
  wall.innerHTML=list.map((src,i)=>`<span class="op-post" style="--d:${(i%n)*0.03}s"><img data-src="${esc(src)}" alt="" decoding="async"></span>`).join('');
 }
 buildWall();
 // The wall sits inside a 3D plane where lazy-loading can't see it; fill it in once the page is idle.
 const fill=()=>wall.querySelectorAll('img[data-src]').forEach((im,i)=>setTimeout(()=>{im.src=im.dataset.src;im.removeAttribute('data-src');im.decode?.().catch(()=>{});},i*12));
 const later=()=>('requestIdleCallback' in window?requestIdleCallback(fill,{timeout:1500}):setTimeout(fill,600));
 document.readyState==='complete'?later():addEventListener('load',later,{once:true});

 const counts=[[shelf.anime.length,'anime'],[shelf.manga.length,'manga'],[shelf.tv.length,'live-action shows']];
 count.innerHTML=`<p class="eyebrow">Since then</p><div class="op-nums">${counts.map(([n,l])=>`<div><b data-n="${n}">0</b><span>${l}</span></div>`).join('')}</div><p class="op-sub">rated, finished, dropped, waiting. Every one of them is in here.</p>`;
 const nums=[...count.querySelectorAll('b')];

 const show=(el,o,y=0,s=1)=>{el.style.opacity=o.toFixed(3);el.style.visibility=o<0.003?'hidden':'visible';el.style.transform=`translate3d(0,${y.toFixed(1)}px,0) scale(${s.toFixed(4)})`;};
 part({el:sec,measure(){if(String(cols())!==wall.dataset.cols){buildWall();fill();}},update(s){
  const p=motion.reduced?1:pinned(this,s),vh=view.vh;
  // beat 1: the confession, crossed out
  const st=smooth(clamp((p-0.05)/0.14));strike.style.strokeDashoffset=(1-st).toFixed(4);
  quote.style.opacity=(1-st*0.55).toFixed(3);
  const c1=1-smooth(clamp((p-0.22)/0.1));show(confess,c1,-(1-c1)*vh*0.18,1-(1-c1)*0.04);
  // beat 2: I was completely wrong.
  const w=band(p,0.24,0.38,0.07);show(wrong,w,(1-w)*(p<0.31?40:-40),0.94+0.06*w);
  // beat 3: the wall of everything since, and the counter
  const rise=clamp((p-0.28)/0.62);
  wall.style.transform=`translate3d(-50%,${lerp(vh*0.55,-wall.offsetHeight*0.42,ease(rise)).toFixed(1)}px,0)`;
  const wo=smooth(clamp((p-0.28)/0.12));
  shade.style.opacity=(0.3+0.45*smooth(clamp((p-0.42)/0.08))+0.15*smooth(clamp((p-0.68)/0.1))).toFixed(3);
  wall.parentElement.style.opacity=wo.toFixed(3);
  const k=band(p,0.46,0.64,0.07);show(count,k,(1-k)*(p<0.55?40:-40));
  const ct=ease(clamp((p-0.46)/0.14));nums.forEach(b=>{const v=Math.round(+b.dataset.n*ct);if(b._v!==v){b._v=v;b.textContent=v;}});
  // beat 4: the archive
  const t=smooth(clamp((p-0.72)/0.12));show(title,t,(1-t)*50,0.95+0.05*t);
  cue.style.opacity=(1-smooth(clamp(p/0.04))).toFixed(3);
 }});
}

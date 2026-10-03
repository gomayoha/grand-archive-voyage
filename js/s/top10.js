// 07 · My current top 10, as a countdown. Ten scroll steps from #10 to #1: each title rises in with its
// cover and his reason (from his note's table, word for word); the backdrop takes the cover's colour.
// #1 gets the crown.
import {$,esc,clamp,smooth,view,part,pinned,motion,data} from '../core.js';

const normT=t=>String(t).toLowerCase().replace(/×/g,'x').replace(/[^a-z0-9]/g,'');
export function initTop10(){
 const {shelf,posters}=data,sec=$('#top'),stage=$('#top-stage'),bg=$('#top-bg');
 const anime=shelf.anime,list=shelf.top10.map((a,i)=>{
  const it=anime.find(x=>normT(x.t)===normT(a.title))||anime.find(x=>normT(a.title).includes(normT(x.t))||normT(x.t).includes(normT(a.title)))||{t:a.title};
  const p=posters[`anime:${it.t}`]||posters[`manga:${it.t}`];
  return{rank:i+1,title:a.title,why:a.body,score:it.s,img:p&&p.img,color:(p&&p.color)||'#333'};
 }).reverse();
 const N=list.length;
 stage.innerHTML=list.map(t=>`<div class="tt${t.rank===1?' first':''}" style="--c:${t.color}">
  <span class="tt-rank" aria-hidden="true">${t.rank}</span>
  <figure class="tt-poster">${t.img?`<img src="${esc(t.img)}" alt="${esc(t.title)} cover" loading="lazy" decoding="async">`:''}${t.rank===1?'<span class="tt-crown" aria-hidden="true">👑</span>':''}</figure>
  <div class="tt-copy"><p class="tt-label">#${t.rank}${t.score&&/^\d/.test(t.score)?` · ${esc(t.score)}/10`:''}</p><h3>${esc(t.title)}</h3><p class="tt-why">${esc(t.why)}</p></div>
 </div>`).join('');
 const items=[...stage.children];
 new IntersectionObserver(([e],io)=>{if(e.isIntersecting){stage.querySelectorAll('img').forEach(i=>{i.loading='eager';i.decode?.().catch(()=>{});});io.disconnect();}},{rootMargin:'150% 0px'}).observe(sec);
 sec.style.height=`${100+N*60}svh`;
 let cur=-1;
 part({el:sec,update(s){
  const p=motion.reduced?1:pinned(this,s),raw=clamp(p*1.04-0.02)*(N-1),fl=Math.floor(raw);
  const x=raw;
  items.forEach((el,i)=>{
   const d=i-x,a=Math.abs(d);
   if(a>1.2){if(el._v){el._v=0;el.style.visibility='hidden';}return;}
   if(!el._v){el._v=1;el.style.visibility='visible';}
   const o=1-smooth(clamp((a-0.04)/0.42));
   el.style.opacity=o.toFixed(3);
   el.style.transform=`translate3d(0,${(d*view.vh*0.55).toFixed(1)}px,0) scale(${(1-a*0.1).toFixed(4)})`;
  });
  const k=Math.round(x);if(k!==cur){cur=k;bg.style.setProperty('--c',list[k].color);sec.classList.toggle('crowned',list[k].rank===1);}
 }});
}

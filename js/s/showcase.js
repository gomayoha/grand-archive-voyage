// The One Piece story, shown off on the main page: a short trailer you scroll through. The eleven saga
// spreads cross-fade behind, the saga name changes and Luffy's bounty climbs the way it does in the story,
// then the door: "Open the story". (The story itself lives on its own page, story.html.)
import {$,esc,clamp,smooth,view,part,pinned,motion,FU,onSight} from '../core.js';

export async function initShowcase(){
 const sec=$('#story-show');if(!sec)return;
 const story=await fetch('data/story.json').then(r=>r.ok?r.json():null).catch(()=>null);
 if(!story){sec.hidden=true;return;}
 const sagas=story.sagas,N=sagas.length,arcs=sagas.flatMap(s=>s.arcs);
 let b=0;const bounty=sagas.map(s=>{for(const a of s.arcs)if(a.bounty)b=a.bounty;return b;});
 const bg=$('#ss-bg'),name=$('#ss-saga'),num=$('#ss-bounty'),tag=$('#ss-tag');
 bg.innerHTML=sagas.map(s=>`<img alt="" decoding="async" data-src="${FU(s.spread)}">`).join('');
 const imgs=[...bg.children];
 onSight(sec,()=>imgs.forEach(i=>{i.src=i.dataset.src;}),'0px 0px 150% 0px');
 $('#ss-stats').textContent=`${N} sagas · ${arcs.length} arcs · chapters 1 to ${arcs[arcs.length-1].ch[1]}`;
 sec.style.height='280svh';
 let cur=-1,shown=-1;
 part({el:sec,update(s){
  const p=motion.reduced?1:pinned(this,s),x=clamp(p/0.86)*(N-1),k=Math.round(x);
  imgs.forEach((im,i)=>{const o=clamp(1-Math.abs(i-x)*1.4);if(im._o===o)return;im._o=o;im.style.opacity=o.toFixed(3);im.style.transform=`scale(${(1.08-0.08*o).toFixed(4)})`;});
  if(k!==cur){cur=k;name.textContent=`Saga ${sagas[k].num} · ${sagas[k].title}`;tag.textContent=sagas[k].tag;}
  // the bounty climbs between sagas
  const i0=Math.floor(x),f=smooth(x-i0),v=Math.round(bounty[i0]+((bounty[Math.min(N-1,i0+1)]||0)-bounty[i0])*f);
  if(v!==shown){shown=v;num.textContent=v?v.toLocaleString('en-US'):'—';}
 }});
}

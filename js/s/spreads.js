// 04 · Colour spreads. Manga lives in black and white; the colour page is the treat.
// The first spread fills the screen in grey ink, then colour floods in and the camera pulls back into a
// film strip. As the strip slides past, each spread is ink-grey until it reaches the centre, where it
// blooms into colour. The grey is a blend layer on top (opacity only), never a re-filtered image.
import {$,pad,clamp,smooth,ease,lerp,view,part,pinned,pic,data,motion,loadNear} from '../core.js';
import {openCollection,registerCollection} from '../dialogs.js';

export function initSpreads(){
 const {spreads}=data.media,sec=$('#spreads'),track=$('#sp-track'),copy=$('#sp-copy'),foot=$('#sp-foot'),count=$('#sp-count');
 registerCollection('spreads',()=>({title:'Colour spreads',eyebrow:'Eiichiro Oda',ids:spreads.all}));
 $('#spreads-all').textContent=`View all ${spreads.all.length} spreads`;
 $('#spreads-all').addEventListener('click',()=>openCollection('spreads'));
 const ids=spreads.wall.slice(0,12),N=ids.length;
 track.innerHTML=ids.map((id,i)=>`<button class="sp-card" data-view="spreads" data-id="${id}" aria-label="Open colour spread ${i+1}">${pic(id,{sizes:'(max-width:820px) 90vw, 70vw',eager:i<2})}<i class="sp-ink" aria-hidden="true"></i></button>`).join('');
 const cards=[...track.children].map(el=>({el,ink:el.querySelector('.sp-ink')}));
 loadNear(sec,'120% 0px');
 let W=1,H=1,G=24,S0=1;
 part({el:sec,measure(){const r=cards[0].el.getBoundingClientRect();W=r.width||1;H=r.height||1;G=parseFloat(getComputedStyle(track).columnGap)||24;S0=Math.max(view.vw/W,view.vh/H)*1.02;},update(s){
  const p=motion.reduced?0.6:pinned(this,s),vw=view.vw;
  const pull=ease(clamp((p-0.15)/0.16));                 // full screen -> film strip
  const q=clamp((p-0.3)/0.66);                           // strip position
  const x=vw/2-W/2-q*(N-1)*(W+G);
  track.style.transform=`translate3d(${x.toFixed(1)}px,-50%,0)`;
  const centre=q*(N-1);let near=0;
  cards.forEach((c,i)=>{
   const d=Math.abs(i-centre);if(d<0.5)near=i;
   if(d>3.5&&i>0){if(!c.off){c.off=1;c.el.style.visibility='hidden';}return;}
   if(c.off){c.off=0;c.el.style.visibility='';}
   let sc=1-Math.min(d,1.5)*0.1,ink=smooth(clamp((d-0.12)/0.6));
   if(i===0){sc=lerp(S0,sc,pull);ink=Math.max(ink*pull,1-smooth(clamp((p-0.06)/0.08)));}
   c.el.style.transform=`scale(${sc.toFixed(4)})`;c.el.style.zIndex=i===0&&pull<1?5:'';
   c.ink.style.opacity=ink.toFixed(3);
  });
  const k=1-smooth(clamp((p-0.05)/0.06));copy.style.opacity=k.toFixed(3);copy.style.visibility=k<0.01?'hidden':'visible';copy.style.transform=`translate3d(0,${((1-k)*-30).toFixed(1)}px,0)`;
  foot.style.opacity=smooth(clamp((p-0.3)/0.06)).toFixed(3);
  if(near!==this.near){this.near=near;count.textContent=`${pad(near+1)} / ${pad(N)}`;}
 }});
}

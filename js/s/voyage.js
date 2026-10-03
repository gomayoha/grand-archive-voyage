// 03 · The Voyage (ten nested paintings, one continuous camera; engine in zoom-journey.js) and the
// Outro, which flies the same camera back out to Roger. The zoom eases toward the scroll position
// inside its pinned stage, so wheel notches glide instead of stepping.
import {$,$$,esc,pad,clamp,smooth,view,part,pinned,follower,jumpTo,motion,data} from '../core.js';
import {createJourney} from '../zoom-journey.js';

// The paintings were AI-upscaled (Real-ESRGAN, anime model) so they stay sharp deep into each zoom:
// assets/journey/2x for desktops, 15x (1.5x) for phones, which keeps memory in check on iPhone.
const HI=matchMedia('(pointer: coarse)').matches?'15x':'2x';

export function initVoyage(){
 const cfg=structuredClone(data.journey);
 if(cfg.hi)cfg.layers.forEach(l=>{l.image=l.image.replace('assets/journey/',`assets/journey/${HI}/`);});
 const sec=$('#voyage'),capEl=$('#voyage-caption'),rail=$('#rail'),intro=$('#voyage-intro'),vEnd=$('#voyage-end');
 const caption={el:capEl,set(L,i,n){capEl.querySelector('.vc-index').textContent=`${pad(i+1)} / ${pad(n)}`;capEl.querySelector('.vc-kicker').textContent=L.kicker;capEl.querySelector('.vc-title').textContent=L.title;capEl.querySelector('.vc-line').textContent=L.line;}};
 rail.innerHTML=cfg.layers.map((l,i)=>`<button data-seg="${i}" aria-label="Chapter ${i+1}: ${esc(l.kicker)}"><span>${esc(l.kicker)}</span></button>`).join('');
 const rb=$$('#rail button');
 const voyage=createJourney({section:sec,layerHost:$('#voyage-layers'),config:cfg,caption,onChange:i=>rb.forEach((b,k)=>k===i?b.setAttribute('aria-current','step'):b.removeAttribute('aria-current'))});
 new IntersectionObserver(([e],io)=>{if(e.isIntersecting){voyage.preload();io.disconnect();}},{rootMargin:'250% 0px'}).observe(sec);
 rail.addEventListener('click',e=>{const b=e.target.closest('button');if(b){jumpTo(voyage.scrollYFor(+b.dataset.seg));f.v=null;}});
 $('#voyage-static').innerHTML=cfg.layers.map((l,i)=>`<li><img src="${esc(l.image)}" alt="" loading="lazy" decoding="async"><p class="eyebrow">${pad(i+1)} · ${esc(l.kicker)}</p><h3>${esc(l.title)}</h3><p>${esc(l.line)}</p></li>`).join('');
 const f=follower(120);
 part({el:sec,measure(){voyage.measure();},update(s){
  if(motion.reduced)return;
  f.target=pinned(this,s);
  // Jumping from far away (nav links) shouldn't replay the whole zoom: snap instead.
  if(f.v!==null&&Math.abs(f.target-f.v)>0.5)f.v=f.target;
  voyage.render(f.step(view.t));
  const st=voyage.state;
  intro.style.opacity=st.seg===0?(1-smooth(clamp(st.p/0.08))).toFixed(3):'0';
  intro.style.transform=`translate3d(0,${(-st.p*120).toFixed(1)}px,0) scale(${(1+st.p*0.15).toFixed(4)})`;
  const e=st.seg===cfg.layers.length-1?smooth(clamp((st.p-0.62)/0.3)):0;vEnd.style.opacity=e.toFixed(3);vEnd.classList.toggle('live',e>0.5);
  rail.style.opacity=(1-e).toFixed(3);
 }});

 /* ---------------- outro: back out to where it began ---------------- */
 const oSec=$('#outro'),oText=$('#outro-text');
 const outro=createJourney({section:oSec,layerHost:$('#outro-layers'),config:{svhPerDoubling:38,tailVh:70,layers:cfg.layers.slice(0,2)},reverse:true});
 new IntersectionObserver(([e],io)=>{if(e.isIntersecting){outro.preload();io.disconnect();}},{rootMargin:'250% 0px'}).observe(oSec);
 const fo=follower(120);
 part({el:oSec,measure(){outro.measure();},update(s){
  fo.target=motion.reduced?1:pinned(this,s);if(fo.v!==null&&Math.abs(fo.target-fo.v)>0.3)fo.v=fo.target;
  const g=fo.step(view.t);outro.render(g);oText.style.opacity=smooth(clamp((g-0.72)/0.16)).toFixed(3);oText.classList.toggle('live',g>0.8);
 }});

 const applyMotion=r=>{
  sec.querySelector('.pin').hidden=r;$('#voyage-static').hidden=!r;
  if(r){sec.style.height='auto';oSec.style.height='auto';oSec.querySelector('.pin').style.position='relative';outro.renderStatic();}
  else{voyage.rebuild();outro.rebuild();oSec.querySelector('.pin').style.position='';}
 };
 motion.listeners.push(applyMotion);applyMotion(motion.reduced);
 return{voyage};
}

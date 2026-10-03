// 09 · Scenes that stay. The clip starts as a card and opens to fill the screen as you scroll
// (a scale on the frame, not a clip-path, so nothing repaints); it plays only while on screen.
import {$,clamp,smooth,ease,view,part,pinned,motion} from '../core.js';

export function initScenes(){
 const sec=$('#scenes'),frame=$('#sv-frame'),video=frame.querySelector('video'),text=$('#sv-text'),sound=$('#sound');
 let loaded=false;
 new IntersectionObserver(([e])=>{if(e.isIntersecting){if(!loaded){loaded=true;video.poster='assets/media/luffy_poster.jpg';video.src='assets/media/luffy_beat_louder.mp4';}if(!motion.reduced)video.play().catch(()=>{});}else video.pause();},{rootMargin:'40% 0px'}).observe(sec);
 sound.addEventListener('click',()=>{video.muted=!video.muted;sound.setAttribute('aria-pressed',String(!video.muted));sound.textContent=video.muted?'Sound off':'Sound on';if(!video.muted)video.play().catch(()=>{});});
 motion.listeners.push(r=>{if(r)video.pause();});
 part({el:sec,update(s){
  const p=motion.reduced?1:pinned(this,s),z=ease(clamp(p/0.5)),portrait=view.vw<view.vh;
  const s0=portrait?0.78:0.56;
  frame.style.transform=`scale(${(s0+(1-s0)*z).toFixed(4)})`;
  const t=smooth(clamp((p-0.5)/0.2));text.style.opacity=t.toFixed(3);text.style.transform=`translate3d(0,${((1-t)*30).toFixed(1)}px,0)`;
  sound.style.opacity=smooth(clamp((p-0.4)/0.2)).toFixed(3);
 }});
}

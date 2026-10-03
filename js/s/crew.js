// 02 · The Crew as wanted posters. The "bounty" is how many pictures of them he kept.
// Posters slam onto the board one after another when it comes into view (a CSS animation, so it costs
// nothing per scroll frame); each opens that character's collection.
import {$,esc,pic,data,onSight,motion} from '../core.js';
import {registerCollection} from '../dialogs.js';

export function initCrew(){
 const crew=data.media.crew,board=$('#board');
 registerCollection('crew',i=>{const c=crew[+i];return{title:c.name,eyebrow:'The Crew',ids:c.all};});
 const tilt=[-2.2,1.6,-1,2.4,-1.8,1.2,-2.6,1.9,-.8];
 board.innerHTML=crew.map((c,i)=>`<button class="wanted" style="--r:${tilt[i%tilt.length]}deg;--d:${(i*0.11).toFixed(2)}s" data-collection="crew:${i}" aria-label="${esc(c.name)}: ${c.all.length} photos">
  <span class="w-top">WANTED</span>
  <span class="w-photo">${pic(c.cover,{sizes:'(max-width:820px) 45vw, 240px'})}</span>
  <span class="w-dead">DEAD OR ALIVE</span>
  <b class="w-name">${esc(c.name.toUpperCase())}</b>
  <span class="w-bounty"><i>฿</i>${(c.all.length*1000000).toLocaleString('en-US')}<small>-</small></span>
  <span class="w-line">${esc(c.line)}</span>
  <span class="w-mark">MARINE</span>
 </button>`).join('');
 onSight(board,()=>board.classList.add(motion.reduced?'still':'slam'),'0px 0px -25% 0px');
}

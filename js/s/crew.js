// 02 · The Crew as wanted posters, with their latest canon bounties (redacted where none exists).
// Posters slam onto the board one after another when it comes into view (a CSS animation, so it costs
// nothing per scroll frame); each opens that character's collection.
import {$,esc,pic,data,onSight,motion} from '../core.js';
import {registerCollection} from '../dialogs.js';

// Latest canon bounties (as of the Egghead/Elbaf era). Characters with no confirmed bounty get a
// redacted poster instead of a made-up number.
const BOUNTY={'nami':366000000,'usopp':500000000,'chopper':1000,'franky':394000000,'brook':383000000,'jinbe':1100000000,'hancock':1659000000,'law':3000000000,'kuma':296000000,'straw hats':8816001000,
 // Nov 2026: his new folders. Canon bounties only; the rest stay unknown.
 'ace':550000000,'sabo':602000000,'shanks':4048900000,'mihawk':3590000000,'blackbeard':3996000000,'big mom':4388000000,'katakuri':1057000000,'bartolomeo':200000000};
const UNKNOWN={'imu':'CLASSIFIED','rocks':'ERASED FROM HISTORY','yamato':'NOT YET ISSUED','vivi':'A PRINCESS, NOT A PIRATE','garp':'HERO OF THE MARINES','kuzan':'FORMER ADMIRAL','rob lucci':'CIPHER POL','reiju':'GERMA 66','shakky':'RETIRED','gunko':'HOLY KNIGHT','worst generation':'TWELVE NAMES','yonko':'FOUR EMPERORS'};

function bountyHTML(name){
 const k=name.toLowerCase();
 if(BOUNTY[k]!=null)return `<span class="w-bounty"><i>฿</i>${BOUNTY[k].toLocaleString('en-US')}<small>-</small></span>${k==='straw hats'?'<span class="w-sub">combined, the whole crew</span>':''}`;
 return `<span class="w-bounty unknown"><i>฿</i><s>???,???,???</s></span><span class="w-stamp">${UNKNOWN[k]||'UNKNOWN'}</span>`;
}

export function initCrew(){
 const crew=data.media.crew,board=$('#board');
 registerCollection('crew',i=>{const c=crew[+i];return{title:c.name,eyebrow:'The Crew',ids:c.all};});
 const tilt=[-2.2,1.6,-1,2.4,-1.8,1.2,-2.6,1.9,-.8];
 board.innerHTML=crew.map((c,i)=>`<button class="wanted${BOUNTY[c.name.toLowerCase()]==null?' dread':''}" style="--r:${tilt[i%tilt.length]}deg;--d:${(i*0.11).toFixed(2)}s" data-collection="crew:${i}" aria-label="${esc(c.name)}: ${c.all.length} photos">
  <span class="w-top">WANTED</span>
  <span class="w-photo">${pic(c.cover,{sizes:'(max-width:820px) 45vw, 240px'})}</span>
  <span class="w-dead">DEAD OR ALIVE</span>
  <b class="w-name">${esc(c.name.toUpperCase())}</b>
  ${bountyHTML(c.name)}
  <span class="w-line">${esc(c.line)}</span>
  <span class="w-mark">MARINE</span>
  <small class="w-photos">${c.all.length} photos</small>
 </button>`).join('');
 onSight(board,()=>board.classList.add(motion.reduced?'still':'slam'),'0px 0px -25% 0px');
}

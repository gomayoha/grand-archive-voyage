// Auto voyage: the archive sails itself. One tap and the page scrolls on its own at a calm pace, a little
// slower where there's reading (the Character Log, the Top 10) and quicker across the shelves, so the whole
// archive plays like a film. A small glass helm at the bottom shows where you are on the voyage (one line,
// a tick for every chapter) with pause, speed, next chapter and stop. Touching the page (wheel, touch, keys)
// pauses it so you can stop and look; ▸ carries on. Jumping somewhere (Log Pose) carries on from there.
import {absTop,view,clamp} from './core.js';
import {once,notice} from './bounty.js';

const SPEEDS=[['Slow',0.1],['Calm',0.18],['Swift',0.34]]; // screens per second
const PACE={helm:1.15,characters:0.72,strawhats:1,crew:0.8,depths:1.15,voyage:1.1,moments:0.9,spreads:1,panels:0.9,'story-show':0.9,journey:0.85,top:0.8,records:1.8,logbook:1.3,worlds:1,vault:1,table:1.4,scenes:0.9,library:1.5,sky:1,life:0.8,outro:0.9};
const NAMES={home:'The archive',helm:'The helm',characters:'The Character Log',strawhats:'The Straw Hat Pirates',crew:'The Crew',depths:'Between the sky and the sea',voyage:'The Voyage',moments:'Moments',spreads:'Colour spreads',panels:'Favourite panels','story-show':'The Story of One Piece',journey:'The Anime Journey',top:'My top 10',records:'The Shelf',logbook:'The Logbook',worlds:'Other worlds',vault:'The Card Vault',table:'The Card Table',scenes:'Scenes that stay',library:'The Ohara Library',sky:'The night sky',life:'Book II',outro:'The last page'};
const SPEED_KEY='grand-archive:auto-speed';
const I={play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5.5" width="4" height="13" rx="1.2" fill="currentColor"/><rect x="13.5" y="5.5" width="4" height="13" rx="1.2" fill="currentColor"/></svg>',next:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 6v12l8.5-6z" fill="currentColor"/><rect x="15.5" y="6" width="3" height="12" rx="1" fill="currentColor"/></svg>',stop:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'};

let on=false,paused=false,speed=1,y=0,last=0,raf=0,ramp=0,hud=null,secs=[],startY=0,travelled=0,measuredAt=0,cur='';
try{const v=localStorage.getItem(SPEED_KEY),s=+v;if(v!==null&&s>=0&&s<SPEEDS.length)speed=s;}catch{}
export const autoOn=()=>on;

function measure(){secs=[...document.querySelectorAll('main>section')].filter(s=>!s.hidden&&s.offsetHeight).map(s=>({id:s.id,top:absTop(s),h:s.offsetHeight}));measuredAt=performance.now();
 if(hud){const H=docH();hud.querySelector('.av-ticks').innerHTML=secs.filter(s=>NAMES[s.id]).map(s=>`<i style="left:${(s.top/H*100).toFixed(2)}%"></i>`).join('');}}
const docH=()=>Math.max(1,document.documentElement.scrollHeight-view.vh);
const sectionAt=py=>{let s=secs[0];for(const x of secs)if(x.top<=py)s=x;return s;};
// a dialog or a room is open: hold still underneath it
const blocked=()=>document.documentElement.style.overflow==='hidden'||!!document.querySelector('dialog[open]');

function tick(t){
 raf=0;if(!on)return;
 const dt=Math.min(0.05,(t-(last||t))/1000);last=t;
 if(performance.now()-measuredAt>2500)measure();
 // the page moved by itself (a jump, a scrollbar drag): carry on from wherever we are now
 if(Math.abs(scrollY-y)>3)y=scrollY;
 if(paused){show();return;}
 if(!blocked()){
  const s=sectionAt(y+view.vh*0.5);
  const v=SPEEDS[speed][1]*(PACE[s?.id]||1)*view.vh;
  // ease in from a standstill so starting and resuming never jolt
  ramp=Math.min(1,ramp+dt/0.9);
  const step=v*dt*ramp;y+=step;travelled+=step;
  const max=document.documentElement.scrollHeight-innerHeight;
  if(y>=max-1){y=max;scrollTo({top:y,behavior:'instant'});return finish();}
  scrollTo({top:y,behavior:'instant'});
 }
 show();
 raf=requestAnimationFrame(tick);
}
function show(){
 if(!hud)return;
 const s=sectionAt(scrollY+view.vh*0.5),name=NAMES[s?.id]||'';
 if(name!==cur){cur=name;hud.querySelector('.av-now').textContent=name;}
 hud.querySelector('.av-fill').style.transform=`scaleX(${clamp(scrollY/docH()).toFixed(4)})`;
}
function build(){
 hud=document.createElement('div');hud.className='av';hud.setAttribute('role','region');hud.setAttribute('aria-label','Auto voyage');
 hud.innerHTML=`<button class="av-btn av-play" aria-label="Pause">${I.pause}</button>
  <div class="av-mid"><span class="av-k">Auto voyage</span><b class="av-now"></b><span class="av-line"><i class="av-fill"></i><span class="av-ticks"></span></span></div>
  <button class="av-speed" aria-label="Speed">${SPEEDS[speed][0]}</button>
  <button class="av-btn av-next" aria-label="Next chapter">${I.next}</button>
  <button class="av-btn av-stop" aria-label="Stop Auto voyage">${I.stop}</button>`;
 document.body.appendChild(hud);
 hud.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;e.stopPropagation();
  if(b.classList.contains('av-play'))paused?resume():pause();
  else if(b.classList.contains('av-speed')){speed=(speed+1)%SPEEDS.length;b.textContent=SPEEDS[speed][0];try{localStorage.setItem(SPEED_KEY,speed);}catch{}if(paused)resume();}
  else if(b.classList.contains('av-next')){const now=scrollY+view.vh*0.5,n=secs.find(s=>s.top>now+4);if(n){y=n.top;scrollTo({top:y,behavior:'instant'});ramp=0;}if(paused)resume();}
  else if(b.classList.contains('av-stop'))stopAuto();
 });
}
function setPaused(v){paused=v;if(!hud)return;hud.classList.toggle('paused',v);const b=hud.querySelector('.av-play');b.innerHTML=v?I.play:I.pause;b.setAttribute('aria-label',v?'Carry on':'Pause');}
function pause(){if(!on||paused)return;setPaused(true);}
function resume(){if(!on)return;y=scrollY;ramp=0;last=0;setPaused(false);if(!raf)raf=requestAnimationFrame(tick);}
function finish(){
 const whole=startY<=(secs.find(s=>s.id==='characters')?.top??Infinity)&&travelled>docH()*0.7;
 stopAuto();
 if(whole)once('auto',100e6,'You sailed the whole archive');
 else notice('Land ho','That’s the last page of the archive.');
}
// touching the page takes the wheel back; space pauses and carries on, Escape stops
const takeOver=e=>{if(!on||paused)return;if(e.target instanceof Element&&e.target.closest('.av'))return;setPaused(true);};
const onKey=e=>{
 if(!on||blocked())return;const el=e.target instanceof Element?e.target:null;if(el&&el.closest('input,textarea,select,[contenteditable]'))return;
 if(e.key===' '){if(el&&el.closest('button,a'))return;e.preventDefault();paused?resume():setPaused(true);return;}
 if(e.key==='Escape'){stopAuto();return;}
 if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(e.key))setPaused(true);
};

export function startAuto({from=''}={}){
 if(on){if(paused)resume();return;}
 on=true;if(!hud)build();measure();
 startY=scrollY;travelled=0;y=scrollY;ramp=0;last=0;setPaused(false);cur='';
 document.body.classList.add('auto-on');requestAnimationFrame(()=>hud.classList.add('in'));
 addEventListener('wheel',takeOver,{passive:true});addEventListener('touchstart',takeOver,{passive:true});addEventListener('keydown',onKey);
 notice('Auto voyage',from==='helm'?'Sit back. Touch the page any time to take the wheel.':'Touch the page any time to take the wheel.');
 raf=requestAnimationFrame(tick);
}
export function stopAuto(){
 if(!on)return;on=false;cancelAnimationFrame(raf);raf=0;
 document.body.classList.remove('auto-on');hud?.classList.remove('in');
 removeEventListener('wheel',takeOver);removeEventListener('touchstart',takeOver);removeEventListener('keydown',onKey);
}

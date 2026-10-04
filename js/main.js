// Grand Archive. Each section lives in js/s/ and owns one idea; this file wires them together.
import {$,$$,data,loadData,motion,setReduced,measureAll,jumpTo,absTop,part,view,debugParts,lookAhead} from './core.js';
import {loadVault,initGate,vault} from './vault.js';
import {closeDialog} from './dialogs.js';
import {initGear5} from './gear5.js';
import {initLogPose} from './logpose.js';
import './editor.js';
import {initOpening} from './s/opening.js';
import {initCharacters} from './s/characters.js';
import {initCrew} from './s/crew.js';
import {initVoyage} from './s/voyage.js';
import {initSpreads} from './s/spreads.js';
import {initMoments} from './s/moments.js';
import {initPanels} from './s/panels.js';
import {initRoute} from './s/route.js';
import {initTop10} from './s/top10.js';
import {initShelf} from './s/shelf.js';
import {initWorlds,initLibrary} from './s/worlds.js';
import {initCards} from './s/cards.js';
import {initScenes} from './s/scenes.js';
import {initBook2} from './s/book2.js';

await Promise.all([loadData(),loadVault()]);
// One broken section must never take the rest of the page down with it.
const run=(name,fn)=>{try{return fn();}catch(e){console.error(`[${name}]`,e);}};
run('opening',initOpening);
run('characters',initCharacters);
run('crew',initCrew);
const voy=run('voyage',initVoyage);
run('moments',initMoments);
run('spreads',initSpreads);
run('panels',initPanels);
run('route',initRoute);
run('top10',initTop10);
run('shelf',initShelf);
run('worlds',initWorlds);
run('cards',initCards);
run('scenes',initScenes);
run('library',initLibrary);
run('book2',initBook2);
run('gate',initGate);
run('logpose',initLogPose);
lookAhead();

/* ---------------- header: clear over full-screen scenes, frosted over reading sections ---------------- */
const bar=$('#bar'),navLinks=$$('.bar-nav a');
const clearOver=['#home','#voyage','#moments','#spreads','#top','#scenes','#outro'].map(s=>$(s)).filter(Boolean);
part({always:true,measure(){this.zones=clearOver.map(el=>[absTop(el)-10,absTop(el)+el.offsetHeight-view.vh*0.9]);const ink=$('#panels');this.ink=[absTop(ink)-30,absTop(ink)+ink.offsetHeight-60];},update(s){
 const clear=this.zones.some(([a,b])=>s>=a&&s<b);bar.classList.toggle('solid',!clear);bar.classList.toggle('paper',s>this.ink[0]&&s<this.ink[1]);
}});
['characters','crew','voyage','moments','spreads','panels','journey','top','vault','library','life'].forEach(id=>{const el=document.getElementById(id);if(el)new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)navLinks.forEach(a=>a.getAttribute('href')==='#'+id?a.setAttribute('aria-current','true'):a.removeAttribute('aria-current'));}),{rootMargin:'-45% 0px -50% 0px'}).observe(el);});
document.addEventListener('click',e=>{const a=e.target.closest('[data-jump]');if(!a)return;e.preventDefault();closeDialog();const id=a.getAttribute('href').slice(1);jumpTo(id==='home'?0:absTop(document.getElementById(id)));});

/* ---------------- reveals ---------------- */
const revealer=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');revealer.unobserve(e.target);}}),{rootMargin:'0px 0px -10% 0px'});
$$('.rv').forEach(el=>revealer.observe(el));

/* ---------------- motion toggle ---------------- */
const motionBtn=$('#motion');
const showMotion=r=>{document.body.classList.toggle('reduced',r);motionBtn.setAttribute('aria-pressed',String(r));motionBtn.innerHTML=`Motion <b>${r?'Off':'On'}</b>`;measureAll();};
motion.listeners.push(showMotion);
motionBtn.addEventListener('click',()=>setReduced(!motion.reduced));
document.body.classList.toggle('reduced',motion.reduced);motionBtn.innerHTML=`Motion <b>${motion.reduced?'Off':'On'}</b>`;

measureAll();
let crossing=false;try{crossing=sessionStorage.getItem('grand-archive:cross')==='1';sessionStorage.removeItem('grand-archive:cross');}catch{}
if(crossing&&!$('#life').hidden)requestAnimationFrame(()=>{measureAll();jumpTo(absTop($('#life')));});
else if(location.hash&&location.hash!=='#home'){const t=document.getElementById(location.hash.slice(1));if(t)requestAnimationFrame(()=>jumpTo(absTop(t)));}
requestAnimationFrame(()=>document.body.classList.add('ready'));
initGear5({button:$('#gear5'),isReduced:()=>motion.reduced});

// Test hook (?debug): jump to an exact scroll position and render it at once (no easing).
if(new URLSearchParams(location.search).has('debug'))window.__ga={at(y){scrollTo({top:y,behavior:'instant'});motion.snap=true;measureAll();motion.snap=false;return scrollY;},parts:debugParts,measureAll,voyage:voy&&voy.voyage,data};
if(new URLSearchParams(location.search).has('calibrate')&&voy)import('./calibrate.js').then(m=>m.startCalibration(voy.voyage,measureAll));

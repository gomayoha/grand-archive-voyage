// Boot, the five screens and moving between them.
import {$,$$,loadData,S,save,changed,onChange,touchStreak,setToast,finish,reduced} from './store.js';
import {toast,rise} from './ui.js';
import {renderToday,openPicture,openEdition} from './today.js';
import {renderStories,open as openThing} from './stories.js';
import {renderCollect,onShowCollect,openPack,openTcg,stayUI,STAY,GIFT} from './collect.js';
import {openSearch} from './search.js';
import {openSerial} from './serial.js';
import {readyCount} from './quests.js';
import {renderPlay} from './play.js';
import {renderMe} from './me.js';

const TABS=['today','stories','collect','play','me'],NAME={today:'Today',stories:'Stories',collect:'Collect',play:'Play',me:'Me'};
const root=document.documentElement,view=t=>$('#v-'+t);
// calm motion: his switch if he set it, otherwise what the device asks for
root.classList.toggle('calm',S.calm??matchMedia('(prefers-reduced-motion: reduce)').matches);
if(matchMedia('(pointer: coarse)').matches)root.classList.add('touch');

let cur='today',playDraw=null;const pos={};
function go(tab,{instant=false}={}){
 if(!TABS.includes(tab))tab='today';
 if(tab===cur){if(!instant)scrollTo({top:0,behavior:reduced()?'auto':'smooth'});return;}
 pos[cur]=scrollY;
 const upd=()=>{
  TABS.forEach(t=>{view(t).hidden=t!==tab;});cur=tab;
  $$('[data-tab]').forEach(a=>a.toggleAttribute('aria-current',a.dataset.tab===tab));
  $('#bar-title').textContent=NAME[tab];scrollTo(0,pos[tab]||0);onScroll();
  if(tab==='collect')onShowCollect(view(tab));if(tab==='play')playDraw?.();rise(view(tab));
 };
 if(document.startViewTransition&&!reduced()&&!instant){root.classList.add('tabbing');document.startViewTransition(upd).finished.finally(()=>root.classList.remove('tabbing'));}else upd();
 if(location.hash!=='#'+tab)history.replaceState(null,'','#'+tab);
}
// the big title slides up into the bar once you scroll past it (one class, set from one rAF)
let ticking=false;const onScroll=()=>{ticking=false;$('#bar').classList.toggle('scrolled',scrollY>88);};
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});

document.addEventListener('click',e=>{
 const t=e.target.closest('[data-tab]');if(t){e.preventDefault();go(t.dataset.tab);return;}
 const o=e.target.closest('[data-open]');if(!o)return;
 const what=o.dataset.open;if(o.dataset.part)finish(o.dataset.part);
 if(what.startsWith('tab:'))go(what.slice(4));
 else if(what==='pack')openPack();
 else if(what==='today:picture')openPicture(o);
 else if(what==='search')openSearch(null);
 else if(what.startsWith('tcg:'))openTcg(what.slice(4),o);
 else if(what.startsWith('serial:'))openSerial(what.slice(7));
 else if(what.startsWith('edition:'))openEdition(what.slice(8),o);
 else openThing(what,o);
});
document.addEventListener('ga:open',e=>openThing(e.detail,null));
addEventListener('hashchange',()=>go(location.hash.slice(1)||'today'));

async function boot(){
 await loadData();
 setToast(toast);
 const fresh=touchStreak();
 renderToday(view('today'));renderStories(view('stories'));renderCollect(view('collect'));playDraw=renderPlay(view('play'));renderMe(view('me'));
 const packs=()=>{const n=$('#bar-packs-n');n.textContent=S.packs;$('#bar-packs').classList.toggle('has',S.packs>0);};packs();onChange(packs);
 // a dot on Collect when a quest is waiting to be claimed
 const dot=()=>{const n=readyCount();$$('[data-tab=collect]').forEach(a=>a.classList.toggle('dot',n>0));};dot();onChange(dot);
 $('#bar-title').textContent=NAME.today;$$('[data-tab=today]').forEach(a=>a.setAttribute('aria-current',''));
 const h=location.hash.slice(1);if(TABS.includes(h)&&h!=='today')go(h,{instant:true});
 // the fruit in your stomach and the theme come back with you
 if(S.eat)import('./fruits.js').then(m=>m.eat(S.eat,{quiet:true}));else import('./themes.js').then(m=>m.refreshTheme());
 const hasFruit=()=>root.classList.toggle('has-fruit',!!S.eat);hasFruit();onChange(hasFruit);
 // packs for staying (he asked: every few minutes you stay should pay packs, or the binder can never be filled).
 // Time counts while the app is on screen and in use: a touch, key or scroll in the last 90 s, or a story/film playing.
 let lastAct=Date.now();['pointerdown','keydown','scroll','touchstart'].forEach(ev=>addEventListener(ev,()=>{lastAct=Date.now();},{passive:true,capture:true}));
 setInterval(()=>{
  if(document.hidden||(Date.now()-lastAct>90000&&!document.querySelector('.cvf,.story')))return;
  S.stay=(S.stay||0)+5;
  if(S.stay>=STAY){S.stay-=STAY;S.packs+=GIFT;changed();toast('Five minutes aboard',`+${GIFT} packs`);}else if(S.stay%30===0)save();
  stayUI();
 },5000);
 // a newer version was published while the app sat open (a home-screen app can stay open for days): load it
 const built=document.querySelector('meta[name=ga-version]')?.content||'';
 const fresh2=async()=>{if(!built||document.documentElement.classList.contains('locked'))return;try{const v=(await (await fetch('version.txt?'+Date.now(),{cache:'no-store'})).text()).trim();if(v&&v!==built)location.reload();}catch{}};
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)fresh2();});setInterval(fresh2,20*60*1000);
 window.__booted=true;try{sessionStorage.removeItem('ga-retry');}catch{}
 $('#splash').classList.add('gone');setTimeout(()=>$('#splash').remove(),700);
 if(fresh)setTimeout(()=>toast(S.streak.n>1?`Day ${S.streak.n} in a row`:'Welcome aboard','Your daily pack has arrived'),900);
 if(new URLSearchParams(location.search).has('debug'))window.__next={S,go,changed,openPack};
}
boot().catch(e=>{console.error(e);$('#splash').innerHTML='<p>Something did not load. Pull down to try again.</p>';});

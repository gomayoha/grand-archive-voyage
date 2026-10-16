// Your bounty. The archive pays you in berries for the time you spend in it and for what you learn about
// it: every chapter you reach, every record you read, every Road Poneglyph, every saga of the story, every
// game. The berries add up to a bounty with an epithet (Luffy's own bounties mark the titles), and every
// milestone washes a treasure chest ashore, opened in the Treasure Room (js/treasure.js).
// Most of it is noticed from the outside (clicks on things that already exist, chapters crossing the
// middle of the screen), so the sections themselves don't need to know about any of this.
// Everything lives in this browser only.
const KEY='grand-archive:bounty',M=1e6;
const blank=()=>({v:1,b:0,marks:{},days:[],sec:0,min:0,opened:0,bonus:0,cards:{},fruits:[],eat:null,relics:[],best:{},poster:null});
export const B=(()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.v===1)return Object.assign(blank(),v);}catch{}return blank();})();
export const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(B));}catch{}};
export const money=n=>Math.round(n).toLocaleString('en-US');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const subs=new Set();
export const onBounty=fn=>{subs.add(fn);return()=>subs.delete(fn);};
const changed=()=>subs.forEach(f=>{try{f(B);}catch(e){console.error(e);}});
export const has=k=>!!B.marks[k];
export const marked=prefix=>Object.keys(B.marks).filter(k=>k.startsWith(prefix)).length;

/* ---------------------------------------------------------------- titles and chests */
// The epithet on your poster climbs with the bounty; the thresholds are Luffy's own bounties.
export const TITLES=[
 [0,'Stowaway','Nobody knows your name yet.'],
 [1*M,'Cabin boy','Coby swept decks too.'],
 [30*M,'Rookie of East Blue','Luffy’s first bounty, after Arlong Park.'],
 [100*M,'Grand Line rookie','Luffy, after Alabasta.'],
 [300*M,'Supernova','Luffy, after Enies Lobby.'],
 [500*M,'Worst Generation','Luffy, after Dressrosa.'],
 [1500*M,'Fifth Emperor','Luffy, after Whole Cake Island.'],
 [3000*M,'Emperor of the Sea','Luffy, after Wano.'],
 [5564800000,'King of the Archive','Gol D. Roger’s bounty.']
];
export const title=(b=B.b)=>{let t=TITLES[0];for(const x of TITLES)if(b>=x[0])t=x;return t;};
export const nextTitle=(b=B.b)=>TITLES.find(x=>x[0]>b)||null;
// A chest at 5, 15, 30 and 50 million, then one every 20 million.
const T=k=>k<=0?0:k<=4?[0,5,15,30,50][k]*M:50*M+(k-4)*20*M;
const earned=b=>{let k=0;while(T(k+1)<=b)k++;return k;};
export function chests(){const k=earned(B.b),all=k+B.bonus;return{earned:all,opened:B.opened,waiting:Math.max(0,all-B.opened),prev:T(k),next:T(k+1),frac:(B.b-T(k))/(T(k+1)-T(k))};}
export const grantChest=(n=1)=>{B.bonus+=n;save();changed();chestToast(n);};

/* ---------------------------------------------------------------- earning */
export function earn(n,why,{quiet=false}={}){
 const before=earned(B.b);B.b+=Math.round(n);save();
 if(!quiet&&why)toast(`+${money(n)}`,why);
 const after=earned(B.b);if(after>before)setTimeout(()=>chestToast(after-before),quiet?200:1100);
 changed();
}
// a one-time reward; true the first time
export function once(key,n,why,opts){if(B.marks[key])return false;B.marks[key]=Date.now();earn(n,why,opts);return true;}
// a game's best score; rewards come from the game itself
export function best(game,v){if(v>(B.best[game]||0)){B.best[game]=v;save();changed();return true;}return false;}
export function unlockRelic(id,name){if(B.relics.includes(id))return false;B.relics.push(id);save();changed();notice('Relic unlocked',name,()=>openTreasure('relics'));return true;}

/* ---------------------------------------------------------------- toasts */
let box;
function toastBox(){if(!box){box=document.createElement('div');box.className='bt-toasts';box.setAttribute('role','status');box.setAttribute('aria-live','polite');document.body.appendChild(box);}return box;}
function add(t,ms){const b=toastBox();b.appendChild(t);while(b.children.length>3)b.firstChild.remove();requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('in')));setTimeout(()=>{t.classList.remove('in');setTimeout(()=>t.remove(),700);},ms);}
export function toast(big,why){if(document.documentElement.classList.contains('wm-on'))return;const t=document.createElement('div');t.className='bt-toast';t.innerHTML=`<i class="bt-coin" aria-hidden="true">฿</i><b>${esc(big)}</b><span>${esc(why)}</span>`;add(t,3600);}
export function notice(big,why,go){const t=document.createElement(go?'button':'div');t.className='bt-toast bt-notice';t.innerHTML=`<i class="bt-coin bt-star" aria-hidden="true">✦</i><b>${esc(big)}</b><span>${esc(why)}${go?' →':''}</span>`;if(go)t.addEventListener('click',go);add(t,6000);}
// one chest notice at a time: a second chest while it's showing just raises its count
let chestT=null;
function chestToast(n){
 if(chestT&&chestT.isConnected){chestT._n+=n;chestT.querySelector('b').textContent=`${chestT._n} chests washed ashore`;chestT.querySelector('.bt-toast-t>span').textContent='Open them in the Treasure Room →';return;}
 const t=document.createElement('button');t._n=n;t.className='bt-toast bt-chest';t.innerHTML=`<i class="bt-box" aria-hidden="true"><i></i></i><span class="bt-toast-t"><b>${n>1?`${n} chests`:'A chest'} washed ashore</b><span>Open ${n>1?'them':'it'} in the Treasure Room →</span></span>`;t.addEventListener('click',()=>openTreasure());chestT=t;add(t,7000);}

/* ---------------------------------------------------------------- the rooms (loaded only when opened) */
const onIndex=()=>!!document.getElementById('home');
export function openTreasure(tab){if(!onIndex()){location.href='index.html#treasure';return;}import('./treasure.js').then(m=>m.openTreasure(tab));}
export function openGames(game){if(!onIndex()){location.href='index.html#games';return;}import('./games.js').then(m=>m.openGames(game));}

/* ---------------------------------------------------------------- the bounty board */
const CH_NAMES={helm:'The helm',characters:'The Character Log',strawhats:'The Straw Hat Pirates',crew:'The Crew',depths:'Between the sky and the sea',voyage:'The Voyage',moments:'Moments',spreads:'Colour spreads',panels:'Favourite panels','story-show':'The Story of One Piece',journey:'The Anime Journey',top:'My top 10',records:'The Shelf',logbook:'The Logbook',worlds:'Other worlds',vault:'The Card Vault',scenes:'Scenes that stay',library:'The Ohara Library',sky:'The night sky',outro:'The last page'};
const PG=['zou','crew','panels','library'];
const pgFound=()=>{try{const v=JSON.parse(localStorage.getItem('grand-archive:poneglyphs')||'[]');return Array.isArray(v)?v.filter(x=>PG.includes(x)):[];}catch{return[];}};
const ODD=['g5','write','dive','shuffle','scene'];
const min=(a,b)=>Math.min(a,b);
// what the Treasure Room shows; the rewards are paid where the thing happens
export const QUESTS=[
 {id:'ch',t:'Sail to every chapter',d:'Reach each chapter of the archive once.',n:()=>[marked('ch:'),Object.keys(CH_NAMES).length],pay:'฿5,000,000 each'},
 {id:'read',t:'Read every record',d:'Open “Read everything I wrote” for every character in the Character Log. The last one unlocks a relic.',n:()=>[marked('read:'),B.nChars||11],pay:'฿3,000,000 each · ฿30,000,000 for all'},
 {id:'judge',t:'First impressions',d:'Flip every first-impression card in the Character Log.',n:()=>[marked('judge:'),B.nJudge||2],pay:'฿2,000,000 each'},
 {id:'pg',t:'The Road Poneglyphs',d:'Four red stones are hidden in the archive. Take a rubbing of each one.',n:()=>[marked('pg:'),4],pay:'฿50,000,000 each · ฿100,000,000 at Laugh Tale'},
 {id:'saga',t:'The whole story',d:'Reach every saga in The Story of One Piece.',n:()=>[marked('saga:'),11],pay:'฿5,000,000 each · ฿50,000,000 for all'},
 {id:'day',t:'Days at sea',d:'Come back to the archive on seven different days.',n:()=>[min(B.days.length,7),7],pay:'฿10,000,000 a day'},
 {id:'auto',t:'Let her sail',d:'Ride Auto voyage from the helm all the way to the last page.',n:()=>[has('auto')?1:0,1],pay:'฿100,000,000'},
 {id:'hl',t:'Higher or lower',d:'Call ten bounties in a row in the Game Room.',n:()=>[min(B.best.hl||0,10),10],pay:'฿20,000,000'},
 {id:'quiz',t:'Know the captain',d:'A perfect round of the Archive Quiz.',n:()=>[min(B.best.quiz||0,10),10],pay:'฿30,000,000'},
 {id:'wind',t:'Gone with the wind',d:'Catch 25 wanted posters in one gust.',n:()=>[min(B.best.wind||0,25),25],pay:'฿20,000,000'},
 {id:'haki',t:'Observation Haki',d:'Reach level 8.',n:()=>[min(B.best.haki||0,8),8],pay:'฿20,000,000'},
 {id:'col',t:'Collector',d:'Open ten photo collections.',n:()=>[min(marked('col:'),10),10],pay:'฿1,000,000 each'},
 {id:'chest',t:'Treasure hunter',d:'Open ten chests.',n:()=>[min(B.opened,10),10],pay:'A gold chest'},
 {id:'odd',t:'Odds and ends',d:'Wake Nika (Gear 5), open Writer’s mode, dive into a collection in 3D, shuffle the wall, turn the sound up in Scenes.',n:()=>[ODD.filter(has).length,ODD.length],pay:'฿1,000,000 to ฿5,000,000 each'}
];

/* ---------------------------------------------------------------- noticing things */
let started=false;
export function initBounty({chars=null}={}){
 if(started)return;started=true;
 // what you've earned stays switched on between visits: the manga-ink relic and the fruit you ate
 if(B.ink)document.documentElement.classList.add('ink');
 if(B.eat)import('./fruits.js').then(m=>m.eat(B.eat,{quiet:true})).catch(()=>{});
 if(chars){B.nChars=chars.length;B.nJudge=chars.filter(c=>c.first).length;}
 // a new day at sea (local date)
 const today=new Date().toLocaleDateString('en-CA');
 if(!B.days.includes(today)){const first=!B.days.length;B.days.push(today);save();setTimeout(()=>earn(10*M,first?'Welcome aboard. Your first day at sea':'A new day at sea'),first?2600:1800);}
 // time at sea: a quarter of a million every 15 seconds while you're actually here
 let activeAt=Date.now();
 ['pointerdown','keydown','wheel','touchstart','scroll','pointermove'].forEach(e=>addEventListener(e,()=>{activeAt=Date.now();},{passive:true}));
 setInterval(()=>{
  if(document.hidden)return;
  const sailing=document.body.classList.contains('auto-on');
  if(!sailing&&Date.now()-activeAt>120000)return;
  B.sec+=15;if(B.sec>=60){B.sec-=60;B.min++;if(B.min%10===0)setTimeout(()=>toast('+10,000,000',`${B.min} minutes at sea`),400);}
  earn(M/4,'',{quiet:true});
 },15000);
 // chapters, the first time each one crosses the middle of the screen
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const id=e.target.id;io.unobserve(e.target);if(CH_NAMES[id])once('ch:'+id,5*M,`New chapter · ${CH_NAMES[id]}`);}),{rootMargin:'-45% 0px -45% 0px'});
 document.querySelectorAll('main>section[id]').forEach(s=>{if(CH_NAMES[s.id]&&!has('ch:'+s.id))io.observe(s);});
 // the story page: every saga
 const sio=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;sio.unobserve(e.target);const si=+e.target.dataset.saga,n=e.target.querySelector('h2')?.textContent||'';
  if(once('saga:'+si,5*M,`Saga ${si+1} · ${n}`)&&marked('saga:')>=11)once('story:all',50*M,'You read the whole story');}),{rootMargin:'-40% 0px -40% 0px'});
 document.querySelectorAll('.saga[data-saga]').forEach(s=>{if(!has('saga:'+s.dataset.saga))sio.observe(s);});
 // Road Poneglyphs found before the bounty existed still count
 const pg=()=>{const f=pgFound();f.forEach(id=>once('pg:'+id,50*M,'A Road Poneglyph'));if(f.length===4)once('laughtale',100*M,'Laugh Tale');};
 setTimeout(pg,3200);
 // things you do (capture phase: some buttons stop the click from bubbling)
 document.addEventListener('click',e=>{
  const t=e.target;if(!(t instanceof Element))return;
  const r=t.closest('[data-read]');
  if(r&&chars){const c=chars[+r.dataset.read];if(c&&once('read:'+c.id,3*M,`Read · ${c.name}`)&&marked('read:')>=chars.length){once('quest:read',30*M,'Every record, read');unlockRelic('origin','Where it began');}}
  const j=t.closest('.judge');if(j){const i=j.closest('.role')?.dataset.i;if(i!=null)once('judge:'+i,2*M,'First impression, then the verdict');}
  const c=t.closest('[data-collection]');if(c&&c.dataset.collection)once('col:'+c.dataset.collection,M,'Opened a collection');
  if(t.closest('[data-dive],#ar-dive'))once('dive',5*M,'Dived into a collection in 3D');
  if(t.closest('#ar-shuffle'))once('shuffle',M,'Shuffled the wall');
  if(t.closest('#gear5'))once('g5',5*M,'You woke up Nika');
  if(t.closest('#write,#lp-write'))once('write',5*M,'Writer’s mode');
  if(t.closest('#sound'))once('scene',3*M,'Beat louder');
  if(t.closest('[data-card]'))once('vault',2*M,'A card, up close');
  if(t.closest('.pg-stone'))setTimeout(pg,120);
 },true);
 if(new URLSearchParams(location.search).has('debug'))window.__bounty={B,earn,chests,grantChest,save};
}

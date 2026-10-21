// The Treasure Room. Everything the archive pays you (js/bounty.js) ends up here:
//  - Your wanted poster: the bounty, and an epithet that climbs with it (Luffy's own bounties mark the titles).
//  - Chests: every milestone washes one ashore. Opening one is a small ceremony: it drops in, shakes, the
//    lock pops, the lid swings open on a column of light and the treasure rises out of it, face down.
//  - The Treasure Log: what's inside is his own pictures, as cards. Every picture in the archive is a card
//    with a fixed rarity (Common, Rare, Super rare, Secret, like the One Piece card game he collects), and
//    the log is a binder to fill, collection by collection. Secret cards carry a holographic foil that
//    follows the mouse or the tilt of the phone.
//  - Devil Fruits: some chests hold a fruit. Eat one and the whole archive answers your taps with its power
//    (js/fruits.js). One at a time, like the real thing.
//  - The Black Market (Oct 22 2026): gold (js/gold.js) buys chests, gold chests, a lucky compass, packs of one
//    collection and Devil Fruits, to sail faster than the bounty alone. The one-of-one Conqueror is never sold.
//  - Themes: a fruit you own or a rare card repaints the whole archive (js/themes.js).
//  - Relics: things that can't be bought: the archive's original opening, a manga-ink way of seeing it,
//    Laugh Tale, and a poster printed in gold.
//  - The bounty board: every way to earn, and how far along you are.
import {esc,data,TH,FU,dims,motion,coarse,clamp} from './core.js';
import {B,save,money,chests,title,nextTitle,QUESTS,once,grantChest,onBounty,has,notice,gainGold,spendGold,goldFmt,toast} from './bounty.js';
import {THEMES,setTheme} from './themes.js';
import {todaysHunt} from './gold.js';
import {openViewer,registerCollection} from './dialogs.js';
import {onTilt} from './tilt.js';

let cssReady=null;
export const roomsCSS=()=>cssReady||(cssReady=new Promise(res=>{const l=document.createElement('link');l.rel='stylesheet';l.href='css/rooms.css';l.onload=res;l.onerror=res;document.head.appendChild(l);}));
const wait=ms=>new Promise(r=>setTimeout(r,motion.reduced?Math.min(ms,30):ms));
const rnd=a=>a[Math.floor(Math.random()*a.length)];

/* ---------------------------------------------------------------- the cards: every picture in the archive */
let POOL=null;
export function pool(){
 if(POOL)return POOL;const m=data.media||{},out=[],seen=new Set();
 const add=(ids,col,to)=>{const list=(ids||[]).filter(id=>m.img?.[id]&&!seen.has(id));list.forEach((id,i)=>{seen.add(id);out.push({id,col,to,i:i+1,of:list.length});});};
 for(const c of m.characters||[])add(c.all,c.home,'characters');
 for(const c of m.crew||[])add(c.all,c.name,'crew');
 for(const c of m.supporting||[])add(c.all,c.name,'characters');
 for(const w of m.worlds||[])add(w.all,w.name,'worlds');
 add(m.spreads?.all,'Colour spreads','spreads');
 add(m.wall,'Ohara Library','library');
 add(m.backgrounds?.all,'Sky and sea','depths');
 return POOL=out;
}
const byId=id=>pool().find(p=>p.id===id);
// a fixed rarity per picture, like the card game he collects (Oct 21 2026 added the manga rarities and one of
// the archive's own; the new tiers were carved out above the old ones, so no card ever went down a rarity):
//  Sun God 0.4% (Nika's white clouds, the card beats like the Drums of Liberation), Red Manga 0.8% (red ink
//  on gold), Manga 1.8% (black ink, screentone), Secret 3%, Super rare 9%, Rare 23%, the rest Common
// and a few pictures he chose himself (Oct 22): the one-of-one Conqueror is his Sanji in the sun with the red
// lightning of Conqueror's Haki, drawn as red-and-black manga ink; one Robin is a Manga card.
const FIXED={'47b69db1012b':'conq','12b3e69a60d3':'m'};
export const CONQ='47b69db1012b',CONQ_AT=11;
export const rarity=id=>{if(FIXED[id])return FIXED[id];const v=parseInt(id.slice(-5),16)%1000;return v<30?'sec':v<34?'sun':v<42?'rm':v<60?'m':v<150?'sr':v<380?'r':'c';};
export const RNAME={conq:'Conqueror',sun:'Sun God',rm:'Red Manga',m:'Manga',sec:'Secret',sr:'Super rare',r:'Rare',c:'Common'};
const RSHORT={conq:'CONQUEROR',sun:'SUN GOD',rm:'RED MANGA',m:'MANGA',sec:'SEC',sr:'SR',r:'R',c:'C'};
const TIERS=['conq','sun','rm','m','sec','sr','r','c'],SPECIAL=new Set(['conq','sun','rm','m','sec']);
const ODDS=[['sun',0.4],['rm',0.8],['m',1.8],['sec',3],['sr',9],['r',23],['c',62]];
const tier=()=>{let x=Math.random()*100;for(const [t,w] of ODDS){if((x-=w)<0)return t;}return 'c';};

/* ---------------------------------------------------------------- fruits and relics */
// in the order they wash ashore; Robin's Hana Hana stays the very last one on purpose
export const FRUITS=[
 {id:'mera',name:'Mera Mera no Mi',kana:'メラメラ',user:'Portgas D. Ace',hue:'#ff6a2b',hue2:'#ffd23f',power:'Fire. Every tap bursts into flame, and embers follow your finger.',at:1},
 {id:'pika',name:'Pika Pika no Mi',kana:'ピカピカ',user:'Kizaru',hue:'#ffe45c',hue2:'#fffbe0',power:'Light. Tap and a rain of light bullets streaks down onto the spot; the pictures it hits flash white.',at:2},
 {id:'goro',name:'Goro Goro no Mi',kana:'ゴロゴロ',user:'Enel',hue:'#7fd0ff',hue2:'#ffffff',power:'Lightning. Tap anywhere and a bolt comes down out of the sky onto that exact spot.',at:3},
 {id:'moku',name:'Moku Moku no Mi',kana:'モクモク',user:'Smoker',hue:'#c9ccd2',hue2:'#ffffff',power:'Smoke. White smoke billows out of every tap and the pictures near it disappear inside it for a moment.',at:4},
 {id:'hie',name:'Hie Hie no Mi',kana:'ヒエヒエ',user:'Aokiji',hue:'#a9e6ff',hue2:'#e9fbff',power:'Ice. Frost spreads out from every tap, and the pictures it reaches freeze over for a moment.',at:6},
 {id:'bomu',name:'Bomu Bomu no Mi',kana:'ボムボム',user:'Mr. 5',hue:'#ff7a2f',hue2:'#ffe08a',power:'Bombs. Every tap explodes, and the pictures around it are blown back and bounce home.',at:7},
 {id:'mero',name:'Mero Mero no Mi',kana:'メロメロ',user:'Boa Hancock',hue:'#ff5aa5',hue2:'#ffd6ea',power:'Love. Hearts burst out of the tap, and every picture that looks at it turns to stone for a moment.',at:8},
 {id:'ope',name:'Ope Ope no Mi',kana:'オペオペ',user:'Trafalgar Law',hue:'#5aa8ff',hue2:'#c9e3ff',power:'ROOM. Tap to open a blue sphere. Every picture inside it trades places. Shambles.',at:10},
 {id:'suna',name:'Suna Suna no Mi',kana:'スナスナ',user:'Crocodile',hue:'#d9a65a',hue2:'#f6e2b3',power:'Sand. Tap a picture and it dries out and blows away as sand, then comes back. Tap the sea and a sandstorm rises.',at:12},
 {id:'horo',name:'Horo Horo no Mi',kana:'ホロホロ',user:'Perona',hue:'#e7d9ff',hue2:'#ffffff',power:'Ghosts. Negative Hollows float out of the tap, and the pictures they touch droop. “I’m sorry I was born…”',at:13},
 {id:'bara',name:'Bara Bara no Mi',kana:'バラバラ',user:'Buggy',hue:'#ff4f6d',hue2:'#ffd1d9',power:'Chop-chop. Tap a picture and it comes apart in pieces, then pulls itself back together.',at:15},
 {id:'ito',name:'Ito Ito no Mi',kana:'イトイト',user:'Donquixote Doflamingo',hue:'#ff6fae',hue2:'#ffffff',power:'Strings. The Birdcage closes in from the sky, and the pictures dangle on strings like puppets.',at:17},
 {id:'nikyu',name:'Nikyu Nikyu no Mi',kana:'ニキュニキュ',user:'Bartholomew Kuma',hue:'#ffb3c7',hue2:'#fff0f4',power:'Paws. A paw-shaped shockwave pushes every picture near it away, and they spring back.',at:19},
 {id:'yami',name:'Yami Yami no Mi',kana:'ヤミヤミ',user:'Marshall D. Teach',hue:'#8a63ff',hue2:'#1a0f33',power:'Darkness. Tap and a black hole pulls in everything near it, then lets go.',at:21},
 {id:'kage',name:'Kage Kage no Mi',kana:'カゲカゲ',user:'Gecko Moria',hue:'#6b5b8f',hue2:'#1a1426',power:'Shadows. The picture you tap loses its shadow, which walks off on its own; shadow bats scatter.',at:23},
 {id:'magu',name:'Magu Magu no Mi',kana:'マグマグ',user:'Akainu',hue:'#ff3d1f',hue2:'#ffb24a',power:'Magma. Lava erupts out of the tap, and the pictures around it melt and sag before they cool.',at:25},
 {id:'zushi',name:'Zushi Zushi no Mi',kana:'ズシズシ',user:'Fujitora',hue:'#8a7dff',hue2:'#d9d4ff',power:'Gravity. A meteor falls out of the sky onto the spot, and gravity presses the pictures flat.',at:26},
 {id:'gura',name:'Gura Gura no Mi',kana:'グラグラ',user:'Edward Newgate',hue:'#e8f4ff',hue2:'#ffffff',power:'Quakes. The air cracks like glass where you tap, and every picture on the screen shakes.',at:28},
 {id:'hana',name:'Hana Hana no Mi',kana:'ハナハナ',user:'Nico Robin',hue:'#ff8fc6',hue2:'#ffe3f1',power:'Bloom. Petals open wherever you tap, and the pictures around it bloom with them. Cien fleur.',at:30}
];
const FRUIT_AT=Object.fromEntries(FRUITS.map(f=>[f.at,f.id]));
const RELIC_AT={5:'ink'};
const pgCount=()=>{try{return (JSON.parse(localStorage.getItem('grand-archive:poneglyphs')||'[]')||[]).length;}catch{return 0;}};
const RELICS=[
 {id:'origin',name:'Where it began',k:'The first page',d:'The archive’s original opening, the way it was before the wall of pictures. “Anime is for losers.” Crossed out.',how:'Read every record in the Character Log (“Read everything I wrote”).',own:()=>B.relics.includes('origin'),act:'Play it'},
 {id:'ink',name:'Manga ink',k:'A way of seeing',d:'The whole archive in black-and-white ink, like a volume of the manga. Colour comes back to whatever you touch.',how:'Waiting in the fifth chest.',own:()=>B.relics.includes('ink'),act:()=>B.ink?'Turn it off':'Turn it on'},
 {id:'laughtale',name:'Laugh Tale',k:'The end of the road',d:'Where the four Road Poneglyphs lead, and what I found at the end of my own road.',how:'Take a rubbing of all four Road Poneglyphs.',own:()=>has('laughtale')||pgCount()>=4,act:'Sail there'},
 {id:'gold',name:'The golden poster',k:'Worth a billion',d:'Your wanted poster, printed in gold.',how:'Reach a bounty of ฿1,000,000,000.',own:()=>B.b>=1e9,act:null}
];

/* ---------------------------------------------------------------- what's in a chest */
function draw(n,gold,{lucky=false,from=null}={}){
 const P=from||pool(),out=[];
 for(let s=0;s<n;s++){
  let t=tier();if((gold||lucky)&&s===0&&(t==='c'||t==='r'))t='sr';if(lucky&&t==='c')t='r';
  // when a rarity has nothing left to find, the next rarity down (then up) stands in; the Conqueror only comes in its own chest
  const i=TIERS.indexOf(t),order=[...TIERS.slice(i),...TIERS.slice(0,i).reverse()].filter(x=>x!=='conq');let got=null;
  for(const x of order){const c=P.filter(p=>!B.cards[p.id]&&!out.includes(p)&&rarity(p.id)===x);if(c.length){got=rnd(c);break;}}
  // the whole archive is already in the log: a duplicate is worth berries instead
  out.push(got||{...rnd(P),dup:true});
 }
 return out;
}
// opening is decided and saved before the ceremony starts, so closing halfway never loses anything
function openOne(){
 const c=chests();if(!c.waiting)return null;
 const k=B.opened+1,bought=B.goldNext>0,gold=k%5===0||bought,special=FRUIT_AT[k]?{kind:'fruit',id:FRUIT_AT[k]}:RELIC_AT[k]?{kind:'relic',id:RELIC_AT[k]}:null;
 if(bought&&k%5!==0)B.goldNext--;
 const lucky=B.lucky>0;if(lucky)B.lucky--;
 const cards=draw((gold?5:3)-(special?1:0),gold,{lucky});
 // chest No. 11 holds the Conqueror, if it hasn't found you already
 const cq=pool().find(p=>p.id===CONQ);if(k===CONQ_AT&&cq&&!B.cards[CONQ])cards[cards.length-1]=cq;
 B.opened=k;const now=Date.now();
 cards.forEach(p=>{if(!p.dup)B.cards[p.id]=now;});
 if(special?.kind==='fruit'&&!B.fruits.includes(special.id))B.fruits.push(special.id);
 if(special?.kind==='relic'&&!B.relics.includes(special.id))B.relics.push(special.id);
 save();
 const dups=cards.filter(p=>p.dup).length;
 setTimeout(()=>{if(dups){once('dup:'+k,dups*2e6,'Duplicates, sold');gainGold(dups*20,'Duplicates, sold to a merchant');}if(k===10&&once('quest:chest',0,''))grantChest(1);},3500);
 return{k,gold,special,cards,lucky};
}

/* ---------------------------------------------------------------- pieces */
const PLANKS=8;
// a dark walnut chest with brass bands, built from planes in 3D; the lid is a half barrel of eight planks
export const chestHTML=(cls='')=>`<div class="ch ${cls}"><div class="ch-float"><div class="ch-rot"><div class="ch-body"><i class="ch-f ch-back"></i><i class="ch-f ch-left"></i><i class="ch-f ch-right"></i><i class="ch-f ch-bottom"></i><i class="ch-glow"></i><i class="ch-f ch-front"><i class="ch-lock"><i></i></i></i></div><div class="ch-lid">${Array.from({length:PLANKS},(_,k)=>{const a=(k+0.5)*Math.PI/PLANKS,sh=(0.62-0.55*Math.sin(a)+(a>Math.PI/2?0.18:0)).toFixed(2);return `<i class="ch-pl" style="--k:${k};--sh:${sh}"></i>`;}).join('')}<i class="ch-cap ch-cl"></i><i class="ch-cap ch-cr"></i><i class="ch-hasp"></i></div></div></div><i class="ch-shadow"></i></div>`;
const cardHTML=(p,{back=true,big=false}={})=>{const r=rarity(p.id);return `<div class="tc r-${r}${big?' big':''}" data-id="${p.id}"><div class="tc-in"><div class="tc-front"><img src="${big?FU(p.id):TH(p.id)}" alt="" decoding="async">${r==='m'||r==='rm'?'<i class="tc-ink" aria-hidden="true"></i><i class="tc-tone" aria-hidden="true"></i>':''}${r==='sun'?'<i class="tc-cloud" aria-hidden="true"></i><i class="tc-cloud b" aria-hidden="true"></i>':''}${r==='conq'?`<i class="tc-tone" aria-hidden="true"></i><i class="tc-haki" aria-hidden="true">${HAKI}</i>`:''}<i class="tc-foil" aria-hidden="true"></i><i class="tc-glare" aria-hidden="true"></i><span class="tc-meta"><b>${esc(p.col)}</b><small>No. ${p.i} / ${p.of}</small></span><span class="tc-r">${RSHORT[r]}</span>${p.dup?'<span class="tc-dup">Duplicate · ฿2,000,000</span>':''}</div>${back?'<div class="tc-back" aria-hidden="true"><i></i><b>Grand Archive</b></div>':''}</div></div>`;};
// Conqueror's Haki: black lightning with a red core, crackling across the card
const bolt=(x,y,len,a,seg=12)=>{let d=`M${x} ${y}`,br='';for(let i=1;i<=seg;i++){x+=Math.cos(a)*len/seg+(Math.random()-.5)*11;y+=Math.sin(a)*len/seg+(Math.random()-.5)*11;d+=`L${x.toFixed(1)} ${y.toFixed(1)}`;
  if(i%4===2){let bx=x,by=y,ba=a+(Math.random()<.5?-1:1)*(0.6+Math.random()*.5);br+=`M${bx.toFixed(1)} ${by.toFixed(1)}`;for(let j=0;j<4;j++){bx+=Math.cos(ba)*6+(Math.random()-.5)*6;by+=Math.sin(ba)*6+(Math.random()-.5)*6;br+=`L${bx.toFixed(1)} ${by.toFixed(1)}`;}}}return d+br;};
const HAKI=`<svg viewBox="0 0 100 140" preserveAspectRatio="none">${[[0,18,120,.35],[100,40,110,2.6],[8,120,95,-.55],[96,128,100,3.7],[50,0,90,1.75]].map(([x,y,l,a],i)=>{const d=bolt(x,y,l,a);return `<g style="--d:${(i*0.37).toFixed(2)}s"><path d="${d}" stroke="#000" stroke-width="3.4" vector-effect="non-scaling-stroke"/><path d="${d}" stroke="#ff2436" stroke-width="1.2" vector-effect="non-scaling-stroke"/></g>`;}).join('')}</svg>`;
const fruitHTML=(f,locked=false)=>`<div class="tf${locked?' locked':''}" style="--h1:${f.hue};--h2:${f.hue2}"><span class="tf-orb"><i></i></span><span class="tf-kana">${locked?'？？？':esc(f.kana)}</span></div>`;
const relicIcon={origin:'“',ink:'墨',laughtale:'✦',gold:'฿'};

/* ---------------------------------------------------------------- the room */
let dlg=null,tab='log',logCol='',shownB=0;
const $d=s=>dlg.querySelector(s);
export async function openTreasure(t){
 await roomsCSS();
 catchUp();
 if(!dlg)build();
 if(t)tab=t;
 render();
 if(!dlg.open){dlg.showModal();document.documentElement.style.overflow='hidden';dlg.scrollTop=0;}
 count();
 if(location.hash!=='#treasure')history.replaceState(null,'','#treasure');
}
// fruits added after someone already opened their chest go straight to the room (Hana always last)
function catchUp(){
 const miss=FRUITS.filter(f=>f.at<=B.opened&&!B.fruits.includes(f.id));if(!miss.length)return;
 miss.forEach(f=>B.fruits.push(f.id));save();
 setTimeout(()=>notice(miss.length>1?`${miss.length} new Devil Fruits`:'A new Devil Fruit',`${miss.map(f=>f.name).join(', ')}: waiting in the Devil Fruits tab.`,()=>{tab='fruits';render();}),600);
}
function build(){
 dlg=document.createElement('dialog');dlg.className='tr';dlg.setAttribute('aria-labelledby','tr-title');
 dlg.innerHTML=`<div class="tr-wrap">
  <header class="tr-head"><div><p class="eyebrow">The Treasure Room</p><h2 id="tr-title">Your <em>bounty.</em></h2></div><button class="tr-close" data-tr-close>Close ✕</button></header>
  <section class="tr-hero">
   <div class="tr-left"><div class="tr-poster" id="tr-poster"></div><div class="tr-epi" id="tr-epi"></div></div>
   <div class="tr-vault"><div class="tr-stage">${chestHTML('tr-chest')}<i class="tr-halo" aria-hidden="true"></i></div><div class="tr-under" id="tr-under"></div></div>
  </section>
  <nav class="tr-tabs" role="tablist" aria-label="The Treasure Room">
   <button role="tab" data-tab="log">Treasure Log</button><button role="tab" data-tab="market">Black Market</button><button role="tab" data-tab="fruits">Devil Fruits</button><button role="tab" data-tab="themes">Themes</button><button role="tab" data-tab="relics">Relics</button><button role="tab" data-tab="board">Bounty board</button>
  </nav>
  <div class="tr-panel" id="tr-panel" role="tabpanel"></div>
  <p class="tr-fine">Your bounty, chests and cards live in this browser only. Every picture is one of Goma’s; the cards are just a new way to look at them.</p>
 </div>
 <div class="tr-cer" id="tr-cer" hidden></div>
 <div class="tr-insp" id="tr-insp" hidden></div>`;
 document.body.appendChild(dlg);
 dlg.addEventListener('close',()=>{document.documentElement.style.overflow='';if(location.hash==='#treasure')history.replaceState(null,'',location.pathname+location.search);});
 dlg.addEventListener('cancel',e=>{const film=$d('.tr-film');if(film){e.preventDefault();film.querySelector('[data-film-close]').click();return;}if(!$d('#tr-cer').hidden||!$d('#tr-insp').hidden){e.preventDefault();closeLayers();}});
 dlg.addEventListener('click',onClick);
 onBounty(()=>{if(dlg.open&&$d('#tr-cer').hidden){renderHero();if(tab==='board'||tab==='market')renderPanel();}});
 // the chest and the inspected card lean toward the mouse, or the way the phone is held
 const rot=$d('.tr-chest .ch-rot');
 dlg.addEventListener('pointermove',e=>{if(coarse||motion.reduced)return;const x=e.clientX/innerWidth-0.5,y=e.clientY/innerHeight-0.5;rot.style.setProperty('--ty',(x*18).toFixed(2)+'deg');rot.style.setProperty('--tx',(y*-8).toFixed(2)+'deg');foil(e.clientX,e.clientY);});
 onTilt(t=>{if(!dlg.open||!coarse)return;rot.style.setProperty('--ty',(t.x*18).toFixed(2)+'deg');rot.style.setProperty('--tx',(t.y*-8).toFixed(2)+'deg');const c=$d('.tr-insp .tc');if(c){const r=c.getBoundingClientRect();foil(r.left+r.width*(0.5+t.x*0.5),r.top+r.height*(0.5+t.y*0.5));}});
 // a picture from the log opened full size goes back to the room afterwards
 registerCollection('treasure',()=>({title:'The Treasure Log',eyebrow:'Cards you found',ids:Object.keys(B.cards).sort((a,b)=>B.cards[b]-B.cards[a])}));
 document.getElementById('dialog')?.addEventListener('close',()=>{if(dlg.open)document.documentElement.style.overflow='hidden';});
}
// holographic foil + glare follow the pointer on whichever card is under it
function foil(x,y){dlg.querySelectorAll('.tc.r-sec,.tc.r-sr,.tc.r-m,.tc.r-rm,.tc.r-sun,.tc.r-conq,.tc.big').forEach(c=>{const r=c.getBoundingClientRect();if(!r.width)return;const mx=clamp((x-r.left)/r.width),my=clamp((y-r.top)/r.height);if(c.classList.contains('big')||(x>r.left-40&&x<r.right+40&&y>r.top-40&&y<r.bottom+40)){c.style.setProperty('--mx',(mx*100).toFixed(1)+'%');c.style.setProperty('--my',(my*100).toFixed(1)+'%');if(c.classList.contains('big'))c.style.setProperty('--rx',((mx-0.5)*22).toFixed(2)+'deg'),c.style.setProperty('--ry',((0.5-my)*16).toFixed(2)+'deg');}});}

function render(){renderHero();dlg.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===tab)));renderPanel();}
// the bounty counts up from where you last saw it
function count(){const el=$d('.tr-b');if(!el)return;const from=shownB,to=B.b;shownB=to;if(motion.reduced||from===to||!from){el.textContent=money(to);return;}const t0=performance.now(),d=1400;const step=t=>{const k=clamp((t-t0)/d),e=1-Math.pow(1-k,3);el.textContent=money(from+(to-from)*e);if(k<1)requestAnimationFrame(step);};requestAnimationFrame(step);}
function renderHero(){
 const t=title(),n=nextTitle(),c=chests(),poster=B.poster&&data.media?.img?.[B.poster]?B.poster:'3358de4cd87c';
 $d('#tr-poster').innerHTML=`<div class="wanted tr-wanted${B.b>=1e9?' gold':''}" style="--r:-1.6deg"><span class="w-top">WANTED</span><span class="w-photo"><img src="${TH(poster)}" alt="" decoding="async"></span><span class="w-dead">DEAD OR ALIVE</span><b class="w-name">GOMA</b><span class="w-bounty"><i>฿</i><span class="tr-b">${money(dlg.open?B.b:shownB||B.b)}</span><small>-</small></span><span class="w-line">“${esc(t[1])}”</span><span class="w-mark">MARINE</span></div>`;
 $d('#tr-epi').innerHTML=`<p class="tr-title"><small>Epithet</small><b>${esc(t[1])}</b><span>${esc(t[2])}</span></p>${n?`<p class="tr-nextt">Next title at <b>฿${money(n[0])}</b>: ${esc(n[1])}. <span>${esc(n[2])}</span></p>`:'<p class="tr-nextt">There is no title above this one.</p>'}<button class="link tr-photo" data-photo>Change the poster photo →</button><button class="tr-gold" data-tab="market"><i class="gp-coin" aria-hidden="true"></i><b>${goldFmt(B.gold)}</b><span>gold · Black Market →</span></button>`;
 $d('#tr-under').innerHTML=c.waiting?`<p class="tr-wait"><b>${c.waiting}</b> ${c.waiting>1?'chests':'chest'} waiting</p><button class="pill tr-open" data-open>Open ${c.waiting>1?'a chest':'the chest'}</button><p class="tr-nexts">Opened so far: ${B.opened}</p>`
  :`<p class="tr-wait">No chests waiting</p><div class="tr-bar"><i style="transform:scaleX(${clamp(c.frac).toFixed(3)})"></i></div><p class="tr-nexts">Next chest at <b>฿${money(c.next)}</b> · ฿${money(c.next-B.b)} to go. Keep exploring, reading and playing.</p>`;
 $d('.tr-stage').classList.toggle('ready',c.waiting>0);
}
function renderPanel(){
 const P=$d('#tr-panel');
 if(tab==='log')P.innerHTML=logHTML();
 if(tab==='fruits')P.innerHTML=fruitsHTML();
 if(tab==='relics')P.innerHTML=relicsHTML();
 if(tab==='board')P.innerHTML=boardHTML();
 if(tab==='market')P.innerHTML=marketHTML();
 if(tab==='themes')P.innerHTML=themesHTML();
}
/* ---------------------------------------------------------------- the Black Market: gold buys time */
const chestPrice=()=>Math.min(550,150+40*(B.bought||0));
const PRICE={lucky:90,fruit:400,pack:220};
let packCol='';
const nextFruit=()=>FRUITS.find(f=>!B.fruits.includes(f.id)&&f.id!=='hana')||(!B.fruits.includes('hana')?FRUITS.find(f=>f.id==='hana'):null);
const packCols=()=>{const P=pool(),m=new Map();P.forEach(p=>{if(!B.cards[p.id])m.set(p.col,(m.get(p.col)||0)+1);});return [...m].filter(([c])=>c!=='Ohara Library'&&c!=='Sky and sea').sort((a,b)=>b[1]-a[1]);};
function marketHTML(){
 const g=B.gold,cp=chestPrice(),st=B.streak||{n:0},H=todaysHunt(),nf=nextFruit(),cols=packCols();
 if(!packCol||!cols.some(([c])=>c===packCol))packCol=cols[0]?.[0]||'';
 const price=(n,act,label)=>`<button class="pill small mk-buy" data-buy="${act}"${g<n?' disabled':''}><i class="gp-coin" aria-hidden="true"></i>${goldFmt(n)}${label?` · ${label}`:''}</button>${g<n?`<small class="mk-need">${goldFmt(n-g)} more to go</small>`:''}`;
 const likes=Object.keys(B.likes||{}).length;
 return `<div class="mk-top">
  <div class="mk-bal"><i class="gp-coin big" aria-hidden="true"></i><div><b>${goldFmt(g)}</b><small>gold in your pocket · ${goldFmt(B.goldEver||0)} earned in all</small></div></div>
  <div class="mk-streak"><small>Days at sea in a row</small><div class="mk-dots">${Array.from({length:7},(_,i)=>`<i class="${i<Math.min(st.n,7)?'on':''}"></i>`).join('')}</div><span>Day ${st.n||1}: ${25*Math.min(st.n||1,7)+((st.n||1)>=7?50:0)} gold. Come back tomorrow for ${25*Math.min((st.n||1)+1,7)+((st.n||1)+1>=7?50:0)}.</span></div>
 </div>
 ${H?`<div class="mk-hunt${H.found?' found':''}"><span class="mk-star" aria-hidden="true">✦</span><div><small>Today’s treasure</small><p>${H.found?`Found. Tomorrow a new picture hides somewhere else.`:`One picture in <b>${esc(H.col.name)}</b>’s collection is glowing today. Find it and open it: ฿5,000,000 and 150 gold.`}</p></div>${H.found?'':`<button class="pill small ghost" data-collection="${H.col.key}">Search ${esc(H.col.name)} →</button>`}</div>`:''}
 <div class="mk-grid">
  <article class="mk-item"><div class="mk-art">${chestHTML('mk-chest')}</div><small>A chest</small><b>Skip the wait</b><p>Three cards (and whatever else the sea puts in it). The price goes up a little with every chest you buy.</p>${price(cp,'chest','buy and open')}</article>
  <article class="mk-item gold"><div class="mk-art">${chestHTML('gold mk-chest')}</div><small>A gold chest</small><b>Five cards, one Super rare or better</b><p>Opens like the chest every fifth one is.</p>${price(cp*3,'goldchest','buy and open')}</article>
  <article class="mk-item"><div class="mk-art"><span class="mk-pose"><i></i></span></div><small>The lucky compass</small><b>The next chest is kinder</b><p>Every card in it Rare or better, and the first one Super rare or better.${B.lucky?` <em>${B.lucky} waiting on your next ${B.lucky>1?'chests':'chest'}.</em>`:''}</p>${price(PRICE.lucky,'lucky')}</article>
  <article class="mk-item"><div class="mk-art"><span class="mk-pack"><i></i><i></i><i></i></span></div><small>A pack</small><b>Three cards of one collection</b><p>Pick whose cards you want. Only ones you haven’t found.</p>${cols.length?`<div class="mk-cols">${cols.slice(0,24).map(([c,n])=>`<button data-pack-col="${esc(c)}" aria-pressed="${c===packCol}">${esc(c)} <b>${n}</b></button>`).join('')}</div>${price(PRICE.pack,'pack','open it')}`:'<p><em>You’ve found every card in the archive.</em></p>'}</article>
  <article class="mk-item"><div class="mk-art">${nf?fruitHTML(nf,true):''}</div><small>A Devil Fruit</small><b>${nf?'The next fruit, without the wait':'Every fruit is yours'}</b><p>${nf?`An unknown fruit from the next crate. ${nf.id==='hana'?'The last one. ':''}You won’t know which until it’s yours.`:'Nothing left to sell.'}</p>${nf?price(PRICE.fruit,'fruit'):''}</article>
  <article class="mk-item conq${B.cards[CONQ]?' have':''}"><div class="mk-art"><span class="mk-conq">${HAKI}</span></div><small>Not for sale</small><b>${B.cards[CONQ]?'The Conqueror is yours':'The Conqueror'}</b><p>${B.cards[CONQ]?'The only one in the archive. It found you.':`There is one card gold can’t buy. It finds you, in chest No. ${CONQ_AT}. ${Math.max(0,CONQ_AT-B.opened)} to go.`}</p></article>
 </div>
 <h3 class="mk-h">Ways to fill your pockets</h3>
 <ul class="mk-ways">
  <li><b>Sail on</b><span>Every screen you scroll yourself: 1 gold, up to 40 a minute</span></li>
  <li><b>Catch floating treasure</b><span>Coins drift across the screen now and then: 12–22, a handful 35–50, a golden doubloon 110–140</span></li>
  <li><b>Like pictures</b><span>The heart in the full-size viewer, or a double tap: 5 gold for each new one</span></li>
  <li><b>Days at sea in a row</b><span>25 gold a day, more each day, 225 on the seventh</span></li>
  <li><b>Today’s treasure</b><span>150 gold, once a day</span></li>
  <li><b>Your bounty</b><span>Every ฿1,000,000 you earn drops 1 gold</span></li>
  <li><b>Duplicates</b><span>Sold to a merchant for 20 gold each</span></li>
 </ul>
 <p class="mk-likes">${likes?`You’ve liked ${likes} ${likes===1?'picture':'pictures'}. <button class="link" data-collection="fav:">Open My favourites →</button>`:'Pictures you like are gathered into a collection of their own, My favourites.'}</p>`;
}
async function buy(what){
 const cp=chestPrice();
 if(what==='chest'||what==='goldchest'){const n=what==='chest'?cp:cp*3;if(!spendGold(n))return;B.bought=(B.bought||0)+1;if(what==='goldchest')B.goldNext=(B.goldNext||0)+1;save();grantChest(1);renderHero();ceremony();return;}
 if(what==='lucky'){if(!spendGold(PRICE.lucky))return;B.lucky=(B.lucky||0)+1;save();notice('The lucky compass','It points the way on your next chest.');renderPanel();return;}
 if(what==='fruit'){const f=nextFruit();if(!f||!spendGold(PRICE.fruit))return;B.fruits.push(f.id);save();tab='fruits';render();notice(`You bought the ${f.name}`,'It’s waiting in the Devil Fruits tab. Eat it when you’re ready.');return;}
 if(what==='pack'){const from=pool().filter(p=>p.col===packCol);if(!from.length||!spendGold(PRICE.pack))return;
  const cards=draw(3,false,{from}),now=Date.now();cards.forEach(p=>{if(!p.dup)B.cards[p.id]=now;});save();
  const dups=cards.filter(p=>p.dup).length;if(dups)setTimeout(()=>gainGold(dups*20,'Duplicates, sold to a merchant'),3500);
  busy=true;try{await stage({k:B.opened,pack:packCol,gold:false,special:null,cards});}finally{busy=false;}return;}
}
/* ---------------------------------------------------------------- themes */
function themesHTML(){
 const now=B.theme||'auto',own=r=>Object.keys(B.cards).some(id=>rarity(id)===r);
 const sw=(id,t,ok,how)=>`<button class="th-sw${now===id?' on':''}${ok?'':' locked'}" data-theme-set="${id}"${ok?'':' disabled'} style="--a:${t.a};--b:${t.b};--e:${t.e}"><span class="th-chip" aria-hidden="true"></span><b>${esc(t.name)}</b><small>${ok?(now===id?'Wearing it':'Wear it'):esc(how)}</small></button>`;
 const fr=FRUITS.map(f=>sw(f.id,THEMES[f.id],B.fruits.includes(f.id),'Find the fruit')).join('');
 const cards=['m','rm','sun','conq'].map(r=>sw(r,THEMES[r],own(r),`Find a ${RNAME[r]} card`)).join('');
 const eaten=B.eat&&THEMES[B.eat];
 return `<p class="tf-lede">A theme repaints the whole archive: the accents, the words in every title, the light at the edges of the screen.</p>
 <div class="th-row"><button class="th-sw th-plain${now==='auto'?' on':''}" data-theme-set="auto" style="--a:${eaten?eaten.a:'#f3c969'};--b:${eaten?eaten.b:'#fff1c2'};--e:${eaten?eaten.e:'#c8922f'}"><span class="th-chip" aria-hidden="true"></span><b>Follow my Devil Fruit</b><small>${eaten?`Now: ${esc(eaten.name)}`:'Nothing eaten: the archive’s gold'}</small></button><button class="th-sw th-plain${now==='none'?' on':''}" data-theme-set="none" style="--a:#f3c969;--b:#fff1c2;--e:#c8922f"><span class="th-chip" aria-hidden="true"></span><b>The archive’s gold</b><small>The original look</small></button></div>
 <h3 class="mk-h">From the cards</h3><div class="th-grid">${cards}</div>
 <h3 class="mk-h">From the Devil Fruits</h3><div class="th-grid">${fr}</div>`;
}
function logHTML(){
 const P=pool(),got=P.filter(p=>B.cards[p.id]),cols=[...new Set(P.map(p=>p.col))];
 const per=r=>got.filter(p=>rarity(p.id)===r).length;
 const head=`<div class="tl-head"><p class="tl-count"><b>${got.length}</b> of ${P.length} cards found</p><p class="tl-r">${TIERS.map(r=>`<span class="tl-rr r-${r}"><i></i>${RNAME[r]} <b>${per(r)}</b></span>`).join('')}</p><div class="tr-bar"><i style="transform:scaleX(${(got.length/Math.max(1,P.length)).toFixed(4)})"></i></div></div>`;
 const chips=`<div class="tl-chips"><button data-col="" aria-pressed="${!logCol}">Found <b>${got.length}</b></button>${cols.map(c=>{const all=P.filter(p=>p.col===c),g=all.filter(p=>B.cards[p.id]).length;return `<button data-col="${esc(c)}" aria-pressed="${logCol===c}"${g===all.length?' class="done"':''}>${esc(c)} <b>${g}/${all.length}</b></button>`;}).join('')}</div>`;
 const list=logCol?P.filter(p=>p.col===logCol):got.slice().sort((a,b)=>B.cards[b.id]-B.cards[a.id]);
 const grid=list.length?`<div class="tl-grid">${list.map(p=>B.cards[p.id]?`<button class="tl-card" data-card-id="${p.id}" aria-label="${esc(p.col)} ${p.i}, ${RNAME[rarity(p.id)]}">${cardHTML(p,{back:false})}</button>`:`<div class="tl-slot"><span>No. ${p.i}</span></div>`).join('')}</div>`:`<p class="tl-empty">No cards yet. Open your first chest above: every picture in the archive is waiting to be found.</p>`;
 return head+chips+grid;
}
function fruitsHTML(){
 const eaten=B.eat;
 return `<p class="tf-lede">Some chests hold a Devil Fruit. Eat one and the archive answers your taps with its power. You can only eat one at a time.</p><div class="tf-grid">${FRUITS.map(f=>{const own=B.fruits.includes(f.id),left=f.at-B.opened;return `<article class="tf-card${own?'':' locked'}${eaten===f.id?' eaten':''}">${fruitHTML(f,!own)}<div class="tf-copy"><small>${own?esc(f.user):`Chest No. ${f.at}`}</small><b>${own?esc(f.name):'An unknown fruit'}</b><p>${own?esc(f.power):left>0?`Waiting in chest No. ${f.at}. ${left} ${left===1?'chest':'chests'} to go.`:'Open your chests to find it.'}</p>${own?`<button class="pill small${eaten===f.id?' ghost':''}" data-eat="${f.id}">${eaten===f.id?'Spit it out':'Eat it'}</button>${eaten===f.id?'<span class="tf-in">In your stomach</span>':''}`:''}</div></article>`;}).join('')}</div>`;
}
function relicsHTML(){
 return `<div class="tq-grid">${RELICS.map(r=>{const own=r.own(),act=typeof r.act==='function'?r.act():r.act;return `<article class="tq${own?'':' locked'}"><span class="tq-ico" aria-hidden="true">${own?relicIcon[r.id]:'?'}</span><small>${esc(r.k)}</small><b>${esc(own?r.name:'A sealed relic')}</b><p>${esc(own?r.d:r.how)}</p>${own&&act?`<button class="pill small" data-relic="${r.id}">${esc(act)}</button>`:''}${own&&!act?'<span class="tf-in">On your poster</span>':''}</article>`;}).join('')}</div>`;
}
function boardHTML(){
 return `<ol class="bb">${QUESTS.map(q=>{const [a,b]=q.n(),done=a>=b;return `<li class="bb-q${done?' done':''}"><span class="bb-tick" aria-hidden="true">${done?'✓':''}</span><div class="bb-t"><b>${esc(q.t)}</b><p>${esc(q.d)}</p><div class="tr-bar"><i style="transform:scaleX(${clamp(a/b).toFixed(3)})"></i></div></div><div class="bb-n"><b>${Math.min(a,b)} / ${b}</b><small>${esc(q.pay)}</small></div></li>`;}).join('')}</ol><p class="bb-also">Also: a quarter of a million for every 15 seconds you spend here, and ฿5,000,000 for every chapter you reach for the first time.</p>`;
}

/* ---------------------------------------------------------------- clicks */
function closeLayers(){const c=$d('#tr-cer'),i=$d('#tr-insp');if(!i.hidden){i.hidden=true;i.innerHTML='';return;}if(!c.hidden){c.hidden=true;c.innerHTML='';render();count();}}
async function onClick(e){
 const t=e.target;
 if(t.closest('[data-tr-close]')||t===dlg){if(!$d('#tr-cer').hidden||!$d('#tr-insp').hidden)closeLayers();else dlg.close();return;}
 const tb=t.closest('[data-tab]');if(tb){tab=tb.dataset.tab;render();return;}
 if(t.closest('[data-open]')){ceremony();return;}
 const col=t.closest('[data-col]');if(col){logCol=col.dataset.col;renderPanel();return;}
 const card=t.closest('[data-card-id]');if(card){inspect(card.dataset.cardId);return;}
 const eat=t.closest('[data-eat]');if(eat){const id=eat.dataset.eat;const m=await import('./fruits.js');if(B.eat===id){m.spit();}else{m.eat(id,{fromRoom:true});}renderPanel();return;}
 const rel=t.closest('[data-relic]');if(rel){relic(rel.dataset.relic);return;}
 const by=t.closest('[data-buy]');if(by&&!by.disabled){buy(by.dataset.buy);return;}
 const pc=t.closest('[data-pack-col]');if(pc){packCol=pc.dataset.packCol;renderPanel();return;}
 const th=t.closest('[data-theme-set]');if(th&&!th.disabled){setTheme(th.dataset.themeSet);renderPanel();return;}
 if(t.closest('[data-collection]'))return;
 if(t.closest('[data-photo]')){tab='log';logCol='';render();$d('#tr-panel').scrollIntoView({behavior:motion.reduced?'auto':'smooth',block:'start'});notice('Pick a card','Open any card you’ve found and choose “Put it on my poster”.');return;}
 if(t.closest('[data-insp-close]')){closeLayers();return;}
 const pv=t.closest('[data-poster]');if(pv){B.poster=pv.dataset.poster;save();renderHero();closeLayers();notice('New poster photo','Your wanted poster has a new face.');return;}
 const vw=t.closest('[data-viewfull]');if(vw){openViewer('treasure',vw.dataset.viewfull);return;}
 if(t.closest('[data-next]')){$d('#tr-cer').hidden=true;$d('#tr-cer').innerHTML='';renderHero();ceremony();return;}
 if(t.closest('[data-collect]')){closeLayers();return;}
}
function relic(id){
 if(id==='origin')playOrigin();
 if(id==='ink'){B.ink=!B.ink;save();document.documentElement.classList.toggle('ink',B.ink);renderPanel();notice(B.ink?'Manga ink':'Colour is back',B.ink?'The archive is in black and white. Touch a picture to bring its colour back.':'The archive is in full colour again.');}
 if(id==='laughtale')import('./poneglyph.js').then(m=>m.openLaughTale());
}
function inspect(id){
 const p=byId(id);if(!p)return;const r=rarity(id),L=$d('#tr-insp');
 L.innerHTML=`<div class="ti-in"><div class="ti-card">${cardHTML(p,{back:false,big:true})}</div><div class="ti-copy"><p class="eyebrow">${esc(RNAME[r])} · No. ${p.i} of ${p.of}</p><h3>${esc(p.col)}</h3><p class="ti-when">Found ${new Date(B.cards[id]).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</p><div class="ti-acts"><button class="pill small" data-poster="${id}">Put it on my poster</button><button class="pill small ghost" data-viewfull="${id}">View full size</button><button class="link" data-insp-close>Back to the log</button></div></div></div>`;
 L.hidden=false;
}

/* ---------------------------------------------------------------- the ceremony */
let busy=false;
async function ceremony(){
 if(busy)return;const roll=openOne();if(!roll)return;busy=true;
 try{await stage(roll);}finally{busy=false;}
}
async function stage(roll){
 const L=$d('#tr-cer'),items=[...roll.cards.map(p=>({p})),...(roll.special?[{s:roll.special}]:[])];
 L.innerHTML=`<div class="tc-sky" aria-hidden="true"><i class="tc-beam"></i></div>
  <p class="tc-k">${roll.pack?`A ${esc(roll.pack)} pack`:`${roll.gold?'A gold chest':'Chest'} · No. ${roll.k}`}${roll.lucky?' · with the lucky compass':''}</p>
  <div class="tc-chest">${chestHTML(roll.gold?'gold big':'big')}</div>
  <p class="tc-hint">Tap the chest</p>
  <div class="tc-row n${items.length}">${items.map((it,i)=>it.p?`<button class="tc-slot" data-i="${i}" aria-label="A card, face down">${cardHTML(it.p)}</button>`:`<button class="tc-slot tc-special" data-i="${i}" aria-label="Something else, face down">${specialHTML(it.s)}</button>`).join('')}</div>
  <div class="tc-name" id="tc-name"></div>
  <div class="tc-acts"><button class="pill" data-collect>Collect</button>${chests().waiting?`<button class="pill ghost" data-next>Open the next chest (${chests().waiting})</button>`:''}</div>
  <div class="tc-dust" aria-hidden="true"></div>`;
 L.hidden=false;L.classList.remove('opened','risen','done');
 const ch=L.querySelector('.ch'),rot=ch.querySelector('.ch-rot'),lid=ch.querySelector('.ch-lid'),lock=ch.querySelector('.ch-lock'),slots=[...L.querySelectorAll('.tc-slot')];
 // the chest drops in and lands
 ch.animate([{transform:'translate3d(0,-70vh,0)',opacity:0},{transform:'translate3d(0,0,0)',opacity:1,offset:.7},{transform:'translate3d(0,-14px,0)',offset:.85},{transform:'none'}],{duration:motion.reduced?1:900,easing:'cubic-bezier(.3,.7,.4,1)'});
 await wait(motion.reduced?0:950);
 // wait for a tap on it (or carry on after a moment)
 await new Promise(res=>{const go=()=>{clearTimeout(tm);ch.removeEventListener('click',go);res();};const tm=setTimeout(go,motion.reduced?0:3200);ch.addEventListener('click',go);});
 L.querySelector('.tc-hint').classList.add('gone');
 // it shakes, the lock pops, the lid swings open on a column of light
 await rot.animate([{transform:'rotateZ(0)'},{transform:'rotateZ(-4deg)'},{transform:'rotateZ(4deg)'},{transform:'rotateZ(-3deg)'},{transform:'rotateZ(2deg)'},{transform:'rotateZ(0)'}],{duration:motion.reduced?1:560,easing:'ease-in-out',composite:'add'}).finished.catch(()=>{});
 lock.animate([{transform:'none',opacity:1},{transform:'translate3d(30px,-60px,40px) rotate(60deg)',opacity:0}],{duration:motion.reduced?1:520,easing:'cubic-bezier(.2,.8,.3,1)',fill:'forwards'});
 lid.animate([{transform:'rotateX(0deg)'},{transform:'rotateX(122deg)',offset:.72},{transform:'rotateX(108deg)'}],{duration:motion.reduced?1:1000,easing:'cubic-bezier(.2,.8,.3,1)',fill:'forwards'});
 L.classList.add('opened');burst(L.querySelector('.tc-dust'),roll.gold);
 await wait(650);
 // the treasure rises out, face down, and fans out in front of you
 const cr=ch.getBoundingClientRect(),cx=cr.left+cr.width/2,cy=cr.top+cr.height*0.42;
 L.classList.add('risen');
 slots.forEach((s,i)=>{const r=s.getBoundingClientRect(),dx=cx-(r.left+r.width/2),dy=cy-(r.top+r.height/2);
  s.animate([{transform:`translate3d(${dx}px,${dy}px,0) scale(.25) rotateX(70deg)`,opacity:0},{opacity:1,offset:.25},{transform:'none',opacity:1}],{duration:motion.reduced?1:900,delay:motion.reduced?0:i*130,easing:'cubic-bezier(.2,.9,.25,1.08)',fill:'backwards'});});
 await wait(900+items.length*130);
 // they turn over one by one; tap one to turn it sooner
 const flip=i=>{const s=slots[i];if(!s||s.classList.contains('up'))return;s.classList.add('up');const it=items[i];
  if(it.p){const r=rarity(it.p.id);if(r==='sr'||SPECIAL.has(r))flash(s,r);if(r==='sun'||r==='rm'||r==='conq')callout(r,s);s.setAttribute('aria-label',`${it.p.col}, ${RNAME[r]}`);}
  else{flash(s,'special');name(it.s);}};
 L.querySelector('.tc-row').addEventListener('click',e=>{const s=e.target.closest('.tc-slot');if(s)flip(+s.dataset.i);});
 for(let i=0;i<items.length;i++){flip(i);await wait(items[i].s?700:420);}
 L.classList.add('done');
 renderHero();
}
// a fruit or a relic comes out of the chest face down like the cards, and turns over last
function specialHTML(s){
 const face=s.kind==='fruit'?(f=>`<div class="tc-front tc-sp">${fruitHTML(f)}<b>${esc(f.name)}</b><small>A Devil Fruit</small></div>`)(FRUITS.find(x=>x.id===s.id))
  :`<div class="tc-front tc-sp tc-relic"><span class="tq-ico">${relicIcon[s.id]}</span><b>${esc(RELICS.find(r=>r.id===s.id).name)}</b><small>A relic</small></div>`;
 return `<div class="tc tc-x"><div class="tc-in">${face}<div class="tc-back" aria-hidden="true"><i></i><b>Grand Archive</b></div></div></div>`;
}
function name(s){
 const el=$d('#tc-name');
 if(s.kind==='fruit'){const f=FRUITS.find(x=>x.id===s.id);el.innerHTML=`<p class="eyebrow">You found a Devil Fruit</p><h3>${esc(f.name)}</h3><p>${esc(f.power)}</p><button class="pill small" data-eat="${f.id}">Eat it now</button>`;}
 else{const r=RELICS.find(x=>x.id===s.id);el.innerHTML=`<p class="eyebrow">You found a relic</p><h3>${esc(r.name)}</h3><p>${esc(r.d)}</p>${s.id==='ink'?'<button class="pill small" data-relic="ink">Turn it on</button>':''}`;}
 el.classList.add('in');
}
// the rarest ones announce themselves
function callout(r,slot){const el=$d('#tc-name');if(!el)return;
 if(r==='conq'){el.innerHTML='<p class="eyebrow">Conqueror’s Haki</p><h3>The one and only.</h3><p>There is a single Conqueror card in the whole archive, and it chose you. Everything else in the chest just fainted.</p>';el.classList.add('in');haki(slot);return;}
 if(el.classList.contains('in'))return;el.innerHTML=r==='sun'?'<p class="eyebrow">Don don don don</p><h3>A Sun God card.</h3><p>The rarest card in the archive. Listen to it: it has a heartbeat.</p>':'<p class="eyebrow">Red ink</p><h3>A Red Manga card.</h3><p>Printed in red and gold, like the rarest manga cards in the real game.</p>';el.classList.add('in');}
// the Conqueror arrives like Haki does: a black-and-red shockwave, the room shakes, the other cards faint
function haki(slot){
 if(motion.reduced)return;const L=$d('#tr-cer');
 const w=document.createElement('i');w.className='tc-hakiwave';slot.appendChild(w);setTimeout(()=>w.remove(),1600);
 L.animate([{transform:'none'},{transform:'translate(-6px,3px)'},{transform:'translate(5px,-4px)'},{transform:'translate(-4px,2px)'},{transform:'translate(3px,-2px)'},{transform:'none'}],{duration:520});
 L.querySelectorAll('.tc-slot').forEach(s=>{if(s!==slot)s.animate([{filter:'none',transform:'none'},{filter:'brightness(.35) grayscale(.6)',transform:'translateY(10px) rotate(-3deg)',offset:.3},{filter:'brightness(.35) grayscale(.6)',transform:'translateY(10px) rotate(-3deg)',offset:.7},{filter:'none',transform:'none'}],{duration:2200,easing:'ease-in-out'});});
}
function flash(s,kind){s.classList.add('flash-'+kind);if(motion.reduced)return;const f=document.createElement('i');f.className='tc-flash '+kind;s.appendChild(f);setTimeout(()=>f.remove(),1400);}
function burst(host,gold){
 if(motion.reduced)return;const n=gold?46:30;
 for(let i=0;i<n;i++){const d=document.createElement('i'),a=-Math.PI/2+(Math.random()-0.5)*2.2,v=160+Math.random()*320,x=Math.cos(a)*v,y=Math.sin(a)*v;
  d.style.setProperty('--s',(3+Math.random()*5).toFixed(1)+'px');host.appendChild(d);
  d.animate([{transform:'translate3d(0,0,0) scale(1)',opacity:1},{transform:`translate3d(${x.toFixed(0)}px,${y.toFixed(0)}px,0) scale(.9)`,opacity:1,offset:.55},{transform:`translate3d(${(x*1.2).toFixed(0)}px,${(y+260).toFixed(0)}px,0) scale(.3)`,opacity:0}],{duration:1500+Math.random()*900,easing:'cubic-bezier(.15,.7,.4,1)'}).finished.then(()=>d.remove());}
}

/* ---------------------------------------------------------------- relic: Where it began */
async function playOrigin(){
 const sec=document.getElementById('origin'),pin=sec?.querySelector('.pin');if(!pin)return;
 const {openingScene}=await import('./s/opening.js');
 const film=document.createElement('div');film.className='tr-film';film.innerHTML=`<div class="tr-film-bar"><span>Where it began · the archive’s first page</span><span><button class="link" data-replay>Replay</button><button class="tr-close" data-film-close>Close ✕</button></span></div>`;
 dlg.appendChild(film);film.prepend(pin);
 const sc=openingScene(pin);sc.fill();
 let t0=performance.now(),raf=0;const DUR=19000;
 const tick=t=>{const p=clamp((t-t0)/DUR);sc.draw(p);if(p<1)raf=requestAnimationFrame(tick);};
 raf=requestAnimationFrame(tick);
 film.addEventListener('click',e=>{if(e.target.closest('[data-replay]')){t0=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);}if(e.target.closest('[data-film-close]')){cancelAnimationFrame(raf);sec.appendChild(pin);film.remove();}});
}

// The Game Room. Four small games, all made of the archive itself, each paying berries into your bounty:
//  - Higher or lower: two wanted posters, one bounty hidden. Every Straw Hat at every point of the story
//    (canon bounties, arc by arc) plus a few friends. How long can the streak go?
//  - Gone with the wind: after Enies Lobby the new posters blew across the whole world. Catch them before
//    the wind does, thirty seconds, and keep your hands off the Marines.
//  - Know the captain: a quiz about Goma, written from his own notes and lists (the word each character
//    left behind, his top 10, his ratings, when he watched what, the crew he loves).
//  - Observation Haki: one picture, then a wall of them. Find it again before time runs out.
// Oct 30 2026: the posters had stopped showing (the gold purse took over their class name, .gp; they are .gpost
// now), and three more games joined: Who's that pirate? (a picture blurred into blocks that sharpens, name them
// fast), Memory log (pairs of his pictures) and Put the poster back (a picture cut into squares, swap them home).
// The menu leads with Grand Line Trivia, the hard One Piece quiz on a page of its own (trivia.html).
import {esc,data,TH,FU,clamp,motion,coarse} from './core.js';
import {B,money,earn,once,best} from './bounty.js';
import {roomsCSS,pool} from './treasure.js';

const M=1e6,rnd=a=>a[Math.floor(Math.random()*a.length)],shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const wait=ms=>new Promise(r=>setTimeout(r,motion.reduced?Math.min(ms,40):ms));

/* ---------------------------------------------------------------- canon bounties, arc by arc */
// [who, bounty, name on the poster, when]
const BOUNTIES=[
 ['luffy',30e6,'Monkey D. Luffy','after Arlong Park'],['luffy',100e6,'Monkey D. Luffy','after Alabasta'],['luffy',300e6,'Monkey D. Luffy','after Enies Lobby'],['luffy',400e6,'Monkey D. Luffy','after Marineford'],['luffy',500e6,'Monkey D. Luffy','after Dressrosa'],['luffy',1.5e9,'Monkey D. Luffy','after Whole Cake Island'],['luffy',3e9,'Monkey D. Luffy','after Wano'],
 ['zoro',60e6,'Roronoa Zoro','after Alabasta'],['zoro',120e6,'Roronoa Zoro','after Enies Lobby'],['zoro',320e6,'Roronoa Zoro','after Dressrosa'],['zoro',1.111e9,'Roronoa Zoro','after Wano'],
 ['nami',16e6,'Nami','after Enies Lobby'],['nami',66e6,'Nami','after Dressrosa'],['nami',366e6,'Nami','after Wano'],
 ['usopp',30e6,'Sogeking','after Enies Lobby'],['usopp',200e6,'Usopp','after Dressrosa'],['usopp',500e6,'Usopp','after Wano'],
 ['sanji',77e6,'Sanji','after Enies Lobby'],['sanji',177e6,'Sanji','after Dressrosa'],['sanji',330e6,'Sanji','after Whole Cake Island'],['sanji',1.032e9,'Sanji','after Wano'],
 ['chopper',50,'Chopper','after Enies Lobby'],['chopper',100,'Chopper','after Dressrosa'],['chopper',1000,'Chopper','after Wano'],
 ['robin',79e6,'Nico Robin','at eight years old'],['robin',80e6,'Nico Robin','after Enies Lobby'],['robin',130e6,'Nico Robin','after Dressrosa'],['robin',930e6,'Nico Robin','after Wano'],
 ['franky',44e6,'Franky','after Enies Lobby'],['franky',94e6,'Franky','after Dressrosa'],['franky',394e6,'Franky','after Wano'],
 ['brook',33e6,'Brook','with the Rumbar Pirates'],['brook',83e6,'Brook','after Dressrosa'],['brook',383e6,'Brook','after Wano'],
 ['jinbe',438e6,'Jinbe','after Whole Cake Island'],['jinbe',1.1e9,'Jinbe','after Wano'],
 ['hancock',1.659e9,'Boa Hancock','once the Warlords fell'],['law',500e6,'Trafalgar Law','after Dressrosa'],['law',3e9,'Trafalgar Law','after Wano'],['kuma',296e6,'Bartholomew Kuma','before he was a Warlord']
].map(([who,b,name,when])=>({who,b,name,when}));
const COL={luffy:['characters','Luffy'],zoro:['characters','Zoro'],robin:['characters','Robin'],sanji:['characters','Sanji'],nami:['crew','Nami'],usopp:['crew','Usopp'],chopper:['crew','Chopper'],franky:['crew','Franky'],brook:['crew','Brook'],jinbe:['crew','Jinbe'],hancock:['crew','Hancock'],law:['crew','Law'],kuma:['crew','Kuma'],garp:['crew','Garp']};
const photosOf=who=>{const [k,n]=COL[who]||[],m=data.media||{};const c=k==='characters'?(m.characters||[]).find(x=>x.home===n):(m.crew||[]).find(x=>x.name===n);return c?c.all.filter(id=>m.img?.[id]):[];};
const photo=who=>{const p=photosOf(who);return p.length?rnd(p):null;};
const posterHTML=(e,shown,id=photo(e.who),cls='')=>`<div class="wanted gpost ${cls}" style="--r:0deg"><span class="w-top">WANTED</span><span class="w-photo">${id?`<img src="${TH(id)}" alt="" decoding="async">`:''}</span><span class="w-dead">DEAD OR ALIVE</span><b class="w-name">${esc(e.name.toUpperCase())}</b><span class="w-bounty"><i>฿</i><span class="gp-v">${shown?money(e.b):'?,???,???,???'}</span><small>-</small></span><span class="w-line">${esc(e.when)}</span></div>`;

/* ---------------------------------------------------------------- the room */
const GAMES=[
 {id:'hl',t:'Higher or <em>lower</em>',k:'Bounties',line:'Two wanted posters, one bounty hidden. Every Straw Hat at every point of the story. How long can your streak go?',art:'fcf118f387b7',best:()=>`Best streak ${B.best.hl||0}`},
 {id:'wind',t:'Gone with the <em>wind</em>',k:'Arcade',line:'After Enies Lobby the new posters blew across the world. Catch them in thirty seconds. Keep your hands off the Marines.',art:'a352eedbb5a9',best:()=>`Best ${B.best.wind||0} caught`},
 {id:'quiz',t:'Know the <em>captain</em>',k:'Quiz',line:'Ten questions about me, straight from my notes: the words they left behind, my top 10, my ratings, my crew.',art:'373131619907',best:()=>`Best ${B.best.quiz||0} / 10`},
 {id:'haki',t:'Observation <em>Haki</em>',k:'Memory',line:'One picture, then a wall of them. Find it again before time runs out. It gets harder every level.',art:'f0e0f1f0e2f4',best:()=>`Best level ${B.best.haki||0}`},
 {id:'who',t:'Who’s that <em>pirate?</em>',k:'Speed',line:'A picture from the archive, broken into blocks. It sharpens second by second. Name them before it’s clear.',art:'9fdfff7bb2ea',best:()=>`Best ${B.best.who||0} points`,fresh:1},
 {id:'mem',t:'Memory <em>log</em>',k:'Pairs',line:'Sixteen cards face down, eight pairs of pictures. Find every pair in as few turns as you can.',art:'297876935b5a',best:()=>B.best.memx?`Best ${60-B.best.memx} turns`:'Not played yet',fresh:1},
 {id:'puz',t:'Put the poster <em>back</em>',k:'Puzzle',line:'A picture cut into squares and shuffled. Tap two squares to swap them. Three by three, then four, then five.',art:'9903097351d2',best:()=>B.best.puz?`Solved up to ${B.best.puz} × ${B.best.puz}`:'Not played yet',fresh:1}
];
let dlg=null,stop=()=>{};
const $g=s=>dlg.querySelector(s);
export async function openGames(game){
 await roomsCSS();
 if(!dlg){
  dlg=document.createElement('dialog');dlg.className='gr';dlg.setAttribute('aria-labelledby','gr-title');
  dlg.innerHTML=`<div class="gr-wrap"><header class="gr-head"><div><p class="eyebrow" id="gr-k">The Game Room</p><h2 id="gr-title">Pick a <em>game.</em></h2></div><button class="tr-close" data-gr-close>Close ✕</button></header><div class="gr-body" id="gr-body"></div></div>`;
  document.body.appendChild(dlg);
  dlg.addEventListener('close',()=>{stop();stop=()=>{};document.documentElement.style.overflow='';document.documentElement.classList.remove('room-open');if(location.hash==='#games')history.replaceState(null,'',location.pathname+location.search);});
  dlg.addEventListener('click',e=>{if(e.target.closest('[data-gr-close]')){dlg.close();return;}const g=e.target.closest('[data-game]');if(g){play(g.dataset.game);return;}if(e.target.closest('[data-menu]'))menu();});
 }
 if(!dlg.open){dlg.showModal();document.documentElement.style.overflow='hidden';document.documentElement.classList.add('room-open');}
 if(location.hash!=='#games')history.replaceState(null,'','#games');
 game?play(game):menu();
}
function head(k,t){$g('#gr-k').innerHTML=k;$g('#gr-title').innerHTML=t;}
function menu(){
 stop();stop=()=>{};head('The Game Room','Pick a <em>game.</em>');
 const tv=(()=>{try{return JSON.parse(localStorage.getItem('grand-archive:trivia')||'{}');}catch{return{};}})(),cl=(tv.cleared||[]).length;
 $g('#gr-body').innerHTML=`<a class="gm-hero" href="trivia.html"><span class="gm-hero-art"><img src="${FU('5b4d8ea99809')}" alt="" decoding="async"></span><span class="gm-hero-copy"><small>New · a page of its own</small><b>Grand Line <em>Trivia</em></b><span>Five levels, from hard to impossible, with pictures from the archive as clues. Play alone, or face to face with a friend on one phone.</span><i>${cl?`${cl} of 5 levels cleared`:'No levels cleared yet'}</i></span><span class="gm-go">Play ↗</span></a>
  <div class="gm-grid">${GAMES.map((g,i)=>`<button class="gm" data-game="${g.id}" style="--d:${i*60}ms"><span class="gm-art"><img src="${FU(g.art)}" alt="" decoding="async"></span><span class="gm-copy"><small>${g.k}${g.fresh?' · <b class="gm-new">New</b>':''}</small><b>${g.t}</b><span>${esc(g.line)}</span><i>${esc(g.best())}</i></span><span class="gm-go">Play</span></button>`).join('')}</div><p class="tr-fine">Every game pays into your bounty in the Treasure Room.</p>`;
 dlg.scrollTop=0;
}
function play(id){
 stop();stop=()=>{};const g=GAMES.find(x=>x.id===id);if(!g)return menu();
 head(`<button class="link gr-back" data-menu>← All games</button>`,g.t);
 const root=$g('#gr-body');root.innerHTML='';dlg.scrollTop=0;
 ({hl,wind,quiz,haki,who,mem,puz})[id](root);
}
function over(root,{title,line,score,pay,again}){
 const el=document.createElement('div');el.className='gx';
 el.innerHTML=`<div class="gx-in"><p class="eyebrow">${esc(title)}</p><h3>${score}</h3><p>${line}</p>${pay?`<p class="gx-pay"><i class="bt-coin">฿</i>+${money(pay)}</p>`:''}<div class="gx-acts"><button class="pill" data-again>Play again</button><button class="pill ghost" data-menu>All games</button></div></div>`;
 root.appendChild(el);el.querySelector('[data-again]').addEventListener('click',again);
}

/* ---------------------------------------------------------------- Higher or lower */
function hl(root){
 const pick=not=>{let e;do{e=rnd(BOUNTIES);}while(not&&(e===not||(e.who===not.who&&e.b===not.b)));return e;};
 let a=pick(),b=pick(a),streak=0,locked=false;
 root.innerHTML=`<div class="hl"><div class="hl-pair"><div class="hl-slot hl-a"></div><div class="hl-vs">vs</div><div class="hl-slot hl-b"></div></div><div class="hl-q"><p class="hl-ask"></p><div class="hl-btns"><button class="pill" data-hl="1">Higher ↑</button><button class="pill ghost" data-hl="-1">Lower ↓</button></div><p class="hl-streak"></p></div></div>`;
 const A=root.querySelector('.hl-a'),Bs=root.querySelector('.hl-b'),ask=root.querySelector('.hl-ask'),st=root.querySelector('.hl-streak');
 // the poster that was hidden moves across with its picture; a new one slams down beside it
 const draw=()=>{a.pic=a.pic||photo(a.who);b.pic=photo(b.who);A.innerHTML=posterHTML(a,true,a.pic);Bs.innerHTML=posterHTML(b,false,b.pic);Bs.firstChild.classList.add('slam');
  ask.innerHTML=`Is <b>${esc(b.name)}</b> <span>${esc(b.when)}</span> worth more or less than <b>${esc(a.name)}</b> <span>${esc(a.when)}</span>?`;st.innerHTML=`Streak <b>${streak}</b> · Best <b>${B.best.hl||0}</b>`;};
 draw();
 const btns=root.querySelector('.hl-btns');
 btns.addEventListener('click',async e=>{
  const k=e.target.closest('[data-hl]');if(!k||locked)return;locked=true;btns.classList.add('off');
  const up=k.dataset.hl==='1',ok=b.b===a.b||(up?b.b>a.b:b.b<a.b);
  // the hidden bounty counts up
  const v=Bs.querySelector('.gp-v'),t0=performance.now(),d=motion.reduced?1:900;
  await new Promise(res=>{const step=t=>{const q=clamp((t-t0)/d),e2=1-Math.pow(1-q,3);v.textContent=money(b.b*e2);if(q<1)requestAnimationFrame(step);else res();};requestAnimationFrame(step);});
  const stamp=document.createElement('span');stamp.className='hl-stamp '+(ok?'ok':'no');stamp.textContent=ok?(b.b===a.b?'Same!':'Correct'):'Busted';Bs.firstChild.appendChild(stamp);
  await wait(850);
  if(ok){streak++;a={...b};b=pick(a);draw();locked=false;btns.classList.remove('off');return;}
  const pay=streak*(streak+1)/2*M/2;best('hl',streak);
  if(pay)earn(pay,`Higher or lower · a streak of ${streak}`);
  if(streak>=10)once('quest:hl',20*M,'Ten bounties in a row');
  over(root,{title:'Higher or lower',score:`Streak ${streak}`,line:`${esc(b.name)} ${esc(b.when)} was worth <b>฿${money(b.b)}</b>. ${esc(a.name)} ${esc(a.when)}: ฿${money(a.b)}.`,pay,again:()=>hl(root)});
 });
}

/* ---------------------------------------------------------------- Gone with the wind */
function wind(root){
 root.innerHTML=`<div class="gw"><div class="gw-hud"><span>Caught <b class="gw-n">0</b></span><span class="gw-t">30</span><span>฿<b class="gw-b">0</b></span></div><div class="gw-field"></div><div class="gw-start"><h3>Gone with the <em>wind.</em></h3><p>After Enies Lobby, the new wanted posters blew across the whole world. Catch as many as you can in thirty seconds. Grab a Marine and you lose three seconds.</p><button class="pill" data-go>Start</button></div></div>`;
 const field=root.querySelector('.gw-field'),nEl=root.querySelector('.gw-n'),tEl=root.querySelector('.gw-t'),bEl=root.querySelector('.gw-b');
 let running=false,raf=0,live=[],caught=0,tally=0,left=30,last=0,spawnIn=0,t=0;
 const garp=photosOf('garp');
 function spawn(){
  const marine=garp.length&&Math.random()<0.13,e=marine?{who:'garp',b:0,name:'Monkey D. Garp',when:'Vice Admiral'}:rnd(BOUNTIES);
  const el=document.createElement('button');el.className='gw-p'+(marine?' marine':'');
  el.innerHTML=marine?`<div class="wanted gpost dread" style="--r:0deg"><span class="w-top">MARINE</span><span class="w-photo"><img src="${TH(rnd(garp))}" alt="" decoding="async"></span><b class="w-name">GARP</b><span class="w-bounty unknown">HANDS OFF</span></div>`:posterHTML(e,true);
  const H=field.clientHeight,W=field.clientWidth,z=0.62+Math.random()*0.5;
  const p={el,e,marine,x:-150,y:H*(0.08+Math.random()*0.7),vx:(110+Math.random()*150)*(1+t/30*0.9)*(W/1100+0.5),ph:Math.random()*6.28,f:1.2+Math.random()*1.6,amp:20+Math.random()*50,z,rot:0,dead:false};
  el.style.zIndex=Math.round(z*100);el.addEventListener('pointerdown',ev=>{ev.preventDefault();grab(p);});
  field.appendChild(el);live.push(p);
 }
 function grab(p){
  if(p.dead||!running)return;p.dead=true;
  if(p.marine){left=Math.max(0,left-3);root.querySelector('.gw').classList.remove('hit');void field.offsetWidth;root.querySelector('.gw').classList.add('hit');p.el.classList.add('punched');setTimeout(()=>p.el.remove(),500);return;}
  caught++;tally+=p.e.b;nEl.textContent=caught;bEl.textContent=money(tally);
  p.el.classList.add('got');p.el.style.setProperty('--x',p.x+'px');p.el.style.setProperty('--y',p.y+'px');setTimeout(()=>p.el.remove(),600);
 }
 function frame(now){
  raf=0;if(!running)return;const dt=Math.min(0.05,(now-(last||now))/1000);last=now;t+=dt;left-=dt;
  tEl.textContent=Math.max(0,Math.ceil(left));tEl.classList.toggle('low',left<6);
  spawnIn-=dt;if(spawnIn<=0){spawn();spawnIn=Math.max(0.28,0.95-t*0.022)*(0.6+Math.random()*0.8);}
  const W=field.clientWidth;
  live=live.filter(p=>{if(p.dead)return false;p.x+=p.vx*dt*p.z;const y=p.y+Math.sin(t*p.f+p.ph)*p.amp,rot=Math.sin(t*p.f*1.3+p.ph)*16,ry=Math.sin(t*p.f*0.8+p.ph)*40;
   p.el.style.transform=`translate3d(${p.x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${p.z.toFixed(3)}) rotate(${rot.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg)`;
   if(p.x>W+40){p.el.remove();return false;}return true;});
  if(left<=0)return end();
  raf=requestAnimationFrame(frame);
 }
 function end(){
  running=false;live.forEach(p=>p.el.remove());live=[];
  const pay=caught*M;best('wind',caught);if(pay)earn(pay,`Gone with the wind · ${caught} caught`);
  if(caught>=25)once('quest:wind',20*M,'Twenty-five posters in one gust');
  over(root,{title:'Gone with the wind',score:`${caught} caught`,line:`Together they were worth <b>฿${money(tally)}</b>. Best so far: ${B.best.wind||caught}.`,pay,again:()=>wind(root)});
 }
 root.querySelector('[data-go]').addEventListener('click',()=>{root.querySelector('.gw-start').remove();running=true;last=0;raf=requestAnimationFrame(frame);});
 stop=()=>{running=false;cancelAnimationFrame(raf);};
}

/* ---------------------------------------------------------------- Know the captain */
async function quiz(root){
 root.innerHTML=`<p class="gq-load">Reading his notes…</p>`;
 const story=await fetch('data/story.json').then(r=>r.ok?r.json():null).catch(()=>null);
 const Q=questions(story);let i=0,score=0;
 const show=()=>{
  const q=Q[i];
  root.innerHTML=`<div class="gq"><div class="gq-top"><span>Question <b>${i+1}</b> of ${Q.length}</span><span>Score <b>${score}</b></span></div><div class="gq-bar"><i style="transform:scaleX(${(i/Q.length).toFixed(3)})"></i></div>
   <div class="gq-card">${q.img?`<figure class="gq-img"><img src="${esc(q.img)}" alt="" decoding="async"></figure>`:''}<div class="gq-body"><small>${esc(q.k)}</small><h3>${q.q}</h3><div class="gq-opts">${q.opts.map((o,k)=>`<button class="gq-o" data-k="${k}">${esc(o)}</button>`).join('')}</div><div class="gq-after" hidden></div></div></div></div>`;
  root.querySelector('.gq-opts').addEventListener('click',e=>{
   const b=e.target.closest('.gq-o');if(!b||root.querySelector('.gq-opts').classList.contains('off'))return;root.querySelector('.gq-opts').classList.add('off');
   const k=+b.dataset.k,ok=k===q.a;if(ok)score++;
   root.querySelectorAll('.gq-o').forEach((o,j)=>{if(j===q.a)o.classList.add('right');else if(j===k)o.classList.add('wrong');});
   const af=root.querySelector('.gq-after');af.hidden=false;af.innerHTML=`<p class="${ok?'ok':'no'}">${ok?'Right.':'Not quite.'}</p>${q.why?`<blockquote>${esc(q.why)}</blockquote>`:''}<button class="pill small" data-next>${i<Q.length-1?'Next question →':'See your score'}</button>`;
   af.querySelector('[data-next]').addEventListener('click',()=>{i++;if(i<Q.length)show();else finish();});
  });
 };
 const finish=()=>{
  const pay=score*3*M;best('quiz',score);if(pay)earn(pay,`Know the captain · ${score} / ${Q.length}`);
  if(score===Q.length)once('quest:quiz',30*M,'A perfect round');
  const verdict=score===10?'You know him better than he knows himself.':score>=8?'Nakama. Definitely nakama.':score>=5?'Not bad. Read a few more records.':'Time to read the Character Log again.';
  root.innerHTML='';over(root,{title:'Know the captain',score:`${score} / ${Q.length}`,line:verdict,pay,again:()=>quiz(root)});
 };
 show();
}
function questions(story){
 const chars=(data.characters?.characters||[]).filter(c=>c.word),sh=data.strawhats?.crew||[],top=data.archive?.top10||[],shelf=data.shelf||{},stops=(data.route?.stops||[]).filter(s=>s.title&&!/rewatch/i.test(s.title));
 const four=(right,wrong)=>{const opts=shuffle([right,...shuffle([...new Set(wrong.filter(w=>w!==right))]).slice(0,3)]);return{opts,a:opts.indexOf(right)};};
 const CI=c=>`assets/chars/m/${c.image.id}.webp`;
 const G=[];
 // the word each character left behind
 chars.forEach(c=>G.push(()=>({k:'The Character Log',q:`What did <em>${esc(c.name)}</em> leave behind?`,img:CI(c),...four(c.word,chars.map(x=>x.word)),why:c.left})));
 chars.forEach(c=>G.push(()=>({k:'The Character Log',q:`Who left behind “${esc(c.word)}”?`,...four(c.name,chars.map(x=>x.name)),why:c.left})));
 // his top 10
 top.forEach((t,i)=>G.push(()=>({k:'My current top 10',q:`What is number ${i+1} in my top 10?`,...four(t.title,top.map(x=>x.title)),why:t.body})));
 top.slice(0,6).forEach((t,i)=>G.push(()=>({k:'My current top 10',q:`Where does <em>${esc(t.title)}</em> sit in my top 10?`,...four(`#${i+1}`,top.map((_,j)=>`#${j+1}`)),why:t.body})));
 // ratings
 const rated=(shelf.anime||[]).filter(r=>r.s&&!isNaN(parseFloat(r.s))&&r.tagline);
 shuffle(rated).slice(0,8).forEach(r=>G.push(()=>({k:'The Shelf',q:`How did I rate <em>${esc(r.t)}</em>?`,img:data.posters?.[`anime:${r.t}`]?.img,...four(`${r.s} / 10`,shuffle(['6','6.5','7','7.5','8','8.5','9','9.5','10']).map(s=>`${s} / 10`)),why:r.tagline})));
 // the crew
 sh.forEach(c=>G.push(()=>({k:'The Straw Hat Pirates',q:`Where did <em>${esc(c.short)}</em> join the crew?`,img:c.art?TH(c.art):null,...four(c.joined,sh.map(x=>x.joined)),why:c.dream})));
 sh.forEach(c=>G.push(()=>({k:'The Straw Hat Pirates',q:`Whose dream is it? “${esc(c.dream)}”`,...four(c.name,sh.map(x=>x.name)),why:c.mine?.text||''})));
 // the anime journey, in the order he watched
 for(let n=0;n<4&&stops.length>3;n++)G.push(()=>{const pick=shuffle(stops.map((s,i)=>({t:s.title,i}))).slice(0,4),first=pick.reduce((a,b)=>a.i<b.i?a:b);return{k:'The Anime Journey',q:'Which of these did I watch first?',opts:pick.map(p=>p.t),a:pick.indexOf(first),why:'In the order of my Anime Journey.'};});
 // first impressions
 const firsts=(data.characters?.characters||[]).filter(c=>c.first);
 firsts.forEach(c=>G.push(()=>({k:'First impressions',q:`Whose first impression was this? “${esc(c.first)}”`,...four(c.name,(data.characters.characters||[]).map(x=>x.name)),why:(c.now||[]).slice(0,1).join(' ')})));
 // the manga
 if(story){
  G.push(()=>{const n=story.latest;return{k:'The Story of One Piece',q:'Which chapter of One Piece am I on right now?',...four(`Chapter ${n}`,[n-12,n-5,n+3,n-30,n+9].map(x=>`Chapter ${x}`)),why:'From my Manga Tracker.'};});
  const arcs=story.sagas.flatMap(s=>s.arcs.map(a=>({a:a.name,s:s.title})));
  shuffle(arcs).slice(0,5).forEach(x=>G.push(()=>({k:'The Story of One Piece',q:`Which saga is <em>${esc(x.a)}</em> part of?`,...four(x.s,story.sagas.map(s=>s.title))})));
 }
 G.push(()=>{const n=pool().length;return{k:'The archive',q:'How many pictures are in the archive right now?',...four(n.toLocaleString('en-US'),[n-120,n+85,n-37,n+240].map(x=>x.toLocaleString('en-US'))),why:'And every one of them is a card in the Treasure Room.'};});
 return shuffle(G).slice(0,10).map(f=>f());
}

/* ---------------------------------------------------------------- Observation Haki */
function haki(root){
 const P=pool();let level=1,timer=0,raf=0,alive=true;
 const big=Object.entries(P.reduce((m,p)=>{(m[p.col]=m[p.col]||[]).push(p);return m;},{})).filter(([,l])=>l.length>=24);
 root.innerHTML=`<div class="gh"><div class="gh-top"><span>Level <b class="gh-l">1</b></span><span class="gh-say">Remember this one</span><span>Best <b>${B.best.haki||0}</b></span></div><div class="gh-bar"><i></i></div><div class="gh-stage"></div></div>`;
 const stage=root.querySelector('.gh-stage'),say=root.querySelector('.gh-say'),bar=root.querySelector('.gh-bar i'),lEl=root.querySelector('.gh-l');
 const N=l=>[6,9,12,12,16,16,20,20,20,25][Math.min(l-1,9)];
 const same=l=>l===4||l>=6;
 async function round(){
  if(!alive)return;lEl.textContent=level;
  const n=N(level);let target,others;
  // later levels hide it among pictures from its own collection, which look alike
  if(same(level)&&big.length){const [,list]=rnd(big);const s=shuffle(list);target=s[0];others=s.slice(1,n);}
  else{const s=shuffle(P);target=s[0];others=s.slice(1,n);}
  say.textContent='Remember this one';bar.style.transition='none';bar.style.transform='scaleX(1)';
  stage.innerHTML=`<figure class="gh-target"><img src="${FU(target.id)}" alt="" decoding="async"></figure>`;
  try{await stage.querySelector('img').decode();}catch{}
  await wait(Math.max(900,1900-level*90));if(!alive)return;
  // the grid shape that gives the biggest tiles in the space there is (whole rows preferred)
  const sw=stage.clientWidth||innerWidth*0.9,sh=Math.max(260,innerHeight-(innerWidth>820?250:210));let cols=3,bestT=0;
  for(let c=2;c<=8;c++){const r=Math.ceil(n/c),tile=Math.min((sw-(c-1)*8)/c,(sh-(r-1)*8)/r)*(n%c===0?1.12:1);if(tile>bestT){bestT=tile;cols=c;}}
  const tiles=shuffle([target,...others]),tw=Math.floor(Math.min((sw-(cols-1)*8)/cols,(sh-(Math.ceil(n/cols)-1)*8)/Math.ceil(n/cols)));
  stage.innerHTML=`<div class="gh-grid" style="--c:${cols};width:${cols*tw+(cols-1)*8}px">${tiles.map((p,i)=>`<button class="gh-t" data-ok="${p===target?1:0}" style="--i:${i}"><img src="${TH(p.id)}" alt="" decoding="async"></button>`).join('')}</div>`;
  say.textContent='Find it';
  const T=Math.max(2.6,7.5-level*0.45);bar.style.transition=`transform ${T}s linear`;requestAnimationFrame(()=>requestAnimationFrame(()=>{bar.style.transform='scaleX(0)';}));
  const res=await new Promise(r=>{timer=setTimeout(()=>r(null),T*1000);stage.querySelector('.gh-grid').addEventListener('click',e=>{const b=e.target.closest('.gh-t');if(b)r(b);});});
  clearTimeout(timer);if(!alive)return;
  const right=stage.querySelector('[data-ok="1"]');right.classList.add('right');
  if(res&&res.dataset.ok==='1'){say.textContent='Haki!';await wait(650);level++;round();return;}
  if(res)res.classList.add('wrong');say.textContent=res?'Not that one':'Too slow';
  await wait(1300);if(!alive)return;
  const reached=level-1,pay=reached*2*M;best('haki',reached);if(pay)earn(pay,`Observation Haki · level ${reached}`);
  if(reached>=8)once('quest:haki',20*M,'Observation Haki, level 8');
  over(root,{title:'Observation Haki',score:`Level ${reached}`,line:reached>=8?'Katakuri would be nervous.':reached>=5?'Your Haki is waking up.':'Keep training. Even Luffy needed two years.',pay,again:()=>haki(root)});
 }
 round();
 stop=()=>{alive=false;clearTimeout(timer);cancelAnimationFrame(raf);};
}

/* ---------------------------------------------------------------- the archive's people, for the new games */
const isCollage=id=>(data.media?.collages||[]).some(x=>x.id===id);
function people(){
 const m=data.media||{},seen=new Set(),out=[];
 const add=(n,ids)=>{if(!n||seen.has(n)||/straw hats|omniscient/i.test(n))return;const l=(ids||[]).filter(id=>m.img?.[id]&&!isCollage(id));if(l.length>=2){seen.add(n);out.push({n,ids:l});}};
 (m.characters||[]).forEach(c=>add(c.home,c.all));(m.crew||[]).forEach(c=>add(c.name,c.all));(m.supporting||[]).forEach(c=>add(c.name,c.all));(m.worlds||[]).forEach(w=>add(w.name,w.all));
 return out;
}

/* ---------------------------------------------------------------- Who's that pirate? */
// a picture drawn at a handful of pixels and scaled up with hard edges; the blocks halve as the seconds pass
function who(root){
 const P=people(),ROUNDS=10,T=9;let r=0,score=0,raf=0,alive=true;
 root.innerHTML=`<div class="wp"><div class="wp-top"><span>Round <b class="wp-r">1</b> / ${ROUNDS}</span><span class="wp-pts">+<b>0</b></span><span>Score <b class="wp-s">0</b></span></div><div class="wp-main"><figure class="wp-frame"><canvas></canvas><figcaption class="wp-name"></figcaption></figure><div class="wp-opts"></div></div></div>`;
 const cv=root.querySelector('canvas'),ctx=cv.getContext('2d'),opts=root.querySelector('.wp-opts'),pts=root.querySelector('.wp-pts b'),frame=root.querySelector('.wp-frame'),nm=root.querySelector('.wp-name');
 const small=document.createElement('canvas'),sx=small.getContext('2d');
 const draw=(img,block)=>{const W=cv.width,H=cv.height;
  // cover-crop into the frame (a little above centre, where faces usually are)
  const s2=Math.min(img.naturalWidth/W,img.naturalHeight/H),w2=W*s2,h2=H*s2,x2=(img.naturalWidth-w2)/2,y2=(img.naturalHeight-h2)/3;
  if(block<=1){ctx.imageSmoothingEnabled=true;ctx.drawImage(img,x2,y2,w2,h2,0,0,W,H);return;}
  const sw=Math.max(2,Math.round(W/block)),sh=Math.max(2,Math.round(H/block));small.width=sw;small.height=sh;sx.imageSmoothingEnabled=true;sx.drawImage(img,x2,y2,w2,h2,0,0,sw,sh);
  ctx.imageSmoothingEnabled=false;ctx.drawImage(small,0,0,sw,sh,0,0,W,H);};
 async function round(){
  if(!alive)return;if(r>=ROUNDS)return finish();
  root.querySelector('.wp-r').textContent=r+1;frame.classList.remove('shown','ok','no');nm.textContent='';
  const who=rnd(P),id=rnd(who.ids),names=shuffle([who.n,...shuffle(P.filter(x=>x.n!==who.n)).slice(0,3).map(x=>x.n)]);
  const img=new Image();img.src=FU(id);try{await img.decode();}catch{}if(!alive)return;
  const b=frame.getBoundingClientRect();cv.width=Math.round(b.width*Math.min(2,devicePixelRatio||1));cv.height=Math.round(b.height*Math.min(2,devicePixelRatio||1));
  opts.innerHTML=names.map(n=>`<button class="gq-o" data-n="${esc(n)}">${esc(n)}</button>`).join('');
  const START=Math.max(cv.width,cv.height)/5;let t0=performance.now(),last=-1,done=false;
  const tick=now=>{if(!alive||done)return;const t=(now-t0)/1000,q=Math.min(1,t/T),block=Math.max(1,Math.round(START*Math.pow(1/START,q)));if(block!==last){last=block;draw(img,block);}pts.textContent=Math.max(20,Math.round(100*(1-q))+20);if(q<1)raf=requestAnimationFrame(tick);};
  raf=requestAnimationFrame(tick);
  const pick=await new Promise(res=>{opts.onclick=e=>{const o=e.target.closest('[data-n]');if(o)res(o);};});
  done=true;cancelAnimationFrame(raf);const ok=pick.dataset.n===who.n,t=(performance.now()-t0)/1000,got=ok?Math.max(20,Math.round(100*(1-Math.min(1,t/T)))+20):0;score+=got;
  draw(img,1);frame.classList.add('shown',ok?'ok':'no');nm.innerHTML=`${esc(who.n)}${ok?` <b>+${got}</b>`:''}`;
  opts.querySelectorAll('[data-n]').forEach(o=>{o.disabled=true;if(o.dataset.n===who.n)o.classList.add('right');else if(o===pick)o.classList.add('wrong');});
  root.querySelector('.wp-s').textContent=score;
  await wait(ok?1100:1700);r++;round();
 }
 function finish(){
  const pay=score*2e4;best('who',score);if(pay)earn(pay,`Who’s that pirate? · ${score} points`);
  if(score>=800)once('quest:who',20*M,'Who’s that pirate? · 800 points');
  over(root,{title:'Who’s that pirate?',score:`${score} points`,line:score>=900?'You see them coming from a mile away.':score>=600?'Sharp eyes.':'They’ll be clearer next time.',pay,again:()=>who(root)});
 }
 round();
 stop=()=>{alive=false;cancelAnimationFrame(raf);};
}

/* ---------------------------------------------------------------- Memory log */
function mem(root){
 const pics=shuffle(pool().filter(p=>!isCollage(p.id))).slice(0,8),deck=shuffle([...pics,...pics].map((p,i)=>({id:p.id,k:i})));
 let open=[],turns=0,found=0,lock=false,t0=0,tm=0;
 root.innerHTML=`<div class="mm"><div class="mm-top"><span>Turns <b class="mm-t">0</b></span><span class="mm-time">0:00</span><span>Pairs <b class="mm-p">0</b> / 8</span></div><div class="mm-grid">${deck.map((c,i)=>`<button class="mm-c" data-i="${i}" style="--i:${i}" aria-label="A card, face down"><span class="mm-in"><span class="mm-b"><i></i></span><span class="mm-f"><img src="${TH(c.id)}" alt="" decoding="async"></span></span></button>`).join('')}</div></div>`;
 const cards=[...root.querySelectorAll('.mm-c')],tEl=root.querySelector('.mm-t'),pEl=root.querySelector('.mm-p'),clock=root.querySelector('.mm-time');
 const fmt=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
 root.querySelector('.mm-grid').addEventListener('click',async e=>{
  const b=e.target.closest('.mm-c');if(!b||lock||b.classList.contains('up'))return;
  if(!t0){t0=performance.now();tm=setInterval(()=>{clock.textContent=fmt((performance.now()-t0)/1000);},500);}
  b.classList.add('up');open.push(b);if(open.length<2)return;
  turns++;tEl.textContent=turns;const [a,c]=open;open=[];
  if(deck[+a.dataset.i].id===deck[+c.dataset.i].id){a.classList.add('done');c.classList.add('done');found++;pEl.textContent=found;
   if(found===8){clearInterval(tm);const secs=(performance.now()-t0)/1000;await wait(700);
    const pay=Math.max(2,14-Math.max(0,turns-8))*M;best('memx',60-turns);earn(pay,`Memory log · ${turns} turns`);
    if(turns<=12)once('quest:mem',20*M,'Memory log in 12 turns');
    over(root,{title:'Memory log',score:`${turns} turns`,line:`Every pair in ${fmt(secs)}. ${turns<=10?'A photographic memory.':turns<=14?'Robin would be proud.':'Every pair found.'}`,pay,again:()=>mem(root)});}
   return;}
  lock=true;await wait(820);a.classList.remove('up');c.classList.remove('up');lock=false;
 });
 stop=()=>clearInterval(tm);
}

/* ---------------------------------------------------------------- Put the poster back */
function puz(root,n=3){
 const P=pool().filter(p=>{const d=data.media.img[p.id];return d&&d[1]/d[0]>1.1&&d[1]/d[0]<1.6&&Math.max(...d)>=1000;}),p=rnd(P.length?P:pool()),[w,h]=data.media.img[p.id];
 const N=n*n;let order;do{order=shuffle([...Array(N).keys()]);}while(order.every((v,i)=>v===i));
 let sel=null,moves=0,t0=performance.now(),done=false;
 root.innerHTML=`<div class="pz"><div class="pz-top"><span>${n} × ${n}</span><span>Moves <b class="pz-m">0</b></span><button class="link pz-peek">Hold to peek</button></div><div class="pz-board" style="--n:${n};--ar:${w}/${h}">${order.map((v,slot)=>`<button class="pz-t" data-v="${v}" style="--x:${slot%n};--y:${Math.floor(slot/n)};background-image:url('${FU(p.id)}');background-position:${(v%n)/(n-1)*100}% ${Math.floor(v/n)/(n-1)*100}%"></button>`).join('')}<img class="pz-full" src="${FU(p.id)}" alt="" decoding="async"></div></div>`;
 const board=root.querySelector('.pz-board'),tiles=[...board.querySelectorAll('.pz-t')],mEl=root.querySelector('.pz-m'),slotOf=t=>+t.style.getPropertyValue('--x')+n*+t.style.getPropertyValue('--y');
 const place=(t,slot)=>{t.style.setProperty('--x',slot%n);t.style.setProperty('--y',Math.floor(slot/n));t.classList.toggle('home',+t.dataset.v===slot);};
 tiles.forEach(t=>place(t,slotOf(t)));
 board.addEventListener('click',async e=>{
  const t=e.target.closest('.pz-t');if(!t||done)return;
  if(!sel){sel=t;t.classList.add('sel');return;}
  if(sel===t){t.classList.remove('sel');sel=null;return;}
  const a=slotOf(sel),b=slotOf(t);place(sel,b);place(t,a);sel.classList.remove('sel');sel=null;moves++;mEl.textContent=moves;
  if(tiles.every(x=>+x.dataset.v===slotOf(x))){done=true;board.classList.add('solved');await wait(1100);
   const secs=Math.round((performance.now()-t0)/1000),pay=(n===3?3:n===4?8:15)*M;best('puz',n);earn(pay,`Put the poster back · ${n} × ${n}`);
   if(n>=4)once('quest:puz',20*M,'A 4 × 4 poster, back together');
   over(root,{title:'Put the poster back',score:`${n} × ${n} solved`,line:`${moves} moves in ${Math.floor(secs/60)}:${String(secs%60).padStart(2,'0')}. ${p.col}, No. ${p.i}.${n<5?` Ready for ${n+1} × ${n+1}?`:''}`,pay,again:()=>puz(root,Math.min(5,n<5?n+1:5))});
   const ag=root.querySelector('[data-again]');if(ag&&n<5)ag.textContent=`Try ${n+1} × ${n+1}`;}
 });
 const peek=root.querySelector('.pz-peek'),pk=v=>board.classList.toggle('peek',v);
 peek.addEventListener('pointerdown',()=>pk(true));['pointerup','pointerleave','pointercancel'].forEach(k=>peek.addEventListener(k,()=>pk(false)));
}

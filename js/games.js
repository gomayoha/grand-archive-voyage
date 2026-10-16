// The Game Room. Four small games, all made of the archive itself, each paying berries into your bounty:
//  - Higher or lower: two wanted posters, one bounty hidden. Every Straw Hat at every point of the story
//    (canon bounties, arc by arc) plus a few friends. How long can the streak go?
//  - Gone with the wind: after Enies Lobby the new posters blew across the whole world. Catch them before
//    the wind does, thirty seconds, and keep your hands off the Marines.
//  - Know the captain: a quiz about Goma, written from his own notes and lists (the word each character
//    left behind, his top 10, his ratings, when he watched what, the crew he loves).
//  - Observation Haki: one picture, then a wall of them. Find it again before time runs out.
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
const posterHTML=(e,shown,id=photo(e.who),cls='')=>`<div class="wanted gp ${cls}" style="--r:0deg"><span class="w-top">WANTED</span><span class="w-photo">${id?`<img src="${TH(id)}" alt="" decoding="async">`:''}</span><span class="w-dead">DEAD OR ALIVE</span><b class="w-name">${esc(e.name.toUpperCase())}</b><span class="w-bounty"><i>฿</i><span class="gp-v">${shown?money(e.b):'?,???,???,???'}</span><small>-</small></span><span class="w-line">${esc(e.when)}</span></div>`;

/* ---------------------------------------------------------------- the room */
const GAMES=[
 {id:'hl',t:'Higher or <em>lower</em>',k:'Bounties',line:'Two wanted posters, one bounty hidden. Every Straw Hat at every point of the story. How long can your streak go?',art:'fcf118f387b7',best:()=>`Best streak ${B.best.hl||0}`},
 {id:'wind',t:'Gone with the <em>wind</em>',k:'Arcade',line:'After Enies Lobby the new posters blew across the world. Catch them in thirty seconds. Keep your hands off the Marines.',art:'a352eedbb5a9',best:()=>`Best ${B.best.wind||0} caught`},
 {id:'quiz',t:'Know the <em>captain</em>',k:'Quiz',line:'Ten questions about me, straight from my notes: the words they left behind, my top 10, my ratings, my crew.',art:'373131619907',best:()=>`Best ${B.best.quiz||0} / 10`},
 {id:'haki',t:'Observation <em>Haki</em>',k:'Memory',line:'One picture, then a wall of them. Find it again before time runs out. It gets harder every level.',art:'f0e0f1f0e2f4',best:()=>`Best level ${B.best.haki||0}`}
];
let dlg=null,stop=()=>{};
const $g=s=>dlg.querySelector(s);
export async function openGames(game){
 await roomsCSS();
 if(!dlg){
  dlg=document.createElement('dialog');dlg.className='gr';dlg.setAttribute('aria-labelledby','gr-title');
  dlg.innerHTML=`<div class="gr-wrap"><header class="gr-head"><div><p class="eyebrow" id="gr-k">The Game Room</p><h2 id="gr-title">Pick a <em>game.</em></h2></div><button class="tr-close" data-gr-close>Close ✕</button></header><div class="gr-body" id="gr-body"></div></div>`;
  document.body.appendChild(dlg);
  dlg.addEventListener('close',()=>{stop();stop=()=>{};document.documentElement.style.overflow='';if(location.hash==='#games')history.replaceState(null,'',location.pathname+location.search);});
  dlg.addEventListener('click',e=>{if(e.target.closest('[data-gr-close]')){dlg.close();return;}const g=e.target.closest('[data-game]');if(g){play(g.dataset.game);return;}if(e.target.closest('[data-menu]'))menu();});
 }
 if(!dlg.open){dlg.showModal();document.documentElement.style.overflow='hidden';}
 if(location.hash!=='#games')history.replaceState(null,'','#games');
 game?play(game):menu();
}
function head(k,t){$g('#gr-k').innerHTML=k;$g('#gr-title').innerHTML=t;}
function menu(){
 stop();stop=()=>{};head('The Game Room','Pick a <em>game.</em>');
 $g('#gr-body').innerHTML=`<div class="gm-grid">${GAMES.map(g=>`<button class="gm" data-game="${g.id}"><span class="gm-art"><img src="${FU(g.art)}" alt="" decoding="async"></span><span class="gm-copy"><small>${g.k}</small><b>${g.t}</b><span>${esc(g.line)}</span><i>${esc(g.best())}</i></span><span class="gm-go">Play</span></button>`).join('')}</div><p class="tr-fine">Every game pays into your bounty in the Treasure Room.</p>`;
 dlg.scrollTop=0;
}
function play(id){
 stop();stop=()=>{};const g=GAMES.find(x=>x.id===id);if(!g)return menu();
 head(`<button class="link gr-back" data-menu>← All games</button>`,g.t);
 const root=$g('#gr-body');root.innerHTML='';dlg.scrollTop=0;
 ({hl,wind,quiz,haki})[id](root);
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
  el.innerHTML=marine?`<div class="wanted gp dread" style="--r:0deg"><span class="w-top">MARINE</span><span class="w-photo"><img src="${TH(rnd(garp))}" alt="" decoding="async"></span><b class="w-name">GARP</b><span class="w-bounty unknown">HANDS OFF</span></div>`:posterHTML(e,true);
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

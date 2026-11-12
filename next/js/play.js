// Play: three quick games that start in one tap. The first win of the day in each one pays a pack.
import {$,$$,esc,data,S,ROOT,TH,FU,pick,shuffle,money,day,changed,earn,givePack,reduced} from './store.js';
import {openSheet,rise,countUp} from './ui.js';

const wait=ms=>new Promise(r=>setTimeout(r,ms));
function win(game,score){
 const d=day();d.wins??={};S.best[game]=Math.max(S.best[game]||0,score);changed();
 if(!d.wins[game]){d.wins[game]=true;changed();givePack(1,'First win of the day');return true;}
 return false;
}
const result=(body,{title,sub,again})=>{body.innerHTML=`<div class="g-end"><p class="eyebrow">Result</p><h2>${title}</h2><p>${sub}</p><div class="row-btns center"><button class="btn" data-again="${again}">Play again</button><button class="btn ghost" data-x>Done</button></div></div>`;};

/* ------------------------------------------------------------------ 1. quick trivia */
function trivia(body){
 const qs=shuffle(data.trivia.levels.flatMap(l=>l.qs.map(q=>({...q,level:l.name})))).slice(0,8);let i=0,right=0;
 const show=()=>{const q=qs[i],as=shuffle([q.a,...q.w]);
  body.innerHTML=`<div class="g-top"><p class="eyebrow">Question ${i+1} of ${qs.length} · ${esc(q.level)}</p><div class="bar"><i style="--p:${i/qs.length}"></i></div></div><h2 class="g-q">${esc(q.q)}</h2><div class="q-as big">${as.map(a=>`<button class="q-a press" data-a="${esc(a)}">${esc(a)}</button>`).join('')}</div><p class="q-note" id="g-note"></p>`;
  body.onclick=async e=>{const b=e.target.closest('[data-a]');if(!b)return;body.onclick=null;const ok=b.dataset.a===q.a;if(ok)right++;
   $$('[data-a]',body).forEach(x=>{x.disabled=true;x.classList.add(x.dataset.a===q.a?'right':x===b?'wrong':'off');});$('#g-note',body).textContent=q.note||'';
   await wait(ok?900:1900);i++;if(i<qs.length)show();else{const won=right>=6;if(right)earn(right*1e6,'Trivia');if(won)win('trivia',right);
    result(body,{title:`${right} of ${qs.length}.`,sub:won?'A win. Six or more is what it takes.':'Six or more is a win. Go again.',again:'trivia'});}};
 };show();
}
/* ------------------------------------------------------------------ 2. higher or lower (canon bounties) */
function higher(body){
 const crew=data.strawhats.crew.filter(c=>c.bounty);let streak=0,a=pick(crew);
 const next=()=>{let b;do{b=pick(crew);}while(b.id===a.id||b.bounty===a.bounty);
  const side=(c,k)=>`<button class="hl press" data-k="${k}" style="--c:${c.tint}"><img src="${TH(c.art)}" alt=""><span><b>${esc(c.short)}</b><small data-b>?</small></span></button>`;
  body.innerHTML=`<div class="g-top"><p class="eyebrow">Higher or lower · streak ${streak}</p></div><h2 class="g-q">Whose bounty is higher?</h2><div class="hl-row">${side(a,'a')}<i>or</i>${side(b,'b')}</div><p class="q-note">Best: ${S.best.hl||0} in a row</p>`;
  body.onclick=async e=>{const t=e.target.closest('[data-k]');if(!t)return;body.onclick=null;const chose=t.dataset.k==='a'?a:b,other=chose===a?b:a,ok=chose.bounty>other.bounty;
   $$('.hl',body).forEach(x=>{const c=x.dataset.k==='a'?a:b;x.disabled=true;x.classList.add(c.bounty>(c===a?b:a).bounty?'right':'wrong');countUp($('[data-b]',x),c.bounty,{prefix:'฿',ms:700});});
   await wait(1500);
   if(ok){streak++;a=b;next();}else{if(streak)earn(streak*1e6,'Higher or lower');const won=streak>=5;S.best.hl=Math.max(S.best.hl||0,streak);changed();if(won)win('hl',streak);
    result(body,{title:`${streak} in a row.`,sub:won?'A win. Five or more is what it takes.':'Five in a row is a win. Go again.',again:'higher'});}};
 };next();
}
/* ------------------------------------------------------------------ 3. who is it (the picture pulls back) */
function who(body){
 const m=data.media,groups=[...m.characters.map(c=>({name:c.home,ids:c.all})),...m.crew.filter(c=>!['Straw Hats','Imu','Rocks'].includes(c.name)).map(c=>({name:c.name,ids:c.all}))].filter(g=>g.ids.length>=2);
 let round=0,right=0;const N=6;
 const next=()=>{const g=pick(groups),id=pick(g.ids),opts=shuffle([g.name,...shuffle(groups.filter(x=>x.name!==g.name)).slice(0,3).map(x=>x.name)]),ox=20+Math.random()*60,oy=15+Math.random()*50;
  body.innerHTML=`<div class="g-top"><p class="eyebrow">Who is it · ${round+1} of ${N}</p><div class="bar"><i style="--p:${round/N}"></i></div></div><div class="who-pic"><img src="${FU(id)}" alt="" style="transform-origin:${ox}% ${oy}%"></div><div class="q-as big two">${opts.map(o=>`<button class="q-a press" data-a="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
  const img=$('.who-pic img',body);requestAnimationFrame(()=>requestAnimationFrame(()=>img.classList.add('out')));
  body.onclick=async e=>{const b=e.target.closest('[data-a]');if(!b)return;body.onclick=null;const ok=b.dataset.a===g.name;if(ok)right++;
   img.classList.add('show');$$('[data-a]',body).forEach(x=>{x.disabled=true;x.classList.add(x.dataset.a===g.name?'right':x===b?'wrong':'off');});
   await wait(1300);round++;if(round<N)next();else{if(right)earn(right*1e6,'Who is it');const won=right>=4;if(won)win('who',right);
    result(body,{title:`${right} of ${N}.`,sub:won?'A win. Four or more is what it takes.':'Four or more is a win. Go again.',again:'who'});}};
 };next();
}
const GAMES={trivia,higher,who};
export function startGame(k,from){
 openSheet(`<div class="game" id="game"></div>`,{from,cls:'wide game-sheet',onOpen(el){const body=$('#game',el);GAMES[k](body);
  el.addEventListener('click',e=>{const a=e.target.closest('[data-again]');if(a)GAMES[a.dataset.again](body);});}});
}
export function renderPlay(root){
 const m=data.media,cover=n=>{const c=m.crew.find(x=>x.name===n)||m.crew[0];return TH(c.cover);},luffy=m.characters.find(c=>c.home==='Luffy');
 const draw=()=>{const w=day().wins||{};
 root.innerHTML=`
 <header class="lt"><p class="lt-date">A pack for the first win of the day in each</p><h1 class="lt-title">Play</h1></header>
 <div class="games">
  <button class="gm big press" data-game="trivia" data-rise><img src="${FU(luffy.strip?.[0]||luffy.portrait)}" alt="" loading="lazy"><span class="card-t"><span class="eyebrow">${w.trivia?'Won today':'Eight questions'}</span><b>Quick trivia</b><small>From East Blue to Laugh Tale. Six right is a win. Best: ${S.best.trivia||0}</small></span></button>
  <button class="gm press" data-game="higher" data-rise><img src="${cover('Straw Hats')}" alt="" loading="lazy"><span class="card-t"><span class="eyebrow">${w.hl?'Won today':'Canon bounties'}</span><b>Higher or lower</b><small>Five in a row is a win. Best: ${S.best.hl||0}</small></span></button>
  <button class="gm press" data-game="who" data-rise><img src="${cover('Nami')}" alt="" loading="lazy"><span class="card-t"><span class="eyebrow">${w.who?'Won today':'Six pictures'}</span><b>Who is it?</b><small>The picture pulls back. Name them before it does. Best: ${S.best.who||0}</small></span></button>
 </div>
 <section class="row"><div class="row-head" data-rise><h2>More. <span>From the classic archive.</span></h2></div>
  <div class="links" data-rise><a class="lk press" href="${ROOT}trivia.html"><b>Grand Line Trivia</b><span>Five levels, two players</span></a><a class="lk press" href="${ROOT}index.html#games"><b>The Game Room</b><span>Seven more games</span></a><a class="lk press" href="${ROOT}index.html#treasure"><b>The Treasure Room</b><span>Chests, Devil Fruits, themes</span></a></div></section>`;rise(root);};
 draw();root.addEventListener('click',e=>{const g=e.target.closest('[data-game]');if(g)startGame(g.dataset.game,g);});
 return draw;
}

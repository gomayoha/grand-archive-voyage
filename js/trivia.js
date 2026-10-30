// Grand Line Trivia (trivia.html, Oct 30 2026). He asked for One Piece questions that are genuinely hard ("not
// easy dumbass questions"), in levels, using his pictures, and playable by two people on one phone.
//  - Five levels, East Blue (hard) to Laugh Tale (impossible); 7 of 10 right clears a level and opens the next.
//    The questions are in data/trivia.json. Two of every ten are photo rounds made from his own collections:
//    a close crop of one of his pictures, and you name whose collection it's from (the crop gets tighter each level).
//  - Face to face: the phone lies flat between two people; the top half is turned round for the player opposite.
//    Same question for both, first right answer takes it, a wrong answer locks you out of that question.
//    On a laptop the halves sit side by side (keys 1–4 and 7–0 work too).
//  - Take turns: pass the phone; ten questions each.
// Progress (levels cleared, best scores, the last two names) stays in this browser; clearing levels pays berries.
import {initBounty,once,earn} from './bounty.js';

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait=ms=>new Promise(r=>setTimeout(r,reduced?Math.min(ms,300):ms));
const FU=id=>`assets/img/f/${id}.webp`,TH=id=>`assets/img/t/${id}.webp`;
const KEY='grand-archive:trivia',M=1e6;
const S=(()=>{try{return Object.assign({cleared:[],best:{},names:['',''],duels:0},JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{return{cleared:[],best:{},names:['',''],duels:0};}})();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S));}catch{}};
const J=u=>fetch(u).then(r=>r.ok?r.json():null).catch(()=>null);

const root=$('#tv'),homeBtn=$('#tv-home');
const [T,media]=await Promise.all([J('data/trivia.json'),J('data/media.json')]);
initBounty();
if(!T){root.innerHTML='<p class="tv-load">The questions didn’t arrive. Check your signal and reload.</p>';throw new Error('trivia.json');}
const LV=T.levels;
let stop=()=>{};
homeBtn.addEventListener('click',()=>home());

/* ---------------------------------------------------------------- photo rounds from his collections */
const COLLAGE=new Set((media?.collages||[]).map(x=>x.id));
const OP=['Luffy','Robin','Zoro','Sanji','Nami','Usopp','Chopper','Franky','Brook','Jinbe','Vivi','Hancock','Yamato','Law','Kuma','Garp','Imu','Rocks','Bon Clay','Corazon'];
const PEOPLE=(()=>{if(!media)return[];const all=[...(media.characters||[]).map(c=>({n:c.home,ids:c.all})),...(media.crew||[]).map(c=>({n:c.name,ids:c.all})),...(media.supporting||[]).map(c=>({n:c.name,ids:c.all}))];
 return all.filter(c=>OP.includes(c.n)).map(c=>({n:c.n,ids:c.ids.filter(id=>media.img?.[id]&&!COLLAGE.has(id))})).filter(c=>c.ids.length>=2);})();
function photoQ(lv){
 const who=rnd(PEOPLE),id=rnd(who.ids),wrong=shuffle(PEOPLE.filter(p=>p.n!==who.n)).slice(0,3).map(p=>p.n);
 return{q:'Whose collection is this picture from?',a:who.n,w:wrong,photo:{id,z:lv.zoom,u:0.3+Math.random()*0.4,v:0.22+Math.random()*0.4},note:`From his ${who.n} collection.`};
}
// a round: text questions from the level's bank, with photo rounds mixed in
function deal(lv,n=10,photos=2){
 const text=shuffle(lv.qs).slice(0,n-(PEOPLE.length>3?photos:0)),out=text.map(x=>({...x}));
 if(PEOPLE.length>3)for(let k=0;k<photos;k++)out.splice(Math.floor((k+1)*n/(photos+1)),0,photoQ(lv));
 return out.slice(0,n).map(x=>({...x,opts:shuffle([x.a,...x.w])}));
}
const photoHTML=p=>p?`<figure class="tq-photo"><img src="${FU(p.id)}" alt="" decoding="async" style="transform-origin:${(p.u*100).toFixed(1)}% ${(p.v*100).toFixed(1)}%;transform:scale(${p.z})"><figcaption>× ${p.z.toFixed(1)}</figcaption></figure>`:'';
const unlocked=id=>id===1||S.cleared.includes(id-1);

/* ---------------------------------------------------------------- the chart: modes and the five islands */
function home(){
 stop();stop=()=>{};homeBtn.hidden=true;scrollTo(0,0);
 const cl=S.cleared.length;
 root.innerHTML=`<section class="tv-hero"><div class="tv-hero-art" aria-hidden="true"><img src="${FU('5b4d8ea99809')}" alt=""></div>
  <div class="tv-hero-in"><p class="eyebrow">A page of the Grand Archive</p><h1>Grand Line <em>Trivia.</em></h1><p class="tv-lede">Five levels of One Piece, from hard to impossible. Pictures from the archive as clues. Seven out of ten clears a level.</p><p class="tv-prog"><b>${cl}</b> / 5 levels cleared${S.duels?` · ${S.duels} ${S.duels===1?'duel':'duels'} played`:''}</p></div></section>
  <section class="tv-modes"><button class="tv-mode" data-mode="solo"><i aria-hidden="true">☠</i><b>Sail alone</b><span>Clear the levels in order. Each one opens the next.</span></button><button class="tv-mode" data-mode="face"><i aria-hidden="true">⇅</i><b>Face to face</b><span>Two players, one phone lying between you. First right answer wins the point.</span></button><button class="tv-mode" data-mode="turns"><i aria-hidden="true">⇄</i><b>Take turns</b><span>Pass the phone. Ten questions each, highest bounty wins.</span></button></section>
  <section class="tv-route" id="tv-route"><p class="eyebrow">The route</p><ol>${LV.map((l,i)=>{const open=unlocked(l.id),done=S.cleared.includes(l.id),b=S.best[l.id];return `<li class="tv-isle${open?'':' locked'}${done?' done':''}" style="--k:${i}"><button data-level="${l.id}"${open?'':' aria-disabled="true"'}><span class="tv-n">${String(i+1).padStart(2,'0')}</span><span class="tv-isle-t"><small>${esc(l.tag)}</small><b>${esc(l.name)}</b><span>${esc(l.line)}</span></span><span class="tv-isle-r">${done?`<em>Cleared</em>${b?`<small>Best ${b.c}/10 · ${b.s} pts</small>`:''}`:open?'<em class="go">Set sail →</em>':`<em class="lock">Clear ${esc(LV[i-1].name)} first</em>`}</span></button></li>`;}).join('')}</ol></section>
  <p class="tv-fine">${T.levels.reduce((n,l)=>n+l.qs.length,0)} questions, written for the archive from the manga and the official numbers. Progress stays on this device.</p>`;
 root.onclick=e=>{const m=e.target.closest('[data-mode]');if(m){m.dataset.mode==='solo'?$('#tv-route').scrollIntoView({behavior:reduced?'auto':'smooth'}):setup(m.dataset.mode);return;}
  const l=e.target.closest('[data-level]');if(l&&!l.hasAttribute('aria-disabled'))solo(LV.find(x=>x.id===+l.dataset.level));};
}

/* ---------------------------------------------------------------- one question, for one player */
function qHTML(x,i,n,lv,{who=''}={}){
 return `<div class="tq"><div class="tq-top"><span>${who?`<b>${esc(who)}</b> · `:''}${esc(lv.name)} · ${i+1} / ${n}</span><span class="tq-score">0</span></div><div class="tq-bar"><i></i></div>
  <div class="tq-card${x.photo?' has-photo':''}">${photoHTML(x.photo)}<div class="tq-body"><h2>${esc(x.q)}</h2><div class="tq-opts">${x.opts.map((o,k)=>`<button class="tq-o" data-k="${k}"><i>${'ABCD'[k]}</i><span>${esc(o)}</span></button>`).join('')}</div><div class="tq-after" hidden></div></div></div></div>`;
}
// runs one question; resolves {ok, t} when answered or time runs out
function ask(box,x,secs){
 return new Promise(res=>{
  const bar=box.querySelector('.tq-bar i'),opts=box.querySelector('.tq-opts');
  bar.style.transition='none';bar.style.transform='scaleX(1)';void bar.offsetWidth;bar.style.transition=`transform ${secs}s linear`;bar.style.transform='scaleX(0)';
  const t0=performance.now();let done=false;
  const end=(pick)=>{if(done)return;done=true;clearTimeout(tm);opts.classList.add('off');const k=pick?+pick.dataset.k:-1,ok=pick&&x.opts[k]===x.a;
   bar.style.transition='none';bar.style.transform=getComputedStyle(bar).transform;
   opts.querySelectorAll('.tq-o').forEach((o,j)=>{if(x.opts[j]===x.a)o.classList.add('right');else if(o===pick)o.classList.add('wrong');});
   res({ok,t:(performance.now()-t0)/1000,timeout:!pick});};
  const tm=setTimeout(()=>end(null),secs*1000);
  opts.addEventListener('click',e=>{const b=e.target.closest('.tq-o');if(b)end(b);});
  stop=()=>{done=true;clearTimeout(tm);};
 });
}
const points=(r,secs)=>r.ok?100+Math.round(50*Math.max(0,1-r.t/secs)):0;

/* ---------------------------------------------------------------- Sail alone */
async function solo(lv){
 stop();homeBtn.hidden=false;scrollTo(0,0);
 const Q=deal(lv);let score=0,right=0;const log=[];
 for(let i=0;i<Q.length;i++){
  root.innerHTML=qHTML(Q[i],i,Q.length,lv);root.querySelector('.tq-score').textContent=`${score} pts`;
  const box=root.querySelector('.tq'),r=await ask(box,Q[i],lv.time);if(!box.isConnected)return;
  const p=points(r,lv.time);score+=p;if(r.ok)right++;log.push({x:Q[i],ok:r.ok});
  root.querySelector('.tq-score').textContent=`${score} pts`;
  const af=root.querySelector('.tq-after');af.hidden=false;
  af.innerHTML=`<p class="${r.ok?'ok':'no'}">${r.ok?`Right. +${p}`:r.timeout?'Out of time.':'Not quite.'}</p>${!r.ok?`<p class="tq-ans">It was <b>${esc(Q[i].a)}</b>.</p>`:''}${Q[i].note?`<p class="tq-note">${esc(Q[i].note)}</p>`:''}<button class="pill small" data-next>${i<Q.length-1?'Next →':'See how you did'}</button>`;
  if(Q[i].photo){const im=root.querySelector('.tq-photo img');im.style.transition='transform .9s cubic-bezier(.2,.7,0,1)';im.style.transform='scale(1)';}
  await new Promise(r=>{af.querySelector('[data-next]').addEventListener('click',r);stop=r;});
  if(!root.contains(af))return;
 }
 const cleared=right>=7,first=cleared&&!S.cleared.includes(lv.id);
 if(cleared&&!S.cleared.includes(lv.id))S.cleared.push(lv.id);
 const b=S.best[lv.id];if(!b||right>b.c||(right===b.c&&score>b.s))S.best[lv.id]={c:right,s:score};save();
 if(cleared){once('trivia:'+lv.id,10*M,`Grand Line Trivia · ${lv.name} cleared`);if(lv.id===5)once('quest:trivia',100*M,'Laugh Tale. You know One Piece.');}
 const next=LV.find(x=>x.id===lv.id+1);
 root.innerHTML=`<section class="tv-end ${cleared?'win':'lose'}"><p class="eyebrow">${esc(lv.name)} · ${esc(lv.tag)}</p><h2>${right} <small>/ 10</small></h2><p class="tv-end-line">${cleared?(lv.id===5?'You reached Laugh Tale. Roger would laugh too.':first?`Level cleared. ${next?esc(next.name)+' is open.':''}`:'Cleared again.'):`Seven to clear it. ${right>=5?'So close.':'The Grand Line is not kind.'}`}</p><p class="tv-pts">${score} points${b?` · best ${Math.max(b.c,right)}/10`:''}</p>
  <div class="tv-acts">${cleared&&next?`<button class="pill" data-go="${next.id}">Sail on to ${esc(next.name)} →</button>`:''}<button class="pill ${cleared&&next?'ghost':''}" data-go="${lv.id}">${cleared?'Play it again':'Try again'}</button><button class="pill ghost" data-home>The route</button></div>
  <ol class="tv-review">${log.map(({x,ok})=>`<li class="${ok?'ok':'no'}"><span>${ok?'✓':'✕'}</span><p>${esc(x.q)}${x.photo?` <img src="${TH(x.photo.id)}" alt="">`:''}<b>${esc(x.a)}</b></p></li>`).join('')}</ol></section>`;
 root.onclick=e=>{const g=e.target.closest('[data-go]');if(g)solo(LV.find(x=>x.id===+g.dataset.go));if(e.target.closest('[data-home]'))home();};
}

/* ---------------------------------------------------------------- two players: names and the level */
function setup(mode){
 stop();homeBtn.hidden=false;scrollTo(0,0);
 const face=mode==='face';
 root.innerHTML=`<section class="tv-setup"><p class="eyebrow">${face?'Face to face':'Take turns'}</p><h2>Who’s <em>playing?</em></h2>
  <p class="tv-lede">${face?'Lay the phone flat between you. The top half turns round for the player across the table. Same question for both: first right answer takes it, a wrong answer locks you out.':'One phone, passed back and forth. Ten questions each. The highest bounty wins.'}</p>
  <div class="tv-names"><label><small>Player one</small><input id="n1" maxlength="14" autocomplete="off" placeholder="Luffy" value="${esc(S.names[0]||'')}"></label><span class="tv-vs">vs</span><label><small>Player two</small><input id="n2" maxlength="14" autocomplete="off" placeholder="Zoro" value="${esc(S.names[1]||'')}"></label></div>
  <p class="tv-k">Level</p><div class="tv-pick">${LV.map(l=>`<button data-lv="${l.id}" aria-pressed="${l.id===(S.duelLv||2)}"><small>${esc(l.tag)}</small><b>${esc(l.name)}</b></button>`).join('')}</div>
  <button class="pill tv-start" id="tv-start">Start the duel →</button></section>`;
 let lvId=S.duelLv||2;
 root.onclick=e=>{const b=e.target.closest('[data-lv]');if(b){lvId=+b.dataset.lv;root.querySelectorAll('[data-lv]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}
  if(e.target.closest('#tv-start')){const a=$('#n1').value.trim()||'Player one',c=$('#n2').value.trim()||'Player two';S.names=[$('#n1').value.trim(),$('#n2').value.trim()];S.duelLv=lvId;save();(face?faceOff:turns)(LV.find(x=>x.id===lvId),[a,c]);}};
}

/* ---------------------------------------------------------------- Face to face */
async function faceOff(lv,names){
 stop();homeBtn.hidden=true;document.body.classList.add('tv-duel');
 const Q=deal(lv,10,2),sc=[0,0];let quit=false;
 const half=(p)=>`<section class="fx-h p${p+1}" data-p="${p}"><header><b>${esc(names[p])}</b><span class="fx-s">0</span></header><div class="fx-q"></div><div class="fx-o"></div><p class="fx-msg"></p></section>`;
 root.innerHTML=`<div class="fx">${half(0)}<div class="fx-mid"><span class="fx-n"></span><div class="fx-bar"><i></i></div><button class="fx-quit" aria-label="End the duel">✕</button></div>${half(1)}</div>`;
 const H=[...root.querySelectorAll('.fx-h')],bar=root.querySelector('.fx-bar i'),num=root.querySelector('.fx-n');
 root.querySelector('.fx-quit').onclick=()=>{quit=true;stop();document.body.classList.remove('tv-duel');home();};
 for(let i=0;i<Q.length&&!quit;i++){
  const x=Q[i];num.textContent=`${i+1} / ${Q.length}`;
  H.forEach(h=>{h.classList.remove('won','out','lost');h.querySelector('.fx-q').innerHTML=`${photoHTML(x.photo)}<h3>${esc(x.q)}</h3>`;h.querySelector('.fx-o').innerHTML=x.opts.map((o,k)=>`<button class="tq-o" data-k="${k}"><i>${'ABCD'[k]}</i><span>${esc(o)}</span></button>`).join('');h.querySelector('.fx-msg').textContent='';});
  // the timer runs across on an upright phone, down the middle strip everywhere else
  const ax=matchMedia('(orientation:portrait) and (max-width:820px)').matches?'scaleX':'scaleY';
  bar.style.transition='none';bar.style.transform=`${ax}(1)`;void bar.offsetWidth;bar.style.transition=`transform ${lv.time}s linear`;bar.style.transform=`${ax}(0)`;
  const t0=performance.now();
  const res=await new Promise(res=>{
   const locked=[false,false];let done=false;
   const tm=setTimeout(()=>fin(-1,true),lv.time*1000);
   function fin(w,timeout=false){if(done)return;done=true;clearTimeout(tm);removeEventListener('keydown',key);res({w,timeout,t:(performance.now()-t0)/1000});}
   function answer(p,k){if(done||locked[p])return;const h=H[p],b=h.querySelectorAll('.tq-o')[k];
    if(x.opts[k]===x.a){b.classList.add('right');fin(p);}
    else{locked[p]=true;b.classList.add('wrong');h.classList.add('out');h.querySelector('.fx-msg').textContent='Locked out of this one';if(locked[0]&&locked[1])fin(-1);}}
   H.forEach((h,p)=>h.querySelector('.fx-o').onclick=e=>{const b=e.target.closest('.tq-o');if(b)answer(p,+b.dataset.k);});
   // two people at one keyboard: 1–4 on the left, 7–0 on the right
   const key=e=>{const k='1234'.indexOf(e.key),k2='7890'.indexOf(e.key);if(k>=0)answer(0,k);if(k2>=0)answer(1,k2);};addEventListener('keydown',key);
   stop=()=>{done=true;clearTimeout(tm);removeEventListener('keydown',key);res({w:-2});};
  });
  if(quit||res.w===-2)return;
  bar.style.transition='none';
  H.forEach((h,p)=>{h.querySelectorAll('.tq-o').forEach((o,k)=>{if(x.opts[k]===x.a)o.classList.add('right');});h.querySelector('.fx-o').classList.add('off');
   if(res.w===p){const pts=points({ok:true,t:res.t},lv.time);sc[p]+=pts;h.classList.add('won');h.querySelector('.fx-msg').textContent=`+${pts}`;h.querySelector('.fx-s').textContent=sc[p];}
   else if(res.w>=0){h.classList.add('lost');h.querySelector('.fx-msg').textContent=`${names[res.w]} got it`;}
   else h.querySelector('.fx-msg').textContent=res.timeout?`Time. It was ${x.a}.`:`Nobody. It was ${x.a}.`;});
  H.forEach(h=>{const im=h.querySelector('.tq-photo img');if(im){im.style.transition='transform .9s cubic-bezier(.2,.7,0,1)';im.style.transform='scale(1)';}});
  await wait(res.w>=0?1900:2600);
 }
 if(!quit)duelEnd(lv,names,sc,'face');
}

/* ---------------------------------------------------------------- Take turns */
async function turns(lv,names){
 stop();homeBtn.hidden=false;
 const Q=deal(lv,20,4),sc=[0,0],right=[0,0];
 for(let i=0;i<Q.length;i++){
  const p=i%2;
  // hand the phone over
  root.innerHTML=`<section class="tv-pass"><p class="eyebrow">Question ${Math.floor(i/2)+1} of 10 · ${esc(lv.name)}</p><h2>Pass it to<br><em>${esc(names[p])}.</em></h2><p class="tv-score2"><span>${esc(names[0])} <b>${sc[0]}</b></span><span>${esc(names[1])} <b>${sc[1]}</b></span></p><button class="pill" data-ready>I’m ready</button></section>`;
  await new Promise(r=>{root.querySelector('[data-ready]').onclick=r;stop=r;});
  if(!root.querySelector('[data-ready]'))return;
  root.innerHTML=qHTML(Q[i],Math.floor(i/2),10,lv,{who:names[p]});root.querySelector('.tq-score').textContent=`${sc[p]} pts`;
  const box=root.querySelector('.tq'),r=await ask(box,Q[i],lv.time);if(!box.isConnected)return;
  const pts=points(r,lv.time);sc[p]+=pts;if(r.ok)right[p]++;root.querySelector('.tq-score').textContent=`${sc[p]} pts`;
  const af=root.querySelector('.tq-after');af.hidden=false;
  af.innerHTML=`<p class="${r.ok?'ok':'no'}">${r.ok?`Right. +${pts}`:r.timeout?'Out of time.':'Not quite.'}</p>${!r.ok?`<p class="tq-ans">It was <b>${esc(Q[i].a)}</b>.</p>`:''}<button class="pill small" data-next>${i<Q.length-1?`Pass to ${esc(names[1-p])} →`:'And the winner is…'}</button>`;
  if(Q[i].photo){const im=root.querySelector('.tq-photo img');im.style.transition='transform .9s cubic-bezier(.2,.7,0,1)';im.style.transform='scale(1)';}
  await new Promise(r=>{af.querySelector('[data-next]').onclick=r;stop=r;});
  if(!root.contains(af))return;
 }
 duelEnd(lv,names,sc,'turns',right);
}

function duelEnd(lv,names,sc,mode,right){
 document.body.classList.remove('tv-duel');homeBtn.hidden=false;scrollTo(0,0);
 S.duels=(S.duels||0)+1;save();once('trivia:duel',5*M,'Your first trivia duel');
 const w=sc[0]===sc[1]?-1:sc[0]>sc[1]?0:1;
 root.innerHTML=`<section class="tv-end duel ${w<0?'draw':'win'}"><p class="eyebrow">${esc(lv.name)} · ${mode==='face'?'Face to face':'Take turns'}</p>${w<0?'<h2>A <em>draw.</em></h2><p class="tv-end-line">Same bounty, down to the last berry. Go again.</p>':`<p class="tv-crown" aria-hidden="true">♛</p><h2><em>${esc(names[w])}</em><br>wins.</h2>`}
  <div class="tv-final">${[0,1].map(p=>`<div class="${p===w?'top':''}"><small>${esc(names[p])}</small><b>฿${(sc[p]*1e6).toLocaleString('en-US')}</b>${right?`<span>${right[p]} / 10 right</span>`:''}</div>`).join('')}</div>
  <div class="tv-acts"><button class="pill" data-again>Rematch</button><button class="pill ghost" data-swap>Swap seats</button><button class="pill ghost" data-home>The route</button></div></section>`;
 root.onclick=e=>{if(e.target.closest('[data-again]'))(mode==='face'?faceOff:turns)(lv,names);if(e.target.closest('[data-swap]'))(mode==='face'?faceOff:turns)(lv,[names[1],names[0]]);if(e.target.closest('[data-home]'))home();};
}

home();

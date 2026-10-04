// The Logbook's time machine: a brass dial on a ship's-log page. The early stops are the phases of his
// Anime Journey (route.json, his words); the later stops are the archive's own snapshots (data/history,
// written by every sync), where the numbers and the Top 10 read exactly as they were that day, with arrows
// for what moved. The dial starts at today; every sync adds a stop.
import {$,esc,clamp,ease,motion,data,onSight} from '../core.js';
import {openDialog} from '../dialogs.js';

const J=u=>fetch(u).then(r=>r.ok?r.json():null).catch(()=>null);
const num=s=>{const n=parseFloat(s);return /^\d/.test(String(s))&&!isNaN(n)?n:null;};
const norm=t=>String(t).toLowerCase().replace(/[^a-z0-9]/g,'');
const fmt=d=>new Date(d+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
const short=d=>new Date(d+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'});
// "November 2024 → Early 2025" → "Nov ’24"; "January → March 2026" → "Jan ’26"; undated phases keep their number.
function when(p){
 const w=String(p.when||'');if(!w)return p.phase;
 const head=w.split('→')[0].trim(),yr=(head.match(/\d{4}/)||w.match(/\d{4}/)||[])[0],mo=head.match(/[A-Za-z]{3}/);
 if(!yr)return p.phase;return mo&&!/^\d{4}$/.test(head)?`${mo[0]} ’${yr.slice(2)}`:yr;
}
const STATS=[['done','anime completed'],['watching','watching'],['mfin','manga finished'],['mread','manga in progress'],['tv','shows'],['avg','average anime rating']];

// The archive on one day, in numbers.
function measure(snap){
 const A=Object.values(snap.anime||{}),M=Object.values(snap.manga||{});
 const rated=A.filter(a=>a.status!=='want'&&num(a.s)!==null);
 return{done:A.filter(a=>a.status==='completed').length,watching:A.filter(a=>a.status==='watching').length,
  mfin:M.filter(m=>m.status==='finished').length,mread:M.filter(m=>m.status==='reading').length,tv:Object.keys(snap.tv||{}).length,
  avg:rated.length?+(rated.reduce((s,a)=>s+num(a.s),0)/rated.length).toFixed(1):0};
}
const fromShelf=sh=>({anime:Object.fromEntries(sh.anime.map(a=>[a.t,{s:a.s,status:a.status}])),manga:Object.fromEntries(sh.manga.map(m=>[m.t,{status:m.status}])),tv:Object.fromEntries(sh.tv.map(t=>[t.t,{s:t.s}])),top10:sh.top10.map(x=>x.title)});

export async function initTimeMachine(){
 const box=$('#tm');if(!box)return;
 const sh=data.shelf,phases=(data.route?.stops||[]).filter(s=>s.blocks?.length),log=data.logbook?.entries||[];
 // snapshots, oldest first; the newest one is "today" when it matches the last sync
 const dates=[...new Set(log.map(e=>e.date))].sort();
 const snaps=(await Promise.all(dates.map(d=>J(`data/history/${d}.json`)))).filter(Boolean);
 const today=sh.updated?String(sh.updated).slice(0,10):null;
 const past=snaps.filter(s=>s.date!==today);
 const stops=[
  ...phases.map(p=>({kind:'phase',p,label:when(p),title:p.when||`Phase ${p.phase}`})),
  ...past.map(s=>({kind:'snap',snap:s,label:short(s.date),title:fmt(s.date),note:s.label})),
  {kind:'snap',snap:{...fromShelf(sh),date:today},label:'Today',title:today?`Today · ${fmt(today)}`:'Today',today:true}
 ];
 const snapIdx=stops.map((s,i)=>s.kind==='snap'?i:-1).filter(i=>i>=0);
 const N=stops.length;let cur=N-1,shown=null;

 box.innerHTML=`<div class="tm-head"><p class="tm-k">Ship’s log · turn the dial to go back</p><p class="tm-date" id="tm-date"></p></div>
  <div class="tm-dial" id="tm-dial" role="slider" tabindex="0" aria-label="Go back in time" aria-valuemin="0" aria-valuemax="${N-1}">
   <div class="tm-track"><i class="tm-fill" id="tm-fill"></i></div>
   ${stops.map((s,i)=>`<button class="tm-tick ${s.kind}" data-i="${i}" style="left:${(i/(N-1)*100).toFixed(3)}%" aria-label="${esc(s.title)}"><span>${esc(s.label)}</span></button>`).join('')}
   <span class="tm-knob" id="tm-knob" aria-hidden="true"></span>
  </div>
  <div class="tm-read" id="tm-read"></div>`;
 const dial=$('#tm-dial'),knob=$('#tm-knob'),fill=$('#tm-fill'),read=$('#tm-read'),dateEl=$('#tm-date'),ticks=[...box.querySelectorAll('.tm-tick')];

 const statsHTML=(m,prev)=>`<div class="tm-stats">${STATS.map(([k,l])=>{const d=prev?+(m[k]-prev[k]).toFixed(1):0;return `<div><b data-v="${m[k]}">${m[k]}</b><span>${l}</span>${d?`<em class="${d>0?'up':'down'}">${d>0?'+':''}${d}</em>`:''}</div>`;}).join('')}</div>`;
 function snapHTML(i){
  const s=stops[i],m=measure(s.snap),pi=snapIdx[snapIdx.indexOf(i)-1],prev=pi!=null?stops[pi]:null,pm=prev&&measure(prev.snap);
  const top=s.snap.top10||[],ptop=prev?.snap.top10||[];
  return `${s.note?`<p class="tm-note">${esc(s.note)}</p>`:''}${statsHTML(m,pm)}
   <div class="tm-top"><h4>My top 10 ${s.today?'today':'that day'}</h4><ol>${top.map((t,k)=>{const was=ptop.findIndex(x=>norm(x)===norm(t));const mv=!prev?'':was<0?'<em class="up">new</em>':was!==k?`<em class="${was>k?'up':'down'}">${was>k?'▲':'▼'}${Math.abs(was-k)}</em>`:'';return `<li><b>${esc(t)}</b>${mv}</li>`;}).join('')}</ol></div>
   ${prev?`<p class="tm-since">Compared with ${esc(prev.title)}.</p>`:'<p class="tm-since">The first page of the log.</p>'}`;
 }
 function phaseHTML(i){
  const p=stops[i].p,words=p.blocks.filter(b=>b.p||b.q).slice(0,3);
  return `<div class="tm-phase"><p class="tm-phase-k">Phase ${esc(p.phase)}${p.when?` · ${esc(p.when)}`:''}</p><h3>${esc(p.name)}</h3>${p.title?`<p class="tm-phase-t">${esc(p.title)}</p>`:''}
   <div class="tm-words">${words.map(b=>b.q?`<blockquote>${esc(b.q)}</blockquote>`:`<p>${esc(b.p)}</p>`).join('')}</div>
   ${p.tags?.length?`<div class="tm-tags">${p.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}
   ${p.blocks.length>words.length?`<button class="tm-more" data-phase="${i}">Read the whole chapter →</button>`:''}</div>`;
 }
 // numbers roll from what they were to what they are
 function roll(){if(motion.reduced)return;read.querySelectorAll('.tm-stats b').forEach(b=>{const end=+b.dataset.v,from=+(b.dataset.from||0),dec=String(end).includes('.')?1:0,t0=performance.now();
  const run=t=>{const k=ease(clamp((t-t0)/700));b.textContent=(from+(end-from)*k).toFixed(dec);if(k<1)requestAnimationFrame(run);};requestAnimationFrame(run);});}
 function select(i,instant){
  i=clamp(Math.round(i),0,N-1);const changed=i!==cur||shown===null;cur=i;
  const x=i/(N-1)*100;knob.style.left=`${x}%`;fill.style.transform=`scaleX(${(i/(N-1)).toFixed(4)})`;
  ticks.forEach((t,k)=>t.classList.toggle('on',k===i));
  dial.setAttribute('aria-valuenow',i);dial.setAttribute('aria-valuetext',stops[i].title);
  if(!changed)return;
  const old=read.querySelectorAll('.tm-stats b'),prevVals=[...old].map(b=>+b.dataset.v);
  const render=()=>{dateEl.textContent=stops[i].title;read.innerHTML=stops[i].kind==='phase'?phaseHTML(i):snapHTML(i);
   read.querySelectorAll('.tm-stats b').forEach((b,k)=>{b.dataset.from=prevVals[k]??0;});read.classList.remove('out');if(shown!==null)roll();shown=i;};
  if(instant||motion.reduced||shown===null){render();return;}
  read.classList.add('out');clearTimeout(read._t);read._t=setTimeout(render,180);
 }
 select(N-1,true);
 // first time the log is seen, today's numbers count up from nothing
 onSight(read,()=>{read.querySelectorAll('.tm-stats b').forEach(b=>b.dataset.from=0);roll();});

 dial.addEventListener('click',e=>{const t=e.target.closest('.tm-tick');if(t)select(+t.dataset.i);});
 dial.addEventListener('keydown',e=>{const d={ArrowLeft:-1,ArrowDown:-1,ArrowRight:1,ArrowUp:1}[e.key];if(e.key==='Home'){select(0);e.preventDefault();}else if(e.key==='End'){select(N-1);e.preventDefault();}else if(d){select(cur+d);e.preventDefault();}});
 // dragging the knob along the dial
 const at=e=>{const r=dial.getBoundingClientRect();return clamp((e.clientX-r.left)/r.width)*(N-1);};
 dial.addEventListener('pointerdown',e=>{if(e.target.closest('.tm-tick'))return;dial.setPointerCapture(e.pointerId);dial.classList.add('drag');select(at(e));});
 dial.addEventListener('pointermove',e=>{if(dial.classList.contains('drag'))select(at(e));});
 const end=()=>dial.classList.remove('drag');dial.addEventListener('pointerup',end);dial.addEventListener('pointercancel',end);
 read.addEventListener('click',e=>{const b=e.target.closest('[data-phase]');if(!b)return;const p=stops[+b.dataset.phase].p;
  openDialog(`<p class="eyebrow">My Anime Journey · Phase ${esc(p.phase)}${p.when?` · ${esc(p.when)}`:''}</p><h2 id="dialog-title">${esc(p.name)}</h2>${p.title?`<p class="subtle">${esc(p.title)}</p>`:''}<div class="tm-words full">${p.blocks.map(b=>b.h?`<h3>${esc(b.h)}</h3>`:b.q?`<blockquote>${esc(b.q)}</blockquote>`:`<p>${esc(b.p)}</p>`).join('')}</div>`);});
}

// The Story of One Piece: the whole manga, arc by arc (data/story.json, written for the archive), with
// Goma's own panels, moments and records placed where they happen (his words untouched, straight from
// data/panels.json, route.json, characters.json). A log in the corner keeps Luffy's bounty, the crew and
// the chapter while you read; six scenes mark the turning points. Same engine as the archive: native
// scroll, one rAF, transform/opacity (the burning flag is the one masked paint).
import {$,$$,esc,clamp,smooth,ease,view,part,pinned,motion,measureAll,remeasure,absTop,jumpTo,onSight,warm,FU} from './core.js';

// Lookups inside one block (core's $ and $$ always search the whole page).
const q=(sel,root)=>root.querySelector(sel),qa=(sel,root)=>[...root.querySelectorAll(sel)];
const J=u=>fetch(u).then(r=>r.ok?r.json():null).catch(()=>null);
const [story,panels,route,characters,shelf]=await Promise.all(['story','panels','route','characters','shelf'].map(k=>J(`data/${k}.json`)));
const PM=id=>`assets/panels/m/${id}.webp`,PF=id=>`assets/panels/${id}.webp`;
const band=(p,a,b,f=0.06)=>smooth(clamp((p-a)/f))*(1-smooth(clamp((p-b)/f)));
const money=n=>Number(n).toLocaleString('en-US');
const HUE=['#4aa3df','#e0a24a','#9ad7ff','#3fb8af','#8e6cd8','#e3342f','#5ad1e6','#f08bb4','#c79bf2','#f37b3a','#f3c969'];

/* ---------------------------------------------------------------- his archive, placed by chapter */
// Where he is in the manga comes from his tracker, so the page grows with his notes.
const opManga=(shelf?.manga||[]).find(r=>r.t==='One Piece');
const LATEST=parseInt(String(opManga?.chapter||'').replace(/\D/g,''))||story.latest;
const sagas=story.sagas,arcs=sagas.flatMap((s,si)=>s.arcs.map(a=>({...a,saga:si})));
const last=arcs[arcs.length-1];if(last.ch[1]<LATEST)last.ch=[last.ch[0],LATEST];sagas[sagas.length-1].ch[1]=LATEST;
const arcFor=ch=>arcs.find(a=>ch>=a.ch[0]&&ch<=a.ch[1]);
const byTitle={'I’ll become the king of the hell':'wano',"I'll become the king of the hell":'wano','Elbaf Mural':'elbaph'};
const mine={};const add=(id,x)=>{(mine[id]??=[]).push(x);};
for(const p of panels?.onepiece?.[0]?.panels||[]){const a=p.chapter?arcFor(p.chapter):arcs.find(x=>x.id===byTitle[p.title]);if(a)add(a.id,{kind:'panel',p});}
const MOMENT_ARC={'01':'arlong-park','02':'baratie','03':'thriller-bark','04':'enies-lobby','05':'romance-dawn','06':'thriller-bark','07':'marineford','08':'wano','09':'wano','10':'egghead','11':'elbaph'};
const opMoments=(route?.moments||[]).filter(m=>m.series==='One Piece');
for(const m of opMoments)if(MOMENT_ARC[m.n])add(MOMENT_ARC[m.n],{kind:'moment',m});
const RECORD_ARC={luffy:'romance-dawn',zoro:'romance-dawn',sanji:'baratie',robin:'jaya'};
for(const c of characters?.characters||[])if(RECORD_ARC[c.id])add(RECORD_ARC[c.id],{kind:'record',c});
// Family: the rewatch with his mother, wherever that episode falls.
const rw=(shelf?.rewatches||[]).find(r=>r.title==='One Piece');const epNow=+((rw?.body||'').match(/Episode\s+(\d+)/i)||[])[1];
const epRange=a=>{const [x,y]=String(a.ep).split('–').map(Number);return[x,y||Infinity];};
if(epNow){const a=arcs.find(a=>{const [x,y]=epRange(a);return epNow>=x&&epNow<=y;});if(a)add(a.id,{kind:'mark',k:'Watching it again',t:rw.body});}
add('romance-dawn',{kind:'mark',k:'July 2024',t:'Where my One Piece started.'});
add('elbaph',{kind:'mark',k:'Where I am',t:`Manga: chapter ${LATEST}.`});

/* ---------------------------------------------------------------- building the page */
const crew=story.crew,crewIdx=Object.fromEntries(crew.map(([id],i)=>[id,i]));
const CREW_NAME=Object.fromEntries(crew.map(([id,n])=>[id,n]));
const textHTML=m=>m.text.map(b=>b.q?`<blockquote>${esc(b.q)}</blockquote>`:`<p>${esc(b.p)}</p>`).join('');
function mineHTML(list){
 if(!list||!list.length)return '';
 const order={mark:0,record:1,panel:2,moment:3};
 return `<div class="mine"><p class="mine-k">From my archive</p>${list.slice().sort((a,b)=>order[a.kind]-order[b.kind]||((a.p?.chapter||0)-(b.p?.chapter||0))).map(x=>{
  if(x.kind==='mark')return `<p class="mine-mark"><b>${esc(x.k)}</b> ${esc(x.t)}</p>`;
  if(x.kind==='record'){const c=x.c;return `<a class="mine-record" href="index.html#characters" style="--c:${esc(c.image.color||'#333')}"><img src="assets/chars/m/${esc(c.image.id)}.webp" alt="" loading="lazy" decoding="async"><span><small>The Character Log · left behind</small><b>${esc(c.name)} · <em>${esc(c.word)}</em></b><i>${esc(c.left)}</i></span></a>`;}
  if(x.kind==='panel'){const p=x.p,img=p.images[0];return `<button class="mine-panel" data-lb="${esc(img.id)}" data-cap="${esc((p.chapter?`Ch. ${p.chapter} · `:'')+p.title)}"><span class="mp-img"><img src="${PM(img.id)}" width="${img.w||600}" height="${img.h||900}" alt="" loading="lazy" decoding="async"></span><span class="mp-txt"><small>${p.chapter?`Ch. ${p.chapter}`:'Panel'}</small><b>${esc(p.title)}</b>${p.note?`<i>${esc(p.note)}</i>`:''}</span></button>`;}
  if(x.kind==='moment'){const m=x.m;return `<div class="mine-moment"><small>A moment that lives in my head${m.emotion?` · ${esc(m.emotion)}`:''}</small><b>${esc(m.title)}</b><div class="mm-text">${textHTML(m)}</div></div>`;}
  return '';}).join('')}</div>`;
}
function arcHTML(a,n){
 const ev=[...(a.joins||[]).map(j=>`<span class="ev join" data-ev="join:${j}" style="--c:${crew[crewIdx[j]][2]}">${esc(CREW_NAME[j])} joins the crew</span>`),
  a.bounty?`<span class="ev bounty" data-ev="bounty:${a.bounty}">Luffy’s new bounty <b>฿${money(a.bounty)}</b></span>`:''].join('');
 return `<article class="arc" id="arc-${a.id}" data-arc="${n}" style="--c:${HUE[a.saga]}">
  <header class="arc-side"><span class="arc-no">Arc ${String(n+1).padStart(2,'0')} / ${arcs.length}</span><h3>${esc(a.name)}</h3><p class="arc-place">${esc(a.place)}</p>
   <dl class="arc-meta"><div><dt>Chapters</dt><dd>${a.ch[0]}–${a.ch[1]}${a.id===last.id?'<small> so far</small>':''}</dd></div><div><dt>Episodes</dt><dd>${esc(a.ep)}</dd></div></dl></header>
  <div class="arc-main">
   ${a.art?`<figure class="arc-art"><img src="${FU(a.art)}" alt="" loading="lazy" decoding="async"></figure>`:''}
   <div class="arc-text">${a.text.map(t=>`<p>${esc(t)}</p>`).join('')}</div>
   ${a.quote?`<blockquote class="arc-quote">“${esc(a.quote[0].replace(/^“|”$/g,''))}”<cite>${esc(a.quote[1])}</cite></blockquote>`:''}
   ${ev?`<div class="arc-ev">${ev}</div>`:''}
   ${mineHTML(mine[a.id])}
  </div>
 </article>`;
}
function sagaHTML(s,si){
 return `<section class="saga" id="saga-${si+1}" data-saga="${si}" style="--c:${HUE[si]}">
  <div class="saga-hero"><div class="pin"><div class="saga-frame"><img src="${FU(s.spread)}" alt="" decoding="async"${si===0?'':' loading="lazy"'}><i class="saga-shade"></i></div>
   <div class="saga-copy"><p class="saga-num">Saga ${esc(s.num)}</p><h2>${esc(s.title)}</h2><p class="saga-tag">${esc(s.tag)}</p><p class="saga-meta">Ch. ${s.ch[0]}–${s.ch[1]} · ${esc(s.places)}</p></div></div></div>
  <div class="saga-arcs"></div>
 </section>`;
}

/* ---------------------------------------------------------------- scenes */
const HAT=`<svg class="hat" viewBox="0 0 240 120" aria-hidden="true"><defs><linearGradient id="straw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dc8c"/><stop offset="1" stop-color="#d7a94a"/></linearGradient></defs>
 <ellipse cx="120" cy="92" rx="116" ry="24" fill="url(#straw)" stroke="#9c7428" stroke-width="2"/>
 <path d="M58 88C58 40 82 14 120 14S182 40 182 88Z" fill="url(#straw)" stroke="#9c7428" stroke-width="2"/>
 <path d="M60 74C78 82 162 82 180 74L182 88C162 96 78 96 58 88Z" fill="#c8282c"/>
 <path d="M76 40C96 30 144 30 164 40M70 58C94 48 146 48 170 58M30 96C80 108 160 108 210 96" fill="none" stroke="#b88a35" stroke-width="1.4" opacity=".55"/></svg>`;
const EMBLEM=`<svg class="fl-emblem" viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="#f5f5f7" stroke-width="7"><circle cx="100" cy="100" r="62"/><ellipse cx="100" cy="100" rx="62" ry="22"/><ellipse cx="100" cy="100" rx="24" ry="62"/><path d="M100 20V180M20 100H180"/></g><g fill="#f5f5f7"><path d="M100 4l10 16H90z"/><path d="M100 196l10-16H90z"/><path d="M4 100l16-10v20z"/><path d="M196 100l-16-10v20z"/></g></svg>`;
const PAW=`<svg class="paw" viewBox="0 0 100 100" aria-hidden="true"><g fill="currentColor"><ellipse cx="50" cy="64" rx="24" ry="20"/><ellipse cx="22" cy="38" rx="9" ry="12"/><ellipse cx="40" cy="24" rx="9" ry="12"/><ellipse cx="60" cy="24" rx="9" ry="12"/><ellipse cx="78" cy="38" rx="9" ry="12"/></g></svg>`;
const SCATTERED=['zoro','brook','usopp','chopper','robin','franky','sanji','nami'];

const SCENES={
 hat:{h:260,html:()=>`<div class="pin"><figure class="hs-panel"><img src="${PM('719806c64fa4')}" alt="" loading="lazy" decoding="async"></figure>
  <p class="hs-k">Arlong Park · Chapter 81</p><p class="hs-help"><span class="hs-hat">${HAT}</span><span class="hs-a">“Luffy…</span><span class="hs-b">help me.”</span></p><p class="hs-yes">“Of course!”</p></div>`,
  init(el){return{help:q('.hs-help',el),a:q('.hs-a',el),b:q('.hs-b',el),hat:q('.hs-hat',el),yes:q('.hs-yes',el),panel:q('.hs-panel',el),k:q('.hs-k',el)};},
  update(p,e){
   e.k.style.opacity=(band(p,0.02,0.9)).toFixed(3);
   e.a.style.opacity=smooth(clamp((p-0.04)/0.08)).toFixed(3);e.b.style.opacity=smooth(clamp((p-0.16)/0.08)).toFixed(3);
   const f=clamp((p-0.28)/0.32),fall=f<1?ease(f):1,land=clamp((p-0.6)/0.08);
   const y=(1-fall)*-view.vh*0.75,rot=-34*(1-fall)+(-6)+Math.sin(land*Math.PI)*-5;
   e.hat.style.opacity=smooth(clamp((p-0.26)/0.04)).toFixed(3);
   e.hat.style.transform=`translate3d(-50%,${y.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg) scale(${(1.5-fall*0.5).toFixed(3)})`;
   e.panel.style.opacity=(0.32*smooth(clamp((p-0.62)/0.14))).toFixed(3);
   e.yes.style.opacity=smooth(clamp((p-0.72)/0.08)).toFixed(3);e.yes.style.transform=`translate3d(0,${((1-smooth(clamp((p-0.72)/0.1)))*24).toFixed(1)}px,0)`;
  }},
 flag:{h:300,html:()=>`<div class="pin"><p class="fl-k">Enies Lobby · Chapter 398</p><div class="fl-flag"><div class="fl-cloth">${EMBLEM}</div><i class="fl-glow"></i><i class="fl-shot"></i></div>
  <p class="fl-cmd">“Sogeking! Shoot that flag!”</p><p class="fl-war">They had just declared war on the world.</p><p class="fl-live">“I want to live!<em>Take me to the sea with you!”</em></p></div>`,
  init(el){return{cloth:q('.fl-cloth',el),glow:q('.fl-glow',el),shot:q('.fl-shot',el),cmd:q('.fl-cmd',el),war:q('.fl-war',el),live:q('.fl-live',el),flag:q('.fl-flag',el),k:q('.fl-k',el)};},
  update(p,e){
   e.k.style.opacity=band(p,0.02,0.6).toFixed(3);
   e.cmd.style.opacity=band(p,0.05,0.22).toFixed(3);
   const hit=clamp((p-0.2)/0.04);e.shot.style.opacity=(Math.sin(hit*Math.PI)).toFixed(3);
   const r=smooth(clamp((p-0.22)/0.26))*108;
   e.cloth.style.setProperty('--r',r.toFixed(2)+'%');e.glow.style.setProperty('--r',r.toFixed(2)+'%');
   e.glow.style.opacity=(r>0&&r<107?1:0).toString();
   e.flag.style.opacity=(1-smooth(clamp((p-0.5)/0.06))).toFixed(3);
   e.war.style.opacity=band(p,0.46,0.62).toFixed(3);
   const l=smooth(clamp((p-0.66)/0.1));e.live.style.opacity=l.toFixed(3);e.live.style.transform=`scale(${(0.94+l*0.06).toFixed(4)})`;
  }},
 scatter:{h:280,html:()=>`<div class="pin"><p class="sc-k">Sabaody Archipelago · Chapter 513</p><ol class="sc-names">${SCATTERED.map(id=>`<li style="--c:${crew[crewIdx[id]][2]}"><span>${esc(CREW_NAME[id])}</span>${PAW}</li>`).join('')}</ol>
  <p class="sc-luffy">Luffy</p><p class="sc-line">One by one, Kuma made them disappear.</p></div>`,
  init(el){return{names:qa('.sc-names li',el),luffy:q('.sc-luffy',el),line:q('.sc-line',el),k:q('.sc-k',el)};},
  at:i=>0.16+i*0.075,
  update(p,e){
   e.k.style.opacity=band(p,0.02,0.92).toFixed(3);
   e.names.forEach((li,i)=>{const t=clamp((p-SCENES.scatter.at(i))/0.05),s=li.firstChild,paw=li.lastChild;
    s.style.opacity=(1-smooth(t)).toFixed(3);s.style.transform=`translate3d(0,${(-t*18).toFixed(1)}px,0) scale(${(1+t*0.25).toFixed(3)})`;
    paw.style.opacity=(Math.sin(clamp(t*1.2)*Math.PI)).toFixed(3);paw.style.transform=`scale(${(0.4+t*0.9).toFixed(3)})`;});
   const L=smooth(clamp((p-0.78)/0.08));e.luffy.style.transform=`scale(${(1+L*0.4).toFixed(3)})`;e.line.style.opacity=L.toFixed(3);
  }},
 twoyears:{h:300,html:()=>`<div class="pin"><p class="ty-k">Marineford · Chapter 597</p><p class="ty-mark"><span class="ty-3d">3D<i></i></span><span class="ty-2y">2Y</span></p>
  <p class="ty-sub">Not three days. Two years.</p><p class="ty-days">Day <b>0</b> of 730</p><p class="ty-end">Two years later…</p></div>`,
  init(el){return{k:q('.ty-k',el),strike:q('.ty-3d i',el),d3:q('.ty-3d',el),y2:q('.ty-2y',el),sub:q('.ty-sub',el),days:q('.ty-days',el),n:q('.ty-days b',el),end:q('.ty-end',el),last:-1};},
  update(p,e){
   e.k.style.opacity=band(p,0.02,0.8).toFixed(3);
   e.d3.style.opacity=(1-0.65*smooth(clamp((p-0.3)/0.08))).toFixed(3);
   e.strike.style.transform=`scaleX(${ease(clamp((p-0.14)/0.12)).toFixed(4)})`;
   const y=smooth(clamp((p-0.28)/0.1));e.y2.style.opacity=y.toFixed(3);e.y2.style.transform=`translate3d(${((1-y)*30).toFixed(1)}px,0,0)`;
   e.sub.style.opacity=band(p,0.34,0.84).toFixed(3);
   e.days.style.opacity=band(p,0.42,0.86).toFixed(3);
   const d=Math.round(730*smooth(clamp((p-0.44)/0.38)));if(d!==e.last){e.last=d;e.n.textContent=d;}
   e.end.style.opacity=smooth(clamp((p-0.86)/0.08)).toFixed(3);
  }},
 drums:{h:340,html:()=>`<div class="pin"><div class="dr-beat"></div><p class="dr-k">Onigashima · Chapter 1044</p>
  <p class="dr-l1">Luffy fell.</p><p class="dr-l2">Then his heart started to beat like a drum.</p><p class="dr-dum">dum · dum · du-dum</p>
  <div class="dr-after"><figure class="dr-panel"><img src="${PM('265bdb2df0cb')}" alt="Gear Fifth" loading="lazy" decoding="async"></figure><div class="dr-copy"><p class="dr-name">Gear Fifth.<em>The Sun God Nika.</em></p><a class="pill dark" href="index.html#scenes">Watch my favourite clip ↗</a></div></div></div>`,
  init(el){return{el,beat:q('.dr-beat',el),k:q('.dr-k',el),l1:q('.dr-l1',el),l2:q('.dr-l2',el),dum:q('.dr-dum',el),after:q('.dr-after',el),white:false};},
  // scroll-driven heartbeats: each one swells and settles
  beats:[0.3,0.345,0.39,0.42,0.46,0.49,0.53,0.555,0.59,0.61,0.64,0.66],
  update(p,e){
   e.k.style.opacity=band(p,0.02,0.66).toFixed(3);
   e.l1.style.opacity=band(p,0.05,0.2).toFixed(3);e.l2.style.opacity=band(p,0.2,0.4).toFixed(3);e.dum.style.opacity=band(p,0.4,0.64).toFixed(3);
   let s=0.06+clamp((p-0.24)/0.4)*0.12;for(const b of SCENES.drums.beats){const d=(p-b)/0.012;if(d>-1&&d<3)s+=0.14*Math.exp(-((d-0.4)**2));}
   const flood=ease(clamp((p-0.68)/0.12));
   e.beat.style.transform=`translate3d(-50%,-50%,0) scale(${(s+flood*14).toFixed(4)})`;
   const w=flood>0.6;if(w!==e.white){e.white=w;e.el.classList.toggle('white',w);}
   const a=smooth(clamp((p-0.78)/0.1));e.after.style.opacity=a.toFixed(3);e.after.style.transform=`translate3d(0,${((1-a)*30).toFixed(1)}px,0)`;
  }}
};
const SCENE_AFTER={'arlong-park':'hat','enies-lobby':'flag','sabaody':'scatter','marineford':'twoyears','wano':'drums'};

/* ---------------------------------------------------------------- assemble */
const host=$('#sagas');
host.innerHTML=sagas.map(sagaHTML).join('');
let n=0;const scenes=[];
sagas.forEach((s,si)=>{const box=$(`#saga-${si+1} .saga-arcs`);s.arcs.forEach(a=>{
 box.insertAdjacentHTML('beforeend',arcHTML(arcs[n],n));n++;
 const sc=SCENE_AFTER[a.id];if(sc){const el=document.createElement('section');el.className=`sx scene ${sc}-scene`;el.dataset.scene=sc;el.style.height=`${SCENES[sc].h}svh`;el.innerHTML=SCENES[sc].html();box.appendChild(el);scenes.push(el);}
});});
$$('[data-latest]').forEach(el=>el.textContent=LATEST);
$('#st-stats').innerHTML=[[sagas.length,'Sagas'],[arcs.length,'Arcs'],[money(LATEST),'Chapters'],[crew.length,'Straw Hats'],['฿3B','Luffy’s bounty']].map(([v,k])=>`<div><dd>${v}</dd><dt>${k}</dt></div>`).join('');
const memories=opMoments.find(m=>m.n==='12');
if(memories)$('#end-memories').innerHTML=`<div class="mine-moment"><small>A moment that lives in my head · ${esc(memories.emotion||'')}</small><b>${esc(memories.title)}</b><div class="mm-text">${textHTML(memories)}</div></div>`;

/* ---------------------------------------------------------------- the whole route */
$('#rt-line').innerHTML=arcs.map((a,i)=>`<button class="rt-seg" style="--c:${HUE[a.saga]};flex-grow:${a.ch[1]-a.ch[0]+1}" data-to="arc-${a.id}" title="${esc(a.name)} · Ch. ${a.ch[0]}–${a.ch[1]}"><span>${esc(a.name)}</span></button>`).join('')+`<span class="rt-now" title="Where I am">Ch. ${LATEST}</span>`;
$('#rt-legend').innerHTML=sagas.map((s,si)=>`<div class="rt-saga" style="--c:${HUE[si]}"><b><i></i>${esc(s.num)} · ${esc(s.title)}</b><span>${s.arcs.map(a=>`<button data-to="arc-${a.id}">${esc(a.name)}</button>`).join('')}</span></div>`).join('');

/* ---------------------------------------------------------------- saga index (rail + dialog) */
$('#st-rail').innerHTML=sagas.map((s,si)=>`<a href="#saga-${si+1}" data-to="saga-${si+1}" style="--c:${HUE[si]}"><span>${esc(s.title)}</span><i>${esc(s.num)}</i></a>`).join('');
$('#sti-list').innerHTML=sagas.map((s,si)=>`<li style="--k:${si}"><button class="lp-isle" data-to="saga-${si+1}" style="--c:${HUE[si]}"><span class="lp-img"><img src="assets/img/t/${esc(s.spread)}.webp" alt="" loading="lazy" decoding="async"></span><span class="lp-txt"><small><span class="lp-n">${esc(s.num)}</span>Ch. ${s.ch[0]}–${s.ch[1]}</small><b>${esc(s.title)}</b></span></button></li>`).join('');
const idx=$('#st-index');
$('#sagas-btn').addEventListener('click',()=>{idx.showModal();document.documentElement.style.overflow='hidden';});
idx.addEventListener('close',()=>{document.documentElement.style.overflow='';});
document.addEventListener('click',e=>{
 if(e.target.closest('#sti-close')||e.target===idx){idx.close();return;}
 const j=e.target.closest('[data-to]');if(j){e.preventDefault();if(idx.open)idx.close();// a saga lands mid-hero (frame open), an arc just above its title
  const t=document.getElementById(j.dataset.to);if(t)jumpTo(absTop(t)+(t.classList.contains('saga')?view.vh*0.5:-60));return;}
 const s=e.target.closest('[data-st-jump]');if(s){e.preventDefault();jumpTo(0);return;}
 const lb=e.target.closest('[data-lb]');if(lb){openPanel(lb.dataset.lb,lb.dataset.cap);}
});

/* ---------------------------------------------------------------- panel viewer */
const lbx=$('#st-lb'),lbImg=$('#st-lb-img');
function openPanel(id,cap){lbImg.removeAttribute('src');lbImg.src=PF(id);$('#st-lb-cap').textContent=cap||'';lbx.showModal();document.documentElement.style.overflow='hidden';}
lbx.addEventListener('close',()=>{document.documentElement.style.overflow='';});
lbx.addEventListener('click',e=>{if(e.target===lbx||e.target.closest('#st-lb-close'))lbx.close();});

/* ---------------------------------------------------------------- motion */
// Prologue: lines arrive one after another over Roger's execution.
{const sec=$('#prologue'),lines=$$('#pr-lines p'),panel=$('#pr-panel'),cue=$('.st-cue');const at=lines.map(l=>+l.dataset.at);
 sec.style.height='340svh';
 part({el:sec,update(s){const p=motion.reduced?0.6:pinned(this,s);
  lines.forEach((l,i)=>{const last=i===lines.length-1,o=last?smooth(clamp((p-at[i])/0.06))*(1-smooth(clamp((p-0.9)/0.08))):band(p,at[i],at[i+1]-0.02);l.style.opacity=o.toFixed(3);l.style.transform=`translate3d(0,${((1-smooth(clamp((p-at[i])/0.08)))*18).toFixed(1)}px,0)`;});
  panel.style.opacity=(0.5*(1-smooth(clamp((p-0.86)/0.1)))).toFixed(3);panel.style.transform=`translate3d(-50%,-50%,0) scale(${(1.12-p*0.12).toFixed(4)})`;
  cue.style.opacity=(1-smooth(clamp(p/0.05))).toFixed(3);
 }});}

// Saga heroes: the spread opens from a framed page to fill the screen, its title rising in.
$$('.saga').forEach(sec=>{const hero=q('.saga-hero',sec),frame=q('.saga-frame',sec),copy=q('.saga-copy',sec);
 part({el:hero,update(s){const p=motion.reduced?1:pinned(this,s),o=ease(clamp(p/0.55)),phone=view.vw<=820;
  const sc=phone?0.86+o*0.14:0.58+o*0.42;frame.style.transform=`scale(${sc.toFixed(4)})`;frame.style.borderRadius=`${((1-o)*28).toFixed(1)}px`;
  const c=smooth(clamp((p-0.3)/0.3));copy.style.opacity=c.toFixed(3);copy.style.transform=`translate3d(0,${((1-c)*40).toFixed(1)}px,0)`;
 }});});

// Scenes.
scenes.forEach(el=>{const S=SCENES[el.dataset.scene],e=S.init(el);part({el,update(s){S.update(motion.reduced?1:pinned(this,s),e);}});});

// Arcs rise in as they arrive.
$$('.arc,.mine>*').forEach(el=>onSight(el,t=>t.classList.add('in'),'0px 0px -8% 0px'));

/* ---------------------------------------------------------------- the log (HUD) */
const hud=$('#hud'),hBounty=$('#hud-bounty'),hCh=$('#hud-ch'),hSaga=$('#hud-saga'),hCrew=$('#hud-crew'),rail=$('#st-rail'),railA=$$('#st-rail a');
hCrew.innerHTML=crew.map(([id,name,c])=>`<li style="--c:${c}" title="${esc(name)}"><span>${esc(name[0])}</span></li>`).join('');
const crewLi=[...hCrew.children];
let marks=[],arcBoxes=[],sagaTops=[],heroes=[],scatterBox=null,gatherY=Infinity,storyTop=0,storyEnd=0;
let shown={bounty:-1,crew:'',ch:-1,saga:-1,on:null,rail:null};
function odometer(to){const from=+hBounty.dataset.v||0;hBounty.dataset.v=to;if(motion.reduced||!from&&!to){hBounty.textContent=to?money(to):'—';return;}
 const t0=performance.now();const run=t=>{const k=ease(clamp((t-t0)/900));hBounty.textContent=money(Math.round(from+(to-from)*k));if(k<1)requestAnimationFrame(run);};requestAnimationFrame(run);
 hud.classList.remove('bump');void hud.offsetWidth;hud.classList.add('bump');}
part({always:true,measure(){
 marks=$$('[data-ev]').map(el=>{const [k,v]=el.dataset.ev.split(':');return{y:absTop(el),k,v};});
 arcBoxes=arcs.map(a=>{const el=document.getElementById('arc-'+a.id);return{top:absTop(el),bot:absTop(el)+el.offsetHeight,a};});
 sagaTops=sagas.map((s,si)=>absTop(document.getElementById('saga-'+(si+1))));
 const sc=$('.scatter-scene');scatterBox=sc?{top:absTop(sc),h:sc.offsetHeight}:null;
 gatherY=absTop(document.getElementById('arc-return-sabaody'));
 heroes=$$('.saga-hero').map(h=>[absTop(h)-view.vh*0.5,absTop(h)+h.offsetHeight-view.vh*0.9]);
 storyTop=sagaTops[0];storyEnd=absTop($('#route'));
},update(s){
 const y=s+view.vh*0.6;
 const inStory=s+view.vh>storyTop+view.vh*0.9&&s+view.vh*0.4<storyEnd,on=inStory&&!heroes.some(([a,b])=>s>a&&s<b);
 if(on!==shown.on){shown.on=on;hud.classList.toggle('on',on);}
 if(inStory!==shown.rail){shown.rail=inStory;rail.classList.toggle('on',inStory);}
 if(!inStory)return;
 // bounty and crew as of the line you are reading
 let bounty=0;const joined=new Set(['luffy']);for(const m of marks){if(m.y>y)break;if(m.k==='bounty')bounty=+m.v;if(m.k==='join')joined.add(m.v);}
 let gone=new Set();
 if(scatterBox&&y>scatterBox.top&&y<gatherY){const p=clamp((s-scatterBox.top)/Math.max(1,scatterBox.h-view.vh));SCATTERED.forEach((id,i)=>{if(s>scatterBox.top+scatterBox.h-view.vh||p>SCENES.scatter.at(i)+0.02)gone.add(id);});}
 const key=crew.map(([id])=>joined.has(id)?(gone.has(id)?2:1):0).join('');
 if(key!==shown.crew){shown.crew=key;crewLi.forEach((li,i)=>{li.className=key[i]==='1'?'on':key[i]==='2'?'gone':'';});}
 if(bounty!==shown.bounty){shown.bounty=bounty;odometer(bounty);}
 // chapter: read off the arc you are in
 let ch=1;for(const b of arcBoxes){if(y<b.top)break;ch=y>=b.bot?b.a.ch[1]:Math.round(b.a.ch[0]+(b.a.ch[1]-b.a.ch[0])*clamp((y-b.top)/Math.max(1,b.bot-b.top)));}
 if(ch!==shown.ch){shown.ch=ch;hCh.textContent=ch;}
 let si=0;sagaTops.forEach((t,i)=>{if(t<=y)si=i;});
 if(si!==shown.saga){shown.saga=si;hSaga.textContent=sagas[si].title;hud.style.setProperty('--c',HUE[si]);railA.forEach((a,i)=>a.classList.toggle('now',i===si));}
}});

// Every block starts loading its pictures two screens before it arrives.
$$('.saga,.sx,.arc,.st-route,.st-end').forEach(el=>onSight(el,warm,'0px 0px 200% 0px'));
measureAll();
// Anything that changes the page's height (fonts, late pictures) re-measures every scene and the log.
new ResizeObserver(remeasure).observe($('main'));
document.body.classList.toggle('reduced',motion.reduced);motion.listeners.push(r=>{document.body.classList.toggle('reduced',r);measureAll();});
requestAnimationFrame(()=>document.body.classList.add('ready'));
if(location.hash){const t=document.getElementById(location.hash.slice(1));if(t)requestAnimationFrame(()=>jumpTo(absTop(t)));}
if(new URLSearchParams(location.search).has('debug'))window.__ga={at(y){scrollTo({top:y,behavior:'instant'});motion.snap=true;measureAll();motion.snap=false;return scrollY;},measureAll};

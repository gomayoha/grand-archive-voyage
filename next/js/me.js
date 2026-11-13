// Me: the poster, the numbers, the save file from his notes, and the few settings there are.
import {$,esc,data,S,ROOT,pool,changed,onChange,title,nextTitle,money} from './store.js';
import {rise,openSheet} from './ui.js';
import {rarity} from './store.js';
import {lockAgain} from './gate.js';

const cleanName=s=>String(s??'').replace(/[\u0000-\u001f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,16).trim();
export function renderMe(root){
 const draw=()=>{
  const P=pool(),got=P.filter(p=>S.cards[p.id]).length,t=title(),nx=nextTitle(),sh=data.shelf||{},done=k=>(sh[k]||[]).filter(a=>['completed','finished','watched'].includes(a.status)).length;
  const save=data.route?.save||[];
  root.innerHTML=`
  <header class="lt"><p class="lt-date">${esc(t[1])}</p><h1 class="lt-title">Me</h1></header>
  <section class="poster" data-rise><img class="po-pic" src="${ROOT}assets/img/ui/icon-o4-512.png" alt=""><div class="po-t"><p class="eyebrow">Wanted</p><button class="po-name" id="po-name" aria-label="Change the name on your poster">${S.name?esc(S.name):'Sign your poster'}</button><p class="po-b">฿${money(S.b)}</p>${nx?`<div class="bar"><i style="--p:${Math.min(1,(S.b-t[0])/(nx[0]-t[0]))}"></i></div><p class="fine">Next: ${esc(nx[1])} at ฿${money(nx[0])}</p>`:''}</div></section>
  <section class="tiles" data-rise>
   <div><b>${S.streak.n}</b><span>day${S.streak.n===1?'':'s'} in a row</span></div><div><b>${S.streak.best||S.streak.n}</b><span>longest run</span></div>
   <div><b>${got.toLocaleString('en-US')}</b><span>of ${P.length.toLocaleString('en-US')} cards</span></div><div><b>${S.opened}</b><span>packs opened</span></div>
   <div><b>${done('anime')}</b><span>anime finished</span></div><div><b>${(sh.manga||[]).length}</b><span>manga on the shelf</span></div>
   <div><b>${(sh.tv||[]).length}</b><span>shows logged</span></div><div><b>${(data.tcg?.cards||[]).length}</b><span>real cards</span></div>
  </section>
  ${save.length?`<section class="row"><div class="row-head" data-rise><h2>Save file. <span>From my notes.</span></h2></div><dl class="savefile" data-rise>${save.map(l=>{const [k,...v]=l.split(':');return `<div><dt>${esc(k)}</dt><dd>${esc(v.join(':').trim())}</dd></div>`;}).join('')}</dl></section>`:''}
  <section class="row"><div class="row-head" data-rise><h2>Settings.</h2></div>
   <div class="set" data-rise><button class="set-row" id="set-theme"><span><b>Theme</b><small id="set-theme-now"></small></span><i aria-hidden="true">›</i></button></div>
   <div class="set" data-rise><label><span><b>Calm motion</b><small>Turns off the big transitions</small></span><input type="checkbox" id="set-calm"${document.documentElement.classList.contains('calm')?' checked':''}></label></div>
   <div class="set" data-rise><button class="set-row" id="set-lock"><span><b>Lock this device</b><small>Ask for the magic words again next time</small></span><i aria-hidden="true">›</i></button></div>
   <div class="links" data-rise><a class="lk press" href="${ROOT}index.html"><b>The classic archive</b><span>Everything as it was</span></a><a class="lk press" href="${ROOT}index.html#life"><b>Book II</b><span>Behind the magic words</span></a><a class="lk press" href="${ROOT}index.html#desk"><b>Captain’s Desk</b><span>Edit ratings and reviews</span></a></div></section>
  <p class="fine end">Grand Archive. Progress is kept in this browser only.</p>`;
  import('./themes.js').then(m=>{const id=m.themeNow(),el=$('#set-theme-now',root);if(el)el.textContent=(S.theme||'auto')==='auto'?(id?`Follows your fruit · ${m.THEMES[id].name}`:'Follows your fruit · none eaten yet'):id?m.THEMES[id].name:'Archive gold';});
  rise(root);
 };
 draw();onChange(draw);
 root.addEventListener('click',e=>{
  if(e.target.closest('#set-theme')){openThemes();return;}
  if(e.target.closest('#set-lock')){if(confirm('Lock the archive on this device? You will need the magic words to open it again.'))lockAgain();return;}
  if(e.target.closest('#po-name')){const n=prompt('The name on your wanted poster (16 letters at most)',S.name||'');if(n!==null){S.name=cleanName(n);changed();}}
 });
 root.addEventListener('change',e=>{if(e.target.id==='set-calm'){S.calm=e.target.checked;document.documentElement.classList.toggle('calm',S.calm);changed();}});
}

// Themes: the archive's accent, the italic of its headings and a light at the edges of the screen.
// Every fruit you own is one; so is each rare kind of card you have found.
async function openThemes(){
 const {THEMES,setTheme}=await import('./themes.js');
 const cardKinds=new Set(pool().filter(p=>S.cards[p.id]).map(p=>rarity(p.id)));
 const own=Object.entries(THEMES).filter(([id,t])=>t.card?cardKinds.has(t.card):S.fruits.includes(id));
 const row=(id,name,sub,a,b)=>`<button class="th press" data-theme-set="${id}" aria-pressed="${(S.theme||'auto')===id}"><i style="background:linear-gradient(135deg,${a},${b})"></i><span><b>${esc(name)}</b><small>${esc(sub)}</small></span></button>`;
 openSheet(`<header class="sh-head"><p class="eyebrow">Settings</p><h2 class="sh-title">Theme</h2><p class="sh-sub">Each fruit you own and each rare kind of card you have found is a theme.</p></header><div class="th-list">
  ${row('auto','Follow my fruit','Whatever you have eaten','#f3c969','#ff7a2f')}${row('none','Archive gold','The original','#f3c969','#b8862b')}
  ${own.map(([id,t])=>row(id,t.name,t.card?'From your cards':'Devil Fruit',t.a,t.b)).join('')}</div>${own.length?'':'<p class="fine" style="padding:16px var(--gut)">Nothing unlocked yet. The first Devil Fruit is in your first pack.</p>'}`,{onOpen(el){
  el.addEventListener('click',e=>{const b=e.target.closest('[data-theme-set]');if(!b)return;setTheme(b.dataset.themeSet);el.querySelectorAll('[data-theme-set]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
 }});
}

// Writer's mode. Violet Evergarden learned what words mean by typing other people's letters; this is the
// archive's typewriter. Flip the switch and the whole film steps back: the site becomes a manuscript on
// paper, every heading, introduction and crew record laid out in page order and editable in place, with a
// captain's diary on the first page. What he types is kept on this device at once; Publish puts it live
// (data/edits.json on GitHub, the same key as the Captain's Desk). His Obsidian notes stay the source:
// an edit only shows while the original it replaced is still what the page says.
// Book II is never offered here: its words exist online only as ciphertext.
import {$,esc,data,motion,mergeEdits} from './core.js';
import {clean,bindTexts} from './texts.js';
import {pending,savePending,pendingCount,hasKey,setKey,pushEdits,openDesk} from './editor.js';

const SKIP='#life,#origin';
const NAMES={home:'The first screen',helm:'The helm',characters:'The Character Log',strawhats:'The Straw Hat Pirates',crew:'The Crew',voyage:'The Voyage',moments:'Moments that live in my head',spreads:'Colour spreads',panels:'Between the panels','story-show':'The Story of One Piece',journey:'The Anime Journey',top:'My top 10',records:'The Shelf',logbook:'The Logbook',worlds:'Other worlds',vault:'The Card Vault',table:'The Card Table',scenes:'Scenes that stay',library:'The Ohara Library',outro:'The last page'};
const TYPEWRITER=`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 4h14v7H9z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 13h24l-2 9H6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M6 22h20v5H6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><g fill="currentColor"><circle cx="10" cy="17" r="1.1"/><circle cx="14" cy="17" r="1.1"/><circle cx="18" cy="17" r="1.1"/><circle cx="22" cy="17" r="1.1"/></g><path d="M12 24.5h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
const today=()=>new Date().toISOString().slice(0,10);
const niceDate=d=>{try{return new Date(d+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});}catch{return d;}};

// what the live site shows = published edits + this device's unpublished ones
function refresh(){data.edits=mergeEdits(data.editsPublished,pending());}

/* ---------------- the captain's diary, on the live page (in the Logbook) ---------------- */
export function diaryEntries(){
 return Object.entries(data.edits?.diary||{}).filter(([,e])=>e&&!e.deleted&&(e.title||e.html)).map(([id,e])=>({id,...e})).sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.at||'').localeCompare(a.at||''));
}
export function renderDiary(){
 const box=$('#diary');if(!box)return;
 const list=diaryEntries();box.hidden=!list.length;if(!list.length){box.innerHTML='';return;}
 box.innerHTML=`<p class="log-k">From the captain's diary</p>${list.map(e=>`<article class="dy"><p class="dy-date">${esc(niceDate(e.date))}</p>${e.title?`<h3>${clean(e.title)}</h3>`:''}<div class="dy-body">${clean(e.html||'')}</div></article>`).join('')}`;
}

/* ---------------- the manuscript ---------------- */
let wm=null,on=false,btn=null;
function blocksOf(sec){
 const out=[],seen=new Set();
 sec.querySelectorAll('[data-w]').forEach(el=>{
  const key=el.dataset.w;if(seen.has(key)||el.closest(SKIP))return;seen.add(key);
  if(el.dataset.wBase===undefined)el.dataset.wBase=el.innerHTML.trim();
  const g=el.closest('[data-wg]')?.dataset.wg||'';
  const kind=el.dataset.wl||(/^H[1-3]$/.test(el.tagName)?'Title':el.matches('.eyebrow,.ink-kicker,.chart-k,.role-no')?'Kicker':'Words');
  out.push({key,group:g,label:el.dataset.wl||kind,kind,base:el.dataset.wBase,draft:el.hasAttribute('data-wdraft')});
 });
 return out;
}
function current(key,base){const e=data.edits?.texts?.[key];if(e&&e.html!=null&&(e.base==null||clean(e.base)===clean(base)))return clean(e.html);return base;}
function block(b){
 const cls=b.kind==='Title'?' t':b.kind==='Kicker'?' k':'';
 return `<div class="wm-block${cls}" data-key="${esc(b.key)}"><span class="wm-label">${esc(b.label)}${b.draft&&current(b.key,b.base)===b.base?'<i class="wm-draft" title="Written by Claude as a starting point. Make it yours.">draft</i>':''}</span><div class="wm-text" contenteditable="true" spellcheck="true" data-key="${esc(b.key)}" data-placeholder="${b.base?'':'Write it in your own words…'}">${current(b.key,b.base)}</div><button class="wm-undo" data-undo="${esc(b.key)}" title="Back to the original"${current(b.key,b.base)===b.base?' hidden':''}>Undo</button></div>`;
}
function build(){
 const secs=[...document.querySelectorAll('main>section')].filter(s=>!s.matches(SKIP)&&!s.hidden);
 const chapters=secs.map(s=>({id:s.id,name:NAMES[s.id]||s.getAttribute('aria-label')||s.id,blocks:blocksOf(s)})).filter(c=>c.blocks.length);
 const words=(document.querySelector('main').textContent.match(/[A-Za-z0-9’']+/g)||[]).length;
 const paper=wm.querySelector('#wm-paper');
 paper.innerHTML=`<header class="wm-mast"><p class="wm-mast-k">Manuscript edition · ${esc(niceDate(today()))}</p><h1 class="wm-type" data-type="The Grand Archive">The Grand Archive</h1><p class="wm-mast-sub">${words.toLocaleString('en-US')} words on the site · ${chapters.length} chapters · written by Goma</p></header>
  <p class="wm-how">Click any line and write. It's kept on this device the moment you type; <b>Publish</b> puts it on the live site. Your Obsidian notes stay the source: if a note changes, the note wins. Lines marked <i class="wm-draft">draft</i> were written by Claude to get you started. Make them yours.</p>
  <section class="wm-ch" id="wm-diary"><p class="wm-ch-n">The first page</p><h2>The captain's <em>diary.</em></h2><p class="wm-note">Dated pages that appear in the Logbook. Write about an episode, a chapter, a day.</p><button class="wm-new" id="wm-new">+ Today's page</button><div id="wm-entries"></div></section>
  ${chapters.map((c,i)=>{let g=null;return `<section class="wm-ch" id="wm-${esc(c.id)}"><p class="wm-ch-n">Chapter ${i+1}</p><h2>${esc(c.name)}</h2>${c.blocks.map(b=>{const head=b.group&&b.group!==g?`<h3 class="wm-g">${esc(b.group)}</h3>`:'';g=b.group;return head+block(b);}).join('')}</section>`;}).join('')}
  <p class="wm-end">— the end of the manuscript, for now —</p>`;
 wm.querySelector('#wm-toc').innerHTML=`<p class="wm-toc-k">Contents</p><a href="#wm-diary">The captain's diary</a>${chapters.map(c=>`<a href="#wm-${esc(c.id)}">${esc(c.name)}</a>`).join('')}`;
 renderEntries();status();
}
function renderEntries(){
 const box=wm.querySelector('#wm-entries'),list=Object.entries(data.edits?.diary||{}).filter(([,e])=>e&&!e.deleted).map(([id,e])=>({id,...e})).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
 box.innerHTML=list.length?list.map(e=>`<article class="wm-entry" data-entry="${esc(e.id)}"><div class="wm-entry-top"><input type="date" value="${esc(e.date||today())}" data-entry-date="${esc(e.id)}" aria-label="Date"><button class="wm-undo" data-entry-del="${esc(e.id)}">Tear out this page</button></div><div class="wm-text wm-entry-title" contenteditable="true" data-entry-title="${esc(e.id)}" data-placeholder="A title">${clean(e.title||'')}</div><div class="wm-text wm-entry-body" contenteditable="true" data-entry-body="${esc(e.id)}" data-placeholder="Dear diary…">${clean(e.html||'')}</div></article>`).join(''):'<p class="wm-note wm-empty">No pages yet.</p>';
}
function status(){
 const n=pendingCount(),el=wm.querySelector('#wm-status'),pub=wm.querySelector('#wm-publish');
 el.textContent=n?`${n} change${n===1?'':'s'} kept on this device · not published yet`:'Everything is published';
 pub.disabled=!n;pub.textContent=hasKey()?'Publish':'Connect GitHub to publish';if(!hasKey())pub.disabled=false;
}

/* ---------------- saving ---------------- */
function saveText(key,html){
 const el=document.querySelector(`[data-w="${CSS.escape(key)}"]`),base=el?el.dataset.wBase??'':'';
 const P=pending(),v=clean(html),pub=data.editsPublished?.texts?.[key];
 if(v===clean(base)){if(pub&&pub.html!=null)P.texts[key]={html:null,base,at:new Date().toISOString()};else delete P.texts[key];}
 else P.texts[key]={html:v,base,at:new Date().toISOString()};
 savePending(P);refresh();status();
 const blk=wm.querySelector(`.wm-block[data-key="${CSS.escape(key)}"]`);if(blk){blk.querySelector('.wm-undo').hidden=v===clean(base);blk.querySelector('.wm-draft')?.remove();}
}
function saveEntry(id,patch){
 const P=pending(),old={...(data.edits?.diary?.[id]||{})};
 P.diary[id]={...old,...patch,at:new Date().toISOString()};
 if(patch.deleted&&!data.editsPublished?.diary?.[id])delete P.diary[id];
 savePending(P);refresh();status();
}
// each field saves on its own short timer, so typing in one never cancels another
const timers=new Map();const later=(id,fn)=>{clearTimeout(timers.get(id));timers.set(id,setTimeout(()=>{timers.delete(id);fn();},350));};

/* ---------------- on / off ---------------- */
function open(){
 if(on)return;on=true;btn.setAttribute('aria-pressed','true');
 build();wm.hidden=false;document.documentElement.classList.add('wm-on');document.documentElement.style.overflow='hidden';
 wm.scrollTop=0;
 if(!motion.reduced){wm.classList.remove('in');void wm.offsetWidth;wm.classList.add('in');typeTitle();}else wm.classList.add('in');
}
function close(){
 if(!on)return;
 wm.querySelectorAll('.wm-text').forEach(t=>{if(t.dataset.key&&timers.has(t.dataset.key)){clearTimeout(timers.get(t.dataset.key));timers.delete(t.dataset.key);saveText(t.dataset.key,t.innerHTML);}});
 for(const [id,tm] of [...timers]){clearTimeout(tm);timers.delete(id);const k=id[0],e=id.slice(1),el=wm.querySelector(k==='t'?`[data-entry-title="${e}"]`:`[data-entry-body="${e}"]`);if(el)saveEntry(e,k==='t'?{title:clean(el.innerHTML)}:{html:clean(el.innerHTML)});}
 on=false;btn.setAttribute('aria-pressed','false');
 wm.classList.remove('in');document.documentElement.classList.remove('wm-on');document.documentElement.style.overflow='';
 setTimeout(()=>{if(!on)wm.hidden=true;},motion.reduced?0:450);
 // the film takes the new words
 bindTexts(document);renderDiary();document.dispatchEvent(new CustomEvent('ga:texts'));
}
// the masthead types itself, one key at a time
function typeTitle(){
 const h=wm.querySelector('.wm-type');if(!h)return;const full=h.dataset.type;h.textContent='';h.classList.add('typing');
 let i=0;const step=()=>{if(!on)return;h.textContent=full.slice(0,++i);if(i<full.length)setTimeout(step,48+Math.random()*60);else setTimeout(()=>h.classList.remove('typing'),900);};setTimeout(step,420);
}

export function initWriter(){
 btn=$('#write');if(!btn)return;
 data.editsPublished=data.editsPublished||{records:{},texts:{},diary:{}};
 wm=document.createElement('div');wm.className='wm';wm.id='wm';wm.hidden=true;wm.setAttribute('role','dialog');wm.setAttribute('aria-modal','true');wm.setAttribute('aria-label',"Writer's mode");
 wm.innerHTML=`<header class="wm-bar"><span class="wm-brand">${TYPEWRITER}<b>Writer's mode</b></span><span class="wm-status" id="wm-status" aria-live="polite"></span>
  <div class="wm-actions"><button class="wm-btn" id="wm-desk">Ratings &amp; reviews</button><button class="pill small" id="wm-publish">Publish</button><button class="wm-btn" id="wm-close">Back to the archive ✕</button></div></header>
  <div class="wm-key" id="wm-key" hidden><p>Publishing needs a GitHub key, kept only in this browser. Create a <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">fine-grained token</a>: Repository access → only <b>grand-archive-voyage</b>; Permissions → <b>Contents: Read and write</b>. Paste it here.</p><input type="password" id="wm-token" placeholder="github_pat_…" autocomplete="off"><button class="pill small" id="wm-savekey">Save key</button></div>
  <div class="wm-body"><nav class="wm-toc" id="wm-toc" aria-label="Contents"></nav><article class="wm-paper" id="wm-paper"></article></div>`;
 document.body.append(wm);
 btn.addEventListener('click',()=>on?close():open());
 $('#lp-write')?.addEventListener('click',()=>{$('#logpose').close();open();});
 addEventListener('keydown',e=>{if(on&&e.key==='Escape'){e.preventDefault();close();}});
 wm.addEventListener('click',async e=>{
  const t=e.target;
  if(t.closest('#wm-close')){close();return;}
  if(t.closest('#wm-desk')){close();openDesk();return;}
  if(t.closest('#wm-savekey')){const v=wm.querySelector('#wm-token').value.trim();if(v){setKey(v);wm.querySelector('#wm-key').hidden=true;status();}return;}
  if(t.closest('#wm-publish')){
   if(!hasKey()){wm.querySelector('#wm-key').hidden=false;wm.querySelector('#wm-token').focus();return;}
   const el=wm.querySelector('#wm-status');el.textContent='Publishing…';
   try{const said=await pushEdits();data.editsPublished=data.edits;refresh();status();el.textContent=said;}catch(err){el.textContent=String(err.message||err);}
   return;
  }
  if(t.closest('#wm-new')){const id=Date.now().toString(36);saveEntry(id,{date:today(),title:'',html:''});renderEntries();wm.querySelector(`[data-entry-title="${id}"]`)?.focus();return;}
  const del=t.closest('[data-entry-del]');if(del){saveEntry(del.dataset.entryDel,{deleted:true});renderEntries();return;}
  const u=t.closest('[data-undo]');if(u){const key=u.dataset.undo,el=document.querySelector(`[data-w="${CSS.escape(key)}"]`),base=el?el.dataset.wBase??'':'';saveText(key,base);const tx=wm.querySelector(`.wm-text[data-key="${CSS.escape(key)}"]`);if(tx)tx.innerHTML=base;return;}
  const a=t.closest('.wm-toc a');if(a){e.preventDefault();wm.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:motion.reduced?'auto':'smooth',block:'start'});}
 });
 wm.addEventListener('input',e=>{
  const t=e.target.closest('.wm-text');if(!t)return;
  if(t.dataset.key){const key=t.dataset.key;later(key,()=>saveText(key,t.innerHTML));}
  else if(t.dataset.entryTitle){const id=t.dataset.entryTitle;later('t'+id,()=>saveEntry(id,{title:clean(t.innerHTML)}));}
  else if(t.dataset.entryBody){const id=t.dataset.entryBody;later('b'+id,()=>saveEntry(id,{html:clean(t.innerHTML)}));}
 });
 wm.addEventListener('change',e=>{const d=e.target.closest('[data-entry-date]');if(d)saveEntry(d.dataset.entryDate,{date:d.value||today()});});
 // paste as plain text, so nothing from another page's styling sneaks in
 wm.addEventListener('paste',e=>{if(!e.target.closest('.wm-text'))return;e.preventDefault();const s=(e.clipboardData||window.clipboardData).getData('text/plain');document.execCommand('insertText',false,s);});
 // headings stay one line: Enter adds a line break only in diary pages and longer words
 wm.addEventListener('keydown',e=>{const t=e.target.closest('.wm-text');if(!t||e.key!=='Enter')return;const blk=t.closest('.wm-block');if(blk&&(blk.classList.contains('k'))){e.preventDefault();t.blur();}});
 renderDiary();
 if(location.hash==='#write')open();
}

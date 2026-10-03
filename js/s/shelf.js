// The Shelf (every anime, manga and live-action record, rated in his own words) and the Logbook
// (what changed each time his notes were synced). Data comes from his Obsidian trackers via tools/sync.py.
import {$,$$,esc,data,onSight,motion,clamp,ease,jumpTo,absTop} from '../core.js';
import {openDialog} from '../dialogs.js';

export function initShelf(){
const POSTERS=data.posters,SH=data.shelf,LOG=data.logbook;
const normT=t=>String(t).toLowerCase().replace(/×/g,'x').replace(/[^a-z0-9]/g,'');
const cap=s=>s?s[0].toUpperCase()+s.slice(1):'';
const ANIME_TAG={completed:'Completed',watching:'Watching',paused:'On pause',want:'Want to watch'},MANGA_TAG={reading:'Reading',finished:'Finished',next:'Up next',dropped:'Dropped'};
const SHELF={
 anime:{items:SH.anime.map(a=>({...a,tag:[ANIME_TAG[a.status],a.status==='watching'&&a.progress,a.pick&&"Claude's pick"].filter(Boolean).join(' · ')})),filters:[['all','All'],['rated','Rated'],['watching','Watching'],['want','Want to watch'],['canon','Top 10']],main:a=>a.status!=='want'},
 manga:{items:SH.manga.map(a=>({...a,s:a.status==='reading'?a.chapter:null,tag:[MANGA_TAG[a.status],a.genre].filter(Boolean).join(' · ')})),filters:[['all','All'],['reading','Reading'],['finished','Finished'],['next','Up next'],['dropped','Dropped']],main:a=>a.status==='reading'||a.status==='finished'},
 tv:{items:SH.tv.map(a=>({...a,tag:a.genre||'Live action'})),filters:[['all','All'],['rated','Rated']],main:()=>true}
};
const posterOf=it=>POSTERS&&POSTERS[`${it.k}:${it.t}`];
let tab='anime',filter='all';
const scoreNum=s=>{const n=parseFloat(s);return /^\d/.test(String(s))&&!isNaN(n)?n:null;};
function shelfList(){
 const q=$('#search').value.toLowerCase().trim(),T=SHELF[tab];let list=T.items;
 if(tab==='anime'&&filter==='canon')list=SH.top10.map((a,i)=>{const it=T.items.find(x=>normT(x.t)===normT(a.title))||T.items.find(x=>normT(a.title).includes(normT(x.t)))||{t:a.title,k:'anime'};return{...it,rank:i+1,why:a.body};});
 else if(filter==='all')list=list.filter(T.main);
 else if(filter==='rated')list=list.filter(x=>scoreNum(x.s)!==null);
 else list=list.filter(x=>x.status===filter);
 list=list.filter(a=>a.t.toLowerCase().includes(q));
 if(filter!=='canon')list=[...list].sort($('#sort').value==='title'?(a,b)=>a.t.localeCompare(b.t):(a,b)=>(scoreNum(b.s)??-1)-(scoreNum(a.s)??-1));
 return list;
}
let shown=[];
function renderShelf(){
 shown=shelfList();
 $('#record-count').textContent=`${shown.length} record${shown.length===1?'':'s'}`;
 $('#record-grid').innerHTML=shown.length?shown.map((a,i)=>{const p=posterOf(a),n=scoreNum(a.s);
  const big=a.rank?'#'+a.rank:n!==null?String(a.s).replace('*',''):a.status==='watching'&&a.progress?a.progress:a.s||({want:'Soon',next:'Next',dropped:'Dropped',finished:'Read',paused:'Paused'}[a.status]||'—');
  return `<button class="pc${a.status==='want'||a.status==='next'?' is-want':''}" style="--i:${Math.min(i,30)};${p&&p.color?`--c:${p.color}`:''}" data-rec="${i}">
   <figure>${p?`<img src="${esc(p.img)}" alt="" loading="lazy" decoding="async">`:`<span class="pc-ph">${esc(a.t)}</span>`}<span class="pc-score${n===null&&!a.rank?' small':''}">${esc(big)}${String(a.s).includes('*')?'<sup>*</sup>':''}${n!==null&&!a.rank?'<small>/10</small>':''}</span></figure>
   <span class="pc-meta"><strong>${esc(a.t)}</strong><small>${esc(a.rank?'Personal top ten':a.tag||'')}</small></span>
  </button>`;}).join(''):'<p class="count">No records match that search.</p>';
}
function setTab(t){tab=t;filter='all';$$('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===t)));
 $('#chips').innerHTML=SHELF[t].filters.map(([k,l])=>`<button data-filter="${k}" aria-pressed="${k==='all'}">${l}</button>`).join('');renderShelf();}
$('#search').addEventListener('input',renderShelf);$('#sort').addEventListener('change',renderShelf);
$('#chips').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;$$('#chips [data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderShelf();});
$$('[data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
['anime','manga','tv'].forEach(k=>$('#n-'+k).textContent=SHELF[k].items.filter(SHELF[k].main).length);
$('#rewatches').innerHTML=SH.rewatches.map(r=>`<article><h3>${esc(r.title)} · ${esc(r.count)}</h3><p>${esc(r.body)}</p></article>`).join('');
setTab('anime');
function openRecord(i){const a=shown[i];if(!a)return;const p=posterOf(a),n=scoreNum(a.s);
 const kind={anime:'Anime',manga:'Manga',tv:'Live action'}[a.k]||'Record';
 const extra=(a.extra||[]).map(t=>`<span>${esc(t)}</span>`).join('');
 openDialog(`<div class="rec-layout rec-poster">${p?`<img src="${esc(p.img)}" alt="${esc(a.t)} cover" style="aspect-ratio:auto">`:''}<div><p class="eyebrow">${kind} · ${esc(a.rank?'Personal top ten #'+a.rank:a.tag||'Personal record')}</p><h2 id="dialog-title">${esc(a.t)}</h2>${a.s?`<p class="big-score">${esc(a.s)}${n!==null?' <small>/ 10</small>':''}</p>`:''}${a.tagline?`<p class="rec-tagline">“${esc(a.tagline)}”</p>`:''}${a.why?`<p><strong>${esc(a.why)}</strong></p>`:''}${a.b?`<p>${esc(a.b)}</p>`:''}${a.ratingNote?`<p class="subtle">${esc(a.ratingNote)}</p>`:''}${extra?`<div class="tags">${extra}</div>`:''}<p class="subtle">From my notes${SH.updated?', last synced '+new Date(SH.updated).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):''}.${p?' Cover art: AniList / TVmaze.':''}</p></div></div>`);}

/* ------------------------------------------------------------------ the logbook */
const fmtDate=d=>new Date(d+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
const posterFor=(k,t)=>posterOf({k,t});
const thumb=(k,t)=>{const p=posterFor(k,t);return p?`<img src="${esc(p.img)}" alt="" loading="lazy" decoding="async">`:`<span class="lt-ph"></span>`;};
const KIND={anime:'anime',manga:'manga',tv:'show'};
function logEntry(e){
 if(e.baseline)return `<li class="log-entry base"><time>${fmtDate(e.date)}</time><div><h3>${esc(e.label)}</h3><p>${e.counts.anime} anime · ${e.counts.manga} manga · ${e.counts.tv} shows. Where the record starts.</p></div></li>`;
 const g=t=>e.events.filter(x=>x.type===t);const parts=[];
 const rated=[...g('rerated'),...g('rated')];
 if(rated.length)parts.push(`<div class="lg"><h4>Ratings</h4>${rated.map(x=>{const up=parseFloat(x.to)>parseFloat(x.frm);return `<div class="lr">${thumb(x.kind,x.t)}<span><b>${esc(x.t)}</b><small>${x.frm?`${esc(x.frm)} → `:'First rating: '}<em class="${x.frm?(up?'up':'down'):''}">${esc(x.to)}</em></small></span></div>`;}).join('')}</div>`);
 if(g('finished').length)parts.push(`<div class="lg"><h4>Finished</h4>${g('finished').map(x=>`<div class="lr">${thumb(x.kind,x.t)}<span><b>${esc(x.t)}</b><small>${cap(KIND[x.kind])}${x.to?' · '+esc(x.to)+'/10':''}</small></span></div>`).join('')}</div>`);
 if(g('started').length)parts.push(`<div class="lg"><h4>Started</h4>${g('started').map(x=>`<div class="lr">${thumb(x.kind,x.t)}<span><b>${esc(x.t)}</b><small>${cap(KIND[x.kind])}${x.to?' · '+esc(x.to):''}</small></span></div>`).join('')}</div>`);
 if(g('progress').length)parts.push(`<div class="lg"><h4>Kept going</h4>${g('progress').map(x=>`<div class="lr">${thumb(x.kind,x.t)}<span><b>${esc(x.t)}</b><small>${esc(x.frm||'—')} → <em class="up">${esc(x.to)}</em></small></span></div>`).join('')}</div>`);
 [['want','Added to the watch list'],['queued','Added to the reading queue']].forEach(([t,l])=>{if(g(t).length)parts.push(`<div class="lg"><h4>${l} · ${g(t).length}</h4><div class="lstrip">${g(t).map(x=>`<span title="${esc(x.t)}">${thumb(x.kind,x.t)}<small>${esc(x.t)}</small></span>`).join('')}</div></div>`);});
 if(g('dropped').length)parts.push(`<div class="lg"><h4>Dropped</h4>${g('dropped').map(x=>`<div class="lr">${thumb(x.kind,x.t)}<span><b>${esc(x.t)}</b><small>${cap(KIND[x.kind])}</small></span></div>`).join('')}</div>`);
 if(g('top10').length){const x=g('top10')[0];parts.push(`<div class="lg"><h4>Top 10 reshuffled</h4><ol class="ltop">${x.to.map((t,i)=>{const was=x.frm.findIndex(y=>normT(y)===normT(t));return `<li><b>${esc(t)}</b>${was<0?'<em class="up">new</em>':was!==i?`<em class="${was>i?'up':'down'}">${was>i?'▲':'▼'}${Math.abs(was-i)}</em>`:''}</li>`;}).join('')}</ol></div>`);}
 if(g('removed').length)parts.push(`<div class="lg"><h4>No longer in my notes</h4><p class="subtle">${g('removed').map(x=>esc(x.t)).join(', ')}</p></div>`);
 return `<li class="log-entry"><time>${fmtDate(e.date)}</time><div><h3>${e.events.length} change${e.events.length===1?'':'s'}${e.since?` since ${fmtDate(e.since)}`:''}</h3>${parts.join('')}</div></li>`;
}
if(LOG&&LOG.entries.length){
 $('#log').innerHTML=LOG.entries.map(logEntry).join('');
 const done=SH.anime.filter(a=>a.status==='completed'),rated=SH.anime.filter(a=>scoreNum(a.s)!==null&&a.status!=='want');
 const avg=rated.reduce((s,a)=>s+scoreNum(a.s),0)/(rated.length||1);
 const stats=[[done.length,'anime completed'],[SH.anime.filter(a=>a.status==='watching').length,'watching now'],[SH.manga.filter(a=>a.status==='finished').length,'manga finished'],[SH.manga.filter(a=>a.status==='reading').length,'manga in progress'],[SH.tv.length,'shows'],[avg.toFixed(1),'average anime rating']];
 $('#log-stats').innerHTML=stats.map(([n,l])=>`<div><b>${n}</b><span>${l}</span></div>`).join('');
}else $('#logbook').hidden=true;


// Big numbers count up the first time they come into view.
$$('#log-stats b').forEach(b=>{const end=parseFloat(b.textContent),dec=String(b.textContent).includes('.')?1:0;if(isNaN(end)||motion.reduced)return;b.textContent=(0).toFixed(dec);onSight(b,()=>{const t0=performance.now();const run=t=>{const k=ease(clamp((t-t0)/1400));b.textContent=(end*k).toFixed(dec);if(k<1)requestAnimationFrame(run);};requestAnimationFrame(run);});});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.rec!==undefined)openRecord(+b.dataset.rec);
 if(b.dataset.shelf){setTab(b.dataset.shelf);jumpTo(absTop($('#records'))-20);}
});
}

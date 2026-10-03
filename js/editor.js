// The Captain's Desk: Goma's private edit mode. Change ratings, reviews, status and progress (or add a
// new anime / manga / show) right on the site. Saving writes data/edits.json to the GitHub repo with a
// personal access token that lives only in this browser; GitHub Pages republishes in about a minute.
// Edits sit on top of the Obsidian notes until the note itself changes, so the notes stay the source of
// truth and nothing he writes there is ever overwritten.
import {esc,data,FIELDS,mergeEdits,applyEdits} from './core.js';
import {openDialog,closeDialog,dialogBody} from './dialogs.js';

const REPO='gomayoha/grand-archive-voyage',PATH='data/edits.json',BRANCH='main';
const TOKEN='grand-archive:gh-token',PENDING='grand-archive:pending-edits';
const KINDS={anime:{label:'Anime',status:[['completed','Completed'],['watching','Watching'],['paused','On pause'],['want','Want to watch']],fields:['status','s','progress','tagline','b']},
 manga:{label:'Manga',status:[['reading','Reading'],['finished','Finished'],['next','Up next'],['dropped','Dropped']],fields:['status','chapter','s','genre','b']},
 tv:{label:'Live action',status:[['watched','Watched'],['watching','Watching']],fields:['status','s','genre','tagline','b']}};
const LABEL={status:'Status',s:'Rating (out of 10)',progress:'Where I am (e.g. Ep 61)',chapter:'Chapter (e.g. Ch. 214)',tagline:'One-line verdict',b:'My review',genre:'Genre'};
const ls={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v);}catch{}}};
const b64=s=>btoa(unescape(encodeURIComponent(s))),unb64=s=>decodeURIComponent(escape(atob(s.replace(/\n/g,''))));
let kind='anime',query='',sel=null,dirty=false;

function pending(){try{return JSON.parse(ls.get(PENDING)||'null')||{records:{}};}catch{return{records:{}};}}
const recs=k=>data.shelf[k]||[];

export function openDesk(){
 openDialog(`<div class="desk">
  <header class="desk-head"><p class="eyebrow">Captain's Desk · private</p><h2 id="dialog-title">Edit the <em>archive.</em></h2>
   <p class="subtle">Changes show here right away and go live after you press Publish. Your Obsidian notes stay the source of truth: when you change a note, the note wins.</p></header>
  <div class="desk-bar"><div class="desk-tabs">${Object.entries(KINDS).map(([k,v])=>`<button data-desk-kind="${k}" aria-pressed="${k===kind}">${v.label}</button>`).join('')}</div>
   <input type="search" id="desk-q" placeholder="Find a title…" value="${esc(query)}"><button class="pill small" data-desk-new>+ Add new</button></div>
  <div class="desk-body"><ul class="desk-list" id="desk-list"></ul><div class="desk-form" id="desk-form"><p class="subtle">Pick a title on the left, or add a new one.</p></div></div>
  <footer class="desk-foot" id="desk-foot"></footer>
 </div>`,'is-desk');
 renderList();renderFoot();
 // The rest of the page was drawn from the old data; redraw it once the desk is closed.
 document.getElementById('dialog').addEventListener('close',()=>{if(dirty)location.reload();},{once:true});
 dialogBody.querySelector('#desk-q').addEventListener('input',e=>{query=e.target.value;renderList();});
}
function renderList(){
 const q=query.toLowerCase().trim(),p=pending().records;
 const list=recs(kind).filter(r=>r.t.toLowerCase().includes(q));
 dialogBody.querySelector('#desk-list').innerHTML=list.map(r=>{const key=`${kind}:${r.t}`;return `<li><button data-desk-pick="${esc(r.t)}" aria-current="${sel===key}"><b>${esc(r.t)}</b><small>${esc([r.status,r.s&&r.s+'/10',r.progress||r.chapter].filter(Boolean).join(' · '))}${p[key]?' · <i>unsaved</i>':r.edited?' · <i>edited</i>':''}</small></button></li>`;}).join('')||'<li class="subtle">Nothing matches.</li>';
}
function renderForm(t,isNew=false){
 const K=KINDS[kind],r=isNew?{t:'',status:K.status[0][0]}:recs(kind).find(x=>x.t===t);if(!r)return;
 sel=isNew?null:`${kind}:${r.t}`;renderList();
 const field=f=>f==='status'?`<label>${LABEL[f]}<select name="status">${K.status.map(([v,l])=>`<option value="${v}"${r.status===v?' selected':''}>${l}</option>`).join('')}</select></label>`
  :f==='b'?`<label class="wide">${LABEL[f]}<textarea name="b" rows="7">${esc(r.b||'')}</textarea></label>`
  :f==='s'?`<label>${LABEL[f]}<input name="s" inputmode="decimal" value="${esc(r.s??'')}" placeholder="e.g. 9.5"></label>`
  :`<label${f==='tagline'?' class="wide"':''}>${LABEL[f]}<input name="${f}" value="${esc(r[f]??'')}"></label>`;
 dialogBody.querySelector('#desk-form').innerHTML=`<form id="desk-edit">${isNew?`<label class="wide">Title<input name="t" required placeholder="Exact title"></label>`:`<h3>${esc(r.t)}</h3>`}
  <div class="desk-grid">${K.fields.map(field).join('')}</div>
  <div class="desk-actions"><button class="pill small" type="submit">Keep this change</button>${!isNew&&pending().records[`${kind}:${r.t}`]?'<button type="button" class="link" data-desk-undo>Undo unsaved change</button>':''}</div></form>`;
 dialogBody.querySelector('#desk-edit').addEventListener('submit',e=>{e.preventDefault();keep(new FormData(e.target),r,isNew);});
}
function keep(fd,r,isNew){
 const t=isNew?String(fd.get('t')||'').trim():r.t;if(!t)return;
 const key=`${kind}:${t}`,P=pending(),set={},base={};
 for(const f of KINDS[kind].fields){const v=String(fd.get(f)??'').trim();if(isNew||String(r[f]??'')!==v){set[f]=v||null;base[f]=isNew?null:(r[f]??null);}}
 if(!Object.keys(set).length)return;
 const prev=P.records[key];P.records[key]={new:isNew||(prev&&prev.new)||undefined,set:{...(prev&&prev.set),...set},base:{...base,...(prev&&prev.base)},at:new Date().toISOString()};
  dirty=true;
 ls.set(PENDING,JSON.stringify(P));
 applyEdits(data.shelf,{records:{[key]:P.records[key]}});
 renderList();renderForm(t);renderFoot();
}
function renderFoot(){
 const n=Object.keys(pending().records).length,tok=ls.get(TOKEN);
 dialogBody.querySelector('#desk-foot').innerHTML=`<span>${n?`${n} unsaved change${n===1?'':'s'} on this device.`:'Everything is published.'}</span>
  ${tok?`<button class="pill small" data-desk-publish${n?'':' disabled'}>Publish to the site</button><button class="link" data-desk-forget>Forget GitHub key</button>`
   :`<details class="desk-key"><summary>Connect GitHub to publish</summary><p class="subtle">Create a <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">fine-grained token</a>: Repository access → only <b>grand-archive-voyage</b>; Permissions → <b>Contents: Read and write</b>. Paste it here. It stays in this browser only.</p><input type="password" id="desk-token" placeholder="github_pat_…" autocomplete="off"><button class="pill small" data-desk-savekey>Save key</button></details>`}
  <span class="desk-msg" id="desk-msg" aria-live="polite"></span>`;
}
async function publish(){
 const tok=ls.get(TOKEN),msg=dialogBody.querySelector('#desk-msg'),P=pending();if(!tok)return;
 msg.textContent='Publishing…';
 const api=`https://api.github.com/repos/${REPO}/contents/${PATH}`,H={Authorization:`Bearer ${tok}`,Accept:'application/vnd.github+json'};
 try{
  const cur=await fetch(`${api}?ref=${BRANCH}&t=${Date.now()}`,{headers:H});
  let sha,old={records:{}};if(cur.ok){const j=await cur.json();sha=j.sha;old=JSON.parse(unb64(j.content));}else if(cur.status!==404)throw new Error(`GitHub said ${cur.status}`);
  const next=mergeEdits(old,P);next.updated=new Date().toISOString();
  const put=await fetch(api,{method:'PUT',headers:H,body:JSON.stringify({message:`Captain's Desk: ${Object.keys(P.records).join(', ')}`.slice(0,200),content:b64(JSON.stringify(next,null,1)),branch:BRANCH,...(sha?{sha}:{})})});
  if(!put.ok)throw new Error(put.status===401||put.status===403?'GitHub refused the key. Check it has Contents: Read and write on this repo.':`GitHub said ${put.status}`);
  ls.set(PENDING,null);data.edits=next;renderList();renderFoot();
  dialogBody.querySelector('#desk-msg').textContent='Published. The live site updates in about a minute.';
 }catch(e){msg.textContent=String(e.message||e);}
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-desk],[data-desk-kind],[data-desk-pick],[data-desk-new],[data-desk-undo],[data-desk-publish],[data-desk-savekey],[data-desk-forget]');if(!b)return;
 if(b.matches('[data-desk]')){e.preventDefault();openDesk();return;}
 if(b.dataset.deskKind){kind=b.dataset.deskKind;sel=null;dialogBody.querySelectorAll('[data-desk-kind]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderList();dialogBody.querySelector('#desk-form').innerHTML='<p class="subtle">Pick a title on the left, or add a new one.</p>';}
 if(b.dataset.deskPick!==undefined)renderForm(b.dataset.deskPick);
 if(b.matches('[data-desk-new]'))renderForm(null,true);
 if(b.matches('[data-desk-undo]')){const P=pending();delete P.records[sel];ls.set(PENDING,JSON.stringify(P));location.reload();}
 if(b.matches('[data-desk-savekey]')){const v=dialogBody.querySelector('#desk-token').value.trim();if(v){ls.set(TOKEN,v);renderFoot();}}
 if(b.matches('[data-desk-forget]')){ls.set(TOKEN,null);renderFoot();}
 if(b.matches('[data-desk-publish]'))publish();
});
if(location.hash==='#desk')openDesk();

// Words edited on the site (Writer's mode, js/writer.js). Any element with data-w="key" can be rewritten.
// An edit remembers the text it replaced, and it only wins while the page still says that: when his notes
// (or the page) change underneath it, the new source text shows again. Edits live in data/edits.json
// ("texts"), plus whatever is still unpublished on this device.
import {data} from './core.js';

// Only a little markup survives an edit: italics, bold and line breaks. Everything else becomes text.
export function clean(html){
 const box=document.createElement('div');box.innerHTML=String(html??'');
 const walk=n=>[...n.childNodes].map(c=>{
  if(c.nodeType===3)return c.textContent.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
  if(c.nodeType!==1)return '';
  const t=c.tagName.toLowerCase(),inner=walk(c);
  if(t==='br')return '<br>';
  if(t==='em'||t==='i')return inner?`<em>${inner}</em>`:'';
  if(t==='b'||t==='strong')return inner?`<b>${inner}</b>`:'';
  if(t==='div'||t==='p')return (inner&&inner!=='<br>'?'<br>'+inner:'<br>');
  return inner;
 }).join('');
 return walk(box).replace(/^(<br>)+/,'').replace(/(<br>)+$/,'').replace(/&nbsp;| /g,' ').replace(/[ \t]+/g,' ').trim();
}
const same=(a,b)=>clean(a).replace(/\s+/g,' ')===clean(b).replace(/\s+/g,' ');

// The edited version of `key`, if it still applies to `orig`; otherwise null.
export function textFor(key,orig){
 const e=data.edits?.texts?.[key];
 if(!e||e.html==null)return null;
 if(e.base!=null&&orig!=null&&!same(e.base,orig))return null;
 return e.html;
}
// Plain-text helper for strings built in JS: T('sh.nami.lesson', 'the original…') → what to show.
export const T=(key,orig)=>{const h=textFor(key,orig);return h==null?null:h;};

// Apply edits to every [data-w] inside root. The original is kept on the element, so an edit can be undone.
export function bindTexts(root=document){
 root.querySelectorAll('[data-w]').forEach(el=>{
  if(el.dataset.wBase===undefined)el.dataset.wBase=el.innerHTML.trim();
  const h=textFor(el.dataset.w,el.dataset.wBase),next=h!=null?clean(h):el.dataset.wBase;
  if(el.innerHTML!==next)el.innerHTML=next;
  el.classList.toggle('w-edited',h!=null);
  // a line that may be empty ("In my words" on a crew card) shows only once something is written
  const wrap=el.closest('[data-w-wrap]');if(wrap)wrap.hidden=!el.textContent.trim();
 });
}

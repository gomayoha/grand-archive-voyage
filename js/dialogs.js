// One <dialog> for everything that opens: collections (a masonry of photos), the full-screen viewer,
// records, and the character reader. Sections register their collections by key ("crew:3").
import {$,esc,FU,pic,data} from './core.js';
import {setSrc} from './vault.js';

const dialog=$('#dialog'),dBody=$('#dialog-body');let lastFocus=null,viewer=null;
const providers={};
export const registerCollection=(kind,fn)=>{providers[kind]=fn;};
export function openDialog(html,cls=''){
 dialog.className=cls;
 if(!dialog.open){lastFocus=document.activeElement;dialog.showModal();document.documentElement.style.overflow='hidden';}
 dBody.innerHTML=html;dialog.scrollTop=0;$('#dialog-close').focus();
}
export const closeDialog=()=>dialog.open&&dialog.close();
export const dialogBody=dBody;
$('#dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{if(dialog.open)return;viewer=null;dialog.className='';document.documentElement.style.overflow='';dBody.innerHTML='';lastFocus?.focus();});
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});

function collection(key){
 const [k,i]=key.split(':');
 if(providers[k])return providers[k](i);
 return{title:'Stories leave traces.',eyebrow:'Ohara Library',ids:data.media.wall};
}
const masonry=(key,ids,thumb)=>`<div class="masonry">${ids.map(id=>`<button data-view="${key}" data-id="${id}" aria-label="Open image">${thumb?`<img data-life="${id}" alt="" decoding="async">`:pic(id,{sizes:'(max-width:720px) 50vw, 240px'})}</button>`).join('')}</div>`;
export function openCollection(key){const c=collection(key);openDialog(`<p class="eyebrow">${esc(c.eyebrow)}</p><h2 id="dialog-title">${esc(c.title)}</h2><p class="subtle">${c.ids.length} ${c.ids.length===1?'image':'images'}. Tap one to view it full size.</p>${masonry(key,c.ids,c.thumb)}`);if(c.thumb)dBody.querySelectorAll('img[data-life]').forEach(i=>setSrc(i,c.thumb(i.dataset.life)));}
export function openViewer(key,id){
 const c=collection(key),n=c.ids.length;viewer={key,c,i:Math.max(0,c.ids.indexOf(id))};
 openDialog(`<div class="viewer"><div class="viewer-top"><button class="link" data-collection="${key}">← ${esc(c.title)}</button><span class="viewer-count" id="viewer-count"></span></div><div class="viewer-stage"><img id="viewer-img" alt="${esc(c.title)} artwork"></div>${c.caps?'<p class="viewer-cap" id="viewer-cap"></p>':''}${n>1?'<button class="viewer-nav prev" data-step="-1" aria-label="Previous image">‹</button><button class="viewer-nav next" data-step="1" aria-label="Next image">›</button>':''}</div>`,'is-viewer');
 showView();
}
function showView(){if(!viewer)return;const{c,i}=viewer,id=c.ids[i],img=$('#viewer-img');img.classList.remove('in');img.onload=()=>img.classList.add('in');setSrc(img,(c.src||FU)(id));if(img.complete&&img.src)img.classList.add('in');if(c.caps)$('#viewer-cap').textContent=c.caps[id]||'';$('#viewer-count').textContent=`${i+1} / ${c.ids.length}`;[1,-1].forEach(d=>{const j=(i+d+c.ids.length)%c.ids.length;setSrc(new Image(),(c.src||FU)(c.ids[j]));});}
function step(d){if(!viewer)return;viewer.i=(viewer.i+d+viewer.c.ids.length)%viewer.c.ids.length;showView();}
addEventListener('keydown',e=>{if(!dialog.open||!viewer)return;if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1);});
let tx=null;
dialog.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;},{passive:true});
dialog.addEventListener('touchend',e=>{if(tx===null||!viewer)return;const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>50)step(dx<0?1:-1);tx=null;},{passive:true});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.collection)openCollection(b.dataset.collection);
 if(b.dataset.view)openViewer(b.dataset.view,b.dataset.id);
 if(b.dataset.step)step(+b.dataset.step);
});

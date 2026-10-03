// 05 · Between the panels, built from his two Obsidian panel notes (data/panels.json).
// One Piece becomes a manga volume you read the Japanese way: the book opens from the left, and every
// scroll step turns a page over to the right (3D rotate, compositor only). Read the right page, then
// the left. The chapter ruler follows the page you're on. Phones turn one page at a time.
// Other series sit on a shelf below; each opens its pages in the viewer with his notes as captions.
import {$,esc,pad,clamp,smooth,view,part,pinned,motion,data,onSight} from '../core.js';
import {registerCollection} from '../dialogs.js';

const PM=id=>`assets/panels/m/${id}.webp`,PF=id=>`assets/panels/${id}.webp`;
const SERIES_FIX={'THE FLOWERS OF EVIL':['The Flowers of Evil','Shuzo Oshimi'],'ADABANA':['Adabana','NON'],'BLACK CLOVER':['Black Clover','Yuki Tabata'],'BLOOD ON TRACKS':['Blood on the Tracks','Shuzo Oshimi'],'Flagrant Flower Blooms with Dignity':['The Fragrant Flower Blooms with Dignity','Saka Mikami'],'Smoking Behind the Supermarket with you':['Smoking Behind the Supermarket with You','Jinushi']};
const niceGroup=g=>String(g||'').replace(/\b(And|With|The|Of)\b/g,(m,w,o)=>o?m.toLowerCase():m);

export function initPanels(){
 const P=data.panels,OP=P.onepiece[0],book=$('#book'),sec=$('#book-sec');
 const opList=OP.panels.flatMap(p=>p.images.map(i=>({id:i.id,cap:(p.chapter?`Ch. ${p.chapter} · `:'')+(p.title?p.title+'. ':'')+p.note})));
 registerCollection('panels',k=>{
  if(k==='op')return{title:'One Piece',eyebrow:'Favourite panels',ids:opList.map(x=>x.id),src:PF,caps:Object.fromEntries(opList.map(x=>[x.id,x.cap]))};
  const sr=P.other[+k],[title]=SERIES_FIX[sr.title]||[sr.title];
  const list=[...(sr.cover?[{id:sr.cover.id,cap:title+' — cover'}]:[]),...sr.panels.flatMap(p=>p.images.map(i=>({id:i.id,cap:p.note})))];
  return{title,eyebrow:'Favourite panels',ids:list.map(x=>x.id),src:PF,caps:Object.fromEntries(list.map(x=>[x.id,x.cap]))};
 });

 // ---- pages: cover, one page per favourite panel, and the back cover ----
 const page=(p,n)=>{const im=p.images[0],wide=im.w/im.h>1.25;return `<div class="page${wide?' wide':''}">
  ${p.group?`<p class="pg-arc">${esc(niceGroup(p.group))}</p>`:''}
  <button class="pg-img" data-view="panels:op" data-id="${im.id}" aria-label="Open panel full size"><img data-src="${PM(im.id)}" width="${im.w}" height="${im.h}" alt="${esc(p.title||'Manga panel')}" decoding="async"></button>
  <div class="pg-cap">${p.chapter?`<span class="ch-tag">CH. ${p.chapter}</span>`:''}${p.title?`<h5>${esc(p.title)}</h5>`:''}<p>${esc(p.note)}</p></div>
  <span class="pg-no">${n}</span></div>`;};
 const cover=`<div class="page cover"><span class="cv-jp">ワンピース</span><p class="cv-kick">Goma's favourite panels</p><h4>ONE<br>PIECE</h4><p class="cv-sub">${OP.panels.length} pages · read right to left</p><p class="cv-spoil">${esc(OP.spoiler||'')}</p></div>`;
 const end=`<div class="page endpage"><p>To be continued</p><h4>Every page that stopped me mid-read.</h4><small>New ones arrive each time my notes change.</small></div>`;
 const pages=[cover,...OP.panels.map((p,i)=>page(p,i+1)),end];
 const chOf=[null,...OP.panels.map(p=>p.chapter||null),null];
 let leaves=[],L=0,spread=true;

 function build(){
  spread=view.vw>=820;book.classList.toggle('single',!spread);book.innerHTML='';
  if(spread){
   // leaf k: front = page 2k (rests on the left), back = page 2k+1 (lands on the right after turning)
   L=Math.ceil(pages.length/2);
   book.innerHTML=Array.from({length:L},(_,k)=>`<div class="leaf"><div class="face front">${pages[2*k]||''}</div><div class="face back">${pages[2*k+1]||'<div class="page blank"></div>'}</div></div>`).join('');
  }else{
   L=pages.length;
   book.innerHTML=pages.map(pg=>`<div class="leaf"><div class="face front">${pg}</div></div>`).join('');
  }
  leaves=[...book.children].map((el,k)=>({el,k,imgs:[...el.querySelectorAll('img[data-src]')]}));
  sec.style.height=`${Math.round(100+(spread?L:L-1)*55)}svh`;
 }
 build();
 const load=lf=>{if(lf&&lf.imgs.length){lf.imgs.forEach(i=>{i.src=i.dataset.src;i.removeAttribute('data-src');i.decode?.().catch(()=>{});});lf.imgs=[];}};
 onSight(sec,()=>[0,1,2].forEach(k=>load(leaves[k])),'150% 0px');

 const chNow=$('#ch-now'),chFill=$('#ch-fill'),chTrack=$('#ch-track'),pageLbl=$('#book-page');
 chTrack.insertAdjacentHTML('beforeend',[...new Set(OP.panels.map(p=>p.chapter).filter(Boolean))].map(c=>`<b style="left:${(c/1044*100).toFixed(2)}%"></b>`).join(''));
 let shown=-1;
 part({el:sec,measure(){if((view.vw>=820)!==spread){build();this.last=null;}},update(s){
  const p=motion.reduced?0:pinned(this,s),turns=spread?L-1:L-1,x=p*turns*1.0001;
  leaves.forEach(lf=>{
   const t=smooth(clamp((x-lf.k)*1.2-0.08));
   const near=lf.k>=Math.floor(x)-1&&lf.k<=Math.floor(x)+2;
   if(near){load(lf);load(leaves[lf.k+1]);load(leaves[lf.k+2]);}
   if(near!==lf.near){lf.near=near;lf.el.style.visibility=near?'':'hidden';}
   if(!near||lf.t===t)return;lf.t=t;
   if(spread){lf.el.style.transform=`rotateY(${(t*180).toFixed(2)}deg)`;lf.el.style.zIndex=t>0&&t<1?L+2:t>=1?lf.k+1:L-lf.k;}
   else{lf.el.style.transform=`rotateY(${(t*-115).toFixed(2)}deg)`;lf.el.style.opacity=(1-smooth(clamp((t-0.55)/0.45))).toFixed(3);lf.el.style.zIndex=L-lf.k;}
  });
  // A closed volume sits centred; it slides over as the cover opens, like a book on a table.
  if(spread){const o=smooth(clamp(x*1.5-0.25));book.style.transform=`translate3d(${((1-o)*25).toFixed(2)}%,0,0)`;}
  // which page is being read: on a spread, the right page (back of the last turned leaf) first
  const k=Math.round(x),pg=spread?Math.max(0,2*k-1):k,ch=chOf[pg]||chOf[pg+1]||null;
  if(pg!==shown){shown=pg;pageLbl.textContent=pg===0?'cover':pg>=pages.length-1?'the end':`page ${pg}${spread&&pg+1<pages.length-1?'–'+(pg+1):''} of ${pages.length-2}`;
   if(ch){chNow.textContent=`CH. ${ch}`;chFill.style.transform=`scaleX(${(ch/1044).toFixed(4)})`;}}
 }});

 // ---- beyond One Piece: a shelf of other series ----
 $('#beyond').innerHTML=P.other.map((sr,i)=>{const [title,author]=SERIES_FIX[sr.title]||[sr.title,sr.author];const c=sr.cover||sr.panels[0].images[0];return `<button class="vol rv" style="--d:${i*0.07}s" data-view="panels:${i}" data-id="${c.id}"><span class="vol-img"><img src="${PM(c.id)}" alt="" loading="lazy" decoding="async"></span><small>${esc(author)}</small><b>${esc(title)}</b><span>${sr.panels.length} panel${sr.panels.length===1?'':'s'} →</span></button>`;}).join('');
}

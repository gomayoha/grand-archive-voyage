// Book II · the man behind the archive. Four acts from his journal, unlocked by the magic words.
// Words and photos come from the encrypted vault (private/life/story.json + the chapter folders).
import {$,$$,esc,pad,clamp,smooth,view,part,pinned,absTop,motion} from '../core.js';
import {vault,LF,LT,setSrc} from '../vault.js';
import {registerCollection} from '../dialogs.js';

export function initBook2(){
registerCollection('life',i=>{const c=vault.LIFE.chapters[+i];return{title:c.title,eyebrow:'Life · '+c.name,ids:c.photos.map(p=>p.id),src:LF,thumb:LT};});
/* ------------------------------------------------------------------ book II: the man behind the archive */
// Its own world, not part of the anime voyage. Four acts from Goma's journal, each with its own
// scroll language: a mask that cracks open, a rosary that turns verse by verse, the word "Perfect."
// held up by family photos, and a film reel that ends on a promise. All words + photos come from the
// encrypted vault (private/life/story.json + the chapter folders).
const lifeSec=$('#life'),book=$('#life-book');
const CH=vault.LIFE?Object.fromEntries(vault.LIFE.chapters.map((c,i)=>[c.name.toLowerCase().replace(/[^a-z]/g,''),{...c,i}])):{};
const ST=(vault.LIFE&&vault.LIFE.story)||{};
const sget=path=>path.split('.').reduce((o,k)=>o&&o[k],ST);
const lines=(el,arr,cls)=>{el.innerHTML=(arr||[]).map(t=>`<p class="${cls}">${esc(t)}</p>`).join('');return[...el.children];};
const fade=(p,a,b,f=0.08)=>smooth(clamp((p-a)/f))*(1-smooth(clamp((p-b)/f)));
const loadOnApproach=(el,fn)=>{const io=new IntersectionObserver(([e])=>{if(e.isIntersecting){fn();io.disconnect();}},{rootMargin:'200% 0px'});io.observe(el);};
const pickShow=(c,n)=>c?c.photos.filter(p=>!p.dup).slice(0,n):[];
if(vault.LIFE&&vault.LIFE.chapters.length){
 lifeSec.hidden=false;book.hidden=false;$('#nav-life').hidden=false;
 $$('#life-book [data-s]').forEach(el=>{const v=sget(el.dataset.s);if(v)el.innerHTML=esc(v).replace(/\n/g,'<br>');});

 /* Act 1 · the mask */
 const mAct=$('#mask-act'),mOpen=mAct.querySelector('.mask-open'),mSvg=mAct.querySelector('.mask-svg'),mL=mAct.querySelector('.mask-half.l'),mR=mAct.querySelector('.mask-half.r'),mCr=[...mAct.querySelectorAll('.mask-cracks polyline')],mLight=mAct.querySelector('.mask-light'),mAfter=mAct.querySelector('.mask-after');
 const mLines=lines($('#mask-lines'),sget('mask.lines'),'mask-line');
 part({top:0,h:1,measure(){this.top=absTop(mAct);this.h=mAct.offsetHeight;},update(s){
  const p=motion.reduced?1:pinned(this,s);
  mOpen.style.opacity=(1-smooth(clamp((p-0.06)/0.08))).toFixed(3);mOpen.style.transform=`translate3d(0,${(-p*160).toFixed(1)}px,0)`;
  const inM=smooth(clamp((p-0.08)/0.1));
  mLines.forEach((el,i)=>{const a=0.16+i*0.1;const o=fade(p,a,a+0.05,0.04);el.style.opacity=o.toFixed(3);el.style.transform=`translate3d(0,${((1-o)*14).toFixed(1)}px,0)`;});
  mCr.forEach((c,i)=>{const t=smooth(clamp((p-0.44-i*0.015)/0.1));c.style.strokeDashoffset=(1-t).toFixed(3);c.style.opacity=t>0?'1':'0';});
  const sp=smooth(clamp((p-0.6)/0.16));
  mSvg.style.opacity=(inM*(1-smooth(clamp((p-0.7)/0.08)))).toFixed(3);mSvg.style.transform=`scale(${(0.9+inM*0.1+sp*0.06).toFixed(3)})`;
  mL.style.transform=`translate(${(-sp*130).toFixed(1)}px,${(sp*40).toFixed(1)}px) rotate(${(-sp*16).toFixed(2)}deg)`;mR.style.transform=`translate(${(sp*130).toFixed(1)}px,${(sp*52).toFixed(1)}px) rotate(${(sp*14).toFixed(2)}deg)`;
  const li=smooth(clamp((p-0.5)/0.3));mLight.style.opacity=li.toFixed(3);mLight.style.transform=`scale(${(0.2+li*1.6).toFixed(3)})`;
  mAct.style.setProperty('--dawn',smooth(clamp((p-0.66)/0.14)).toFixed(3));
  const af=smooth(clamp((p-0.74)/0.1));mAfter.style.opacity=af.toFixed(3);mAfter.style.transform=`translate3d(0,${((1-af)*30).toFixed(1)}px,0)`;
  mAfter.querySelector('blockquote').style.opacity=smooth(clamp((p-0.86)/0.08)).toFixed(3);
 }});

 /* Act 2 · the rosary */
 const faith=CH.faith,rAct=$('#rosary-act');
 if(faith){
  const N=faith.photos.length,R=78,beads=$('#ro-beads'),card=$('#ro-card'),count=$('#ro-count');
  beads.innerHTML=faith.photos.map((p,i)=>{const a=i/N*Math.PI*2-Math.PI/2;return `<circle class="bead" cx="${(Math.cos(a)*R).toFixed(2)}" cy="${(Math.sin(a)*R).toFixed(2)}" r="3.6"/>`;}).join('')+`<circle class="ro-thread" r="${R}" cx="0" cy="0"/>`;
  card.innerHTML=faith.photos.map(p=>`<button class="ro-img" data-view="life:${faith.i}" data-id="${p.id}" aria-label="Open verse"><img alt="" decoding="async"></button>`).join('');
  const bEls=[...beads.querySelectorAll('.bead')],iEls=[...card.children];
  loadOnApproach(rAct,()=>iEls.forEach((b,i)=>setSrc(b.querySelector('img'),LF(faith.photos[i].id))));
  rAct.style.height=`${Math.round(120+N*16)}svh`;
  let last=-1;
  part({top:0,h:1,measure(){this.top=absTop(rAct);this.h=rAct.offsetHeight;},update(s){
   const p=motion.reduced?0:pinned(this,s),x=clamp(p*1.06-0.02)*(N-1);
   beads.setAttribute('transform',`rotate(${(-x*360/N).toFixed(2)})`);
   const k=Math.round(x);
   iEls.forEach((el,i)=>{const d=Math.abs(i-x);if(d>1.2){if(el._v){el._v=0;el.style.opacity='0';el.style.visibility='hidden';}return;}el._v=1;el.style.visibility='visible';const o=clamp(1-d*1.6);el.style.opacity=o.toFixed(3);el.style.transform=`scale(${(0.94+o*0.06).toFixed(4)}) rotate(${((i-x)*4).toFixed(2)}deg)`;el.tabIndex=i===k?0:-1;});
   if(k!==last){last=k;bEls.forEach((b,i)=>b.classList.toggle('on',i===k));bEls.forEach((b,i)=>b.classList.toggle('past',i<k));count.textContent=`${pad(k+1)} / ${pad(N)}`;}
  }});
 }else rAct.hidden=true;

 /* Cover · the journal opens */
 const cAct=$('#cover-act'),jCover=$('#j-cover'),journal=$('#journal');
 part({el:cAct,update(s){
  const p=motion.reduced?1:pinned(this,s),o=smooth(clamp((p-0.12)/0.45));
  jCover.style.transform=`rotateY(${(-o*168).toFixed(2)}deg)`;
  const z=smooth(clamp((p-0.68)/0.3));
  journal.style.transform=`translate3d(${(o*12).toFixed(2)}%,0,0) scale(${(1+z*0.5).toFixed(4)})`;journal.style.opacity=(1-z).toFixed(3);
 }});

 /* Act 3 · "Perfect." — every family photo flies in and they form a heart around the word */
 const fam=CH.family,hAct=$('#heart-act');
 if(fam){
  const shots=fam.photos.filter(p=>!p.dup),N=shots.length,heart=$('#heart');
  // points along a heart curve, spaced evenly by arc length
  const curve=t=>[16*Math.sin(t)**3,-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))];
  const raw=[];for(let i=0;i<=2000;i++)raw.push(curve(i/2000*Math.PI*2));
  const len=[0];for(let i=1;i<raw.length;i++)len.push(len[i-1]+Math.hypot(raw[i][0]-raw[i-1][0],raw[i][1]-raw[i-1][1]));
  const total=len[len.length-1],pts=[];
  const xs=raw.map(r=>r[0]),ys=raw.map(r=>r[1]),cx=(Math.max(...xs)+Math.min(...xs))/2,cy=(Math.max(...ys)+Math.min(...ys))/2,sx=(Math.max(...xs)-Math.min(...xs))/2;
  for(let k=0;k<N;k++){const L=(k+0.5)/N*total,j=len.findIndex(v=>v>=L);pts.push([(raw[j][0]-cx)/sx,(raw[j][1]-cy)/sx]);}
  const rnd=i=>{const x=Math.sin(i*99.13)*43758.5453;return x-Math.floor(x);};
  heart.innerHTML=shots.map((p,i)=>`<button class="hpol" data-view="life:${fam.i}" data-id="${p.id}" aria-label="Open family photo" style="--r:${((rnd(i)-0.5)*16).toFixed(1)}deg"><img alt="" decoding="async"></button>`).join('');
  const pol=[...heart.children].map((el,i)=>({el,x:pts[i][0],y:pts[i][1],fx:(rnd(i+7)-0.5)*3,fy:(rnd(i+3)>0.5?1:-1)*(1.2+rnd(i+5)),r:(rnd(i+11)-0.5)*120}));
  loadOnApproach(hAct,()=>pol.forEach((o,i)=>setSrc(o.el.querySelector('img'),LT(shots[i].id))));
  $('#hf-all').dataset.collection=`life:${fam.i}`;
  const hfLines=lines($('#hf-lines'),[...(sget('family.lines')||[]),sget('family.sister'),sget('family.close')].filter(Boolean),'hf-line');
  const word=hAct.querySelector('.hf-word'),glow=hAct.querySelector('.heart-glow');
  hAct.style.height=`${Math.round(160+N*7)}svh`;
  part({el:hAct,measure(){this.mob=view.vw<view.vh;this.W=Math.min(view.vw*(this.mob?0.37:0.34),view.vh*0.36);},update(s){
   const p=motion.reduced?0.8:pinned(this,s),W=this.W,H=W;
   pol.forEach((o,i)=>{const t=smooth(clamp((p-0.03-i*(0.5/N))/0.14));
    if(t<=0){if(o.v){o.v=0;o.el.style.visibility='hidden';}return;}if(!o.v){o.v=1;o.el.style.visibility='visible';}
    const X=(o.x*(1-0)*W)*t+o.fx*view.vw*0.5*(1-t),Y=(o.y*H)*t+o.fy*view.vh*0.7*(1-t);
    o.el.style.transform=`translate(-50%,-50%) translate3d(${X.toFixed(1)}px,${Y.toFixed(1)}px,0) rotate(${(o.r*(1-t)).toFixed(1)}deg)`;});
   const done=smooth(clamp((p-0.58)/0.1));heart.classList.toggle('beat',done>0.95&&!motion.reduced);glow.style.opacity=(done*0.9).toFixed(3);
   const w=smooth(clamp((p-0.12)/0.12));word.style.opacity=w.toFixed(3);word.style.transform=`scale(${(0.86+w*0.14).toFixed(3)})`;
   const n=hfLines.length,span=0.42/n;
   hfLines.forEach((el,i)=>{const a=0.3+i*span,last=i===n-1;const o=last?smooth(clamp((p-a)/0.05)):fade(p,a,a+span-0.04,0.04);el.style.opacity=o.toFixed(3);el.style.transform=`translate3d(0,${((1-o)*14).toFixed(1)}px,0)`;});
  }});
 }else hAct.hidden=true;

 /* Act 4 · still becoming — every photo of him on two film strips running opposite ways */
 const me=CH.me,fAct=$('#film-act');
 if(me){
  const shots=me.photos.filter(p=>!p.dup),half=Math.ceil(shots.length/2);
  const strip=(el,list)=>{el.innerHTML=`<div class="film-track">${list.map(p=>`<button class="frame" data-view="life:${me.i}" data-id="${p.id}" aria-label="Open photo"><img alt="" decoding="async"></button>`).join('')}</div>`;return el.firstChild;};
  const tA=strip($('#film-a'),shots.slice(0,half)),tB=strip($('#film-b'),shots.slice(half));
  const frames=[...fAct.querySelectorAll('.frame img')];
  loadOnApproach(fAct,()=>frames.forEach((im,i)=>setSrc(im,LT(shots[i].id))));
  const fLines=lines($('#film-lines'),sget('me.lines'),'film-line'),promise=$('#film-promise');
  part({el:fAct,measure(){this.ra=Math.max(0,tA.scrollWidth-view.vw);this.rb=Math.max(0,tB.scrollWidth-view.vw);fAct.style.height=motion.reduced?'auto':`${Math.round(view.vh+Math.max(this.ra,this.rb)*1.1+view.vh*0.6)}px`;},update(s){
   const p=motion.reduced?0:pinned(this,s),q=clamp(p/0.82);
   tA.style.transform=`translate3d(${(-q*this.ra).toFixed(1)}px,0,0)`;tB.style.transform=`translate3d(${(-(1-q)*this.rb).toFixed(1)}px,0,0)`;
   const n=fLines.length;fLines.forEach((el,i)=>{const a=0.06+i*(0.66/n);const o=fade(p,a,a+0.66/n-0.04,0.04);el.style.opacity=o.toFixed(3);el.style.transform=`translate3d(0,${((1-o)*14).toFixed(1)}px,0)`;});
   const pr=smooth(clamp((p-0.8)/0.12));promise.style.opacity=pr.toFixed(3);promise.style.transform=`translate(-50%,-50%) scale(${(0.94+pr*0.06).toFixed(3)})`;
   fAct.classList.toggle('dim',pr>0.05);
  }});
 }else fAct.hidden=true;

 /* Ending: every chapter's full collection */
 $('#life-row').innerHTML=vault.LIFE.chapters.map((c,i)=>`<button class="world rv" style="--d:${i*0.08}s" data-collection="life:${i}"><img data-life="${(c.photos.find(p=>!p.dup)||c.photos[0]).id}" alt="${esc(c.title)}" decoding="async"><span class="world-copy"><small>${esc(c.name)}</small><b>${esc(c.title)}</b><span>${c.photos.length} photos →</span></span></button>`).join('');
 $$('#life-row img[data-life]').forEach(i=>setSrc(i,LT(i.dataset.life)));
 if(!vault.MODE)$('#life-lock').hidden=true;
}else if(vault.VAULT){lifeSec.hidden=false;$('#life-sealed').hidden=false;}


}

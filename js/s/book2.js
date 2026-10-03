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

 /* Act 3 · "Perfect." */
 const fam=CH.family,pAct=$('#perfect-act');
 if(fam){
  const shots=pickShow(fam,10),wrap=$('#pf-photos');
  // resting spots around the word (x%, y%, tilt), and the direction each one flies in from
  // The centre (the word) and the bottom-centre band (the lines) are kept clear.
  // Phones (tall screens): photos in bands above and below the word instead of around it.
  const SPOTS_M=[[-33,-36,-6],[0,-38,4],[33,-35,6],[-17,-22,-3],[17,-21,5],[-33,18,5],[0,19,-4],[33,17,6]];
  const SPOTS=[[-40,-33,-6],[-14,-38,4],[14,-37,-3],[40,-31,7],[-46,-1,-4],[46,1,5],[-39,31,5],[39,31,-6],[-23,36,3],[23,36,-4]];
  wrap.innerHTML=shots.map((p,i)=>`<button class="polaroid" data-view="life:${fam.i}" data-id="${p.id}" aria-label="Open family photo"><img alt="" decoding="async"></button>`).join('');
  const pol=[...wrap.children];
  loadOnApproach(pAct,()=>pol.forEach((b,i)=>setSrc(b.querySelector('img'),LT(shots[i].id))));
  const pfLines=lines($('#pf-lines'),[...(sget('family.lines')||[]),sget('family.sister'),sget('family.close')].filter(Boolean),'pf-line');
  const word=pAct.querySelector('.pf-word');
  part({top:0,h:1,measure(){this.top=absTop(pAct);this.h=pAct.offsetHeight;this.mob=view.vw<view.vh;},update(s){
   const p=motion.reduced?0.6:pinned(this,s);
   pol.forEach((el,i)=>{const SP=this.mob?SPOTS_M:SPOTS;if(i>=SP.length){el.style.opacity='0';return;}const [x,y,r]=SP[i];const t=smooth(clamp((p-0.04-i*0.03)/0.28));const fx=x*2.4,fy=y*2.6+(i%2?60:-60);
    const X=x*t+fx*(1-t),Y=y*t+fy*(1-t);
    el.style.transform=`translate(-50%,-50%) translate(${X.toFixed(2)}view.vw,${Y.toFixed(2)}view.vh) rotate(${(r*t+(i%2?40:-40)*(1-t)).toFixed(2)}deg) scale(${(0.9+0.1*t).toFixed(3)})`;el.style.opacity=t.toFixed(3);});
   const w=smooth(clamp((p-0.14)/0.14));word.style.opacity=(w*(1-smooth(clamp((p-0.9)/0.08)))).toFixed(3);word.style.transform=`scale(${(0.86+w*0.14).toFixed(3)})`;
   const n=pfLines.length,span=0.52/n;
   pfLines.forEach((el,i)=>{const a=0.32+i*span,last=i===n-1;const o=last?smooth(clamp((p-a)/0.05)):fade(p,a,a+span-0.05,0.04);el.style.opacity=o.toFixed(3);el.style.transform=`translate3d(0,${((1-o)*16).toFixed(1)}px,0)`;});
  }});
 }else pAct.hidden=true;

 /* Act 4 · still becoming */
 const me=CH.me,eAct=$('#me-act');
 if(me){
  const reel=pickShow(me,18),track=$('#me-track');
  track.innerHTML=reel.map((p,i)=>`<button class="reel ${i%3===1?'lo':i%3===2?'hi':''}" data-view="life:${me.i}" data-id="${p.id}" aria-label="Open photo"><img alt="" decoding="async"></button>`).join('')+`<div class="reel-end"><p class="lb-kicker">A promise</p><p class="reel-promise">${esc(sget('me.promise')||'')}</p></div>`;
  const cards=[...track.querySelectorAll('.reel')];
  loadOnApproach(eAct,()=>cards.forEach((b,i)=>setSrc(b.querySelector('img'),LF(reel[i].id))));
  const meLines=lines($('#me-lines'),sget('me.lines'),'me-line');
  part({top:0,h:1,measure(){const lead=parseFloat(getComputedStyle(track).paddingLeft)||0;this.shift=Math.max(0,track.scrollWidth-view.vw+lead);eAct.style.height=motion.reduced?'auto':`${Math.round(view.vh+this.shift*1.2)}px`;this.top=absTop(eAct);this.h=eAct.offsetHeight;},update(s){
   if(motion.reduced){track.style.transform='';return;}
   const p=pinned(this,s),x=-smooth(clamp(p/0.86))*this.shift;track.style.transform=`translate3d(${x.toFixed(1)}px,0,0)`;
   cards.forEach(c=>{const r=c.offsetLeft+x+c.offsetWidth/2,o=clamp((r-view.vw/2)/view.vw,-1,1);c.firstElementChild.style.transform=`translate3d(${(o*-8).toFixed(2)}%,0,0) scale(1.14)`;});
   const n=meLines.length;meLines.forEach((el,i)=>{const a=0.08+i*(0.62/n);const o=fade(p,a,a+0.62/n-0.04,0.04);el.style.opacity=o.toFixed(3);el.style.transform=`translate3d(0,${((1-o)*14).toFixed(1)}px,0)`;});
  }});
 }else eAct.hidden=true;

 /* Ending: every chapter's full collection */
 $('#life-row').innerHTML=vault.LIFE.chapters.map((c,i)=>`<button class="world rv" style="--d:${i*0.08}s" data-collection="life:${i}"><img data-life="${(c.photos.find(p=>!p.dup)||c.photos[0]).id}" alt="${esc(c.title)}" decoding="async"><span class="world-copy"><small>${esc(c.name)}</small><b>${esc(c.title)}</b><span>${c.photos.length} photos →</span></span></button>`).join('');
 $$('#life-row img[data-life]').forEach(i=>setSrc(i,LT(i.dataset.life)));
 if(!vault.MODE)$('#life-lock').hidden=true;
}else if(vault.VAULT){lifeSec.hidden=false;$('#life-sealed').hidden=false;}


}

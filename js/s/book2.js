// Book II · the man behind the archive. Four acts from his journal, unlocked by the magic words.
// Words and photos come from the encrypted vault (private/life/story.json + the chapter folders).
import {$,$$,esc,pad,clamp,smooth,ease,view,part,pinned,absTop,motion} from '../core.js';
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

 /* Act 3 · "Perfect." — the hallway at home. His word, then the family photo he chose as the cover held up
    large while his lines about his mother arrive one by one. Then it settles into its frame on a lamplit wall
    and every other family photo lights up around it, nearest first, like walking down the hallway at home. */
 const fam=CH.family,hAct=$('#heart-act');
 if(fam){
  const shots=fam.photos.filter(p=>!p.dup),N=shots.length,wall=$('#hw-wall'),big=$('#hw-big'),lamp=hAct.querySelector('.hw-lamp');
  const rnd=i=>{const x=Math.sin(i*99.13)*43758.5453;return x-Math.floor(x);};
  const KINDS=['wood','black','white','gold','wood','black','white'];
  wall.innerHTML=shots.map((p,i)=>`<button class="hw-frame ${i?KINDS[Math.floor(rnd(i+3)*KINDS.length)]:'wood cover'}" data-view="life:${fam.i}" data-id="${p.id}" aria-label="Open family photo" style="--tilt:${i?((rnd(i)-0.5)*2.4).toFixed(2):0}deg"><span><img alt="" decoding="async"></span></button>`).join('');
  const frames=[...wall.children];
  loadOnApproach(hAct,()=>{setSrc(big.querySelector('img'),LF(shots[0].id));frames.forEach((f,i)=>setSrc(f.querySelector('img'),LT(shots[i].id)));});
  $('#hf-all').dataset.collection=`life:${fam.i}`;
  const mLines=lines($('#hf-lines'),sget('family.lines'),'hw-line');
  const band=document.createElement('p');band.className='hw-band';band.textContent=sget('family.sister')||'';hAct.querySelector('.pin').appendChild(band);
  const fin=$('#hw-final');fin.textContent=sget('family.close')||'';
  const word=hAct.querySelector('.hf-word'),kick=hAct.querySelector('.hf-kicker'),all=$('#hf-all');
  hAct.style.height='540svh';
  let L=null;
  part({el:hAct,measure(){
   // justified rows sized so the whole wall fits the screen; the cover sits in the middle of the middle row
   const vw=view.vw,vh=view.vh,phone=vw<=820,Wb=vw*(phone?0.94:0.9),Hb=vh*(phone?0.7:0.72),g=phone?6:12;
   const asp=shots.map(p=>p.w/p.h),A=asp.reduce((s,a)=>s+a,0),rows=clamp(Math.round(Math.sqrt(A/(Wb/Hb))),2,12);
   // fill the rows with the other photos (the middle row keeps room for the cover), then put the cover in its centre
   const mid=Math.floor(rows/2),T=A/rows,R=[];let row=[],acc=0;
   shots.forEach((_,i)=>{if(!i)return;row.push(i);acc+=asp[i];const want=T-(R.length===mid?asp[0]:0);if(R.length<rows-1&&acc>=want-asp[i]/2){R.push(row);row=[];acc=0;}});if(row.length)R.push(row);
   const mr=R[Math.min(mid,R.length-1)];mr.splice(Math.floor(mr.length/2),0,0);
   const hs=R.map(r=>(Wb-g*(r.length-1))/r.reduce((s,i)=>s+asp[i],0)),H=hs.reduce((s,h)=>s+h,0)+g*(R.length-1),f=Math.min(1,Hb/H);
   const W=Wb*f,HH=H*f,pos=[];let y=0;
   R.forEach((r,ri)=>{const h=hs[ri]*f;let x=(W-(r.reduce((s,i)=>s+asp[i]*h,0)+g*f*(r.length-1)))/2;r.forEach(i=>{const w=asp[i]*h;pos[i]={x,y,w,h};x+=w+g*f;});y+=h+g*f;});
   wall.style.width=W+'px';wall.style.height=HH+'px';
   frames.forEach((el,i)=>{const q=pos[i],m=Math.min(q.w,q.h);el.style.left=q.x+'px';el.style.top=q.y+'px';el.style.width=q.w+'px';el.style.height=q.h+'px';el.style.setProperty('--b',Math.max(2,m*0.035).toFixed(1)+'px');el.style.setProperty('--m',Math.max(2,m*0.05).toFixed(1)+'px');});
   const cy=vh*(phone?0.52:0.53),wx=vw/2-W/2,wy=cy-HH/2,c=pos[0],ccx=wx+c.x+c.w/2,ccy=wy+c.y+c.h/2;
   const dmax=Math.max(...pos.map(q=>Math.hypot(wx+q.x+q.w/2-ccx,wy+q.y+q.h/2-ccy)))||1;
   const dist=pos.map(q=>Math.hypot(wx+q.x+q.w/2-ccx,wy+q.y+q.h/2-ccy)/dmax);
   const bh=Math.min(vh*(phone?0.38:0.48),vw*0.86/asp[0]),bw=bh*asp[0];
   big.style.width=bw+'px';big.style.height=bh+'px';big.style.marginLeft=-bw/2+'px';big.style.marginTop=-bh/2+'px';
   hAct.style.setProperty('--bh',bh+'px');
   wall.style.transform=`translate3d(${wx-vw/2}px,${wy-vh/2}px,0)`;wall.style.left='50%';wall.style.top='50%';
   L={s:c.w/bw,dx:ccx-vw/2,dy:ccy-vh/2,dist};
  },update(s){
   if(!L)return;const p=motion.reduced?0.76:pinned(this,s);
   kick.style.opacity=(1-smooth(clamp((p-0.86)/0.06))).toFixed(3);
   const w=smooth(clamp((p-0.02)/0.06))*(1-smooth(clamp((p-0.48)/0.06)));word.style.opacity=w.toFixed(3);word.style.transform=`translate3d(0,${((1-smooth(clamp((p-0.02)/0.08)))*20-smooth(clamp((p-0.48)/0.08))*30).toFixed(1)}px,0)`;
   // the photo rises in, then settles into its frame on the wall
   const rise=smooth(clamp((p-0.06)/0.07)),t=ease(clamp((p-0.5)/0.14));
   const sc=1+(L.s-1)*t;
   big.style.opacity=(rise*(t<0.97?1:0)).toFixed(3);
   big.style.transform=`translate3d(${(L.dx*t).toFixed(1)}px,${(L.dy*t+(1-rise)*40).toFixed(1)}px,0) scale(${sc.toFixed(4)})`;
   const n=mLines.length,span=0.36/Math.max(1,n);
   mLines.forEach((el,i)=>{const a=0.13+i*span;const o=fade(p,a,a+span-0.03,0.035)*(1-smooth(clamp((p-0.48)/0.04)));el.style.opacity=o.toFixed(3);el.style.transform=`translate3d(0,${((1-o)*12).toFixed(1)}px,0)`;});
   lamp.style.opacity=(smooth(clamp((p-0.52)/0.16))*(1-0.5*smooth(clamp((p-0.84)/0.08)))).toFixed(3);
   frames.forEach((el,i)=>{const r=i===0?(t>=0.97?1:0):smooth(clamp((p-0.6-L.dist[i]*0.12)/0.07));
    if(el._r===r)return;el._r=r;el.style.opacity=r.toFixed(3);el.style.transform=r>=1?'':`translate3d(0,${((1-r)*-16).toFixed(1)}px,0) scale(${(0.94+r*0.06).toFixed(4)})`;});
   wall.style.opacity=(1-0.62*smooth(clamp((p-0.84)/0.08))).toFixed(3);
   band.style.opacity=fade(p,0.72,0.82,0.04).toFixed(3);
   const f=smooth(clamp((p-0.86)/0.06));fin.style.opacity=f.toFixed(3);all.style.opacity=f.toFixed(3);all.style.pointerEvents=f>0.5?'auto':'none';
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

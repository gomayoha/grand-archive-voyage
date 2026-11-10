// The folding screens (Nov 2026). The Shelf used to be a flat grid of covers. Now every record is a panel of a
// lacquered folding screen (a byobu, six panels each, the way they stand in Wano's castles): a screen stands
// folded in the dark, opens in a zigzag as you reach it, and folds shut again while the next one slides in.
// The tabs, search, filters and sort live in the hall and re-dress the screens at once; tap a panel to read the
// record. The panels are clones of the grid's cards (shelf.js still renders #record-grid, and its delegated
// click opens the record), so nothing about the data changed. Motion Off keeps the grid.
import {$,part,pinned,view,motion,follower,clamp,smooth,lerp,pad,esc,lite,coarse,jumpTo,remeasure} from '../core.js';

const PER=6;

export function initScreens(){
 const sec=$('#byo'),cam=$('#by-cam'),grid=$('#record-grid'),bar=$('#by-bar');if(!sec||!cam||!grid||!bar)return;
 const tabs=$('#records .shelf-tabs'),ctl=$('#records .controls'),band=$('#by-band'),cap=$('#by-cap'),say=$('#by-say'),ladder=$('#by-ladder'),pin=sec.querySelector('.pin');
 // the controls move into the hall while motion is on, and back above the grid when it is off
 const home=[tabs,ctl].filter(Boolean).map(el=>({el,parent:el.parentNode,next:el.nextSibling}));
 const place=()=>home.forEach(h=>{if(!motion.reduced)bar.appendChild(h.el);else h.parent.insertBefore(h.el,h.next);});
 const slots=[0,1,2].map(()=>{const el=document.createElement('div');el.className='by-s';el.innerHTML='<div class="by-r"><i class="by-sh"></i></div><div class="by-r"><i class="by-sh"></i></div>';cam.appendChild(el);return {el,rows:[...el.children].map(r=>({el:r,sh:r.firstChild,p:[]})),k:null,v:true};});
 let items=[],S=1,labels=[],phone=false,PW=180,PH=340,rowY=[0,0],cur=-1,ready=false;

 function layout(){
  phone=view.vw<=820;
  if(phone){
   // two screens of three, one above the other, with the caption in the gap between them; the last 60px belong to the purse and toasts
   const top=226,short=view.vh<720,meta=short?40:58,gap=34,avail=view.vh-top-60,rh=(avail-gap)/2;
   PW=Math.floor(Math.min((view.vw-30)/2.8,(rh-meta)/1.5));PH=Math.round(PW*1.5+meta);
   const cy=top+avail/2;rowY=[-(PH/2+gap/2),PH/2+gap/2];sec.classList.toggle('short',short);
   pin.style.setProperty('--cy',cy+'px');pin.style.setProperty('--fy',(cy+gap/2+PH-8)+'px');
  }else{
   const top=136,bot=140,avail=view.vh-top-bot;
   PW=Math.floor(Math.min((view.vw-130)/5.5,(avail-70)/1.5,250));PH=Math.round(PW*1.5+70);
   const cy=top+avail/2;rowY=[0,0];
   pin.style.setProperty('--cy',cy+'px');pin.style.setProperty('--fy',(cy+PH/2-10)+'px');
  }
  pin.style.setProperty('--pw',PW+'px');pin.style.setProperty('--ph',PH+'px');
  sec.dataset.k=phone?'p':'d';slots.forEach(s=>{s.k=null;});
 }
 // what a screen holds, said in a word: its score band, its letters, or its status
 function labelOf(chunk){
  const nums=chunk.map(b=>{const e=b.querySelector('.pc-score');return e&&!e.classList.contains('small')?parseFloat(e.textContent):NaN;}).filter(n=>!isNaN(n));
  if(chunk[0]?.querySelector('.pc-score')?.textContent.startsWith('#'))return 'Top 10';
  if($('#sort')?.value==='title'){const a=chunk[0].querySelector('strong').textContent.trim()[0],b=chunk[chunk.length-1].querySelector('strong').textContent.trim()[0];return (a===b?a:`${a} – ${b}`).toUpperCase();}
  if(nums.length){const hi=Math.floor(Math.max(...nums)),lo=Math.floor(Math.min(...nums));return hi===lo?String(hi):`${hi} – ${lo}`;}
  return (chunk[0].querySelector('.pc-meta small')?.textContent||'').split(' · ')[0]||'—';
 }
 function rebuild(){
  items=[...grid.querySelectorAll('.pc')];S=Math.max(1,Math.ceil(items.length/PER));
  labels=Array.from({length:S},(_,k)=>items.length?labelOf(items.slice(k*PER,k*PER+PER)):'');
  sec.style.height=`${100+(S-1)*66+(S>1?22:0)}svh`;
  sec.classList.toggle('none',!items.length);
  ladder.innerHTML=S>1?labels.map((l,k)=>`<button type="button" data-k="${k}" aria-label="Screen ${k+1}: ${esc(l)}"><span>${esc(l)}</span></button>`).join(''):'';
  slots.forEach(s=>{s.k=null;});cur=-1;say.classList.remove('in');
  remeasure();
 }
 function fill(sl,k){
  sl.k=k;const chunk=items.slice(k*PER,k*PER+PER),split=phone?[chunk.slice(0,3),chunk.slice(3)]:[chunk,[]];
  sl.rows.forEach((r,ri)=>{
   r.p.forEach(p=>p.remove());
   r.p=split[ri].map(src=>{const p=document.createElement('div');p.className='by-p';const c=src.cloneNode(true);c.querySelectorAll('img').forEach(im=>{im.loading='eager';});p.appendChild(c);r.el.appendChild(p);return p;});
   r.el.style.visibility=r.p.length?'':'hidden';
  });
 }
 function render(x,entry,mx){
  const k0=clamp(Math.round(x),0,S-1);
  for(let dk=-1;dk<=1;dk++){
   const k=k0+dk,sl=slots[((k%3)+3)%3],d=k-x,a=Math.abs(d);
   if(k<0||k>=S||!items.length||a>0.97){if(sl.v){sl.v=false;sl.el.style.visibility='hidden';}continue;}
   if(sl.k!==k)fill(sl,k);
   if(!sl.v){sl.v=true;sl.el.style.visibility='visible';}
   sl.rows.forEach((r,ri)=>{
    const n=r.p.length;if(!n)return;
    // the second row on phones folds a breath later and leaves the other way
    const dd=ri?d+0.05*Math.sign(d||1)*(a>0.02?1:0):d,aa=Math.abs(dd),dir=ri?-1:1;
    let th=lerp(25,87,smooth(clamp((aa-0.2)/0.42)))+(0.2-Math.min(aa,0.2))*-28;
    th=Math.max(th,lerp(87,th,entry));
    const rad=th*Math.PI/180,c=Math.cos(rad),s=Math.sin(rad),w=PW*c,total=n*w;
    r.el.style.transform=`translate3d(${(dir*dd*view.vw*(phone?0.9:0.62)).toFixed(1)}px,${rowY[ri]}px,${(-aa*280).toFixed(1)}px) rotateY(${(dd*-16+mx).toFixed(2)}deg)`;
    r.el.style.opacity=(1-smooth(clamp((aa-0.6)/0.32))).toFixed(3);
    r.p.forEach((p,i)=>{
     const odd=i%2;
     p.style.transform=`translate3d(${(-total/2+i*w).toFixed(2)}px,${(-PH/2).toFixed(1)}px,${odd?(-PW*s).toFixed(2):0}px) rotateY(${(odd?-th:th).toFixed(2)}deg)`;
     p.style.setProperty('--sh',(odd?0.05+s*0.42:s*0.16).toFixed(3));
     p.style.pointerEvents=th<40?'auto':'none';
    });
    r.sh.style.transform=`translate3d(${(-total/2-20).toFixed(1)}px,${(PH/2-14).toFixed(1)}px,${(-PW*s/2).toFixed(1)}px)`;r.sh.style.width=(total+40).toFixed(0)+'px';
   });
  }
  if(k0!==cur){cur=k0;
   const l=labels[k0]||'';band.textContent=l;band.classList.toggle('word',l.length>3);band.classList.remove('in');void band.offsetWidth;band.classList.add('in');
   cap.innerHTML=items.length?`<b>Screen ${pad(k0+1)} / ${pad(S)}</b><span>${items.length} record${items.length===1?'':'s'}</span>`:'<b>No records match that search.</b>';
   [...ladder.children].forEach((b,i)=>b.classList.toggle('on',i===k0));
  }
 }
 const f=follower(120),mf=follower(240);let ptr=0,ent=1,u=0;
 const p=part({el:sec,
  measure(){if((view.vw<=820?'p':'d')!==sec.dataset.k||this._vh!==view.vh){this._vh=view.vh;layout();}},
  update(s){if(motion.reduced)return;
   f.target=pinned(this,s)/(S>1?0.93:1);if(f.v!==null&&Math.abs(f.target-f.v)>0.3)f.v=f.target;u=clamp(f.step(view.t));
   ent=smooth(clamp((s-(this.top-view.vh*0.8))/(view.vh*0.72)));
   mf.target=ptr*5;render(u*(S-1),ent,mf.step(view.t)||0);}});
 place();layout();rebuild();ready=true;
 new MutationObserver(()=>{const inside=ready&&!motion.reduced&&scrollY>p.top+2&&scrollY<p.top+p.h;rebuild();if(inside){f.v=null;jumpTo(p.top);}else if(!motion.reduced)render(u*(S-1),ent,mf.v||0);}).observe(grid,{childList:true});
 motion.listeners.push(()=>{place();remeasure();});
 ladder.addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(b)jumpTo(p.top+(+b.dataset.k/(S-1))*0.93*(p.h-view.vh)+2);});
 // his one-line verdict comes up while you point at a panel (his words, from the shelf)
 if(!coarse){
  cam.addEventListener('pointerover',e=>{const b=e.target.closest('.pc'),t=b?.dataset.say;say.textContent=t?`“${t}”`:'';say.classList.toggle('in',!!t);});
  cam.addEventListener('pointerleave',()=>say.classList.remove('in'));
  sec.addEventListener('pointermove',e=>{ptr=(e.clientX/view.vw-.5)*2;},{passive:true});
 }
 // the screen keeps turning toward the mouse after the scroll stops
 let vis=false,raf=0;const tick=()=>{raf=0;if(!vis||motion.reduced||coarse)return;if(Math.abs(mf.target-(mf.v||0))>0.02)render(u*(S-1),ent,mf.step(performance.now())||0);raf=requestAnimationFrame(tick);};
 new IntersectionObserver(([e])=>{vis=e.isIntersecting;sec.classList.toggle('live',vis);if(vis&&!raf&&!lite)raf=requestAnimationFrame(tick);}).observe(sec);
}

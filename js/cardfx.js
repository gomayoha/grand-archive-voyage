// The top four rarities each have something you do with your hands (Oct 22 2026), and a back you can turn it over to.
//  - Conqueror (1 of 1): hold your finger on it. A ring tightens, the card trembles, then Haki bursts: the screen cracks.
//  - Sun God: it is rubber. Grab it anywhere and pull; it stretches like Gear 5, laughs, and wobbles back.
//  - Red Manga: it is a red-ink print. Drag the curled corner like a real page; the full-colour picture is under it.
//  - Manga: a pencil draft on blank paper. Draw on it and black ink goes down; fill most of it and it is signed 完.
// Every card turns over on a tap: the back says when you unlocked it, where you found it, and its odds.
// Each one also has a full-screen opening that plays in the chest ceremony, the moment the card turns up.
// (Prototype that was approved first: the "Special Card Lab" artifact. Same moves, same numbers.)
import {motion,clamp,esc} from './core.js';
import {B,save,once} from './bounty.js';

const $=(s,r=document)=>r.querySelector(s);
const R=(a,b)=>a+Math.random()*(b-a);
// a few real manga pages for the openings (assets/panels)
const PAN=['05f6434eeb9b','2af29ff1fb9a','0a982390dc21','0d6e7d7accc5','1d5957ea0903','2ba7bb4313ee'];
export const preload=()=>PAN.forEach(p=>{const i=new Image();i.src=`assets/panels/${p}.webp`;});
const fmt=ms=>new Date(ms).toLocaleString('en-GB',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}).replace(',',' ·');
const cx=id=>((B.cx||(B.cx={}))[id]||(B.cx[id]={}));
const ODDS={sun:'0.4% of cards',rm:'0.8% of cards',m:'1.8% of cards',sec:'3% of cards',sr:'9% of cards',r:'23% of cards',c:'62% of cards',conq:'1 of 1'};

/* ---------------------------------------------------------------- the back of a card */
const rows=a=>'<div class="cb-rows">'+a.map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join('')+'</div>';
export function backHTML(r,p,name){
 const c=B.cx?.[p.id]||{},when=B.cards[p.id]?fmt(B.cards[p.id]):'—';
 const found=c.pack?`A ${esc(c.pack)} pack`:c.k?`Chest No. ${c.k}`:'A chest, before they were counted';
 const col=`${esc(p.col)} · No. ${p.i} of ${p.of}`;
 if(r==='conq')return `<div class="cb cb-conq"><div class="cb-ring"><span>G</span></div><h4>Conqueror · 1 of 1</h4><div class="cb-big">It chose you.</div><p>The only one in the archive. It can’t be bought or rolled.</p>${rows([['Conquered',when],['Found in',found],['Picture',col],['Print','1 / 1']])}</div>`;
 if(r==='sun')return `<div class="cb cb-sun"><div class="cb-ring"><span>☀</span></div><h4>Sun God · the rarest</h4><div class="cb-big">It has a heartbeat.</div><p>Pull the card. It’s rubber.</p><svg class="cb-hb" viewBox="0 0 250 46" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M0 26H70L80 8L94 40L106 16L114 26H250"/></svg>${rows([['Awakened',when],['Found in',found],['Picture',col],['Odds',ODDS.sun]])}</div>`;
 if(r==='rm')return `<div class="cb cb-rm"><div class="cb-last">— Last page —</div><div class="cb-stamp">開封</div><h4>Red Manga · colophon</h4><div class="cb-big">Printed in red ink.</div><p>Stamped with the moment you opened it, like the last page of a volume.</p>${rows([['Unsealed',when],['Found in',found],['Picture',col],['Under the ink',c.peeled?'Peeled '+fmt(c.peeled):'Full colour']])}</div>`;
 if(r==='m')return `<div class="cb cb-m"><div class="cb-last">— Inked by hand —</div><div class="cb-hk">完</div><h4>Manga · colophon</h4><div class="cb-big">Black ink on white paper.</div><p>The page is signed the moment you finish inking it.</p>${rows([['Unlocked',when],['Inked',c.inked?fmt(c.inked):'Not yet. Draw on it.'],['Found in',found],['Picture',col]])}</div>`;
 const nm={sec:'Secret',sr:'Super rare',r:'Rare',c:'Common'}[r]||'';
 return `<div class="cb cb-gen"><div class="cb-ring"><span>G</span></div><h4>${nm} · Grand Archive</h4><div class="cb-big">${esc(p.col)}</div><p>No. ${p.i} of ${p.of}</p>${rows([['Unlocked',when],['Found in',found],['Odds',ODDS[r]||'']])}</div>`;
}

/* ---------------------------------------------------------------- turning it over */
export function flip(card){card.classList.add('turning');card.classList.toggle('flipped');clearTimeout(card._tt);card._tt=setTimeout(()=>card.classList.remove('turning'),950);}
function tapper(card,skip=()=>false){
 let sx=0,sy=0,t0=0,moved=false,on=false;
 card.addEventListener('pointerdown',e=>{if(e.button>0)return;sx=e.clientX;sy=e.clientY;t0=performance.now();moved=false;on=true;});
 card.addEventListener('pointermove',e=>{if(on&&Math.hypot(e.clientX-sx,e.clientY-sy)>8)moved=true;});
 const end=(e,ok)=>{if(!on)return;on=false;if(ok&&!moved&&performance.now()-t0<450&&!skip(e))flip(card);};
 card.addEventListener('pointerup',e=>end(e,true));card.addEventListener('pointercancel',e=>end(e,false));
}
export const hint={conq:'Hold your finger on it until the ring closes · tap to turn it over',sun:'Grab it anywhere and pull · tap to turn it over',rm:'Drag the curled corner, like a page · tap to turn it over',m:'Draw on it with your finger · tap to turn it over'};

/* ---------------------------------------------------------------- Conqueror: Haki cracks the screen */
const NS='http://www.w3.org/2000/svg';
export function cracks(host,x,y,{ms=2200,n=11}={}){
 const W=innerWidth,H=innerHeight,s=document.createElementNS(NS,'svg');s.setAttribute('class','cx-crk');s.setAttribute('viewBox',`0 0 ${W} ${H}`);const paths=[];
 const ray=(x0,y0,a,len,w,depth)=>{let px=x0,py=y0,d=`M${px.toFixed(0)} ${py.toFixed(0)}`,L=0;while(L<len){const st=R(18,48);a+=R(-.3,.3);px+=Math.cos(a)*st;py+=Math.sin(a)*st;L+=st;d+=` L${px.toFixed(0)} ${py.toFixed(0)}`;if(depth<2&&Math.random()<.22)ray(px,py,a+R(-1,1)*.9,len*R(.25,.5),w*.6,depth+1);}paths.push([d,w,L]);};
 for(let i=0;i<n;i++)ray(x,y,(i/n)*Math.PI*2+R(-.2,.2),R(.35,.9)*Math.max(W,H)*.5,R(1.4,2.6),0);
 paths.forEach(([d,w,L],i)=>{[['#ff1a2e',w*3.2,.45],['#fff',w,.95]].forEach(([c,sw,o])=>{const p=document.createElementNS(NS,'path');p.setAttribute('d',d);p.setAttribute('stroke',c);p.setAttribute('stroke-width',sw);p.setAttribute('opacity',o);p.style.strokeDasharray=L+10;p.style.strokeDashoffset=L+10;p.style.transition=`stroke-dashoffset ${.35+L/900}s cubic-bezier(.2,.7,.3,1) ${(i%4)*.03}s`;s.appendChild(p);});});
 host.appendChild(s);requestAnimationFrame(()=>requestAnimationFrame(()=>s.querySelectorAll('path').forEach(p=>p.style.strokeDashoffset=0)));
 setTimeout(()=>{s.style.transition='opacity .8s';s.style.opacity=0;},ms);setTimeout(()=>s.remove(),ms+900);return s;
}
function redFlash(host,x,y){const f=document.createElement('i');f.className='cx-flash';f.style.setProperty('--fx',x+'px');f.style.setProperty('--fy',y+'px');host.appendChild(f);setTimeout(()=>f.remove(),1200);}
function mountConq(card,p,host){
 const ch=document.createElement('i');ch.className='cx-charge';host.appendChild(ch);
 let raf=0,t0=0,holding=false,fired=false,px=0,py=0;
 const shake=()=>host.animate([{transform:'none'},{transform:'translate(-9px,5px)'},{transform:'translate(8px,-6px)'},{transform:'translate(-6px,4px)'},{transform:'translate(4px,-3px)'},{transform:'none'}],{duration:600,easing:'cubic-bezier(.2,.9,.3,1)'});
 const tick=()=>{if(!holding)return;const k=clamp((performance.now()-t0)/900,0,1);
  ch.style.setProperty('--k',(1.6-k*1.1).toFixed(3));ch.style.setProperty('--o',(.15+k*.85).toFixed(2));card.style.setProperty('--ch',k.toFixed(2));
  card.style.translate=`${((Math.random()-.5)*k*5).toFixed(1)}px ${((Math.random()-.5)*k*5).toFixed(1)}px`;
  if(k>=1&&!fired){fired=true;burst();end();}else raf=requestAnimationFrame(tick);};
 const burst=()=>{redFlash(host,px,py);cracks(host,px,py);if(!motion.reduced)shake();navigator.vibrate&&navigator.vibrate([30,40,60]);once('cx:haki',2e6,'Haki on your own card');};
 const end=()=>{holding=false;cancelAnimationFrame(raf);ch.style.setProperty('--o',0);card.style.translate='';setTimeout(()=>card.style.setProperty('--ch',0),fired?1800:0);};
 card.addEventListener('pointerdown',e=>{if(e.button>0||card.classList.contains('flipped'))return;fired=false;holding=true;t0=performance.now();px=e.clientX;py=e.clientY;ch.style.left=px+'px';ch.style.top=py+'px';raf=requestAnimationFrame(tick);});
 card.addEventListener('pointermove',e=>{if(!holding)return;px=e.clientX;py=e.clientY;ch.style.left=px+'px';ch.style.top=py+'px';});
 const stop=()=>{if(holding)end();setTimeout(()=>{fired=false;},60);};
 card.addEventListener('pointerup',stop);card.addEventListener('pointercancel',stop);
 tapper(card,()=>fired);
 return()=>{end();ch.remove();};
}

/* ---------------------------------------------------------------- Sun God: it's rubber */
function mountSun(card,p,host){
 let g=null,pp=[0,0],v=[0,0],raf=0,anc=[0,0],a=[1,1],moved=false,W=0,H=0;
 const apply=()=>{const sx=clamp(1+pp[0]/a[0],.55,2.4),sy=clamp(1+pp[1]/a[1],.55,2.4);card.style.transformOrigin=`${anc[0]}px ${anc[1]}px`;
  card.style.transform=`scale(${sx.toFixed(3)},${sy.toFixed(3)}) skew(${(-pp[1]/H*10).toFixed(2)}deg,${(pp[0]/W*7).toFixed(2)}deg)`;};
 const spring=()=>{let last=performance.now();const st=now=>{const dt=Math.min(.032,(now-last)/1000);last=now;
   for(let i=0;i<2;i++){const ax=-170*pp[0]-5.2*v[0],ay=-170*pp[1]-5.2*v[1];v[0]+=ax*dt/2;v[1]+=ay*dt/2;pp[0]+=v[0]*dt/2;pp[1]+=v[1]*dt/2;}
   apply();if(Math.hypot(pp[0],pp[1])>.4||Math.hypot(v[0],v[1])>5)raf=requestAnimationFrame(st);else{pp=[0,0];v=[0,0];card.style.transform='';}};raf=requestAnimationFrame(st);};
 const laugh=()=>{if(!card._laugh){const l=document.createElement('div');l.className='cx-laugh';l.textContent='ハハハ';$('.tc-front',card).appendChild(l);card._laugh=l;}const l=card._laugh;l.classList.remove('go');void l.offsetWidth;l.classList.add('go');};
 card.addEventListener('pointerdown',e=>{if(e.button>0||card.classList.contains('flipped'))return;cancelAnimationFrame(raf);card.style.transform='';const r=card.getBoundingClientRect();W=r.width;H=r.height;
  const gx=e.clientX-r.left,gy=e.clientY-r.top;g=[e.clientX,e.clientY];moved=false;anc=[W-gx,H-gy];
  a=[Math.sign(gx-anc[0]||1)*Math.max(Math.abs(gx-anc[0]),W*.5),Math.sign(gy-anc[1]||1)*Math.max(Math.abs(gy-anc[1]),H*.5)];pp=[0,0];v=[0,0];try{card.setPointerCapture(e.pointerId);}catch{}});
 card.addEventListener('pointermove',e=>{if(!g)return;pp=[e.clientX-g[0],e.clientY-g[1]];if(Math.hypot(...pp)>8)moved=true;if(moved)apply();});
 const up=()=>{if(!g)return;g=null;if(moved){laugh();once('cx:rubber',1e6,'Stretched a Sun God card');spring();}};
 card.addEventListener('pointerup',up);card.addEventListener('pointercancel',up);
 tapper(card,()=>moved);
 return()=>{cancelAnimationFrame(raf);card.style.transform='';};
}

/* ---------------------------------------------------------------- Red Manga: peel the page */
const clipPoly=(poly,f)=>{const o=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],fa=f(a),fb=f(b);if(fa>=0)o.push(a);if((fa>=0)!==(fb>=0)){const t=fa/(fa-fb);o.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}return o;};
const cp=p=>p.length<3?'polygon(0 0,0 0,0 0)':'polygon('+p.map(q=>q[0].toFixed(1)+'px '+q[1].toFixed(1)+'px').join(',')+')';
function mountRed(card,p,host){
 const fr=$('.tc-front',card),img=$('img',fr);img.classList.add('pk-color');
 const area=document.createElement('div');area.className='pk-area';fr.insertBefore(area,img);area.appendChild(img);
 const pr=document.createElement('div');pr.className='pk-print';pr.innerHTML=`<img src="${img.src}" alt="">`;
 [$('.tc-tone',fr),$('.tc-ink',fr)].forEach(e=>e&&pr.appendChild(e));area.appendChild(pr);
 const sd=document.createElement('div');sd.className='pk-shade';area.appendChild(sd);
 const fl=document.createElement('div');fl.className='pk-flap';fl.innerHTML=`<div class="pk-gh"><img src="${img.src}" alt=""></div><div class="pk-gr"></div>`;area.appendChild(fl);
 const curl=document.createElement('div');curl.className='pk-curl';area.appendChild(curl);
 const hint=document.createElement('div');hint.className='pk-hint';hint.textContent='peel';area.appendChild(hint);
 const gh=$('.pk-gh',fl),gr=$('.pk-gr',fl);
 let W=0,H=0,P=null,anim=0,dragging=false,asked=false;
 const meas=()=>{W=area.offsetWidth;H=area.offsetHeight;gh.style.width=W+'px';gh.style.height=H+'px';};
 const draw=pt=>{P=pt;if(!W)meas();const C=[W,H],dx=C[0]-pt[0],dy=C[1]-pt[1],dist=Math.hypot(dx,dy);
  if(dist<3){pr.style.clipPath='none';fl.style.display=sd.style.display='none';curl.classList.remove('off');hint.style.display='';return;}
  curl.classList.add('off');hint.style.display='none';
  const u=[dx/dist,dy/dist],M=[(C[0]+pt[0])/2,(C[1]+pt[1])/2],rect=[[0,0],[W,0],[W,H],[0,H]];
  const keep=clipPoly(rect,q=>-((q[0]-M[0])*u[0]+(q[1]-M[1])*u[1]));
  const src=clipPoly(rect,q=>((q[0]-M[0])*u[0]+(q[1]-M[1])*u[1]));
  const refl=src.map(q=>{const s=(q[0]-M[0])*u[0]+(q[1]-M[1])*u[1];return[q[0]-2*s*u[0],q[1]-2*s*u[1]];});
  const flap=clipPoly(clipPoly(clipPoly(clipPoly(refl,q=>q[0]),q=>q[1]),q=>W-q[0]),q=>H-q[1]);
  pr.style.clipPath=cp(keep);fl.style.display='block';fl.style.clipPath=cp(flap);
  const k=M[0]*u[0]+M[1]*u[1],ma=1-2*u[0]*u[0],mb=-2*u[0]*u[1],md=1-2*u[1]*u[1];
  gh.style.transform=`matrix(${ma},${mb},${mb},${md},${2*k*u[0]},${2*k*u[1]})`;
  const ang=(Math.atan2(-u[0],u[1])*180/Math.PI+360)%360,Lg=Math.abs(W*Math.sin(ang*Math.PI/180))+Math.abs(H*Math.cos(ang*Math.PI/180)),tf=.5+(((M[0]-W/2)*-u[0]+(M[1]-H/2)*-u[1])/Lg);
  gr.style.background=`linear-gradient(${ang}deg,rgba(255,255,255,.7) ${tf*100}%,rgba(60,30,10,.35) ${(tf+dist/2/Lg)*100}%)`;
  const band=clipPoly(keep,q=>46-(-((q[0]-M[0])*u[0]+(q[1]-M[1])*u[1])));
  sd.style.display='block';sd.style.clipPath=cp(band);sd.style.background=`linear-gradient(${ang}deg,rgba(0,0,0,.55) ${tf*100}%,rgba(0,0,0,0) ${(tf+46/Lg)*100}%)`;
  if(!asked&&dist>Math.hypot(W,H)*.3){asked=true;const c=cx(p.id);if(!c.peeled){c.peeled=Date.now();save();}once('cx:peel',1e6,'Peeled a Red Manga card');}
 };
 const home=()=>{const C=[W,H],from=P||C,t0=performance.now();cancelAnimationFrame(anim);const st=()=>{const k=clamp((performance.now()-t0)/520,0,1),e=1-Math.pow(1-k,3);draw([from[0]+(C[0]-from[0])*e,from[1]+(C[1]-from[1])*e]);if(k<1)anim=requestAnimationFrame(st);};st();};
 const toLocal=e=>{const r=area.getBoundingClientRect(),sx=r.width?W/r.width:1;return[clamp((e.clientX-r.left)*sx,0,W),clamp((e.clientY-r.top)*sx,0,H)];};
 const peeled=()=>P&&Math.hypot(W-P[0],H-P[1])>3;
 curl.addEventListener('pointerdown',e=>{if(card.classList.contains('flipped'))return;e.stopPropagation();meas();dragging=true;cancelAnimationFrame(anim);curl.setPointerCapture(e.pointerId);draw(toLocal(e));});
 curl.addEventListener('pointermove',e=>{if(dragging){e.stopPropagation();draw(toLocal(e));}});
 const rel=()=>{if(dragging){dragging=false;home();}};
 curl.addEventListener('pointerup',rel);curl.addEventListener('pointercancel',rel);
 area.addEventListener('pointerdown',e=>{if(e.target===curl||!peeled()||card.classList.contains('flipped'))return;meas();dragging=true;area.setPointerCapture(e.pointerId);draw(toLocal(e));});
 area.addEventListener('pointermove',e=>{if(dragging&&e.target!==curl)draw(toLocal(e));});
 area.addEventListener('pointerup',rel);
 tapper(card,e=>{const r=area.getBoundingClientRect();return peeled()||(e.clientX>r.right-70&&e.clientY>r.bottom-70);});
 const ro=new ResizeObserver(()=>{meas();if(P)draw(P);});ro.observe(area);
 // show how it works, once
 let demo=0;if(!motion.reduced)demo=setTimeout(()=>{if(!card.isConnected||P)return;meas();const C=[W,H],t0=performance.now(),to=[W*.55,H*.6];const st=()=>{const k=(performance.now()-t0)/1900;if(dragging||!card.isConnected)return;const e=Math.sin(Math.min(k,1)*Math.PI);draw([C[0]+(to[0]-C[0])*e,C[1]+(to[1]-C[1])*e]);if(k<1)requestAnimationFrame(st);else draw(C);};st();},1100);
 return()=>{clearTimeout(demo);cancelAnimationFrame(anim);ro.disconnect();};
}

/* ---------------------------------------------------------------- Manga: ink it yourself */
function mountInk(card,p,host){
 const fr=$('.tc-front',card),img=$('img',fr);img.classList.add('pk-pencil');
 const area=document.createElement('div');area.className='pk-area';fr.insertBefore(area,img);
 const guide=document.createElement('div');guide.className='pk-guide';area.append(guide,img);
 const cv=document.createElement('canvas');cv.className='pk-ink';area.appendChild(cv);
 const pct=document.createElement('span');pct.className='pk-pct';pct.textContent='0% INKED';area.appendChild(pct);
 const fin=document.createElement('div');fin.className='pk-fin';fin.textContent='完';area.appendChild(fin);
 const acts=$('.ti-acts',host);let rb=null;
 const dpr=Math.min(2,devicePixelRatio||1);
 let W=0,H=0,dctx=cv.getContext('2d'),mc=document.createElement('canvas'),mctx=mc.getContext('2d'),tiny=document.createElement('canvas'),tctx,dirty=false,drawing=false,last=null,done=false,moved=false,touched=false,lastCheck=0,ratio=0,tick=false,alive=true;
 tiny.width=32;tiny.height=45;tctx=tiny.getContext('2d',{willReadFrequently:true});
 const im=new Image();
 const size=()=>{W=area.offsetWidth;H=area.offsetHeight;if(!W)return false;cv.width=mc.width=W*dpr;cv.height=mc.height=H*dpr;dctx.setTransform(dpr,0,0,dpr,0,0);mctx.setTransform(dpr,0,0,dpr,0,0);return true;};
 const paint=()=>{if(!W||!im.complete||!im.naturalWidth)return;dctx.globalCompositeOperation='source-over';dctx.clearRect(0,0,W,H);
  const s=Math.max(W/im.naturalWidth,H/im.naturalHeight),iw=im.naturalWidth*s,ih=im.naturalHeight*s;dctx.drawImage(im,(W-iw)/2,(H-ih)/2,iw,ih);
  dctx.globalCompositeOperation='destination-in';dctx.drawImage(mc,0,0,W,H);dirty=false;};
 const kick=()=>{if(tick||!alive)return;tick=true;requestAnimationFrame(()=>{tick=false;if(dirty)paint();if(!done&&touched&&performance.now()-lastCheck>220){lastCheck=performance.now();measure();}if(dirty||drawing)kick();});};
 const measure=()=>{tctx.clearRect(0,0,32,45);tctx.drawImage(mc,0,0,32,45);const d=tctx.getImageData(0,0,32,45).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>110)n++;ratio=n/(32*45);pct.textContent=Math.min(100,Math.round(ratio/.62*100))+'% INKED';if(ratio>.62&&!done)finish();};
 const seg=(a,b,w)=>{mctx.globalCompositeOperation='source-over';mctx.strokeStyle=mctx.fillStyle='#000';mctx.lineCap=mctx.lineJoin='round';mctx.lineWidth=w;mctx.beginPath();mctx.moveTo(a[0],a[1]);mctx.lineTo(b[0],b[1]);mctx.stroke();
  for(let i=0;i<2;i++){mctx.beginPath();mctx.arc(b[0]+R(-w,w),b[1]+R(-w,w),R(.8,2.6),0,7);mctx.fill();}dirty=true;touched=true;kick();};
 const pos=e=>{const r=area.getBoundingClientRect(),s=r.width?W/r.width:1;return[(e.clientX-r.left)*s,(e.clientY-r.top)*s];};
 const sign=(quiet)=>{done=true;card.classList.add('inked');pct.textContent='100% INKED';if(quiet)return;const c=cx(p.id);if(!c.inked){c.inked=Date.now();save();}once('cx:ink:'+p.id,1e6,'Inked a Manga card');navigator.vibrate&&navigator.vibrate([20,30,40]);if(!motion.reduced)host.animate([{transform:'none'},{transform:'translate(-6px,3px)'},{transform:'translate(5px,-4px)'},{transform:'translate(-3px,2px)'},{transform:'none'}],{duration:480});};
 const finish=()=>{done=true;const c=last||[W/2,H/2],t0=performance.now(),maxR=Math.hypot(W,H);const fl=()=>{const k=clamp((performance.now()-t0)/520,0,1);mctx.fillStyle='#000';mctx.beginPath();mctx.arc(c[0],c[1],maxR*k,0,7);mctx.fill();dirty=true;kick();if(k<1)requestAnimationFrame(fl);else sign(false);};fl();};
 const startPt={x:0,y:0};
 area.addEventListener('pointerdown',e=>{if(e.button>0||card.classList.contains('flipped')||done)return;drawing=true;moved=false;startPt.x=e.clientX;startPt.y=e.clientY;last=null;try{area.setPointerCapture(e.pointerId);}catch{}});
 area.addEventListener('pointermove',e=>{if(!drawing||done)return;if(!moved&&Math.hypot(e.clientX-startPt.x,e.clientY-startPt.y)<8)return;const pt=pos(e);if(!last){moved=true;last=pos({clientX:startPt.x,clientY:startPt.y});}const sp=Math.hypot(pt[0]-last[0],pt[1]-last[1]);seg(last,pt,clamp(40-sp*1.1,24,40)+R(-2,2));last=pt;});
 const up=()=>{drawing=false;if(touched&&!done)measure();};area.addEventListener('pointerup',up);area.addEventListener('pointercancel',up);
 tapper(card,()=>moved);
 // coming back to a page you already signed: it stays inked
 const full=()=>{mctx.fillStyle='#000';mctx.fillRect(0,0,W,H);dirty=true;touched=true;};
 im.onload=()=>{if(size()){dirty=true;if(cx(p.id).inked){full();sign(true);}kick();}};im.src=img.src;
 const ro=new ResizeObserver(()=>{if(area.offsetWidth&&area.offsetWidth!==W&&mc.width){const keep=document.createElement('canvas');keep.width=mc.width;keep.height=mc.height;keep.getContext('2d').drawImage(mc,0,0);size();mctx.drawImage(keep,0,0,W,H);dirty=true;kick();}});ro.observe(area);
 if(acts){rb=document.createElement('button');rb.className='link';rb.textContent='Blank page';rb.addEventListener('click',()=>{mctx.clearRect(0,0,W,H);done=false;touched=false;ratio=0;pct.textContent='0% INKED';card.classList.remove('inked');dirty=true;kick();});acts.appendChild(rb);}
 // show how it works, once, on a page nobody has inked yet
 let demo=0;if(!motion.reduced&&!cx(p.id).inked)demo=setTimeout(()=>{if(!card.isConnected||touched)return;let k=0,l=null;const N=60,st=()=>{if(!card.isConnected||drawing)return;const t=k/N,pt=[W*(.5+.36*Math.sin(t*Math.PI*6)),H*(.12+t*.42)];if(l)seg(l,pt,34);l=pt;k++;if(k<N)setTimeout(st,22);else{touched=false;ratio=0;}};st();},1300);
 return()=>{alive=false;clearTimeout(demo);ro.disconnect();rb&&rb.remove();};
}

/* ---------------------------------------------------------------- put the right move on the big card */
export function mount(card,p,r,host){
 card.addEventListener('contextmenu',e=>e.preventDefault());// a long press is Haki, not a menu
 if(r==='conq')return mountConq(card,p,host);
 if(r==='sun')return mountSun(card,p,host);
 if(r==='rm')return mountRed(card,p,host);
 if(r==='m')return mountInk(card,p,host);
 tapper(card);return()=>{};
}

/* ---------------------------------------------------------------- the openings (played in the chest ceremony) */
const NAMES={conq:['CONQUEROR','One of one · it chose you'],sun:['SUN GOD','Gear 5 · the drums of liberation'],rm:['RED MANGA','Printed in red ink'],m:['MANGA','Inked in black, signed 完']};
const LEN={conq:3600,sun:4400,rm:4400,m:5400};
// resolves when the person taps to carry on (or the ceremony is closed under it)
export function opening(L,p,r,cardHTML){
 if(motion.reduced||!NAMES[r])return Promise.resolve();
 return new Promise(res=>{
  const ov=document.createElement('div');ov.className='cx-o '+r;
  let inner='';
  if(r==='conq')inner=`<div class="o-bgl"></div><i class="o-wave" style="--wd:1.7s"></i><i class="o-wave" style="--wd:1.95s"></i><i class="o-wave" style="--wd:2.2s"></i><div class="o-shut t"></div><div class="o-shut b"></div>`;
  if(r==='rm')inner=`<div class="o-page">${PAN.map((id,i)=>`<div style="--pd:${(i*.12).toFixed(2)}s;--fx:${i%2?'70px':'-70px'}"><img src="assets/panels/${id}.webp" alt=""></div>`).join('')}${PAN.slice(0,3).map((id,i)=>`<div style="--pd:${(.7+i*.1).toFixed(2)}s;--fx:${i%2?'-70px':'70px'}"><img src="assets/panels/${id}.webp" alt=""></div>`).join('')}</div><div class="o-sfx">ドォン</div>`;
  if(r==='sun')inner=`<div class="o-sky"></div><i class="o-drum" style="--wd:.5s"></i><i class="o-drum" style="--wd:.95s"></i><i class="o-drum" style="--wd:1.4s"></i><i class="o-drum" style="--wd:1.85s"></i><div class="o-cl" style="left:-10vw;top:-10vh"></div><div class="o-cl" style="right:-20vw;top:0"></div><div class="o-cl" style="left:10vw;top:20vh"></div><div class="o-wf"></div>`;
  if(r==='m')inner=`<div class="o-pg">${['a','b','c','d','e'].map((a,i)=>`<div class="o-pn" style="grid-area:${a};--pd:${(i*.22).toFixed(2)}s"><img src="assets/panels/${PAN[i]}.webp" alt=""></div>`).join('')}</div><div class="o-speed"></div><div class="o-sfx">バァン</div><div class="o-curt"></div>`;
  ov.innerHTML=`${inner}<div class="o-stage"><div class="o-card">${cardHTML}</div><div class="o-lbl"><b>${NAMES[r][0]}</b><small>${NAMES[r][1]}</small></div></div><div class="o-tip">Tap to continue</div>`;
  L.appendChild(ov);
  const card=$('.tc',ov);card.classList.add('static','inked');
  void ov.offsetWidth;ov.classList.add('go');
  const t=[];let fin=false;
  const end=()=>{if(fin)return;fin=true;t.forEach(clearTimeout);clearInterval(poll);ov.classList.add('out');setTimeout(()=>ov.remove(),500);res();};
  if(r==='conq'){t.push(setTimeout(()=>cracks(ov,innerWidth/2,innerHeight*.46,{ms:1500,n:13}),350));t.push(setTimeout(()=>ov.animate([{transform:'none'},{transform:'translate(-9px,5px)'},{transform:'translate(8px,-6px)'},{transform:'translate(-4px,3px)'},{transform:'none'}],{duration:600}),900));}
  t.push(setTimeout(()=>ov.classList.add('done'),LEN[r]));
  t.push(setTimeout(end,20000));
  const poll=setInterval(()=>{if(!ov.isConnected)end();},300);
  let born=performance.now();
  ov.addEventListener('click',()=>{if(performance.now()-born>700)end();});
 });
}

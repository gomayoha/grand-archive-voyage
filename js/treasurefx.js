// What makes the Treasure Room feel like a room (Oct 22 2026), kept apart from treasure.js:
//  - heaps(): two mounds of gold coins, a few gems and pearls, painted once on a canvas beside the chest
//  - dust(): gold dust and a few soft lights drifting up through the lantern light, only while the room is open
//  - door(): the vault door you walk through: the wheel turns, the bolts slide back, the doors part on light
// Everything is drawn from nothing but gradients (no pictures, no cartoon): coins are shaded ellipses.
import {motion} from './core.js';

// a small seeded random, so the heaps look the same every time you walk in
const rng=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};

/* ---------------------------------------------------------------- the heaps */
function coin(c,x,y,r,tilt,lit,R){
 const ry=r*(0.36+R()*0.16),th=Math.max(1.4,r*0.2),hue=40+R()*8,L=34+lit*30+R()*8;
 c.save();c.translate(x,y);c.rotate(tilt);
 // the rim: the coin's thickness, darker, just below
 c.fillStyle=`hsl(${hue-2} 78% ${L*0.46}%)`;c.beginPath();c.ellipse(0,th,r,ry,0,0,Math.PI*2);c.fill();
 c.fillRect(-r,0,r*2,th);
 c.beginPath();c.ellipse(0,th,r,ry,0,0,Math.PI*2);c.fill();
 // the face
 const g=c.createRadialGradient(-r*.35,-ry*.45,0,0,0,r*1.15);
 g.addColorStop(0,`hsl(${hue+6} 100% ${Math.min(88,L+26)}%)`);g.addColorStop(.45,`hsl(${hue} 88% ${L}%)`);g.addColorStop(1,`hsl(${hue-4} 80% ${L*0.52}%)`);
 c.fillStyle=g;c.beginPath();c.ellipse(0,0,r,ry,0,0,Math.PI*2);c.fill();
 // the struck edge and the stamped ring inside it
 c.lineWidth=Math.max(.6,r*.07);c.strokeStyle=`hsl(${hue+4} 90% ${Math.min(90,L+30)}%)`;c.globalAlpha=.7;c.beginPath();c.ellipse(0,0,r*.9,ry*.88,0,Math.PI*1.05,Math.PI*1.9);c.stroke();
 c.globalAlpha=.35;c.strokeStyle=`hsl(${hue-6} 80% ${L*0.4}%)`;c.beginPath();c.ellipse(0,0,r*.62,ry*.6,0,0,Math.PI*2);c.stroke();
 c.restore();
}
function gem(c,x,y,s,col,R){
 c.save();c.translate(x,y);c.rotate((R()-.5)*.8);
 const pts=[[0,-s],[s*.8,-s*.25],[s*.55,s*.8],[-s*.55,s*.8],[-s*.8,-s*.25]];
 const g=c.createLinearGradient(-s,-s,s,s);g.addColorStop(0,col[0]);g.addColorStop(.5,col[1]);g.addColorStop(1,col[2]);
 c.fillStyle=g;c.beginPath();pts.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.closePath();c.fill();
 c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=.7;c.beginPath();c.moveTo(0,-s);c.lineTo(0,s*.8);c.moveTo(-s*.8,-s*.25);c.lineTo(s*.8,-s*.25);c.stroke();
 c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.arc(-s*.22,-s*.3,s*.14,0,6.3);c.fill();
 c.restore();
}
function pearl(c,x,y,r){
 const g=c.createRadialGradient(x-r*.35,y-r*.4,0,x,y,r);g.addColorStop(0,'#fff');g.addColorStop(.5,'#efe6da');g.addColorStop(1,'#a79a8b');
 c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,6.3);c.fill();
}
export function heaps(cv){
 const host=cv.parentElement,w=host.clientWidth,h=cv.clientHeight;if(!w||!h)return;
 const dpr=Math.min(2,devicePixelRatio||1);cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);
 const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
 const R=rng(2210),phone=w<520,base=h-4;
 const mounds=phone?[[.1,.4,.9],[.9,.4,1],[.31,.14,.34],[.7,.14,.36]]:[[.12,.3,1],[.88,.3,1.1],[.29,.13,.46],[.71,.13,.5],[.03,.14,.42]];
 // every coin of every mound goes into one list and is drawn from the back (top of a mound) to the front
 const all=[],gemCols=[['#ff8a9a','#d1163a','#6d0b20'],['#9bf0c0','#12a15b','#0a5a33'],['#9fd0ff','#2a64d6','#14307a'],['#e3c6ff','#8a45d6','#43207a']];
 for(const [fx,fw,fs] of mounds){
  const cx=w*fx,Rm=Math.max(34,w*fw*fs*.5),Hm=Math.min(h*.92,Rm*.92),n=Math.round(Rm*Hm/13);
  for(let i=0;i<n;i++){
   const u=(R()*2-1),dx=u*Rm,top=Hm*Math.pow(Math.max(0,1-u*u),.72),v=Math.pow(R(),.55);
   const y=base-top*(1-v*.9)-R()*4,r=(phone?5:6.4)+R()*3.2;
   all.push({k:'c',x:cx+dx,y,r,tilt:(R()-.5)*1.1+(u*.35),lit:Math.min(1,(top?(base-y)/Hm:0)+.1)});
  }
  for(let i=0;i<Math.round(7*fs);i++){const u=R()*2-1,top=Hm*Math.pow(Math.max(0,1-u*u),.72);all.push({k:'g',x:cx+u*Rm*.8,y:base-top*(.62+R()*.4),s:5+R()*4.5,col:gemCols[(R()*4)|0]});}
  for(let i=0;i<Math.round(9*fs);i++){const u=R()*2-1,top=Hm*Math.pow(Math.max(0,1-u*u),.72);all.push({k:'p',x:cx+u*Rm*.85,y:base-top*(.4+R()*.55),r:2.4+R()*1.9});}
 }
 all.sort((a,b)=>a.y-b.y);
 for(const o of all){if(o.k==='c')coin(c,o.x,o.y,o.r,o.tilt,o.lit,R);else if(o.k==='g')gem(c,o.x,o.y,o.s,o.col,R);else pearl(c,o.x,o.y,o.r);}
 // the edges melt away (sides into the wall, bottom into the floor), so the heaps sit in the room rather than in a box
 c.globalCompositeOperation='destination-out';
 const fade=(x0,y0,x1,y1,a0,a1,rx,ry,rw,rh)=>{const g=c.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,`rgba(0,0,0,${a0})`);g.addColorStop(1,`rgba(0,0,0,${a1})`);c.fillStyle=g;c.fillRect(rx,ry,rw,rh);};
 const e=w*.09;fade(0,0,e,0,1,0,0,0,e,h);fade(w-e,0,w,0,0,1,w-e,0,e,h);fade(0,h*.66,0,h,0,1,0,h*.66,w,h*.34);
 c.globalCompositeOperation='source-over';
}

/* ---------------------------------------------------------------- dust in the lantern light */
export function dust(cv,isCovered){
 const c=cv.getContext('2d');let W=0,H=0,raf=0,last=0,live=false;const R=Math.random;
 const size=()=>{const dpr=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);c.setTransform(dpr,0,0,dpr,0,0);};
 const mote=(y)=>({x:R()*W,y:y??R()*H,r:.5+R()*1.7,v:5+R()*13,ph:R()*6.3,sw:6+R()*16,tw:.6+R()*1.8,a:.25+R()*.6,bokeh:false});
 const bok=()=>({...mote(),r:10+R()*26,v:2+R()*5,a:.05+R()*.06,bokeh:true});
 let P=[];
 const fill=()=>{const n=Math.min(90,Math.round(W*H/16000));P=Array.from({length:n},()=>mote());for(let i=0;i<6;i++)P.push(bok());};
 const frame=t=>{
  raf=requestAnimationFrame(frame);
  const dt=Math.min(.05,(t-last)/1000||.016);last=t;
  if(document.hidden||isCovered())return;
  c.clearRect(0,0,W,H);
  for(const p of P){
   p.y-=p.v*dt;p.ph+=dt*p.tw;const x=p.x+Math.sin(p.ph*.7)*p.sw;
   if(p.y<-40){p.y=H+30;p.x=R()*W;}
   const a=p.a*(p.bokeh?1:.55+.45*Math.sin(p.ph*2.2));
   if(p.bokeh){const g=c.createRadialGradient(x,p.y,0,x,p.y,p.r);g.addColorStop(0,`rgba(255,214,130,${a})`);g.addColorStop(1,'rgba(255,214,130,0)');c.fillStyle=g;c.beginPath();c.arc(x,p.y,p.r,0,6.3);c.fill();}
   else{c.fillStyle=`rgba(255,226,160,${a})`;c.beginPath();c.arc(x,p.y,p.r,0,6.3);c.fill();if(p.r>1.4){c.fillStyle=`rgba(255,214,130,${a*.18})`;c.beginPath();c.arc(x,p.y,p.r*3.4,0,6.3);c.fill();}}
  }
 };
 const onSize=()=>{size();fill();};
 return{
  start(){if(live||motion.reduced)return;live=true;onSize();addEventListener('resize',onSize);raf=requestAnimationFrame(frame);},
  stop(){live=false;cancelAnimationFrame(raf);removeEventListener('resize',onSize);c.clearRect(0,0,W,H);}
 };
}

/* ---------------------------------------------------------------- the vault door */
const WHEEL=(()=>{
 const spokes=Array.from({length:8},(_,i)=>{const a=i*45;return `<g transform="rotate(${a} 100 100)"><rect x="96" y="22" width="8" height="64" rx="3" fill="url(#tdg)"/><circle cx="100" cy="16" r="9" fill="url(#tdg)" stroke="#3a2608" stroke-width="1.2"/><circle cx="100" cy="16" r="3.4" fill="#2a1a06"/></g>`;}).join('');
 return `<svg viewBox="0 0 200 200" aria-hidden="true"><defs><linearGradient id="tdg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".45" stop-color="#d9a640"/><stop offset="1" stop-color="#7d5516"/></linearGradient><radialGradient id="tdh" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#3a2d1a"/><stop offset="1" stop-color="#0d0904"/></radialGradient><path id="tdc" d="M100 100m-61 0a61 61 0 1 1 122 0a61 61 0 1 1-122 0"/></defs>
  <circle cx="100" cy="100" r="98" fill="#0b0805" stroke="url(#tdg)" stroke-width="3"/><circle cx="100" cy="100" r="92" fill="none" stroke="rgba(243,201,105,.35)" stroke-width="1"/>
  <circle cx="100" cy="100" r="78" fill="url(#tdh)" stroke="url(#tdg)" stroke-width="2"/>
  <text font-family="Georgia,serif" font-size="9.5" fill="#e2b55c"><textPath href="#tdc" startOffset="0" textLength="381" lengthAdjust="spacing">THE GRAND ARCHIVE · THE TREASURE ROOM · </textPath></text>
  <g class="td-spokes">${spokes}</g>
  <circle cx="100" cy="100" r="30" fill="url(#tdg)" stroke="#3a2608" stroke-width="2"/><circle cx="100" cy="100" r="22" fill="url(#tdh)" stroke="rgba(255,226,160,.7)" stroke-width="1.4"/>
  <text x="100" y="109" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="26" fill="#f3c969">G</text></svg>`;
})();

// resolves when the doors have parted (or been skipped); calls onOpen the moment the room is revealed
export function door(host,{fast=false}={}){
 return new Promise(done=>{
  if(motion.reduced){done();return;}
  const el=document.createElement('div');el.className='tr-door';el.setAttribute('aria-hidden','true');
  el.innerHTML=`<i class="td-flood"></i><i class="td-half l"></i><i class="td-half r"></i><i class="td-bolt l"></i><i class="td-bolt r"></i><div class="td-lock">${WHEEL}</div><p class="td-cap">The Treasure Room</p>`;
  host.appendChild(el);
  const k=fast?.5:1;
  const lock=el.querySelector('.td-lock'),L=el.querySelector('.td-half.l'),Rr=el.querySelector('.td-half.r'),bl=el.querySelector('.td-bolt.l'),br=el.querySelector('.td-bolt.r'),flood=el.querySelector('.td-flood'),cap=el.querySelector('.td-cap');
  const anims=[];let ended=false;
  const end=()=>{if(ended)return;ended=true;anims.forEach(a=>{try{a.cancel();}catch{}});el.remove();removeEventListener('keydown',key,true);done();};
  const key=e=>{if(e.key==='Escape'||e.key===' '||e.key==='Enter'){e.stopPropagation();e.preventDefault();end();}};
  addEventListener('keydown',key,true);el.addEventListener('click',end);
  const ease='cubic-bezier(.6,0,.2,1)';
  anims.push(lock.animate([{transform:'scale(.9) rotate(0deg)',opacity:0},{transform:'scale(1) rotate(0deg)',opacity:1,offset:.14},{transform:'scale(1) rotate(-560deg)',opacity:1}],{duration:1300*k,easing:ease,fill:'forwards'}));
  anims.push(cap.animate([{opacity:0,transform:'translate3d(0,8px,0)'},{opacity:1,transform:'none'}],{duration:700*k,delay:150*k,easing:'ease-out',fill:'forwards'}));
  anims.push(bl.animate([{transform:'none'},{transform:'translate3d(-60%,0,0)'}],{duration:520*k,delay:760*k,easing:ease,fill:'forwards'}));
  anims.push(br.animate([{transform:'none'},{transform:'translate3d(60%,0,0)'}],{duration:520*k,delay:760*k,easing:ease,fill:'forwards'}));
  anims.push(lock.animate([{opacity:1,transform:'scale(1) rotate(-560deg)'},{opacity:0,transform:'scale(1.18) rotate(-600deg)'}],{duration:380*k,delay:1250*k,easing:'ease-in',fill:'forwards'}));
  const open=1450*k,dur=1050*k;
  anims.push(L.animate([{transform:'none'},{transform:'translate3d(-101%,0,0)'}],{duration:dur,delay:open,easing:ease,fill:'forwards'}));
  anims.push(Rr.animate([{transform:'none'},{transform:'translate3d(101%,0,0)'}],{duration:dur,delay:open,easing:ease,fill:'forwards'}));
  anims.push(bl.animate([{opacity:1},{opacity:0}],{duration:200*k,delay:open,fill:'forwards'}));anims.push(br.animate([{opacity:1},{opacity:0}],{duration:200*k,delay:open,fill:'forwards'}));
  anims.push(flood.animate([{opacity:0},{opacity:.95,offset:.22},{opacity:0}],{duration:dur*1.5,delay:open-60*k,easing:'ease-out',fill:'forwards'}));
  anims.push(cap.animate([{opacity:1},{opacity:0}],{duration:300*k,delay:open-100*k,fill:'forwards'}));
  setTimeout(end,open+dur+120*k);
 });
}

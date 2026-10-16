// Devil Fruit powers. A fruit found in a Treasure Room chest can be eaten, and from then on the whole archive
// answers your taps with its power (one fruit at a time, like the real thing):
//  Mera Mera (Ace): fire bursts where you tap and embers follow the mouse.
//  Goro Goro (Enel): a bolt of lightning comes down out of the sky onto the spot.
//  Hie Hie (Aokiji): frost grows out from the tap and the pictures it reaches freeze over.
//  Ope Ope (Law): ROOM, a blue sphere; the pictures inside trade places (Shambles), then trade back.
//  Bara Bara (Buggy): the picture you tap comes apart in pieces and pulls itself back together.
//  Yami Yami (Blackbeard): a black hole pulls in everything near it, then lets go.
//  Hana Hana (Robin): petals open where you tap and the pictures around it bloom.
// Only taps count (a scroll never sets anything off). Effects are drawn on one canvas that only runs while
// something is on it; pictures only ever move with translate/scale/rotate animations, so nothing breaks.
import {motion,coarse} from './core.js';
import {B,save,notice,openTreasure} from './bounty.js';

const FR={
 mera:{name:'Mera Mera no Mi',kana:'メラメラ',h1:'#ff6a2b',h2:'#ffd23f',words:[['Hiken!','Fire Fist'],['Hibashira!','Pillar of fire'],['Higan!','Fire guns'],['Dai Enkai!','Great flame']]},
 goro:{name:'Goro Goro no Mi',kana:'ゴロゴロ',h1:'#7fd0ff',h2:'#ffffff',words:[['El Thor!','Lightning'],['Kiten!','Kiten'],['Raigo!','Thunder cloud'],['Sango!','200 million volts']]},
 hie:{name:'Hie Hie no Mi',kana:'ヒエヒエ',h1:'#a9e6ff',h2:'#e9fbff',words:[['Ice Age!','Ice Age'],['Ice Time!','Ice Time'],['Ice Block!','Partisan'],['Ice Saber!','Ice Saber']]},
 ope:{name:'Ope Ope no Mi',kana:'オペオペ',h1:'#5aa8ff',h2:'#c9e3ff',words:[['ROOM','Shambles!']]},
 bara:{name:'Bara Bara no Mi',kana:'バラバラ',h1:'#ff4f6d',h2:'#ffd1d9',words:[['Bara Bara Festival!','Chop-chop'],['Bara Bara Hō!','Chop-chop cannon'],['Kirabara!','Chop-chop split']]},
 yami:{name:'Yami Yami no Mi',kana:'ヤミヤミ',h1:'#8a63ff',h2:'#1a0f33',words:[['Kurouzu!','Black hole'],['Black Hole!','Darkness'],['Liberation!','Kaihō']]},
 hana:{name:'Hana Hana no Mi',kana:'ハナハナ',h1:'#ff8fc6',h2:'#ffe3f1',words:[['Cien Fleur!','A hundred flowers'],['Mil Fleur!','A thousand flowers'],['Seis Fleur!','Six flowers']]}
};
let cur=null,cv=null,ctx=null,dpr=1,raf=0,parts=[],bolts=[],rings=[],badge=null,down=null,moved=0;
const rnd=(a,b)=>a+Math.random()*(b-a);

/* ---------------------------------------------------------------- eating */
export function eat(id,{quiet=false,fromRoom=false}={}){
 const f=FR[id];if(!f)return;cur=id;B.eat=id;save();
 setup();showBadge();
 if(!quiet)notice(`You ate the ${f.name}`,coarse?'Tap anywhere on the archive to use it.':'Click anywhere on the archive to use it.');
 if(fromRoom&&!quiet)setTimeout(()=>word(innerWidth/2,innerHeight*0.45,f.words[0]),200);
}
export function spit(){if(!cur)return;const f=FR[cur];cur=null;B.eat=null;save();badge?.classList.remove('in');notice('Spat it out',`The ${f.name} is back in the Treasure Room.`);}

function setup(){
 if(cv)return;
 cv=document.createElement('canvas');cv.className='df-canvas';cv.setAttribute('aria-hidden','true');document.body.appendChild(cv);ctx=cv.getContext('2d');
 const size=()=>{dpr=Math.min(2,devicePixelRatio||1);cv.width=innerWidth*dpr;cv.height=innerHeight*dpr;};size();addEventListener('resize',size);
 // a tap: down and up close together, without a scroll in between
 addEventListener('pointerdown',e=>{if(!e.isPrimary)return;down={x:e.clientX,y:e.clientY,t:performance.now(),el:e.target};moved=0;},{passive:true,capture:true});
 addEventListener('pointerup',e=>{if(!down||!cur)return;const d=Math.hypot(e.clientX-down.x,e.clientY-down.y),dt=performance.now()-down.t;const t=down;down=null;if(d<12&&dt<600)use(t.x,t.y,t.el);},{passive:true,capture:true});
 addEventListener('scroll',()=>{down=null;},{passive:true});
 // fire follows the mouse
 let last=0;addEventListener('pointermove',e=>{if(cur!=='mera'||e.pointerType!=='mouse'||blocked())return;const n=performance.now();if(n-last<28)return;last=n;for(let i=0;i<2;i++)ember(e.clientX,e.clientY,true);loop();},{passive:true});
}
function showBadge(){
 const f=FR[cur];
 if(!badge){badge=document.createElement('button');badge.className='df-badge';badge.addEventListener('click',e=>{e.stopPropagation();openTreasure('fruits');});document.body.appendChild(badge);}
 badge.style.setProperty('--h1',f.h1);badge.style.setProperty('--h2',f.h2);badge.title=`${f.name}: tap anywhere to use it. Tap here to spit it out.`;badge.setAttribute('aria-label',`${f.name}. Open the Devil Fruits in the Treasure Room`);
 badge.innerHTML=`<span>${f.kana.slice(0,2)}</span>`;requestAnimationFrame(()=>badge.classList.add('in'));
}
const blocked=()=>motion.reduced||document.documentElement.classList.contains('wm-on')||!!document.querySelector('dialog[open]')||!!document.querySelector('.tn.in');

/* ---------------------------------------------------------------- using it */
let uses=0;
function use(x,y,el){
 if(!cur||blocked())return;if(el instanceof Element&&el.closest('.df-badge,.av,.bt-toast'))return;
 const f=FR[cur];uses++;badge?.classList.remove('pulse');void badge?.offsetWidth;badge?.classList.add('pulse');
 if(uses===1||Math.random()<0.34)word(x,y-70,f.words[Math.floor(Math.random()*f.words.length)],f.h1);
 ({mera,goro,hie,ope,bara,yami,hana})[cur](x,y,el);loop();
}
function word(x,y,[w,sub],c){
 const el=document.createElement('div');el.className='df-word';el.style.left=x+'px';el.style.top=Math.max(90,y)+'px';el.style.setProperty('--c',c||FR[cur]?.h1||'#fff');el.innerHTML=`<span>${w}</span><small>${sub}</small>`;document.body.appendChild(el);
 el.animate([{opacity:0,transform:'translate3d(0,14px,0) scale(.8)'},{opacity:1,transform:'none',offset:.2},{opacity:1,offset:.7},{opacity:0,transform:'translate3d(0,-26px,0) scale(1.04)'}],{duration:1500,easing:'cubic-bezier(.2,.7,.3,1)'}).finished.then(()=>el.remove());
}
// the pictures near a point (what's on screen, nearest first)
function picsNear(x,y,R,max=10){
 const out=[];for(const im of document.querySelectorAll('main img,.ar-open img')){const r=im.getBoundingClientRect();if(r.width<30||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)continue;
  const cx=r.left+r.width/2,cy=r.top+r.height/2,d=Math.hypot(cx-x,cy-y);if(d<R+Math.max(r.width,r.height)/2&&getComputedStyle(im).visibility!=='hidden')out.push({im,r,cx,cy,d});}
 return out.sort((a,b)=>a.d-b.d).slice(0,max);
}
const picAt=(x,y)=>document.elementsFromPoint(x,y).find(e=>e.tagName==='IMG'&&e.getBoundingClientRect().width>40);

/* ---------------------------------------------------------------- the powers */
function ember(x,y,small){parts.push({k:'fire',x,y,vx:rnd(-.6,.6),vy:rnd(-2.2,-.8)*(small?0.6:1),life:0,max:rnd(30,60)*(small?0.7:1),s:rnd(small?6:10,small?14:28)});}
function mera(x,y){
 for(let i=0;i<70;i++){const a=rnd(0,Math.PI*2),v=rnd(1,6);parts.push({k:'fire',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-2.5,life:0,max:rnd(34,70),s:rnd(14,40)});}
 for(let i=0;i<26;i++)parts.push({k:'spark',x,y,vx:rnd(-7,7),vy:rnd(-11,-2),life:0,max:rnd(40,80),s:rnd(1.2,2.6)});
 rings.push({x,y,r:6,max:150,life:0,dur:30,c:'255,140,60'});
}
function goro(x,y,el){
 // a bolt from the top of the screen down to the tap, re-struck a few times so it flickers
 const sx=x+rnd(-160,160);for(let k=0;k<3;k++)bolts.push({pts:jag(sx,-20,x,y,8),born:performance.now()+k*90,dur:260+k*40,w:k?1.6:3.2});
 flash('rgba(200,235,255,.32)',90);
 for(let i=0;i<34;i++){const a=rnd(-Math.PI,0),v=rnd(2,9);parts.push({k:'spark',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:0,max:rnd(20,45),s:rnd(1,2.4),c:'200,235,255'});}
 rings.push({x,y,r:4,max:120,life:0,dur:22,c:'170,220,255'});
 const p=picAt(x,y);if(p)p.animate([{translate:'0 0'},{translate:'-5px 2px'},{translate:'4px -3px'},{translate:'-3px 1px'},{translate:'0 0'}],{duration:320});
}
function jag(x1,y1,x2,y2,depth){
 let pts=[[x1,y1],[x2,y2]];
 for(let d=0;d<depth;d++){const n=[pts[0]];for(let i=1;i<pts.length;i++){const [ax,ay]=pts[i-1],[bx,by]=pts[i],len=Math.hypot(bx-ax,by-ay);n.push([(ax+bx)/2+rnd(-.5,.5)*len*0.28,(ay+by)/2+rnd(-.5,.5)*len*0.12],[bx,by]);}pts=n;}
 return pts;
}
function hie(x,y){
 // frost: crystals branch out from the tap, drawn growing
 const arms=9+Math.floor(Math.random()*4);
 for(let a=0;a<arms;a++){const ang=a/arms*Math.PI*2+rnd(-.2,.2);grow(x,y,ang,rnd(90,170),3,0);}
 for(let i=0;i<30;i++){const a=rnd(0,Math.PI*2),v=rnd(.5,3);parts.push({k:'snow',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:0,max:rnd(50,90),s:rnd(1.2,3)});}
 rings.push({x,y,r:8,max:200,life:0,dur:40,c:'200,240,255'});
 picsNear(x,y,170,8).forEach(({im},i)=>setTimeout(()=>{im.classList.add('df-frozen');setTimeout(()=>im.classList.remove('df-frozen'),1700);},i*70));
}
function grow(x,y,ang,len,depth,delay){
 const ex=x+Math.cos(ang)*len,ey=y+Math.sin(ang)*len;
 parts.push({k:'ice',x,y,ex,ey,life:-delay,max:70,w:depth*0.9});
 if(depth>1)for(let s=0;s<2;s++){const t=rnd(.35,.75),bx=x+(ex-x)*t,by=y+(ey-y)*t;grow(bx,by,ang+(s?1:-1)*rnd(.5,.9),len*rnd(.35,.5),depth-1,delay+t*10);}
}
function ope(x,y){
 const R=Math.min(innerWidth,innerHeight)*0.36;
 rings.push({k:'room',x,y,r:10,max:R,life:0,dur:150});
 // Shambles: the pictures inside the room trade places, then trade back when the room closes
 const inside=picsNear(x,y,R*0.75,8).filter(p=>p.im.currentSrc);if(inside.length<2)return;
 setTimeout(()=>{
  const ims=inside.map(p=>p.im),orig=ims.map(im=>({src:im.getAttribute('src'),srcset:im.getAttribute('srcset')}));
  const swap=list=>ims.forEach((im,i)=>{const o=list[i];im.animate([{scale:'1',opacity:1},{scale:'.85',opacity:.2},{scale:'1',opacity:1}],{duration:420});setTimeout(()=>{if(o.srcset)im.setAttribute('srcset',o.srcset);else im.removeAttribute('srcset');im.setAttribute('src',o.src);},200);});
  const rot=orig.slice(1).concat(orig[0]);swap(rot);
  word(x,y+R*0.55,['Shambles!','Swap'],'#5aa8ff');
  setTimeout(()=>swap(orig),3600);
 },650);
}
function bara(x,y){
 const im=picAt(x,y);
 if(!im){for(let i=0;i<3;i++)rings.push({k:'slash',x,y,a:rnd(-1.2,1.2)+i*0.9,len:rnd(90,160),life:0,dur:24});return;}
 const r=im.getBoundingClientRect(),cs=getComputedStyle(im),N=3,src=im.currentSrc||im.src,pieces=[];
 for(let i=0;i<N;i++)for(let j=0;j<N;j++){
  const w=r.width/N,h=r.height/N,p=document.createElement('div');p.className='df-piece';p.style.cssText=`left:${r.left+i*w}px;top:${r.top+j*h}px;width:${w+0.5}px;height:${h+0.5}px`;
  p.innerHTML=`<img src="${src}" alt="" style="left:${-i*w}px;top:${-j*h}px;width:${r.width}px;height:${r.height}px;object-fit:${cs.objectFit};object-position:${cs.objectPosition}">`;document.body.appendChild(p);pieces.push([p,i-1,j-1]);}
 im.style.visibility='hidden';
 const anims=pieces.map(([p,i,j])=>{const dx=(i+rnd(-.4,.4))*rnd(40,110),dy=(j+rnd(-.4,.4))*rnd(40,110)-30,rot=rnd(-40,40);
  return p.animate([{transform:'none'},{transform:`translate3d(${dx}px,${dy}px,0) rotate(${rot}deg)`,offset:.35},{transform:`translate3d(${dx*1.1}px,${dy*1.1+8}px,0) rotate(${rot*1.2}deg)`,offset:.6},{transform:'none'}],{duration:1500,easing:'cubic-bezier(.3,.7,.3,1)'}).finished;});
 Promise.all(anims).then(()=>{pieces.forEach(([p])=>p.remove());im.style.visibility='';});
}
function yami(x,y){
 rings.push({k:'hole',x,y,r:0,max:70,life:0,dur:110});
 for(let i=0;i<60;i++){const a=rnd(0,Math.PI*2),d=rnd(60,260);parts.push({k:'dark',cx:x,cy:y,a,d,life:0,max:rnd(60,100),s:rnd(1.5,3.5)});}
 picsNear(x,y,280,12).forEach(({im,cx,cy})=>{const dx=(x-cx)*0.55,dy=(y-cy)*0.55,rot=rnd(-25,25);
  im.animate([{translate:'0 0',scale:'1',rotate:'0deg'},{translate:`${dx}px ${dy}px`,scale:'.55',rotate:`${rot}deg`,offset:.5},{translate:`${dx*0.9}px ${dy*0.9}px`,scale:'.6',rotate:`${rot}deg`,offset:.62},{translate:'0 0',scale:'1',rotate:'0deg'}],{duration:1900,easing:'cubic-bezier(.5,0,.3,1)'});});
}
function hana(x,y){
 for(let i=0;i<46;i++){const a=rnd(0,Math.PI*2),v=rnd(1.5,6.5);parts.push({k:'petal',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-2,life:0,max:rnd(80,140),s:rnd(6,12),rot:rnd(0,6.28),vr:rnd(-.15,.15),c:Math.random()<0.35?'255,250,252':Math.random()<0.5?'255,182,214':'255,140,190'});}
 // a ring of small flowers opens around the tap
 const n=12,R=rnd(70,100);for(let i=0;i<n;i++){const a=i/n*Math.PI*2;parts.push({k:'flower',x:x+Math.cos(a)*R,y:y+Math.sin(a)*R,life:-i*2,max:70,s:rnd(8,13),rot:a});}
 picsNear(x,y,200,8).forEach(({im},i)=>im.animate([{scale:'1',filter:'none'},{scale:'1.05',filter:'saturate(1.4) brightness(1.08)',offset:.4},{scale:'1',filter:'none'}],{duration:1100,delay:i*60,easing:'ease-out'}));
}
function flash(c,ms){const el=document.createElement('div');el.style.cssText=`position:fixed;inset:0;z-index:382;pointer-events:none;background:${c}`;document.body.appendChild(el);el.animate([{opacity:1},{opacity:0}],{duration:ms*3,easing:'ease-out'}).finished.then(()=>el.remove());}

/* ---------------------------------------------------------------- drawing */
const sprites={};
function sprite(key,stops){if(sprites[key])return sprites[key];const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);stops.forEach(([o,col])=>gr.addColorStop(o,col));g.fillStyle=gr;g.fillRect(0,0,64,64);return sprites[key]=c;}
function loop(){if(!raf)raf=requestAnimationFrame(draw);}
function draw(){
 raf=0;const W=innerWidth,H=innerHeight;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
 const fire=sprite('fire',[[0,'rgba(255,250,220,1)'],[.25,'rgba(255,200,80,.9)'],[.55,'rgba(255,90,20,.45)'],[1,'rgba(255,40,0,0)']]);
 const glow=sprite('glow',[[0,'rgba(255,255,255,1)'],[.4,'rgba(255,255,255,.35)'],[1,'rgba(255,255,255,0)']]);
 const now=performance.now();
 // rings, rooms, holes, slashes
 rings=rings.filter(r=>{r.life++;const t=r.life/r.dur;if(t>=1)return false;
  if(r.k==='room'){const g=Math.min(1,t*4),e=1-Math.pow(1-g,3),rad=r.max*e,a=t<.8?1:(1-t)/0.2;
   ctx.globalCompositeOperation='source-over';ctx.fillStyle=`rgba(90,168,255,${0.12*a})`;ctx.beginPath();ctx.arc(r.x,r.y,rad,0,7);ctx.fill();
   ctx.strokeStyle=`rgba(190,225,255,${0.85*a})`;ctx.lineWidth=2;ctx.stroke();ctx.strokeStyle=`rgba(90,168,255,${0.35*a})`;ctx.lineWidth=9;ctx.stroke();
   ctx.save();ctx.setLineDash([4,10]);ctx.lineDashOffset=-r.life;ctx.strokeStyle=`rgba(190,225,255,${0.5*a})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(r.x,r.y,rad,rad*0.32,0,0,7);ctx.stroke();ctx.restore();return true;}
  if(r.k==='hole'){const g=t<.15?t/.15:t>.75?(1-t)/.25:1,rad=r.max*g;ctx.globalCompositeOperation='source-over';
   const gr=ctx.createRadialGradient(r.x,r.y,0,r.x,r.y,rad*2.2);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.42,'rgba(5,0,15,.95)');gr.addColorStop(.5,'rgba(138,99,255,.55)');gr.addColorStop(.62,'rgba(60,30,120,.25)');gr.addColorStop(1,'rgba(0,0,0,0)');
   ctx.fillStyle=gr;ctx.beginPath();ctx.arc(r.x,r.y,rad*2.2,0,7);ctx.fill();return true;}
  if(r.k==='slash'){const g=Math.min(1,t*3),a=1-t;ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(255,120,150,${a})`;ctx.lineWidth=3;ctx.beginPath();const dx=Math.cos(r.a)*r.len,dy=Math.sin(r.a)*r.len;ctx.moveTo(r.x-dx*g,r.y-dy*g);ctx.lineTo(r.x+dx*g,r.y+dy*g);ctx.stroke();return true;}
  const e=1-Math.pow(1-t,3);ctx.globalCompositeOperation='lighter';ctx.strokeStyle=`rgba(${r.c},${(1-t)*0.7})`;ctx.lineWidth=3*(1-t)+0.5;ctx.beginPath();ctx.arc(r.x,r.y,r.r+(r.max-r.r)*e,0,7);ctx.stroke();return true;});
 // lightning
 bolts=bolts.filter(b=>{const t=(now-b.born)/b.dur;if(t<0)return true;if(t>=1)return false;const a=1-t;
  ctx.globalCompositeOperation='lighter';ctx.lineJoin='round';
  [[b.w*7,`rgba(110,190,255,${0.18*a})`],[b.w*2.6,`rgba(170,220,255,${0.55*a})`],[b.w,`rgba(255,255,255,${a})`]].forEach(([w,c])=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();b.pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();});return true;});
 // particles
 parts=parts.filter(p=>{p.life++;if(p.life<0)return true;const t=p.life/p.max;if(t>=1)return false;
  switch(p.k){
   case 'fire':{p.x+=p.vx;p.y+=p.vy;p.vx*=0.96;p.vy=p.vy*0.97-0.07;const s=p.s*(1-t*0.6);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(1-t)*0.9;ctx.drawImage(fire,p.x-s/2,p.y-s/2,s,s);break;}
   case 'spark':{p.x+=p.vx;p.y+=p.vy;p.vy+=0.25;p.vx*=0.98;ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-t;ctx.fillStyle=`rgb(${p.c||'255,210,120'})`;ctx.fillRect(p.x,p.y,p.s,p.s);break;}
   case 'snow':{p.x+=p.vx;p.y+=p.vy;p.vx*=0.97;p.vy=p.vy*0.97+0.04;ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(1-t)*0.9;const s=p.s*4;ctx.drawImage(glow,p.x-s/2,p.y-s/2,s,s);break;}
   case 'ice':{const g=Math.min(1,p.life/14),a=t<0.6?1:(1-t)/0.4;ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;ctx.strokeStyle='rgba(200,240,255,.9)';ctx.lineWidth=p.w;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+(p.ex-p.x)*g,p.y+(p.ey-p.y)*g);ctx.stroke();ctx.strokeStyle='rgba(120,200,255,.25)';ctx.lineWidth=p.w*4;ctx.stroke();break;}
   case 'dark':{const k=1-Math.pow(t,0.7);const d=p.d*k,a=p.a+t*5;const x=p.cx+Math.cos(a)*d,y=p.cy+Math.sin(a)*d*0.8;ctx.globalCompositeOperation='source-over';ctx.globalAlpha=Math.min(1,t*4)*(1-t);ctx.fillStyle=t<0.5?'rgba(160,120,255,1)':'rgba(30,10,60,1)';ctx.beginPath();ctx.arc(x,y,p.s,0,7);ctx.fill();break;}
   case 'petal':{p.x+=p.vx+Math.sin(p.life*0.08+p.rot)*0.6;p.y+=p.vy;p.vx*=0.97;p.vy=p.vy*0.97+0.05;p.rot+=p.vr;ctx.globalCompositeOperation='source-over';ctx.globalAlpha=t<0.8?1:(1-t)/0.2;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.scale(1,0.55+0.45*Math.abs(Math.sin(p.life*0.1+p.rot)));ctx.fillStyle=`rgba(${p.c},.95)`;ctx.beginPath();ctx.ellipse(0,0,p.s,p.s*0.55,0,0,7);ctx.fill();ctx.restore();break;}
   case 'flower':{const g=Math.min(1,p.life/16),a=t<0.7?1:(1-t)/0.3;ctx.globalCompositeOperation='source-over';ctx.globalAlpha=a;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot+p.life*0.01);ctx.scale(g,g);ctx.fillStyle='rgba(255,170,210,.95)';for(let k=0;k<5;k++){ctx.rotate(Math.PI*2/5);ctx.beginPath();ctx.ellipse(p.s*0.55,0,p.s*0.55,p.s*0.32,0,0,7);ctx.fill();}ctx.fillStyle='#ffe08a';ctx.beginPath();ctx.arc(0,0,p.s*0.22,0,7);ctx.fill();ctx.restore();break;}
  }
  return true;});
 ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 if(parts.length||bolts.length||rings.length)raf=requestAnimationFrame(draw);
}

// Devil Fruit powers. A fruit found in a Treasure Room chest can be eaten, and from then on the whole archive
// answers your taps with its power (one fruit at a time, like the real thing):
//  Mera Mera (Ace): fire bursts where you tap and embers follow the mouse.
//  Goro Goro (Enel): a bolt of lightning comes down out of the sky onto the spot.
//  Hie Hie (Aokiji): frost grows out from the tap and the pictures it reaches freeze over.
//  Ope Ope (Law): ROOM, a blue sphere; the pictures inside trade places (Shambles), then trade back.
//  Bara Bara (Buggy): the picture you tap comes apart in pieces and pulls itself back together.
//  Yami Yami (Blackbeard): a black hole pulls in everything near it, then lets go.
//  Hana Hana (Robin): petals open where you tap and the pictures around it bloom.
//  Added Oct 21 2026 (he asked for "a lot of devil fruits", Kizaru's first):
//  Pika Pika (Kizaru): a rain of light bullets streaks down onto the spot; pictures flash white.
//  Moku Moku (Smoker): smoke billows out and the pictures near it vanish into it for a moment.
//  Bomu Bomu (Mr. 5): an explosion; the pictures around it are knocked back.
//  Mero Mero (Hancock): hearts, then the pictures she looks at turn to stone.
//  Suna Suna (Crocodile): the picture you tap dries out and blows away as sand, then comes back.
//  Horo Horo (Perona): Negative Hollows float out; pictures they touch droop. "I'm sorry I was born…"
//  Ito Ito (Doflamingo): the Birdcage closes in, and the pictures dangle on strings like puppets.
//  Nikyu Nikyu (Kuma): a paw-shaped shockwave; pictures are pushed away and spring back.
//  Kage Kage (Moria): the tapped picture's shadow peels off and walks away; shadow bats scatter.
//  Magu Magu (Akainu): magma erupts and the pictures around it melt and sag.
//  Zushi Zushi (Fujitora): a meteor falls onto the spot and gravity presses the pictures flat.
//  Gura Gura (Whitebeard): the air cracks like glass and every picture on screen quakes.
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
 hana:{name:'Hana Hana no Mi',kana:'ハナハナ',h1:'#ff8fc6',h2:'#ffe3f1',words:[['Cien Fleur!','A hundred flowers'],['Mil Fleur!','A thousand flowers'],['Seis Fleur!','Six flowers']]},
 pika:{name:'Pika Pika no Mi',kana:'ピカピカ',h1:'#ffe45c',h2:'#fffbe0',words:[['Yasakani no Magatama!','Light bullets'],['Ama no Murakumo!','Sword of light'],['Yata no Kagami!','Mirror of light'],['Speed is weight!','Have you ever been kicked at the speed of light?']]},
 moku:{name:'Moku Moku no Mi',kana:'モクモク',h1:'#c9ccd2',h2:'#ffffff',words:[['White Blow!','Smoke fist'],['White Launcher!','Smoke rocket'],['White Out!','Smoke cage']]},
 bomu:{name:'Bomu Bomu no Mi',kana:'ボムボム',h1:'#ff7a2f',h2:'#ffe08a',words:[['Nose Fancy Cannon!','Bomb'],['Kick Bomb!','Explosive kick'],['Bomu Bomu!','Explosion']]},
 mero:{name:'Mero Mero no Mi',kana:'メロメロ',h1:'#ff5aa5',h2:'#ffd6ea',words:[['Mero Mero Mellow!','Love-love beam'],['Slave Arrow!','Love arrows'],['Pistol Kiss!','Turned to stone']]},
 suna:{name:'Suna Suna no Mi',kana:'スナスナ',h1:'#d9a65a',h2:'#f6e2b3',words:[['Sables!','Sandstorm'],['Desert Spada!','Desert sword'],['Ground Death!','Everything dries']]},
 horo:{name:'Horo Horo no Mi',kana:'ホロホロ',h1:'#e7d9ff',h2:'#ffffff',words:[['Negative Hollow!','Horo horo horo'],['I\u2019m sorry I was born…','Negative'],['Ghost Rap!','Horo horo']]},
 ito:{name:'Ito Ito no Mi',kana:'イトイト',h1:'#ff6fae',h2:'#ffffff',words:[['Torikago!','Birdcage'],['Parasite!','Puppet strings'],['Overheat!','Rope of string']]},
 nikyu:{name:'Nikyu Nikyu no Mi',kana:'ニキュニキュ',h1:'#ffb3c7',h2:'#fff0f4',words:[['Ursus Shock!','Compressed air'],['Pad Hō!','Paw cannon'],['If you were to go on a trip…','Where would you like to go?']]},
 kage:{name:'Kage Kage no Mi',kana:'カゲカゲ',h1:'#6b5b8f',h2:'#1a1426',words:[['Kage Kakumei!','Shadow revolution'],['Brick Bat!','Shadow bats'],['Doppelman!','My own shadow']]},
 magu:{name:'Magu Magu no Mi',kana:'マグマグ',h1:'#ff3d1f',h2:'#ffb24a',words:[['Dai Funka!','Great eruption'],['Meigō!','Hell hound'],['Ryūsei Kazan!','Meteor volcano']]},
 zushi:{name:'Zushi Zushi no Mi',kana:'ズシズシ',h1:'#8a7dff',h2:'#d9d4ff',words:[['Gravity Blade!','Raging tiger'],['Ryūsei!','Meteor'],['Jūryoku Tō!','Gravity sword']]},
 gura:{name:'Gura Gura no Mi',kana:'グラグラ',h1:'#e8f4ff',h2:'#ffffff',words:[['Kaishin!','Sea quake'],['Gekishin!','Violent quake'],['Shima Yurashi!','Island shaker']]}
};
let later=[],cur=null,cv=null,ctx=null,dpr=1,raf=0,parts=[],bolts=[],rings=[],badge=null,down=null,moved=0;
const rnd=(a,b)=>a+Math.random()*(b-a);

/* ---------------------------------------------------------------- eating */
// from the Treasure Room it's a ceremony (js/eatfx.js); the archive takes the fruit's colours as it goes down
export async function eat(id,{quiet=false,fromRoom=false}={}){
 const f=FR[id];if(!f)return;cur=id;B.eat=id;save();
 if(fromRoom&&!quiet&&!motion.reduced){
  const [fx,tr,th]=await Promise.all([import('./eatfx.js'),import('./treasure.js'),import('./themes.js')]);
  const info=tr.FRUITS.find(x=>x.id===id)||{};
  const p=fx.ceremony(f,info);document.querySelector('dialog.ef')?.addEventListener('ate',()=>th.refreshTheme(),{once:true});
  await p;th.refreshTheme();
 }else import('./themes.js').then(m=>m.refreshTheme());
 setup();showBadge();
 if(!quiet)notice(`You ate the ${f.name}`,coarse?'Tap anywhere on the archive to use it.':'Click anywhere on the archive to use it.');
 if(fromRoom&&!quiet)setTimeout(()=>{if(!document.querySelector('dialog[open]'))use(innerWidth/2,innerHeight*0.5,null);else word(innerWidth/2,innerHeight*0.45,f.words[0]);},250);
}
export function spit(){if(!cur)return;const f=FR[cur];cur=null;B.eat=null;save();badge?.classList.remove('in');import('./themes.js').then(m=>m.refreshTheme());notice('Spat it out',`The ${f.name} is back in the Treasure Room.`);}

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
 if(!cur||blocked())return;if(el instanceof Element&&el.closest('.df-badge,.av,.bt-toast,.gt,.gp'))return;
 const f=FR[cur];uses++;badge?.classList.remove('pulse');void badge?.offsetWidth;badge?.classList.add('pulse');
 if(uses===1||Math.random()<0.34)word(x,y-70,f.words[Math.floor(Math.random()*f.words.length)],f.h1);
 ({mera,goro,hie,ope,bara,yami,hana,pika,moku,bomu,mero,suna,horo,ito,nikyu,kage,magu,zushi,gura})[cur](x,y,el);loop();
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

/* ---------------------------------------------------------------- the fruits added in October 2026 */
function pika(x,y){
 // light bullets from the sky, each one landing a moment after the last
 for(let i=0;i<16;i++){const d=i*3+rnd(0,3),sx=x+rnd(-520,520),sy=-60-rnd(0,200),ex=x+rnd(-110,110),ey=y+rnd(-80,80);
  parts.push({k:'beam',sx,sy,ex,ey,life:-d,max:14});
  rings.push({x:ex,y:ey,r:2,max:rnd(34,70),life:-d-14,dur:20,c:'255,236,140'});
  for(let j=0;j<5;j++)parts.push({k:'spark',x:ex,y:ey,vx:rnd(-5,5),vy:rnd(-6,1),life:-d-14,max:rnd(16,30),s:rnd(1,2.2),c:'255,246,190'});}
 setTimeout(()=>flash('rgba(255,248,200,.22)',80),280);
 picsNear(x,y,240,10).forEach(({im},i)=>im.animate([{filter:'none'},{filter:'brightness(2.1) saturate(.6)',offset:.25},{filter:'none'}],{duration:900,delay:260+i*40,easing:'ease-out'}));
}
function moku(x,y){
 for(let i=0;i<46;i++){const a=rnd(0,Math.PI*2),v=rnd(.6,3.6);parts.push({k:'smoke',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-0.6,life:-rnd(0,10),max:rnd(80,130),s:rnd(40,90),g:rnd(.6,1.6)});}
 picsNear(x,y,220,10).forEach(({im},i)=>im.animate([{opacity:1,scale:'1'},{opacity:.12,scale:'.97',offset:.3},{opacity:.12,scale:'.97',offset:.65},{opacity:1,scale:'1'}],{duration:2200,delay:i*50,easing:'ease-in-out'}));
}
function bomu(x,y){
 flash('rgba(255,230,180,.4)',70);
 for(let i=0;i<90;i++){const a=rnd(0,Math.PI*2),v=rnd(2,10);parts.push({k:'fire',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,life:0,max:rnd(22,46),s:rnd(26,60)});}
 for(let i=0;i<26;i++){const a=rnd(0,Math.PI*2),v=rnd(.8,2.6);parts.push({k:'smoke',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1.2,life:-rnd(10,22),max:rnd(70,110),s:rnd(40,80),g:rnd(.3,.6),dark:1});}
 for(let i=0;i<30;i++)parts.push({k:'spark',x,y,vx:rnd(-12,12),vy:rnd(-14,4),life:0,max:rnd(30,60),s:rnd(1.4,3)});
 rings.push({x,y,r:10,max:260,life:0,dur:26,c:'255,220,170'});
 picsNear(x,y,300,12).forEach(({im,cx,cy,d})=>{const k=Math.max(0.2,1-d/400),dx=(cx-x)/(d||1)*90*k,dy=(cy-y)/(d||1)*90*k,rot=rnd(-14,14)*k;
  im.animate([{translate:'0 0',rotate:'0deg'},{translate:`${dx}px ${dy}px`,rotate:`${rot}deg`,offset:.18},{translate:`${-dx*0.08}px ${-dy*0.08}px`,rotate:`${-rot*0.1}deg`,offset:.6},{translate:'0 0',rotate:'0deg'}],{duration:1200,easing:'cubic-bezier(.2,.8,.3,1)'});});
}
function mero(x,y){
 for(let i=0;i<34;i++){const a=rnd(0,Math.PI*2),v=rnd(1.5,6);parts.push({k:'heart',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1.5,life:0,max:rnd(60,100),s:rnd(7,15),rot:rnd(-.5,.5)});}
 rings.push({x,y,r:6,max:200,life:0,dur:34,c:'255,120,190'});
 // the ones she looks at turn to stone, then come back to life
 picsNear(x,y,230,8).forEach(({im},i)=>setTimeout(()=>{im.classList.add('df-stone');im.animate([{translate:'0 0'},{translate:'-2px 0'},{translate:'2px 0'},{translate:'0 0'}],{duration:180,delay:1500,iterations:2});setTimeout(()=>im.classList.remove('df-stone'),2000);},300+i*90));
}
function suna(x,y){
 const im=picAt(x,y),cols=['217,166,90','236,201,140','190,140,70','246,226,179'];
 if(!im){for(let i=0;i<120;i++){const a=rnd(0,Math.PI*2),r=rnd(4,30);parts.push({k:'sand',x:x+Math.cos(a)*r,y:y+Math.sin(a)*r,vx:0,vy:0,life:0,max:rnd(60,110),s:rnd(1.2,2.6),swirl:{cx:x,cy:y,a,r,up:rnd(1.5,3.5)},c:cols[i%4]});}return;}
 const r=im.getBoundingClientRect(),n=Math.min(360,Math.round(r.width*r.height/220));
 im.animate([{filter:'none',opacity:1},{filter:'sepia(1) saturate(.7) brightness(1.05) contrast(.9)',opacity:1,offset:.18},{filter:'sepia(1) saturate(.7)',opacity:0,offset:.36},{opacity:0,offset:.72},{filter:'none',opacity:1}],{duration:2600,easing:'ease-in-out'});
 for(let i=0;i<n;i++){const px=r.left+Math.random()*r.width,py=r.top+Math.random()*r.height,delay=((px-r.left)/r.width)*18+rnd(0,8);
  parts.push({k:'sand',x:px,y:py,vx:rnd(1.5,4.5),vy:rnd(-1.6,.4),life:-12-delay,max:rnd(55,95),s:rnd(1.2,2.8),c:cols[i%4]});}
}
function horo(x,y){
 for(let i=0;i<5;i++){const a=-Math.PI/2+(i-2)*0.55+rnd(-.2,.2),v=rnd(1.4,2.4);parts.push({k:'ghost',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:-i*5,max:rnd(110,150),s:rnd(26,38),ph:rnd(0,6)});}
 picsNear(x,y,240,8).forEach(({im},i)=>im.animate([{rotate:'0deg',translate:'0 0',scale:'1',filter:'none'},{rotate:`${rnd(5,10)*(i%2?1:-1)}deg`,translate:'0 14px',scale:'.93',filter:'grayscale(.75) brightness(.7)',offset:.25},{rotate:`${rnd(4,8)*(i%2?1:-1)}deg`,translate:'0 16px',scale:'.93',filter:'grayscale(.75) brightness(.7)',offset:.75},{rotate:'0deg',translate:'0 0',scale:'1',filter:'none'}],{duration:2600,delay:350+i*80,easing:'ease-in-out'}));
 setTimeout(()=>word(x,y+90,['I’m sorry I was born…','Negative Hollow'],'#e7d9ff'),700);
}
function ito(x,y){
 // the Birdcage: strings from one point in the sky fan down and close in, then let go
 const top={x,y:-80},n=26,W=innerWidth,H=innerHeight;
 for(let i=0;i<n;i++){const bx=(i+0.5)/n*W*1.6-W*0.3;parts.push({k:'string',x0:top.x,y0:top.y,bx,by:H+60,tx:x+(bx-x)*0.35,life:-i*0.6,max:100});}
 picsNear(x,y,320,10).forEach(({im},i)=>{const sw=rnd(5,9)*(i%2?1:-1);
  parts.push({k:'pstring',im,life:0,max:110});
  im.animate([{rotate:'0deg',translate:'0 0'},{rotate:`${sw}deg`,translate:'0 -10px',offset:.2},{rotate:`${-sw*0.7}deg`,translate:'0 4px',offset:.42},{rotate:`${sw*0.45}deg`,translate:'0 -4px',offset:.64},{rotate:`${-sw*0.2}deg`,offset:.82},{rotate:'0deg',translate:'0 0'}],{duration:2000,delay:i*60,easing:'ease-in-out'});});
}
function nikyu(x,y){
 rings.push({k:'paw',x,y,r:0,max:Math.min(innerWidth,innerHeight)*0.32,life:0,dur:42});
 rings.push({x,y,r:10,max:Math.min(innerWidth,innerHeight)*0.55,life:-6,dur:30,c:'255,190,210'});
 picsNear(x,y,340,12).forEach(({im,cx,cy,d})=>{const k=Math.max(0.25,1-d/460),dx=(cx-x)/(d||1)*160*k,dy=(cy-y)/(d||1)*160*k;
  im.animate([{translate:'0 0',scale:'1'},{translate:`${dx}px ${dy}px`,scale:'.86',offset:.28},{translate:`${dx*0.95}px ${dy*0.95}px`,scale:'.86',offset:.45},{translate:`${-dx*0.06}px ${-dy*0.06}px`,scale:'1.02',offset:.78},{translate:'0 0',scale:'1'}],{duration:1500,delay:80,easing:'cubic-bezier(.25,.8,.3,1)'});});
}
function kage(x,y){
 for(let i=0;i<26;i++){const a=rnd(-Math.PI,0),v=rnd(2,6);parts.push({k:'bat',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:-rnd(0,8),max:rnd(60,100),s:rnd(8,15),ph:rnd(0,6)});}
 const im=picAt(x,y);if(!im)return;
 const r=im.getBoundingClientRect(),cs=getComputedStyle(im),sh=document.createElement('div');sh.className='df-piece df-shadow';sh.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
 sh.innerHTML=`<img src="${im.currentSrc||im.src}" alt="" style="left:0;top:0;width:100%;height:100%;object-fit:${cs.objectFit};object-position:${cs.objectPosition}">`;document.body.appendChild(sh);
 const dir=x<innerWidth/2?1:-1;
 im.animate([{filter:'none'},{filter:'brightness(1.25) saturate(.5)',offset:.2},{filter:'brightness(1.25) saturate(.5)',offset:.8},{filter:'none'}],{duration:2600});
 sh.animate([{transform:'none',opacity:.85},{transform:`translate3d(${dir*30}px,6px,0) skewX(${-dir*12}deg)`,opacity:.85,offset:.2},{transform:`translate3d(${dir*Math.min(220,r.width*0.9)}px,12px,0) skewX(${-dir*18}deg) scale(1.05)`,opacity:.7,offset:.65},{transform:'none',opacity:0}],{duration:2600,easing:'ease-in-out'}).finished.then(()=>sh.remove());
}
function magu(x,y){
 for(let i=0;i<58;i++){const a=-Math.PI/2+rnd(-1.1,1.1),v=rnd(4,12);parts.push({k:'magma',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:0,max:rnd(55,95),s:rnd(10,26)});}
 for(let i=0;i<22;i++){const a=rnd(0,Math.PI*2),v=rnd(.4,1.4);parts.push({k:'smoke',x,y:y-10,vx:Math.cos(a)*v,vy:-rnd(1,2.4),life:-rnd(4,16),max:rnd(80,120),s:rnd(40,70),g:rnd(.25,.45),dark:1});}
 rings.push({x,y,r:6,max:140,life:0,dur:28,c:'255,110,40'});
 picsNear(x,y,230,8).forEach(({im},i)=>im.animate([{filter:'none',scale:'1 1',translate:'0 0'},{filter:'sepia(1) saturate(5) hue-rotate(-28deg) brightness(.95)',scale:'1.03 .9',translate:'0 10px',offset:.35},{filter:'sepia(1) saturate(5) hue-rotate(-28deg) brightness(.9)',scale:'1.04 .86',translate:'0 14px',offset:.6},{filter:'none',scale:'1 1',translate:'0 0'}],{duration:2100,delay:200+i*60,easing:'ease-in-out'}));
}
function zushi(x,y){
 const sx=x+(x<innerWidth/2?1:-1)*rnd(260,420),sy=-120,T=26;
 parts.push({k:'meteor',sx,sy,ex:x,ey:y,life:0,max:T,s:rnd(22,30)});
 setTimeout(()=>{
  flash('rgba(200,190,255,.25)',70);
  rings.push({x,y,r:8,max:240,life:0,dur:30,c:'190,180,255'});
  for(let i=0;i<40;i++){const a=rnd(-Math.PI,0),v=rnd(2,8);parts.push({k:'spark',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:0,max:rnd(25,50),s:rnd(1.5,3.2),c:'200,190,180'});}
  for(let i=0;i<18;i++){const a=rnd(-Math.PI,0),v=rnd(.6,2);parts.push({k:'smoke',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.6,life:0,max:rnd(60,90),s:rnd(40,70),g:rnd(.3,.5)});}
  picsNear(x,y,320,12).forEach(({im})=>im.animate([{scale:'1 1',translate:'0 0'},{scale:'1.08 .78',translate:'0 18px',offset:.25},{scale:'1.06 .82',translate:'0 16px',offset:.55},{scale:'.98 1.03',translate:'0 -3px',offset:.82},{scale:'1 1',translate:'0 0'}],{duration:1400,easing:'cubic-bezier(.3,.7,.3,1)'}));
 },T*16);
}
function gura(x,y){
 // the air itself cracks like a pane of glass, then the whole screen quakes
 flash('rgba(235,245,255,.3)',60);
 const arms=12;for(let a=0;a<arms;a++){const ang=a/arms*Math.PI*2+rnd(-.2,.2),len=rnd(160,Math.max(innerWidth,innerHeight)*0.55);parts.push({k:'crack',pts:jag(x,y,x+Math.cos(ang)*len,y+Math.sin(ang)*len,5),life:0,max:70});}
 for(let k=1;k<=3;k++){const R=k*rnd(45,70),pts=[];for(let i=0;i<=24;i++){const a=i/24*Math.PI*2;pts.push([x+Math.cos(a)*R*rnd(.9,1.1),y+Math.sin(a)*R*rnd(.9,1.1)]);}parts.push({k:'crack',pts,life:-k*2,max:66,thin:1});}
 rings.push({x,y,r:10,max:Math.max(innerWidth,innerHeight)*0.7,life:0,dur:34,c:'230,240,255'});
 picsNear(x,y,Math.max(innerWidth,innerHeight),24).forEach(({im})=>{const f=[];for(let i=0;i<10;i++){const a=(1-i/10)*9;f.push({translate:`${rnd(-a,a).toFixed(1)}px ${rnd(-a,a).toFixed(1)}px`,rotate:`${rnd(-a,a)*0.15}deg`});}f.push({translate:'0 0',rotate:'0deg'});im.animate(f,{duration:900,easing:'linear'});});
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
 const smokeL=sprite('smokeL',[[0,'rgba(226,229,234,.95)'],[.5,'rgba(196,201,209,.55)'],[1,'rgba(196,201,209,0)']]),smokeD=sprite('smokeD',[[0,'rgba(40,36,34,.9)'],[.5,'rgba(50,44,40,.4)'],[1,'rgba(50,44,40,0)']]);
 const magma=sprite('magma',[[0,'rgba(255,250,200,1)'],[.25,'rgba(255,170,40,.95)'],[.6,'rgba(220,40,10,.6)'],[1,'rgba(120,0,0,0)']]);
 const now=performance.now();
 // rings, rooms, holes, slashes
 rings=rings.filter(r=>{r.life++;if(r.life<0)return true;const t=r.life/r.dur;if(t>=1)return false;
  if(r.k==='room'){const g=Math.min(1,t*4),e=1-Math.pow(1-g,3),rad=r.max*e,a=t<.8?1:(1-t)/0.2;
   ctx.globalCompositeOperation='source-over';ctx.fillStyle=`rgba(90,168,255,${0.12*a})`;ctx.beginPath();ctx.arc(r.x,r.y,rad,0,7);ctx.fill();
   ctx.strokeStyle=`rgba(190,225,255,${0.85*a})`;ctx.lineWidth=2;ctx.stroke();ctx.strokeStyle=`rgba(90,168,255,${0.35*a})`;ctx.lineWidth=9;ctx.stroke();
   ctx.save();ctx.setLineDash([4,10]);ctx.lineDashOffset=-r.life;ctx.strokeStyle=`rgba(190,225,255,${0.5*a})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(r.x,r.y,rad,rad*0.32,0,0,7);ctx.stroke();ctx.restore();return true;}
  if(r.k==='hole'){const g=t<.15?t/.15:t>.75?(1-t)/.25:1,rad=r.max*g;ctx.globalCompositeOperation='source-over';
   const gr=ctx.createRadialGradient(r.x,r.y,0,r.x,r.y,rad*2.2);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.42,'rgba(5,0,15,.95)');gr.addColorStop(.5,'rgba(138,99,255,.55)');gr.addColorStop(.62,'rgba(60,30,120,.25)');gr.addColorStop(1,'rgba(0,0,0,0)');
   ctx.fillStyle=gr;ctx.beginPath();ctx.arc(r.x,r.y,rad*2.2,0,7);ctx.fill();return true;}
  if(r.k==='paw'){const e=1-Math.pow(1-Math.min(1,t*2.2),3),a=t<.5?1:(1-t)/.5,R=r.max*(0.35+0.65*e);ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(255,190,210,${0.22*a})`;ctx.strokeStyle=`rgba(255,235,242,${0.8*a})`;ctx.lineWidth=2;
   ctx.beginPath();ctx.ellipse(r.x,r.y+R*0.22,R*0.5,R*0.42,0,0,7);ctx.fill();ctx.stroke();
   [[-0.52,-0.32],[-0.19,-0.56],[0.19,-0.56],[0.52,-0.32]].forEach(([dx,dy])=>{ctx.beginPath();ctx.ellipse(r.x+dx*R,r.y+dy*R,R*0.15,R*0.19,dx*0.6,0,7);ctx.fill();ctx.stroke();});return true;}
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
   case 'beam':{const e=Math.min(1,p.life/p.max),hx=p.sx+(p.ex-p.sx)*e,hy=p.sy+(p.ey-p.sy)*e,tl=Math.max(0,e-0.35),tx=p.sx+(p.ex-p.sx)*tl,ty=p.sy+(p.ey-p.sy)*tl;ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1;ctx.lineCap='round';
    [[10,'rgba(255,220,90,.18)'],[4,'rgba(255,240,160,.6)'],[1.6,'rgba(255,255,240,1)']].forEach(([w,c])=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(hx,hy);ctx.stroke();});ctx.drawImage(glow,hx-14,hy-14,28,28);break;}
   case 'smoke':{p.x+=p.vx;p.y+=p.vy;p.vx*=0.96;p.vy=p.vy*0.97-0.02;const s=p.s*(0.5+t*p.g);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=(t<0.15?t/0.15:1-t)*(p.dark?0.6:0.7);ctx.drawImage(p.dark?smokeD:smokeL,p.x-s/2,p.y-s/2,s,s);break;}
   case 'heart':{p.x+=p.vx;p.y+=p.vy;p.vx*=0.97;p.vy=p.vy*0.97-0.03;ctx.globalCompositeOperation='source-over';ctx.globalAlpha=t<0.7?1:(1-t)/0.3;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);const s=p.s;ctx.fillStyle=p.s>11?'rgba(255,90,165,.95)':'rgba(255,170,210,.95)';ctx.beginPath();ctx.moveTo(0,s*0.35);ctx.bezierCurveTo(-s,-s*0.3,-s*0.45,-s,0,-s*0.45);ctx.bezierCurveTo(s*0.45,-s,s,-s*0.3,0,s*0.35);ctx.fill();ctx.restore();break;}
   case 'sand':{if(p.swirl){const w=p.swirl;w.a+=0.12;w.r+=0.9;p.x=w.cx+Math.cos(w.a)*w.r;p.y=w.cy+Math.sin(w.a)*w.r*0.35-p.life*w.up;}else{p.x+=p.vx;p.y+=p.vy;p.vx*=0.995;p.vy+=0.03+Math.sin(p.life*0.2)*0.05;}ctx.globalCompositeOperation='source-over';ctx.globalAlpha=t<0.7?0.95:(1-t)/0.3;ctx.fillStyle=`rgb(${p.c})`;ctx.fillRect(p.x,p.y,p.s,p.s);break;}
   case 'ghost':{p.x+=p.vx+Math.sin(p.life*0.07+p.ph)*0.8;p.y+=p.vy+Math.cos(p.life*0.05+p.ph)*0.4;ctx.globalCompositeOperation='source-over';ctx.globalAlpha=(t<0.15?t/0.15:t>0.8?(1-t)/0.2:1)*0.85;const s=p.s;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.sin(p.life*0.06+p.ph)*0.25);
    ctx.fillStyle='rgba(250,248,255,.95)';ctx.beginPath();ctx.arc(0,0,s*0.5,Math.PI,0);ctx.quadraticCurveTo(s*0.5,s*0.4,s*0.15,s*0.55);ctx.quadraticCurveTo(-s*0.05,s*0.95+Math.sin(p.life*0.2)*s*0.1,-s*0.25,s*0.6);ctx.quadraticCurveTo(-s*0.5,s*0.45,-s*0.5,0);ctx.fill();
    ctx.fillStyle='#2a2238';ctx.beginPath();ctx.ellipse(-s*0.17,-s*0.05,s*0.07,s*0.1,0,0,7);ctx.ellipse(s*0.17,-s*0.05,s*0.07,s*0.1,0,0,7);ctx.fill();ctx.fillStyle='#ff7aa8';ctx.beginPath();ctx.ellipse(0,s*0.2,s*0.09,s*0.13,0,0,7);ctx.fill();ctx.restore();break;}
   case 'string':{const g=Math.min(1,p.life/30),close=t<0.55?Math.min(1,p.life/40):1,a=t<0.7?1:(1-t)/0.3,bx=p.bx+(p.tx-p.bx)*close*0.65;ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a*0.85;ctx.strokeStyle='rgba(255,230,240,.9)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x0,p.y0);ctx.lineTo(p.x0+(bx-p.x0)*g,p.y0+(p.by-p.y0)*g);ctx.stroke();ctx.strokeStyle='rgba(255,111,174,.25)';ctx.lineWidth=4;ctx.stroke();break;}
   case 'pstring':{const r=p.im.getBoundingClientRect(),a=t<0.75?1:(1-t)/0.25;ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a*0.8;ctx.strokeStyle='rgba(255,240,248,.9)';ctx.lineWidth=1;[[0.25,-0.1],[0.75,0.1]].forEach(([fx,dx])=>{ctx.beginPath();ctx.moveTo(r.left+r.width*(fx+dx),0);ctx.lineTo(r.left+r.width*fx,r.top+2);ctx.stroke();});break;}
   case 'bat':{p.x+=p.vx;p.y+=p.vy;p.vx*=0.985;p.vy=p.vy*0.985-0.02;ctx.globalCompositeOperation='source-over';ctx.globalAlpha=t<0.75?0.95:(1-t)/0.25;const s=p.s,fl=Math.sin(p.life*0.6+p.ph);ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#120d1c';ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-s*0.5,-s*0.6*fl,-s,-s*0.15*fl);ctx.quadraticCurveTo(-s*0.6,s*0.05,-s*0.35,s*0.2);ctx.lineTo(0,s*0.08);ctx.lineTo(s*0.35,s*0.2);ctx.quadraticCurveTo(s*0.6,s*0.05,s,-s*0.15*fl);ctx.quadraticCurveTo(s*0.5,-s*0.6*fl,0,0);ctx.fill();ctx.fillStyle='#b48cff';ctx.fillRect(-s*0.12,-s*0.05,s*0.07,s*0.07);ctx.fillRect(s*0.05,-s*0.05,s*0.07,s*0.07);ctx.restore();break;}
   case 'magma':{p.x+=p.vx;p.y+=p.vy;p.vx*=0.985;p.vy+=0.32;const s=p.s*(1-t*0.4);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=t<0.8?1:(1-t)/0.2;ctx.drawImage(magma,p.x-s/2,p.y-s/2,s,s);break;}
   case 'meteor':{const e=Math.pow(p.life/p.max,1.6),mx=p.sx+(p.ex-p.sx)*e,my=p.sy+(p.ey-p.sy)*e;for(let k=0;k<3;k++)later.push({k:'fire',x:mx+rnd(-6,6),y:my+rnd(-6,6),vx:(p.sx-p.ex)*0.004,vy:(p.sy-p.ey)*0.004,life:0,max:rnd(14,26),s:rnd(18,34)});
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.fillStyle='#3b2f28';ctx.beginPath();ctx.arc(mx,my,p.s,0,7);ctx.fill();ctx.fillStyle='rgba(120,100,90,.9)';ctx.beginPath();ctx.arc(mx-p.s*0.3,my-p.s*0.3,p.s*0.45,0,7);ctx.fill();break;}
   case 'crack':{const a=t<0.6?1:(1-t)/0.4,g=Math.min(1,p.life/6),n=Math.max(2,Math.round(p.pts.length*g));ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;ctx.lineJoin='round';
    [[p.thin?3:6,'rgba(170,210,255,.22)'],[p.thin?1:1.8,'rgba(255,255,255,.95)']].forEach(([w,c])=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();for(let i=0;i<n;i++){const [x,y]=p.pts[i];i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();});break;}
  }
  return true;});
 if(later.length){parts.push(...later);later=[];}
 ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 if(parts.length||bolts.length||rings.length)raf=requestAnimationFrame(draw);
}

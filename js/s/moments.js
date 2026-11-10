// Moments that permanently live in my head: the fifteen scenes from his Anime Journey note, word for
// word (data/route.json → moments), each paired with art he chose. Scrolling flips through them like a
// pile of photos: the current one is tossed up and aside as the next rises in. Never holds still.
import {$,esc,pad,clamp,smooth,view,part,pinned,motion,data,FU} from '../core.js';
import {openViewer,registerCollection,openDialog} from '../dialogs.js';

const ART='assets/moments/';
// Which picture belongs to which moment. Keys are "<series>-<number>".
// Strings are files in assets/moments; {ch:'id'} is a character portrait; {img:'id'} a gallery photo.
const PICK={
 'One Piece-01':[{crew:'Nami'}],
 'One Piece-02':[{ch:'sanji'}],
 'One Piece-03':['brook-laboon.webp'],
 'One Piece-04':[{ch:'robin'},'sniper-king.webp'],
 'One Piece-05':['elbaf-warriors.webp','elbaf-crew.webp'],
 'One Piece-06':[{ch:'zoro'}],
 'One Piece-07':['ace-yamato-luffy.webp'],
 'One Piece-08':['rubberman.webp','spider-man-1000.webp'],
 'One Piece-09':['heartbeat-2.webp','heartbeat-1.webp'],
 'One Piece-10':['kuma-bonney.webp'],
 'One Piece-11':['elbaf-mural.webp','joyboy.webp'],
 'One Piece-12':['usopp-memories.webp'],
 'Re:Zero-01':['rem-frame.webp'],
 'Re:Zero-02':['rezero-ep9.webp'],
 'Re:Zero-03':['subaru-raging.webp',{ch:'subaru-natsuki'}],
 'Violet Evergarden-01':[{img:'2055c4135ff6'},{img:'38583bab47bc'}]
};
const HUE={'EMOTIONAL + CAPTIVATING':'#7fa6d9','HYPE + TRUST':'#f3c969','PAIN + RESPECT':'#e3342f','LONGING':'#4f86c6','HOPE AFTER COMPLETE DESPAIR':'#b48ae0','FREEDOM':'#f3c969','RESPECT':'#4caf7a','HELPLESSNESS':'#8d8da0','REFUSAL TO QUIT':'#ef7a2f','PURE JOY + DEFIANCE':'#f6c453','DEVASTATION':'#6b7fa8','AWE':'#e0a24a','NOSTALGIA DAMAGE':'#c99ae0'};

// His words, every block of them (phones show the opening lines and offer the rest in the reader).
const textHTML=m=>m.text.map(b=>b.q?`<blockquote>${esc(b.q)}</blockquote>`:`<p>${esc(b.p)}</p>`).join('');

// The pictures he paired with a moment (also used by the message-in-a-bottle on the first screen).
export function momentArt(m){
 const chars=data.characters?.characters||[],crew=data.media?.crew||[];
 const src=p=>{if(typeof p==='string')return ART+p;if(p.ch){const c=chars.find(x=>x.id===p.ch);return c&&`assets/chars/m/${c.image.id}.webp`;}if(p.crew){const c=crew.find(x=>x.name===p.crew);return c&&FU(c.cover);}if(p.img)return FU(p.img);return null;};
 return (PICK[`${m.series}-${m.n}`]||[]).map(src).filter(Boolean);
}

export function initMoments(){
 const R=data.route,sec=$('#moments'),stage=$('#mo-stage'),idx=$('#mo-index'),bg=$('#mo-bg');
 const list=(R&&R.moments)||[];if(!list.length){sec.hidden=true;return;}
 const chars=data.characters.characters,crew=data.media.crew;
 const src=p=>{if(typeof p==='string')return ART+p;if(p.ch){const c=chars.find(x=>x.id===p.ch);return c&&`assets/chars/m/${c.image.id}.webp`;}if(p.crew){const c=crew.find(x=>x.name===p.crew);return c&&FU(c.cover);}if(p.img)return FU(p.img);return null;};
 const N=list.length;
 sec.style.height=`${Math.round(190+N*58)}svh`;
 const pics=[];
 stage.innerHTML=list.map((m,i)=>{
  const key=`${m.series}-${m.n}`,art=(PICK[key]||[]).map(src).filter(Boolean);art.forEach(a=>pics.push(a));
  const hue=HUE[m.emotion]||(m.series==='Re:Zero'?'#8a6cff':'#f3c969');
  const blocks=textHTML(m);
  const long=m.text.length>2||m.text.reduce((n,b)=>n+(b.p||b.q||'').length,0)>200;
  return `<article class="mo${long?' long':''}" data-i="${i}" style="--h:${hue}">
   <div class="mo-art">${art.length?art.map((a,k)=>`<figure class="mo-pic${k?' back':''}"><img data-src="${esc(a)}" alt="" decoding="async"></figure>`).reverse().join(''):`<div class="mo-type"><span>${esc(m.emotion||m.series)}</span><b>${esc(m.title)}</b></div>`}</div>
   <div class="mo-copy"><p class="mo-series">${esc(m.series)} · ${esc(m.n)}</p><h3>${esc(m.title)}</h3>${m.emotion?`<p class="mo-emotion">${esc(m.emotion)}</p>`:''}<div class="mo-text">${blocks}</div>${long?`<button class="mo-more" data-more="${i}">Read the rest →</button>`:''}</div>
  </article>`;}).join('');
 const items=[...stage.children].map(el=>({el,art:el.querySelector('.mo-art'),copy:el.querySelector('.mo-copy'),imgs:[...el.querySelectorAll('img[data-src]')]}));
 const load=it=>{if(it&&it.imgs.length){it.imgs.forEach(im=>{im.src=im.dataset.src;im.removeAttribute('data-src');im.decode?.().catch(()=>{});});it.imgs=[];}};
 new IntersectionObserver(([e],io)=>{if(e.isIntersecting){load(items[0]);load(items[1]);io.disconnect();}},{rootMargin:'150% 0px'}).observe(sec);
 let cur=-1;
 const paw=$('#mo-paw'),pawCap=$('#mo-pawcap');
 const LX=[-0.17,0.05,-0.2,0.02],LY=[-0.2,0.32,0.27,-0.22],PX=[0.34,-0.34,0.3,-0.3],PY=[-0.02,-0.04,-0.07,-0.05];
 const setBub=()=>sec.classList.toggle('bub',!motion.reduced);motion.listeners.push(()=>{setBub();items.forEach(it=>{it.v=0;it.el.style.visibility='hidden';it.art.style.transform='';it.art.style.opacity='';});});setBub();
 part({el:sec,update(s){
  if(!motion.reduced){bubbles(pinned(this,s));return;}
  const p=motion.reduced?0:pinned(this,s),x=clamp(p*1.05-0.02)*(N-1),vw=view.vw,vh=view.vh,phone=vw<=820;
  items.forEach((it,i)=>{
   const d=i-x,a=Math.abs(d);
   if(a>1.3){if(it.v){it.v=0;it.el.style.visibility='hidden';}return;}
   if(!it.v){it.v=1;it.el.style.visibility='visible';load(it);load(items[i+1]);load(items[i+2]);}
   // leaving: tossed up and to the left; arriving: rises from below, tilted. On phones the words sit under
   // the photo, so the pile flicks sideways instead and a photo never slides across the text.
   const t=phone?(d<0?`translate3d(${(d*vw*0.95).toFixed(1)}px,${(d*vh*0.04).toFixed(1)}px,0) rotate(${(d*12).toFixed(2)}deg)`:`translate3d(${(d*vw*0.9).toFixed(1)}px,${(d*vh*0.03).toFixed(1)}px,0) rotate(${(d*8).toFixed(2)}deg) scale(${(1-d*0.06).toFixed(4)})`)
    :d<0?`translate3d(${(d*vw*0.5).toFixed(1)}px,${(d*vh*0.18).toFixed(1)}px,0) rotate(${(d*16).toFixed(2)}deg)`:`translate3d(${(d*vw*0.06).toFixed(1)}px,${(d*vh*0.75).toFixed(1)}px,0) rotate(${(d*7).toFixed(2)}deg) scale(${(1-d*0.08).toFixed(4)})`;
   it.art.style.transform=t;it.art.style.opacity=(1-smooth(clamp((a-0.35)/0.75))).toFixed(3);
   it.el.style.setProperty('--fan',(1-Math.min(a,1)).toFixed(3));
   const o=1-smooth(clamp((a-0.06)/0.36));it.copy.style.opacity=o.toFixed(3);it.copy.style.transform=`translate3d(0,${(d*70).toFixed(1)}px,0)`;
   it.el.style.zIndex=String(100-Math.round(d*10));
  });
  const k=Math.round(x);if(k!==cur){cur=k;idx.textContent=`${pad(k+1)} / ${pad(N)}`;bg.style.setProperty('--h',items[k].el.style.getPropertyValue('--h'));}
 }});
// Memory bubbles (Nov 2026). Kuma pushed every memory he had into one paw-shaped bubble; Bonney walked into it.
 // You push into the paw, then each moment floats up out of the depth as a glass bubble, holds beside his words,
 // and slips past the camera as the next one arrives. The next two or three are always visible further in.
 function bubbles(p){
  const vw=view.vw,vh=view.vh,phone=vw<=820;
  const xr=(p-0.085)/0.9*(N-1),x=clamp(xr,-1,N-1),intro=clamp(p/0.085);
  if(paw){const g=smooth(intro),o=1-smooth(clamp((intro-0.45)/0.5));
   if(o<0.01){if(paw._v!==0){paw._v=0;paw.style.visibility='hidden';pawCap.style.visibility='hidden';}}
   else{if(paw._v!==1){paw._v=1;paw.style.visibility='visible';pawCap.style.visibility='visible';}paw.style.transform=`translate3d(0,${(g*vh*0.1).toFixed(1)}px,0) scale(${(1+g*g*7).toFixed(3)})`;paw.style.opacity=o.toFixed(3);pawCap.style.opacity=(1-smooth(clamp(intro/0.4))).toFixed(3);}}
  items.forEach((it,i)=>{
   const d=i-x,a=Math.abs(d);
   if(d>3.1||d<-0.75){if(it.v){it.v=0;it.el.style.visibility='hidden';}return;}
   if(!it.v){it.v=1;it.el.style.visibility='visible';load(it);load(items[i+1]);}
   let tx,ty,sc,op;
   if(d>=0){const m=smooth(clamp(d))+Math.max(0,d-1)*0.22;sc=1000/(1000+d*1150);tx=(phone?PX:LX)[i%4]*vw*m;ty=(phone?PY:LY)[i%4]*vh*m;op=(1-smooth(clamp((d-2.3)/0.8)))*(d>0.5?0.82:1)*(xr<-0.999?smooth(intro*1.4):1);}
   else{const k=-d;sc=1+k*k*5+k*0.9;tx=-k*vw*(phone?0.2:0.42);ty=-k*vh*0.08;op=1-smooth(clamp(k/0.55));}
   it.art.style.transform=`translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) scale(${sc.toFixed(4)})`;
   it.art.style.opacity=op.toFixed(3);
   it.art.style.pointerEvents=a<0.3?'auto':'none';
   const o=1-smooth(clamp((a-0.06)/0.3));it.copy.style.opacity=o.toFixed(3);it.copy.style.transform=`translate3d(0,${(d*60).toFixed(1)}px,0)`;it.copy.style.pointerEvents=o>0.5?'auto':'none';
   it.el.style.zIndex=String(100-Math.round(d*10));
  });
  const k=Math.round(Math.max(0,x));if(k!==cur){cur=k;idx.textContent=`${pad(k+1)} / ${pad(N)}`;bg.style.setProperty('--h',items[k].el.style.getPropertyValue('--h'));}
  idx.style.opacity=intro>=1?'':'0';
 }
 registerCollection('moments',()=>({title:'Moments that live in my head',eyebrow:'Anime Journey',ids:[...new Set(pics)],src:x=>x}));
 stage.addEventListener('click',e=>{const more=e.target.closest('[data-more]');if(more){const m=list[+more.dataset.more];openDialog(`<p class="eyebrow">${esc(m.series)} · ${esc(m.n)}</p><h2 id="dialog-title">${esc(m.title)}</h2><div class="mo-read" style="--h:${HUE[m.emotion]||'#f3c969'}">${m.emotion?`<p class="mo-emotion">${esc(m.emotion)}</p>`:''}<div class="mo-text">${textHTML(m)}</div></div>`);return;}const f=e.target.closest('.mo-pic');if(!f)return;const im=f.querySelector('img');openViewer('moments',im.getAttribute('src')||im.dataset.src);});
}

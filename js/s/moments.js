// Moments that permanently live in my head: the fifteen scenes from his Anime Journey note, word for
// word (data/route.json → moments), each paired with art he chose. Scrolling flips through them like a
// pile of photos: the current one is tossed up and aside as the next rises in. Never holds still.
import {$,esc,pad,clamp,smooth,view,part,pinned,motion,data,FU} from '../core.js';
import {openViewer,registerCollection} from '../dialogs.js';

const ART='assets/moments/';
// Which picture belongs to which moment. Keys are "<series>-<number>".
// Strings are files in assets/moments; {ch:'id'} is a character portrait; {img:'id'} a gallery photo.
const PICK={
 'One Piece-01':[{crew:'Nami'}],
 'One Piece-02':[{ch:'sanji'}],
 'One Piece-04':[{ch:'robin'}],
 'One Piece-05':['elbaf-warriors.webp','elbaf-crew.webp'],
 'One Piece-06':[{ch:'zoro'}],
 'One Piece-07':['ace-yamato-luffy.webp'],
 'One Piece-08':['rubberman.webp','spider-man-1000.webp'],
 'One Piece-09':['heartbeat-2.webp','heartbeat-1.webp'],
 'One Piece-11':['elbaf-mural.webp'],
 'One Piece-12':['usopp-memories.webp'],
 'Re:Zero-03':[{ch:'subaru-natsuki'}]
};
const HUE={'HYPE + TRUST':'#f3c969','PAIN + RESPECT':'#e3342f','LONGING':'#4f86c6','HOPE AFTER COMPLETE DESPAIR':'#b48ae0','FREEDOM':'#f3c969','RESPECT':'#4caf7a','HELPLESSNESS':'#8d8da0','REFUSAL TO QUIT':'#ef7a2f','PURE JOY + DEFIANCE':'#f6c453','DEVASTATION':'#6b7fa8','AWE':'#e0a24a','NOSTALGIA DAMAGE':'#c99ae0'};

export function initMoments(){
 const R=data.route,sec=$('#moments'),stage=$('#mo-stage'),idx=$('#mo-index'),bg=$('#mo-bg');
 const list=(R&&R.moments)||[];if(!list.length){sec.hidden=true;return;}
 const chars=data.characters.characters,crew=data.media.crew;
 const src=p=>{if(typeof p==='string')return ART+p;if(p.ch){const c=chars.find(x=>x.id===p.ch);return c&&`assets/chars/m/${c.image.id}.webp`;}if(p.crew){const c=crew.find(x=>x.name===p.crew);return c&&FU(c.cover);}return null;};
 const N=list.length;
 sec.style.height=`${Math.round(120+N*58)}svh`;
 const pics=[];
 stage.innerHTML=list.map((m,i)=>{
  const key=`${m.series}-${m.n}`,art=(PICK[key]||[]).map(src).filter(Boolean);art.forEach(a=>pics.push(a));
  const hue=HUE[m.emotion]||(m.series==='Re:Zero'?'#8a6cff':'#f3c969');
  const blocks=m.text.slice(0,4).map(b=>b.q?`<blockquote>${esc(b.q)}</blockquote>`:`<p>${esc(b.p)}</p>`).join('');
  return `<article class="mo" data-i="${i}" style="--h:${hue}">
   <div class="mo-art">${art.length?art.map((a,k)=>`<figure class="mo-pic${k?' back':''}"><img data-src="${esc(a)}" alt="" decoding="async"></figure>`).reverse().join(''):`<div class="mo-type"><span>${esc(m.emotion||m.series)}</span><b>${esc(m.title)}</b></div>`}</div>
   <div class="mo-copy"><p class="mo-series">${esc(m.series)} · ${esc(m.n)}</p><h3>${esc(m.title)}</h3>${m.emotion?`<p class="mo-emotion">${esc(m.emotion)}</p>`:''}<div class="mo-text">${blocks}</div></div>
  </article>`;}).join('');
 const items=[...stage.children].map(el=>({el,art:el.querySelector('.mo-art'),copy:el.querySelector('.mo-copy'),imgs:[...el.querySelectorAll('img[data-src]')]}));
 const load=it=>{if(it&&it.imgs.length){it.imgs.forEach(im=>{im.src=im.dataset.src;im.removeAttribute('data-src');im.decode?.().catch(()=>{});});it.imgs=[];}};
 new IntersectionObserver(([e],io)=>{if(e.isIntersecting){load(items[0]);load(items[1]);io.disconnect();}},{rootMargin:'150% 0px'}).observe(sec);
 let cur=-1;
 part({el:sec,update(s){
  const p=motion.reduced?0:pinned(this,s),x=clamp(p*1.05-0.02)*(N-1),vw=view.vw,vh=view.vh;
  items.forEach((it,i)=>{
   const d=i-x,a=Math.abs(d);
   if(a>1.3){if(it.v){it.v=0;it.el.style.visibility='hidden';}return;}
   if(!it.v){it.v=1;it.el.style.visibility='visible';load(it);load(items[i+1]);load(items[i+2]);}
   // leaving: tossed up and to the left; arriving: rises from below, tilted
   const t=d<0?`translate3d(${(d*vw*0.5).toFixed(1)}px,${(d*vh*0.18).toFixed(1)}px,0) rotate(${(d*16).toFixed(2)}deg)`:`translate3d(${(d*vw*0.06).toFixed(1)}px,${(d*vh*0.75).toFixed(1)}px,0) rotate(${(d*7).toFixed(2)}deg) scale(${(1-d*0.08).toFixed(4)})`;
   it.art.style.transform=t;it.art.style.opacity=(1-smooth(clamp((a-0.35)/0.75))).toFixed(3);
   it.el.style.setProperty('--fan',(1-Math.min(a,1)).toFixed(3));
   const o=1-smooth(clamp((a-0.06)/0.36));it.copy.style.opacity=o.toFixed(3);it.copy.style.transform=`translate3d(0,${(d*70).toFixed(1)}px,0)`;
   it.el.style.zIndex=String(100-Math.round(d*10));
  });
  const k=Math.round(x);if(k!==cur){cur=k;idx.textContent=`${pad(k+1)} / ${pad(N)}`;bg.style.setProperty('--h',items[k].el.style.getPropertyValue('--h'));}
 }});
 registerCollection('moments',()=>({title:'Moments that live in my head',eyebrow:'Anime Journey',ids:[...new Set(pics)],src:x=>x}));
 stage.addEventListener('click',e=>{const f=e.target.closest('.mo-pic');if(!f)return;const im=f.querySelector('img');openViewer('moments',im.getAttribute('src')||im.dataset.src);});
}

// The Log Pose: the archive's chapter index. A small glass compass sits in the bar; its needle swings to a
// new bearing whenever you reach a new chapter (a Log Pose points at the next island). Tap it and every
// chapter appears as an island to sail to, with the one you're on marked. On phones it is the only way
// to jump around, so it also carries the Motion switch that no longer fits in the bar.
import {$,esc,data,part,absTop,jumpTo,TH,motion,setReduced,view} from './core.js';
import {poneglyphsFound} from './poneglyph.js';

const poster=k=>{const p=data.posters&&data.posters[k];return p&&p.img;};
// [section id, number, kicker, title (the section's own heading), thumbnail]
const CHAPTERS=[
 ['home','00','The beginning','“Anime is for losers.”',()=>poster('anime:One Piece')],
 ['characters','01','The Character Log','They each left something behind.',()=>{const c=data.characters?.characters?.[0];return c&&`assets/chars/m/${c.image.id}.webp`;}],
 ['crew','02','The Crew','Everyone with a price on their head.',()=>data.media?.crew?.[0]&&TH(data.media.crew[0].cover)],
 ['voyage','03','The Voyage','They sailed ten seas.',()=>data.media?.journey?.[0]&&TH(data.media.journey[0])],

 ['moments','✦','Moments','The ones that live in my head.',()=>'assets/moments/heartbeat-1.webp'],
 ['spreads','04','Colour spreads','Manga is black and white. Mostly.',()=>data.media?.spreads?.wall?.[0]&&TH(data.media.spreads.wall[0])],
 ['panels','05','Favourite panels','Between the panels.',()=>{const c=data.panels?.onepiece?.[0]?.cover;return c&&`assets/panels/m/${c.id}.webp`;}],
 ['story-show','↗','A page of its own','The Story of One Piece, arc by arc.',()=>'assets/img/t/695560c960c1.webp'],
 ['journey','06','The Anime Journey','I used to call them just cartoons.',()=>poster('anime:Berserk')||poster('anime:Demon Slayer')],
 ['top','07','My current top 10','Personal, unstable, allowed to change.',()=>poster('anime:Re:Zero')||poster('anime:One Piece')],
 ['records','✦','The Shelf','Rated, preserved as written.',()=>poster('anime:Death Note')],
 ['logbook','✦','The Logbook','How far I’ve come.',()=>poster('anime:Frieren')],
 ['worlds','✦','Beyond the Grand Line','Other worlds that stayed.',()=>data.media?.worlds?.[0]&&TH(data.media.worlds[0].cover)],
 ['vault','08','The Card Vault','My kind of treasure.',()=>data.archive?.cards?.find(c=>c.image)?.image],
 ['scenes','09','Scenes that stay','“Come on, heartbeat. Beat louder.”',()=>'assets/media/luffy_poster.jpg'],
 ['library','10','The Ohara Library','Stories leave traces.',()=>data.media?.wall?.[0]&&TH(data.media.wall[0])],
 ['life','II','Book II','Some chapters aren’t anime.',()=>null]
];
// Where the needle points while you are in each chapter (degrees). Arbitrary, like the sea.
const BEARING=[-28,34,-52,68,14,-40,52,-12,30,-64,44,-22,58,-36,20,0];

export function initLogPose(){
 const btn=$('#logpose-btn'),dlg=$('#logpose'),list=$('#lp-list'),needle=btn.querySelector('.lp-needle'),motionBtn=$('#lp-motion');
 // An id that ends in .html is another page (the One Piece story); everything else is a section here.
 const chapters=CHAPTERS.map(([id,n,kicker,title,thumb],i)=>({id,n,kicker,title,thumb,i,page:id.endsWith('.html'),el:document.getElementById(id)})).filter(c=>c.el||c.page);
 const sections=chapters.filter(c=>!c.page);
 const visible=()=>chapters.filter(c=>c.page||!c.el.hidden);
 let cur=-1,built=false;

 function build(){
  list.innerHTML=visible().map((c,k)=>{const src=c.thumb();return `<li style="--k:${k}"><${c.page?`a href="${c.id}"`:'button'} class="lp-isle${c.page?' lp-page':''}" data-to="${c.page?'':c.id}">
   <span class="lp-img">${src?`<img src="${esc(src)}" alt="" decoding="async">`:'<span class="lp-seal" aria-hidden="true">II</span>'}</span>
   <span class="lp-txt"><small><span class="lp-n">${esc(c.n)}</span>${esc(c.kicker)}</small><b>${esc(c.title)}</b></span>
   <i class="lp-here">You are here</i></${c.page?'a':'button'}></li>`;}).join('');
  built=true;
 }
 function mark(){list.querySelectorAll('.lp-isle').forEach(b=>b.classList.toggle('now',b.dataset.to===sections[cur]?.id));}
 const showMotion=()=>{motionBtn.innerHTML=`Motion <b>${motion.reduced?'Off':'On'}</b>`;motionBtn.setAttribute('aria-pressed',String(motion.reduced));};

 btn.addEventListener('click',()=>{
  if(!built)build();mark();showMotion();
  // once the hunt has started, the Log Pose keeps count (and says nothing before that)
  const pg=poneglyphsFound(),pgEl=$('#lp-pg');pgEl.classList.toggle('on',pg>0);pgEl.innerHTML=pg?`Road Poneglyphs found: <b>${pg}</b> / 4`:'';
  dlg.showModal();document.documentElement.style.overflow='hidden';
  const now=list.querySelector('.lp-isle.now')||list.querySelector('.lp-isle');now?.focus({preventScroll:true});
  now?.scrollIntoView({block:'center'});
 });
 dlg.addEventListener('close',()=>{document.documentElement.style.overflow='';});
 dlg.addEventListener('click',e=>{
  if(e.target.closest('#lp-close')||e.target===dlg){dlg.close();return;}
  const b=e.target.closest('.lp-isle');if(!b||b.classList.contains('lp-page'))return;
  dlg.close();btn.focus({preventScroll:true});
  const el=document.getElementById(b.dataset.to);if(el)jumpTo(b.dataset.to==='home'?0:absTop(el));
 });
 motionBtn.addEventListener('click',()=>{setReduced(!motion.reduced);showMotion();});
 motion.listeners.push(showMotion);

 // Needle: swing to the bearing of the chapter you're in.
 let tops=[];
 part({always:true,measure(){tops=sections.map(c=>c.el.hidden?Infinity:absTop(c.el));},update(s){
  const y=s+view.vh*0.4;let k=0;tops.forEach((t,i)=>{if(t<=y)k=i;});
  if(k===cur)return;cur=k;
  needle.style.transform=`rotate(${BEARING[sections[k].i%BEARING.length]}deg)`;
  if(dlg.open)mark();
 }});
}

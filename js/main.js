import {createJourney} from './zoom-journey.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);
const pad=n=>String(n).padStart(2,'0');
const PREF='grand-archive-voyage:reduced';
const systemReduced=matchMedia('(prefers-reduced-motion: reduce)');
const coarse=matchMedia('(pointer: coarse)').matches;
let reduced=systemReduced.matches;
try{const saved=localStorage.getItem(PREF);if(saved!==null)reduced=saved==='1'||systemReduced.matches;}catch{}

const [journeyCfg,archive,media,PANELS]=await Promise.all([
 fetch('data/journey.json').then(r=>r.json()),
 fetch('data/archive.json').then(r=>r.json()),
 fetch('data/media.json').then(r=>r.json()),
 fetch('data/panels.json').then(r=>r.json())
]);
// Every photo exists as a full-size WebP (assets/img/f) and a light thumbnail (assets/img/t).
// data/media.json assigns each one to exactly one place on the page, so nothing repeats.
const TH=id=>`assets/img/t/${id}.webp`,FU=id=>`assets/img/f/${id}.webp`;
const wh=id=>{const d=media.img[id]||[4,5];return `width="${d[0]}" height="${d[1]}"`;};
const pic=(id,alt='',full=false,extra='')=>`<img src="${full?FU(id):TH(id)}" ${wh(id)} alt="${esc(alt)}" loading="lazy" decoding="async"${extra}>`;

/* ------------------------------------------------------------------ scroll engine
 Every section reads one smoothed scroll value (sy). It eases toward the real scroll position,
 which gives wheel/trackpad scrolling a fluid, inertial feel; touch devices get a much shorter
 time constant so the zoom stays locked under the finger. Sections only update while near view. */
let sy=scrollY,vh=innerHeight,vw=innerWidth,running=false,lastT=0;
const parts=[];
const absTop=el=>el.getBoundingClientRect().top+scrollY;
function tick(t){
 const target=scrollY,dt=Math.min(64,(t-lastT)||16);lastT=t;
 if(reduced)sy=target;else{sy+=(target-sy)*(1-Math.exp(-dt/(coarse?40:115)));if(Math.abs(target-sy)<0.35)sy=target;}
 for(const p of parts)if(p.always||(sy+vh*1.6>p.top&&sy-vh*0.6<p.top+p.h))p.update(sy);
 running=sy!==target;if(running)requestAnimationFrame(tick);
}
function kick(){if(!running){running=true;lastT=performance.now();requestAnimationFrame(tick);}}
function measureAll(){if(!innerHeight)return;vh=innerHeight;vw=innerWidth;for(const p of parts)p.measure();for(const p of parts)p.update(sy);}
function jumpTo(y){y=Math.max(0,Math.round(y));scrollTo({top:y,behavior:'instant'});if(Math.abs(y-sy)>vh*2)sy=y;kick();}
addEventListener('scroll',kick,{passive:true});
let rz;const remeasure=()=>{clearTimeout(rz);rz=setTimeout(measureAll,120);};
addEventListener('resize',remeasure);addEventListener('load',remeasure);
// Late fonts/images can shift section positions; keep every pinned range in sync with layout.
new ResizeObserver(remeasure).observe(document.querySelector('main'));
const pinned=(p,s)=>clamp((s-p.top)/Math.max(1,p.h-vh));

/* ------------------------------------------------------------------ 01 voyage */
const voyageSec=$('#voyage'),capEl=$('#voyage-caption'),rail=$('#rail');
const caption={el:capEl,set(L,i,n){capEl.querySelector('.vc-index').textContent=`${pad(i+1)} / ${pad(n)}`;capEl.querySelector('.vc-kicker').textContent=L.kicker;capEl.querySelector('.vc-title').textContent=L.title;capEl.querySelector('.vc-line').textContent=L.line;}};
// Private life chapters: read only from the copy on this Mac. The private/ folder never reaches GitHub.
const LOCAL=!/github\.io$/i.test(location.hostname);
const LIFE=LOCAL?await fetch('private/life.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null):null;
const LF=id=>`private/built/f/${id}.webp`,LT=id=>`private/built/t/${id}.webp`;
if(LIFE&&LIFE.chapters.length){
 // Photos aren't nested like the spiral art, so each hop is a picture-in-picture dive: the next
 // chapter appears small at the centre, softly feathered, and grows to fill the screen.
 const hop={focalX:.5,focalY:.5,scale:3.4,offsetX:0,offsetY:0,blendStart:.28,blendEnd:.68,feather:.2};
 const life=LIFE.chapters.map((c,i)=>{const p=c.photos[0];return{id:'life-'+i,image:LF(p.id),width:p.w,height:p.h,kicker:'LIFE · '+c.name.toUpperCase(),title:c.title,line:c.line,...(i<LIFE.chapters.length-1?{match:{...hop}}:{})};});
 journeyCfg.layers[journeyCfg.layers.length-1].match={...hop};
 journeyCfg.layers.push(...life);
}
rail.innerHTML=journeyCfg.layers.map((l,i)=>`<button data-seg="${i}" aria-label="Chapter ${i+1}: ${esc(l.kicker)}"><span>${esc(l.kicker)}</span></button>`).join('');
const voyage=createJourney({section:voyageSec,layerHost:$('#voyage-layers'),config:journeyCfg,caption,
 onChange:i=>$$('#rail button').forEach((b,k)=>k===i?b.setAttribute('aria-current','step'):b.removeAttribute('aria-current'))});
rail.addEventListener('click',e=>{const b=e.target.closest('button');if(b)jumpTo(voyage.scrollYFor(+b.dataset.seg));});
$('#voyage-static').innerHTML=journeyCfg.layers.map((l,i)=>`<li><img src="${esc(l.image)}" alt="" loading="lazy" decoding="async"><p class="eyebrow">${pad(i+1)} · ${esc(l.kicker)}</p><h3>${esc(l.title)}</h3><p>${esc(l.line)}</p></li>`).join('');
const intro=$('#voyage-intro'),vEnd=$('#voyage-end');
parts.push({top:0,h:1,measure(){this.top=absTop(voyageSec);this.h=voyageSec.offsetHeight;voyage.measure();},
 update(s){
  if(reduced)return;
  const g=pinned(this,s);voyage.render(g);
  const st=voyage.state;
  intro.style.opacity=st.seg===0?(1-smooth(clamp(st.p/0.08))).toFixed(3):'0';
  intro.style.transform=`translate3d(0,${(-st.p*120).toFixed(1)}px,0) scale(${(1+st.p*0.15).toFixed(4)})`;
  const e=st.seg===journeyCfg.layers.length-1?smooth(clamp((st.p-0.62)/0.3)):0;vEnd.style.opacity=e.toFixed(3);vEnd.classList.toggle('live',e>0.5);
  rail.style.opacity=(1-e).toFixed(3);
 }});

const bar=$('#bar');
/* ------------------------------------------------------------------ 02 characters */
// Presentation lines from New World; the full personal writing lives in archive.json.
const CHAR_COPY=[
 {headline:'Dream without permission.',role:'The north star',line:'The man who made freedom feel practical.'},
 {headline:'A place to belong.',role:'The heart of the archive',line:'An entire life of running. Then one reason to stay.'},
 {headline:'Let your will speak.',role:'Will without noise',line:'Loyalty that never needed an explanation.'},
 {headline:'Keep moving. Anyway.',role:'Defy the dark',line:'Suffering never gets the final word.'},
 {headline:'Read the room.',role:'Control before reaction',line:'Take the discipline. Leave the dehumanization.'},
 {headline:'Fine. One more try.',role:'The biggest opinion reversal',line:'Afraid. Exhausted. Still choosing another attempt.'},
 {headline:'Be their reassurance.',role:'A symbol of hope',line:'One person can change what hope looks like.'},
 {headline:'No reset button.',role:'Face reality',line:'A second chance is a reason to live this one.'},
 {headline:'Respect the craft.',role:'Give your best',line:'There is real work and value behind every meal.'},
];
const MC=media.characters;
$('#char-list').innerHTML=archive.characters.map((c,i)=>{const p=CHAR_COPY[i]||{},m=MC[i],n=m.all.length;return `<article class="char">
 <div class="char-main">
  <figure class="char-media">${pic(m.portrait,c.name+' artwork',true)}</figure>
  <div class="char-text">
   <span class="char-no rv">${String(i+1).padStart(3,'0')} / ${String(archive.characters.length).padStart(3,'0')}</span>
   <p class="role rv" style="--d:.04s">${esc(p.role||c.kicker)}</p>
   <h3 class="rv" style="--d:.08s">${esc(c.name)}</h3>
   <p class="headline rv" style="--d:.14s">${esc(p.headline)}</p>
   <p class="line rv" style="--d:.18s">${esc(p.line)}</p>
   <p class="body rv" style="--d:.18s">${esc(c.body.split(/(?<=\.)\s/).slice(0,2).join(' '))}</p>
   ${c.quote?`<blockquote class="rv" style="--d:.24s">${esc(c.quote)}</blockquote>`:''}
   <div class="tags rv" style="--d:.3s">${c.lessons.map(t=>`<span>${esc(t)}</span>`).join('')}</div>
   <div class="char-actions rv" style="--d:.36s"><button class="link" data-char="${i}">Read the full record →</button>${n>1?`<button class="link quiet" data-collection="char:${i}">${n} photos</button>`:''}</div>
  </div>
 </div>
 ${m.strip.length?`<div class="strip" data-dir="${i%2?1:-1}"><div class="strip-track">${m.strip.map(id=>`<button class="shot" data-view="char:${i}" data-id="${id}" aria-label="Open ${esc(c.name)} artwork">${pic(id,'')}</button>`).join('')}${n>m.strip.length+1?`<button class="strip-more" data-collection="char:${i}"><b>${n}</b><span>View all of ${esc(c.name.split(' ')[0])}</span></button>`:''}</div></div>`:''}
</article>`;}).join('');
const rzSec=$('#char-reveal'),rzFrame=rzSec.querySelector('.rz-frame'),rzImg=rzFrame.querySelector('img'),rzHead=rzSec.querySelector('.rz-head'),rzScrim=rzSec.querySelector('.rz-scrim'),rzAfter=rzSec.querySelector('.rz-after');
// The headline owns the top of the screen and leaves before the photo's edge can reach it;
// the photo opens from a card below it to full bleed; the caption only arrives over a scrim.
parts.push({top:0,h:1,measure(){this.top=absTop(rzSec);this.h=rzSec.offsetHeight;},
 update(s){
  const p=reduced?1:pinned(this,s),portrait=vw<vh;
  const out=smooth(clamp((p-0.1)/0.26)),z=smooth(clamp((p-0.1)/0.56)),k=1-z;
  rzHead.style.opacity=(1-out).toFixed(3);
  rzHead.style.transform=`translate3d(0,${(-out*16).toFixed(2)}vh,0) scale(${(1-out*0.06).toFixed(4)})`;
  rzHead.style.visibility=out>0.99?'hidden':'';
  rzFrame.style.clipPath=`inset(${((portrait?52:54)*k).toFixed(2)}% ${((portrait?9:31)*k).toFixed(2)}% ${((portrait?6:7)*k).toFixed(2)}% round ${(28*k).toFixed(1)}px)`;
  // While it is still a card, slide the art so the subject (rose, hat) is framed in it, not just a hand.
  const cardMid=portrait?0.73:0.735,shift=(cardMid-0.4)*vh*k;
  rzImg.style.transform=`translate3d(0,${shift.toFixed(1)}px,0) scale(${(1.3-0.26*z-0.04*smooth(clamp((p-0.66)/0.34))).toFixed(4)})`;
  rzScrim.style.opacity=smooth(clamp((p-0.55)/0.2)).toFixed(3);
  const a=smooth(clamp((p-0.68)/0.16));rzAfter.style.opacity=a.toFixed(3);rzAfter.style.transform=`translate3d(0,${((1-a)*30).toFixed(1)}px,0)`;
 }});
// Each character's photo opens and settles as it scrolls in, with a slow parallax inside the frame.
// Filmstrips drift sideways as they pass, alternating direction.
$$('.strip').forEach(st=>{const tr=st.querySelector('.strip-track'),dir=+st.dataset.dir;parts.push({top:0,h:1,measure(){this.top=absTop(st);this.h=st.offsetHeight;this.room=Math.max(0,tr.scrollWidth-st.clientWidth);},
 update(s){if(reduced){tr.style.transform='';return;}const q=clamp((s+vh-this.top)/(this.h+vh));const span=this.room+vw*0.08;const x=dir>0?-q*span:-(1-q)*span;tr.style.transform=`translate3d(${(x+vw*0.04).toFixed(1)}px,0,0)`;}});});
$$('.char-media').forEach(fig=>{const img=fig.querySelector('img');parts.push({top:0,h:1,measure(){this.top=absTop(fig);this.h=fig.offsetHeight;},
 update(s){
  if(reduced){fig.style.clipPath='none';img.style.transform='none';return;}
  const q=smooth(clamp((s+vh-this.top)/(vh*0.85))),c=clamp((s+vh/2-(this.top+this.h/2))/vh,-1,1);
  fig.style.clipPath=`inset(${(14*(1-q)).toFixed(2)}% ${(14*(1-q)).toFixed(2)}% round 28px)`;
  img.style.transform=`translate3d(0,${(c*-5).toFixed(2)}%,0) scale(${(1.3-0.24*q).toFixed(4)})`;
 }});});

/* ------------------------------------------------------------------ crew (bento) */
const CREW_SIZE={0:'xl',1:'tall',8:'xl'};
$('#crew-grid').innerHTML=media.crew.map((c,i)=>`<button class="tile ${CREW_SIZE[i]||''} rv" style="--d:${(i%4)*0.06}s" data-collection="crew:${i}">${pic(c.cover,c.name,CREW_SIZE[i]==='xl')}<span class="tile-copy"><small>${c.all.length} ${c.all.length===1?'photo':'photos'}</small><b>${esc(c.name)}</b><span>${esc(c.line)}</span></span></button>`).join('');

/* ------------------------------------------------------------------ colour spreads (zoom-out wall) */
// Act 1: one spread fills the screen and the camera pulls back to reveal a 9 x 7 wall around it.
// Act 2: the rows start sliding in alternating directions. Act 3: the whole wall tips back into
// perspective, like spreads laid out on a table, and the headline arrives.
const spSec=$('#spreads'),spWall=$('#spread-wall'),spCopy=$('#spread-copy'),spShade=spSec.querySelector('.spread-shade');
const SP_COLS=9,SP_ROWS=7,SP_MID=Math.floor(SP_ROWS/2)*SP_COLS+Math.floor(SP_COLS/2);
const SPW=[...media.spreads.wall.slice(1)];SPW.splice(SP_MID,0,media.spreads.wall[0]);
spWall.innerHTML=Array.from({length:SP_ROWS},(_,r)=>`<div class="sp-row">${SPW.slice(r*SP_COLS,(r+1)*SP_COLS).map((id,c)=>`<button class="sp" data-view="spreads" data-id="${id}" tabindex="-1" aria-hidden="true">${pic(id,'',r*SP_COLS+c===SP_MID)}</button>`).join('')}</div>`).join('');
$('#spreads-all').textContent=`View all ${media.spreads.all.length} spreads`;
const spRows=[...spWall.children],spTiles=[...spWall.querySelectorAll('.sp')],spMid=spTiles[SP_MID];
// Native lazy-loading doesn't fire inside a 3D-transformed subtree, so load the wall as the section approaches.
const spIO=new IntersectionObserver(([e])=>{if(e.isIntersecting){spWall.querySelectorAll('img').forEach(i=>i.loading='eager');spIO.disconnect();}},{rootMargin:'300% 0px'});spIO.observe(spSec);
parts.push({top:0,h:1,measure(){this.top=absTop(spSec);this.h=spSec.offsetHeight;
  const portrait=vw<vh,T=portrait?vw*0.5:vw*0.26,G=portrait?10:16;this.T=T;this.G=G;
  spWall.style.setProperty('--t',T+'px');spWall.style.setProperty('--g',G+'px');
  this.S0=Math.max(vw/T,vh/(T*0.625))*1.02;},
 update(s){
  const p=reduced?0.8:pinned(this,s);
  const z=smooth(clamp(p/0.4)),sc=Math.pow(this.S0,1-z);
  const d=smooth(clamp((p-0.36)/0.64)),tilt=smooth(clamp((p-0.46)/0.4));
  spWall.style.transform=`translate(-50%,-50%) perspective(1800px) rotateX(${(tilt*30).toFixed(2)}deg) rotateZ(${(-tilt*9).toFixed(2)}deg) scale(${(sc*(1-tilt*0.12)).toFixed(4)})`;
  const step=this.T+this.G;
  spRows.forEach((row,r)=>{const off=r-Math.floor(SP_ROWS/2);row.style.transform=`translate3d(${(off===0?0:(off%2?1:-1)*d*step*(0.9+Math.abs(off)*0.25)).toFixed(1)}px,0,0)`;});
  const o=0.2+0.8*smooth(clamp((z-0.1)/0.55));spTiles.forEach(t=>{if(t!==spMid)t.style.opacity=o.toFixed(3);});
  spShade.style.opacity=smooth(clamp((p-0.6)/0.18)).toFixed(3);
  const c=smooth(clamp((p-0.66)/0.16));spCopy.style.opacity=c.toFixed(3);spCopy.style.transform=`translate(-50%,calc(-50% + ${((1-c)*30).toFixed(1)}px))`;
  spCopy.style.pointerEvents=c>0.5?'auto':'none';
 }});

/* ------------------------------------------------------------------ between the panels */
// Built from Goma's two Obsidian notes (data/panels.json). Panels wipe in right-to-left, the way
// a manga page is read; the chapter ruler tracks where in One Piece each panel comes from.
const PM=id=>`assets/panels/m/${id}.webp`,PF=id=>`assets/panels/${id}.webp`;
const OP=PANELS.onepiece[0];
const SERIES_FIX={'THE FLOWERS OF EVIL':['The Flowers of Evil','Shuzo Oshimi'],'ADABANA':['Adabana','NON'],'BLACK CLOVER':['Black Clover','Yuki Tabata'],'BLOOD ON TRACKS':['Blood on the Tracks','Shuzo Oshimi'],'Flagrant Flower Blooms with Dignity':['The Fragrant Flower Blooms with Dignity','Saka Mikami'],'Smoking Behind the Supermarket with you':['Smoking Behind the Supermarket with You','Jinushi']};
const niceGroup=g=>g.replace(/\b(And|With|The|Of)\b/g,(m,w,o)=>o?m.toLowerCase():m).replace(/ — /,' — ');
const aspect=im=>im.w/im.h;
function panelHTML(p,key,idx){
 const im=p.images[0],full=/spread/i.test(p.note)||/mural/i.test(p.title||'')||(p.images.length===1&&aspect(im)>1.9);
 const cls=full?'full':aspect(im)>1.2?'wide':'tall';
 const figs=p.images.map(i=>`<button class="pnl-fig" data-view="${key}" data-id="${i.id}" aria-label="Open panel full size"><img src="${PM(i.id)}" width="${i.w}" height="${i.h}" alt="${esc(p.title||'Manga panel')}" loading="lazy" decoding="async"></button>`).join('');
 return `<article class="pnl ${cls}${idx%2?' flip':''}"${p.chapter?` data-ch="${p.chapter}"`:''}>
  <div class="pnl-figs">${figs}</div>
  <div class="pnl-cap pop">${p.chapter?`<span class="ch-tag">CH. ${p.chapter}</span>`:''}${p.title?`<h5>${esc(p.title)}</h5>`:''}<p>${esc(p.note)}</p></div>
 </article>`;
}
$('#op-spoil').textContent=OP.spoiler||'';
const groups=[];OP.panels.forEach(p=>{let g=groups.find(x=>x.name===p.group);if(!g)groups.push(g={name:p.group,items:[]});g.items.push(p);});
let k=0;
$('#op-panels').innerHTML=groups.map((g,gi)=>`<section class="pgroup"><div class="pg-head"><span class="speed" aria-hidden="true"></span><p>№ ${pad(gi+1)}</p><h4>${esc(niceGroup(g.name))}</h4><small>${g.items.length} panel${g.items.length===1?'':'s'}</small></div><div class="pg-page">${g.items.map(p=>panelHTML(p,'panels:op',k++)).join('')}</div></section>`).join('');
$('#other-panels').innerHTML=PANELS.other.map((sr,si)=>{const [title,author]=SERIES_FIX[sr.title]||[sr.title,sr.author];return `<section class="pseries">
 <aside class="ps-side"><div class="ps-sticky">${sr.cover?`<button class="ps-cover" data-view="panels:${si}" data-id="${sr.cover.id}" aria-label="Open cover">${`<img src="${PM(sr.cover.id)}" width="${sr.cover.w}" height="${sr.cover.h}" alt="${esc(title)} cover" loading="lazy" decoding="async">`}</button>`:''}<p class="ink-kicker">${esc(author)}</p><h4>${esc(title)}</h4><small>${sr.panels.length} panel${sr.panels.length===1?'':'s'}</small></div></aside>
 <div class="ps-panels">${sr.panels.map((p,i)=>panelHTML(p,'panels:'+si,i)).join('')}</div>
</section>`;}).join('');
const PANEL_SETS={op:{title:'One Piece',eyebrow:'Favourite panels',list:OP.panels.flatMap(p=>p.images.map(i=>({id:i.id,cap:(p.chapter?`Ch. ${p.chapter} · `:'')+(p.title?p.title+'. ':'')+p.note})))}};
PANELS.other.forEach((sr,si)=>{const [title]=SERIES_FIX[sr.title]||[sr.title];PANEL_SETS[si]={title,eyebrow:'Favourite panels',list:[...(sr.cover?[{id:sr.cover.id,cap:title+' — cover'}]:[]),...sr.panels.flatMap(p=>p.images.map(i=>({id:i.id,cap:p.note})))]};});

// Iris: the black page closes onto a circle of paper that opens to fill the screen.
const irisSec=$('#ink-iris'),irisPaper=$('#iris-paper'),irisCopy=irisPaper.querySelector('.iris-copy'),irisJp=irisPaper.querySelector('.iris-jp');
parts.push({top:0,h:1,measure(){this.top=absTop(irisSec);this.h=irisSec.offsetHeight;this.R=Math.hypot(vw,vh)/2+4;},
 update(s){const p=reduced?1:pinned(this,s),r=smooth(clamp((p-0.04)/0.56));
  irisPaper.style.clipPath=r>=0.999?'none':`circle(${(r*this.R).toFixed(1)}px at 50% 52%)`;
  const c=smooth(clamp((p-0.4)/0.3));irisCopy.style.opacity=c.toFixed(3);irisCopy.style.transform=`translate3d(0,${((1-c)*40).toFixed(1)}px,0)`;
  irisJp.style.transform=`translate3d(0,${((0.5-p)*18).toFixed(2)}vh,0)`;}});
// Right-to-left ink wipe per panel.
$$('.pnl-fig').forEach(f=>{const img=f.querySelector('img');parts.push({top:0,h:1,measure(){this.top=absTop(f);this.h=f.offsetHeight;},
 update(s){if(reduced){f.style.clipPath='';img.style.transform='';return;}const q=smooth(clamp((s+vh*0.92-this.top)/(vh*0.55)));
  f.style.clipPath=q>=0.999?'none':`inset(0 0 0 ${(100*(1-q)).toFixed(2)}%)`;img.style.transform=`scale(${(1.08-0.08*q).toFixed(4)})`;}});});
// Chapter ruler follows whichever One Piece panel is at the centre of the screen.
const opWrap=$('#op-wrap'),chNow=$('#ch-now'),chFill=$('#ch-fill'),chTrack=$('#ch-track'),opPanels=$$('#op-panels .pnl');
chTrack.insertAdjacentHTML('beforeend',[...new Set(OP.panels.map(p=>p.chapter).filter(Boolean))].map(c=>`<b style="left:${(c/1044*100).toFixed(2)}%"></b>`).join(''));
parts.push({top:0,h:1,measure(){this.top=absTop(opWrap);this.h=opWrap.offsetHeight;this.cs=opPanels.map(el=>[absTop(el),+el.dataset.ch||0]);},
 update(s){let ch=0;for(const [t,c] of this.cs){if(t<s+vh*0.55&&c)ch=c;}if(ch!==this.ch){this.ch=ch;chNow.textContent=ch?`CH. ${ch}`:'CH. —';chFill.style.transform=`scaleX(${(ch/1044).toFixed(4)})`;}}});
// The fixed bar turns to ink-on-paper while the paper section is under it.
const inkSec=$('#panels');
parts.push({always:true,top:0,h:1,measure(){this.a=absTop(irisSec)+irisSec.offsetHeight*0.3;this.b=absTop(inkSec)+inkSec.offsetHeight-60;},update(s){bar.classList.toggle('paper',s>this.a&&s<this.b);}});

/* ------------------------------------------------------------------ 03 journey (horizontal) */
const track=$('#journey-track'),jSec=$('#journey'),jBar=$('#journey-bar');
track.innerHTML=archive.journey.map((j,i)=>`<button class="jcard" data-chapter="${i}"><figure>${pic(media.journey[i],'')}</figure><div class="jc-body"><span class="jc-date">${esc(j.date)}</span><h3>${esc(j.title)}</h3><p>${esc(j.body.length>150?j.body.slice(0,150).replace(/\s+\S*$/,'')+'…':j.body)}</p>${j.quote?`<q>${esc(j.quote)}</q>`:''}</div></button>`).join('');
const jImgs=[...track.querySelectorAll('img')],jCards=[...track.children];
parts.push({top:0,h:1,shift:0,measure(){const lead=parseFloat(getComputedStyle(track).paddingLeft)||0;this.shift=Math.max(0,track.scrollWidth-vw+lead);jSec.style.height=reduced?'auto':`${Math.round(vh+this.shift*1.1)}px`;this.top=absTop(jSec);this.h=jSec.offsetHeight;},
 update(s){
  if(reduced){track.style.transform='';track.style.overflowX='auto';return;}
  track.style.overflowX='';
  const p=pinned(this,s),x=-p*this.shift;track.style.transform=`translate3d(${x.toFixed(1)}px,0,0)`;jBar.style.transform=`scaleX(${p.toFixed(4)})`;
  jCards.forEach((c,i)=>{const r=c.offsetLeft+x+c.offsetWidth/2,o=clamp((r-vw/2)/vw,-1,1);jImgs[i].style.transform=`translate3d(${(o*-9).toFixed(2)}%,0,0) scale(1.18)`;});
 }});

/* ------------------------------------------------------------------ the shelf (anime · manga · live action) */
// Every record gets its cover art (data/posters.json) and a big score; colour glow comes from the cover.
const [POSTERS,SH,LOG]=await Promise.all(['data/posters.json','data/shelf.json','data/logbook.json'].map(u=>fetch(u).then(r=>r.ok?r.json():null).catch(()=>null)));
// data/shelf.json is generated from Goma's Obsidian trackers by tools/sync.py.
const normT=t=>String(t).toLowerCase().replace(/×/g,'x').replace(/[^a-z0-9]/g,'');
const cap=s=>s?s[0].toUpperCase()+s.slice(1):'';
const ANIME_TAG={completed:'Completed',watching:'Watching',paused:'On pause',want:'Want to watch'},MANGA_TAG={reading:'Reading',finished:'Finished',next:'Up next',dropped:'Dropped'};
const SHELF={
 anime:{items:SH.anime.map(a=>({...a,tag:[ANIME_TAG[a.status],a.status==='watching'&&a.progress,a.pick&&"Claude's pick"].filter(Boolean).join(' · ')})),filters:[['all','All'],['rated','Rated'],['watching','Watching'],['want','Want to watch'],['canon','Top 10']],main:a=>a.status!=='want'},
 manga:{items:SH.manga.map(a=>({...a,s:a.status==='reading'?a.chapter:null,tag:[MANGA_TAG[a.status],a.genre].filter(Boolean).join(' · ')})),filters:[['all','All'],['reading','Reading'],['finished','Finished'],['next','Up next'],['dropped','Dropped']],main:a=>a.status==='reading'||a.status==='finished'},
 tv:{items:SH.tv.map(a=>({...a,tag:a.genre||'Live action'})),filters:[['all','All'],['rated','Rated']],main:()=>true}
};
const posterOf=it=>POSTERS&&POSTERS[`${it.k}:${it.t}`];
let tab='anime',filter='all';
const scoreNum=s=>{const n=parseFloat(s);return /^\d/.test(String(s))&&!isNaN(n)?n:null;};
function shelfList(){
 const q=$('#search').value.toLowerCase().trim(),T=SHELF[tab];let list=T.items;
 if(tab==='anime'&&filter==='canon')list=SH.top10.map((a,i)=>{const it=T.items.find(x=>normT(x.t)===normT(a.title))||T.items.find(x=>normT(a.title).includes(normT(x.t)))||{t:a.title,k:'anime'};return{...it,rank:i+1,why:a.body};});
 else if(filter==='all')list=list.filter(T.main);
 else if(filter==='rated')list=list.filter(x=>scoreNum(x.s)!==null);
 else list=list.filter(x=>x.status===filter);
 list=list.filter(a=>a.t.toLowerCase().includes(q));
 if(filter!=='canon')list=[...list].sort($('#sort').value==='title'?(a,b)=>a.t.localeCompare(b.t):(a,b)=>(scoreNum(b.s)??-1)-(scoreNum(a.s)??-1));
 return list;
}
let shown=[];
function renderShelf(){
 shown=shelfList();
 $('#record-count').textContent=`${shown.length} record${shown.length===1?'':'s'}`;
 $('#record-grid').innerHTML=shown.length?shown.map((a,i)=>{const p=posterOf(a),n=scoreNum(a.s);
  const big=a.rank?'#'+a.rank:n!==null?String(a.s).replace('*',''):a.status==='watching'&&a.progress?a.progress:a.s||({want:'Soon',next:'Next',dropped:'Dropped',finished:'Read',paused:'Paused'}[a.status]||'—');
  return `<button class="pc${a.status==='want'||a.status==='next'?' is-want':''}" style="--i:${Math.min(i,30)};${p&&p.color?`--c:${p.color}`:''}" data-rec="${i}">
   <figure>${p?`<img src="${esc(p.img)}" alt="" loading="lazy" decoding="async">`:`<span class="pc-ph">${esc(a.t)}</span>`}<span class="pc-score${n===null&&!a.rank?' small':''}">${esc(big)}${String(a.s).includes('*')?'<sup>*</sup>':''}${n!==null&&!a.rank?'<small>/10</small>':''}</span></figure>
   <span class="pc-meta"><strong>${esc(a.t)}</strong><small>${esc(a.rank?'Personal top ten':a.tag||'')}</small></span>
  </button>`;}).join(''):'<p class="count">No records match that search.</p>';
}
function setTab(t){tab=t;filter='all';$$('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===t)));
 $('#chips').innerHTML=SHELF[t].filters.map(([k,l])=>`<button data-filter="${k}" aria-pressed="${k==='all'}">${l}</button>`).join('');renderShelf();}
$('#search').addEventListener('input',renderShelf);$('#sort').addEventListener('change',renderShelf);
$('#chips').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;$$('#chips [data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderShelf();});
$$('[data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
['anime','manga','tv'].forEach(k=>$('#n-'+k).textContent=SHELF[k].items.filter(SHELF[k].main).length);
$('#rewatches').innerHTML=SH.rewatches.map(r=>`<article><h3>${esc(r.title)} · ${esc(r.count)}</h3><p>${esc(r.body)}</p></article>`).join('');
setTab('anime');
function openRecord(i){const a=shown[i];if(!a)return;const p=posterOf(a),n=scoreNum(a.s);
 const kind={anime:'Anime',manga:'Manga',tv:'Live action'}[a.k]||'Record';
 const extra=(a.extra||[]).map(t=>`<span>${esc(t)}</span>`).join('');
 openDialog(`<div class="rec-layout rec-poster">${p?`<img src="${esc(p.img)}" alt="${esc(a.t)} cover" style="aspect-ratio:auto">`:''}<div><p class="eyebrow">${kind} · ${esc(a.rank?'Personal top ten #'+a.rank:a.tag||'Personal record')}</p><h2 id="dialog-title">${esc(a.t)}</h2>${a.s?`<p class="big-score">${esc(a.s)}${n!==null?' <small>/ 10</small>':''}</p>`:''}${a.tagline?`<p class="rec-tagline">“${esc(a.tagline)}”</p>`:''}${a.why?`<p><strong>${esc(a.why)}</strong></p>`:''}${a.b?`<p>${esc(a.b)}</p>`:''}${a.ratingNote?`<p class="subtle">${esc(a.ratingNote)}</p>`:''}${extra?`<div class="tags">${extra}</div>`:''}<p class="subtle">From my notes${SH.updated?', last synced '+new Date(SH.updated).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):''}.${p?' Cover art: AniList / TVmaze.':''}</p></div></div>`);}

/* ------------------------------------------------------------------ the logbook */
const fmtDate=d=>new Date(d+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
const posterFor=(k,t)=>posterOf({k,t});
const thumb=(k,t)=>{const p=posterFor(k,t);return p?`<img src="${esc(p.img)}" alt="" loading="lazy" decoding="async">`:`<span class="lt-ph"></span>`;};
const KIND={anime:'anime',manga:'manga',tv:'show'};
function logEntry(e){
 if(e.baseline)return `<li class="log-entry base"><time>${fmtDate(e.date)}</time><div><h3>${esc(e.label)}</h3><p>${e.counts.anime} anime · ${e.counts.manga} manga · ${e.counts.tv} shows. Where the record starts.</p></div></li>`;
 const g=t=>e.events.filter(x=>x.type===t);const parts=[];
 const rated=[...g('rerated'),...g('rated')];
 if(rated.length)parts.push(`<div class="lg"><h4>Ratings</h4>${rated.map(x=>{const up=parseFloat(x.to)>parseFloat(x.frm);return `<div class="lr">${thumb(x.kind,x.t)}<span><b>${esc(x.t)}</b><small>${x.frm?`${esc(x.frm)} → `:'First rating: '}<em class="${x.frm?(up?'up':'down'):''}">${esc(x.to)}</em></small></span></div>`;}).join('')}</div>`);
 if(g('finished').length)parts.push(`<div class="lg"><h4>Finished</h4>${g('finished').map(x=>`<div class="lr">${thumb(x.kind,x.t)}<span><b>${esc(x.t)}</b><small>${cap(KIND[x.kind])}${x.to?' · '+esc(x.to)+'/10':''}</small></span></div>`).join('')}</div>`);
 if(g('started').length)parts.push(`<div class="lg"><h4>Started</h4>${g('started').map(x=>`<div class="lr">${thumb(x.kind,x.t)}<span><b>${esc(x.t)}</b><small>${cap(KIND[x.kind])}${x.to?' · '+esc(x.to):''}</small></span></div>`).join('')}</div>`);
 if(g('progress').length)parts.push(`<div class="lg"><h4>Kept going</h4>${g('progress').map(x=>`<div class="lr">${thumb(x.kind,x.t)}<span><b>${esc(x.t)}</b><small>${esc(x.frm||'—')} → <em class="up">${esc(x.to)}</em></small></span></div>`).join('')}</div>`);
 [['want','Added to the watch list'],['queued','Added to the reading queue']].forEach(([t,l])=>{if(g(t).length)parts.push(`<div class="lg"><h4>${l} · ${g(t).length}</h4><div class="lstrip">${g(t).map(x=>`<span title="${esc(x.t)}">${thumb(x.kind,x.t)}<small>${esc(x.t)}</small></span>`).join('')}</div></div>`);});
 if(g('dropped').length)parts.push(`<div class="lg"><h4>Dropped</h4>${g('dropped').map(x=>`<div class="lr">${thumb(x.kind,x.t)}<span><b>${esc(x.t)}</b><small>${cap(KIND[x.kind])}</small></span></div>`).join('')}</div>`);
 if(g('top10').length){const x=g('top10')[0];parts.push(`<div class="lg"><h4>Top 10 reshuffled</h4><ol class="ltop">${x.to.map((t,i)=>{const was=x.frm.findIndex(y=>normT(y)===normT(t));return `<li><b>${esc(t)}</b>${was<0?'<em class="up">new</em>':was!==i?`<em class="${was>i?'up':'down'}">${was>i?'▲':'▼'}${Math.abs(was-i)}</em>`:''}</li>`;}).join('')}</ol></div>`);}
 if(g('removed').length)parts.push(`<div class="lg"><h4>No longer in my notes</h4><p class="subtle">${g('removed').map(x=>esc(x.t)).join(', ')}</p></div>`);
 return `<li class="log-entry"><time>${fmtDate(e.date)}</time><div><h3>${e.events.length} change${e.events.length===1?'':'s'}${e.since?` since ${fmtDate(e.since)}`:''}</h3>${parts.join('')}</div></li>`;
}
if(LOG&&LOG.entries.length){
 $('#log').innerHTML=LOG.entries.map(logEntry).join('');
 const done=SH.anime.filter(a=>a.status==='completed'),rated=SH.anime.filter(a=>scoreNum(a.s)!==null&&a.status!=='want');
 const avg=rated.reduce((s,a)=>s+scoreNum(a.s),0)/(rated.length||1);
 const stats=[[done.length,'anime completed'],[SH.anime.filter(a=>a.status==='watching').length,'watching now'],[SH.manga.filter(a=>a.status==='finished').length,'manga finished'],[SH.manga.filter(a=>a.status==='reading').length,'manga in progress'],[SH.tv.length,'shows'],[avg.toFixed(1),'average anime rating']];
 $('#log-stats').innerHTML=stats.map(([n,l])=>`<div><b>${n}</b><span>${l}</span></div>`).join('');
}else $('#logbook').hidden=true;

/* ------------------------------------------------------------------ life (private, this Mac only) */
if(LIFE&&LIFE.chapters.length){
 const sec=$('#life');sec.hidden=false;
 $('#life-row').innerHTML=LIFE.chapters.map((c,i)=>`<button class="world rv" style="--d:${i*0.08}s" data-collection="life:${i}"><img src="${LT(c.photos[0].id)}" alt="${esc(c.title)}" loading="lazy" decoding="async"><span class="world-copy"><small>Chapter ${pad(i+1)}</small><b>${esc(c.title)}</b><span>${c.photos.length} photo${c.photos.length===1?'':'s'} →</span></span></button>`).join('');
}

/* ------------------------------------------------------------------ other worlds */
$('#world-row').innerHTML=media.worlds.map((w,i)=>`<button class="world rv" style="--d:${i*0.08}s" data-collection="world:${i}">${pic(w.cover,w.name)}<span class="world-copy"><small>${esc(w.series)}</small><b>${esc(w.name)}</b><span>${w.all.length} photos →</span></span></button>`).join('');

/* ------------------------------------------------------------------ 04 vault */
const vSec=$('#vault'),fan=$('#fan'),fanInfo=$('#fan-info'),cards=archive.cards;
fan.innerHTML=cards.map((c,i)=>`<button class="vcard" data-card="${i}" aria-label="${esc(`${c.number} ${c.name}, ${c.rarity}${c.variant?', '+c.variant:''}. Open details`)}">${c.image?`<img src="${esc(c.image)}" alt="" loading="lazy" decoding="async">`:`<span class="ph"><small>${esc(c.rarity)}${c.variant?' · '+esc(c.variant):''}</small><b>${esc(c.name)}</b><span>${esc(c.number)}<br>Artwork not yet recorded</span></span>`}</button>`).join('');
$('#decks').innerHTML=archive.decks.map(d=>`<div class="deck"><small>${esc(d.color)} starter deck</small><b>${esc(d.name)}</b></div>`).join('');
const fanCards=[...fan.children];let fanShown=-1;
parts.push({top:0,h:1,measure(){this.top=absTop(vSec);this.h=vSec.offsetHeight;},
 update(s){
  const p=pinned(this,s),x=p*(cards.length-1),spacing=Math.min(vw*0.2,190);
  fanCards.forEach((el,i)=>{const d=i-x,a=Math.abs(d);
   el.style.transform=`translate(-50%,-50%) translate3d(${(d*spacing).toFixed(1)}px,${(a*a*6).toFixed(1)}px,${(-a*140).toFixed(1)}px) rotateY(${(-d*16).toFixed(2)}deg) rotateZ(${(d*2.5).toFixed(2)}deg)`;
   el.style.opacity=(a>3.6?0:1-a*0.16).toFixed(3);el.style.zIndex=String(100-Math.round(a*10));el.tabIndex=a>3.6?-1:0;});
  const n=Math.round(x);if(n!==fanShown){fanShown=n;const c=cards[n];fanInfo.innerHTML=`<b>${esc(c.name)}</b><span>${esc(c.number)} · ${esc(c.rarity)}${c.variant?' · '+esc(c.variant):''} · Entry ${c.entry} of ${cards.length}</span>`;}
 }});

/* ------------------------------------------------------------------ 05 scenes (video zoom) */
$$('.scene-block').forEach(block=>{
 const frame=block.querySelector('.sv-frame'),video=block.querySelector('video'),text=block.querySelector('.sv-text'),sound=block.querySelector('.sound');
 let loaded=false;
 const load=()=>{if(loaded)return;loaded=true;video.poster=block.dataset.poster;video.src=block.dataset.video;};
 new IntersectionObserver(([e])=>{if(e.isIntersecting){load();if(!reduced)video.play().catch(()=>{});}else video.pause();},{rootMargin:'50% 0px',threshold:0}).observe(block);
 sound.addEventListener('click',()=>{video.muted=!video.muted;sound.setAttribute('aria-pressed',String(!video.muted));sound.textContent=video.muted?'Sound off':'Sound on';if(!video.muted)video.play().catch(()=>{});});
 parts.push({top:0,h:1,measure(){this.top=absTop(block);this.h=block.offsetHeight;},
  update(s){
   const p=reduced?1:pinned(this,s),z=smooth(clamp(p/0.55)),portrait=vw<vh;
   frame.style.clipPath=`inset(${((portrait?26:22)*(1-z)).toFixed(2)}% ${((portrait?8:20)*(1-z)).toFixed(2)}% round ${(32*(1-z)).toFixed(1)}px)`;
   video.style.transform=`scale(${(1.2-0.2*z).toFixed(4)})`;
   text.style.opacity=smooth(clamp((p-0.55)/0.2)).toFixed(3);block.classList.toggle('full',z>0.98);
  }});
});

/* ------------------------------------------------------------------ 06 library */
const wall=$('#art-wall'),libSec=$('#library');
function buildWall(){
 const n=vw<=820?2:4,cols=Array.from({length:n},()=>[]);
 media.wall.forEach((id,i)=>cols[i%n].push(`<button data-view="wall" data-id="${id}" aria-label="Open artwork">${pic(id,'')}</button>`));
 wall.innerHTML=cols.map(c=>`<div class="art-col">${c.join('')}</div>`).join('');wall.dataset.cols=n;
}
buildWall();
const SPEEDS=[-0.28,0.12,-0.4,0.02];
parts.push({top:0,h:1,measure(){if(String(vw<=820?2:4)!==wall.dataset.cols)buildWall();this.top=absTop(wall);this.h=wall.offsetHeight;},
 update(s){const q=clamp((s+vh-this.top)/(this.h+vh));[...wall.children].forEach((c,i)=>{c.style.transform=reduced?'':`translate3d(0,${((q-0.5)*SPEEDS[i%4]*vh*1.6).toFixed(1)}px,0)`;});}});

/* ------------------------------------------------------------------ 07 outro (reverse zoom back to Roger) */
const outroSec=$('#outro'),outroText=$('#outro-text');
const outro=createJourney({section:outroSec,layerHost:$('#outro-layers'),config:{svhPerDoubling:38,tailVh:70,layers:journeyCfg.layers.slice(0,2)},reverse:true});
parts.push({top:0,h:1,measure(){this.top=absTop(outroSec);this.h=outroSec.offsetHeight;outro.measure();},
 update(s){const g=reduced?1:pinned(this,s);outro.render(g);outroText.style.opacity=smooth(clamp((g-0.72)/0.16)).toFixed(3);}});

/* ------------------------------------------------------------------ header, reveals, dialogs */
const navLinks=$$('.bar-nav a');
parts.push({always:true,top:0,h:1,measure(){this.v=voyageSec.offsetTop+voyageSec.offsetHeight-vh*0.6;this.o=outroSec.offsetTop-vh*0.4;},
 update(s){bar.classList.toggle('solid',s>this.v&&s<this.o);}});
new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)navLinks.forEach(a=>a.getAttribute('href')==='#'+e.target.id?a.setAttribute('aria-current','true'):a.removeAttribute('aria-current'));}),{rootMargin:'-45% 0px -50% 0px'}).observe(voyageSec);
['characters','crew','spreads','panels','journey','vault','scenes','library'].forEach(id=>document.getElementById(id)&&[...navLinks].length&&new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)navLinks.forEach(a=>a.getAttribute('href')==='#'+id?a.setAttribute('aria-current','true'):a.removeAttribute('aria-current'));}),{rootMargin:'-45% 0px -50% 0px'}).observe(document.getElementById(id)));

// Split marked headlines into words so they rise in sequence.
$$('[data-split]').forEach(el=>{let wi=0;const walk=node=>{[...node.childNodes].forEach(ch=>{if(ch.nodeType===3){const frag=document.createDocumentFragment();ch.textContent.split(/(\s+)/).forEach(t=>{if(!t)return;if(/^\s+$/.test(t))frag.append(t);else{const s=document.createElement('span');s.className='w';s.style.setProperty('--wi',wi++);s.textContent=t;frag.append(s);}});ch.replaceWith(frag);}else if(ch.nodeName!=='BR')walk(ch);});};walk(el);});
const revealer=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');revealer.unobserve(e.target);}}),{rootMargin:'0px 0px -12% 0px'});
$$('.rv,[data-split],.char,.pop').forEach(el=>revealer.observe(el));

const dialog=$('#dialog'),dBody=$('#dialog-body');let lastFocus=null;
function openDialog(html){dialog.classList.remove('is-viewer');if(!dialog.open){lastFocus=document.activeElement;dialog.showModal();document.documentElement.style.overflow='hidden';}dBody.innerHTML=html;dialog.scrollTop=0;$('#dialog-close').focus();}
$('#dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{if(dialog.open)return;viewer=null;dialog.classList.remove('is-viewer');document.documentElement.style.overflow='';dBody.innerHTML='';lastFocus?.focus();});
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
// Collections: every "View all" opens one of these; the viewer steps through the same list.
function collection(key){
 const [k,i]=key.split(':');
 if(k==='char'){const c=archive.characters[+i];return{title:c.name,eyebrow:'Character Log',ids:MC[+i].all};}
 if(k==='crew'){const c=media.crew[+i];return{title:c.name,eyebrow:'The Crew',ids:c.all};}
 if(k==='world'){const w=media.worlds[+i];return{title:w.name,eyebrow:w.series,ids:w.all};}
 if(k==='spreads')return{title:'Colour spreads',eyebrow:'Eiichiro Oda',ids:media.spreads.all};
 if(k==='life'){const c=LIFE.chapters[+i];return{title:c.title,eyebrow:'Life · '+c.name,ids:c.photos.map(p=>p.id),src:LF,thumb:LT};}
 if(k==='panels'){const set=PANEL_SETS[i];return{title:set.title,eyebrow:set.eyebrow,ids:set.list.map(x=>x.id),src:PF,caps:Object.fromEntries(set.list.map(x=>[x.id,x.cap]))};}
 return{title:'Stories leave traces.',eyebrow:'Ohara Library',ids:media.wall};
}
const masonry=(key,ids,thumb)=>`<div class="masonry">${ids.map(id=>`<button data-view="${key}" data-id="${id}" aria-label="Open image">${thumb?`<img src="${thumb(id)}" alt="" loading="lazy" decoding="async">`:pic(id,'')}</button>`).join('')}</div>`;
function openCollection(key){const c=collection(key);openDialog(`<p class="eyebrow">${esc(c.eyebrow)}</p><h2 id="dialog-title">${esc(c.title)}</h2><p class="subtle">${c.ids.length} ${c.ids.length===1?'image':'images'}. Tap one to view it full size.</p>${masonry(key,c.ids,c.thumb)}`);}
let viewer=null;
function openViewer(key,id){
 const c=collection(key),n=c.ids.length;let i=Math.max(0,c.ids.indexOf(id));viewer={key,c,i};
 openDialog(`<div class="viewer"><div class="viewer-top"><button class="link" data-collection="${key}">← ${esc(c.title)}</button><span class="viewer-count" id="viewer-count"></span></div><div class="viewer-stage"><img id="viewer-img" alt="${esc(c.title)} artwork"></div>${c.caps?'<p class="viewer-cap" id="viewer-cap"></p>':''}${n>1?'<button class="viewer-nav prev" data-step="-1" aria-label="Previous image">‹</button><button class="viewer-nav next" data-step="1" aria-label="Next image">›</button>':''}</div>`);
 dialog.classList.add('is-viewer');showView();
}
function showView(){if(!viewer)return;const{c,i}=viewer,id=c.ids[i],img=$('#viewer-img');img.classList.remove('in');img.onload=()=>img.classList.add('in');img.src=(c.src||FU)(id);if(img.complete)img.classList.add('in');if(c.caps)$('#viewer-cap').textContent=c.caps[id]||'';$('#viewer-count').textContent=`${i+1} / ${c.ids.length}`;[1,-1].forEach(d=>{const j=(i+d+c.ids.length)%c.ids.length;new Image().src=(c.src||FU)(c.ids[j]);});}
function step(d){if(!viewer)return;viewer.i=(viewer.i+d+viewer.c.ids.length)%viewer.c.ids.length;showView();}
addEventListener('keydown',e=>{if(!dialog.open||!viewer||!dialog.classList.contains('is-viewer'))return;if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1);});
let tx=null;dialog.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;},{passive:true});dialog.addEventListener('touchend',e=>{if(tx===null||!viewer||!dialog.classList.contains('is-viewer'))return;const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>50)step(dx<0?1:-1);tx=null;},{passive:true});
function charRecord(i){const c=archive.characters[i],m=MC[i];openDialog(`<div class="rec-layout">${pic(m.portrait,c.name,true)}<div><p class="eyebrow">Character Log · ${esc(c.kicker)}</p><h2 id="dialog-title">${esc(c.name)}</h2><p>${esc(c.body)}</p>${c.quote?`<p><em>${esc(c.quote)}</em></p>`:''}<div class="tags">${c.lessons.map(t=>`<span>${esc(t)}</span>`).join('')}</div>${c.note?`<p style="margin-top:22px">${esc(c.note)}</p>`:''}<p class="subtle">Goma's personal record, preserved from the original archive.</p></div></div>${m.all.length>1?`<h3 class="rec-sub">${m.all.length} images</h3>${masonry('char:'+i,m.all)}`:''}`);}
document.addEventListener('click',e=>{
 const b=e.target.closest('button,[data-jump]');if(!b)return;
 if(b.matches('[data-jump]')){e.preventDefault();const id=b.getAttribute('href').slice(1);if(dialog.open)dialog.close();jumpTo(id==='voyage'?0:absTop(document.getElementById(id)));return;}
 if(b.dataset.char!==undefined)charRecord(+b.dataset.char);
 if(b.dataset.collection)openCollection(b.dataset.collection);
 if(b.dataset.view)openViewer(b.dataset.view,b.dataset.id);
 if(b.dataset.step)step(+b.dataset.step);
 if(b.id==='spreads-all')openCollection('spreads');
 if(b.dataset.rec!==undefined)openRecord(+b.dataset.rec);
 if(b.dataset.shelf){setTab(b.dataset.shelf);jumpTo(absTop($('#records')));}
 if(b.dataset.chapter!==undefined){const j=archive.journey[+b.dataset.chapter];openDialog(`<p class="eyebrow">Anime Journey · ${esc(j.date)}</p><h2 id="dialog-title">${esc(j.title)}</h2><p>${esc(j.body)}</p>${j.quote?`<p><em>${esc(j.quote)}</em></p>`:''}`);}
 if(b.dataset.card!==undefined){const c=cards[+b.dataset.card],u='<em>Not recorded</em>';openDialog(`<div class="rec-layout">${c.image?`<img src="${esc(c.image)}" alt="${esc(c.number)} catalog artwork" style="aspect-ratio:5/7">`:'<div class="vcard" style="position:relative;left:0;top:0;width:100%"><span class="ph"><small>'+esc(c.rarity)+'</small><b>'+esc(c.name)+'</b><span>'+esc(c.number)+'<br>Artwork not yet recorded</span></span></div>'}<div><p class="eyebrow">Card Vault · Entry ${c.entry} of ${cards.length}</p><h2 id="dialog-title">${esc(c.name)}</h2><div class="list"><div><strong>Card number</strong><span>${esc(c.number)}</span></div><div><strong>Rarity / type</strong><span>${esc(c.rarity)}</span></div><div><strong>Variant</strong><span>${esc(c.variant||'Not specified')}</span></div><div><strong>Quantity</strong><span>${u}</span></div><div><strong>Language · Condition</strong><span>${u}</span></div><div><strong>Purchase · Value</strong><span>${u}</span></div></div>${c.imageNote?`<p class="subtle" style="margin-top:18px">${esc(c.imageNote)}</p>`:''}${c.variant==='Alternate Art / Parallel'?'<p class="subtle">This is the Parallel (alternate art) printing of OP14-112, shown separately from the regular one.</p>':''}</div></div>`);}
});

/* ------------------------------------------------------------------ motion toggle */
const motionBtn=$('#motion');
function applyMotion(){
 document.body.classList.toggle('reduced',reduced);
 motionBtn.setAttribute('aria-pressed',String(reduced));motionBtn.innerHTML=`Motion <b>${reduced?'Off':'On'}</b>`;
 voyageSec.querySelector('.pin').hidden=reduced;$('#voyage-static').hidden=!reduced;
 if(reduced){voyageSec.style.height='auto';outroSec.style.height='auto';$('#outro-layers').parentElement.style.position='relative';outro.renderStatic();$$('video').forEach(v=>v.pause());}
 else{voyage.rebuild();outro.rebuild();$('#outro-layers').parentElement.style.position='';}
 measureAll();
}
motionBtn.addEventListener('click',()=>{reduced=!reduced;try{localStorage.setItem(PREF,reduced?'1':'0');}catch{}applyMotion();});
systemReduced.addEventListener('change',e=>{reduced=e.matches;applyMotion();});

applyMotion();
if(location.hash&&location.hash!=='#voyage'){const t=document.getElementById(location.hash.slice(1));if(t)jumpTo(absTop(t));}
document.body.classList.add('ready');
// Test hook (?debug): render an exact scroll position synchronously, without smoothing.
if(new URLSearchParams(location.search).has('debug')){
 window.__ga={at(y){scrollTo({top:y,behavior:'instant'});sy=scrollY;for(const p of parts)p.update(sy);return sy;},parts,voyage,measureAll};
 const shot=new URLSearchParams(location.search).get('shot');
 if(shot){const[id,f]=shot.split(':');const go=()=>{measureAll();const e=document.getElementById(id);__ga.at(absTop(e)+(e.offsetHeight-innerHeight)*parseFloat(f));};const run=()=>setTimeout(()=>{go();setTimeout(go,600);},300);document.readyState==='complete'?run():addEventListener('load',run);}
}
if(new URLSearchParams(location.search).has('calibrate'))import('./calibrate.js').then(m=>m.startCalibration(voyage,measureAll));

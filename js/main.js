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

const [journeyCfg,archive,media]=await Promise.all([
 fetch('data/journey.json').then(r=>r.json()),
 fetch('data/archive.json').then(r=>r.json()),
 fetch('data/media.json').then(r=>r.json())
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
  const e=smooth(clamp((g-0.935)/0.045));vEnd.style.opacity=e.toFixed(3);vEnd.classList.toggle('live',e>0.5);
  rail.style.opacity=(1-e).toFixed(3);
 }});

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
// Starts on one spread filling the screen, then pulls back to reveal the wall around it.
const spSec=$('#spreads'),spWall=$('#spread-wall'),spCopy=$('#spread-copy'),spShade=spSec.querySelector('.spread-shade');
const SPW=media.spreads.wall;
spWall.innerHTML=SPW.map((id,i)=>`<button class="sp" data-view="spreads" data-id="${id}" tabindex="-1" aria-hidden="true">${pic(id,'',i===12)}</button>`).join('');
$('#spreads-all').textContent=`View all ${media.spreads.all.length} spreads`;
const spTiles=[...spWall.children];
parts.push({top:0,h:1,measure(){this.top=absTop(spSec);this.h=spSec.offsetHeight;
  const portrait=vw<vh,T=portrait?vw*0.52:vw*0.3,G=portrait?10:16;this.T=T;
  spWall.style.setProperty('--t',T+'px');spWall.style.setProperty('--g',G+'px');
  this.S0=Math.max(vw/T,vh/(T*0.625))*1.02;},
 update(s){
  const p=reduced?1:pinned(this,s),z=smooth(clamp(p/0.7)),sc=Math.pow(this.S0,1-z);
  spWall.style.transform=`translate(-50%,-50%) scale(${sc.toFixed(4)})`;
  const o=0.25+0.75*smooth(clamp((z-0.15)/0.5));spTiles.forEach((t,i)=>{if(i!==12)t.style.opacity=o.toFixed(3);});
  spShade.style.opacity=smooth(clamp((p-0.55)/0.2)).toFixed(3);
  const c=smooth(clamp((p-0.62)/0.18));spCopy.style.opacity=c.toFixed(3);spCopy.style.transform=`translate(-50%,calc(-50% + ${((1-c)*30).toFixed(1)}px))`;
  spCopy.style.pointerEvents=c>0.5?'auto':'none';
 }});

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

/* ------------------------------------------------------------------ records */
let filter='all';
function renderRecords(){
 const q=$('#search').value.toLowerCase().trim();
 let list=filter==='canon'?archive.top10.map((a,i)=>({t:a.title,s:'#'+(i+1),tag:'Personal top ten',b:a.body})):filter==='rated'?archive.ANIME_DONE:filter==='watching'?archive.ANIME_NOW:[...archive.ANIME_DONE,...archive.ANIME_NOW];
 list=list.filter(a=>a.t.toLowerCase().includes(q));
 if(filter!=='canon')list=[...list].sort($('#sort').value==='title'?(a,b)=>a.t.localeCompare(b.t):(a,b)=>(parseFloat(b.s)||0)-(parseFloat(a.s)||0));
 $('#record-count').textContent=`${list.length} record${list.length===1?'':'s'}`;
 $('#record-grid').innerHTML=list.length?list.map((a,i)=>`<button class="rec" style="--i:${Math.min(i,24)}" data-anime="${esc(a.t)}"><strong>${esc(a.t)}</strong><small>${esc(a.tag)}</small><span class="score">${esc(a.s)}</span></button>`).join(''):'<p class="count">No records match that search.</p>';
}
$('#search').addEventListener('input',renderRecords);$('#sort').addEventListener('change',renderRecords);
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;$$('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderRecords();}));
$('#rewatches').innerHTML=archive.rewatches.map(r=>`<article><h3>${esc(r.title)} · ${esc(r.count)}</h3><p>${esc(r.body)}</p></article>`).join('');
renderRecords();

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
$('#n-manga').textContent=archive.MANGA_DONE.length+archive.MANGA_NOW.length;$('#n-tv').textContent=archive.TV.length;
const SPEEDS=[-0.28,0.12,-0.4,0.02];
parts.push({top:0,h:1,measure(){if(String(vw<=820?2:4)!==wall.dataset.cols)buildWall();this.top=absTop(wall);this.h=wall.offsetHeight;},
 update(s){const q=clamp((s+vh-this.top)/(this.h+vh));[...wall.children].forEach((c,i)=>{c.style.transform=reduced?'':`translate3d(0,${((q-0.5)*SPEEDS[i%4]*vh*1.6).toFixed(1)}px,0)`;});}});

/* ------------------------------------------------------------------ 07 outro (reverse zoom back to Roger) */
const outroSec=$('#outro'),outroText=$('#outro-text');
const outro=createJourney({section:outroSec,layerHost:$('#outro-layers'),config:{svhPerDoubling:38,tailVh:70,layers:journeyCfg.layers.slice(0,2)},reverse:true});
parts.push({top:0,h:1,measure(){this.top=absTop(outroSec);this.h=outroSec.offsetHeight;outro.measure();},
 update(s){const g=reduced?1:pinned(this,s);outro.render(g);outroText.style.opacity=smooth(clamp((g-0.72)/0.16)).toFixed(3);}});

/* ------------------------------------------------------------------ header, reveals, dialogs */
const bar=$('#bar'),navLinks=$$('.bar-nav a');
parts.push({always:true,top:0,h:1,measure(){this.v=voyageSec.offsetTop+voyageSec.offsetHeight-vh*0.6;this.o=outroSec.offsetTop-vh*0.4;},
 update(s){bar.classList.toggle('solid',s>this.v&&s<this.o);}});
new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)navLinks.forEach(a=>a.getAttribute('href')==='#'+e.target.id?a.setAttribute('aria-current','true'):a.removeAttribute('aria-current'));}),{rootMargin:'-45% 0px -50% 0px'}).observe(voyageSec);
['characters','crew','spreads','journey','vault','scenes','library'].forEach(id=>document.getElementById(id)&&[...navLinks].length&&new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)navLinks.forEach(a=>a.getAttribute('href')==='#'+id?a.setAttribute('aria-current','true'):a.removeAttribute('aria-current'));}),{rootMargin:'-45% 0px -50% 0px'}).observe(document.getElementById(id)));

// Split marked headlines into words so they rise in sequence.
$$('[data-split]').forEach(el=>{let wi=0;const walk=node=>{[...node.childNodes].forEach(ch=>{if(ch.nodeType===3){const frag=document.createDocumentFragment();ch.textContent.split(/(\s+)/).forEach(t=>{if(!t)return;if(/^\s+$/.test(t))frag.append(t);else{const s=document.createElement('span');s.className='w';s.style.setProperty('--wi',wi++);s.textContent=t;frag.append(s);}});ch.replaceWith(frag);}else if(ch.nodeName!=='BR')walk(ch);});};walk(el);});
const revealer=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');revealer.unobserve(e.target);}}),{rootMargin:'0px 0px -12% 0px'});
$$('.rv,[data-split],.char').forEach(el=>revealer.observe(el));

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
 return{title:'Stories leave traces.',eyebrow:'Ohara Library',ids:media.wall};
}
const masonry=(key,ids)=>`<div class="masonry">${ids.map(id=>`<button data-view="${key}" data-id="${id}" aria-label="Open image">${pic(id,'')}</button>`).join('')}</div>`;
function openCollection(key){const c=collection(key);openDialog(`<p class="eyebrow">${esc(c.eyebrow)}</p><h2 id="dialog-title">${esc(c.title)}</h2><p class="subtle">${c.ids.length} ${c.ids.length===1?'image':'images'}. Tap one to view it full size.</p>${masonry(key,c.ids)}`);}
let viewer=null;
function openViewer(key,id){
 const c=collection(key),n=c.ids.length;let i=Math.max(0,c.ids.indexOf(id));viewer={key,c,i};
 openDialog(`<div class="viewer"><div class="viewer-top"><button class="link" data-collection="${key}">← ${esc(c.title)}</button><span class="viewer-count" id="viewer-count"></span></div><div class="viewer-stage"><img id="viewer-img" alt="${esc(c.title)} artwork"></div>${n>1?'<button class="viewer-nav prev" data-step="-1" aria-label="Previous image">‹</button><button class="viewer-nav next" data-step="1" aria-label="Next image">›</button>':''}</div>`);
 dialog.classList.add('is-viewer');showView();
}
function showView(){if(!viewer)return;const{c,i}=viewer,id=c.ids[i],img=$('#viewer-img');img.classList.remove('in');img.onload=()=>img.classList.add('in');img.src=FU(id);if(img.complete)img.classList.add('in');$('#viewer-count').textContent=`${i+1} / ${c.ids.length}`;[1,-1].forEach(d=>{const j=(i+d+c.ids.length)%c.ids.length;new Image().src=FU(c.ids[j]);});}
function step(d){if(!viewer)return;viewer.i=(viewer.i+d+viewer.c.ids.length)%viewer.c.ids.length;showView();}
addEventListener('keydown',e=>{if(!dialog.open||!viewer||!dialog.classList.contains('is-viewer'))return;if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1);});
let tx=null;dialog.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;},{passive:true});dialog.addEventListener('touchend',e=>{if(tx===null||!viewer||!dialog.classList.contains('is-viewer'))return;const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>50)step(dx<0?1:-1);tx=null;},{passive:true});
function charRecord(i){const c=archive.characters[i],m=MC[i];openDialog(`<div class="rec-layout">${pic(m.portrait,c.name,true)}<div><p class="eyebrow">Character Log · ${esc(c.kicker)}</p><h2 id="dialog-title">${esc(c.name)}</h2><p>${esc(c.body)}</p>${c.quote?`<p><em>${esc(c.quote)}</em></p>`:''}<div class="tags">${c.lessons.map(t=>`<span>${esc(t)}</span>`).join('')}</div>${c.note?`<p style="margin-top:22px">${esc(c.note)}</p>`:''}<p class="subtle">Goma's personal record, preserved from the original archive.</p></div></div>${m.all.length>1?`<h3 class="rec-sub">${m.all.length} images</h3>${masonry('char:'+i,m.all)}`:''}`);}
function listDialog(type){const list=type==='tv'?archive.TV.map(a=>({t:a.t,s:a.s,n:a.b})):[...archive.MANGA_DONE.map(a=>({t:a.t,s:'Read · '+a.g,n:a.b})),...archive.MANGA_NOW.map(a=>({t:a.t,s:(a.c||'Reading')+' · '+a.g,n:a.b||a.n}))];
 openDialog(`<p class="eyebrow">Ohara Library</p><h2 id="dialog-title">${type==='tv'?'The other screen.':'Between the panels.'}</h2><p class="subtle">${list.length} imported records. Historical notes, not live release data.</p><div class="list">${list.map(a=>`<div><strong>${esc(a.t)}</strong><span>${esc(a.s||'')}</span>${a.n?`<p>${esc(a.n)}</p>`:''}</div>`).join('')}</div>`);}
document.addEventListener('click',e=>{
 const b=e.target.closest('button,[data-jump]');if(!b)return;
 if(b.matches('[data-jump]')){e.preventDefault();const id=b.getAttribute('href').slice(1);if(dialog.open)dialog.close();jumpTo(id==='voyage'?0:absTop(document.getElementById(id)));return;}
 if(b.dataset.char!==undefined)charRecord(+b.dataset.char);
 if(b.dataset.collection)openCollection(b.dataset.collection);
 if(b.dataset.view)openViewer(b.dataset.view,b.dataset.id);
 if(b.dataset.step)step(+b.dataset.step);
 if(b.id==='spreads-all')openCollection('spreads');
 if(b.dataset.list)listDialog(b.dataset.list);
 if(b.dataset.chapter!==undefined){const j=archive.journey[+b.dataset.chapter];openDialog(`<p class="eyebrow">Anime Journey · ${esc(j.date)}</p><h2 id="dialog-title">${esc(j.title)}</h2><p>${esc(j.body)}</p>${j.quote?`<p><em>${esc(j.quote)}</em></p>`:''}`);}
 if(b.dataset.anime){const t=b.dataset.anime,a=[...archive.ANIME_DONE,...archive.ANIME_NOW].find(x=>x.t===t),top=archive.top10.find(x=>x.title===t);openDialog(`<p class="eyebrow">Anime Journey · Personal record</p><h2 id="dialog-title">${esc(t)}</h2>${a?`<p style="font-size:34px;font-weight:700;color:var(--fg)">${esc(a.s)}${a.tag==='Completed'?' / 10':''}</p><p>${esc(a.b)}</p>`:`<p>${esc(top?.body)}</p>`}${t==='Re:Zero'?'<p class="subtle">V1 records 9.5 on the shelf and 9.7 in the old timeline. The shelf score is kept until you choose.</p>':''}${t==='Death Note'?'<p class="subtle">The asterisk is deliberate: first half 9.5, second half 5.</p>':''}<p class="subtle">Goma's original note and progress, preserved as recorded.</p>`);}
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

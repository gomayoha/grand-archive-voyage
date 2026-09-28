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

const [journeyCfg,archive]=await Promise.all([
 fetch('data/journey.json').then(r=>r.json()),
 fetch('data/archive.json').then(r=>r.json())
]);
const ART=archive.CHARACTER_ART;

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
 {headline:'Dream without permission.',role:'The north star',line:'The man who made freedom feel practical.',art:2},
 {headline:'A place to belong.',role:'The heart of the archive',line:'An entire life of running. Then one reason to stay.',upload:3},
 {headline:'Let your will speak.',role:'Will without noise',line:'Loyalty that never needed an explanation.',art:25},
 {headline:'Keep moving. Anyway.',role:'Defy the dark',line:'Suffering never gets the final word.',art:47},
 {headline:'Read the room.',role:'Control before reaction',line:'Take the discipline. Leave the dehumanization.',art:54},
 {headline:'Fine. One more try.',role:'The biggest opinion reversal',line:'Afraid. Exhausted. Still choosing another attempt.',art:68},
 {headline:'Be their reassurance.',role:'A symbol of hope',line:'One person can change what hope looks like.',art:51},
 {headline:'No reset button.',role:'Face reality',line:'A second chance is a reason to live this one.'},
 {headline:'Respect the craft.',role:'Give your best',line:'There is real work and value behind every meal.',art:38},
];
const charImage=i=>{const c=CHAR_COPY[i];return c.upload!==undefined?`assets/uploads/batch-${c.upload}.jpg`:c.art!==undefined?ART[c.art].src:archive.characters[i].image;};
$('#char-list').innerHTML=archive.characters.map((c,i)=>{const p=CHAR_COPY[i]||{};return `<article class="char">
 <figure class="char-media"><img src="${esc(charImage(i))}" alt="${esc(c.name)} artwork" loading="lazy" decoding="async"></figure>
 <div class="char-text">
  <span class="char-no">No. ${String(i+1).padStart(3,'0')}</span>
  <p class="role rv">${esc(p.role||c.kicker)}</p>
  <h3 class="rv" style="--d:.06s">${esc(c.name)}</h3>
  <p class="hook rv" style="--d:.12s">${esc(p.headline)} ${esc(p.line)}</p>
  <p class="body rv" style="--d:.18s">${esc(c.body.split(/(?<=\.)\s/).slice(0,2).join(' '))}</p>
  ${c.quote?`<blockquote class="rv" style="--d:.24s">${esc(c.quote)}</blockquote>`:''}
  <div class="tags rv" style="--d:.3s">${c.lessons.map(t=>`<span>${esc(t)}</span>`).join('')}</div>
  <button class="link rv" style="--d:.36s" data-char="${i}">Read the full record →</button>
 </div></article>`;}).join('');
const rzSec=$('#char-reveal'),rzFrame=rzSec.querySelector('.rz-frame'),rzImg=rzFrame.querySelector('img'),rzTitle=rzSec.querySelector('.rz-title'),rzAfter=rzSec.querySelector('.rz-after');
parts.push({top:0,h:1,measure(){this.top=absTop(rzSec);this.h=rzSec.offsetHeight;},
 update(s){
  const p=reduced?1:pinned(this,s),z=smooth(clamp(p/0.62));
  const portrait=vw<vh,iy=(portrait?24:28)*(1-z),ix=(portrait?16:33)*(1-z);
  rzFrame.style.clipPath=`inset(${iy.toFixed(2)}% ${ix.toFixed(2)}% round ${(28*(1-z)).toFixed(1)}px)`;
  rzImg.style.transform=`scale(${(1.25-0.25*z).toFixed(4)})`;
  rzTitle.style.opacity=(1-smooth(clamp((p-0.08)/0.3))).toFixed(3);
  rzTitle.style.transform=`scale(${(1-z*0.08).toFixed(4)})`;
  rzAfter.style.opacity=smooth(clamp((p-0.66)/0.18)).toFixed(3);
 }});

/* ------------------------------------------------------------------ 03 journey (horizontal) */
const JOURNEY_ART=[47,2,25,62,51,54,68,14,46];
const track=$('#journey-track'),jSec=$('#journey'),jBar=$('#journey-bar');
track.innerHTML=archive.journey.map((j,i)=>`<button class="jcard" data-chapter="${i}"><figure><img src="${esc(ART[JOURNEY_ART[i]].src)}" alt="" loading="lazy" decoding="async"></figure><div class="jc-body"><span class="jc-date">${esc(j.date)}</span><h3>${esc(j.title)}</h3><p>${esc(j.body.length>150?j.body.slice(0,150).replace(/\s+\S*$/,'')+'…':j.body)}</p>${j.quote?`<q>${esc(j.quote)}</q>`:''}</div></button>`).join('');
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
 ART.forEach((a,i)=>cols[i%n].push(`<button data-art="${i}" aria-label="Enlarge ${esc(a.alt)}"><img src="${esc(a.src)}" alt="${esc(a.alt)}" loading="lazy" decoding="async"></button>`));
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
['characters','journey','vault','scenes','library'].forEach(id=>document.getElementById(id)&&[...navLinks].length&&new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)navLinks.forEach(a=>a.getAttribute('href')==='#'+id?a.setAttribute('aria-current','true'):a.removeAttribute('aria-current'));}),{rootMargin:'-45% 0px -50% 0px'}).observe(document.getElementById(id)));

// Split marked headlines into words so they rise in sequence.
$$('[data-split]').forEach(el=>{let wi=0;const walk=node=>{[...node.childNodes].forEach(ch=>{if(ch.nodeType===3){const frag=document.createDocumentFragment();ch.textContent.split(/(\s+)/).forEach(t=>{if(!t)return;if(/^\s+$/.test(t))frag.append(t);else{const s=document.createElement('span');s.className='w';s.style.setProperty('--wi',wi++);s.textContent=t;frag.append(s);}});ch.replaceWith(frag);}else if(ch.nodeName!=='BR')walk(ch);});};walk(el);});
const revealer=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');revealer.unobserve(e.target);}}),{rootMargin:'0px 0px -12% 0px'});
$$('.rv,[data-split],.char').forEach(el=>revealer.observe(el));

const dialog=$('#dialog'),dBody=$('#dialog-body');let lastFocus=null;
function openDialog(html){if(!dialog.open){lastFocus=document.activeElement;dialog.showModal();document.documentElement.style.overflow='hidden';}dBody.innerHTML=html;dialog.scrollTop=0;$('#dialog-close').focus();}
$('#dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{document.documentElement.style.overflow='';dBody.innerHTML='';lastFocus?.focus();});
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
let back=null;
function charRecord(i){const c=archive.characters[i];back=()=>charRecord(i);openDialog(`<div class="rec-layout"><img src="${esc(charImage(i))}" alt="${esc(c.name)}"><div><p class="eyebrow">Character Log · ${esc(c.kicker)}</p><h2 id="dialog-title">${esc(c.name)}</h2><p>${esc(c.body)}</p>${c.quote?`<p><em>${esc(c.quote)}</em></p>`:''}<div class="tags">${c.lessons.map(t=>`<span>${esc(t)}</span>`).join('')}</div>${c.note?`<p style="margin-top:22px">${esc(c.note)}</p>`:''}<p class="subtle">Goma's personal record, preserved from the original archive.</p></div></div><div class="gallery">${c.gallery.map((a,j)=>`<button data-gallery="${i}:${j}" aria-label="Enlarge ${esc(a.alt)}"><img src="${esc(a.src)}" alt="${esc(a.alt)}" loading="lazy"></button>`).join('')}</div>`);}
function lightbox(a,backLabel){openDialog(`<div class="lightbox">${backLabel?`<button class="link" data-back style="margin:0 0 18px">← ${esc(backLabel)}</button>`:''}<img src="${esc(a.src)}" alt="${esc(a.alt)}"><p class="subtle" id="dialog-title" style="margin-top:14px">${esc(a.alt)}</p></div>`);}
function listDialog(type){const list=type==='tv'?archive.TV.map(a=>({t:a.t,s:a.s,n:a.b})):[...archive.MANGA_DONE.map(a=>({t:a.t,s:'Read · '+a.g,n:a.b})),...archive.MANGA_NOW.map(a=>({t:a.t,s:(a.c||'Reading')+' · '+a.g,n:a.b||a.n}))];
 openDialog(`<p class="eyebrow">Ohara Library</p><h2 id="dialog-title">${type==='tv'?'The other screen.':'Between the panels.'}</h2><p class="subtle">${list.length} imported records. Historical notes, not live release data.</p><div class="list">${list.map(a=>`<div><strong>${esc(a.t)}</strong><span>${esc(a.s||'')}</span>${a.n?`<p>${esc(a.n)}</p>`:''}</div>`).join('')}</div>`);}
document.addEventListener('click',e=>{
 const b=e.target.closest('button,[data-jump]');if(!b)return;
 if(b.matches('[data-jump]')){e.preventDefault();const id=b.getAttribute('href').slice(1);if(dialog.open)dialog.close();jumpTo(id==='voyage'?0:absTop(document.getElementById(id)));return;}
 if(b.dataset.char!==undefined)charRecord(+b.dataset.char);
 if(b.dataset.gallery){const[i,j]=b.dataset.gallery.split(':').map(Number);back=()=>charRecord(i);lightbox(archive.characters[i].gallery[j],'Back to '+archive.characters[i].name);}
 if(b.dataset.back!==undefined&&back)back();
 if(b.dataset.art!==undefined){back=null;lightbox(ART[+b.dataset.art]);}
 if(b.dataset.list)listDialog(b.dataset.list);
 if(b.dataset.chapter!==undefined){const j=archive.journey[+b.dataset.chapter];openDialog(`<p class="eyebrow">Anime Journey · ${esc(j.date)}</p><h2 id="dialog-title">${esc(j.title)}</h2><p>${esc(j.body)}</p>${j.quote?`<p><em>${esc(j.quote)}</em></p>`:''}`);}
 if(b.dataset.anime){const t=b.dataset.anime,a=[...archive.ANIME_DONE,...archive.ANIME_NOW].find(x=>x.t===t),top=archive.top10.find(x=>x.title===t);openDialog(`<p class="eyebrow">Anime Journey · Personal record</p><h2 id="dialog-title">${esc(t)}</h2>${a?`<p style="font-size:34px;font-weight:700;color:var(--fg)">${esc(a.s)}${a.tag==='Completed'?' / 10':''}</p><p>${esc(a.b)}</p>`:`<p>${esc(top?.body)}</p>`}${t==='Re:Zero'?'<p class="subtle">V1 records 9.5 on the shelf and 9.7 in the old timeline. The shelf score is kept until you choose.</p>':''}${t==='Death Note'?'<p class="subtle">The asterisk is deliberate: first half 9.5, second half 5.</p>':''}<p class="subtle">Goma's original note and progress, preserved as recorded.</p>`);}
 if(b.dataset.card!==undefined){const c=cards[+b.dataset.card],u='<em>Not recorded</em>';openDialog(`<div class="rec-layout">${c.image?`<img src="${esc(c.image)}" alt="${esc(c.number)} catalog artwork" style="aspect-ratio:5/7">`:'<div class="vcard" style="position:relative;left:0;top:0;width:100%"><span class="ph"><small>'+esc(c.rarity)+'</small><b>'+esc(c.name)+'</b><span>'+esc(c.number)+'<br>Artwork not yet recorded</span></span></div>'}<div><p class="eyebrow">Card Vault · Entry ${c.entry} of ${cards.length}</p><h2 id="dialog-title">${esc(c.name)}</h2><div class="list"><div><strong>Card number</strong><span>${esc(c.number)}</span></div><div><strong>Rarity / type</strong><span>${esc(c.rarity)}</span></div><div><strong>Variant</strong><span>${esc(c.variant||'Not specified')}</span></div><div><strong>Quantity</strong><span>${u}</span></div><div><strong>Language · Condition</strong><span>${u}</span></div><div><strong>Purchase · Value</strong><span>${u}</span></div></div>${c.imageNote?`<p class="subtle" style="margin-top:18px">${esc(c.imageNote)}</p>`:''}${c.variant==='Alternate Art / Parallel'?'<p class="subtle">The regular OP14-112 artwork is deliberately not reused here. Add a verified Parallel image when you have one.</p>':''}</div></div>`);}
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

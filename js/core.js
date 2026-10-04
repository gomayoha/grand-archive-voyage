// Shared engine for every section.
//
// Scrolling is the browser's own (no hijacking). One rAF per frame runs only the sections that are
// near the screen, and each section moves things with transform/opacity only, so the compositor does
// the work. Sections that scrub a big scene (the zoom) can ask for a smoothed value of their own
// progress; that easing lives inside the pinned stage and never fights the page scroll.
export const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const smooth=t=>t*t*(3-2*t);
export const ease=t=>1-Math.pow(1-t,3);
export const pad=n=>String(n).padStart(2,'0');
export const lerp=(a,b,t)=>a+(b-a)*t;
// Fade in over [a,a+f], out over [b,b+f].
export const band=(p,a,b,f=0.08)=>smooth(clamp((p-a)/f))*(1-smooth(clamp((p-b)/f)));
export const coarse=matchMedia('(pointer: coarse)').matches;

/* ---------------------------------------------------------------- motion preference */
const PREF='grand-archive-voyage:reduced';
const systemReduced=matchMedia('(prefers-reduced-motion: reduce)');
export const motion={reduced:systemReduced.matches,listeners:[],snap:false};
try{const s=localStorage.getItem(PREF);if(s!==null)motion.reduced=s==='1'||systemReduced.matches;}catch{}
export function setReduced(v,save=true){motion.reduced=v;if(save)try{localStorage.setItem(PREF,v?'1':'0');}catch{}motion.listeners.forEach(f=>f(v));}
systemReduced.addEventListener('change',e=>setReduced(e.matches,false));

/* ---------------------------------------------------------------- scroll engine */
export const view={sy:scrollY,vh:innerHeight,vw:innerWidth,t:0};
const parts=[];let queued=false,animating=new Set();
export const absTop=el=>el.getBoundingClientRect().top+scrollY;
function frame(t){
 queued=false;view.sy=scrollY;view.t=t||performance.now();
 const {sy,vh}=view;animating.clear();
 for(const p of parts)if(p.always||(sy+vh*1.6>p.top&&sy-vh*0.6<p.top+p.h))p.update(sy);
 if(animating.size)kick();
}
export function kick(){if(!queued){queued=true;requestAnimationFrame(frame);}}
// A part: {el, measure?(), update(sy), always?}. top/h are measured from el unless measure() sets them.
export function part(p){p.top??=0;p.h??=1;const m=p.measure;p.measure=function(){if(p.el){p.top=absTop(p.el);p.h=p.el.offsetHeight;}m&&m.call(p);};parts.push(p);return p;}
// Progress through a pinned (sticky) section: 0 when its top reaches the top of the screen, 1 when it leaves.
export const pinned=(p,s=view.sy)=>clamp((s-p.top)/Math.max(1,p.h-view.vh));
// Progress of an element travelling through the viewport: 0 entering at the bottom, 1 leaving at the top.
export const through=(p,s=view.sy)=>clamp((s+view.vh-p.top)/(p.h+view.vh));
// A value that eases toward its target over a few frames (for scrubbed scenes on wheel/trackpad).
export function follower(tau=110){const f={v:null,target:0,step(t){if(f.v===null||motion.reduced||motion.snap){f.v=f.target;return f.v;}const dt=Math.min(64,t-(f.last||t))||16;f.last=t;f.v+=(f.target-f.v)*(1-Math.exp(-dt/(coarse?Math.min(tau,45):tau)));if(Math.abs(f.target-f.v)<1e-4)f.v=f.target;if(f.v!==f.target)animating.add(f);else animating.delete(f);return f.v;}};return f;}
export function measureAll(){if(!innerHeight)return;view.vh=innerHeight;view.vw=innerWidth;for(const p of parts)p.measure();frame(performance.now());}
export function jumpTo(y){y=Math.max(0,Math.round(y));const at=sectionAt(y);if(at)warm(at);scrollTo({top:y,behavior:'instant'});kick();}
addEventListener('scroll',kick,{passive:true});
let rz;export const remeasure=()=>{clearTimeout(rz);rz=setTimeout(measureAll,140);};
// Phones fire resize when the toolbar slides; only re-measure on real changes.
addEventListener('resize',()=>{if(innerWidth!==view.vw||Math.abs(innerHeight-view.vh)>140)remeasure();});
addEventListener('load',remeasure);
export const onSight=(el,fn,margin='0px 0px -12% 0px')=>{const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){fn(e.target);io.unobserve(e.target);}}),{rootMargin:margin});io.observe(el);return io;};
export const debugParts=parts;

/* ---------------------------------------------------------------- data */
const J=u=>fetch(u).then(r=>r.ok?r.json():null).catch(()=>null);
export const data={};
export async function loadData(){
 const keys=['journey','archive','media','panels','characters','posters','shelf','logbook','route'];
 const files=keys.map(k=>`data/${k}.json`);
 (await Promise.all(files.map(J))).forEach((v,i)=>data[keys[i]]=v);
 // Edits made on the site (Captain's Desk) sit on top of what the notes say, until the note itself changes.
 const edits=await fetch('data/edits.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);
 let pending=null;try{pending=JSON.parse(localStorage.getItem('grand-archive:pending-edits')||'null');}catch{}
 data.edits=mergeEdits(edits,pending);
 if(data.shelf)applyEdits(data.shelf,data.edits);
 return data;
}
export const FIELDS=['status','s','tagline','b','progress','chapter','genre'];
export function mergeEdits(a,b){const out={records:{}};[a,b].forEach(x=>x&&Object.assign(out.records,x.records||{}));return out;}
export function applyEdits(shelf,edits){
 for(const [key,e] of Object.entries(edits.records||{})){
  const [k,...rest]=key.split(':'),t=rest.join(':');if(!shelf[k])continue;
  let rec=shelf[k].find(r=>r.t===t);
  if(!rec){if(!e.new)continue;rec={t,k,status:e.status||'',added:true};shelf[k].push(rec);}
  rec.k=k;
  // A field edited on the site wins only while the note still says what it said at the time of the edit.
  for(const f of FIELDS)if(f in(e.set||{})){const base=(e.base||{})[f];if(e.new||base===undefined||String(rec[f]??'')===String(base??''))rec[f]=e.set[f];}
  rec.edited=e.at||true;
 }
}

/* ---------------------------------------------------------------- images */
// Every gallery photo exists full size (assets/img/f, 1800px) and as a thumbnail (assets/img/t, 720px).
// srcset lets the browser take the thumbnail only where it is genuinely small on screen.
export const TH=id=>`assets/img/t/${id}.webp`,FU=id=>`assets/img/f/${id}.webp`;
export const dims=id=>(data.media&&data.media.img[id])||[4,5];
// Width descriptors must be the files' real widths (thumbnails are 720px on their LONG side), or the
// browser picks the small file where it needs the big one and the photo looks soft.
export const pic=(id,{alt='',sizes='(max-width:820px) 50vw, 25vw',cls='',eager=false}={})=>{const [w,h]=dims(id),tw=Math.round(w*Math.min(1,720/Math.max(w,h)));return `<img${cls?` class="${cls}"`:''} src="${TH(id)}" srcset="${TH(id)} ${tw}w, ${FU(id)} ${w}w" sizes="${sizes}" width="${w}" height="${h}" alt="${esc(alt)}" ${eager?'':'loading="lazy" '}decoding="async">`;};
// Images inside transformed/pinned stages: native lazy-loading can miss them, so load as they approach.
export function loadNear(root,margin='150% 0px'){onSight(root,()=>warm(root),margin);}
export const warm=root=>root.querySelectorAll('img[loading="lazy"]').forEach(i=>i.loading='eager');
// Every section starts loading its pictures two screens before it arrives, and a jump (nav, Log Pose)
// warms its target first, so nobody lands on empty frames.
const sectionAt=y=>[...document.querySelectorAll('main>section')].find(s=>!s.hidden&&y<absTop(s)+s.offsetHeight);
export function lookAhead(){document.querySelectorAll('main>section').forEach(s=>onSight(s,warm,'0px 0px 200% 0px'));}
// Pictures fade in as they arrive instead of popping (the zoom paintings and the viewer handle their own).
const arrived=new WeakSet();
document.addEventListener('load',e=>{const t=e.target;if(t.tagName!=='IMG'||arrived.has(t)||t.closest('.jl-host,.viewer-stage'))return;arrived.add(t);if(!motion.reduced)t.classList.add('img-in');},true);

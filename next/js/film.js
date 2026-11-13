// The opening film (Nov 2026). He asked for a start page that captivates the way the classic living wall did, but new.
// Every time the app opens, a short title sequence plays by itself, cut fresh from today's edition: a greeting over
// the picture of the day, the character of the day and the word they left, one of his own lines arriving word by
// word, a moment, his verdict on a story, then a burst through the whole archive. It ends on a frame that never
// stops: one picture after another, drifting closer, each with its name. Only two pictures exist at a time and all
// motion is transform and opacity, so it is light on a phone. Tap the right side to go on, the left to go back.
import {esc,data,S,TH,FU,pool,pick,shuffle,poster,reduced,rarity,RNAME} from './store.js';
import {charImg,momentArt} from './stories.js';

const DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const words=t=>esc(t).split(/\s+/).map((w,i)=>`<span class="w" style="--i:${i}">${w}</span>`).join(' ');
const size=t=>{const n=t.length;return n<28?'xl':n<70?'l':n<140?'m':'s';};

export function mountFilm(el,E){
 const d=new Date(),h=d.getHours(),hi=h<5?'Still up':h<12?'Good morning':h<18?'Good afternoon':'Good evening';
 const c=E.character,p=E.picture,m=E.moment,w=E.words,wp=poster(w.k,w.t);
 const mine=(data.media.characters||[]).find(x=>c.name.toLowerCase().includes(x.home.toLowerCase())),cpic=mine&&mine.all.length>1?FU(mine.all[(d.getDate()*7)%mine.all.length]):charImg(c);
 const total=Object.keys(data.media.img).length,records=data.shelf.anime.length+data.shelf.manga.length+data.shelf.tv.length;
 const said=c.left||(c.changed||[])[0]||'';
 const scenes=[
  {img:FU(p.id),k:`${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`,h:`${hi}${S.name?`, ${esc(S.name)}`:''}.`,s:S.streak.n>1?`Day ${S.streak.n} in a row.`:'Your edition is ready.',ms:3600},
  {img:charImg(c),k:'Character of the day',h:esc(c.name),it:c.word?`${esc(c.word)}.`:'',s:esc(c.series),ms:3800,tint:c.image.color},
  said?{img:cpic,k:'What stayed',q:said,s:`${esc(c.name)}`,ms:2800+said.split(/\s+/).length*230,tint:c.image.color}:null,
  {img:momentArt(m)[0],k:'A moment that lives in my head',h:esc(m.title),s:`${esc(m.series)}${m.emotion?` · ${esc(m.emotion)}`:''}`,ms:3800,cls:'mid'},
  {k:'In my words',q:w.tagline,s:`${esc(w.t)}${w.s?` · ${esc(String(w.s).replace('*',''))} / 10`:''}`,ms:2800+w.tagline.split(/\s+/).length*230,tint:wp?.color||'#3a2f1a',quote:true},
  {burst:true,k:'The archive',h:`<b class="fm-n" data-to="${total}">0</b> pictures.`,s:`${records} records. ${data.characters.characters.length} characters.`,ms:2600}
 ].filter(Boolean);
 const N=scenes.length;
 el.innerHTML=`<div class="fm-pics"><img class="fm-i" alt="" decoding="async"><img class="fm-i" alt="" decoding="async"></div><div class="fm-shade"></div>
  <div class="fm-bars" aria-hidden="true">${scenes.map(()=>'<i><b></b></i>').join('')}</div>
  <div class="fm-copy" aria-live="off"></div>
  <button class="fm-more" data-film-more>Today’s edition<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 9.500l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
  <button class="fm-replay" data-film-replay aria-label="Play the opening again"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12a7 7 0 1 0 2.200-5.100M5 4.500V8h3.500" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
 const pics=[...el.querySelectorAll('.fm-i')],copy=el.querySelector('.fm-copy'),bars=[...el.querySelectorAll('.fm-bars i')];
 let i=-1,front=0,timer=0,token=0,visible=true,live=null;
 const busy=()=>!visible||document.hidden||document.documentElement.classList.contains('locked');
 // one picture fades in over the other and drifts closer; the hidden one is reused for the next
 async function put(src,{cut=false,drift=9}={}){
  const my=++token,im=pics[front^=1],old=pics[front^1];
  im.src=src;try{await im.decode();}catch{}
  if(my!==token)return false;
  im.style.animation='none';void im.offsetWidth;im.style.animation=`fmKen${my%3} ${drift}s linear both`;
  el.classList.toggle('cut',cut);im.classList.add('on');old.classList.remove('on');el.classList.add('has-pic');
  return true;
 }
 const text=s=>`${s.k?`<p class="fm-k">${esc(s.k)}</p>`:''}${s.h?`<h2 class="fm-h ${size(s.h.replace(/<[^>]+>/g,''))}">${s.h}</h2>`:''}${s.it?`<p class="fm-it">${s.it}</p>`:''}${s.q?`<p class="fm-q ${size(s.q)}">${words(`“${s.q}”`)}</p>`:''}${s.s?`<p class="fm-s">${s.s}</p>`:''}`;
 function show(n){
  clearTimeout(timer);clearInterval(live);live=null;
  if(n>=N){ending();return;}
  i=Math.max(0,n);const s=scenes[i];
  el.className='film'+(s.cls?' '+s.cls:'')+(s.quote?' quote':'')+(el.classList.contains('has-pic')?' has-pic':'');
  el.style.setProperty('--tint',s.tint||'#1c1c1e');
  bars.forEach((b,k)=>{b.classList.toggle('done',k<i);b.classList.toggle('on',k===i);b.style.setProperty('--ms',s.ms+'ms');});
  copy.innerHTML=text(s);
  if(s.burst){burst(s);}
  else if(s.img)put(s.img);
  else{token++;pics.forEach(x=>x.classList.remove('on'));el.classList.remove('has-pic');}
  wait(s.ms,()=>show(i+1));
 }
 // waiting holds still while a sheet is open, the tab is hidden or the film is off screen
 function wait(ms,fn){const t0=performance.now();let left=ms;const tick=()=>{if(busy()){timer=setTimeout(tick,400);return;}timer=setTimeout(fn,left);};tick();}
 // a burst of quick cuts through everything he kept, while the count runs up
 function burst(s){
  const ids=shuffle(pool()).slice(0,9).map(x=>x.id);ids.forEach(id=>{const im=new Image();im.src=TH(id);});
  let k=0;const cutNext=()=>{if(i<0||!scenes[i]?.burst)return;put(TH(ids[k%ids.length]),{cut:true,drift:3});k++;};
  cutNext();live=setInterval(()=>{if(!busy())cutNext();},230);
  const n=copy.querySelector('.fm-n'),to=+n.dataset.to,t0=performance.now();
  const tick=t=>{if(!n.isConnected)return;const q=Math.min(1,(t-t0)/1700),e=1-Math.pow(1-q,3);n.textContent=Math.round(to*e).toLocaleString('en-US');if(q<1)requestAnimationFrame(tick);};requestAnimationFrame(tick);
 }
 // the frame it rests on: never still. A new picture every few seconds, with its name; tap it to open it.
 let cur=null;
 function ending(){
  i=N;el.className='film end has-pic';bars.forEach(b=>{b.classList.add('done');b.classList.remove('on');});
  const next=async()=>{
   if(busy())return;const x=cur?pick(pool()):p;const ok=await put(FU(x.id),{drift:11});if(!ok)return;cur=x;
   copy.innerHTML=`<p class="fm-k">${cur===p?'Picture of the day':'From the archive'}</p><h2 class="fm-h ${size(x.col)}">${esc(x.col)}</h2><p class="fm-s">No. ${x.i} of ${x.of} · ${RNAME[rarity(x.id)]} card${S.cards[x.id]?' · in your binder':''}</p>`;
  };
  cur=null;next();live=setInterval(next,6200);
 }
 el.addEventListener('click',e=>{
  if(e.target.closest('[data-film-more]')){const t=el.nextElementSibling;scrollTo({top:(t?t.getBoundingClientRect().top+scrollY:innerHeight)-60,behavior:reduced()?'auto':'smooth'});return;}
  if(e.target.closest('[data-film-replay]')){cur=null;show(0);return;}
  if(i>=N){if(cur)document.dispatchEvent(new CustomEvent('ga:open',{detail:`pic:${cur.id}`}));return;}
  const r=el.getBoundingClientRect();show((e.clientX-r.left)/r.width<.28?i-1:i+1);
 });
 new IntersectionObserver(([e])=>{visible=e.isIntersecting;},{threshold:.25}).observe(el);
 if(reduced()){i=N;el.className='film end has-pic still';pics[0].src=FU(p.id);pics[0].classList.add('on');cur=p;copy.innerHTML=text(scenes[0]);return;}
 show(0);
}

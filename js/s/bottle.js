// 00 · The first screen: a message in a bottle. A calm sea under the sky of the hour you arrive (dawn, day,
// dusk or night); a bottle drifts in; tap it and a note unrolls with one piece of the archive in Goma's own
// words: a moment, a character, a favourite panel, a Top 10 reason, a journey phase or a review. Every visit
// brings a different one, and the archive counts how many of them you've found. ("Anime is for losers",
// the old opening, is kept in s/opening.js for later.)
import {$,esc,data,jumpTo,absTop,TH} from '../core.js';
import {momentArt} from './moments.js';

const KEY='grand-archive:bottles',RECENT='grand-archive:bottles-recent';
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??d;}catch{return d;}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};
const PM=id=>`assets/panels/m/${id}.webp`;
const first=(blocks,n=2)=>blocks.filter(b=>b.p||b.q).slice(0,n);

// Every message the sea can bring back, all in his words.
function messages(){
 const out=[],posters=data.posters||{},poster=t=>posters[`anime:${t}`]?.img;
 for(const m of data.route?.moments||[]){const art=momentArt(m)[0]||(m.series==='Re:Zero'?poster('Re:Zero'):poster(m.series));
  out.push({id:`m:${m.series}-${m.n}`,k:'A moment that lives in my head',title:m.title,tag:m.emotion,blocks:first(m.text,3),art,to:'moments'});}
 for(const c of data.characters?.characters||[])out.push({id:`c:${c.id}`,k:`The Character Log · ${c.series}`,title:c.name,tag:c.word?`Left behind: ${c.word}`:'',blocks:[{p:c.left}],art:`assets/chars/m/${c.image.id}.webp`,to:'characters'});
 for(const s of data.panels?.onepiece||[])for(const p of s.panels)if(p.note)out.push({id:`p:${p.images[0].id}`,k:p.chapter?`One Piece · Chapter ${p.chapter}`:'One Piece · a favourite panel',title:p.title,blocks:[{p:p.note}],art:PM(p.images[0].id),panel:true,to:'panels'});
 (data.shelf?.top10||[]).forEach((t,i)=>out.push({id:`t:${t.title}`,k:`My top 10 · #${i+1}`,title:t.title,blocks:[{p:t.body}],art:poster(t.title),to:'top'}));
 for(const ph of data.route?.stops||[])if(ph.blocks?.length)out.push({id:`j:${ph.phase}`,k:`My Anime Journey · Phase ${ph.phase}${ph.when?` · ${ph.when}`:''}`,title:ph.name,blocks:first(ph.blocks,3),art:poster(ph.title)||null,to:'logbook'});
 for(const a of data.shelf?.anime||[])if(a.tagline&&a.status!=='want')out.push({id:`s:${a.t}`,k:`From the shelf${a.s?` · ${String(a.s).replace('*','')}/10`:''}`,title:a.t,blocks:[{p:a.tagline}],art:poster(a.t),to:'records'});
 return out.filter(x=>x.blocks.length&&x.blocks.every(b=>b.p||b.q));
}

// The sky follows the hour you arrive.
function sky(){const h=new Date().getHours();return h>=5&&h<8?'dawn':h>=8&&h<16?'day':h>=16&&h<19?'dusk':'night';}
const GREET={dawn:'Good morning.',day:'Good afternoon.',dusk:'Good evening.',night:'Good night, sailor.'};

const BOTTLE=`<svg viewBox="0 0 120 60" aria-hidden="true"><defs><linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9f0e4" stop-opacity=".75"/><stop offset=".5" stop-color="#5fb3a3" stop-opacity=".55"/><stop offset="1" stop-color="#2e7a6e" stop-opacity=".8"/></linearGradient></defs>
 <path d="M14 18c0-6 5-10 12-10h46c7 0 10 4 14 7l10 6h8v18h-8l-10 6c-4 3-7 7-14 7H26c-7 0-12-4-12-10z" fill="url(#glass)" stroke="#e8fff9" stroke-opacity=".7" stroke-width="1.5"/>
 <rect x="104" y="22" width="12" height="16" rx="3" fill="#a9754a" stroke="#6b4426" stroke-width="1.5"/>
 <g class="bt-note"><rect x="26" y="20" width="50" height="20" rx="4" fill="#efe3c4"/><path d="M30 26h40M30 30h34M30 34h38" stroke="#a2865a" stroke-width="1.2"/><path d="M50 20v20" stroke="#c9302c" stroke-width="2"/></g>
 <path d="M22 14c10-3 40-3 56 0" stroke="#fff" stroke-opacity=".7" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>`;
const WAVE=(h,a)=>{let d=`M0 ${h}`;for(let x=0;x<=2400;x+=150)d+=` Q${x+75} ${h-a} ${x+150} ${h}`;return d+` V200 H0Z`;};

export function initBottle(){
 const sec=$('#home');if(!sec)return;
 // ?sky=dawn|day|dusk|night previews another hour
 const forced=new URLSearchParams(location.search).get('sky'),pool=messages(),mode=forced in GREET?forced:sky();
 sec.dataset.sky=mode;
 const found=new Set(get(KEY,[]).filter(id=>pool.some(m=>m.id===id)));
 $('#bt-greet').textContent=GREET[mode];
 $('#bt-sea').innerHTML=`<svg class="sea-svg" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">${[[60,10,'w1'],[86,13,'w2'],[116,9,'w3']].map(([h,a,c])=>`<path class="${c}" d="${WAVE(h,a)}"/>`).join('')}</svg>`;
 if(mode==='night')$('#bt-stars').innerHTML=Array.from({length:70},(_,i)=>{const r=x=>{const v=Math.sin((i+1)*x)*43758.5453;return v-Math.floor(v);};return `<i style="left:${(r(12.9)*100).toFixed(2)}%;top:${(r(78.2)*58).toFixed(2)}%;--d:${(r(3.7)*6).toFixed(2)}s;--s:${(1+r(9.1)*1.6).toFixed(2)}px"></i>`;}).join('');
 const bottle=$('#bt-bottle'),note=$('#bt-note'),count=$('#bt-count'),again=$('#bt-again'),go=$('#bt-go');
 bottle.innerHTML=BOTTLE;
 let cur=null;
 // what the sea brings: something not seen recently, preferring what hasn't been found yet
 function pick(){
  const recent=get(RECENT,[]),fresh=pool.filter(m=>!found.has(m.id)&&!recent.includes(m.id)),okay=pool.filter(m=>!recent.includes(m.id));
  const from=fresh.length?fresh:okay.length?okay:pool;return from[Math.floor(Math.random()*from.length)];
 }
 function showCount(){const t=found.size?`You've found <b>${found.size}</b> of ${pool.length} messages`:`${pool.length} messages are out there`;count.innerHTML=t;$('#bt-found').innerHTML=t;}
 function render(m){
  note.innerHTML=`<div class="bn-paper">${m.art?`<figure class="bn-art${m.panel?' panel':''}"><img src="${esc(m.art)}" alt="" decoding="async"></figure>`:''}
   <div class="bn-body"><p class="bn-k">${esc(m.k)}</p><h2 class="bn-title">${esc(m.title)}</h2>${m.tag?`<p class="bn-tag">${esc(m.tag)}</p>`:''}
   <div class="bn-text">${m.blocks.map(b=>b.q?`<blockquote>${esc(b.q)}</blockquote>`:`<p>${esc(b.p)}</p>`).join('')}</div><p class="bn-sign">— Goma</p></div></div>`;
 }
 function open(){
  if(sec.classList.contains('opened'))return;
  cur=pick();render(cur);found.add(cur.id);put(KEY,[...found]);
  const recent=get(RECENT,[]);recent.unshift(cur.id);put(RECENT,recent.slice(0,Math.min(40,Math.floor(pool.length/2))));
  showCount();sec.classList.add('opened');sec.classList.remove('arrive');
 }
 function another(){
  sec.classList.remove('opened');sec.classList.add('sinking');
  setTimeout(()=>{sec.classList.remove('sinking','arrive');void sec.offsetWidth;sec.classList.add('arrive');},700);
 }
 showCount();
 bottle.addEventListener('click',open);
 again.addEventListener('click',another);
 go.addEventListener('click',()=>{const t=document.getElementById(cur?.to||'characters');if(t)jumpTo(absTop(t));});
 requestAnimationFrame(()=>sec.classList.add('arrive'));
}

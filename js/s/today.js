// 00 · Today in the Archive. The first screen opens the archive on a different page every visit: one
// piece of art from his collection (a character portrait, a moment's picture, a favourite panel, a cover)
// beside his own words for it. Calm on purpose: the art eases in, the words settle, nothing else moves.
// ("Anime is for losers", the old opening, is kept in s/opening.js for later.)
import {$,esc,data,jumpTo,absTop} from '../core.js';
import {momentArt} from './moments.js';

const SEEN='grand-archive:pages-seen',RECENT='grand-archive:pages-recent';
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??d;}catch{return d;}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};
const words=bs=>bs.filter(b=>b.p||b.q).map(b=>b.p||b.q);

// Every page it can open on: always a picture and always his words.
function pages(){
 const out=[],posters=data.posters||{},poster=t=>posters[`anime:${t}`];
 for(const c of data.characters?.characters||[])if(c.left)out.push({id:`c:${c.id}`,k:`The Character Log · ${c.series}`,name:`${c.name} · ${c.word||''}`.replace(/ · $/,''),text:c.left,art:`assets/chars/m/${c.image.id}.webp`,tint:c.image.color,to:'characters'});
 for(const m of data.route?.moments||[]){const art=momentArt(m)[0];if(art)out.push({id:`m:${m.series}-${m.n}`,k:`A moment that lives in my head · ${m.series}`,name:m.title,text:words(m.text).slice(0,2).join(' '),art,to:'moments'});}
 for(const s of data.panels?.onepiece||[])for(const p of s.panels)if(p.note)out.push({id:`p:${p.images[0].id}`,k:p.chapter?`Favourite panel · One Piece, chapter ${p.chapter}`:'Favourite panel · One Piece',name:p.title,text:p.note,art:`assets/panels/m/${p.images[0].id}.webp`,panel:true,to:'panels'});
 (data.shelf?.top10||[]).forEach((t,i)=>{const p=poster(t.title);if(p&&t.body)out.push({id:`t:${t.title}`,k:`My top 10 · number ${i+1}`,name:t.title,text:t.body,art:p.img,tint:p.color,to:'top'});});
 return out;
}

export function initToday(){
 const sec=$('#home');if(!sec)return;
 const pool=pages();if(!pool.length)return;
 const seen=new Set(get(SEEN,[]).filter(id=>pool.some(p=>p.id===id)));
 const art=$('#td-art'),img=art.querySelector('img'),page=$('#td-page'),count=$('#td-count');
 $('#td-date').textContent=`Goma's Grand Archive · ${new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}`;
 let cur=null;
 const pick=()=>{const recent=get(RECENT,[]),fresh=pool.filter(p=>!seen.has(p.id)&&!recent.includes(p.id)),ok=pool.filter(p=>!recent.includes(p.id)&&p.id!==cur?.id);const from=fresh.length?fresh:ok.length?ok:pool;return from[Math.floor(Math.random()*from.length)];};
 function show(p){
  cur=p;seen.add(p.id);put(SEEN,[...seen]);const recent=get(RECENT,[]);recent.unshift(p.id);put(RECENT,recent.slice(0,Math.floor(pool.length/2)));
  art.classList.toggle('panel',!!p.panel);img.src=p.art;img.alt=p.name;
  sec.style.setProperty('--tc',p.tint||'#f3c969');
  page.innerHTML=`<p class="td-k">${esc(p.k)}</p><h2 class="td-name">${esc(p.name)}</h2><p class="td-words">“${esc(p.text)}”</p>`;
  count.textContent=`${seen.size} of ${pool.length} pages opened`;
 }
 const arrive=()=>{sec.classList.remove('in');void sec.offsetWidth;sec.classList.add('in');};
 show(pick());
 if(img.complete)arrive();else{img.onload=arrive;setTimeout(arrive,900);}
 $('#td-next').addEventListener('click',()=>{sec.classList.add('out');setTimeout(()=>{show(pick());sec.classList.remove('out');img.decode?.().then(arrive,arrive)??arrive();},360);});
 $('#td-go').addEventListener('click',()=>{const t=document.getElementById(cur?.to||'characters');if(t)jumpTo(absTop(t));});
}

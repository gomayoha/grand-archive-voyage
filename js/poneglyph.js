// The Road Poneglyph hunt. Four red stones are hidden across the archive (one inside the story of One Piece,
// three on the main page, each where it belongs: the crew's board, the panels, the Ohara Library). Tap one
// to take a rubbing; take all four and the lines between them meet at Laugh Tale, where Goma's own words
// wait (from his Anime Journey note, word for word). Progress lives in this browser only.
const KEY='grand-archive:poneglyphs',ALL=['zou','crew','panels','library'];
const CORNERS=[[.08,.1],[.92,.1],[.08,.9],[.92,.9]];
const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.filter(x=>ALL.includes(x)):[];}catch{return[];}};
const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v));}catch{}};
export const poneglyphsFound=()=>read().length;

const STONE=`<svg class="pg-svg" viewBox="0 0 64 64" aria-hidden="true">
 <path d="M32 4 58 16 58 46 32 60 6 46 6 16Z" fill="#7d1d17"/><path d="M32 4 58 16 32 28 6 16Z" fill="#b8392c"/><path d="M32 28 58 16 58 46 32 60Z" fill="#5c140f"/>
 <g class="pg-glyphs" fill="none" stroke="#f3c08a" stroke-width="1.6" stroke-linecap="round"><path d="M11 24h6M11 29h4l2 3M12 35c3-2 4 2 6 0M11 41h7M19 24v5M14 45l4 2"/><path d="M24 31v6h3M23 41c2 2 4 0 4-2M26 46v4"/><path d="M38 34l4-2v5M37 42h5M44 30v4h3M40 48c2-2 4 0 5-2M48 40l2 3"/></g></svg>`;

let toastT=0;
function toast(n){
 let t=document.querySelector('.pg-toast');
 if(!t){t=document.createElement('div');t.className='pg-toast';t.setAttribute('role','status');document.body.appendChild(t);}
 t.innerHTML=`<span class="pg-row">${ALL.map((_,i)=>`<i class="${i<n?'on':''}">${STONE}</i>`).join('')}</span><span class="pg-msg"><b>Road Poneglyph ${n} of 4.</b> ${n<4?(n===1?'Three more are hidden somewhere in the archive.':`${4-n} to go.`):'The lines meet…'}</span>`;
 t.classList.remove('show');void t.offsetWidth;t.classList.add('show');
 clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),n<4?4200:1800);
}

function stone(spot){
 const id=spot.dataset.pg,found=read().includes(id);
 spot.innerHTML=`<button class="pg-stone${found?' rubbed':''}" aria-label="${found?'A Road Poneglyph you already took a rubbing of':'A red stone covered in strange writing'}">${STONE}<span class="pg-paper" aria-hidden="true"></span></button>`;
 spot.firstChild.addEventListener('click',e=>{
  e.preventDefault();e.stopPropagation();
  const have=read();if(have.includes(id)){if(have.length===ALL.length)openLaughTale();return;}
  have.push(id);write(have);
  const b=spot.firstChild;b.classList.add('rubbing');setTimeout(()=>{b.classList.remove('rubbing');b.classList.add('rubbed');},900);
  toast(have.length);
  if(have.length===ALL.length)setTimeout(openLaughTale,1500);
 });
}

async function openLaughTale(){
 let d=document.querySelector('.laugh-tale');
 if(!d){
  const route=await fetch('data/route.json').then(r=>r.ok?r.json():null).catch(()=>null);
  // his words: the One Piece phase of his Anime Journey
  const op=(route?.stops||[]).find(s=>/one piece/i.test(s.title||''));
  const blocks=op?op.blocks:[];const qi=blocks.findIndex(b=>b.q&&/dream loudly/i.test(b.q));
  const words=[qi>=0?blocks[qi]:null,qi>=0?blocks[qi+1]:null,blocks.find(b=>b.p&&/place I return to/i.test(b.p))].filter(Boolean);
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  d=document.createElement('dialog');d.className='laugh-tale';d.setAttribute('aria-label','Laugh Tale');
  d.innerHTML=`<div class="lt-sky"><svg class="lt-lines" aria-hidden="true">${CORNERS.map(()=>`<line pathLength="1"/>`).join('')}</svg>
   ${['tl','tr','bl','br'].map(c=>`<i class="lt-stone ${c}">${STONE}</i>`).join('')}<i class="lt-flare"></i></div>
   <div class="lt-body">
    <p class="lt-k">Four Road Poneglyphs · one island</p>
    <h2 class="lt-title">Laugh <em>Tale.</em></h2>
    <figure class="lt-panel"><img src="assets/panels/m/9fed15cec4cc.webp" width="1073" height="800" alt="Roger laughs at Laugh Tale"></figure>
    <p class="lt-line">Roger found what was left here and laughed. This is what I found at the end of mine.</p>
    <div class="lt-words">${words.map(b=>b.q?`<blockquote>${esc(b.q)}</blockquote>`:`<p>${esc(b.p)}</p>`).join('')}<cite>— Goma, Anime Journey</cite></div>
    <div class="lt-links"><button class="pill" data-lt-close>Back to the sea</button><button class="lt-reset" data-lt-reset>Hide the stones again</button></div>
   </div>`;
  document.body.appendChild(d);
  d.addEventListener('click',e=>{
   if(e.target.closest('[data-lt-close]')){d.close();return;}
   if(e.target.closest('[data-lt-reset]')){write([]);document.querySelectorAll('[data-pg]').forEach(stone);d.close();}
  });
  d.addEventListener('close',()=>{document.documentElement.style.overflow='';});
 }
 d.classList.remove('go');d.showModal();document.documentElement.style.overflow='hidden';d.scrollTop=0;
 // the lines are drawn in real pixels so they stay solid and meet exactly between the four stones
 const sky=d.querySelector('.lt-sky'),svg=d.querySelector('.lt-lines'),w=sky.clientWidth,h=sky.clientHeight;
 svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
 svg.querySelectorAll('line').forEach((l,i)=>{const [x,y]=CORNERS[i];l.setAttribute('x1',x*w);l.setAttribute('y1',y*h);l.setAttribute('x2',w/2);l.setAttribute('y2',h/2);});
 requestAnimationFrame(()=>d.classList.add('go'));
}

export function initPoneglyphs(){document.querySelectorAll('[data-pg]').forEach(stone);}

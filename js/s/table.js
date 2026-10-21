// 08½ · The Card Table: after the spiral, every card is dealt out onto a dark felt mat, and you sort them
// however you like. Each sort is a different picture of the same collection, and the cards glide there:
//   Character → a pile for everyone (Hancock's six, Nami's four…), Crew → long fanned rows per crew,
//   Colour → the six colours of the game, Rarity → parallels down to commons, Cost → the cost curve, built
//   out of the cards themselves, Set → which box each one came from.
// Tap a pile (or a row's name) and you pick it up: the table dims and the cards fan out in your hand,
// with the name written huge behind them; ‹ › walks to the next character. Tap a card to hold it up close
// (js/tcg.js). "Draw a hand" deals five at random. The table remembers how many you've held.
// Cards are absolutely placed on the mat and only ever move by transform (one transition each).
import {$,esc,clamp,view,motion,coarse,data,remeasure} from '../core.js';
import {COLORS,HUE,RNAME,face,big,rank,tier,hue,label,light,inspect,picturesOf,onSeen} from '../tcg.js';
import {once} from '../bounty.js';

const CREWS=['Straw Hat Pirates','The Emperors’ crews','The Warlords','The Worst Generation','Revolutionary Army','The World Government','Dressrosa','Thriller Bark','Across the Grand Line','From the films','DON!!'];
const TIERS=[['alt','Parallels & special frames'],['lead','Leaders'],['sr','Super Rares'],['r','Rares & promos'],['c','Uncommons & commons'],['ghost','Not photographed yet'],['don','DON!!']];
const ALT_T=Object.fromEntries(TIERS);
const MODES=[
 {id:'char',l:'Character',type:'piles',key:c=>c.char},
 {id:'crew',l:'Crew',type:'rows',key:c=>c.crew,order:CREWS},
 {id:'color',l:'Colour',type:'rows',key:c=>c.kind==='DON'?'DON!!':c.colors[0],order:[...COLORS,'DON!!']},
 {id:'rarity',l:'Rarity',type:'rows',key:c=>ALT_T[tier(c)],order:TIERS.map(t=>t[1])},
 {id:'cost',l:'Cost',type:'cols',key:c=>c.kind==='Leader'?'L':c.kind==='DON'?'DON!!':String(c.cost),order:['L','1','2','3','4','5','6','7','8','9','10','DON!!']},
 {id:'set',l:'Set',type:'rows',key:c=>c.kind==='DON'?'DON!!':c.set}
];
const PREF='grand-archive:tcg-sort';
const hash=s=>{let h=2166136261;for(const ch of s)h=Math.imul(h^ch.charCodeAt(0),16777619);return((h>>>0)%1000)/1000;};
const plural=(n,w)=>`${n} ${w}${n===1?'':'s'}`;

export function initTable(){
 const sec=$('#table'),T=data.tcg;
 if(!T||!sec){if(sec)sec.hidden=true;return;}
 const cards=T.cards,N=cards.length;
 const stage=$('#tb-stage'),sortBox=$('#tb-sort'),hand=$('#tb-hand'),veil=$('#tb-veil'),meter=$('#tb-meter');
 let mode=MODES.find(m=>{try{return m.id===localStorage.getItem(PREF);}catch{return false;}})||MODES[0];

 stage.innerHTML=cards.map((c,i)=>`<button class="tg" data-card="${i}" aria-label="${esc(c.name)}, ${esc(label(c))}">${face(c)}</button>`).join('')+'<div class="tb-labs" id="tb-labs"></div>';
 const els=[...stage.querySelectorAll('.tg')],labs=$('#tb-labs');
 sortBox.innerHTML=MODES.map(m=>`<button data-sort="${m.id}" aria-pressed="${m===mode}">${m.l}</button>`).join('');

 /* ---------------- groups for the current sort ---------------- */
 let groups=[];
 function group(){
  const by=new Map();
  for(const c of cards){const k=mode.key(c);if(!by.has(k))by.set(k,[]);by.get(k).push(c);}
  for(const v of by.values())v.sort((a,b)=>rank(b)-rank(a)||a.no.localeCompare(b.no));
  let keys=[...by.keys()];
  if(mode.order)keys.sort((a,b)=>mode.order.indexOf(a)-mode.order.indexOf(b));
  else if(mode.id==='set')keys.sort((a,b)=>(a==='DON!!')-(b==='DON!!')||by.get(a)[0].setCode.localeCompare(by.get(b)[0].setCode));
  else keys.sort((a,b)=>(a==='DON!!')-(b==='DON!!')||by.get(b).length-by.get(a).length||a.localeCompare(b));
  groups=keys.map(k=>({key:k,cards:by.get(k)}));
 }
 const gname=g=>mode.id==='cost'?(g.key==='L'?'Leaders':g.key==='DON!!'?'DON!!':`Cost ${g.key}`):g.key;
 const gsub=g=>{const n=g.cards.length,lead=g.cards.filter(c=>c.rarity==='L').length,sr=g.cards.filter(c=>c.rarity==='SR').length,alt=g.cards.filter(c=>c.print&&c.kind!=='DON').length;
  return [plural(n,'card'),lead?plural(lead,'Leader'):'',sr?`${sr} SR`:'',alt?plural(alt,'parallel'):''].filter(Boolean).join(' · ');};
 const gHue=g=>mode.id==='color'?HUE[g.key]:hue(g.cards[0]);

 /* ---------------- where every card lies ---------------- */
 let BASE=120,pos=[];
 function layout(){
  const W=stage.clientWidth,phone=view.vw<=700;BASE=phone?84:120;stage.style.setProperty('--cw',BASE+'px');
  const at=(c,x,y,cw,r,z)=>{pos[cards.indexOf(c)]={x,y,s:cw/BASE,r,z};};
  let H=0,L=[];
  const type=mode.type==='cols'&&phone?'rows':mode.type;
  if(type==='piles'){
   const cw=phone?Math.min(76,(W-30)/4.2):112,ch=cw*1.396,cell=cw+(phone?18:40),labH=phone?40:48,rowH=ch+labH+(phone?18:30);
   const cols=Math.max(2,Math.floor((W+8)/cell)),used=Math.min(cols,groups.length),x0=(W-used*cell)/2+cell/2;
   groups.forEach((g,gi)=>{const cx=x0+(gi%cols)*cell,cy=Math.floor(gi/cols)*rowH+ch/2+12;
    g.cards.forEach((c,k)=>{const o=Math.min(k,4)*(phone?2:3);at(c,cx+o,cy-o,cw,k===0?(hash(c.id)-0.5)*3:(hash(c.id)-0.5)*10,40-k);});
    L.push({g,gi,x:cx,y:cy+ch/2+(phone?8:12),w:cell,cls:'pile'});H=Math.max(H,cy+ch/2+labH);});
  }else if(type==='rows'){
   const cw=phone?66:104,ch=cw*1.396,labW=phone?0:220,labH=phone?34:0,gap=phone?22:34,avail=W-labW;
   let y=0;
   groups.forEach((g,gi)=>{const n=g.cards.length,per=Math.max(1,Math.floor((avail-cw)/(cw*(phone?0.26:0.2)))+1),lines=Math.ceil(n/per),m=Math.ceil(n/lines);
    const step=m>1?Math.min(cw+(phone?8:14),(avail-cw)/(m-1)):0;
    L.push({g,gi,x:0,y:y,w:labW||W,cls:'row'});
    g.cards.forEach((c,k)=>{const li=Math.floor(k/m),kk=k%m;at(c,labW+cw/2+kk*step,y+labH+ch/2+li*ch*0.42,cw,(hash(c.id)-0.5)*2.4,k+1);});
    y+=labH+ch+(lines-1)*ch*0.42+gap;});
   H=y;
  }else{ // the cost curve: one column per cost, each card peeking out above the next
   const cols=mode.order.filter(k=>groups.some(g=>g.key===k)),colW=W/cols.length,cw=Math.min(98,colW*0.84),ch=cw*1.396,step=ch*0.2;
   const tall=Math.max(...groups.map(g=>g.cards.length)),base=ch+(tall-1)*step+10;
   cols.forEach((k,ci)=>{const g=groups.find(x=>x.key===k),cx=colW*(ci+0.5),n=g.cards.length;
    g.cards.forEach((c,j)=>at(c,cx,base-ch/2-(n-1-j)*step,cw,0,j+1));
    L.push({g,gi:groups.indexOf(g),x:cx,y:base+12,w:colW,cls:'col'});});
   H=base+70;
  }
  stage.style.height=Math.ceil(H)+'px';
  labs.innerHTML=L.map(l=>`<button class="tb-lab ${l.cls}" data-group="${l.gi}" style="--x:${l.x.toFixed(1)}px;--y:${l.y.toFixed(1)}px;--w:${l.w.toFixed(1)}px;--hue:${gHue(l.g)}">${mode.id==='cost'?`<b>${esc(l.g.key==='DON!!'?'DON':l.g.key)}</b><small>${l.g.cards.length}</small>`:`<b>${esc(gname(l.g))}</b><small>${l.cls==='pile'?'×'+l.g.cards.length:esc(gsub(l.g))}</small>`}</button>`).join('');
  remeasure();
 }
 const place=(i,p,{delay=0}={})=>{const el=els[i];el.style.setProperty('--d',delay+'ms');el.style.zIndex=p.z;
  el.style.transform=`translate3d(${(p.x-BASE/2).toFixed(1)}px,${(p.y-BASE*0.698).toFixed(1)}px,0) rotate(${p.r.toFixed(2)}deg) scale(${p.s.toFixed(4)})`;};
 function apply({stagger=true}={}){
  // cards that travel furthest go a moment later, so the sort reads as a sweep across the table
  group();layout();
  const order=pos.map((p,i)=>i).sort((a,b)=>pos[a].y-pos[b].y||pos[a].x-pos[b].x);
  order.forEach((i,k)=>place(i,pos[i],{delay:stagger&&!motion.reduced?Math.min(k*9,520):0}));
  if(!motion.reduced){stage.classList.remove('hop');void stage.offsetWidth;stage.classList.add('hop');}
 }

 /* ---------------- the deal ---------------- */
 let dealt=false;
 function deal(){
  dealt=true;group();layout();
  const W=stage.clientWidth;
  if(!motion.reduced){
   stage.classList.add('instant');
   els.forEach((el,i)=>{el.style.transform=`translate3d(${(W/2-BASE/2+(hash(cards[i].id)-0.5)*6).toFixed(1)}px,${(-BASE*0.4-i*0.6).toFixed(1)}px,0) rotate(${((hash(cards[i].id)-0.5)*14).toFixed(1)}deg) scale(1.15)`;el.style.zIndex=i;});
   void stage.offsetWidth;stage.classList.remove('instant');
  }
  stage.classList.add('dealt');
  requestAnimationFrame(()=>{const order=pos.map((p,i)=>i).sort((a,b)=>pos[a].y-pos[b].y||pos[a].x-pos[b].x);order.forEach((i,k)=>place(i,pos[i],{delay:motion.reduced?0:80+k*16}));});
 }
 new IntersectionObserver(([e],io)=>{if(e.isIntersecting){io.disconnect();deal();}},{rootMargin:'0px 0px -22% 0px'}).observe(stage);
 // before the deal the mat already has the right height, so nothing below jumps
 group();layout();

 /* ---------------- picking a group up ---------------- */
 let held=null;
 const hh=$('#tb-hh');
 function openHand(list,{title,eyebrow,gi=null}){
  if(!dealt)return;
  held={list,gi,title};
  const vw=view.vw,vh=view.vh,phone=vw<=700,n=list.length,sr=stage.getBoundingClientRect();
  const rowsN=Math.ceil(n/(phone?6:8)),m=Math.ceil(n/rowsN);
  let hw=Math.min(phone?168:250,vh*0.58/(1.396*(1+(rowsN-1)*0.5)));
  const span=vw*(phone?0.84:0.92);let step=m>1?Math.min(hw*0.8,(span-hw)/(m-1)):0;
  if(m>1&&step<hw*0.32){hw=span/(1+(m-1)*0.32);step=hw*0.32;}
  const hh0=hw*1.396,cy0=vh*(phone?0.56:0.6)-(rowsN-1)*hh0*0.25;
  els.forEach(el=>el.classList.remove('held'));
  list.forEach((c,k)=>{const i=cards.indexOf(c),row=Math.floor(k/m),kk=k%m,mm=Math.min(m,n-row*m),mid=(mm-1)/2,d=kk-mid;
   const ang=mm>1?d*Math.min(6,32/(mm-1)):0;
   const x=vw/2+d*step-sr.left,y=cy0+row*hh0*0.5+d*d*hw*0.018-sr.top;
   els[i].classList.add('held');const im=els[i].querySelector('img');if(!im.dataset.big){im.dataset.big=1;const b=new Image();b.onload=()=>{im.src=b.src;};b.src=big(c);}
   place(i,{x,y,s:hw/BASE,r:ang,z:200+k},{delay:motion.reduced?0:k*26});});
  const pics=list.length&&gi!=null&&mode.id==='char'?picturesOf(list[0].char):null;
  hh.innerHTML=`<p class="eyebrow">${esc(eyebrow)}</p><p class="tb-hname" style="--hue:${hue(list[0])}">${esc(title)}</p><p class="tb-hsub">${esc(gsub({cards:list}))}</p>
   <div class="tb-hacts">${gi!=null&&groups.length>1?'<button class="tb-hbtn" data-hstep="-1" aria-label="Previous">‹</button><button class="tb-hbtn" data-hstep="1" aria-label="Next">›</button>':''}${gi==null?'<button class="pill small" data-redraw>Draw again</button>':''}${pics?`<button class="link" data-collection="${pics.key}">My pictures of ${esc(pics.name)} →</button>`:''}<button class="tb-hbtn tb-hx" data-hclose aria-label="Put them down">×</button></div>`;
  sec.classList.add('holding');hand.hidden=false;veil.hidden=false;document.documentElement.style.overflow='hidden';
  requestAnimationFrame(()=>{hand.classList.add('in');veil.classList.add('in');});
 }
 function closeHand(){
  if(!held)return;held=null;
  hand.classList.remove('in');veil.classList.remove('in');sec.classList.remove('holding');document.documentElement.style.overflow='';
  setTimeout(()=>{if(!held){hand.hidden=true;veil.hidden=true;}},450);
  const back=[...stage.querySelectorAll('.tg.held')];back.forEach(el=>el.classList.remove('held'));
  els.forEach((el,i)=>place(i,pos[i],{delay:0}));
 }
 const openGroup=gi=>{const g=groups[gi];if(!g)return;once('tcg:hand',2e6,'Picked up a hand');openHand(g.cards,{title:gname(g),eyebrow:`${mode.l} · ${gi+1} of ${groups.length}`,gi});};
 function draw(){
  // five at random, never two of the same character if it can help it
  const pool=[...cards].sort(()=>Math.random()-0.5),pick=[],who=new Set();
  for(const c of pool){if(pick.length===5)break;if(!who.has(c.char)){pick.push(c);who.add(c.char);}}
  pick.sort((a,b)=>rank(b)-rank(a));
  once('tcg:draw',2e6,'Drew an opening hand');
  if(held)els.forEach((el,i)=>{if(el.classList.contains('held'))place(i,pos[i]);});
  openHand(pick,{title:'Your hand',eyebrow:'Five cards, drawn at random'});
 }

 /* ---------------- touch ---------------- */
 stage.addEventListener('click',e=>{
  const lab=e.target.closest('[data-group]');if(lab){openGroup(+lab.dataset.group);return;}
  const b=e.target.closest('.tg');if(!b)return;const c=cards[+b.dataset.card];
  if(held){const k=held.list.indexOf(c);if(k>=0)inspect(held.list,k,{group:held.title,col:x=>picturesOf(x.char)});return;}
  const gi=groups.findIndex(g=>g.cards.includes(c)),g=groups[gi];
  if(mode.type==='piles'&&g.cards.length>1)openGroup(gi);
  else inspect(g.cards,g.cards.indexOf(c),{group:gname(g),col:x=>picturesOf(x.char)});
 });
 hand.addEventListener('click',e=>{
  if(e.target.closest('[data-hclose]'))closeHand();
  const s=e.target.closest('[data-hstep]');if(s&&held&&held.gi!=null){const gi=(held.gi+ +s.dataset.hstep+groups.length)%groups.length;els.forEach((el,i)=>{if(el.classList.contains('held')){el.classList.remove('held');place(i,pos[i]);}});openGroup(gi);}
  if(e.target.closest('[data-redraw]'))draw();
 });
 veil.addEventListener('click',closeHand);
 addEventListener('keydown',e=>{if(!held||document.querySelector('#dialog[open]'))return;if(e.key==='Escape'){e.preventDefault();closeHand();}if(held.gi!=null&&(e.key==='ArrowRight'||e.key==='ArrowLeft'))hand.querySelector(`[data-hstep="${e.key==='ArrowRight'?1:-1}"]`)?.click();});
 sortBox.addEventListener('click',e=>{const b=e.target.closest('[data-sort]');if(!b)return;const m=MODES.find(x=>x.id===b.dataset.sort);if(m===mode)return;
  closeHand();mode=m;try{localStorage.setItem(PREF,m.id);}catch{}
  sortBox.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  once('tcg:sort:'+m.id,1e6,`Sorted the cards by ${m.l.toLowerCase()}`);
  if(dealt)apply();else{group();layout();}});
 $('#tb-draw').addEventListener('click',()=>{if(!dealt)deal();setTimeout(draw,dealt?0:600);});
 if(!coarse)stage.addEventListener('pointermove',e=>{const b=e.target.closest('.tg');if(b)light(b.querySelector('.tgf'),e.clientX,e.clientY);});

 /* ---------------- how many you've held ---------------- */
 onSeen(s=>{const n=[...s].filter(id=>cards.some(c=>c.id===id)).length;
  meter.innerHTML=`<span class="tb-mbar"><i style="width:${(n/N*100).toFixed(1)}%"></i></span><span>${n===N?'<b>Every card</b> held up close':`<b>${n}</b> of ${N} held up close`}</span>`;});

 let lastW=0;addEventListener('resize',()=>{if(Math.abs(innerWidth-lastW)<2)return;lastW=innerWidth;if(held)closeHand();if(dealt)apply({stagger:false});else{group();layout();}});
 lastW=innerWidth;
}

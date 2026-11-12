// Grand Archive, the app (Nov 2026). Data, saved progress and "what is today" live here.
// It reads the same data/ and assets/ as the classic site (one folder up) and never writes to them.
export const ROOT='../';
export const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
export const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const TH=id=>`${ROOT}assets/img/t/${id}.webp`,FU=id=>`${ROOT}assets/img/f/${id}.webp`;
export const money=n=>Math.round(n).toLocaleString('en-US');
export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
export const reduced=()=>document.documentElement.classList.contains('calm');

/* ------------------------------------------------------------------ data */
export const data={};
const J=(u,tries=3)=>fetch(ROOT+u).then(r=>{if(!r.ok)throw r;return r.json();}).catch(()=>tries>1?new Promise(res=>setTimeout(res,400*(4-tries))).then(()=>J(u,tries-1)):null);
const FIELDS=['status','s','tagline','b','progress','chapter','genre'];
export async function loadData(){
 const keys=['media','characters','posters','shelf','route','strawhats','tcg','trivia','edits','collection'];
 (await Promise.all(keys.map(k=>J(`data/${k}.json`)))).forEach((v,i)=>data[keys[i]]=v);
 // the same overlay the classic site applies: his edits win while the note still says what it said then
 const sh=data.shelf,e=data.edits;
 if(sh&&e){
  for(const [key,x] of Object.entries(e.records||{})){const [k,...r]=key.split(':'),t=r.join(':'),rec=sh[k]?.find(a=>a.t===t);if(!rec)continue;
   for(const f of FIELDS)if(f in(x.set||{})){const base=(x.base||{})[f];if(base===undefined||String(rec[f]??'')===String(base??''))rec[f]=x.set[f];}}
  const t=e.top10,n=s=>String(s).toLowerCase();
  if(t&&Array.isArray(sh.top10)&&(!t.base||sh.top10.map(x=>n(x.title)).join('|')===t.base.map(n).join('|'))){
   const by=Object.fromEntries(sh.top10.map(x=>[n(x.title),x]));
   sh.top10=t.order.map(k=>by[n(k)]||{title:k,body:''}).map(x=>t.body&&t.body[x.title]?{...x,body:t.body[x.title]}:x);
  }
 }
 return data;
}
export const poster=(k,t)=>{const p=data.posters?.[`${k}:${t}`];return p?{...p,img:ROOT+p.img}:null;};
const norm=t=>String(t).toLowerCase().replace(/×/g,'x').replace(/[^a-z0-9]/g,'');
export const findRecord=title=>{const n=norm(title);if(!n)return null;const all=[...(data.shelf?.anime||[]),...(data.shelf?.manga||[]),...(data.shelf?.tv||[])];return all.find(a=>norm(a.t)===n)||all.find(a=>n.includes(norm(a.t))||norm(a.t).includes(n))||null;};

// every picture of the archive, as cards: same pool and the same fixed rarity per picture as the classic Treasure Room
let POOL=null;
export function pool(){
 if(POOL)return POOL;const m=data.media||{},out=[],seen=new Set();
 const add=(ids,col)=>{const list=(ids||[]).filter(id=>m.img?.[id]&&!seen.has(id));list.forEach((id,i)=>{seen.add(id);out.push({id,col,i:i+1,of:list.length});});};
 for(const c of m.characters||[])add(c.all,c.home);
 for(const c of m.crew||[])add(c.all,c.name);
 for(const c of m.supporting||[])add(c.all,c.name);
 for(const w of m.worlds||[])add(w.all,w.name);
 add(m.spreads?.all,'Colour spreads');add(m.wall,'Ohara Library');add(m.backgrounds?.all,'Sky and sea');
 if(out.length)POOL=out;return out;
}
export const collections=()=>{const by=new Map();for(const p of pool()){if(!by.has(p.col))by.set(p.col,[]);by.get(p.col).push(p);}return [...by.entries()].map(([name,cards])=>({name,cards}));};
const FIXED={'47b69db1012b':'conq','12b3e69a60d3':'m'};
export const rarity=id=>{if(FIXED[id])return FIXED[id];if((data.media?.collages||[]).some(x=>x.id===id))return 'mos';const v=parseInt(id.slice(-5),16)%1000;return v<30?'sec':v<34?'sun':v<42?'rm':v<60?'m':v<150?'sr':v<380?'r':'c';};
export const TIERS=['conq','sun','mos','rm','m','sec','sr','r','c'];
export const RNAME={c:'Common',r:'Rare',sr:'Super Rare',sec:'Secret',m:'Manga',rm:'Red Manga',mos:'Mosaic',sun:'Sun God',conq:'Conqueror'};
export const RWORTH={c:1e6,r:3e6,sr:8e6,sec:20e6,m:35e6,rm:60e6,mos:60e6,sun:120e6,conq:300e6};

/* ------------------------------------------------------------------ saved progress */
const KEY='grand-archive:next';
const blank=()=>({v:1,b:0,cards:{},packs:2,opened:0,streak:{n:0,last:null,best:0},days:{},name:'',best:{},seen:{},likes:{},q:{},fullDays:0,calm:null,imported:false});
export const S=(()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.v===1)return Object.assign(blank(),v);}catch{}return blank();})();
export const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S));}catch{}};
// first visit: carry over what was already earned in the classic archive (cards found, bounty, name)
if(!S.imported){S.imported=true;try{const o=JSON.parse(localStorage.getItem('grand-archive:bounty')||'null');if(o){Object.assign(S.cards,o.cards||{});S.b=Math.max(S.b,o.b||0);S.name=S.name||o.name||'';}}catch{}save();}
const subs=new Set();export const onChange=f=>{subs.add(f);return()=>subs.delete(f);};
export const changed=()=>{save();subs.forEach(f=>{try{f(S);}catch(e){console.error(e);}});};

const M=1e6;
export const TITLES=[[0,'Stowaway'],[1*M,'Cabin boy'],[30*M,'Rookie of East Blue'],[100*M,'Grand Line rookie'],[300*M,'Supernova'],[500*M,'Worst Generation'],[1500*M,'Fifth Emperor'],[3000*M,'Emperor of the Sea'],[5564800000,'King of the Archive']];
export const title=(b=S.b)=>{let t=TITLES[0];for(const x of TITLES)if(b>=x[0])t=x;return t;};
export const nextTitle=(b=S.b)=>TITLES.find(x=>x[0]>b)||null;

/* ------------------------------------------------------------------ today */
const two=n=>String(n).padStart(2,'0');
export const dayKey=(d=new Date())=>`${d.getFullYear()}-${two(d.getMonth()+1)}-${two(d.getDate())}`;
export const TODAY=dayKey();
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
export const rng=seed=>{let a=hash(String(seed));return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
export const pick=(arr,r=Math.random)=>arr[Math.floor(r()*arr.length)];
export const shuffle=(arr,r=Math.random)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export const day=()=>(S.days[TODAY]??={done:{}});
// the streak counts days on which you opened the app; missing a day starts it again
export function touchStreak(){
 const st=S.streak;if(st.last===TODAY)return false;
 const y=new Date();y.setDate(y.getDate()-1);st.n=st.last===dayKey(y)?st.n+1:1;st.last=TODAY;st.best=Math.max(st.best||0,st.n);
 S.packs+=1;// the daily pack
 // keep the saved days short: only the last 40
 const ks=Object.keys(S.days).sort();while(ks.length>40)delete S.days[ks.shift()];
 changed();return true;
}
// a story was opened (quests count them)
export const see=k=>{if(!S.seen[k]){S.seen[k]=Date.now();changed();}};
export function earn(n,why){S.b+=n;changed();toastFn?.(`+฿${money(n)}`,why);}
export function givePack(n,why){S.packs+=n;changed();toastFn?.(n===1?'+1 pack':`+${n} packs`,why);}
let toastFn=null;export const setToast=f=>{toastFn=f;};
// a part of today's edition is finished; finishing all of them pays a bonus pack
export const PARTS=['picture','character','words','moment','question','pack'];
export function finish(part){
 const d=day();if(d.done[part])return false;d.done[part]=Date.now();changed();
 if(PARTS.every(p=>d.done[p])&&!d.bonus){d.bonus=true;S.fullDays=(S.fullDays||0)+1;S.packs+=1;S.b+=5*M;changed();toastFn?.('Today is complete','+1 pack · +฿5,000,000');}
 return true;
}

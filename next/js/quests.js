// Quests: the long games. Each one watches numbers the app already keeps and pays packs once, when claimed.
import {S,data,pool,collections,rarity,TIERS,changed,money,esc} from './store.js';

const M=1e6,seen=p=>Object.keys(S.seen).filter(k=>k.startsWith(p)).length;
export function quests(){
 const P=pool(),got=P.filter(p=>S.cards[p.id]),run=Math.max(S.streak.best||0,S.streak.n||0);
 // the collection that is closest to complete
 const near=collections().map(c=>[c.cards.filter(p=>S.cards[p.id]).length,c.cards.length,c.name]).sort((a,b)=>b[0]/b[1]-a[0]/a[1])[0]||[0,1,''];
 const R=data.route,C=data.characters.characters.length;
 return [
  {id:'s3',t:'Three days running',d:'Open the archive three days in a row.',n:[run,3],packs:1},
  {id:'s7',t:'A full week',d:'Seven days in a row.',n:[run,7],packs:3},
  {id:'s30',t:'A month at sea',d:'Thirty days in a row.',n:[run,30],packs:10},
  {id:'full5',t:'Five full editions',d:'Finish all six parts of Today on five different days.',n:[S.fullDays||0,5],packs:3},
  {id:'p10',t:'Ten packs',d:'Open ten packs.',n:[S.opened,10],packs:2},
  {id:'p50',t:'Fifty packs',d:'Open fifty packs.',n:[S.opened,50],packs:5},
  {id:'c50',t:'Fifty cards',d:'Find fifty different cards.',n:[got.length,50],packs:2},
  {id:'c250',t:'A real binder',d:'Find 250 different cards.',n:[got.length,250],packs:5},
  {id:'c600',t:'Half the archive',d:'Find 600 different cards.',n:[got.length,600],packs:10},
  {id:'call',t:'Every card there is',d:'Find all of them.',n:[got.length,P.length],packs:0,b:1000*M},
  {id:'col1',t:'One whole collection',d:near[2]?`Closest right now: ${near[2]}.`:'Find every card of any one collection.',n:[near[0],near[1]],packs:3},
  {id:'sec',t:'Something secret',d:'Find a Secret card, or anything rarer.',n:[got.some(p=>TIERS.indexOf(rarity(p.id))<=TIERS.indexOf('sec'))?1:0,1],packs:1},
  {id:'chars',t:'Every character',d:'Open every character story.',n:[seen('char:'),C],packs:3},
  {id:'moments',t:'Every moment',d:'Open every moment.',n:[seen('moment:'),R.moments.length],packs:3},
  {id:'stops',t:'The whole journey',d:'Open every phase of the journey.',n:[seen('stop:'),R.stops.length],packs:2},
  {id:'serials',t:'Every cover story',d:'Watch every cover story to the end.',n:[seen('serial:'),(data.covers?.serials||[]).length||18],packs:5},
  {id:'games',t:'Three for three',d:'Win each of the three games at least once.',n:[(S.best.trivia>=6)+(S.best.hl>=5)+(S.best.who>=4),3],packs:2},
  {id:'perfect',t:'Eight out of eight',d:'A perfect round of quick trivia.',n:[S.best.trivia>=8?1:0,1],packs:2},
  {id:'likes',t:'Twenty favourites',d:'Heart twenty pictures.',n:[Object.keys(S.likes||{}).length,20],packs:1}
 ].map(q=>({...q,b:q.b??q.packs*5*M,done:q.n[0]>=q.n[1],claimed:!!S.q[q.id]}));
}
export const readyCount=()=>quests().filter(q=>q.done&&!q.claimed).length;
export function claim(id,toast){
 const q=quests().find(x=>x.id===id);if(!q||!q.done||q.claimed)return;
 S.q[id]=Date.now();S.packs+=q.packs;S.b+=q.b;changed();
 toast?.(q.t,`${q.packs?`+${q.packs} pack${q.packs===1?'':'s'} · `:''}+฿${money(q.b)}`);
}
export function questsHTML(){
 const all=quests(),order=q=>q.claimed?2:q.done?0:1,list=all.slice().sort((a,b)=>order(a)-order(b)||b.n[0]/b.n[1]-a.n[0]/a.n[1]),left=list.filter(q=>!q.claimed),done=all.length-left.length;
 return `<div class="qs-list">${left.map(q=>`<div class="qs${q.done?' ready':''}" data-rise><div class="qs-t"><b>${esc(q.t)}</b><span>${esc(q.d)}</span><span class="bar"><i style="--p:${Math.min(1,q.n[0]/q.n[1])}"></i></span></div><div class="qs-r">${q.done?`<button class="btn sm" data-claim="${q.id}">Claim</button>`:`<small>${Math.min(q.n[0],q.n[1]).toLocaleString('en-US')} / ${q.n[1].toLocaleString('en-US')}</small>`}<em>${q.packs?`${q.packs} pack${q.packs===1?'':'s'}`:`฿${money(q.b)}`}</em></div></div>`).join('')}</div>${done?`<p class="fine qs-done">${done} of ${all.length} quests claimed.</p>`:''}`;
}

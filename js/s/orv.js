// The Star Stream (Oct 30 2026): Omniscient Reader's Viewpoint, the webtoon he's reading. His panels run up
// a glowing system window by themselves, the way a webtoon reads (one CSS animation, only while it's on
// screen; hover or touch to hold it still), while system messages in the style of the story pop up around it.
// The last two are his: where he's up to, and his rating, from his Manga Tracker.
import {$,esc,FU,dims,data,onSight} from '../core.js';

export function initOrv(){
 const sec=$('#orv');if(!sec)return;
 const W=(data.media.worlds||[]).findIndex(w=>w.name==='Omniscient Reader'),w=data.media.worlds[W];
 if(!w||!w.all.length){sec.hidden=true;return;}
 const rec=(data.shelf?.manga||[]).find(r=>/omniscient/i.test(r.t))||{};
 const rating=(String(rec.b||'').match(/^([\d.]+)\/10,?\s*([^.]*)/)||[]);
 const strip=$('#orv-strip'),msgs=$('#orv-msgs');
 const one=w.all.map(id=>{const [a,b]=dims(id);return `<img src="${FU(id)}" width="${a}" height="${b}" alt="" loading="lazy" decoding="async">`;}).join('');
 // twice over, so it can run forever without a seam
 strip.innerHTML=`<div class="orv-run">${one}</div><div class="orv-run" aria-hidden="true">${one}</div>`;
 strip.style.setProperty('--dur',`${Math.round(w.all.length*7.5)}s`);
 const M=[
  ['The main scenario has begun.'],
  ['Main Scenario #1, Proof of Value.'],
  ['The constellation <b>Demon-like Judge of Fire</b> is watching you.'],
  ['The constellation <b>Secretive Plotter</b> is smiling.'],
  ['A constellation has sponsored you <b>100 coins</b>.'],
  ['The Fourth Wall is holding.'],
  [rec.chapter?`Reading progress saved: <b>${esc(rec.chapter.replace(/^Ch\.\s*/,'Chapter '))}</b>.`:'Reading progress saved.','mine'],
  [rating[1]?`Rating recorded: <b>${esc(rating[1])} / 10</b>${rating[2]?`. ${esc(rating[2].trim().replace(/^./,c=>c.toUpperCase()))}.`:'.'}`:'This reader’s story continues.','mine']
 ];
 msgs.innerHTML=M.map(([t,k],i)=>`<p class="orv-m${k?' '+k:''}" style="--i:${i}"><span>[${t}]</span></p>`).join('');
 sec.style.setProperty('--nm',M.length);
 $('#orv-now').innerHTML=`${rec.status==='reading'?'Reading now':'On my shelf'}${rec.chapter?` · ${esc(rec.chapter)}`:''}${rating[1]?` · <b>${esc(rating[1])}</b> / 10`:''}`;
 $('#orv-open').dataset.collection=`world:${W}`;$('#orv-dive').dataset.dive=`world:${W}`;
 // it only runs (and only loads its panels) once it comes near the screen
 onSight(sec,()=>strip.querySelectorAll('img').forEach(i=>i.loading='eager'),'0px 0px 150% 0px');
 new IntersectionObserver(([e])=>sec.classList.toggle('live',e.isIntersecting)).observe(sec);
}

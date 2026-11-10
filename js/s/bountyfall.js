// The morning paper (Nov 2026). In One Piece new bounties arrive from the sky: the News Coo drops the paper and the
// wanted posters flutter down onto the deck. Here every poster of the Crew section falls, one per stretch of scroll,
// tumbling in 3D until it lands on the ship's table; the pile grows, the camera backs away, and the price on their
// heads adds up. Tap a landed poster (or the caption) to open that collection. Motion Off keeps the old board.
import {$,data,part,pinned,view,motion,follower,clamp,smooth,ease,lerp,esc} from '../core.js';
import {BOUNTY} from './crew.js';

export function initBountyFall(){
 const sec=$('#nc'),plane=$('#nc-plane'),board=$('#board');if(!sec||!plane||!board)return;
 const crew=data.media?.crew||[],N=crew.length;if(!N||board.children.length!==N)return;
 const total=$('#nc-total'),tally=$('#nc-tally'),cap=$('#nc-cap');
 const rnd=n=>{const x=Math.sin(n*91.7+17.3)*43758.5453;return x-Math.floor(x);};
 const posters=[...board.children].map((n,i)=>{const el=n.cloneNode(true);el.classList.add('nc-p');el.removeAttribute('style');el.querySelectorAll('img').forEach(im=>im.loading='eager');plane.appendChild(el);return {el,i,c:crew[i],b:BOUNTY[crew[i].name.toLowerCase()]};});
 // the combined crew poster always lands last, in the middle
 const order=posters.map(p=>p.i).sort((a,b)=>(crew[a].name.toLowerCase()==='straw hats')-(crew[b].name.toLowerCase()==='straw hats'));
 const CW=1.3,CH=1.78,fitOf=(cols,rows,phone)=>Math.min(view.vw/(cols*PW*CW+60),view.vh/((rows*PW*CH+40)*(phone?1.34:1.1)));
 let PW,fit,spots=[];
 function layout(){
  const phone=view.vw<=820,cols=phone?3:5,rows=Math.ceil(N/cols);
  PW=phone?168:232;const cw=PW*CW,ch=PW*CH;
  plane.style.setProperty('--pw',PW+'px');
  // cells from the centre outwards, so the pile grows from the middle of the table
  const cells=[];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)cells.push({x:(c-(cols-1)/2)*cw,y:(r-(rows-1)/2)*ch,k:r*cols+c});
  cells.sort((a,b)=>Math.hypot(a.x,a.y*.8)+rnd(a.k)*40-(Math.hypot(b.x,b.y*.8)+rnd(b.k)*40));
  const last=cells.shift();cells.splice(N-1,0,last);
  spots=order.map((pi,n)=>{const c=cells[n];return {pi,x:c.x+(rnd(n*3)-.5)*cw*.22,y:c.y+(rnd(n*5+1)-.5)*ch*.14,r:(rnd(n*7+2)-.5)*(n===N-1?4:14),sx:(rnd(n+40)-.5)*2};});
  fit=fitOf(cols,rows,phone);
  posters.forEach(p=>{p.s=null;});
 }
 let shown=-1;
 function caption(n){
  if(n===shown)return;shown=n;
  const p=posters[spots[n].pi],c=p.c;
  cap.innerHTML=`<small>${String(n+1).padStart(2,'0')} / ${N} · the paper says</small><b>${esc(c.name)}</b><span>${esc(c.line||'')}</span><button class="nc-open" data-collection="crew:${p.i}">${c.all.length} picture${c.all.length===1?'':'s'} <i aria-hidden="true">→</i></button>`;
  cap.classList.remove('in');void cap.offsetWidth;cap.classList.add('in');
 }
 function render(u){
  // the first 6% is the empty table, the last 10% the whole pile
  const q=clamp((u-0.05)/0.83)*N,cur=Math.min(N-1,Math.floor(q)),end=smooth(clamp((u-0.9)/0.08));
  let sum=0,priced=0,hidden=0;
  spots.forEach((s,n)=>{
   const p=posters[s.pi],t=clamp((q-n)/0.62),e=ease(t);
   if(q<=n){if(p.s!=='w'){p.s='w';p.el.style.visibility='hidden';}return;}
   if(t>=1){
    if(p.b!=null&&p.c.name.toLowerCase()!=='straw hats'){sum+=p.b;priced++;}else if(p.b==null)hidden++;
    if(p.s==='d')return;p.s='d';p.el.style.visibility='visible';p.el.style.opacity=1;p.el.classList.add('down');
    p.el.style.transform=`translate3d(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px,${(n*.6).toFixed(1)}px) rotate(${s.r.toFixed(2)}deg) translate(-50%,-50%)`;return;
   }
   p.s='f';p.el.classList.remove('down');p.el.style.visibility='visible';
   const k=1-e,fl=Math.sin(t*9+n);
   p.el.style.opacity=smooth(clamp(t/0.12)).toFixed(3);
   p.el.style.transform=`translate3d(${(s.x+k*(s.sx*260+fl*90)).toFixed(1)}px,${(s.y-k*240).toFixed(1)}px,${(k*820+n*.6).toFixed(1)}px) rotateX(${(k*fl*46).toFixed(2)}deg) rotateY(${(k*Math.cos(t*7+n)*58).toFixed(2)}deg) rotate(${(s.r+k*s.sx*150).toFixed(2)}deg) translate(-50%,-50%)`;
  });
  // the camera leans toward the poster that is landing, and backs away as the table fills
  const a=spots[cur],b=spots[Math.min(N-1,cur+1)],m=smooth(clamp((q-cur-0.7)/0.3));
  const fx=lerp(a.x,b.x,m),fy=lerp(a.y,b.y,m),grow=smooth(clamp(q/N));
  const near=view.vw<=820?1.25:1.3,sc=lerp(lerp(near,Math.max(fit*1.25,.7),grow),fit,end),fol=lerp(.72,.3,grow)*(1-end);
  plane.style.transform=`scale(${sc.toFixed(4)}) translate3d(${(-fx*fol).toFixed(1)}px,${(-fy*fol).toFixed(1)}px,0)`;
  const txt='฿'+sum.toLocaleString('en-US');if(total._t!==txt){total._t=txt;total.textContent=txt;}
  const tl=`${priced} priced${hidden?` · ${hidden} the World Government won't name`:''}`;if(tally._t!==tl){tally._t=tl;tally.textContent=tl;}
  if(u>0.045)caption(cur);
  sec.classList.toggle('lit',u>0.045);sec.classList.toggle('all',end>0.5);
 }
 layout();
 const f=follower(120);
 part({el:sec,measure(){const k=view.vw<=820?'p':'d';if(sec.dataset.k!==k){sec.dataset.k=k;layout();}else{const cols=k==='p'?3:5,rows=Math.ceil(N/cols);fit=fitOf(cols,rows,k==='p');}},update(s){if(motion.reduced)return;f.target=pinned(this,s);if(f.v!==null&&Math.abs(f.target-f.v)>0.3)f.v=f.target;render(f.step(view.t));}});
}

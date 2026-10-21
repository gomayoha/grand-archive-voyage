// Archive themes (Oct 22 2026): he asked that a Devil Fruit (or a card) could change the whole site, its
// colours and its text. A theme repaints the archive's accent (every eyebrow, link, bar mark and toast), turns
// the italic words of every heading into the fruit's colours, and lights the edges of the screen with it,
// each in its own way (Yami's darkness creeping in, Pika's light from above, Hie's frost, Magu's glow from
// below…). By default the theme follows the fruit in your stomach; rare cards (Manga, Red Manga, Sun God,
// Conqueror) unlock themes of their own in the Treasure Room. One fixed layer, no blending, nothing moves:
// it costs nothing while scrolling.
import {B,save} from './bounty.js';

// a: accent, b: second colour, e: the light at the edges
export const THEMES={
 mera:{name:'Mera Mera',a:'#ff7a2f',b:'#ffd23f',e:'#ff5a1a',k:'below'},
 pika:{name:'Pika Pika',a:'#ffe45c',b:'#fff7c2',e:'#ffe45c',k:'above'},
 goro:{name:'Goro Goro',a:'#7fd0ff',b:'#ffffff',e:'#4fb6ff',k:'above'},
 moku:{name:'Moku Moku',a:'#d6d9de',b:'#ffffff',e:'#a8adb5',k:'edges'},
 hie:{name:'Hie Hie',a:'#a9e6ff',b:'#ffffff',e:'#bfeaff',k:'frost'},
 bomu:{name:'Bomu Bomu',a:'#ff8a3d',b:'#ffe08a',e:'#ff6a1a',k:'below'},
 mero:{name:'Mero Mero',a:'#ff6fb1',b:'#ffd6ea',e:'#ff4f9e',k:'edges'},
 ope:{name:'Ope Ope',a:'#6fb4ff',b:'#d6ebff',e:'#3f8fff',k:'room'},
 suna:{name:'Suna Suna',a:'#e3b46a',b:'#f6e2b3',e:'#c98f3a',k:'below'},
 horo:{name:'Horo Horo',a:'#efe4ff',b:'#ff9cc4',e:'#cdb8ff',k:'edges'},
 bara:{name:'Bara Bara',a:'#ff5a76',b:'#ffd1d9',e:'#ff3d63',k:'edges'},
 ito:{name:'Ito Ito',a:'#ff6fae',b:'#ffffff',e:'#ff4f9a',k:'above'},
 nikyu:{name:'Nikyu Nikyu',a:'#ffb3c7',b:'#fff0f4',e:'#ff8fb0',k:'edges'},
 yami:{name:'Yami Yami',a:'#a98bff',b:'#5a3cc8',e:'#2a1060',k:'dark'},
 kage:{name:'Kage Kage',a:'#9c8cc4',b:'#4d3f73',e:'#1a1426',k:'dark'},
 magu:{name:'Magu Magu',a:'#ff4a24',b:'#ffb24a',e:'#ff2a0a',k:'below'},
 zushi:{name:'Zushi Zushi',a:'#9d92ff',b:'#e0dcff',e:'#6c5cff',k:'above'},
 gura:{name:'Gura Gura',a:'#e8f4ff',b:'#9fd0ff',e:'#cfe6ff',k:'edges'},
 hana:{name:'Hana Hana',a:'#ff9ccc',b:'#c8a2ff',e:'#ff7ab8',k:'bloom'},
 // the rare cards
 m:{name:'Manga',a:'#ffffff',b:'#9a9a9a',e:'#ffffff',k:'tone',card:'m'},
 rm:{name:'Red Manga',a:'#ff3b47',b:'#ffd27a',e:'#c8101e',k:'tone',card:'rm'},
 sun:{name:'Sun God',a:'#ffffff',b:'#d7c2ff',e:'#efe4ff',k:'clouds',card:'sun'},
 conq:{name:'Conqueror',a:'#ff2a3a',b:'#ffb3b8',e:'#b0000f',k:'haki',card:'conq'}
};
// what's on now: 'auto' follows the fruit you ate, 'none' is the archive's own gold
export const themeNow=()=>{const t=B.theme||'auto';if(t==='auto')return B.eat&&THEMES[B.eat]?B.eat:null;return THEMES[t]?t:null;};
let veil=null;
export function refreshTheme(){
 const id=themeNow(),h=document.documentElement;
 if(!id){delete h.dataset.theme;['--t-a','--t-b','--t-e'].forEach(v=>h.style.removeProperty(v));veil?.classList.remove('on');return;}
 const t=THEMES[id];h.dataset.theme=id;h.style.setProperty('--t-a',t.a);h.style.setProperty('--t-b',t.b);h.style.setProperty('--t-e',t.e);
 if(!veil){veil=document.createElement('div');veil.className='th-veil';veil.setAttribute('aria-hidden','true');document.body.appendChild(veil);}
 veil.dataset.k=t.k;requestAnimationFrame(()=>veil.classList.add('on'));
}
export function setTheme(id){B.theme=id;save();refreshTheme();}

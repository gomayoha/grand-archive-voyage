// Book II lives in an encrypted vault (assets/vault, AES-256-GCM; key from PBKDF2 of the magic words).
// The words are never stored; once unlocked, this device remembers the derived key.
// Fallback: on the home-Wi-Fi preview (plain http, no WebCrypto) the Mac's private/ copy is used.
import {$,motion} from './core.js';

const VKEY_STORE='grand-archive:vault-key';
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export const CRYPTO=!!(window.crypto&&crypto.subtle);
export const vault={VAULT:null,LIFE:null,MODE:false};
let VKEY=null;const VF={};

async function vdecrypt(file,key=VKEY){const b=await fetch('assets/vault/'+file,{cache:file==='manifest.bin'?'no-store':'default'}).then(r=>{if(!r.ok)throw new Error('vault file missing');return r.arrayBuffer();});return crypto.subtle.decrypt({name:'AES-GCM',iv:b.slice(0,12)},key,b.slice(12));}
async function deriveKey(words){const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(words.trim()),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt:b64(vault.VAULT.salt),iterations:vault.VAULT.iter,hash:'SHA-256'},base,{name:'AES-GCM',length:256},true,['decrypt']);}
const openVault=async key=>JSON.parse(new TextDecoder().decode(await vdecrypt('manifest.bin',key)));

export async function loadVault(){
 vault.VAULT=await fetch('data/vault.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);
 if(vault.VAULT&&CRYPTO){try{const raw=localStorage.getItem(VKEY_STORE);if(raw){VKEY=await crypto.subtle.importKey('raw',b64(raw),'AES-GCM',false,['decrypt']);vault.LIFE=await openVault(VKEY);}}catch{VKEY=null;vault.LIFE=null;try{localStorage.removeItem(VKEY_STORE);}catch{}}}
 if(!vault.LIFE&&!CRYPTO&&!/github\.io$/i.test(location.hostname))vault.LIFE=await fetch('private/life.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);
 vault.MODE=!!(vault.LIFE&&VKEY);
 if(vault.MODE)vault.LIFE.chapters.forEach(c=>c.photos.forEach(p=>VF[p.id]=p));
 return vault;
}

// At most 6 vault downloads at once (a gallery can ask for ~80), with retries; failures aren't cached.
const vcache=new Map();let vActive=0;const vQueue=[];
const vRun=()=>{while(vActive<6&&vQueue.length){const job=vQueue.shift();vActive++;job().finally(()=>{vActive--;vRun();});}};
const vLimited=fn=>new Promise((res,rej)=>{vQueue.push(()=>fn().then(res,rej));vRun();});
const vFetch=async(file,tries=3)=>{try{return await vLimited(()=>vdecrypt(file));}catch(e){if(tries>1){await new Promise(r=>setTimeout(r,600));return vFetch(file,tries-1);}throw e;}};
const vurl=file=>{if(!vcache.has(file)){const p=vFetch(file).then(b=>URL.createObjectURL(new Blob([b],{type:'image/webp'})));p.catch(()=>vcache.delete(file));vcache.set(file,p);}return vcache.get(file);};
export const LF=id=>vault.MODE?vurl(VF[id].f):`private/built/f/${id}.webp`;
export const LT=id=>vault.MODE?vurl(VF[id].t):`private/built/t/${id}.webp`;
export const setSrc=(img,u)=>{if(u&&u.then)u.then(x=>{img.src=x;},()=>{});else img.src=u;};

/* ---------------------------------------------------------------- the magic words */
export function initGate(){
 const gate=$('#gate'),gForm=$('#gate-form'),gIn=$('#gate-input'),gMsg=$('#gate-msg'),gGo=$('#gate-go');
 const MISSES=["That's not it.","The sea didn't answer.","Not quite. Think like the crew.","The door stays shut.","Close your eyes. Try again."];let misses=0,gateLast=null;
 if(vault.VAULT&&!vault.MODE&&CRYPTO)document.querySelectorAll('.gate-link').forEach(b=>b.hidden=false);
 function openGate(){if(!vault.VAULT)return;gateLast=document.activeElement;gate.hidden=false;gate.classList.remove('open','granted','wrong');void gate.offsetWidth;gate.classList.add('open');document.documentElement.style.overflow='hidden';gMsg.textContent=CRYPTO?'':'Open the site through its https:// link to use the magic words.';setTimeout(()=>gIn.focus(),350);}
 function closeGate(){gate.classList.remove('open');document.documentElement.style.overflow='';setTimeout(()=>{gate.hidden=true;gIn.value='';gMsg.textContent='';},500);gateLast?.focus?.();}
 $('#gate-close').addEventListener('click',closeGate);
 gate.addEventListener('keydown',e=>{if(e.key==='Escape')closeGate();});
 gForm.addEventListener('submit',async e=>{e.preventDefault();if(!CRYPTO||!gIn.value.trim())return;
  gGo.disabled=true;gMsg.textContent='Listening…';gate.classList.remove('wrong');
  try{const key=await deriveKey(gIn.value);await openVault(key);
   const raw=new Uint8Array(await crypto.subtle.exportKey('raw',key));let bin='';raw.forEach(b=>bin+=String.fromCharCode(b));
   try{localStorage.setItem(VKEY_STORE,btoa(bin));}catch{}
   try{sessionStorage.setItem('grand-archive:cross','1');}catch{}
   gMsg.textContent='';gate.classList.add('granted');setTimeout(()=>location.reload(),motion.reduced?300:2300);
  }catch{gGo.disabled=false;gMsg.textContent=MISSES[misses++%MISSES.length];void gate.offsetWidth;gate.classList.add('wrong');gIn.select();}
 });
 document.addEventListener('click',e=>{if(e.target.closest('[data-gate]')){e.preventDefault();openGate();}});
 $('#life-lock')?.addEventListener('click',()=>{try{localStorage.removeItem(VKEY_STORE);}catch{}location.reload();});
}

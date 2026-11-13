// The lock (Nov 2026). He asked for the app to be private: it shows nothing until the magic words are given, once per
// device. The words are the same ones that open Book II; they are never stored and never appear in any file here.
// How it checks: the words are stretched into a key (PBKDF2, the salt and rounds in data/vault.json) and the key's
// fingerprint is compared with the one sync.py wrote there. The key is then remembered on this device under the same
// name the classic site uses, so a device that has opened Book II is already unlocked, and the other way round.
// What it is not: the files of the site still sit on a public address, so someone who knew a picture's exact address
// could fetch it. Truly personal things (Book II) stay encrypted; this lock keeps the app itself closed.
import {ROOT} from './store.js';

const STORE='grand-archive:vault-key';
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0)),hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const local=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const fingerprint=async raw=>hex(await crypto.subtle.digest('SHA-256',raw)).slice(0,16);
async function derive(words,V){
 const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(words.trim()),'PBKDF2',false,['deriveBits']);
 return crypto.subtle.deriveBits({name:'PBKDF2',salt:b64(V.salt),iterations:V.iter,hash:'SHA-256'},base,256);
}
export async function unlock(){
 // on the Mac's own preview a test lock can stand in (?vault=file.json), so the real words are never needed for testing
 const test=local&&new URLSearchParams(location.search).get('vault');
 const V=await fetch(test||ROOT+'data/vault.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);
 if(!V||!V.check)return true;                       // no lock has been set up
 if(!(window.crypto&&crypto.subtle))return local;   // plain http on the home network: only the Mac itself gets in
 try{const raw=localStorage.getItem(STORE);if(raw&&!test&&await fingerprint(b64(raw))===V.check)return true;}catch{}
 return new Promise(done=>{
  const el=document.createElement('div');el.className='gate';
  el.innerHTML=`<form class="gate-in" autocomplete="off"><img src="${ROOT}assets/img/ui/icon-o4-192.png" alt="" width="84" height="84"><h1>Grand Archive</h1><p class="gate-p">This archive is private. Say the magic words.</p>
   <input type="password" id="gate-w" placeholder="Magic words" aria-label="Magic words" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go">
   <button class="btn" type="submit">Open</button><p class="gate-m" id="gate-m" aria-live="polite"></p></form>`;
  document.body.appendChild(el);document.getElementById('splash')?.classList.add('gone');
  const inp=el.querySelector('#gate-w'),msg=el.querySelector('#gate-m'),btn=el.querySelector('button');let busy=false,miss=0;
  const MISS=['That is not it.','The door stays shut.','Not quite. Try again.'];
  el.querySelector('form').addEventListener('submit',async e=>{
   e.preventDefault();if(busy||!inp.value.trim())return;busy=true;btn.textContent='Opening…';msg.textContent='';
   try{
    const bits=await derive(inp.value,V);
    if(await fingerprint(bits)===V.check){
     if(!test)try{localStorage.setItem(STORE,btoa(String.fromCharCode(...new Uint8Array(bits))));}catch{}
     el.classList.add('open');setTimeout(()=>{el.remove();},700);done(true);return;
    }
   }catch{}
   busy=false;btn.textContent='Open';msg.textContent=MISS[miss++%MISS.length];inp.select();
   el.querySelector('.gate-in').animate([{transform:'translateX(0)'},{transform:'translateX(-10px)'},{transform:'translateX(9px)'},{transform:'translateX(-6px)'},{transform:'translateX(0)'}],{duration:380});
  });
  setTimeout(()=>inp.focus({preventScroll:true}),300);
 });
}
// lock this device again (Me > Settings)
export const lockAgain=()=>{try{localStorage.removeItem(STORE);}catch{}location.reload();};

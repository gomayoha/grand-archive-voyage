// A backup of your progress (Oct 30 2026). Everything the archive remembers lives in this browser only (the bounty,
// cards, fruits, gold, poneglyphs, trivia levels, the cards you've held), so he asked for a way to keep it safe:
// save it to a small file, and load that file back on any device. The GitHub token and anything about Book II's
// lock are never written into the file.
const SKIP=/token|vault|life|magic|gate/i;
const keys=()=>{const out=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('grand-archive')&&!SKIP.test(k))out.push(k);}return out.sort();};
export function backupInfo(){let n=0,cards=0;try{n=keys().length;cards=Object.keys(JSON.parse(localStorage.getItem('grand-archive:bounty')||'{}').cards||{}).length;}catch{}let last=null;try{last=localStorage.getItem('grand-archive-backup:last');}catch{}return{n,cards,last};}
export function saveBackup(){
 const data={};keys().forEach(k=>{data[k]=localStorage.getItem(k);});
 const file={archive:'Grand Archive',kind:'progress backup',v:1,saved:new Date().toISOString(),data};
 const blob=new Blob([JSON.stringify(file)],{type:'application/json'}),a=document.createElement('a');
 a.href=URL.createObjectURL(blob);a.download=`grand-archive-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();
 setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500);
 try{localStorage.setItem('grand-archive-backup:last',file.saved);}catch{}
}
// reads a backup file and puts it back; returns how many things were restored (the page reloads after)
export async function loadBackup(f){
 const txt=await f.text();let file;try{file=JSON.parse(txt);}catch{throw new Error('That file isn’t a Grand Archive backup.');}
 if(!file||file.archive!=='Grand Archive'||!file.data)throw new Error('That file isn’t a Grand Archive backup.');
 let n=0;for(const [k,v] of Object.entries(file.data)){if(!k.startsWith('grand-archive')||SKIP.test(k)||typeof v!=='string')continue;localStorage.setItem(k,v);n++;}
 return{n,saved:file.saved};
}

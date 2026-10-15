// Tilt to look around: on a phone there's no mouse, so the 3D scenes (the first screen's wall, the Straw
// Hat deck, the night sky, the Dive-in tunnel) follow the way you hold the phone instead. iPhone asks for
// permission once, from a tap, so it lives behind a switch in the Log Pose; the choice is remembered.
// Values are relative to how the phone was held when it was switched on, smoothed, in −1…1.
const KEY='grand-archive:tilt';
export const tilt={on:false,x:0,y:0};
const subs=new Set();
export const onTilt=fn=>{subs.add(fn);return()=>subs.delete(fn);};
let base=null,raf=0,rx=0,ry=0;
const clamp=v=>Math.max(-1,Math.min(1,v));
function handle(e){
 if(e.beta==null||e.gamma==null)return;
 if(!base)base={b:e.beta,g:e.gamma};
 rx=clamp((e.gamma-base.g)/22);ry=clamp((e.beta-base.b)/22);
 if(!raf)raf=requestAnimationFrame(()=>{raf=0;tilt.x+=(rx-tilt.x)*0.35;tilt.y+=(ry-tilt.y)*0.35;subs.forEach(f=>f(tilt));});
}
function start(){if(tilt.on)return;tilt.on=true;base=null;addEventListener('deviceorientation',handle);}
function stop(){tilt.on=false;removeEventListener('deviceorientation',handle);tilt.x=tilt.y=0;subs.forEach(f=>f(tilt));}
export const tiltSupported=()=>'DeviceOrientationEvent' in window&&matchMedia('(pointer: coarse)').matches;
export async function setTilt(want){
 if(!want){stop();try{localStorage.setItem(KEY,'0');}catch{}return false;}
 try{const P=window.DeviceOrientationEvent;if(P&&typeof P.requestPermission==='function'&&(await P.requestPermission())!=='granted')return false;}catch{return false;}
 start();try{localStorage.setItem(KEY,'1');}catch{}return true;
}
// iPhone forgets the permission between visits, so a remembered "on" only resumes where no prompt is needed
export function resumeTilt(){let want=false;try{want=localStorage.getItem(KEY)==='1';}catch{}
 if(!want||!tiltSupported())return false;
 if(typeof window.DeviceOrientationEvent?.requestPermission!=='function'){start();return true;}
 // iPhone: ask again on the first tap of the visit (already-granted asks don't show a prompt)
 document.addEventListener('click',()=>setTilt(true).then(ok=>ok&&subs.forEach(f=>f(tilt))),{once:true});return true;}
// re-centre on the current pose (e.g. after lying down)
export const recentre=()=>{base=null;};

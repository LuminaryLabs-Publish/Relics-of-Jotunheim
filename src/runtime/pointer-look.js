// Browser input owner. Pointer-lock request must run synchronously in a real user gesture.
export function installPointerLook({canvas,documentRef,windowRef,onOrbit,onRelease,onStatus}){
 if(!canvas||!documentRef||!windowRef)throw new TypeError('Pointer controller requires canvas, document and window');
 const doc=documentRef,win=windowRef;
 let locked=false,dragging=false,x=0,y=0,error='';
 const removers=[];
 function on(target,name,fn,opts){target.addEventListener(name,fn,opts);removers.push(()=>target.removeEventListener(name,fn,opts));}
 function status(){onStatus?.({locked,dragging,error,message:locked?'Mouse captured · Esc to release':(error||'Click gameplay to capture mouse · Esc releases · Right-drag fallback')});}
 function release(){dragging=false;onRelease?.();}
 function request(){
  if(doc.pointerLockElement===canvas)return;
  try{
   if(typeof canvas.requestPointerLock!=='function'){error='Mouse capture unavailable. Right-drag to look.';status();return;}
   const result=canvas.requestPointerLock();
   result?.catch?.(()=>{error='Mouse capture denied. Right-drag to look.';status();});
  }catch{
   error='Mouse capture unavailable. Right-drag to look.';status();
  }
 }
 function exit(){if(doc.pointerLockElement===canvas)doc.exitPointerLock?.();}
 on(doc,'pointerlockchange',()=>{
  const previous=locked;
  locked=doc.pointerLockElement===canvas;
  if(locked)error='';else if(previous)release();
  dragging=false;
  canvas.style.cursor=locked?'none':'auto';status();
 });
 on(doc,'pointerlockerror',()=>{error='Mouse capture unavailable. Right-drag to look.';status();});
 on(doc,'mousemove',e=>{if(locked)onOrbit?.(e.movementX||0,e.movementY||0);});
 on(win,'keydown',e=>{
  if(e.key?.toLowerCase()==='l'&&!e.repeat){e.preventDefault?.();locked?exit():request();}
  if(e.key==='Escape'&&locked)exit();
 });
 on(win,'blur',()=>{release();exit();});
 on(doc,'visibilitychange',()=>{if(doc.hidden){release();exit();}});
 on(canvas,'click',e=>{if(e.button===0&&!locked)request();});
 on(canvas,'contextmenu',e=>e.preventDefault?.());
 on(canvas,'pointerdown',e=>{
  if(e.button!==2||locked)return;
  e.preventDefault?.();dragging=true;x=e.clientX;y=e.clientY;
  try{canvas.setPointerCapture?.(e.pointerId);}catch{}
 });
 on(canvas,'pointermove',e=>{
  if(!dragging||locked)return;
  if(!(e.buttons&2)){dragging=false;return;}
  onOrbit?.(e.clientX-x,e.clientY-y);x=e.clientX;y=e.clientY;
 });
 on(canvas,'pointerup',e=>{if(e.button===2)dragging=false;});
 on(canvas,'pointercancel',()=>{dragging=false;});
 on(canvas,'lostpointercapture',()=>{dragging=false;});
 status();
 return {get locked(){return locked;},get dragging(){return dragging;},request,exit,
  dispose(){exit();release();for(const remove of removers)remove();}}
}

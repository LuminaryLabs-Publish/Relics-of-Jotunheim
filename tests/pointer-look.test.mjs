import test from 'node:test';
import assert from 'node:assert/strict';
import {installPointerLook} from '../src/runtime/pointer-look.js';
class FakeTarget{
 constructor(){this.listeners=new Map();this.style={};}
 addEventListener(key,fn){const arr=this.listeners.get(key)??[];arr.push(fn);this.listeners.set(key,arr);}
 removeEventListener(key,fn){this.listeners.set(key,(this.listeners.get(key)??[]).filter(x=>x!==fn));}
 emit(key,event={}){for(const fn of this.listeners.get(key)??[])fn(event);}
}
function fixture(){
 const doc=new FakeTarget(),win=new FakeTarget(),canvas=new FakeTarget();
 let releases=0,requests=0;const moves=[],states=[];
 canvas.requestPointerLock=()=>{requests++;doc.pointerLockElement=canvas;doc.emit('pointerlockchange');return Promise.resolve();};
 doc.exitPointerLock=()=>{doc.pointerLockElement=null;doc.emit('pointerlockchange');};
 const pointer=installPointerLook({canvas,documentRef:doc,windowRef:win,
  onOrbit:(x,y)=>moves.push([x,y]),onRelease:()=>releases++,onStatus:s=>states.push(s)});
 return {doc,win,canvas,pointer,moves,states,get releases(){return releases;},get requests(){return requests;}};
}
test('left click captures cursor inside synchronous gesture',()=>{
 const x=fixture();x.canvas.emit('click',{button:0});
 assert.equal(x.requests,1);assert.equal(x.pointer.locked,true);assert.equal(x.canvas.style.cursor,'none');
 x.doc.emit('mousemove',{movementX:12,movementY:-3});
 assert.deepEqual(x.moves,[[12,-3]]);
 x.pointer.dispose();
});
test('Escape release restores cursor and clears held movement',()=>{
 const x=fixture();x.canvas.emit('click',{button:0});
 x.win.emit('keydown',{key:'Escape'});
 assert.equal(x.pointer.locked,false);assert.equal(x.canvas.style.cursor,'auto');
 assert.ok(x.releases>=1);assert.match(x.states.at(-1).message,/Click gameplay/);
 x.pointer.dispose();
});
test('L captures directly from keydown, not requestAnimationFrame',()=>{
 const x=fixture();x.win.emit('keydown',{key:'l',repeat:false,preventDefault(){}});
 assert.equal(x.requests,1);assert.equal(x.pointer.locked,true);
 x.win.emit('keydown',{key:'l',repeat:false,preventDefault(){}});
 assert.equal(x.pointer.locked,false);
 x.pointer.dispose();
});
test('right drag keeps fallback when lock is not active',()=>{
 const x=fixture();x.canvas.emit('pointerdown',{button:2,clientX:10,clientY:10,pointerId:1,preventDefault(){}});
 x.canvas.emit('pointermove',{buttons:2,clientX:18,clientY:6});
 assert.deepEqual(x.moves,[[8,-4]]);
 x.canvas.emit('pointerup',{button:2});
 assert.equal(x.pointer.dragging,false);x.pointer.dispose();
});
test('rejected and absent lock API preserve right-drag fallback',async()=>{
 const x=fixture();x.canvas.requestPointerLock=()=>Promise.reject(new Error('Denied'));
 x.canvas.emit('click',{button:0});await Promise.resolve();
 assert.match(x.states.at(-1).message,/denied/);
 delete x.canvas.requestPointerLock;
 x.canvas.emit('click',{button:0});
 assert.match(x.states.at(-1).message,/unavailable/);
 x.pointer.dispose();
});
test('legacy pointerLock returning undefined is not treated as an error',()=>{
 const x=fixture();x.canvas.requestPointerLock=()=>{x.doc.pointerLockElement=x.canvas;x.doc.emit('pointerlockchange');};
 x.canvas.emit('click',{button:0});assert.equal(x.pointer.locked,true);
 assert.equal(x.states.at(-1).error,'');x.pointer.dispose();
});
test('tab blur exits pointer and releases movement',()=>{
 const x=fixture();x.canvas.emit('click',{button:0});
 x.win.emit('blur');assert.equal(x.pointer.locked,false);assert.ok(x.releases>=1);
 x.pointer.dispose();
});
test('pointer capture and release can be repeated',()=>{
 const x=fixture();for(let i=0;i<7;i++){x.canvas.emit('click',{button:0});assert.equal(x.pointer.locked,true);x.win.emit('keydown',{key:'Escape'});assert.equal(x.pointer.locked,false);}
 assert.equal(x.requests,7);x.pointer.dispose();
});

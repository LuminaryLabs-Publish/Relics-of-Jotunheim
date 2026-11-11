import test from 'node:test';
import assert from 'node:assert/strict';
import {ANATOMY,anatomicalRig,anatomicalWeights,createAnatomicalSurface,toAuthoringMesh} from '../src/animation/anatomical-surface.js';
const surface=createAnatomicalSurface();
const count=surface.positions.length/3;

test('body is one closed, consistently oriented welded surface',()=>{
 const edges=new Map(),adj=Array.from({length:count},()=>[]);
 for(let i=0;i<surface.indices.length;i+=3){
  const f=surface.indices.slice(i,i+3);assert.equal(new Set(f).size,3);
  for(let j=0;j<3;j++){
   const a=f[j],b=f[(j+1)%3];assert.ok(a>=0&&b<count);
   const key=Math.min(a,b)*count+Math.max(a,b),uses=edges.get(key)||[];
   uses.push([a,b]);edges.set(key,uses);adj[a].push(b);adj[b].push(a);
  }
 }
 for(const uses of edges.values()){
  assert.equal(uses.length,2,'No open or nonmanifold edges');
  assert.equal(uses[0][0],uses[1][1],'Adjacent triangles must have opposite edge directions');
 }
 const visited=new Set([0]),pending=[0];
 while(pending.length)for(const b of adj[pending.pop()])if(!visited.has(b)){visited.add(b);pending.push(b);}
 assert.equal(visited.size,count,'No detached shoulder, head, hand or foot shells');
 assert.equal(count-edges.size+surface.indices.length/3,2,'Closed genus-zero body');
});
test('surface has finite unit normals and nonzero outward triangle volume',()=>{
 for(const array of [surface.positions,surface.normals,surface.colors,surface.skinWeights])assert.ok(array.every(Number.isFinite));
 for(let i=0;i<surface.normals.length;i+=3)assert.ok(Math.abs(Math.hypot(...surface.normals.slice(i,i+3))-1)<1e-6);
 let volume=0;
 for(let i=0;i<surface.indices.length;i+=3){
  const [a,b,c]=surface.indices.slice(i,i+3).map(j=>surface.positions.slice(j*3,j*3+3));
  const u=b.map((v,j)=>v-a[j]),v=c.map((w,j)=>w-a[j]);
  const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  assert.ok(Math.hypot(...n)>1e-12,'No zero-area triangles');
  volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
 }
 assert.ok(volume>0,'Outside-facing winding');
});
test('proportions use the adult-style target rather than the oversized-head blockout',()=>{
 const y=surface.positions.filter((_,i)=>i%3===1),x=surface.positions.filter((_,i)=>i%3===0);
 const height=Math.max(...y)-Math.min(...y);
 assert.ok(height/ANATOMY.headHeight>7&&height/ANATOMY.headHeight<7.5);
 assert.ok(Math.min(...y)>=-.005&&Math.min(...y)<.015);
 assert.ok(Math.abs(Math.min(...x)+Math.max(...x))<1e-6);
 assert.ok(count<45000&&surface.indices.length/3<90000,'Bounded game geometry');
});
test('all vertices have four-or-fewer normalized influences in the preserved 22-joint contract',()=>{
 assert.equal(surface.bones.length,22);
 for(let i=0;i<count;i++){
  let sum=0;
  for(let j=0;j<4;j++){
   const b=surface.skinIndices[i*4+j],w=surface.skinWeights[i*4+j];
   assert.ok(Number.isInteger(b)&&b>=0&&b<surface.bones.length&&w>=0&&w<=1);sum+=w;
  }
  assert.ok(Math.abs(sum-1)<1e-8);
 }
 const l=anatomicalWeights(.425,.89,-.01),r=anatomicalWeights(-.425,.89,-.01);
 assert.equal(l[0][0],'l_hand');assert.equal(r[0][0],'r_hand');
});
test('cloth coloring never leaks onto wrists or hands',()=>{
 let checked=0;
 for(let i=0;i<count;i++){
  const [x,y]=surface.positions.slice(i*3,i*3+2);
  if(Math.abs(x)>.36&&y>.95&&y<1.10){assert.ok(surface.colors[i*3]>.25);checked++;}
 }
 assert.ok(checked>20);
});
test('same source converts to canonical Nexus mesh without changing geometry',()=>{
 const m=toAuthoringMesh(surface);
 assert.equal(m.vertices.length,count);assert.equal(m.faces.length,surface.indices.length/3);
 assert.deepEqual(m.vertices[100].position,surface.positions.slice(300,303));
 assert.equal(m.attributes[0].domain,'vertex');assert.equal(m.attributes[0].arity,4);
 assert.equal(Object.keys(m.attributes[0].values).length,count);
 assert.equal(anatomicalRig().filter(b=>b.parent===null).length,1);
});
test('surface resolution is bounded and default generation is cached',()=>{
 assert.equal(createAnatomicalSurface(),surface);
 for(const spacing of [NaN,0,.001,1])assert.throws(()=>createAnatomicalSurface({spacing}),RangeError);
});

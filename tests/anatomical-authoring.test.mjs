import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../scripts/author-anatomical-fighter.mjs',import.meta.url),'utf8');
const runtime=readFileSync(new URL('../src/animation/articulated-fighter.js',import.meta.url),'utf8');
function authoredGeometry(){
 const start=source.indexOf('const vertices=[],faces=[],materialFaces={},influences={};');
 const end=source.indexOf("command('mesh.create'",start);
 assert.ok(start>0 && end>start,'Native mesh source found');
 // Evaluate only the self-contained geometry-construction block, never engine IO.
 return new Function(source.slice(start,end)+'return {vertices,faces,influences};')();
}
test('anatomical source uses Nexus Authoring mesh, rig, skin, animation and export',()=>{
 for(const operation of ["command('mesh.create'","command('rig.set'","command('skin.bind'",
   "command('skin.weights'","command('animation.set'","authoringExport.export","authoringImport.import"])
  assert.ok(source.includes(operation),'Missing native operation '+operation);
 assert.match(source,/assert\.equal\(clips\.length,16/);
 assert.match(source,/anatomical-native-sixteen-clips/);
});
test('anatomical mesh has valid independent closed surfaces with normalized weights',()=>{
 const {vertices,faces,influences}=authoredGeometry();
 assert.ok(vertices.length>6000 && faces.length>6000);
 const byId=new Map(vertices.map(v=>[v.id,v.position]));
 assert.equal(byId.size,vertices.length);
 const edges=new Map();
 for(const f of faces){
  assert.ok(f.vertices.length>=3 && new Set(f.vertices).size===f.vertices.length);
  const points=f.vertices.map(id=>byId.get(id));
  assert.ok(points.every(p=>p?.length===3&&p.every(Number.isFinite)));
  for(let i=0;i<f.vertices.length;i++){
   const a=f.vertices[i],b=f.vertices[(i+1)%f.vertices.length];
   const key=[a,b].sort().join('|');
   const use=edges.get(key)||[];use.push([a,b]);edges.set(key,use);
  }
 }
 for(const uses of edges.values()){
  assert.equal(uses.length,2,'Nonmanifold or open edge');
  assert.equal(uses[0][0],uses[1][1],'Inconsistent winding');
 }
 assert.equal(Object.keys(influences).length,vertices.length);
 for(const list of Object.values(influences))
  assert.ok(list.length>=1&&list.length<=4 &&
   Math.abs(list.reduce((sum,w)=>sum+w.weight,0)-1)<1e-9);
});
test('body proportions, face features, and bilateral extremities exist',()=>{
 const {vertices}=authoredGeometry();
 const x=vertices.map(v=>v.position[0]),y=vertices.map(v=>v.position[1]);
 assert.ok(Math.min(...y)>-.05 && Math.max(...y)>2.3);
 assert.ok(Math.max(...x)>.50&&Math.min(...x)<-.50);
 for(const name of ['ellipsoid(0,2.075','ellipsoid(0,2.072','organicLimb([shoulder',
 'organicLimb([hip','for(let i=0;i<5;i++)'])
  assert.ok(source.includes(name),'Missing form '+name);
 for(const bone of ["side+'_hand'","side+'_foot'"])
  assert.ok(source.includes(bone));
});
test('live articulated fighter preserves animation and receives anatomical profiles',()=>{
 for(const name of ['createArticulatedFighter','solveLeg','gaitTargets','new THREE.SkinnedMesh',
  'loft([[0,.94,0,.248,.158]','attach(side+\'_foot\''])
  assert.ok(runtime.includes(name),'Missing live rig/profile '+name);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {FIGHTER_ASSETS,REQUIRED_FIGHTER_CLIPS,fighterLoadOrder} from '../src/gameplay/fighter-assets.js';
function readGlb(path){
 const data=readFileSync(new URL('../'+path,import.meta.url));
 assert.equal(data.readUInt32LE(0),0x46546c67,'GLB magic');
 assert.equal(data.readUInt32LE(4),2,'glTF 2.0');
 assert.equal(data.readUInt32LE(8),data.length,'GLB reported file length');
 assert.equal(data.toString('ascii',16,20),'JSON','JSON chunk');
 const jsonSize=data.readUInt32LE(12);
 return JSON.parse(data.subarray(20,20+jsonSize).toString('utf8').trim());
}
for(const [edition,path] of Object.entries(FIGHTER_ASSETS)){
 test(`${edition} GLB has all 16 named authored animations`,()=>{
  const d=readGlb(path);
  const names=d.animations.map(x=>x.name.split('/').at(-1).trim().toLowerCase().replaceAll(' ','_'));
  for(const name of REQUIRED_FIGHTER_CLIPS)assert.ok(names.includes(name),`Missing ${name} in ${edition}`);
  assert.equal(new Set(names).size,REQUIRED_FIGHTER_CLIPS.length);
  assert.equal(d.skins.length,1);
 });
 test(`${edition} GLB exposes required anatomical bone hierarchy`,()=>{
  const d=readGlb(path),names=new Set(d.nodes.map(x=>x.name));
  for(const name of ['root','pelvis','spine','chest','neck','head','l_shin','r_shin'])
   assert.ok(names.has(name),`Missing ${name} in ${edition}`);
 });
}

test('Pass43 binary is byte-exact with 18 skinned joints and animated elbows/knees',()=>{
 const bytes=readFileSync(new URL('../'+FIGHTER_ASSETS.experimental,import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'1c0473c415fa1dd6ef19a2e25138703b8625fac54dae846ea7d833a226d78645');
 const gltf=readGlb(FIGHTER_ASSETS.experimental),joints=new Set(gltf.skins[0].joints);
 assert.equal(joints.size,18);
 const byName=new Map(gltf.nodes.map((n,i)=>[n.name,i]));
 const hingeIds=['l_elbow','r_elbow','l_knee','r_knee'].map(n=>{
  const id=byName.get(n);assert.ok(Number.isInteger(id)&&joints.has(id),'Missing skinned '+n);return id;
 });
 for(const clip of gltf.animations){
  const targets=new Set(clip.channels.map(c=>c.target.node));
  for(const id of hingeIds)assert.ok(targets.has(id),'Unanimated joint in '+clip.name);
  const uniqueTargets=new Set(clip.channels.map(c=>c.target.node+':'+c.target.path));
  assert.equal(uniqueTargets.size,clip.channels.length,'Duplicate animation channels in '+clip.name);
 }
 const primitive=gltf.meshes[0].primitives[0];
 for(const attr of ['JOINTS_0','WEIGHTS_0'])assert.ok(Number.isInteger(primitive.attributes[attr]),attr);
 assert.equal(gltf.accessors[primitive.attributes.POSITION].count,10252);
 assert.equal(gltf.accessors[primitive.indices].count,61500);
});
test('Pass 45 has the preserved 14-bone rig, 16 clips and skinned clothing',()=>{
 const bytes=readFileSync(new URL('../'+FIGHTER_ASSETS.preferred,import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),
  '86cfc66907f9fb546ee5e3cd4c9ae81afcf60a6fe77b9cf1afb5abfe6625f4ed');
 const gltf=readGlb(FIGHTER_ASSETS.preferred);
 const old=readGlb(FIGHTER_ASSETS.fallback);
 assert.equal(gltf.skins[0].joints.length,14);
 assert.deepEqual(gltf.skins[0].joints.map(i=>gltf.nodes[i].name),
  old.skins[0].joints.map(i=>old.nodes[i].name));
 assert.deepEqual(gltf.animations.map(x=>x.name),old.animations.map(x=>x.name));
 assert.equal(gltf.animations.length,16);
 const primitives=gltf.meshes[0].primitives;
 assert.equal(primitives.length,5);
 for(const primitive of primitives){
  assert.ok(Number.isInteger(primitive.attributes.JOINTS_0),'unskinned attachment');
  assert.ok(Number.isInteger(primitive.attributes.WEIGHTS_0),'unweighted attachment');
  assert.ok(gltf.accessors[primitive.attributes.POSITION].count>0,'empty mesh primitive');
 }
 const names=gltf.materials.map(m=>m.name.toLowerCase());
 assert.ok(names.some(n=>n.includes('tan-skin')),'tan skin material absent');
 assert.ok(names.some(n=>n.includes('briefs')),'fitted underwear material absent');
 assert.ok(names.some(n=>n.includes('areola')),'chest detail material absent');
});
test('previous versions remain available and default load order is safe',()=>{
 assert.equal(FIGHTER_ASSETS.preferred,'assets/glb/fighter-pass45-tan-anatomy-briefs.glb');
 assert.deepEqual(fighterLoadOrder(),[FIGHTER_ASSETS.preferred,FIGHTER_ASSETS.fallback,FIGHTER_ASSETS.legacyFallback]);
 assert.deepEqual(fighterLoadOrder({stable:true}),[FIGHTER_ASSETS.fallback,FIGHTER_ASSETS.legacyFallback]);
 assert.deepEqual(fighterLoadOrder({experimental:true}),[
  FIGHTER_ASSETS.experimental,FIGHTER_ASSETS.preferred,FIGHTER_ASSETS.fallback,FIGHTER_ASSETS.legacyFallback
 ]);
 assert.equal(readGlb(FIGHTER_ASSETS.fallback).animations.length,16);
 assert.equal(readGlb(FIGHTER_ASSETS.legacyFallback).animations.length,16);
});

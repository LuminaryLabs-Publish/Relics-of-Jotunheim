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
test('both prior fighter GLBs remain usable backups',()=>{
 assert.notEqual(FIGHTER_ASSETS.preferred,FIGHTER_ASSETS.fallback);
 assert.notEqual(FIGHTER_ASSETS.fallback,FIGHTER_ASSETS.experimental);
 assert.equal(readGlb(FIGHTER_ASSETS.preferred).animations.length,16);
 assert.equal(readGlb(FIGHTER_ASSETS.fallback).animations.length,16);
});

test('default fighter load never selects unapproved Pass 43',()=>{
 assert.deepEqual(fighterLoadOrder(),[FIGHTER_ASSETS.preferred,FIGHTER_ASSETS.fallback]);
 assert.deepEqual(fighterLoadOrder({experimental:true}),[
  FIGHTER_ASSETS.experimental,FIGHTER_ASSETS.preferred,FIGHTER_ASSETS.fallback
 ]);
 assert.equal(FIGHTER_ASSETS.preferred,'assets/glb/fighter-anatomical-pass32-REVIEW.glb');
});

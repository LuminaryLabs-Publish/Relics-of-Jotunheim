import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FIGHTER_ASSETS,REQUIRED_FIGHTER_CLIPS} from '../src/gameplay/fighter-assets.js';
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

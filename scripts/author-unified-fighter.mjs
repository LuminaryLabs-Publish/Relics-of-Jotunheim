// Run with the existing pinned NexusEngine dependency. No change to Engine or Actions.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createEngine} from 'nexusengine';
import {createAuthoringDomain} from 'nexusengine/domains/authoring';
import {createAnatomicalSurface,toAuthoringMesh} from '../src/animation/anatomical-surface.js';

const source=createAnatomicalSurface(),mesh=toAuthoringMesh(source);
const legacy=JSON.parse(await readFile(new URL('../assets/source/fighter/canonical-v2-source.json',import.meta.url),'utf8'));
assert.ok(legacy.rig?.bones&&legacy.animation?.clips,'Legacy authored rig/animation source missing');
const rest={translation:[0,0,0],rotation:[0,0,0,1],scale:[1,1,1]};
const rig={bones:source.bones.map(b=>({id:b.name,name:b.name,parent:b.parent,
 rest:{...rest,translation:[...b.position]},length:b.length})),constraints:[]};
const oldBones=new Map(legacy.rig.bones.map(b=>[b.id,b]));
const newBones=new Map(rig.bones.map(b=>[b.id,b]));
const multiply=([ax,ay,az,aw],[bx,by,bz,bw])=>[
 aw*bx+ax*bw+ay*bz-az*by,aw*by-ax*bz+ay*bw+az*bx,
 aw*bz+ax*by-ay*bx+az*bw,aw*bw-ax*bx-ay*by-az*bz];
const inverse=([x,y,z,w])=>{const n=x*x+y*y+z*z+w*w;return [-x/n,-y/n,-z/n,w/n];};
const clips=structuredClone(legacy.animation.clips);
assert.equal(clips.length,16,'Preserve every original clip');
// Rebase the existing clips onto the new bind pose, rather than copying old 180-degree rests.
for(const clip of clips)for(const track of clip.tracks){
 const old=oldBones.get(track.target),next=newBones.get(track.target);
 assert.ok(old&&next,'Animation references an unknown bone: '+track.target);
 for(const key of track.keys){
  if(track.property==='rotation')key.value=multiply(next.rest.rotation,multiply(inverse(old.rest.rotation),key.value));
  else if(track.property==='translation')key.value=key.value.map((v,i)=>v-old.rest.translation[i]+next.rest.translation[i]);
 }
}
const engine=createEngine({kits:createAuthoringDomain()}),project=engine.n.authoringProject;
let serial=0;
const command=(id,args)=>project.execute({requestId:'roj-unified-'+(++serial),
 epoch:project.context().epoch,operations:[{id,args}]});
command('mesh.create',{id:'fighter-mesh',mesh});
command('rig.set',{id:'fighter-rig',content:rig});
command('skin.bind',{id:'fighter-skin',meshId:'fighter-mesh',rigId:'fighter-rig',parameters:{smoothing:0,maxInfluences:4}});
const weights=Object.fromEntries(mesh.vertices.map((v,i)=>[v.id,
 [0,1,2,3].map(k=>({boneId:source.bones[source.skinIndices[i*4+k]].name,weight:source.skinWeights[i*4+k]})).filter(w=>w.weight>0)]));
command('skin.weights',{id:'fighter-skin',expectedRevision:project.getDocument('fighter-skin').revision,values:weights});
command('animation.set',{id:'fighter-animation',content:{rigId:'fighter-rig',shapeId:null,clips,poses:[],arrangements:[]}});
command('material.set',{id:'fighter-material',content:{baseColor:[1,1,1,1],roughness:.83,metallic:0}});
command('assembly.set',{id:'fighter-scene',content:{nodes:[{id:'fighter',name:'ROJ unified anatomical fighter',
 meshId:'fighter-mesh',rigId:'fighter-rig',skinId:'fighter-skin',animationIds:['fighter-animation'],materials:['fighter-material']}]}});
assert.equal(engine.n.authoringValidation.project().errors,0);
const artifact=await engine.n.authoringExport.export({requestId:'roj-unified-glb',assemblyId:'fighter-scene',format:'glb'});
assert.equal(artifact.validation.errors,0);
const imported=createEngine({kits:createAuthoringDomain()});
await imported.n.authoringImport.import({requestId:'roj-unified-roundtrip',prefix:'roj-unified',format:'glb',bytes:artifact.bytes,resources:artifact.resources});
assert.equal(imported.n.authoringValidation.project().errors,0);
const output=new URL('../artifacts/roj-unified/',import.meta.url);
await mkdir(output,{recursive:true});
await writeFile(new URL('fighter-unified.glb',output),artifact.bytes);
await writeFile(new URL('native-receipt.json',output),JSON.stringify(artifact.receipt,null,2));
await writeFile(new URL('canonical-source.json',output),JSON.stringify({mesh,rig,skin:project.getDocument('fighter-skin').content,animation:project.getDocument('fighter-animation').content}));
console.log(JSON.stringify({status:'PASS',vertices:mesh.vertices.length,triangles:mesh.faces.length,bones:rig.bones.length,clips:clips.length,glbBytes:artifact.bytes.length}));

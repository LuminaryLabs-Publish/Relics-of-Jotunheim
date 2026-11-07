import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createEngine } from 'nexusengine';
import { createAuthoringDomain, createAuthoringDesignKit, createAuthoringArtKit, createAuthoringInteractionKit, createAuthoringCraftKit } from 'nexusengine/domains/authoring';

// ROJ-0003: real NexusEngine n:authoring project, rig, skin, animation, GLB export.
// A bounded WALK-only proof. Expand to six clips only after native export/reimport passes.
const roj4=process.argv.includes('--roj4');
const full=roj4||process.argv.includes('--all');
const engine=createEngine({kits:[
 ...createAuthoringDomain(),createAuthoringDesignKit(),createAuthoringArtKit(),
 createAuthoringInteractionKit(),createAuthoringCraftKit()
]});
const project=engine.n.authoringProject;
const creativeCatalog=project.tools();
const disciplines=[
 ['design',['mesh.create','assembly.set']],
 ['art',['mesh.create','rig.set','skin.bind','skin.weights','animation.set','material.set']],
 ['interaction',['sequence.set']],
 ['craft',[]]
];
const harnessEvidence=disciplines.map(([kind,allowedCapabilities])=>{
 const api=engine.n['authoring'+kind[0].toUpperCase()+kind.slice(1)];
 const request=api.request({
   requestId:'roj03-'+kind+'-discovery',harnessId:kind,goalRef:'ROJ-0003 rigged walking fighter',
   projectRef:'Relics-of-Jotunheim',targetRef:'fighter-walk-proof',
   sourceRevision:{epoch:project.context().epoch,clock:project.context().clock},
   inputRefs:[],allowedCapabilities,
   acceptanceCriteria:[{id:'actual-native-output',kind:'structural',description:'Native Authoring operations with validation'}],
   reviewPolicy:{humanRequired:false,reviewerIds:[]}
 });
 const discovered=api.discover(request,creativeCatalog);
 if(kind==='design'||kind==='art')
   assert.ok(discovered.length>0,kind+' harness did not discover native operations');
 const plan=kind==='craft'?api.plan(request,[],creativeCatalog):
   discovered.length?api.plan(request,[{id:discovered[0].id,args:{id:'fighter-walk-proof'}}],creativeCatalog):null;
 return {kind,stages:api.stages,discovered:discovered.map(c=>c.id),planSchema:plan?.schema??null,
   status:'discovery-and-preflight-only',sourceRevision:request.sourceRevision};
});
let serial=0;
const command=(id,args)=>project.execute({
  requestId:'roj03-'+(++serial)+'-'+id,
  epoch:project.context().epoch,
  operations:[{id,args}]
});
const qx=a=>[Math.sin(a/2),0,0,Math.cos(a/2)];
const qz=a=>[0,0,Math.sin(a/2),Math.cos(a/2)];
function qmul([ax,ay,az,aw],[bx,by,bz,bw]){
 return [aw*bx+ax*bw+ay*bz-az*by,aw*by-ax*bz+ay*bw+az*bx,
 aw*bz+ax*by-ay*bx+az*bw,aw*bw-ax*bx-ay*by-az*bz];
}
const identity=[0,0,0,1];
const t=(translation=[0,0,0],rotation=identity)=>({translation,rotation,scale:[1,1,1]});
const bones=[
 ['root',null,[0,0,0],identity,.25],
 ['pelvis','root',[0,1,0],identity,.25],
 ['spine','pelvis',[0,.25,0],identity,.5],
 ['chest','spine',[0,.5,0],identity,.25],
 ['neck','chest',[0,.125,0],identity,.125],
 ['head','neck',[0,.125,0],identity,.25],
 ['l_upper_arm','chest',[-.375,0,0],[1,0,0,0],.375],
 ['l_forearm','l_upper_arm',[0,.375,0],identity,.375],
 ['r_upper_arm','chest',[.375,0,0],[1,0,0,0],.375],
 ['r_forearm','r_upper_arm',[0,.375,0],identity,.375],
 ['l_thigh','pelvis',[-.1875,-.125,0],[1,0,0,0],.5],
 ['l_shin','l_thigh',[0,.5,0],identity,.375],
 ['r_thigh','pelvis',[.1875,-.125,0],[1,0,0,0],.5],
 ['r_shin','r_thigh',[0,.5,0],identity,.375]
].map(([id,parent,translation,rotation,length])=>({
 id,name:id,parent,rest:t(translation,rotation),length
}));
const rig={bones,constraints:[]};
const rest=Object.fromEntries(bones.map(b=>[b.id,b.rest]));
const vertices=[],faces=[],materialFaces={},influences={};
function addVertex(p,weights){
 const id='v'+vertices.length;
 vertices.push({id,position:p});
 influences[id]=weights;
 return id;
}
function addFace(ids,material){
 const id='f'+faces.length;faces.push({id,vertices:ids});
 materialFaces[id]=[material];
}
function box(cx,cy,cz,w,h,d,bone,material){
 const coords=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
 [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
 const vs=coords.map(([x,y,z])=>addVertex([cx+x*w/2,cy+y*h/2,cz+z*d/2],[{boneId:bone,weight:1}]));
 for(const ids of [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]])
  addFace(ids.map(i=>vs[i]),material);
}
const sub=(a,b)=>a.map((v,i)=>v-b[i]),add=(a,b)=>a.map((v,i)=>v+b[i]),scale=(v,s)=>v.map(x=>x*s);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=v=>scale(v,1/Math.hypot(...v));
function limb(a,b,r0,r1,boneA,boneB,material,jointFraction=.5){
 const direction=unit(sub(b,a)),u=unit(cross(direction,[0,0,1])),v=cross(direction,u);
 const steps=[0,.18,.35,jointFraction-.09,jointFraction-.045,jointFraction,jointFraction+.045,jointFraction+.09,.82,1].sort((a,b)=>a-b),sides=12,rings=[];
 for(const f of steps){
   const center=add(a,scale(sub(b,a),f));
   const first=f<jointFraction-.09?1:f>jointFraction+.09?0:(jointFraction+.09-f)/.18;
   const weights=first>=1-1e-8?[{boneId:boneA,weight:1}]
     :first<=1e-8?[{boneId:boneB,weight:1}]
     :[{boneId:boneA,weight:first},{boneId:boneB,weight:1-first}];
   const radius=r0*(1-f)+r1*f;
   rings.push(Array.from({length:sides},(_,i)=>{
      const a=i*2*Math.PI/sides,p=add(center,add(scale(u,Math.cos(a)*radius),scale(v,Math.sin(a)*radius)));
      return addVertex(p,weights);
   }));
 }
 addFace([...rings[0]].reverse(),material);
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<sides;j++)
  addFace([rings[i][j],rings[i][(j+1)%sides],rings[i+1][(j+1)%sides],rings[i+1][j]],material);
 addFace([...rings.at(-1)],material);
}
box(0,1.50,0,.59,.62,.31,'chest',0);
box(0,1.03,0,.52,.25,.32,'pelvis',1);
box(0,1.87,0,.18,.17,.18,'neck',2);
box(0,2.07,0,.38,.35,.33,'head',2);
box(0,2.24,0,.36,.09,.34,'head',3);
for(const sign of [-1,1]){
 const side=sign<0?'l':'r';
 limb([sign*.375,1.75,0],[sign*.375,1.015,0],.115,.08,side+'_upper_arm',side+'_forearm',1,.51);
 limb([sign*.1875,.875,0],[sign*.1875,0,0],.148,.105,side+'_thigh',side+'_shin',1,.5714285714285714);
 box(sign*.18,.075,.11,.27,.14,.39,side+'_shin',3);
}
const mesh={vertices,faces,attributes:[{id:'material',domain:'face',arity:1,values:materialFaces}]};
command('mesh.create',{id:'fighter-mesh',mesh});
command('rig.set',{id:'fighter-rig',content:rig});
command('skin.bind',{id:'fighter-skin',meshId:'fighter-mesh',rigId:'fighter-rig',parameters:{smoothing:0,maxInfluences:4}});
command('skin.weights',{id:'fighter-skin',expectedRevision:project.getDocument('fighter-skin').revision,values:influences});
const times=[0,.2,.4,.6,.8];
const targets=[
 ['l_thigh',[0,.45,0,-.45,0]],['r_thigh',[0,-.45,0,.45,0]],
 ['l_shin',[0,.12,.34,.08,0]],['r_shin',[0,.08,.34,.12,0]],
 ['l_upper_arm',[0,-.31,0,.31,0]],['r_upper_arm',[0,.31,0,-.31,0]],
];
const clips=[{id:'walk',name:'Walk',duration:.8,tracks:targets.map(([bone,angles])=>({
 id:bone+'-rotation',target:bone,property:'rotation',interpolation:'LINEAR',
 keys:times.map((time,i)=>({time,value:qmul(rest[bone].rotation,qx(angles[i]))}))
}))}];

const clipRot=(name,duration,bonesAndAngles)=>{
 const stamps=[0,.25,.5,.75,1].map(x=>+((duration*x).toFixed(5)));
 return {id:name.toLowerCase(),name,duration,tracks:bonesAndAngles.map(([bone,angles,axis='x'])=>({
  id:name+'-'+bone+'-'+axis,target:bone,property:'rotation',interpolation:'LINEAR',
  keys:stamps.map((time,i)=>({time,value:qmul(rest[bone].rotation,axis==='z'?qz(angles[i]):qx(angles[i]))}))
 }))};
};
function yTrack(name,duration,bone,delta){
 return {id:name+'-'+bone+'-translation',target:bone,property:'translation',interpolation:'LINEAR',
 keys:[0,.25,.5,.75,1].map((f,i)=>({time:+(f*duration).toFixed(5),
 value:add(rest[bone].translation,[0,delta[i],0])}))};
}
if(full){
 const idle=clipRot('Idle',1.6,[
  ['l_upper_arm',[0,.022,0,-.022,0]],['r_upper_arm',[0,-.022,0,.022,0]]
 ]);idle.tracks.push(yTrack('Idle',1.6,'pelvis',[0,.012,0,-.012,0]));
 const run=clipRot('Run',.56,[
  ['l_thigh',[0,.72,0,-.72,0]],['r_thigh',[0,-.72,0,.72,0]],
  ['l_shin',[0,.22,.55,.16,0]],['r_shin',[0,.16,.55,.22,0]],
  ['l_upper_arm',[0,-.5,0,.5,0]],['r_upper_arm',[0,.5,0,-.5,0]]
 ]);run.tracks.push(yTrack('Run',.56,'pelvis',[0,.035,0,-.02,0]));
 const jump=clipRot('Jump',.68,[
  ['l_thigh',[0,-.2,.42,.22,0]],['r_thigh',[0,-.2,.42,.22,0]],
  ['l_shin',[0,.25,.52,.24,0]],['r_shin',[0,.25,.52,.24,0]],
  ['l_upper_arm',[0,-.65,-.85,-.35,0]],['r_upper_arm',[0,-.65,-.85,-.35,0]]
 ]);
 const land=clipRot('Land',.36,[
  ['l_thigh',[0,.22,.38,.16,0]],['r_thigh',[0,.22,.38,.16,0]],
  ['l_upper_arm',[0,.24,.3,.12,0]],['r_upper_arm',[0,.24,.3,.12,0]]
 ]);land.tracks.push(yTrack('Land',.36,'pelvis',[0,-.075,-.11,-.04,0]));
 const dodge=clipRot('Dodge',.48,[
  ['pelvis',[0,.2,.28,.13,0],'z'],
  ['chest',[0,.24,.38,.15,0]],
  ['l_thigh',[0,-.48,-.65,-.12,0]],['r_thigh',[0,.32,.43,.12,0]],
  ['l_upper_arm',[0,.35,.48,.15,0]],['r_upper_arm',[0,-.35,-.48,-.15,0]]
 ]);
 clips.push(idle,run,jump,land,dodge);
}


if(roj4){
 const crouchPose=[
  ['l_thigh',[0,.45,.65,.45,0]],['r_thigh',[0,.45,.65,.45,0]],
  ['l_shin',[0,.55,.9,.55,0]],['r_shin',[0,.55,.9,.55,0]],
  ['chest',[0,-.09,-.14,-.09,0]]
 ];
 const crouchIdle=clipRot('Crouch Idle',1.4,crouchPose);
 crouchIdle.id='crouch_idle';
 crouchIdle.tracks.push(yTrack('Crouch Idle',1.4,'pelvis',[0,-.15,-.2,-.15,0]));
 const crouchWalk=clipRot('Crouch Walk',.9,[
  ['l_thigh',[0,.42,.7,.35,0]],['r_thigh',[0,.35,.7,.42,0]],
  ['l_shin',[0,.55,.95,.65,0]],['r_shin',[0,.65,.95,.55,0]],
  ['l_upper_arm',[0,-.16,0,.16,0]],['r_upper_arm',[0,.16,0,-.16,0]]
 ]);
 crouchWalk.id='crouch_walk';
 crouchWalk.tracks.push(yTrack('Crouch Walk',.9,'pelvis',[0,-.13,-.18,-.13,0]));
 const strafeLeft=clipRot('Strafe Left',.75,[
  ['l_thigh',[0,.32,0,-.32,0],'z'],['r_thigh',[0,-.32,0,.32,0],'z'],
  ['l_shin',[0,.15,.3,.1,0]],['r_shin',[0,.1,.3,.15,0]],
  ['chest',[0,.07,0,-.07,0],'z']
 ]);strafeLeft.id='strafe_left';
 const strafeRight=clipRot('Strafe Right',.75,[
  ['l_thigh',[0,-.32,0,.32,0],'z'],['r_thigh',[0,.32,0,-.32,0],'z'],
  ['l_shin',[0,.1,.3,.15,0]],['r_shin',[0,.15,.3,.1,0]],
  ['chest',[0,-.07,0,.07,0],'z']
 ]);strafeRight.id='strafe_right';
 const backward=clipRot('Backward Walk',.88,[
  ['l_thigh',[0,-.36,0,.36,0]],['r_thigh',[0,.36,0,-.36,0]],
  ['l_shin',[0,.1,.32,.14,0]],['r_shin',[0,.14,.32,.1,0]],
  ['l_upper_arm',[0,.23,0,-.23,0]],['r_upper_arm',[0,-.23,0,.23,0]]
 ]);backward.id='backward_walk';
 const sprint=clipRot('Sprint',.48,[
  ['l_thigh',[0,.84,0,-.84,0]],['r_thigh',[0,-.84,0,.84,0]],
  ['l_shin',[0,.3,.9,.2,0]],['r_shin',[0,.2,.9,.3,0]],
  ['l_upper_arm',[0,-.72,0,.72,0]],['r_upper_arm',[0,.72,0,-.72,0]],
  ['l_forearm',[0,.45,.7,.3,0]],['r_forearm',[0,.3,.7,.45,0]]
 ]);sprint.tracks.push(yTrack('Sprint',.48,'pelvis',[0,.04,0,-.03,0]));
 const fall=clipRot('Fall',.7,[
  ['l_thigh',[0,.18,.32,.2,0]],['r_thigh',[0,.18,.32,.2,0]],
  ['l_shin',[0,.15,.26,.15,0]],['r_shin',[0,.15,.26,.15,0]],
  ['l_upper_arm',[0,-.45,-.6,-.3,0]],['r_upper_arm',[0,-.45,-.6,-.3,0]]
 ]);
 const heavy=clipRot('Heavy Landing',.5,[
  ['l_thigh',[0,.42,.65,.28,0]],['r_thigh',[0,.42,.65,.28,0]],
  ['l_shin',[0,.5,.85,.35,0]],['r_shin',[0,.5,.85,.35,0]],
  ['chest',[0,-.2,-.3,-.1,0]]
 ]);heavy.id='heavy_landing';heavy.tracks.push(yTrack('Heavy Landing',.5,'pelvis',[0,-.12,-.22,-.08,0]));
 const block=clipRot('Block',.7,[
  ['l_upper_arm',[0,-.65,-1.15,-.8,0]],['r_upper_arm',[0,-.65,-1.15,-.8,0]],
  ['l_forearm',[0,.35,.85,.55,0]],['r_forearm',[0,.35,.85,.55,0]],
  ['chest',[0,-.06,-.12,-.06,0]]
 ]);
 const attack=clipRot('Light Attack',.62,[
  ['r_upper_arm',[0,-.55,-1.1,.65,0]],
  ['r_forearm',[0,.65,.9,.15,0]],
  ['chest',[0,-.2,.35,.12,0],'z'],
  ['l_upper_arm',[0,.2,.35,.12,0]],
  ['l_thigh',[0,.18,.3,.12,0]]
 ]);attack.id='light_attack';
 clips.push(crouchIdle,crouchWalk,strafeLeft,strafeRight,backward,sprint,fall,heavy,block,attack);
 assert.equal(clips.length,16,'ROJ-0004 must retain six and add ten');
 const names=new Set(clips.map(c=>c.id));assert.equal(names.size,16);
 for(const clip of clips){
  for(const track of clip.tracks)assert.ok(rig.bones.some(b=>b.id===track.target),'missing bone '+track.target);
 }
}

command('animation.set',{id:'fighter-animation',content:{rigId:'fighter-rig',shapeId:null,clips,poses:[],arrangements:[]}});
const materials=[['cloth',[.18,.31,.42,1]],['leather',[.41,.29,.23,1]],['skin',[.78,.61,.43,1]],['metal',[.49,.54,.58,1]]];
for(const [id,baseColor] of materials)command('material.set',{id,content:{baseColor,roughness:.82,metallic:id==='metal'?.5:0}});
command('assembly.set',{id:'fighter-scene',content:{nodes:[{
 id:'fighter',name:'ROJ fighter - walk proof',meshId:'fighter-mesh',
 rigId:'fighter-rig',skinId:'fighter-skin',animationIds:['fighter-animation'],
 materials:materials.map(([id])=>id)
}]}});
const validation=engine.n.authoringValidation.project();
assert.equal(validation.errors,0,JSON.stringify(validation.issues||validation));
const sampled=times.map(time=>engine.n.authoringAnimation.sample('fighter-animation','walk',time));
const poses=sampled.map(({pose})=>engine.n.authoringSkin.evaluate('fighter-skin',pose));
const reference=Object.fromEntries(poses[0].vertices.map(v=>[v.id,v.position]));
const peak=poses.slice(1,-1).reduce((max,p)=>Math.max(max,...p.vertices.map(v=>Math.hypot(...sub(v.position,reference[v.id])))),0);
assert.ok(peak>.025,'The walk must visibly deform vertices; measured peak '+peak);
const loopDrift=Math.max(...poses[0].vertices.map((v,i)=>Math.hypot(...sub(v.position,poses.at(-1).vertices[i].position))));
assert.ok(loopDrift<1e-6,'Walk cycle must return to its starting mesh');
const clipChecks=clips.map(clip=>{
 const samples=[0,.25,.5,.75,1].map(f=>engine.n.authoringAnimation.sample('fighter-animation',clip.id,clip.duration*f));
 const deform=samples.map(s=>engine.n.authoringSkin.evaluate('fighter-skin',s.pose).vertices);
 const initial=deform[0].map(v=>v.position);
 const peak=deform.slice(1).reduce((best,vs)=>Math.max(best,...vs.map((v,i)=>Math.hypot(...sub(v.position,initial[i])))),0);
 assert.ok(peak>.004,clip.id+' must deform the character');
 const drift=Math.max(...deform.at(-1).map((v,i)=>Math.hypot(...sub(v.position,initial[i]))));
 assert.ok(drift<1e-6,clip.id+' should return to rest for clean transitions');
 return {clip:clip.id,peakDeformationMeters:peak,endToStartMeters:drift};
});
const jointChecks=[];
if(roj4){
 const restVertices=engine.n.authoringSkin.evaluate('fighter-skin',{}).vertices;
 const byId=Object.fromEntries(restVertices.map(v=>[v.id,v.position]));
 for(const joint of ['l_forearm','r_forearm','l_shin','r_shin']){
  for(const degrees of [0,45,90,120]){
   const pose={[joint]:{...rest[joint],rotation:qmul(rest[joint].rotation,qx(degrees*Math.PI/180))}};
   const vertices=engine.n.authoringSkin.evaluate('fighter-skin',pose).vertices;
   assert.equal(vertices.length,restVertices.length,'Joint test vertex count changed');
   assert.ok(vertices.every(v=>v.position.every(Number.isFinite)),'Nonfinite skin at '+joint+' '+degrees);
   const moved=Math.max(...vertices.map(v=>Math.hypot(...sub(v.position,byId[v.id]))));
   if(degrees>0)assert.ok(moved>.015,'Joint does not articulate '+joint+' '+degrees);
   jointChecks.push({joint,degrees,maxVertexDisplacementMeters:moved,finite:true});
  }
 }
 assert.equal(jointChecks.length,16);
}

const artifact=await engine.n.authoringExport.export({requestId:roj4?'roj-0004-full-glb':full?'roj-0003-full-glb':'roj-0003-walk-glb',assemblyId:'fighter-scene',format:'glb'});
assert.equal(artifact.validation.errors,0,JSON.stringify(artifact.validation));
assert.ok(artifact.bytes.length>1000);
const view=new DataView(artifact.bytes.buffer,artifact.bytes.byteOffset,artifact.bytes.byteLength);
assert.equal(view.getUint32(0,true),0x46546c67,'GLB magic');
const gltf=JSON.parse(new TextDecoder().decode(artifact.bytes.slice(20,20+view.getUint32(12,true))).trim());
assert.ok(gltf.skins?.length===1,'Native export must contain skin');
assert.equal(gltf.animations?.length,clips.length,'Native GLB must contain each authored clip');
assert.ok(gltf.animations?.some(a=>a.name.includes('Walk')),'Native export must contain walk animation');
assert.ok(gltf.meshes?.length>=1,'Native export must contain mesh');
const roundtrip=createEngine({kits:createAuthoringDomain()});
const loaded=await roundtrip.n.authoringImport.import({
 requestId:roj4?'roj-0004-reimport':'roj-0003-reimport',prefix:'roj03',format:'glb',bytes:artifact.bytes,resources:artifact.resources
});
assert.ok(loaded.assemblyId,'Native import should create assembly');
assert.equal(roundtrip.n.authoringValidation.project().errors,0,'Reimport project validation');
const output=roj4?'artifacts/roj-0004':'artifacts/roj-0003';
const suffix=roj4?'roj4-sixteen-clips':full?'all-clips':'walk-proof';
await mkdir(output,{recursive:true});
await writeFile(output+'/fighter-'+suffix+'.glb',artifact.bytes);
await writeFile(output+'/native-'+suffix+'-receipt.json',JSON.stringify({schema:roj4?'roj-fighter-asset/4':'roj-fighter-asset/2',engineRevision:'c674a53e054640f5acc035180a2f3fe1d7d4fe03',meshVertices:vertices.length,meshFaces:faces.length,bones:bones.length,articulation:roj4?{kneeAndElbowRingCount:10,ringSides:12,weightBlendSpan:.18}:null,clips:clips.map(c=>c.id),clipChecks,jointChecks,harnessEvidence,peakDeformationMeters:peak,loopDriftMeters:loopDrift,glbBytes:artifact.bytes.length,glbHash:artifact.hash,validation:artifact.validation,reimportAssemblyId:loaded.assemblyId,source:artifact.receipt},null,2));
await writeFile(output+'/canonical-'+suffix+'-source.json',JSON.stringify({mesh,rig,skin:project.getDocument('fighter-skin').content,animation:project.getDocument('fighter-animation').content,assembly:project.getDocument('fighter-scene').content},null,2));
console.log(JSON.stringify({status:'PASS',engine:'NexusEngine Authoring',meshVertices:vertices.length,bones:bones.length,animationClips:clips.map(x=>x.name),clipChecks,peakDeformationMeters:peak,loopDriftMeters:loopDrift,GLBBytes:artifact.bytes.length,reimportAssemblyId:loaded.assemblyId},null,2));

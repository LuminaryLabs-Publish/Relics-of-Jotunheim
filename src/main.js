import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createGameEngine, setFighterAsset } from './engine.js';
import { createPlayerMotion } from './movement/player-motion.js';
import { installPointerLook } from './runtime/pointer-look.js';
import { createFixedStepper } from './runtime/fixed-step.js';
import { FIGHTER_ASSETS, REQUIRED_FIGHTER_CLIPS, fighterLoadOrder } from './gameplay/fighter-assets.js';
import { createHeadLook } from './animation/head-look.js';
import { createArticulatedFighter } from './animation/articulated-fighter.js';
import { createCombatState, playerStrike, enemyStrike, claimRelic } from './gameplay/combat-state.js';
import { createPlayerActionController } from './gameplay/player-action-controller.js';
import { createCameraState, orbitCamera, zoomCamera, updateCamera, desiredCameraPosition, cameraPose, shoulderTarget, resolveCameraDistance, clamp } from './movement/third-person-camera.js';

// ROJ-0011: NexusEngine owns Actor, Motion and World Contact.
// Three.js renders only the contact-corrected authoritative locomotion state.
const engine=createGameEngine(),host=document.getElementById('app');
const scene=new THREE.Scene();scene.background=new THREE.Color('#667d86');
scene.fog=new THREE.Fog('#667d86',26,90);
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,150);
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
const hemi=new THREE.HemisphereLight(0xdde8ff,0x42403c,2.0);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe8c5,2.6);sun.position.set(-9,16,8);
sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-24;sun.shadow.camera.right=24;
sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;scene.add(sun);
const mat=(c,roughness=1)=>new THREE.MeshStandardMaterial({color:c,roughness});
const floor=new THREE.Mesh(new THREE.CircleGeometry(23,80),mat('#66736a'));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const ring=new THREE.Mesh(new THREE.TorusGeometry(19,.24,8,80),mat('#b9a47c'));ring.rotation.x=Math.PI/2;ring.position.y=.08;scene.add(ring);
const stones=new THREE.Group();scene.add(stones);
for(let i=0;i<26;i++){const angle=i*Math.PI*2/26,r=21+(i%3)*.65;
 const stone=new THREE.Mesh(new THREE.DodecahedronGeometry(.6+(i%4)*.15,0),mat(i%2?'#687176':'#85817b'));
 stone.position.set(Math.cos(angle)*r,.35,Math.sin(angle)*r);stone.scale.set(1,.65,1);
 stone.castShadow=true;stones.add(stone);
}
const dummy=new THREE.Group();scene.add(dummy);dummy.position.set(0,0,-7);
const pole=new THREE.Mesh(new THREE.CylinderGeometry(.16,.21,2.1,8),mat('#85664b'));pole.position.y=1.05;pole.castShadow=true;dummy.add(pole);
const head=new THREE.Mesh(new THREE.SphereGeometry(.38,12,8),mat('#bba47d'));head.position.y=2.3;head.castShadow=true;dummy.add(head);
const arms=new THREE.Mesh(new THREE.BoxGeometry(1.25,.14,.16),mat('#85664b'));arms.position.y=1.45;dummy.add(arms);

// A distinct enemy encounter; NexusEngine remains authoritative for player motion.
const foe=new THREE.Group();scene.add(foe);
foe.position.set(-5,0,-7);
const foeCloth=mat('#354b54'),foeIron=mat('#7f8f92'),foeSkin=mat('#a18a75');
function foePart(geometry,material,x,y,z,shadow=true){
 const mesh=new THREE.Mesh(geometry,material);
 mesh.position.set(x,y,z);mesh.castShadow=shadow;foe.add(mesh);return mesh;
}
foePart(new THREE.CylinderGeometry(.37,.43,1.08,10),foeCloth,0,1.24,0);
foePart(new THREE.SphereGeometry(.32,12,10),foeSkin,0,2.02,0);
foePart(new THREE.ConeGeometry(.37,.32,8),foeIron,0,2.38,0);
for(const side of [-1,1]){
 foePart(new THREE.CylinderGeometry(.14,.17,.92,8),foeCloth,side*.54,1.32,0).rotation.z=side*.19;
 foePart(new THREE.CylinderGeometry(.18,.18,.84,8),foeIron,side*.22,.45,0);
 foePart(new THREE.BoxGeometry(.26,.15,.49),foeIron,side*.22,.09,.13);
}
const enemyHealthBack=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.09),new THREE.MeshBasicMaterial({color:0x241d1b,side:THREE.DoubleSide}));
enemyHealthBack.position.y=2.92;foe.add(enemyHealthBack);
const enemyHealthFill=new THREE.Mesh(new THREE.PlaneGeometry(1.16,.065),new THREE.MeshBasicMaterial({color:0xc1554c,side:THREE.DoubleSide}));
enemyHealthFill.position.set(0,2.92,.005);foe.add(enemyHealthFill);
const foeSpawn=new THREE.Vector3(-5,0,-7);
const relic=new THREE.Group();scene.add(relic);
const relicCore=new THREE.Mesh(new THREE.IcosahedronGeometry(.3,1),new THREE.MeshStandardMaterial({
 color:0xeec56b,metalness:.9,roughness:.18,emissive:0x543a0e,emissiveIntensity:.5
}));
relicCore.castShadow=true;relic.add(relicCore);
const relicHalo=new THREE.Mesh(new THREE.TorusGeometry(.4,.035,8,32),mat('#d4b568'));
relic.add(relicHalo);relic.visible=false;
let combat=createCombatState(),strikeFlash=0,receivedFlash=0;
const motion=createPlayerMotion(engine);
const controller=createPlayerActionController();
let controllerResult={blocking:false,intent:{sprint:false}};
let state=motion.getState(),character=null,mixer=null,headLook=null,articulated=null;
let actions=new Map(),current='',heavyLandingUntil=0,activeFighterVersion='loading';
const keys=new Set(),pressed=new Set(),fixed=createFixedStepper();
const cameraState=createCameraState(),cameraRay=new THREE.Raycaster();
const focusVec=new THREE.Vector3(),wishVec=new THREE.Vector3(),rayDirection=new THREE.Vector3();
function releaseInput(){keys.clear();pressed.clear();controller.clearBuffers();fixed.reset();}
addEventListener('keydown',e=>{
 if(e.repeat)return;
 const k=e.key.toLowerCase();
 if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
 if(!keys.has(k))pressed.add(k);
 keys.add(k);
});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
renderer.domElement.addEventListener('wheel',e=>{
 e.preventDefault();zoomCamera(cameraState,e.deltaY);
},{passive:false});

// The reticle is visual only; it never captures mouse or changes hit logic.
const reticle=document.createElement('div');
reticle.id='roj-center-reticle';reticle.setAttribute('aria-hidden','true');
reticle.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:6px;height:6px;border-radius:50%;background:#fff;pointer-events:none;z-index:5';
host.appendChild(reticle);
const hud=document.createElement('div');
hud.style.cssText='position:fixed;left:18px;top:18px;max-width:440px;color:#f3e9d8;background:#111c22dd;border-left:3px solid #b68e57;padding:14px 18px;font:13px/1.55 system-ui;pointer-events:none';
hud.innerHTML='<strong style="font-size:16px">RELICS OF JOTUNHEIM</strong><div id="roj-combat">Health 100 · Rival 100</div><div id="roj-stamina">Stamina 100 / 100</div><div id="roj-status">Loading fighter…</div><small>WASD move · Mouse look · F strike · Q block · Shift sprint · Alt dodge · R restart</small>';
host.appendChild(hud);
const pointerPrompt=document.createElement('div');
pointerPrompt.id='roj-pointer-prompt';
pointerPrompt.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:10px 16px;background:#101b23e8;color:#f3e9d8;border:1px solid #b68e57;border-radius:6px;font:14px system-ui;pointer-events:none;text-align:center';
host.appendChild(pointerPrompt);
const pointer=installPointerLook({canvas:renderer.domElement,documentRef:document,windowRef:window,
 onOrbit:(dx,dy)=>orbitCamera(cameraState,dx,dy),onRelease:releaseInput,
 onStatus:({locked,message})=>{pointerPrompt.textContent=message;pointerPrompt.style.opacity=locked?'.6':'1';}});
const status=hud.querySelector('#roj-status');
const combatStatus=hud.querySelector('#roj-combat');
const staminaStatus=hud.querySelector('#roj-stamina');
const clipNames=REQUIRED_FIGHTER_CLIPS;
const loader=new GLTFLoader();
// All edition URLs are static so Vite includes each GLB in the Pages bundle.
// Use ?fighter=pass32 to compare the stable baseline and ?fighter=pass43 for the
// quarantined four-hinge experiment. Pass 45 is the default feedback edition.
const fighterSources=new Map([
 [FIGHTER_ASSETS.preferred,{path:FIGHTER_ASSETS.preferred,label:'Pass 45 tan anatomy + briefs',url:new URL('../assets/glb/fighter-pass45-tan-anatomy-briefs.glb',import.meta.url).href}],
 [FIGHTER_ASSETS.fallback,{path:FIGHTER_ASSETS.fallback,label:'Pass 32 fallback',url:new URL('../assets/glb/fighter-anatomical-pass32-REVIEW.glb',import.meta.url).href}],
 [FIGHTER_ASSETS.legacyFallback,{path:FIGHTER_ASSETS.legacyFallback,label:'v2 fallback',url:new URL('../assets/glb/fighter-rigged-v2.glb',import.meta.url).href}],
 [FIGHTER_ASSETS.experimental,{path:FIGHTER_ASSETS.experimental,label:'Pass 43 experimental',url:new URL('../assets/glb/fighter-pass43-elbow-knee-rig-animated.glb',import.meta.url).href}]
]);
const requestedFighter=new URLSearchParams(location.search).get('fighter');
// Default: knee/ankle articulated presentation; ?fighter=pass45/pass32/pass43 compares old GLBs.
if(!requestedFighter||requestedFighter==='articulated'){
 try{
  articulated=createArticulatedFighter({solveIK:engine.n.twoBoneIk.solveTwoBoneIK});
  if(articulated.jointCount<20)throw new Error('Incomplete anatomical rig');
  character=articulated.scene;scene.add(character);
  headLook=createHeadLook(character);
  activeFighterVersion='Articulated anatomical prototype ('+articulated.jointCount+' joints)';
  status.textContent=activeFighterVersion+' · IK gait active';
 }catch(error){
  console.error('Articulated fighter unavailable; restoring legacy GLB:',error);
  articulated=null;character=null;
 }
}
const fighterCandidates=fighterLoadOrder({experimental:requestedFighter==='pass43',stable:requestedFighter==='pass32'})
 .map(path=>fighterSources.get(path));

function loadFighter(index=0){
 if(articulated)return;
 const candidate=fighterCandidates[index];
 if(!candidate){status.textContent='No valid fighter GLB available';return;}
 function tryFallback(reason){
  console.error('ROJ fighter rejected:',candidate.label,reason);
  if(index+1<fighterCandidates.length){
   status.textContent=candidate.label+' unavailable · trying backup';
   loadFighter(index+1);
  }else status.textContent='Fighter GLB load failed: '+String(reason);
 }
 loader.load(candidate.url,gltf=>{
  const loaded=new Map();
  for(const clip of gltf.animations){
   const label=clip.name.split('/').at(-1).trim().toLowerCase().replaceAll(' ','_');
   loaded.set(label,clip);
  }
  const missing=clipNames.filter(x=>!loaded.has(x));
  if(missing.length){tryFallback('Missing clips: '+missing.join(', '));return;}
  // Require an actual skinned humanoid and the known Pass 45 bone hierarchy
  // before replacing the already visible character; invalid assets fall back.
  if(candidate.path===FIGHTER_ASSETS.preferred){
   let skinnedMeshes=0;const bones=new Set();
   gltf.scene.traverse(o=>{if(o.isSkinnedMesh)skinnedMeshes++;if(o.isBone)bones.add(o.name);});
   if(!skinnedMeshes||['root','pelvis','spine','chest','neck','head','l_forearm','r_forearm','l_shin','r_shin'].some(name=>!bones.has(name))){
    tryFallback('Pass 45 skinned anatomy missing');return;
   }
  }
  if(candidate.path===FIGHTER_ASSETS.experimental){
   const hinges=new Set();
   gltf.scene.traverse(o=>{if(o.isBone&&['l_elbow','r_elbow','l_knee','r_knee'].includes(o.name))hinges.add(o.name);});
   if(hinges.size!==4){tryFallback('Pass 43 elbow/knee bones absent');return;}
  }
  if(character){scene.remove(character);mixer?.stopAllAction();}
  character=gltf.scene;
  character.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  scene.add(character);mixer=new THREE.AnimationMixer(character);
  headLook=createHeadLook(character);actions=new Map();current='';
  for(const [label,clip] of loaded)actions.set(label,mixer.clipAction(clip));
  setFighterAsset(engine,candidate.path);
  activeFighterVersion=candidate.label;
  status.textContent=activeFighterVersion+' · 16 animations loaded';
 },undefined,error=>tryFallback(error?.message||String(error)));
}
if(!articulated)loadFighter();
function animate(name){
 if(!mixer||current===name)return;
 const next=actions.get(name);if(!next)return;
 const prior=actions.get(current);
 if(prior)prior.fadeOut(.15);
 next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(.15).play();
 current=name;
}
const clock=new THREE.Clock();
function reset(){
 motion.reset();fixed.reset();state=motion.getState();
 controller.reset();controllerResult={blocking:false,intent:{sprint:false}};
 heavyLandingUntil=0;current='';
 combat=createCombatState();strikeFlash=0;receivedFlash=0;
 foe.position.copy(foeSpawn);foe.visible=true;relic.visible=false;
 if(character)character.position.set(0,0,0);
 mixer?.stopAllAction();headLook?.reset();articulated?.reset();
 // Keep user's preferred yaw/pitch/zoom on restart.
 keys.clear();pressed.clear();
}
function collisionCameraDistance(){
 const aim=shoulderTarget(cameraState,cameraState.focus);
 focusVec.set(aim.x,aim.y,aim.z);
 const wish=desiredCameraPosition(cameraState,cameraState.focus);
 wishVec.set(wish.x,wish.y,wish.z);rayDirection.copy(wishVec).sub(focusVec);
 const length=rayDirection.length();if(length<.001)return cameraState.distance;
 cameraRay.set(focusVec,rayDirection.multiplyScalar(1/length));cameraRay.near=.1;cameraRay.far=length;
 const hits=cameraRay.intersectObjects([stones,dummy],true);
 return hits.length?Math.max(cameraState.minDistance,hits[0].distance-cameraState.collisionPadding):cameraState.distance;
}
function frame(){
 requestAnimationFrame(frame);
 const dt=clamp(clock.getDelta(),0,.1),now=performance.now()/1000;
 if(pressed.has('r')){reset();}
 if(pressed.has('v')){cameraState.yaw=state.heading;pressed.delete('v');}
 if(pressed.has('e')){
  if(claimRelic(combat,Math.hypot(state.x-relic.position.x,state.z-relic.position.z)))relic.visible=false;
  pressed.delete('e');
 }
 const crouch=keys.has('c'),sprint=keys.has('shift')&&!crouch;
 const input={forward:keys.has('w'),backward:keys.has('s'),left:keys.has('a'),right:keys.has('d'),
  sprint,crouch,block:keys.has('q'),cameraYaw:cameraState.yaw};
 let wasHeavyLanding=false;
 const {steps}=fixed.advance(dt,stepDt=>{
  const before=state;
  controllerResult=controller.tick({...input,jumpPressed:pressed.has(' '),
   dodgePressed:pressed.has('alt'),attackPressed:pressed.has('f')},stepDt,
   {motion:state,combatResult:combat.result});
  state=motion.tick(controllerResult.intent,stepDt);
  if(controllerResult.strike){
   const dx=foe.position.x-state.x,dz=foe.position.z-state.z;
   const range=Math.hypot(dx,dz);
   const forwardX=-Math.sin(state.heading),forwardZ=-Math.cos(state.heading);
   const facing=range<.001||(dx*forwardX+dz*forwardZ)/range>0.05;
   const strike=playerStrike(combat,now,facing?range:Infinity);
   if(strike.hit)strikeFlash=.2;
  }
  if(!before.grounded&&state.grounded&&before.vy<-6)wasHeavyLanding=true;
  pressed.delete(' ');pressed.delete('alt');pressed.delete('f');
  engine.tick(stepDt);
 });
 if(wasHeavyLanding)heavyLandingUntil=now+.34;
 // A readable, bounded opponent: approach the player, face them, then strike.
 const dx=state.x-foe.position.x,dz=state.z-foe.position.z;
 const gap=Math.hypot(dx,dz);
 if(combat.result==='active'){
  if(gap>1.55&&gap<30){
   const speed=Math.min((gap-1.55)/Math.max(dt,.0001),1.35);
   foe.position.x+=dx/gap*speed*dt;
   foe.position.z+=dz/gap*speed*dt;
  }
  if(gap>.001)foe.rotation.y=Math.atan2(dx,dz);
  const hit=enemyStrike(combat,now,gap,controllerResult.blocking);
  if(hit.hit)receivedFlash=.3;
 }
 strikeFlash=Math.max(0,strikeFlash-dt);
 receivedFlash=Math.max(0,receivedFlash-dt);
 enemyHealthFill.scale.x=Math.max(.001,combat.enemyHealth/100);
 enemyHealthFill.position.x=-(1-combat.enemyHealth/100)*.58;
 enemyHealthBack.quaternion.copy(camera.quaternion);
 enemyHealthFill.quaternion.copy(camera.quaternion);
 foe.visible=combat.enemyHealth>0;
 if(combat.result==='victory'){
  relic.position.set(foe.position.x,1.0+Math.sin(now*2)*.15,foe.position.z);
  relic.rotation.y+=dt*1.2;relic.visible=true;
 }else if(combat.result!=='active')relic.visible=false;
 const combatLabel=combat.result==='complete'?'RELIC SECURED — R to replay':
  combat.result==='victory'?'RIVAL DEFEATED — collect relic with E':
  combat.result==='defeat'?'DEFEAT — R to retry':
  'Health '+combat.playerHealth+' / 100 · Rival '+combat.enemyHealth+' / 100'+
  (receivedFlash>0?' · HIT!':strikeFlash>0?' · STRIKE!':'');
 if(combatStatus.textContent!==combatLabel)combatStatus.textContent=combatLabel;
 const staminaLabel='Stamina '+Math.ceil(controller.getState().stamina)+' / '+controller.getState().maxStamina;
 if(staminaStatus.textContent!==staminaLabel)staminaStatus.textContent=staminaLabel;
 // If <1/60s elapsed, keep jump/dodge edges queued until simulation advances.
 if(steps>0){pressed.clear();}
 const desired=controller.animation(state,{crouch,sprint:controllerResult.intent.sprint},now<heavyLandingUntil);
 if(!articulated)animate(desired);
 if(character){
  character.position.set(state.x,state.y,state.z);
  character.rotation.y=state.heading;
 }
 headLook?.beforeAnimation();
 if(articulated)articulated.update({dt,state,action:desired});
 else mixer?.update(dt);
 headLook?.afterAnimation({cameraYaw:cameraState.yaw,cameraPitch:cameraState.pitch,
  bodyHeading:state.heading,action:desired,locked:pointer.locked||pointer.dragging,dt});
 updateCamera(cameraState,state,dt);
 const distance=resolveCameraDistance(cameraState,collisionCameraDistance(),dt);
 if(distance<cameraState.distance){
  const limited=desiredCameraPosition(cameraState,cameraState.focus,distance);
  cameraState.position.x=limited.x;cameraState.position.y=limited.y;cameraState.position.z=limited.z;
 }
 const pose=cameraPose(cameraState);
 camera.position.set(pose.position.x,pose.position.y,pose.position.z);
 camera.lookAt(pose.target.x,pose.target.y,pose.target.z);
 if(character){
  const label='Model: '+activeFighterVersion+' · Action: '+desired+' · Clips: '+(articulated?'procedural gait':actions.size)+
   ' · Grounded: '+state.grounded+' · Head: '+(headLook?'tracked':'camera only');
  if(status.textContent!==label)status.textContent=label;
 }
 renderer.render(scene,camera);
}
frame();
addEventListener('resize',()=>{
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
});

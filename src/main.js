import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createGameEngine } from './engine.js';
import { createState, step, config } from '../experiments/roj-0003/movement.js';
import { createCameraState, orbitCamera, zoomCamera, updateCamera, desiredCameraPosition, cameraPose, clamp } from './movement/third-person-camera.js';

// ROJ-0007: NexusEngine owns Actor/Creature/Player composition; this browser
// adapter retains ROJ-0003 movement until ROJ-0005 Motion/Contact is integrated.
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

let state=createState(),character=null,mixer=null,actions=new Map(),current='',actionUntil=0,health=100;
const keys=new Set(),pressed=new Set();
const cameraState=createCameraState(),cameraRay=new THREE.Raycaster();
const focusVec=new THREE.Vector3(),wishVec=new THREE.Vector3(),rayDirection=new THREE.Vector3();
let orbitDragging=false,lastPointerX=0,lastPointerY=0;
function releaseInput(){keys.clear();pressed.clear();orbitDragging=false;}
addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
 if(!keys.has(k))pressed.add(k);keys.add(k);
});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('blur',releaseInput);
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseInput();});
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
renderer.domElement.addEventListener('pointerdown',e=>{
 if(e.button!==2)return;
 e.preventDefault();orbitDragging=true;lastPointerX=e.clientX;lastPointerY=e.clientY;
 try{renderer.domElement.setPointerCapture(e.pointerId);}catch{}
});
renderer.domElement.addEventListener('pointermove',e=>{
 if(!orbitDragging)return;
 if(!(e.buttons&2)){orbitDragging=false;return;}
 orbitCamera(cameraState,e.clientX-lastPointerX,e.clientY-lastPointerY);
 lastPointerX=e.clientX;lastPointerY=e.clientY;
});
renderer.domElement.addEventListener('pointerup',e=>{if(e.button===2)orbitDragging=false;});
renderer.domElement.addEventListener('pointercancel',()=>{orbitDragging=false;});
renderer.domElement.addEventListener('lostpointercapture',()=>{orbitDragging=false;});
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();zoomCamera(cameraState,e.deltaY);},{passive:false});

const hud=document.createElement('div');
hud.style.cssText='position:fixed;left:18px;top:18px;max-width:440px;color:#f3e9d8;background:#111c22dd;border-left:3px solid #b68e57;padding:14px 18px;font:13px/1.55 system-ui;pointer-events:none';
hud.innerHTML='<strong style="font-size:18px">RELICS OF JOTUNHEIM</strong><div>ROJ-0007 · Camera-relative third-person movement</div><div>WASD move · Right-mouse drag orbit · Wheel zoom · V recenter</div><div>Shift sprint · C crouch · Space jump · Alt dodge</div><div>Q block · F attack · R restart</div><div id="roj-status">Loading NexusEngine-authored fighter…</div><small>Actor registry: NexusEngine · Motion: ROJ-0003 compatibility adapter</small>';
host.appendChild(hud);
const status=hud.querySelector('#roj-status');
const clipNames=['walk','idle','run','jump','land','dodge','crouch_idle','crouch_walk','strafe_left','strafe_right','backward_walk','sprint','fall','heavy_landing','block','light_attack'];
const loader=new GLTFLoader();
const fighterV3Url=new URL('../assets/glb/fighter-anatomical-pass32-REVIEW.glb',import.meta.url).href;
const fighterV2Url=new URL('../assets/glb/fighter-rigged-v2.glb',import.meta.url).href;
let activeFighterVersion='loading';
function loadFighter(url,isV3){
 loader.load(url,gltf=>{
  const loaded=new Map();
  for(const clip of gltf.animations){
   const label=clip.name.split('/').at(-1).trim().toLowerCase().replaceAll(' ','_');
   loaded.set(label,clip);
  }
  const missing=clipNames.filter(x=>!loaded.has(x));
  if(missing.length){
   console.error('ROJ fighter missing clips:',missing);
   if(isV3){loadFighter(fighterV2Url,false);return;}
   status.textContent='Missing animation clips: '+missing.join(', ');return;
  }
  character=gltf.scene;
  character.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  scene.add(character);mixer=new THREE.AnimationMixer(character);actions=new Map();
  for(const [label,clip] of loaded)actions.set(label,mixer.clipAction(clip));
  activeFighterVersion=isV3?'v3 feedback':'v2 fallback';
  status.textContent=activeFighterVersion+' · 16 animations loaded';
 },undefined,error=>{
  console.error('ROJ fighter GLB load error:',error);
  if(isV3){status.textContent='v3 unavailable · loading v2 fallback';loadFighter(fighterV2Url,false);}
  else status.textContent='Fighter GLB load failed: '+(error?.message||String(error));
 });
}
loadFighter(fighterV3Url,true);
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
 state=createState();actionUntil=0;health=100;current='';
 if(character)character.position.set(0,0,0);
 if(mixer)mixer.stopAllAction();
 // Keep camera yaw, pitch and distance on reset so the player's chosen view persists.
 releaseInput();
}
function collisionCameraDistance(){
 focusVec.set(cameraState.focus.x,cameraState.focus.y,cameraState.focus.z);
 const wish=desiredCameraPosition(cameraState,cameraState.focus);
 wishVec.set(wish.x,wish.y,wish.z);rayDirection.copy(wishVec).sub(focusVec);
 const length=rayDirection.length();if(length<.001)return cameraState.distance;
 cameraRay.set(focusVec,rayDirection.multiplyScalar(1/length));cameraRay.near=.1;cameraRay.far=length;
 // World objects are currently the only camera occluders; do not raycast the fighter.
 const hits=cameraRay.intersectObjects([stones,dummy],true);
 return hits.length?Math.max(.8,hits[0].distance-cameraState.collisionPadding):cameraState.distance;
}
function frame(){
 requestAnimationFrame(frame);
 const dt=Math.min(clock.getDelta(),.04),now=performance.now()/1000;
 if(pressed.has('r'))reset();
 if(pressed.has('v'))cameraState.yaw=state.heading;
 const crouch=keys.has('c'),sprint=keys.has('shift')&&!crouch;
 const input={forward:keys.has('w'),backward:keys.has('s'),left:keys.has('a'),right:keys.has('d'),
  sprint,cameraYaw:cameraState.yaw,jumpPressed:pressed.has(' '),dodgePressed:pressed.has('alt')};
 const speedLimit=crouch?{...config,walk:1.65,run:1.65}:config;
 const wasAir=!state.grounded,previousVy=state.vy;
 step(state,input,dt,speedLimit);
 const radius=Math.hypot(state.x,state.z);
 if(radius>17.5){const k=17.5/radius;state.x*=k;state.z*=k;state.vx*=.3;state.vz*=.3;}
 if(wasAir&&state.grounded&&previousVy<-6)actionUntil=Math.max(actionUntil,now+.34);
 let desired='idle';
 if(pressed.has('f')){desired='light_attack';actionUntil=now+.48;}
 else if(keys.has('q'))desired='block';
 else if(state.dodgeRemaining>0)desired='dodge';
 else if(!state.grounded)desired=state.vy<0?'fall':'jump';
 else if(wasAir&&previousVy<-6)desired='heavy_landing';
 else if(state.landingRemaining>0)desired='land';
 else if(crouch)desired=(Math.hypot(state.vx,state.vz)>.25?'crouch_walk':'crouch_idle');
 else if(sprint&&Math.hypot(state.vx,state.vz)>4)desired='sprint';
 // Free-movement actor faces travel, so legacy backward/strafe clips are not
 // selected from keys alone. Directional animation is reserved for target lock.
 else desired=state.animation;
 if(now<actionUntil&&current==='light_attack')desired='light_attack';
 animate(desired);
 if(character){character.position.set(state.x,state.y,state.z);character.rotation.y=state.heading;}
 if(mixer)mixer.update(dt);
 updateCamera(cameraState,state,dt);
 // Solve occlusion after smoothing the follow focus, not from a fixed world offset.
 const distance=collisionCameraDistance();
 if(distance<cameraState.distance){
  const limited=desiredCameraPosition(cameraState,cameraState.focus,distance);
  cameraState.position.x=limited.x;cameraState.position.y=limited.y;cameraState.position.z=limited.z;
 }
 const pose=cameraPose(cameraState);
 camera.position.set(pose.position.x,pose.position.y,pose.position.z);
 camera.lookAt(pose.target.x,pose.target.y,pose.target.z);
 if(character)status.textContent='Model: '+activeFighterVersion+' · Action: '+desired+' · Clips: '+actions.size+' · Grounded: '+state.grounded;
 pressed.clear();engine.tick(dt);renderer.render(scene,camera);
}
frame();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

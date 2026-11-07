import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createGameEngine } from './engine.js';
import { createState, step, config } from '../experiments/roj-0003/movement.js';

// ROJ-0004: playable presentation/interaction preview.
// Actor possession is NexusEngine-owned; temporary movement integration still
// uses the isolated ROJ-0003 simulation, NOT an asserted Motion/Physics Kit.
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
addEventListener('keydown',e=>{if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase()))e.preventDefault();
 const k=e.key.toLowerCase();if(!keys.has(k))pressed.add(k);keys.add(k);});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('blur',()=>{keys.clear();pressed.clear();});
const hud=document.createElement('div');hud.style.cssText='position:fixed;left:18px;top:18px;max-width:440px;color:#f3e9d8;background:#111c22dd;border-left:3px solid #b68e57;padding:14px 18px;font:13px/1.55 system-ui;pointer-events:none';
hud.innerHTML='<strong style="font-size:18px">RELICS OF JOTUNHEIM</strong><div>ROJ-0004 · Articulated fighter preview</div><div>WASD move · Shift sprint · C crouch · Space jump</div><div>Alt dodge · Q block · F attack · R restart</div><div id="roj-status">Loading NexusEngine-authored fighter…</div><small>Actor registry: NexusEngine · Motion: experimental adapter</small>';
host.appendChild(hud);
const status=hud.querySelector('#roj-status');
const clipNames=['walk','idle','run','jump','land','dodge','crouch_idle','crouch_walk','strafe_left','strafe_right','backward_walk','sprint','fall','heavy_landing','block','light_attack'];
const aliases=Object.fromEntries(clipNames.map(n=>[n,n.replaceAll('_',' ').toLowerCase()]));
const loader=new GLTFLoader();
loader.load(new URL('../assets/glb/fighter-rigged-v2.glb',import.meta.url).href,gltf=>{
 character=gltf.scene;character.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 scene.add(character);mixer=new THREE.AnimationMixer(character);
 for(const clip of gltf.animations){const label=clip.name.split('/').at(-1).trim().toLowerCase().replaceAll(' ','_');actions.set(label,mixer.clipAction(clip));}
 const missing=clipNames.filter(x=>!actions.has(x));
 if(missing.length){status.textContent='Missing animation clips: '+missing.join(', ');throw Error(status.textContent);}
 status.textContent='16 animations loaded · fighter ready';
},undefined,error=>{status.textContent='GLB load failed: '+error.message;console.error(error);});
function animate(name){
 if(!mixer||current===name)return;
 const next=actions.get(name);if(!next)return;
 const prior=actions.get(current);
 if(prior)prior.fadeOut(.15);
 next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(.15).play();
 current=name;
}
const clock=new THREE.Clock();
function reset(){state=createState();actionUntil=0;health=100;current='';if(character)character.position.set(0,0,0);if(mixer)mixer.stopAllAction();}
function frame(){
 requestAnimationFrame(frame);
 const dt=Math.min(clock.getDelta(),.04),now=performance.now()/1000;
 if(pressed.has('r'))reset();
 const crouch=keys.has('c'),sprint=keys.has('shift')&&!crouch;
 const input={forward:keys.has('w'),backward:keys.has('s'),left:keys.has('a'),right:keys.has('d'),
   sprint,cameraYaw:0,jumpPressed:pressed.has(' '),dodgePressed:pressed.has('alt')};
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
 else if(input.backward)desired='backward_walk';
 else if(input.left&&!input.forward&&!input.right)desired='strafe_left';
 else if(input.right&&!input.forward&&!input.left)desired='strafe_right';
 else if(sprint&&Math.hypot(state.vx,state.vz)>4)desired='sprint';
 else desired=state.animation;
 if(now<actionUntil&&current==='light_attack')desired='light_attack';
 animate(desired);
 if(character){
  character.position.set(state.x,state.y,state.z);
  character.rotation.y=state.heading;
 }
 if(mixer)mixer.update(dt);
 camera.position.lerp(new THREE.Vector3(state.x+2.8,state.y+2.85,state.z+6.4),Math.min(1,dt*6));
 camera.lookAt(state.x,state.y+1.35,state.z-.7);
 if(character)status.textContent='Action: '+desired+' · Clips: '+actions.size+' · Grounded: '+state.grounded;
 pressed.clear();
 engine.tick(dt);renderer.render(scene,camera);
}
frame();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

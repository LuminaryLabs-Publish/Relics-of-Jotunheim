import { createEngine } from 'nexusengine';
import { createActorDomain } from 'nexusengine/domains/actor';
import {
 createSimulationKit,createPhysicsKit,createMotionKit,createActionLocomotionKit,
 createWorldContactKit,createLocomotionContactResponseAdapterKit
} from 'nexusengine/domains/simulation';
import { createTwoBoneIKKit } from 'nexusengine/domains/simulation/motion/two-bone-ik';
import { FIGHTER_ASSETS } from './gameplay/fighter-assets.js';

export function createGameEngine(){
 const engine=createEngine({kits:[
  ...createActorDomain(),createSimulationKit(),createPhysicsKit(),createMotionKit(),
  createActionLocomotionKit({actorId:'roj-fighter'}),
  createWorldContactKit({groundOffset:0,bounds:{minX:-18,maxX:18,minZ:-18,maxZ:18}}),
  createLocomotionContactResponseAdapterKit(),createTwoBoneIKKit()
 ]});
 const ref=descriptorId=>({provider:'nexusengine-authoring-glb',descriptorId});
 engine.n.creature.register({
  id:'roj-fighter-creature',archetype:'humanoid-warrior',
  body:ref(FIGHTER_ASSETS.preferred),rig:ref('fighter-rig'),
  support:{kind:'bones',boneIds:['l_shin','r_shin'],fallback:'bounds-minimum'},
  capabilities:['walk','run','sprint','jump','crouch','dodge','block','attack']
 });
 engine.n.character.create({id:'roj-fighter',creatureId:'roj-fighter-creature',status:'active'});
 engine.n.player.register({id:'local-player',characterId:'roj-fighter',controlStatus:'enabled'});
 if(engine.n.player.getControlledCharacter('local-player')?.character?.id!=='roj-fighter')
  throw new Error('ROJ player possession failed');
 if(!engine.n.motion?.commitMotionFrame||!engine.n.twoBoneIk?.solveTwoBoneIK)
  throw new Error('ROJ native Motion/IK Kit composition missing');
 return engine;
}
export function setFighterAsset(engine,asset){
 if(!Object.values(FIGHTER_ASSETS).includes(asset))throw new RangeError('Unknown fighter GLB');
 const current=engine.n.creature.get('roj-fighter-creature');
 if(!current)throw new Error('Fighter descriptor missing');
 if(current.body.descriptorId!==asset)engine.n.creature.replace({...current,body:{...current.body,descriptorId:asset}});
 return engine.n.creature.get('roj-fighter-creature');
}

import { createEngine } from 'nexusengine';
import { createActorDomain } from 'nexusengine/domains/actor';

export function createGameEngine() {
  const engine=createEngine({kits:createActorDomain()});
  const ref=(descriptorId)=>({provider:'nexusengine-authoring-glb',descriptorId});
  engine.n.creature.register({
    id:'roj-fighter-creature',archetype:'humanoid-warrior',
    body:ref('assets/glb/fighter-rigged-v2.glb'),rig:ref('fighter-rig'),
    support:{kind:'bones',boneIds:['l_shin','r_shin'],fallback:'bounds-minimum'},
    capabilities:['walk','run','sprint','jump','crouch','dodge','block','attack']
  });
  engine.n.character.create({id:'roj-fighter',creatureId:'roj-fighter-creature',status:'active'});
  engine.n.player.register({id:'local-player',characterId:'roj-fighter',controlStatus:'enabled'});
  if(engine.n.player.getControlledCharacter('local-player')?.character?.id!=='roj-fighter')
    throw new Error('ROJ player possession failed');
  return engine;
}

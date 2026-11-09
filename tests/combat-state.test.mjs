import test from 'node:test';
import assert from 'node:assert/strict';
import {createCombatState,playerStrike,enemyStrike,claimRelic,COMBAT_RULES} from '../src/gameplay/combat-state.js';
test('player cannot spam attacks, and range matters',()=>{
 const s=createCombatState();
 assert.equal(playerStrike(s,1,9).hit,false);
 assert.equal(s.enemyHealth,100);
 assert.equal(playerStrike(s,1.1,1).started,false);
 assert.equal(playerStrike(s,2,2).hit,true);
 assert.equal(s.enemyHealth,76);
});
test('enemy can be defeated and remains defeated',()=>{
 const s=createCombatState();
 for(let t=1;t<=5;t++)playerStrike(s,t,1);
 assert.equal(s.enemyHealth,0);
 assert.equal(s.result,'victory');
 assert.equal(enemyStrike(s,10,1).hit,false);
});
test('block reduces incoming damage and restart starts clean',()=>{
 const s=createCombatState();
 assert.equal(enemyStrike(s,1,1,true).damage,Math.round(COMBAT_RULES.enemyDamage*COMBAT_RULES.blockMultiplier));
 assert.equal(enemyStrike(s,1.1,1).hit,false);
 assert.equal(enemyStrike(s,3,1,false).damage,12);
 assert.equal(createCombatState().playerHealth,100);
});
test('defeat prevents any further hits',()=>{
 const s=createCombatState();
 for(let t=1;t<20;t+=2)enemyStrike(s,t,1);
 assert.equal(s.result,'defeat');
 assert.equal(playerStrike(s,40,1).started,false);
});

test('relic can only be collected after victory, at close range',()=>{
 const s=createCombatState();
 assert.equal(claimRelic(s,1),false);
 for(let t=1;t<=5;t++)playerStrike(s,t,1);
 assert.equal(claimRelic(s,5),false);
 assert.equal(claimRelic(s,1),true);
 assert.equal(s.result,'complete');
 assert.equal(s.relicClaimed,true);
});

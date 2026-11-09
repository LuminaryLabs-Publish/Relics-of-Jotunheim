// ROJ combat prototype: deterministic rules; presentation and contact are separate.
export const COMBAT_RULES=Object.freeze({
  playerMaxHealth:100,enemyMaxHealth:100,attackRange:2.65,
  attackDamage:24,attackCooldown:0.58,enemyRange:1.85,
  enemyDamage:12,enemyCooldown:1.35,blockMultiplier:0.2
});
export function createCombatState(){
 return {playerHealth:COMBAT_RULES.playerMaxHealth,enemyHealth:COMBAT_RULES.enemyMaxHealth,
  nextPlayerAttack:0,nextEnemyAttack:0,lastHit:'',result:'active',hits:0};
}
export function playerStrike(combat,now,distance){
 if(combat.result!=='active'||now<combat.nextPlayerAttack)
  return {hit:false,started:false,reason:'cooldown'};
 combat.nextPlayerAttack=now+COMBAT_RULES.attackCooldown;
 const hit=Number.isFinite(distance)&&distance<=COMBAT_RULES.attackRange;
 if(hit){
  combat.enemyHealth=Math.max(0,combat.enemyHealth-COMBAT_RULES.attackDamage);
  combat.lastHit='enemy';combat.hits++;
  if(combat.enemyHealth===0)combat.result='victory';
 }
 return {hit,started:true,reason:hit?'contact':'out-of-range'};
}
export function enemyStrike(combat,now,distance,blocking=false){
 if(combat.result!=='active'||now<combat.nextEnemyAttack||distance>COMBAT_RULES.enemyRange)
  return {hit:false,damage:0};
 const damage=Math.round(COMBAT_RULES.enemyDamage*(blocking?COMBAT_RULES.blockMultiplier:1));
 combat.playerHealth=Math.max(0,combat.playerHealth-damage);
 combat.nextEnemyAttack=now+COMBAT_RULES.enemyCooldown;
 combat.lastHit='player';
 if(combat.playerHealth===0)combat.result='defeat';
 return {hit:true,damage};
}

// ROJ-0012: rig-independent, deterministic action arbitration.
// NexusEngine/player-motion remains the sole owner of physical motion and contact.
export const PLAYER_ACTION_RULES = Object.freeze({
  maxStamina: 100, dodgeCost: 25, attackCost: 15,
  sprintDrain: 12, blockDrain: 8, regenRate: 18, regenDelay: .65,
  inputBuffer: .12, attackWindup: .12, attackActive: .16,
  attackRecovery: .30, attackCooldown: .58, stunDuration: .35
});
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
export function createPlayerActionController(config = {}) {
  const rules = { ...PLAYER_ACTION_RULES, ...config };
  let stamina, regenWait, attackPhase, attackTime, attackCooldown;
  let attackBuffer, dodgeBuffer, stunTime, attackDispatched, action, reason;
  function reset() {
    stamina = rules.maxStamina; regenWait = 0; attackPhase = 'none'; attackTime = 0;
    attackCooldown = 0; attackBuffer = 0; dodgeBuffer = 0; stunTime = 0;
    attackDispatched = false; action = 'idle'; reason = '';
  }
  function clearBuffers() { attackBuffer = 0; dodgeBuffer = 0; }
  function stun(seconds = rules.stunDuration) {
    stunTime = Math.max(stunTime, seconds); clearBuffers();
    attackPhase = 'none'; attackTime = 0; attackDispatched = false;
  }
  function getState() {
    return { stamina, maxStamina: rules.maxStamina, regenWait, attackPhase,
      attackCooldown, attackBuffer, dodgeBuffer, stunTime, action, reason };
  }
  function tick(input = {}, dt = 1 / 60, context = {}) {
    const delta = clamp(Number.isFinite(dt) ? dt : 0, 0, 1 / 30);
    const motion = context.motion || {};
    const alive = context.combatResult !== 'defeat' && context.combatResult !== 'complete' && context.combatResult !== 'victory';
    const grounded = !!motion.grounded;
    const busyDodge = (motion.dodgeRemaining || 0) > 0;
    const previousPhase = attackPhase;
    reason = '';
    attackCooldown = Math.max(0, attackCooldown - delta);
    stunTime = Math.max(0, stunTime - delta);
    if (input.attackPressed && alive) attackBuffer = rules.inputBuffer;
    if (input.dodgePressed && alive) dodgeBuffer = rules.inputBuffer;
    let strike = false, dodgePressed = false;
    if (!alive || stunTime > 0) {
      clearBuffers(); attackPhase = 'none'; attackTime = 0;
      attackDispatched = false;
    } else {
      if (attackPhase !== 'none') {
        attackTime += delta;
        if (attackPhase === 'windup' && attackTime >= rules.attackWindup) {
          attackPhase = 'active'; attackTime -= rules.attackWindup;
        }
        if (attackPhase === 'active' && !attackDispatched) {
          strike = true; attackDispatched = true;
        }
        if (attackPhase === 'active' && attackTime >= rules.attackActive) {
          attackPhase = 'recovery'; attackTime -= rules.attackActive;
        }
        if (attackPhase === 'recovery' && attackTime >= rules.attackRecovery) {
          attackPhase = 'none'; attackTime = 0;
        }
      }
      // Dodge takes priority over starting attacks; an active attack cannot be cancelled.
      if (attackPhase === 'none' && !busyDodge && stunTime === 0) {
        if (dodgeBuffer > 0 && grounded && (motion.dodgeCooldown || 0) <= 0) {
          if (stamina >= rules.dodgeCost) {
            stamina -= rules.dodgeCost; regenWait = rules.regenDelay;
            dodgePressed = true; dodgeBuffer = 0;
          } else { reason = 'insufficient-stamina-dodge'; dodgeBuffer = 0; }
        } else if (attackBuffer > 0 && attackCooldown <= 0) {
          if (stamina >= rules.attackCost) {
            stamina -= rules.attackCost; regenWait = rules.regenDelay;
            attackPhase = 'windup'; attackTime = 0; attackDispatched = false;
            attackCooldown = rules.attackCooldown; attackBuffer = 0;
          } else { reason = 'insufficient-stamina-attack'; attackBuffer = 0; }
        }
      }
    }
    // Newly pressed inputs remain eligible for this tick, then expire predictably.
    attackBuffer = Math.max(0, attackBuffer - delta);
    dodgeBuffer = Math.max(0, dodgeBuffer - delta);
    const attacking = attackPhase !== 'none';
    const blocking = alive && stunTime <= 0 && !attacking && !busyDodge && !dodgePressed && grounded &&
      !!input.block && stamina > 0;
    const sprint = alive && stunTime <= 0 && !attacking && !blocking && !busyDodge && !dodgePressed &&
      !!input.sprint && !input.crouch && stamina > 0;
    const spend = (blocking ? rules.blockDrain : 0) + (sprint ? rules.sprintDrain : 0);
    if (spend > 0) {
      stamina = Math.max(0, stamina - spend * delta); regenWait = rules.regenDelay;
    } else if (regenWait > 0) {
      regenWait = Math.max(0, regenWait - delta);
    } else {
      stamina = Math.min(rules.maxStamina, stamina + rules.regenRate * delta);
    }
    action = !alive ? (context.combatResult === 'defeat' ? 'dead' : 'idle') :
      stunTime > 0 ? 'stunned' : busyDodge || dodgePressed ? 'dodge' :
      attacking ? 'light_attack' : blocking ? 'block' : 'locomotion';
    const intent = {
      ...input, sprint, dodgePressed, jumpPressed: alive && stunTime <= 0 &&
        !attacking && !busyDodge && !dodgePressed && !!input.jumpPressed,
      lockFacing: blocking || attacking || !!input.lockFacing
    };
    return { intent, strike, blocking, action, reason, phaseChanged: attackPhase !== previousPhase };
  }
  function animation(motion = {}, input = {}, heavyLanding = false) {
    if (action === 'dead' || action === 'stunned') return 'idle'; // until dedicated clips exist
    if (action !== 'locomotion') return action;
    if (!motion.grounded) return motion.vy < 0 ? 'fall' : 'jump';
    if (heavyLanding) return 'heavy_landing';
    if ((motion.landingRemaining || 0) > 0) return 'land';
    if (input.crouch) return Math.hypot(motion.vx || 0, motion.vz || 0) > .25 ? 'crouch_walk' : 'crouch_idle';
    if (input.sprint && Math.hypot(motion.vx || 0, motion.vz || 0) > 4) return 'sprint';
    return motion.animation || 'idle';
  }
  reset();
  return { tick, getState, reset, stun, clearBuffers, animation };
}

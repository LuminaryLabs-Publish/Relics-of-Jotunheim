import { createEngine } from 'nexusengine';

/** Project-owned runtime composition; no fabricated Domain/Service/Kit registrations. */
export function createGameEngine() {
  return createEngine();
}

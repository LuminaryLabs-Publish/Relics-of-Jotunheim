import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
test('scenario defines relic limit and ordinary fighters', () => {
  const d = json('../game/definition/hymirs-pursuit.json');
  assert.equal(d.relicTypeLimit, 2);
  assert.equal(d.playerPower, 'no-inherent-supernatural-powers');
  assert.equal(d.prototype.players, 4);
});
test('project pins NexusEngine commit', () => {
  const p = json('../package.json');
  assert.match(p.dependencies.nexusengine, /#[0-9a-f]{40}$/);
});
test('runtime composes real NexusEngine createEngine', () => {
  const source = readFileSync(new URL('../src/engine.js', import.meta.url), 'utf8');
  assert.match(source, /import \{ createEngine \} from 'nexusengine'/);
  assert.match(source, /return createEngine\(\)/);
});

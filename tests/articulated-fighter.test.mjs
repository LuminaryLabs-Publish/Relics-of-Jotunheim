import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/animation/articulated-fighter.js',import.meta.url),'utf8');
test('articulated fighter has separated knees, ankles and elbows',()=>{
 for(const suffix of ['thigh','shin','foot','upper_arm','forearm','hand'])
  for(const side of ['l','r'])
   assert.match(source,new RegExp("side\\+'_("+suffix+")'"));
 assert.match(source,/new THREE\.SkinnedMesh/);
 assert.match(source,/skinWeight/);
 assert.match(source,/solveLeg/);
});
test('gait has phase-locked stride and foot targets',()=>{
 assert.match(source,/phaseSpeed/);
 assert.match(source,/gaitTargets\(phase/);
 assert.match(source,/ankle:-hip-knee/);
 assert.match(source,/locomoting/);
});

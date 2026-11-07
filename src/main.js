import * as THREE from 'three';
import { createGameEngine } from './engine.js';

const engine = createGameEngine();
const host = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
host.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#7d929b');
scene.fog = new THREE.Fog('#7d929b', 25, 95);
const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 180);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshStandardMaterial({ color: '#6f7773', roughness: 1 }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);
const fighter = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.1, 5, 10), new THREE.MeshStandardMaterial({ color: '#b83b38' }));
fighter.position.y = 1;
scene.add(fighter);
scene.add(new THREE.HemisphereLight('#ffffff', '#4b5860', 2));
const light = new THREE.DirectionalLight('#ffffff', 2.4);
light.position.set(6, 15, 8);
scene.add(light);
const keys = new Set();
window.addEventListener('keydown', event => keys.add(event.key.toLowerCase()));
window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
const label = document.createElement('div');
label.textContent = 'RELICS OF JOTUNHEIM · ROJ-0001 · ENGINE SMOKE SCENE · WASD VISUAL PLACEHOLDER';
label.style.cssText = 'position:fixed;top:16px;left:16px;padding:10px 14px;background:#111b;color:#fff;font:12px system-ui;letter-spacing:.06em';
host.appendChild(label);
let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  const x = Number(keys.has('d')) - Number(keys.has('a'));
  const z = Number(keys.has('s')) - Number(keys.has('w'));
  const length = Math.hypot(x, z) || 1;
  fighter.position.x = THREE.MathUtils.clamp(fighter.position.x + x / length * 5 * dt, -24, 24);
  fighter.position.z = THREE.MathUtils.clamp(fighter.position.z + z / length * 5 * dt, -24, 24);
  camera.position.set(fighter.position.x, 5, fighter.position.z + 9);
  camera.lookAt(fighter.position.x, 1, fighter.position.z);
  engine.tick(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

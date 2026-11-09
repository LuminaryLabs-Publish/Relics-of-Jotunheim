// ROJ-0011: real browser capture gate. Requires actual WebGL and a locally served Vite build.
// Follows Luminary Development Capture & Publishing Guide; never substitutes synthetic footage.
import assert from 'node:assert/strict';
import {mkdir,rename,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const dir='artifacts/roj-0011/browser';
const url=process.env.ROJ_PREVIEW_URL??'http://127.0.0.1:4173/';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,
 args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--no-sandbox']});
const context=await browser.newContext({viewport:{width:960,height:540},
 recordVideo:{dir,size:{width:960,height:540}}});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForFunction(()=>/Clips: 16|16 animations loaded/.test(document.querySelector('#roj-status')?.textContent||''),{timeout:45000});
const status=await page.locator('#roj-status').textContent();
assert.match(status,/Clips: 16|16 animations loaded/);
assert.equal(await page.locator('#roj-center-reticle').count(),1);
const dot=await page.locator('#roj-center-reticle').boundingBox();
assert.ok(Math.abs(dot.x+dot.width/2-480)<.5&&Math.abs(dot.y+dot.height/2-270)<.5,'center dot drift');
const canvas=page.locator('canvas');
await canvas.click({position:{x:480,y:270}});
const captured=await page.evaluate(()=>document.pointerLockElement===document.querySelector('canvas'));
if(!captured)throw new Error('Click-to-lock was not captured in production WebGL gameplay');
await page.screenshot({path:dir+'/hero-right-shoulder.png'});

const timeline=[
 [['w'],5000],[['Shift','w'],5000],[['a'],5000],[['d'],5000],
 [['s'],5000],[['c','w'],5000],[['Space'],5000],[['Alt'],5000],
 [['q'],5000],[['f'],5000],[['w'],5000],[['Shift','w'],5000]
];
const start=Date.now();
for(const [i,[keys,duration]] of timeline.entries()){
 for(const key of keys)await page.keyboard.down(key);
 if(i===2||i===3||i===8)await page.mouse.move(500+i*25,250+i*8,{steps:8});
 await page.waitForTimeout(duration);
 for(const key of keys.toReversed())await page.keyboard.up(key);
 if(i===5)await page.screenshot({path:dir+'/context-movement.png'});
}
await page.screenshot({path:dir+'/detail-end-frame.png'});
const elapsed=(Date.now()-start)/1000;
let nativeEscUnlocked=false;
await page.keyboard.press('Escape');
await page.waitForTimeout(120);
nativeEscUnlocked=await page.evaluate(()=>document.pointerLockElement===null);
if(!nativeEscUnlocked)await page.evaluate(()=>document.exitPointerLock?.());
await context.close();
const raw=await page.video().path();
await browser.close();
if(errors.length)throw new Error('Browser errors: '+errors.join(' | '));
assert.ok(elapsed>=59,'Input timeline shorter than 59 seconds: '+elapsed);
await rename(raw,dir+'/gameplay-source.webm');
execFileSync('ffmpeg',['-y','-loglevel','error','-i',dir+'/gameplay-source.webm','-t','60',
 '-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',dir+'/gameplay-60s.mp4']);
const probe=JSON.parse(execFileSync('ffprobe',['-v','quiet','-print_format','json',
 '-show_format','-show_streams',dir+'/gameplay-60s.mp4'],{encoding:'utf8'}));
const duration=Number(probe.format.duration);
assert.ok(duration>=59&&duration<=60.5,`Unexpected MP4 duration ${duration}`);
const receipt={status:'PASS',url,sourceCommit:process.env.GITHUB_SHA??'local-preview',
 actualWebGL:true,inputSeconds:elapsed,encodedSeconds:duration,nativeEscUnlocked,
 original:'gameplay-source.webm',screenshots:['hero-right-shoulder.png','context-movement.png','detail-end-frame.png'],
 lastStatus:status,browserErrors:errors};
await writeFile(dir+'/capture-receipt.json',JSON.stringify(receipt,null,2));
console.log(JSON.stringify(receipt,null,2));

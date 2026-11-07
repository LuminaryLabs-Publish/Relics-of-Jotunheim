import assert from 'node:assert/strict';
import { mkdir, readdir, rename } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const dir='artifacts/roj-0004/browser';
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--no-sandbox']});
const context=await browser.newContext({viewport:{width:960,height:540},recordVideo:{dir,size:{width:960,height:540}}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForFunction(()=>document.querySelector('#roj-status')?.textContent?.includes('16 animations loaded'),{timeout:45000});
const result=await page.locator('#roj-status').textContent();
assert.match(result,/16 animations loaded/);
await page.screenshot({path:dir+'/first-frame.png'});
const timeline=[
 ['w',5000],['Shift+w',5000],['a',5000],['d',5000],['s',5000],
 ['c',5000],['Space',5000],['Alt',5000],['q',5000],['f',5000],
 ['w',5000],['Shift+w',5000]
];
const start=Date.now();
for(const [keys,duration] of timeline){
 const names=keys.split('+');
 for(const key of names)await page.keyboard.down(key);
 await page.waitForTimeout(duration);
 for(const key of names.reverse())await page.keyboard.up(key);
}
await page.screenshot({path:dir+'/last-frame.png'});
const elapsed=(Date.now()-start)/1000;
const status=await page.locator('#roj-status').textContent();
const video=page.video();
await page.close();
const videoPath=await video.path();
await context.close();await browser.close();
if(errors.length)throw new Error('Browser errors: '+errors.join(' | '));
assert.ok(elapsed>=59,'Recording shorter than 59 seconds: '+elapsed);
await rename(videoPath,dir+'/gameplay-source.webm');
execFileSync('ffmpeg',['-y','-loglevel','error','-i',dir+'/gameplay-source.webm','-t','60','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',dir+'/gameplay-60s.mp4']);
const probe=JSON.parse(execFileSync('ffprobe',['-v','quiet','-print_format','json','-show_format','-show_streams',dir+'/gameplay-60s.mp4'],{encoding:'utf8'}));
const seconds=Number(probe.format.duration);
assert.ok(seconds>=59&&seconds<=60.5,'Unexpected encoded duration '+seconds);
console.log(JSON.stringify({status:'PASS',elapsed,videoDuration:seconds,lastStatus:status,errors},null,2));

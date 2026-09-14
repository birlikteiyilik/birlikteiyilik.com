import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
const root = new URL('../', import.meta.url).pathname;
const html = readFileSync(resolve(root, 'yon/index.html'), 'utf8');

test('all local images, video, CSS, scripts and PDF links exist', () => {
  for (const match of html.matchAll(/(?:src|href|poster|data-src)="(\/[^"]+)"/g)) {
    const path = match[1].split('?')[0];
    assert.ok(existsSync(resolve(root, '.' + path)), `missing ${path}`);
  }
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const match of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(match[1]), match[1]);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.ok(!html.includes('video-scroll.js') && !html.includes('remotion'));
});

function fixture({reduced = false, desktop = true} = {}) {
  class Element {
    listeners = new Map(); style = {}; attrs = {}; hidden = true; matches = false;
    classList = {add(){}, toggle(){}};
    addEventListener(name, fn) { this.listeners.set(name, [...(this.listeners.get(name) || []), fn]); }
    fire(name) { for (const fn of this.listeners.get(name) || []) fn(); }
    setAttribute(name, value) { this.attrs[name] = value; }
  }
  const mediaReduced = new Element(); mediaReduced.matches = reduced;
  const mediaDesktop = new Element(); mediaDesktop.matches = desktop;
  const video = new Element(), button = new Element(), document = new Element(), window = new Element();
  const source = {src:'', dataset:{src:'/yon/assets/light-hero-motion-v1.mp4'}};
  Object.assign(video, {paused:true, loads:0, plays:0, querySelector:()=>source, load(){this.loads++;}, pause(){this.paused=true;}, async play(){this.plays++;this.paused=false;this.fire('playing');}});
  button.firstElementChild = {};
  const images = Array.from({length:3}, () => new Element());
  const dots = Array.from({length:3}, () => new Element());
  const context = {document, window, scrollY:0, innerHeight:800};
  const chapters = [1000,1800,2600].map(top => ({getBoundingClientRect:()=>({top:top-context.scrollY,height:800})}));
  Object.assign(document, {hidden:false, documentElement:new Element(), fonts:{ready:{then:fn=>fn()}}, querySelector:()=>new Element(), getElementById:id=>id==='heroVideo'?video:button, querySelectorAll:selector=>selector==='.journey-chapter'?chapters:selector==='.journey-image'?images:dots});
  let intersection;
  const frames = [];
  Object.assign(context, {
    matchMedia:query=>query.includes('reduced')?mediaReduced:mediaDesktop,
    requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},
    IntersectionObserver:class {constructor(fn){intersection=fn;} observe(){}},
    ResizeObserver:class {observe(){}},
  });
  vm.runInNewContext(readFileSync(resolve(root,'yon/light.js'),'utf8'), context);
  const frame = () => { const pending = frames.splice(0); pending.forEach(fn=>fn()); };
  const scroll = y => { context.scrollY=y;window.fire('scroll');frame(); };
  frame();
  return {images, video, button, document, window, source, scroll, frame, mediaReduced, intersection:visible=>intersection([{isIntersecting:visible}])};
}

test('each chapter centers the correct complete image in forward and reverse scroll', () => {
  const f = fixture();
  for (const chapter of [0,1,2,1,0]) {
    f.scroll(1000 + chapter*800 + 400 - 800*.52);
    const topVisible = f.images.map((img,index)=>({index,alpha:Number(img.style.opacity)})).filter(x=>x.alpha===1).at(-1);
    assert.equal(topVisible.index, chapter);
  }
  for (let y=0;y<3500;y+=10) {
    f.scroll(y);
    assert.ok(f.images.some(img=>Number(img.style.opacity)===1), 'transition never exposes blank background');
  }
  assert.equal(f.window.listeners.has('wheel'), false);
  assert.equal(f.window.listeners.has('touchmove'), false);
});

test('hero loads only when visible and obeys pause, offscreen and reduced motion', () => {
  const f = fixture();
  assert.equal(f.video.loads,0);
  f.intersection(true); assert.equal(f.video.loads,1); assert.equal(f.video.paused,false);
  f.button.fire('click'); assert.equal(f.video.paused,true);
  f.intersection(false);f.intersection(true);assert.equal(f.video.paused,true,'user pause persists');
  f.button.fire('click');assert.equal(f.video.paused,false);
  f.intersection(false);assert.equal(f.video.paused,true);
  f.mediaReduced.matches=true;f.mediaReduced.fire('change');assert.equal(f.video.paused,true);
  const r=fixture({reduced:true});r.intersection(true);assert.equal(r.video.loads,0);
});

test('mobile never transforms narrative imagery', () => {
  const f = fixture({desktop:false});f.scroll(1800);
  assert.ok(f.images.every(img=>img.style.transform===undefined));
});

import * as THREE from './vendor/three-r180/three.module.min.js';
import { QR_ROWS } from './qr-tree-code-v1.js';

const THEMES = {
  filiz: { leaves: [0x49764b, 0x6a924f, 0x89aa5e, 0xb3c67d], grass: 0x78984e, petal: 0xc5cf83, bark: '#806144' },
  bahar: { leaves: [0xd5819a, 0xedacb8, 0xf5c5cb, 0xffdedc], grass: 0x879b64, petal: 0xf4b7c9, bark: '#81654e' },
  bereket: { leaves: [0xb87532, 0xcf9941, 0xe3b85b, 0xf0cf80], grass: 0xa99a55, petal: 0xe5b859, bark: '#85623e' },
};
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
function seeded(seed = 87) {
  return () => { seed = Math.imul(1664525, seed) + 1013904223 | 0; return (seed >>> 0) / 4294967296; };
}

function leafGeometry(theme) {
  const shape = new THREE.Shape();
  if (theme === 'bahar') {
    for (let i = 0; i <= 60; i++) {
      const a = i / 60 * Math.PI * 2;
      const r = .34 + .15 * Math.cos(a * 5);
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (!i) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
  } else if (theme === 'bereket') {
    const points = [[0,-.48],[-.06,-.18],[-.38,-.1],[-.24,.05],[-.48,.28],[-.23,.27],[-.18,.48],[0,.32],[.18,.48],[.23,.27],[.48,.28],[.24,.05],[.38,-.1],[.06,-.18],[0,-.48]];
    points.forEach(([x,y], i) => i ? shape.lineTo(x,y) : shape.moveTo(x,y));
  } else {
    shape.moveTo(0, -.5);
    shape.bezierCurveTo(-.46, -.14, -.34, .24, 0, .5);
    shape.bezierCurveTo(.34, .24, .46, -.14, 0, -.5);
  }
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape, 4);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i);
    position.setZ(i, Math.abs(x) * .22 + Math.sin(y * 4) * .035);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function barkTexture(tone) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 256;
  const ctx = canvas.getContext('2d'), random = seeded(32);
  ctx.fillStyle = tone; ctx.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 170; i++) {
    const x = random() * 128;
    ctx.strokeStyle = i % 3 ? 'rgba(44,32,20,.19)' : 'rgba(255,228,178,.16)';
    ctx.lineWidth = .4 + random() * 1.6;
    ctx.beginPath(); ctx.moveTo(x, 0);
    for (let y = 0; y <= 256; y += 12) ctx.lineTo(x + Math.sin(y * .04 + i) * 2, y);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function taperedBranch(points, radius) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const length = 14, sides = 9, frames = curve.computeFrenetFrames(length, false);
  const positions = [], uv = [], indices = [];
  for (let i = 0; i <= length; i++) {
    const p = curve.getPointAt(i / length), r = radius * Math.pow(1 - i / length, .72) + .008;
    for (let j = 0; j <= sides; j++) {
      const a = j / sides * Math.PI * 2;
      const v = p.clone().addScaledVector(frames.normals[i], Math.cos(a) * r).addScaledVector(frames.binormals[i], Math.sin(a) * r);
      positions.push(v.x, v.y, v.z); uv.push(j / sides, i / length * 3);
      if (i < length && j < sides) {
        const k = i * (sides + 1) + j;
        indices.push(k, k + sides + 1, k + 1, k + 1, k + sides + 1, k + sides + 2);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function mergeBranches(geometries) {
  const merged = new THREE.BufferGeometry();
  const vertices = geometries.reduce((sum, geometry) => sum + geometry.attributes.position.count, 0);
  for (const [name, size] of [['position',3],['normal',3],['uv',2]]) {
    const array = new Float32Array(vertices * size);
    let offset = 0;
    for (const geometry of geometries) { array.set(geometry.attributes[name].array, offset); offset += geometry.attributes[name].array.length; }
    merged.setAttribute(name, new THREE.BufferAttribute(array, size));
  }
  const indices = new Uint32Array(geometries.reduce((sum, geometry) => sum + geometry.index.count, 0));
  let indexOffset = 0, vertexOffset = 0;
  for (const geometry of geometries) {
    for (const index of geometry.index.array) indices[indexOffset++] = index + vertexOffset;
    vertexOffset += geometry.attributes.position.count;
    geometry.dispose();
  }
  merged.setIndex(new THREE.BufferAttribute(indices,1));
  return merged;
}

function buildBody(theme, body, materials, resources) {
  const random = seeded(), palette = THEMES[theme], tips = [], branches = [];
  const keep = (resource) => { resources.add(resource); return resource; };
  const mat = (color) => { const m = keep(new THREE.MeshStandardMaterial({ color, roughness: .91 })); materials.add(m); return m; };
  const bark = mat(0xffffff); bark.map = keep(barkTexture(palette.bark));
  const add = (geometry, material) => {
    const mesh = new THREE.Mesh(keep(geometry), material);
    mesh.castShadow = mesh.receiveShadow = true; body.add(mesh); return mesh;
  };
  const platform = add(new THREE.BoxGeometry(5.8, .2, 5.8), mat(0xc9c3ae)); platform.position.y = -.17;
  const soil = add(new THREE.BoxGeometry(5.72, .06, 5.72), mat(0xd9d5bc)); soil.position.y = -.04;
  const tiles = new THREE.InstancedMesh(keep(new THREE.BoxGeometry(.298, .035, .298)), mat(0xffffff), 19 * 19);
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  for (let x = 0; x < 19; x++) for (let z = 0; z < 19; z++) {
    dummy.position.set((x - 9) * .3, .015 + random() * .008, (z - 9) * .3);
    dummy.updateMatrix(); const index = x * 19 + z;
    tiles.setMatrixAt(index, dummy.matrix);
    color.setHex(QR_ROWS[(x * 2) % 33][(z * 2) % 33] === '1' ? 0xc9cbbd : 0xe9e5d5).multiplyScalar(.96 + random() * .08);
    tiles.setColorAt(index, color);
  }
  tiles.receiveShadow = true; body.add(tiles);
  const blade = keep(new THREE.BufferGeometry());
  blade.setAttribute('position', new THREE.Float32BufferAttribute([-.025,0,0, .025,0,0, .035,.25,.035], 3)); blade.computeVertexNormals();
  const grassMat = mat(palette.grass); grassMat.side = THREE.DoubleSide;
  const grass = new THREE.InstancedMesh(blade, grassMat, 260);
  for (let i = 0; i < 260; i++) {
    const side = i % 4, along = (random() - .5) * 5.5, edge = 2.48 + random() * .28;
    dummy.position.set(side < 2 ? along : (side === 2 ? -edge : edge), .04, side < 2 ? (side ? -edge : edge) : along);
    dummy.rotation.set(0, random() * Math.PI * 2, (random() - .5) * .4);
    dummy.scale.setScalar(.45 + random() * .85); dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix);
    grass.setColorAt(i, color.setHex(palette.grass).multiplyScalar(.7 + random() * .6));
  }
  body.add(grass);
  branches.push(taperedBranch([[0,0,0],[-.13,1.2,.04],[.12,2.4,-.08],[0,3.6,0],[.08,4.8,.08]], .24));
  for (let i = 0; i < 12; i++) {
    const angle = i * 2.39996, level = 2.0 + (i % 5) * .4;
    const radius = 1.2 + (i % 3) * .32, y = level + 1.05;
    const end = [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
    const origin = [0, level - .45, 0];
    branches.push(taperedBranch([origin,[end[0] * .4, level + .15, end[2] * .4],end], .075 + (4.3 - level) * .014));
    tips.push(new THREE.Vector3(...end));
    for (let j = 0; j < 2; j++) {
      const branch = [end[0] + Math.cos(angle + j * 1.7) * .55, y + .4 + j * .2, end[2] + Math.sin(angle + j * 1.7) * .55];
      branches.push(taperedBranch([[end[0]*.7,y-.2,end[2]*.7],end,branch], .026));
      tips.push(new THREE.Vector3(...branch));
    }
  }
  tips.push(new THREE.Vector3(0,4.7,0));
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    branches.push(taperedBranch([[Math.cos(a)*.65,.04,Math.sin(a)*.65],[Math.cos(a)*.25,.12,Math.sin(a)*.25],[0,.4,0]], .065));
  }
  add(mergeBranches(branches), bark);
  // Small teaching books make this an academy's tree, without any invented text.
  const cover = mat(theme === 'bahar' ? 0x9a586e : theme === 'bereket' ? 0x8c602c : 0x335e48), paper = mat(0xf5ecd4);
  const book = new THREE.Group(); book.position.set(-1.28,.13,1.38); book.rotation.y = -.32;
  for (let i = 0; i < 2; i++) {
    const pages = new THREE.Mesh(keep(new THREE.BoxGeometry(.77,.10,.53)), paper);
    pages.position.y = i * .17; pages.castShadow = true; book.add(pages);
    const binding = new THREE.Mesh(keep(new THREE.BoxGeometry(.81,.035,.57)), cover);
    binding.position.y = i * .17 + .07; binding.castShadow = true; book.add(binding);
  }
  body.add(book);
  return tips;
}

export function enhanceTree(root) {
  const mount = root.querySelector('.gt-canvas'), stage = root.querySelector('.gt-stage');
  const toggle = root.querySelector('.gt-toggle'), hint = root.querySelector('.gt-hint');
  const pause = root.querySelector('.gt-pause'), themeButtons = [...root.querySelectorAll('[data-theme-choice]')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.16;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mount.append(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-4,4,4,-4,.1,80);
  const focus = new THREE.Vector3(0,2.25,0), iso = new THREE.Vector3(8,9.5,9), front = new THREE.Vector3(0,2.25,12);
  scene.add(new THREE.HemisphereLight(0xfffbef,0x6a7658,2.3));
  const light = new THREE.DirectionalLight(0xfff0d2,3.2); light.position.set(-3.5,8,5); light.castShadow = true;
  light.shadow.mapSize.set(1024,1024); light.shadow.camera.left=-4; light.shadow.camera.right=4;
  light.shadow.camera.top=6; light.shadow.camera.bottom=-4; light.shadow.normalBias=.025;
  light.shadow.bias=-.0003; light.shadow.radius=3; light.shadow.autoUpdate=false;
  scene.add(light);
  const body = new THREE.Group(); scene.add(body);
  const bodyResources = new Set(), bodyMaterials = new Set();
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9, side: THREE.DoubleSide, transparent: true, forceSinglePass: true });
  const count = window.matchMedia('(max-width: 700px)').matches ? 1250 : 1700;
  const foliage = new THREE.InstancedMesh(leafGeometry('filiz'),leafMaterial,count);
  foliage.instanceMatrix.setUsage(THREE.DynamicDrawUsage); foliage.castShadow=true; foliage.frustumCulled=false; scene.add(foliage);
  const cells = [];
  QR_ROWS.forEach((row,y) => [...row].forEach((cell,x) => { if(cell==='1')cells.push([x,y]); }));
  const pixelMaterial = new THREE.MeshBasicMaterial({color:0x123c32,transparent:true,toneMapped:false});
  const pixels = new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,.12),pixelMaterial,cells.length);
  pixels.instanceMatrix.setUsage(THREE.DynamicDrawUsage); pixels.frustumCulled=false; scene.add(pixels);
  const qrPaper = new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,toneMapped:false,side:THREE.DoubleSide}));
  qrPaper.position.copy(focus);qrPaper.position.z=-.04;scene.add(qrPaper);
  const dustMaterial = new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,side:THREE.DoubleSide,transparent:true});
  const dust = new THREE.InstancedMesh(leafGeometry('bahar'),dustMaterial,35); dust.frustumCulled=false; scene.add(dust);
  const floorMaterial = new THREE.ShadowMaterial({ opacity:.16 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200),floorMaterial);
  floor.rotation.x=-Math.PI/2; floor.position.y=-.28; floor.receiveShadow=true; scene.add(floor);
  const dummy = new THREE.Object3D(), color = new THREE.Color(), pixelTarget = new THREE.Vector3();
  const random = seeded(56), dustRecords = Array.from({length:35},()=>({x:(random()-.5)*5,z:(random()-.5)*5,y:random()*6,phase:random()*6,scale:.10+random()*.07}));
  let records=[], theme='filiz', progress=0, motion=null, angle=0, paused=false, visible=false;
  let frame=0, lastFrame=0, windTime=0, lastMorph=-1, disposed=false, qrStep=.15;

  function setTheme(next) {
    if(!THEMES[next] || motion)return;
    theme=next; root.dataset.treeTheme=next;
    if(root.hasAttribute('data-tree-presentation'))document.body.dataset.treeTheme=next;
    body.traverse((object)=>{if(object.isInstancedMesh)object.dispose();});
    for(const resource of bodyResources)resource.dispose(); bodyResources.clear(); bodyMaterials.clear(); body.clear();
    const tips=buildBody(theme,body,bodyMaterials,bodyResources), random=seeded(95), palette=THEMES[theme];
    records=Array.from({length:count},(_,i)=>{
      const tip=tips[i%tips.length], a=random()*Math.PI*2, r=Math.cbrt(random());
      const height=(random()-.5)*1.3;
      return {x:tip.x+Math.cos(a)*r*.76,y:tip.y+height,z:tip.z+Math.sin(a)*r*.76,
        rx:(random()-.5)*2.4, ry:random()*Math.PI*2, rz:random()*Math.PI*2,
        size:.23+random()*.16, phase:random()*Math.PI*2, color:palette.leaves[i%palette.leaves.length]};
    });
    foliage.geometry.dispose(); foliage.geometry=leafGeometry(theme);
    dustMaterial.color.setHex(palette.petal);
    themeButtons.forEach((button)=>button.setAttribute('aria-pressed',String(button.dataset.themeChoice===theme)));
    light.shadow.needsUpdate=true; lastMorph=-1; requestFrame();
  }
  function resize() {
    const {width,height}=stage.getBoundingClientRect(); if(!width||!height)return;
    renderer.setSize(width,height,false);
    camera.left=-4.3*width/height; camera.right=4.3*width/height; camera.top=4.3; camera.bottom=-4.3; camera.updateProjectionMatrix();
    const imageWidth=root.querySelector('.gt-qr img').getBoundingClientRect().width;
    qrStep=8.6*imageWidth/height/(QR_ROWS.length+8);
    light.shadow.needsUpdate=true; lastMorph=-1; requestFrame();
  }
  function paint(now) {
    const t=smooth(progress), c=Math.cos(angle), s=Math.sin(angle);
    camera.position.copy(iso).lerp(front,t); camera.lookAt(focus);
    body.rotation.y=angle; body.scale.setScalar(1-.92*smooth(t/.9)); body.position.y=-t*.8;
    body.visible=t<.98; floorMaterial.opacity=.16*(1-t);
    for(const material of bodyMaterials){material.transparent=t>.001; material.opacity=1-smooth((t-.08)/.7);}
    foliage.visible=t<.98; leafMaterial.opacity=1-smooth((t-.27)/.62);
    pixelMaterial.opacity=smooth((t-.15)/.4); pixels.visible=t>.01;
    qrPaper.visible=t>.6;qrPaper.material.opacity=smooth((t-.6)/.32);qrPaper.quaternion.copy(camera.quaternion);
    qrPaper.scale.setScalar((QR_ROWS.length+8)*qrStep);
    const mid=(QR_ROWS.length-1)/2, updateColor=t!==lastMorph;
    for(let i=0;i<count;i++){
      const r=records[i], local=smooth(clamp((t-r.phase*.008)/.95,0,1));
      const x=r.x*c+r.z*s, z=r.z*c-r.x*s;
      const wind=reduce.matches||paused ? 0 : Math.sin(windTime*1.15+r.phase)*.075;
      const cell=cells[i%cells.length]; pixelTarget.set((cell[0]-mid)*qrStep,focus.y+(mid-cell[1])*qrStep,0);
      dummy.position.set(lerp(x,pixelTarget.x,local)+Math.sin(local*Math.PI)*Math.sin(r.phase)*.35,
        lerp(r.y,pixelTarget.y,local)+Math.sin(local*Math.PI)*(.4+r.phase*.06),lerp(z,pixelTarget.z,local));
      dummy.rotation.set(r.rx+wind,r.ry+angle+wind,r.rz+wind+local*Math.PI);
      dummy.scale.setScalar(r.size*(1-local*.4)); dummy.updateMatrix(); foliage.setMatrixAt(i,dummy.matrix);
      if(updateColor)foliage.setColorAt(i,color.setHex(r.color));
      if(i<cells.length){
        dummy.rotation.set(0,0,0);
        dummy.scale.set(qrStep*lerp(.3,1,local),qrStep*lerp(.3,1,local),qrStep);
        dummy.updateMatrix(); pixels.setMatrixAt(i,dummy.matrix);
      }
    }
    for(let i=0;i<dustRecords.length;i++){
      const r=dustRecords[i], time=windTime*(theme==='bahar'?.3:.19);
      dummy.position.set(r.x+Math.sin(time+r.phase)*.3,((r.y-time)%5.5+5.5)%5.5+.1,r.z+Math.cos(time+r.phase)*.15);
      dummy.rotation.set(time+r.phase,r.phase,time*.6); dummy.scale.setScalar(r.scale*(1-t)); dummy.updateMatrix(); dust.setMatrixAt(i,dummy.matrix);
    }
    dust.visible=!reduce.matches&&t<.95; dustMaterial.opacity=(1-t)*.8;
    foliage.instanceMatrix.needsUpdate=true; pixels.instanceMatrix.needsUpdate=true; dust.instanceMatrix.needsUpdate=true;
    if(updateColor)foliage.instanceColor.needsUpdate=true;
    lastMorph=t; renderer.render(scene,camera);
    if(root.dataset.treeReady!=='true')root.dataset.treeReady='true';
  }
  function tick(now) {
    frame=0; if(disposed)return;
    if(now-lastFrame<1000/60-1){requestFrame();return;}
    const dt=Math.min((now-lastFrame)/1000,.05);lastFrame=now;
    if(!paused&&!reduce.matches)windTime+=dt;
    if(motion){
      const phase=clamp((now-motion.start)/motion.duration,0,1);
      progress=lerp(motion.from,motion.to,phase);
      if(phase===1){motion=null; settle();}
    }
    paint(now);
    if(visible&&!document.hidden&&(motion||(!paused&&!reduce.matches&&progress<1)))requestFrame();
  }
  function requestFrame(){if(!frame&&!disposed)frame=requestAnimationFrame(tick);}
  function settle(){
    root.dataset.view=progress===1?'qr':'tree';root.dataset.morphing='false';
    root.removeAttribute('aria-busy');stage.disabled=false;toggle.disabled=false;
    stage.setAttribute('aria-pressed',String(progress===1));
    stage.setAttribute('aria-label',progress===1?'QR kodundan ağaca dön':'Ağacı QR koduna dönüştür');
    toggle.innerHTML=progress===1?'Ağaca dön <span class="gt-arrow gt-arrow--back" aria-hidden="true"></span>':'QR kodunu göster <span class="gt-arrow" aria-hidden="true"></span>';
    hint.textContent=progress===1?'Telefon kameranızla okutun veya bağlantılarımızı açın.':'Ağacı sürükleyerek döndürün; QR kodu için dokunun.';
    pause.hidden=reduce.matches||progress===1;
  }
  function toggleView(){
    if(motion)return;
    const goal=progress===1?0:1;
    root.dataset.morphing='true';root.setAttribute('aria-busy','true');stage.disabled=true;toggle.disabled=true;
    if(reduce.matches){progress=goal;settle();requestFrame();return;}
    motion={from:progress,to:goal,start:performance.now(),duration:1350};requestFrame();
  }
  let pointer=null,dragged=false;
  stage.addEventListener('pointerdown',(event)=>{if(progress||motion||event.button!==0)return;pointer={id:event.pointerId,x:event.clientX,y:event.clientY,angle};dragged=false;});
  stage.addEventListener('pointermove',(event)=>{
    if(!pointer||pointer.id!==event.pointerId||progress||motion)return;
    const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
    if(Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)){dragged=true;stage.setPointerCapture(event.pointerId);angle=pointer.angle+dx*.009;light.shadow.needsUpdate=true;requestFrame();}
  });
  stage.addEventListener('pointerup',()=>{pointer=null;});
  stage.addEventListener('pointercancel',()=>{pointer=null;dragged=false;});
  stage.addEventListener('click',()=>{if(dragged){dragged=false;return;}toggleView();});
  toggle.addEventListener('click',toggleView);
  pause.addEventListener('click',()=>{paused=!paused;pause.setAttribute('aria-pressed',String(paused));pause.textContent=paused?'Hareketi sürdür':'Hareketi durdur';requestFrame();});
  themeButtons.forEach((button)=>button.addEventListener('click',()=>setTheme(button.dataset.themeChoice)));
  const fullscreen=root.querySelector('.gt-fullscreen');
  if(root.hasAttribute('data-tree-presentation')&&document.fullscreenEnabled){
    fullscreen.hidden=false;
    fullscreen.addEventListener('click',async()=>{
      try{if(document.fullscreenElement)await document.exitFullscreen();else await root.requestFullscreen();}catch{}
    });
    document.addEventListener('fullscreenchange',()=>{fullscreen.textContent=document.fullscreenElement?'Tam ekrandan çık':'Tam ekran';resize();});
  }
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)requestFrame();else if(frame&&!motion){cancelAnimationFrame(frame);frame=0;}},{threshold:.05});observer.observe(stage);
  const onVisibility=()=>{if(!document.hidden&&visible)requestFrame();else if(frame&&!motion){cancelAnimationFrame(frame);frame=0;}};
  document.addEventListener('visibilitychange',onVisibility);
  const onReduce=()=>{if(reduce.matches&&motion){progress=motion.to;motion=null;settle();}pause.hidden=reduce.matches||progress===1;requestFrame();};reduce.addEventListener('change',onReduce);
  const resizer=new ResizeObserver(resize);resizer.observe(stage);
  renderer.domElement.addEventListener('webglcontextlost',(event)=>{
    event.preventDefault();cleanup();root.classList.remove('is-enhanced');root.dataset.view='qr';root.dataset.morphing='false';
    stage.disabled=true;toggle.hidden=true;pause.hidden=true;root.querySelector('.gt-themes').hidden=true;
    hint.textContent='Telefon kameranızla okutun veya bağlantılarımızı açın.';
  });
  function cleanup(){
    if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();resizer.disconnect();
    document.removeEventListener('visibilitychange',onVisibility);reduce.removeEventListener('change',onReduce);
    body.traverse((object)=>{if(object.isInstancedMesh)object.dispose();});
    for(const resource of bodyResources)resource.dispose();
    for(const mesh of [foliage,pixels,qrPaper,dust,floor]){if(mesh.isInstancedMesh)mesh.dispose();mesh.geometry.dispose();mesh.material.dispose();}
    renderer.dispose();
  }
  window.addEventListener('pagehide',(event)=>{if(!event.persisted)cleanup();},{once:true});
  setTheme(root.dataset.treeTheme||'filiz');
  root.classList.add('is-enhanced');root.dataset.view='tree';toggle.hidden=false;root.querySelector('.gt-themes').hidden=false;
  settle();resize();
}

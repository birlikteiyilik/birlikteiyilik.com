/* Üretilmiş dosya: node scripts/maskot-paketle.mjs. Kaynak: scripts/maskot/. Elle düzenlemeyin. */
(function () {
  'use strict';
  var sources = {
'./govde.js': function (module, exports, require) {
// Biri maskotu · gövde üreticisi. Her SVG kendi kimlik önekini taşır, aynı sayfada çakışmaz.
// scripts/maskot-paketle.mjs bu dosyaları tarayıcı için app/maskot.js içinde birleştirir.
const C = {
  red: '#E20439', shade: '#B4002E', limb: '#CC0335', limbShade: '#A8002B', line: '#6A0020',
  hi: '#FF6E8F', ink: '#2A1A20', iris: '#5B2638', blush: '#FF8DAA', mouth: '#6E0018', tongue: '#FF7E99',
  brow: '#7A0022', shoe: '#8A0026', sole: '#FFF1F3', gold: '#FFC53D', goldDeep: '#E09A00', teal: '#14857A',
  cream: '#FFF8EC', white: '#FFFFFF', glove: '#FFFFFF', gloveLine: '#E9DADF', sky: '#8FD3FF'
};
const HEART = 'M494.5 532C486 518 474 512 461 512C440 512 425 528 425 549C425 572 441 588 461 605C476 618 488 628 494.5 642C501 628 513 618 528 605C548 588 564 572 564 549C564 528 549 512 528 512C515 512 503 518 494.5 532Z';
const SWOOSH = 'M455 527C459 527 461 530 459.5 535C457 542 455.5 550 456.5 560C457.5 568 459.5 574 462 579.5C455 576 449 570 445 563C441 556 440 548 441.5 541C443 533 448 527 455 527Z';
const STEM = 'M69 340V62Q69 38 93 40.3A106 106 0 0 1 177 144V340Z';
const MINI = 'M0 -6C-2 -10 -6 -11 -9 -10C-13 -8 -14 -3 -12 1C-10 5 -4 9 0 13C4 9 10 5 12 1C14 -3 13 -8 9 -10C6 -11 2 -10 0 -6Z';
const OUT = C.line;
let SEQ = 0;

const g = (t, inner, cls) => `<g transform="${t}">${cls ? `<g class="${cls}">${inner}</g>` : inner}</g>`;
const pivot = (x, y, cls, inner) => `<g transform="translate(${x} ${y})"><g class="${cls}"><g transform="translate(${-x} ${-y})">${inner}</g></g></g>`;
// Dış çizgili şekil: önce kalın koyu kontur, sonra dolgu. İç içe parçalarda birleşik siluet verir.
const ol = (tag, attrs, fill, w = 9) => `<${tag} class="o" ${attrs} stroke-width="${w}"></${tag}><${tag} ${attrs} fill="${fill}"></${tag}>`;

// ---------- Kol: omuz, dirsek, el zinciri. Sağ kol tanımlanır; sol kol aynalanır. ----------
const SH = {R: [334, 384], L: [96, 384]};
const UA = 30, FA = 26, UW = 28, FW = 26, HAND = 22;
const deg = r => r * 180 / Math.PI;
const dirAngle = (vx, vy) => deg(Math.atan2(-vx, vy));
// Elin avuç ortasını hedefe götüren omuz ve dirsek açıları. bend: 1 dirsek dışa, -1 içe.
function ik(side, [tx, ty], bend = 1, a3 = 0) {
  const [sx, sy] = SH[side];
  let vx = side === 'R' ? tx - sx : sx - tx, vy = ty - sy;
  const r1 = UA, r2 = FA + HAND;
  let d = Math.hypot(vx, vy);
  if (d > r1 + r2 - .5) { const k = (r1 + r2 - .5) / d; vx *= k; vy *= k; d = r1 + r2 - .5; }
  const base = dirAngle(vx, vy);
  const alpha = deg(Math.acos((r1 * r1 + d * d - r2 * r2) / (2 * r1 * d)));
  const a1 = base - bend * alpha;
  const ex = -Math.sin(a1 * Math.PI / 180) * r1, ey = Math.cos(a1 * Math.PI / 180) * r1;
  const a2 = dirAngle(vx - ex, vy - ey) - a1;
  // a3 sayı ise bileğe göre, {abs} ise ekrana göre elin yönü (0 aşağı, 180 yukarı; sağ kol için eksi dışa).
  const h = typeof a3 === 'object' ? a3.abs - a1 - a2 : a3;
  return [Math.round(a1), Math.round(a2), Math.round(h)];
}
// İşaret parmağı: yumruk biraz kısalır, parmak kolun doğrultusunda uzanır.
const FINGER = 'x="-6" y="22" width="13" height="38" rx="6.5"';
function handShape(pass, kind) {
  const point = kind === 'point';
  if (pass === 'o') return `<ellipse class="o" cx="-17" cy="14" rx="9" ry="13" transform="rotate(-38 -17 14)" stroke-width="9"></ellipse>` + (point ? `<rect class="o" ${FINGER} stroke-width="9"></rect>` : '') + `<path class="o" d="M-18 6C-20 22 -13 ${point ? 32 : 39} 1 ${point ? 32 : 39}C15 ${point ? 32 : 39} 21 22 18 6C16 -6 -16 -6 -18 6Z" stroke-width="9"></path>`;
  const thumb = `<ellipse cx="-17" cy="14" rx="9" ry="13" transform="rotate(-38 -17 14)" fill="${C.glove}"></ellipse>`;
  if (point) return thumb + `<rect ${FINGER} fill="${C.glove}"></rect><path d="M-18 6C-20 22 -13 32 1 32C15 32 21 22 18 6C16 -6 -16 -6 -18 6Z" fill="${C.glove}"></path><path class="gl" d="M-12 4Q0 0 12 4M-9 18Q-4 24 -7 28"></path>`;
  const palm = `<path d="M-18 6C-20 22 -13 39 1 39C15 39 21 22 18 6C16 -6 -16 -6 -18 6Z" fill="${C.glove}"></path>`;
  const lines = kind === 'open'
    ? `<path class="gl" d="M-5 39V30M6 38V29M-12 4Q0 0 12 4"></path>`
    : `<path class="gl" d="M-9 14Q-6 22 -8 28M-12 4Q0 0 12 4"></path>`;
  return thumb + palm + lines;
}
function armTree(side, spec, pass) {
  const [a1, a2, a3] = spec.a;
  // sleeve: [açık, koyu] kol rengi; giysili pozlarda kol kıyafetin rengini alır.
  const o = pass === 'o', fill = spec.sleeve ? spec.sleeve[side === 'L' ? 1 : 0] : side === 'L' ? C.limbShade : C.limb;
  const seg = (w, len) => `<rect x="${-w / 2}" y="${-w / 2}" width="${w}" height="${len + w}" rx="${w / 2}" ${o ? 'class="o" stroke-width="9"' : `fill="${fill}"`}></rect>`;
  let item = '';
  if (!o && spec.item) {
    // Tutulan nesne ekrana göre dik durur; kol hareket ettikçe elle birlikte döner.
    const tot = a1 + a2 + a3;
    item = `<g transform="translate(0 20) rotate(${-tot})${side === 'L' ? ' scale(-1 1)' : ''}">${spec.item}</g>`;
  }
  const handInner = (spec.over ? '' : item) + handShape(pass, spec.hand) + (spec.over ? item : '');
  const hand = g(`translate(0 ${FA + 2}) rotate(${a3})`, handInner, `m-hd${side}`);
  const fore = g(`translate(0 ${UA}) rotate(${a2})`, seg(FW, FA) + hand, `m-fa${side}`);
  const upper = g(`rotate(${a1})`, seg(UW, UA) + fore, `m-ua${side}`);
  const [x, y] = SH[side];
  return `<g transform="translate(${x} ${y})${side === 'L' ? ' scale(-1 1)' : ''}">${upper}</g>`;
}
// Önce bütün kolun konturu, sonra dolgusu: dirsek ve bilekte dikiş görünmez.
const arm = (side, spec, sleeve) => { if (sleeve) spec = {...spec, sleeve}; return armTree(side, spec, 'o') + armTree(side, spec, 'f'); };

// ---------- Bacak ve ayakkabı ----------
const HIP = {L: [180, 470], R: [250, 470]};
function legTree(side, shoe) {
  const sh = shoe || {}, O = ' class="o" stroke-width="9"';
  const shoePath = sh.path || 'M-22 44C-24 31 -9 25 7 25C25 25 38 33 38 45C38 52 32 56 23 56H-14C-21 56 -22 51 -22 44Z';
  const legRect = 'x="-14" y="-10" width="28" height="46" rx="14"';
  const detail = sh.detail ?? `<path d="M-22 48H38C37 53 32 56 23 56H-14C-20 56 -22 53 -22 48Z" fill="${C.sole}"></path><path class="lc" d="M3 32Q12 29 21 33"></path><circle cx="25" cy="38" r="3" fill="#B83656"></circle>`;
  const art = `<rect${O} ${legRect}></rect><path${O} d="${shoePath}"></path><rect ${legRect} fill="${sh.leg || C.limbShade}"></rect><path d="${shoePath}" fill="${sh.fill || C.shoe}"></path>${detail}`;
  const [x, y] = HIP[side];
  return `<g transform="translate(${x} ${y})${side === 'L' ? ' scale(-1 1)' : ''}"><g class="m-lg${side}">${art}</g></g>`;
}
const legs = shoe => legTree('L', shoe) + legTree('R', shoe);

// ---------- Gövde: sap + kase, hücre gölgesi, parlama ----------
function body(id, stemTop, small) {
  const stemFill = `<path d="${STEM}" fill="${C.shade}"></path><g clip-path="url(#${id}-st)"><path d="${STEM}" transform="translate(-14 -5)" fill="${C.red}"></path>` +
    (small ? '' : `<path class="hl" d="M91 214V96Q91 66 118 64"></path><circle class="hd" cx="136" cy="70" r="5"></circle>`) + '</g>';
  const stemLine = `<path class="o" d="${STEM}" stroke-width="10"></path>`;
  const bowlLine = `<circle class="o" cx="215" cy="340" r="146" stroke-width="10"></circle>`;
  const bowlFill = `<circle cx="215" cy="340" r="146" fill="${C.shade}"></circle><g clip-path="url(#${id}-bw)"><circle cx="201" cy="326" r="146" fill="${C.red}"></circle>` +
    (small ? '' : `<path class="hl" d="M184 212A132 132 0 0 1 228 208.5"></path><circle class="hd" cx="247" cy="212" r="5"></circle>`) + '</g>';
  return {line: pivot(124, 340, 'm-stem', stemLine) + bowlLine, fill: pivot(124, 340, 'm-stem', stemFill + (stemTop || '')) + bowlFill};
}
const defs = (id, extra = '') => `<defs>${extra}<clipPath id="${id}-st"><path d="${STEM}"></path></clipPath><clipPath id="${id}-bw"><circle cx="215" cy="340" r="146"></circle></clipPath></defs>`;
const heart = () => g('translate(215 410)', `<path d="M0-29.7C-5.6-38.9-13.5-42.9-22.1-42.9C-36-42.9-45.9-32.3-45.9-18.5C-45.9-3.3-35.3 7.3-22.1 18.5C-12.2 27.1-4.3 33.7 0 42.9C4.3 33.7 12.2 27.1 22.1 18.5C35.3 7.3 45.9-3.3 45.9-18.5C45.9-32.3 36-42.9 22.1-42.9C13.5-42.9 5.6-38.9 0-29.7Z" transform="translate(0 4.6)" fill="${C.shade}"></path><path d="M0-29.7C-5.6-38.9-13.5-42.9-22.1-42.9C-36-42.9-45.9-32.3-45.9-18.5C-45.9-3.3-35.3 7.3-22.1 18.5C-12.2 27.1-4.3 33.7 0 42.9C4.3 33.7 12.2 27.1 22.1 18.5C35.3 7.3 45.9-3.3 45.9-18.5C45.9-32.3 36-42.9 22.1-42.9C13.5-42.9 5.6-38.9 0-29.7Z" fill="#fff"></path><path d="M-26.1-33C-23.4-33-22.1-31-23.1-27.7C-24.7-23.1-25.7-17.8-25.1-11.2C-24.4-5.9-23.1-2-21.4 1.7C-26.1-0.7-30-4.6-32.7-9.2C-35.3-13.9-36-19.1-35-23.8C-34-29-30.7-33-26.1-33Z" fill="${C.red}"></path>`, 'm-heart');

// ---------- Yüz ----------
const EY = 274, EX = {L: 170, R: 260};
function lid(side, kind) {
  // Göz kapağı: gövde renginde örtü, kenarında koyu kirpik çizgisi. Sol göz için iç taraf +x.
  const m = side === 'L' ? 1 : -1;
  const L = {sad: [-36, -12, 36, -32], focus: [-36, -36, 36, -12], sleepy: [-36, -4, 36, -4], shy: [-36, -12, 36, -12]}[kind];
  if (!L) return '';
  const [x1, y1, x2, y2] = L, X1 = x1 * m, X2 = x2 * m;
  return `<path d="M${X1} ${y1}L${X2} ${y2}V-50H${X1}Z" fill="${C.red}"></path><path d="M${X1 * .9} ${y1 + (y2 - y1) * .05}L${X2 * .9} ${y2 - (y2 - y1) * .05}" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"></path>`;
}
const STAR = 'M0 -21L6.2 -7.4L21 -6.5L9.6 3.2L13 17.8L0 10L-13 17.8L-9.6 3.2L-21 -6.5L-6.2 -7.4Z';
function pupil(kind) {
  if (kind === 'star') return `<path d="${STAR}" transform="translate(1 4)" fill="${C.gold}" stroke="${C.goldDeep}" stroke-width="3.5" stroke-linejoin="round"></path><circle cx="-4" cy="-1" r="4" fill="#fff"></circle>`;
  if (kind === 'heart') return `<path d="${MINI}" transform="translate(1 4) scale(1.8)" fill="${C.red}"></path><circle cx="-8" cy="-4" r="4.5" fill="#fff"></circle>`;
  if (kind === 'wide') return `<circle cx="0" cy="2" r="12" fill="${C.ink}"></circle><circle cx="-4" cy="-2" r="4.5" fill="#fff"></circle>`;
  const big = kind === 'sad' || kind === 'shy';
  return `<ellipse cx="2" cy="6" rx="${big ? 23 : 21}" ry="${big ? 25 : 23}" fill="${C.ink}"></ellipse><ellipse cx="2" cy="15" rx="14" ry="9" fill="${C.iris}"></ellipse>` +
    `<ellipse cx="-6" cy="-3" rx="8" ry="9" fill="#fff"></ellipse><circle cx="10" cy="17" r="3.6" fill="#fff"></circle>` + (big ? `<circle cx="11" cy="-4" r="3" fill="#fff" opacity=".9"></circle>` : '');
}
function eye(side, kind, look = [0, 0], hole = false) {
  let inner;
  if (kind === 'happy') inner = `<path d="M-24 10Q0 -26 24 10Q0 -10 -24 10Z" fill="${C.ink}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"></path>`;
  else if (kind === 'closed') inner = `<path d="M-23 0Q0 22 23 0Q0 10 -23 0Z" fill="${C.ink}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"></path>`;
  else if (kind === 'squeeze') inner = `<path d="M-18 -14L14 1L-18 16" fill="none" stroke="${C.ink}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" transform="scale(${side === 'L' ? 1 : -1} 1)"></path>`;
  else {
    const w = kind === 'wide' ? [35, 42] : [33, 39];
    inner = `<ellipse rx="${w[0]}" ry="${w[1]}" fill="#fff"></ellipse><path d="M${-w[0] + 3} 8A${w[0]} ${w[1]} 0 0 0 ${w[0] - 3} 8A${w[0] + 6} ${w[1] - 6} 0 0 1 ${-w[0] + 3} 8Z" fill="#F6DCE3"></path>` +
      (hole ? g(`translate(${look[0]} ${look[1]})`, `<g class="m-lookw" style="{{look}}"><g class="m-pup">${pupil(kind)}</g></g>`)
        : look[0] || look[1] ? g(`translate(${look[0]} ${look[1]})`, pupil(kind), 'm-pup') : `<g class="m-pup">${pupil(kind)}</g>`) + lid(side, kind);
    inner = `<g class="m-eye">${inner}</g>`;
  }
  return g(`translate(${EX[side]} ${EY})`, `<g class="m-eye${side}">${inner}</g>`);
}
const BROWS = {
  calm: [[-15, 3, 0, -5, 15, 1]], up: [[-16, -2, 0, -14, 16, -4]], worry: [[-16, 2, 2, -2, 16, -10]],
  focus: [[-16, -8, 2, -4, 16, 4]], think: [[-15, 3, 0, -5, 15, 1], [-16, -8, 0, -18, 16, -8]]
};
function brows(kind) {
  if (!kind) return '';
  const set = BROWS[kind];
  const one = (side, [x1, y1, cx, cy, x2, y2]) => {
    const m = side === 'L' ? 1 : -1;
    return g(`translate(${EX[side]} 226)`, `<path class="bw" d="M${x1 * m} ${y1}Q${cx * m} ${cy} ${x2 * m} ${y2}"></path>`, `m-brow m-brow${side}`);
  };
  return one('L', set[0]) + one('R', set[1] || set[0]);
}
const MOUTH = {
  smile: `<path d="M196 318Q215 324 234 318Q233 342 215 342Q197 342 196 318Z" fill="${C.mouth}" stroke="${C.mouth}" stroke-width="3" stroke-linejoin="round"></path><path d="M204 336Q215 327 226 336Q215 343 204 336Z" fill="${C.tongue}"></path>`,
  grin: `<path d="M188 314Q215 322 242 314Q240 352 215 352Q190 352 188 314Z" fill="${C.mouth}" stroke="${C.mouth}" stroke-width="3" stroke-linejoin="round"></path><path d="M192 316Q215 323 238 316L237 323Q215 329 193 323Z" fill="#fff"></path><path d="M201 344Q215 332 229 344Q215 353 201 344Z" fill="${C.tongue}"></path>`,
  soft: `<path d="M200 320Q215 334 230 320" fill="none" stroke="${C.ink}" stroke-width="6.5" stroke-linecap="round"></path>`,
  o: `<ellipse cx="215" cy="332" rx="12" ry="15" fill="${C.mouth}"></ellipse><ellipse cx="215" cy="341" rx="7" ry="4.5" fill="${C.tongue}"></ellipse>`,
  frown: `<path d="M202 334Q215 322 228 334" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"></path>`,
  snore: `<ellipse cx="215" cy="330" rx="7" ry="8" fill="${C.mouth}"></ellipse>`,
  wavy: `<path d="M203 328Q209 322 215 328Q221 334 227 328" fill="none" stroke="${C.ink}" stroke-width="5.5" stroke-linecap="round"></path>`,
  hmm: `<path d="M204 331Q214 325 229 329" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"></path>`,
  smirk: `<path d="M197 324Q214 342 236 318" fill="none" stroke="${C.ink}" stroke-width="6.5" stroke-linecap="round"></path><path d="M233 315Q239 319 238 325" fill="none" stroke="${C.ink}" stroke-width="4.5" stroke-linecap="round"></path>`,
  determined: `<path d="M197 320H233Q232 340 215 340Q198 340 197 320Z" fill="${C.mouth}" stroke="${C.mouth}" stroke-width="3" stroke-linejoin="round"></path><path d="M198 321H232L231 327H199Z" fill="#fff"></path>`
};
const cheeks = big => [132, 298].map(x => `<ellipse class="m-blush" cx="${x}" cy="316" rx="${big ? 22 : 18}" ry="${big ? 13 : 11}" fill="${C.blush}" opacity="${big ? .85 : .55}"></ellipse>`).join('');
function face(p) {
  const [eL, eR] = Array.isArray(p.eyes) ? p.eyes : [p.eyes, p.eyes];
  return `<g class="m-face">${p.small ? '' : cheeks(p.blush)}${eye('L', eL, p.look, p.lookHole)}${eye('R', eR, p.look, p.lookHole)}${p.small ? '' : brows(p.brows)}${pivot(215, 330, 'm-mouth', MOUTH[p.mouth])}${p.faceExtra || ''}</g>`;
}

// ---------- Ana çizim ----------
// p: eyes, mouth, brows, look, blush, armL/armR {a, item, hand, over}, armsBack, lean, hat, stemTop, cloth, near, behind, fx, fxBack, bg, shoe
function mascot(name, p, opt = {}) {
  const id = 'b' + (++SEQ);
  const b = body(id, p.stemTop, p.small);
  const arms = arm('L', p.armL, p.sleeve) + arm('R', p.armR, p.sleeve);
  const core = pivot(215, 488, 'm-squash',
    (p.armsBack ? arms : '') + (p.behind || '') + b.line + b.fill + (p.noHeart ? '' : heart()) + (p.cloth || '') + face(p) + (p.hat || '') + (p.near || '') + (p.armsBack ? '' : arms) + (p.front || ''));
  const lean = p.lean ? ` transform="rotate(${p.lean} 215 524)"` : '';
  return (`<svg class="m m-${name}${p.cls ? ' ' + p.cls : ''}" viewBox="${p.vb || '0 -40 430 610'}" role="img" aria-label="${opt.label || 'Biri maskotu'}">${defs(id, p.defs)}${p.bg || ''}` +
    `<g transform="translate(215 536)"><ellipse class="m-shadow" rx="98" ry="12" fill="${C.ink}" opacity=".13"></ellipse></g>${p.fxBack || ''}` +
    `<g${lean}>${pivot(215, 530, 'm-tilt', `<g class="m-move">${p.back || ''}${legs(p.shoe)}${core}${p.over || ''}</g>`)}</g>${p.fx || ''}</svg>`).split('{ID}').join(id).replace(/ stroke-line(cap|join)="round"/g, '').replace(/#FFFFFF"/g, '#fff"').replace(/opacity="0\./g, 'opacity=".');
}

module.exports = {mascot, eye, ik, ol, g, pivot, C, HEART, SWOOSH, MINI, STAR, STEM, OUT};
},
'./pozlar.js': function (module, exports, require) {
// Biri maskotu · pozlar, ifadeler ve tutulan nesneler.
const {ik, ol, g, pivot, C, MINI, STAR} = require('./govde.js');

const REST = {a: [-34, 32, 10]};
const R = (t, bend = 1, a3 = 0, extra = {}) => ({a: ik('R', t, bend, a3), ...extra});
const L = (t, bend = 1, a3 = 0, extra = {}) => ({a: ik('L', t, bend, a3), ...extra});
const sparkle = (x, y, s, cls, fill = C.gold) => g(`translate(${x} ${y}) scale(${s})`, `<path d="M0 -12C1.5 -3 3 -1.5 12 0C3 1.5 1.5 3 0 12C-1.5 3 -3 1.5 -12 0C-3 -1.5 -1.5 -3 0 -12Z" fill="${fill}"></path>`, cls);
const miniHeart = (x, y, s, fill, cls) => g(`translate(${x} ${y})`, `<path d="${MINI}" transform="scale(${s})" fill="${fill}" stroke="${C.line}" stroke-width="${3 / s}"></path>`, cls);

// ---------- Nesneler ----------
const BOOK = g('translate(215 446) rotate(-4)',
  ol('path', 'd="M-84 -42Q-42 -54 0 -42Q42 -54 84 -42V44Q42 32 0 44Q-42 32 -84 44Z"', C.teal) +
  `<path d="M-75 -38Q-38 -48 -2 -38V36Q-38 26 -75 36Z" fill="${C.cream}"></path><path d="M2 -38Q38 -48 75 -38V36Q38 26 2 36Z" fill="#F4E9D6"></path>` +
  `<path d="M-64 -22Q-40 -28 -14 -22M-64 -8Q-40 -14 -14 -8M-64 6Q-40 0 -14 6M-64 20Q-46 15 -30 20M14 -22Q40 -28 64 -22M14 -8Q40 -14 64 -8M14 6Q40 0 64 6" fill="none" stroke="#D9C6A6" stroke-width="3" stroke-linecap="round"></path>` +
  `<g class="m-page"><path d="M2 -38Q38 -48 75 -38V36Q38 26 2 36Z" fill="${C.cream}" stroke="#E6D6BB" stroke-width="2"></path><path d="M14 -22Q40 -28 64 -22M14 -8Q40 -14 64 -8" fill="none" stroke="#D9C6A6" stroke-width="3" stroke-linecap="round"></path></g>` +
  `<path d="M0 -42V44" stroke="#C9B48F" stroke-width="3"></path><path d="M30 -46V-20L36 -26L42 -20V-47" fill="${C.red}"></path>`);
const BIGHEART = g('translate(215 432)', `<g class="m-bigheart">${ol('path', `d="${MINI}" transform="scale(5.6)"`, '#FF5F86', 9 / 5.6)}<path d="M-38 -44Q-56 -40 -60 -18" fill="none" stroke="#FFC2D2" stroke-width="9" stroke-linecap="round"></path><circle cx="-62" cy="-2" r="5" fill="#FFC2D2"></circle></g>`);
const PILLOW = g('translate(215 452) rotate(-3)',
  ol('path', 'd="M-92 -34Q-96 -48 -80 -46Q0 -36 80 -46Q96 -48 92 -34Q100 0 92 34Q96 48 80 46Q0 36 -80 46Q-96 48 -92 34Q-100 0 -92 -34Z"', '#C9C1FF') +
  `<path d="M-70 -30Q0 -22 70 -30M-70 30Q0 22 70 30" fill="none" stroke="#ADA2F2" stroke-width="3" stroke-dasharray="6 7" stroke-linecap="round"></path><path d="M-62 -18Q-30 -12 -10 -14" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".7"></path>`);
// Kupa: avuç ortası (0,0); sap elin içinde kalır.
const TROPHY = ol('path', 'd="M-34 -98H34V-76Q34 -40 0 -36Q-34 -40 -34 -76Z"', C.gold) +
  `<path d="M-34 -90H-48Q-56 -60 -26 -50M34 -90H48Q56 -60 26 -50" fill="none" stroke="${C.line}" stroke-width="13" stroke-linecap="round"></path><path d="M-34 -90H-48Q-56 -60 -26 -50M34 -90H48Q56 -60 26 -50" fill="none" stroke="${C.gold}" stroke-width="6" stroke-linecap="round"></path>` +
  ol('rect', 'x="-8" y="-38" width="16" height="34" rx="3"', C.goldDeep) + ol('rect', 'x="-26" y="10" width="52" height="16" rx="5"', C.goldDeep) +
  `<path d="M-20 -88V-66" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".7"></path><g transform="translate(6 -70)"><path d="${STAR}" transform="scale(.6)" fill="#fff" opacity=".9"></path></g>` + sparkle(22, -86, .9, 'm-tw m-d2', '#fff');

// Saklanma kalbi: yüzün önünde tutulur, gözleri örter; üstünden başın tepesi görünür.
const HIDEHEART = g('translate(215 300)', `<g class="m-hide">${ol('path', `d="${MINI}" transform="scale(6.7)"`, '#FF5F86', 9 / 6.7)}` +
  `<path d="M-62 -52Q-84 -44 -86 -14" fill="none" stroke="#FFC2D2" stroke-width="10" stroke-linecap="round"></path><circle cx="-87" cy="6" r="5.5" fill="#FFC2D2"></circle>` +
  `<path d="M-30 18Q0 40 30 18" fill="none" stroke="#E0436B" stroke-width="6" stroke-linecap="round" opacity=".55"></path></g>`);
// Mektup: hocanın notu. Kâğıt iki elle tutulur, köşesinde kalp mühür.
const LETTER = g('translate(215 444) rotate(-4)', `<g class="m-letter">` +
  ol('path', 'd="M-80 -56H62L80 -38V56H-80Z"', C.cream) + `<path d="M62 -56V-38H80" fill="#F1E3C8" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"></path>` +
  `<path d="M-62 -30H40M-62 -12H52M-62 6H46M-62 24H20" fill="none" stroke="#D9C6A6" stroke-width="5" stroke-linecap="round"></path>` +
  g('translate(52 32)', `<circle r="16" fill="${C.red}" stroke="${C.line}" stroke-width="4"></circle><path d="${MINI}" transform="scale(.95) translate(0 -1)" fill="#fff"></path>`) + `</g>`);

// ---------- Efektler ----------
const CONFETTI = [[60, 150, C.gold, 1], [120, 60, '#3EC28A', 2], [300, 40, '#7D8CFF', 3], [380, 110, '#FF8AA0', 4], [40, 260, '#7D8CFF', 2], [400, 230, C.gold, 3], [215, 10, '#3EC28A', 1], [170, 0, '#FF8AA0', 4], [260, 90, C.gold, 2], [350, 300, '#3EC28A', 1]]
  .map(([x, y, c, d], i) => g(`translate(${x} ${y})`, `<rect class="m-conf m-c${d}" x="-6" y="-9" width="${i % 2 ? 12 : 9}" height="${i % 2 ? 7 : 16}" rx="2.5" fill="${c}"></rect>`)).join('');
const STARS_PLUS = (pts, cls = 'm-tw') => pts.map(([x, y, s, d]) => sparkle(x, y, s, `${cls} m-d${d}`)).join('');
const RISE_HEARTS = pts => pts.map(([x, y, s, c, d, side]) => miniHeart(x, y, s, c, `m-rise m-r${side} m-d${d}`)).join('');

const POSES = {
  durus: {
    label: 'Merhaba', use: 'Sakin durur, göz kırpar, hafifçe nefes alır. Sayfa başlıkları ve boş alanlar.',
    eyes: 'open', mouth: 'smile', brows: 'calm', armL: REST, armR: REST
  },
  selam: {
    label: 'Selam', use: 'El sallar, başını hafif yana eğer. Giriş ve karşılama ekranı.',
    eyes: 'open', mouth: 'grin', brows: 'up', armL: REST, armR: {a: [-128, -40, -6], hand: 'open'}
  },
  tesekkur: {
    label: 'Teşekkürler', use: 'Elini kalbine koyup hafifçe eğilir. Teşekkür ve dua sonrası.',
    eyes: 'happy', mouth: 'soft', blush: 1, armL: REST, armR: R([234, 410], 1, {abs: 128}),
    fx: RISE_HEARTS([[270, 330, 1.2, '#FF6F91', 1, 'r'], [300, 300, 1, C.red, 3, 'r']])
  },
  aferin: {
    label: 'Aferin!', use: 'Hazırlanır, zıplar, yere yumuşak iner; konfeti saçılır. Ders bitince.',
    eyes: 'star', mouth: 'grin', brows: 'up', armL: {a: [-150, -12, 0], hand: 'open'}, armR: {a: [-150, -12, 0], hand: 'open'},
    fx: CONFETTI
  },
  vay: {
    label: 'Vay!', use: 'Ellerini yanaklarına götürür, irkilir. Yeni rozet ya da sürpriz.',
    eyes: 'wide', mouth: 'o', brows: 'up', armL: L([138, 318], 1, 160, {hand: 'open'}), armR: R([292, 318], 1, 160, {hand: 'open'}),
    fx: g('translate(352 128)', `<g class="m-pop">${ol('path', 'd="M-30 -40H30Q40 -40 40 -30V18Q40 28 30 28H6L-6 44L-8 28H-30Q-40 28 -40 18V-30Q-40 -40 -30 -40Z"', '#fff', 7)}<path d="M0 -26V2" stroke="${C.red}" stroke-width="11" stroke-linecap="round"></path><circle cx="0" cy="16" r="6.5" fill="${C.red}"></circle></g>`)
  },
  dusun: {
    label: 'Düşünüyor', use: 'Parmağı çenesinde, gözler yukarıda; sonunda ampul yanar. Soru ekranı.',
    eyes: 'open', look: [7, -10], mouth: 'hmm', brows: 'think', armL: REST, armR: R([244, 356], 1, {abs: 150}),
    fx: `<circle cx="318" cy="200" r="7" fill="#fff" stroke="${C.line}" stroke-width="4"></circle><circle cx="340" cy="172" r="11" fill="#fff" stroke="${C.line}" stroke-width="4"></circle>` +
      g('translate(370 120)', `<g class="m-q">${ol('circle', 'r="40"', '#fff', 7)}<text y="16" text-anchor="middle" font-family="Nunito,system-ui,sans-serif" font-size="48" font-weight="900" fill="${C.red}">?</text></g>` +
        `<g class="m-bulb">${ol('circle', 'r="40"', '#FFF6D6', 7)}<path d="M0 -24C-14 -24 -22 -14 -22 -3C-22 7 -14 12 -12 20H12C14 12 22 7 22 -3C22 -14 14 -24 0 -24Z" fill="${C.gold}" stroke="${C.goldDeep}" stroke-width="3"></path><rect x="-10" y="21" width="20" height="9" rx="3" fill="#9AA3B5"></rect><path d="M-8 -6Q-8 -14 0 -16" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"></path></g>`)
  },
  oku: {
    label: 'Okuyor', use: 'Kitabı iki eliyle tutar, gözleri satırları izler, sayfa çevrilir. Ders sürerken.',
    eyes: 'open', look: [0, 11], mouth: 'soft', brows: 'calm', noHeart: true, near: BOOK,
    armL: L([140, 446], 1, -150), armR: R([290, 446], 1, -150)
  },
  dua: {
    label: 'Dua', use: 'Avuçlarını açar, gözleri kapalı, sakin nefes alır. Dua ve şükür anları.',
    eyes: 'closed', mouth: 'soft', brows: 'calm', blush: 1, armL: L([166, 404], 1, {abs: 196}, {hand: 'open'}), armR: R([264, 404], 1, {abs: 196}, {hand: 'open'}),
    fx: STARS_PLUS([[150, 336, 1.1, 1], [282, 330, .9, 2], [214, 300, .8, 3], [124, 270, .8, 4], [306, 262, .7, 1]], 'm-glow')
  },
  uyku: {
    label: 'Uykuda', use: 'Yastığına sarılır, yavaş nefes alır, gece külahı sallanır. Uzun ara verilince.',
    eyes: 'closed', mouth: 'snore', blush: 1, noHeart: true, near: PILLOW, lean: -3,
    armL: L([150, 438], 1, -120), armR: R([282, 438], 1, -120),
    stemTop: g('translate(122 46)', ol('path', 'd="M-58 18Q-60 -6 -40 -16Q0 -34 40 -16Q60 -6 58 18Q0 2 -58 18Z"', '#7D8CFF', 8) +
      pivot(0, -20, 'm-cap', ol('path', 'd="M-38 -14Q-10 -60 40 -48Q86 -36 96 6Q70 -18 40 -16Z"', '#7D8CFF', 8) + `<path d="M-18 -30Q20 -50 60 -34" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".5"></path>` + ol('circle', 'cx="98" cy="12" r="15"', '#fff', 8)) +
      `<path d="M-56 10Q0 -6 56 10" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"></path>`),
    fx: [[292, 236, 34, 1], [292, 236, 44, 2], [292, 236, 56, 3]].map(([x, y, s, d]) => g(`translate(${x} ${y})`, `<text class="m-z m-d${d}" font-family="Nunito,system-ui,sans-serif" font-size="${s}" font-weight="900" fill="#7D8CFF" stroke="#fff" stroke-width="6" paint-order="stroke">z</text>`)).join('')
  },
  kos: {
    label: 'Koşuyor', use: 'Öne eğilir, kollar ve bacaklar ritimle çalışır. Yolculuk haritasında.',
    eyes: 'focus', mouth: 'determined', brows: 'focus', lean: 7, armL: {a: [-10, 95, 0]}, armR: {a: [-10, 95, 0]},
    fxBack: `<g class="m-speed"><path d="M20 250H80M8 310H62M30 370H86" stroke="#F3B6C4" stroke-width="10" stroke-linecap="round"></path></g>` +
      [[150, 528, 1], [120, 520, 2], [96, 530, 3]].map(([x, y, d]) => g(`translate(${x} ${y})`, `<circle class="m-dust m-d${d}" r="14" fill="#F1E3E7"></circle>`)).join('')
  },
  iyilik: {
    label: 'İyilik', use: 'Kocaman bir kalbi uzatır, kalbi atar, küçük kalpler yükselir. İyilik görevleri.',
    eyes: 'heart', mouth: 'grin', blush: 1, noHeart: true, near: BIGHEART,
    armL: L([150, 438], 1, -150), armR: R([280, 438], 1, -150),
    fx: RISE_HEARTS([[90, 320, 1.4, '#FF6F91', 1, 'l'], [350, 300, 1.2, C.red, 2, 'r'], [120, 220, 1, '#FF6F91', 3, 'l'], [320, 200, 1.1, '#FF6F91', 4, 'r']])
  },
  uzgun: {
    label: 'Üzgün ama umutlu', use: 'Bir damla gözyaşı, derin bir nefes. Yanlış cevapta: "Olsun, tekrar deneriz."',
    eyes: 'sad', look: [0, 7], mouth: 'frown', brows: 'worry', armL: L([176, 476], 1, -160), armR: R([254, 476], 1, -160),
    fx: g('translate(288 300)', `<path class="m-tear" d="M0 -11C5 -4 10 2 10 8A10 10 0 0 1 -10 8C-10 2 -5 -4 0 -11Z" fill="${C.sky}" stroke="#4BA3E0" stroke-width="3"></path>`)
  },
  kupa: {
    label: 'Kupa', use: 'Kupayı havaya kaldırır, kupa parlar, yıldızlar çakar. Ünite tamamlanınca.',
    eyes: 'star', mouth: 'grin', brows: 'up', armL: {a: [-140, -20, 0], hand: 'open'}, armR: {a: [-150, -14, 0], item: TROPHY},
    fx: STARS_PLUS([[300, 70, 1.3, 1], [420, 110, 1, 2], [380, 220, .9, 3], [250, 120, .7, 4]])
  },
  kahkaha: {
    label: 'Kahkaha', use: 'Gözleri kısılır, karnını tutup sarsıla sarsıla güler. Eğlenceli anlar.',
    eyes: 'squeeze', mouth: 'grin', brows: 'up', blush: 1, armL: L([150, 462], 1, -150), armR: R([280, 462], 1, -150),
    fx: g('translate(350 150)', `<text class="m-ha m-d1" font-family="Nunito,system-ui,sans-serif" font-size="40" font-weight="900" fill="${C.red}" stroke="#fff" stroke-width="7" paint-order="stroke">ha</text>`) +
      g('translate(4 330)', `<text class="m-ha m-d3" font-family="Nunito,system-ui,sans-serif" font-size="34" font-weight="900" fill="${C.red}" stroke="#fff" stroke-width="7" paint-order="stroke">ha</text>`) +
      g('translate(132 276)', `<path class="m-joy" d="M0 -8C4 -2 7 2 7 6A7 7 0 0 1 -7 6C-7 2 -4 -2 0 -8Z" fill="${C.sky}"></path>`) + g('translate(298 276)', `<path class="m-joy m-joyR" d="M0 -8C4 -2 7 2 7 6A7 7 0 0 1 -7 6C-7 2 -4 -2 0 -8Z" fill="${C.sky}"></path>`)
  },
  gizle: {
    label: 'Bakmıyorum', use: 'Kocaman kalbinin arkasına saklanır, gözlerini kapatır. Parola yazılırken.',
    eyes: 'closed', mouth: 'soft', brows: 'up', blush: 1, noHeart: true, near: HIDEHEART,
    armL: L([140, 326], 1, {abs: 150}, {hand: 'open'}), armR: R([290, 326], 1, {abs: -150}, {hand: 'open'})
  },
  isaret: {
    label: 'Şuraya bak', use: 'Kolunu uzatıp gösterir, gözleri gösterdiği yere bakar. Tanıtım turu ve ipuçları.',
    eyes: 'open', look: [10, -8], mouth: 'grin', brows: 'up', armL: REST, armR: {a: [-124, -6, 2], hand: 'point'},
    fx: STARS_PLUS([[438, 268, .75, 1], [414, 232, .55, 3], [446, 314, .5, 2]])
  },
  mektup: {
    label: 'Bir notun var', use: 'Hocanın notunu iki eliyle tutup okur, sonra sana bakar. Notlar ve mesajlar.',
    eyes: 'open', look: [0, 10], mouth: 'soft', brows: 'calm', noHeart: true, near: LETTER,
    armL: L([140, 448], 1, -150), armR: R([290, 448], 1, -150),
    fx: RISE_HEARTS([[330, 330, 1.1, '#FF6F91', 1, 'r'], [96, 340, .9, C.red, 3, 'l']])
  },
  utangac: {
    label: 'Utangaç', use: 'Ellerini arkasına saklar, yanakları kızarır, ayağını yere sürter. Tanışma anı.',
    eyes: 'open', look: [-8, 9], mouth: 'wavy', brows: 'worry', blush: 1, armsBack: true,
    armL: L([180, 470], 1, -150), armR: R([250, 470], 1, -150)
  }
};

module.exports = {POSES, REST, R, L, sparkle, miniHeart, STARS_PLUS, RISE_HEARTS, CONFETTI};
},
'./kiyafetler.js': function (module, exports, require) {
// Biri maskotu · kıyafetler. Her kıyafet bir poz nesnesidir; şapka, giysi ve nesneler gövdeyle birlikte hareket eder.
const {eye, ik, ol, g, pivot, C, MINI, STAR} = require('./govde.js');
const {REST, R, L, sparkle, miniHeart, STARS_PLUS, RISE_HEARTS} = require('./pozlar.js');

const E = 'cubic-bezier(.45,0,.55,1)';
const HAT = (inner, x = 262, y = 206, rot = 19) => g(`translate(${x} ${y}) rotate(${rot})`, inner);
const clipBody = inner => `<g clip-path="url(#{ID}-bw)">${inner}</g>`;
const VL = 'M40 344Q118 336 168 376L174 500H40Z', VR = 'M390 344Q312 336 262 376L256 500H390Z';
const VLe = 'M40 344Q118 336 168 376L174 500', VRe = 'M390 344Q312 336 262 376L256 500';
function vest(fill, trim, extra = '') {
  return clipBody(`<path d="${VL}" fill="${fill}"></path><path d="${VR}" fill="${fill}"></path>${extra}` +
    `<path d="${VLe}" fill="none" stroke="${trim}" stroke-width="12"></path><path d="${VRe}" fill="none" stroke="${trim}" stroke-width="12"></path>` +
    `<path d="${VLe}" fill="none" stroke="${C.line}" stroke-width="5"></path><path d="${VRe}" fill="none" stroke="${C.line}" stroke-width="5"></path>`);
}
const drop = (cls, fill = C.sky) => `<path class="${cls}" d="M0 -9C4 -3 7 1 7 6A7 7 0 0 1 -7 6C-7 1 -4 -3 0 -9Z" fill="${fill}" stroke="#4BA3E0" stroke-width="2"></path>`;

// ---------- Şapkalar ----------
const TAKKE = HAT(ol('path', 'd="M-62 14Q-61 -44 0 -46Q61 -44 62 14Q0 -12 -62 14Z"', '#FFFFFF', 8) +
  `<path d="M-52 2Q0 -22 52 2M-44 -18Q0 -36 44 -18M-28 -34Q0 -44 28 -34" fill="none" stroke="#E4D8DC" stroke-width="4" stroke-dasharray="2 7" stroke-linecap="round"></path>` +
  `<path d="M-40 -22Q-30 -38 -12 -40" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"></path><circle cy="-46" r="5" fill="#E4D8DC"></circle>`, 258, 212, 17);
const BERE = HAT(ol('path', 'd="M-72 6Q-70 -66 0 -68Q70 -66 72 6Z"', C.teal, 8) +
  `<path d="M-50 -8V-48M-30 -6V-60M-10 -5V-66M10 -5V-66M30 -6V-60M50 -8V-48" stroke="#0F6B62" stroke-width="4" stroke-linecap="round"></path>` +
  ol('path', 'd="M-80 24Q0 -8 80 24L78 -2Q0 -32 -78 -2Z"', '#0F6B62', 8) +
  `<path d="M-64 8V22M-44 2V16M-24 -2V12M-4 -3V11M16 -2V12M36 0V14M56 6V20" stroke="#14857A" stroke-width="5" stroke-linecap="round"></path>` +
  g('translate(0 -70)', ol('circle', 'r="21"', C.cream, 8) + `<path d="M-10 -6L8 8M-6 8L10 -8M0 -14V14" stroke="#EADFCB" stroke-width="3" stroke-linecap="round"></path>`, 'm-pom'), 260, 200, 18);
const HASIR = HAT(ol('path', 'd="M-102 10Q0 -16 102 10Q108 24 86 26Q0 10 -86 26Q-108 24 -102 10Z"', '#F2C46B', 8) +
  ol('path', 'd="M-50 6Q-52 -42 0 -46Q52 -42 50 6Q0 -6 -50 6Z"', '#F6D27E', 8) +
  `<path d="M-50 -2Q0 -16 50 -2V-14Q0 -28 -50 -14Z" fill="${C.teal}"></path><path d="M-80 16Q0 2 80 16M-30 -24Q0 -34 30 -24" fill="none" stroke="#D9A44A" stroke-width="3" stroke-dasharray="5 6" stroke-linecap="round"></path>` +
  g('translate(34 -14) rotate(-20)', `<ellipse rx="12" ry="7" fill="#3EC28A" stroke="${C.line}" stroke-width="3"></ellipse>`), 258, 200, 17);
const KASIF = HAT(ol('path', 'd="M-88 12Q0 -8 88 12Q94 22 80 26Q0 10 -80 26Q-94 22 -88 12Z"', '#C89B55', 8) +
  ol('path', 'd="M-56 10Q-55 -52 0 -54Q55 -52 56 10Q0 -2 -56 10Z"', '#E3BE7E', 8) +
  `<path d="M-56 0Q0 -12 56 0V-12Q0 -24 -56 -12Z" fill="#7A5A2A"></path><path d="M-30 -36Q-14 -48 6 -48" fill="none" stroke="#F4DAA8" stroke-width="6" stroke-linecap="round"></path><circle cy="-54" r="6" fill="#C89B55" stroke="${C.line}" stroke-width="3"></circle>`, 262, 206);
const KEP = HAT(g('translate(0 -6)', `<g class="m-capt">` + ol('path', 'd="M-44 6V24Q0 40 44 24V6Z"', '#3A2730', 8) + ol('path', 'd="M-84 0L0 -30L84 0L0 30Z"', C.ink, 8) +
  `<path d="M-70 0L0 -24L56 -4" fill="none" stroke="#4A3540" stroke-width="3"></path><circle r="6" fill="${C.gold}"></circle>` +
  g('translate(0 0)', `<path d="M0 0L60 8V44" fill="none" stroke="${C.gold}" stroke-width="5" stroke-linecap="round"></path><path d="M54 40H66L70 64H50Z" fill="${C.gold}" stroke="${C.goldDeep}" stroke-width="2"></path>`, 'm-tassel') + `</g>`), 262, 206);
const KEP_BASLIK = HAT(ol('path', 'd="M-58 12Q-57 -46 0 -48Q57 -46 58 12Q0 -6 -58 12Z"', C.teal, 8) +
  ol('path', 'd="M36 2Q86 -6 108 10Q88 24 36 14Z"', '#0F6B62', 8) + `<circle cy="-48" r="6" fill="#0F6B62"></circle>` +
  `<path d="${MINI}" transform="translate(-8 -18) scale(1.3)" fill="#fff"></path><path d="M-40 -26Q-30 -40 -10 -42" fill="none" stroke="#3FB3A6" stroke-width="6" stroke-linecap="round"></path>`, 262, 206);
const ASCI = HAT(ol('path', 'd="M-54 -14C-86 -26 -78 -88 -40 -80C-34 -118 34 -118 40 -80C78 -88 86 -26 54 -14Z"', '#FFFFFF', 8) +
  `<path d="M-30 -24C-34 -46 -30 -64 -20 -76M0 -22C0 -50 2 -72 6 -96M28 -24C34 -46 34 -64 26 -78" fill="none" stroke="#EADFE3" stroke-width="5" stroke-linecap="round"></path>` +
  ol('path', 'd="M-54 14Q0 -2 54 14V-14Q0 -30 -54 -14Z"', '#FFFFFF', 8) + `<path d="M-50 4Q0 -10 50 4" fill="none" stroke="#EADFE3" stroke-width="4"></path>`, 258, 206, 16);

// ---------- Tutulan nesneler (avuç ortası 0,0; ekrana göre dik) ----------
const TESBIH = `<g class="m-swing">` + Array.from({length: 17}, (_, i) => {
  const t = (i + 1) / 18 * Math.PI * 2, x = Math.sin(t) * 13, y = 36 - Math.cos(t) * 34;
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.6" fill="#E39A3B" stroke="${C.line}" stroke-width="2.5"></circle>`;
}).join('') + `<path d="M0 70V80" stroke="${C.line}" stroke-width="3"></path>` + ol('path', 'd="M-5 78H5L4 92H-4Z"', '#E39A3B', 5) +
  `<path d="M-4 92L-9 112M0 92V114M4 92L9 112" stroke="#C47A22" stroke-width="3" stroke-linecap="round"></path></g>`;
const FENER = `<g class="m-lant"><circle cx="0" cy="72" r="58" fill="#FFD66B" opacity=".28" class="m-lglow"></circle>` +
  `<path d="M0 -4V14" stroke="${C.line}" stroke-width="4"></path>` + ol('path', 'd="M-10 14H10L14 24H-14Z"', C.gold, 6) +
  ol('path', 'd="M-22 30Q0 14 22 30L26 38H-26Z"', C.gold, 6) +
  ol('path', 'd="M-26 38H26L32 92H-32Z"', '#FFE7A3', 6) +
  `<path d="M-14 38L-18 92M0 38V92M14 38L18 92" stroke="${C.goldDeep}" stroke-width="4"></path>` +
  `<path d="M-24 44L-16 44L-19 86H-29Z" fill="#FF8AA0" opacity=".85"></path><path d="M-10 44H10L11 86H-11Z" fill="#FFF3C9"></path><path d="M16 44H24L29 86H19Z" fill="#3FB3A6" opacity=".8"></path>` +
  `<ellipse class="m-flame" cx="0" cy="70" rx="5" ry="9" fill="#FF9F1C"></ellipse>` +
  ol('path', 'd="M-34 92H34L28 104H-28Z"', C.gold, 6) + ol('path', 'd="M-8 104H8L0 118Z"', C.gold, 5) + `</g>`;
const TEPSI = ol('path', 'd="M-62 -6Q0 4 62 -6L56 6Q0 16 -56 6Z"', C.gold, 7) +
  [[-36, -16, '#FF6F91'], [-12, -22, '#7D8CFF'], [14, -18, '#3EC28A'], [38, -14, C.gold], [0, -36, '#FF8A1F'], [-24, -34, '#FFFFFF'], [24, -34, '#FF6F91']]
    .map(([x, y, c]) => c === '#FFFFFF' ? `<rect x="${x - 9}" y="${y - 9}" width="18" height="18" rx="4" fill="#FFE3EA" stroke="${C.line}" stroke-width="3"></rect>`
      : `<g transform="translate(${x} ${y}) rotate(${x / 3})"><path d="M-10 0L-18 -7V7Z" fill="${c}" stroke="${C.line}" stroke-width="2.5" stroke-linejoin="round"></path><path d="M10 0L18 -7V7Z" fill="${c}" stroke="${C.line}" stroke-width="2.5" stroke-linejoin="round"></path><ellipse rx="11" ry="9" fill="${c}" stroke="${C.line}" stroke-width="3"></ellipse><path d="M-5 -3Q0 -6 5 -3" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"></path></g>`).join('');
const KOVA = `<g class="m-pour">` + `<path d="M4 -10Q-6 -40 20 -44Q44 -46 40 -12" fill="none" stroke="${C.line}" stroke-width="15"></path><path d="M4 -10Q-6 -40 20 -44Q44 -46 40 -12" fill="none" stroke="#2FA67A" stroke-width="7"></path>` +
  ol('path', 'd="M-8 -12H52L46 40Q22 50 -2 40Z"', '#3EC28A', 8) + ol('path', 'd="M48 4L96 -16L100 -8L52 18Z"', '#3EC28A', 7) +
  ol('ellipse', 'cx="99" cy="-12" rx="7" ry="11" transform="rotate(-24 99 -12)"', '#2FA67A', 6) +
  `<path d="M2 0H44" stroke="#2FA67A" stroke-width="5"></path><path d="${MINI}" transform="translate(22 22)" fill="#fff"></path>` +
  [0, 1, 2].map(i => g(`translate(${104 + i * 6} ${2 + i * 4})`, drop(`m-pdrop m-d${i + 1}`))).join('') + `</g>`;
const KASIK = `<path d="M-3 4L-34 -42" stroke="${C.line}" stroke-width="13" stroke-linecap="round"></path><path d="M-3 4L-34 -42" stroke="#D49A5B" stroke-width="7" stroke-linecap="round"></path>` +
  ol('ellipse', 'cx="-40" cy="-52" rx="12" ry="16" transform="rotate(-34 -40 -52)"', '#D49A5B', 7) + `<ellipse cx="-42" cy="-54" rx="6" ry="9" transform="rotate(-34 -42 -54)" fill="#F2A65A"></ellipse>`;
const DIPLOMA = g('rotate(-62)', ol('rect', 'x="-48" y="-13" width="96" height="26" rx="13"', C.cream, 8) +
  `<ellipse cx="46" cy="0" rx="6" ry="13" fill="#EADFCB" stroke="${C.line}" stroke-width="3"></ellipse><rect x="-8" y="-14" width="16" height="28" fill="${C.red}"></rect><path d="M0 14L-8 34M0 14L8 34" stroke="${C.red}" stroke-width="5" stroke-linecap="round"></path>`);
const SEMSIYE = `<g transform="rotate(-14)">` +
  `<path d="M0 -6V-292" stroke="${C.line}" stroke-width="11" stroke-linecap="round"></path><path d="M0 -6V-292" stroke="#5B4A52" stroke-width="5" stroke-linecap="round"></path>` +
  `<path d="M0 8V24Q0 38 -14 38Q-26 38 -26 26" fill="none" stroke="${C.line}" stroke-width="12" stroke-linecap="round"></path><path d="M0 8V24Q0 38 -14 38Q-26 38 -26 26" fill="none" stroke="${C.gold}" stroke-width="6" stroke-linecap="round"></path>` +
  g('translate(0 -290)', ol('path', 'd="M-168 0Q-160 -118 0 -124Q160 -118 168 0Q147 -16 126 0Q105 -16 84 0Q63 -16 42 0Q21 -16 0 0Q-21 -16 -42 0Q-63 -16 -84 0Q-105 -16 -126 0Q-147 -16 -168 0Z"', C.teal, 9) +
    `<path d="M-126 0Q-112 -100 0 -124Q-60 -80 -84 0Q-105 -16 -126 0Z" fill="${C.gold}"></path><path d="M126 0Q112 -100 0 -124Q60 -80 84 0Q105 -16 126 0Z" fill="${C.gold}"></path><path d="M-42 0Q-30 -90 0 -124Q30 -90 42 0Q21 -16 0 0Q-21 -16 -42 0Z" fill="${C.gold}"></path>` +
    `<path d="M-168 0Q-160 -118 0 -124Q160 -118 168 0" fill="none" stroke="${C.line}" stroke-width="5"></path><path d="M-120 -40Q-90 -96 -30 -110" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".55"></path>` +
    `<path d="M0 -124V-140" stroke="${C.line}" stroke-width="8" stroke-linecap="round"></path>`) + `</g>`;
const KUPA_SICAK = g('translate(215 452)', ol('path', 'd="M-44 -40H44V22Q44 44 22 44H-22Q-44 44 -44 22Z"', '#FFFFFF', 9) +
  `<path d="M44 -24Q74 -24 72 2Q70 24 44 22" fill="none" stroke="${C.line}" stroke-width="17"></path><path d="M44 -24Q74 -24 72 2Q70 24 44 22" fill="none" stroke="#fff" stroke-width="9"></path>` +
  `<path d="M-44 -18H44V-6H-44Z" fill="${C.teal}"></path><path d="${MINI}" transform="translate(0 16) scale(1.4)" fill="${C.red}"></path><ellipse cy="-40" rx="40" ry="6" fill="#C98A5C"></ellipse>` +
  [-16, 4, 22].map((x, i) => g(`translate(${x} -52)`, `<path class="m-steam m-d${i + 1}" d="M0 0C-8 -10 8 -18 0 -28C-8 -38 8 -46 0 -56" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".95"></path>`)).join(''));
const KOLI = g('translate(215 450)', `<g transform="translate(-30 -52) rotate(-12)">${ol('circle', 'r="17"', C.red, 7)}<path d="M2 -16Q8 -26 16 -24" stroke="#3EC28A" stroke-width="5" stroke-linecap="round"></path><path d="M-8 -6Q-4 -10 2 -9" stroke="#fff" stroke-width="4" stroke-linecap="round"></path></g>` +
  `<g transform="translate(26 -50) rotate(14)">${ol('rect', 'x="-30" y="-14" width="60" height="28" rx="14"', '#E0A15A', 7)}<path d="M-14 -8V6M0 -10V8M14 -8V6" stroke="#B9742E" stroke-width="4" stroke-linecap="round"></path></g>` +
  ol('path', 'd="M-82 -40H82V40Q82 46 76 46H-76Q-82 46 -82 40Z"', '#D9A066', 9) + ol('path', 'd="M-82 -40L-94 -58H-30L-18 -40Z"', '#C98E52', 7) + ol('path', 'd="M82 -40L94 -58H30L18 -40Z"', '#C98E52', 7) +
  `<path d="M-82 -26H82" stroke="#C98E52" stroke-width="4"></path>` + g('translate(0 8)', ol('circle', 'r="22"', '#fff', 6) + `<path d="${MINI}" transform="translate(0 2) scale(1.6)" fill="${C.red}"></path>`));
const STETO_NEAR = `<path d="M250 418C238 482 148 490 122 440" fill="none" stroke="${C.line}" stroke-width="13" stroke-linecap="round"></path><path d="M250 418C238 482 148 490 122 440" fill="none" stroke="#5C6B7A" stroke-width="7" stroke-linecap="round"></path>` +
  `<path d="M122 440L108 410M122 440L134 408" fill="none" stroke="${C.line}" stroke-width="11" stroke-linecap="round"></path><path d="M122 440L108 410M122 440L134 408" fill="none" stroke="#5C6B7A" stroke-width="5" stroke-linecap="round"></path>` +
  `<circle cx="108" cy="408" r="6" fill="#C9D2DC" stroke="${C.line}" stroke-width="3"></circle><circle cx="134" cy="406" r="6" fill="#C9D2DC" stroke="${C.line}" stroke-width="3"></circle>`;
const STETO_HEAD = ol('circle', 'cx="-6" cy="-14" r="15"', '#C9D2DC', 7) + `<circle cx="-6" cy="-14" r="7" fill="#9AA6B3"></circle>`;

// ---------- Giysiler ----------
const ATKI = clipBody(`<path d="M40 330Q215 366 390 330L390 358Q215 394 40 358Z" fill="${C.gold}"></path><path d="M40 342Q215 378 390 342" fill="none" stroke="${C.teal}" stroke-width="6"></path>` +
  `<path d="M40 330Q215 366 390 330M390 358Q215 394 40 358" fill="none" stroke="${C.line}" stroke-width="5"></path>`) +
  pivot(292, 366, 'm-tail', ol('path', 'd="M280 360L312 356L326 452L294 458Z"', C.gold, 8) + `<path d="M286 384L316 380M289 404L319 400" stroke="${C.teal}" stroke-width="6"></path><path d="M296 458L294 472M304 457L303 471M312 456L312 470M320 454L321 468" stroke="${C.gold}" stroke-width="4" stroke-linecap="round"></path>`);
const ASKILAR = clipBody(`<path d="M96 250Q72 360 118 480" fill="none" stroke="${C.line}" stroke-width="30"></path><path d="M96 250Q72 360 118 480" fill="none" stroke="${C.teal}" stroke-width="20"></path>` +
  `<path d="M334 250Q358 360 312 480" fill="none" stroke="${C.line}" stroke-width="30"></path><path d="M334 250Q358 360 312 480" fill="none" stroke="${C.teal}" stroke-width="20"></path>`) +
  `<rect x="74" y="404" width="26" height="20" rx="5" fill="${C.gold}" stroke="${C.line}" stroke-width="4"></rect><rect x="330" y="404" width="26" height="20" rx="5" fill="${C.gold}" stroke="${C.line}" stroke-width="4"></rect>`;
const CANTA = pivot(330, 420, 'm-bag', ol('path', 'd="M262 250Q262 228 286 228H372Q398 228 400 254L406 410Q406 426 390 426H278Q262 426 262 410Z"', C.gold, 9) +
  `<path d="M314 228Q330 196 348 228" fill="none" stroke="${C.line}" stroke-width="14"></path><path d="M314 228Q330 196 348 228" fill="none" stroke="${C.teal}" stroke-width="7"></path>` +
  ol('path', 'd="M366 300H404V380H366Z"', '#FFB31F', 7) + `<path d="M372 316H400" stroke="${C.line}" stroke-width="4"></path>`);
const YELEK_BAYRAM = vest('#138A5E', C.gold,
  [[100, 420], [330, 420]].map(([x, y]) => `<g transform="translate(${x} ${y})"><path d="M0 -20C-12 -14 -14 2 -8 10H8C14 2 12 -14 0 -20Z" fill="${C.gold}"></path><path d="M0 -20C-4 -10 -4 2 0 10M-8 10Q0 4 8 10" fill="none" stroke="#0E6B49" stroke-width="2.5"></path><path d="M0 10V28" stroke="${C.gold}" stroke-width="4" stroke-linecap="round"></path><path d="M0 20Q-10 14 -14 18M0 22Q10 16 14 20" fill="none" stroke="${C.gold}" stroke-width="3.5" stroke-linecap="round"></path></g>`).join('') +
  `<circle cx="160" cy="400" r="5" fill="${C.gold}"></circle><circle cx="162" cy="430" r="5" fill="${C.gold}"></circle><circle cx="270" cy="400" r="5" fill="${C.gold}"></circle><circle cx="268" cy="430" r="5" fill="${C.gold}"></circle>`);
const YELEK_GONULLU = vest('#FF8A1F', '#FFB25E',
  `<path d="M40 420H174M256 420H390" stroke="#E9EEF2" stroke-width="14"></path><path d="M40 420H174M256 420H390" stroke="#C9D2DC" stroke-width="3" stroke-dasharray="8 8"></path>`) +
  g('translate(128 384)', ol('circle', 'r="17"', '#fff', 6) + `<path d="${MINI}" transform="translate(0 1) scale(1.15)" fill="${C.red}"></path>`);
const ONLUK = clipBody(`<path d="${VL}" fill="#FFFFFF"></path><path d="${VR}" fill="#FFFFFF"></path><path d="M40 344Q118 336 168 376L150 400Q110 360 40 366Z" fill="#EEF3F7"></path><path d="M390 344Q312 336 262 376L280 400Q320 360 390 366Z" fill="#EEF3F7"></path>` +
  `<path d="${VLe}" fill="none" stroke="${C.line}" stroke-width="5"></path><path d="${VRe}" fill="none" stroke="${C.line}" stroke-width="5"></path>` +
  `<path d="M140 350L166 392M290 350L264 392" fill="none" stroke="#DCE3EA" stroke-width="5" stroke-linecap="round"></path><circle cx="266" cy="420" r="5" fill="#C9D2DC"></circle><circle cx="264" cy="452" r="5" fill="#C9D2DC"></circle>` +
  `<rect x="300" y="432" width="44" height="30" rx="6" fill="#F4F7FA" stroke="#C9D2DC" stroke-width="3"></rect><path d="M314 434V410" stroke="${C.teal}" stroke-width="6" stroke-linecap="round"></path>`) +
  `<rect x="98" y="430" width="48" height="36" rx="7" fill="#F4F7FA" stroke="${C.line}" stroke-width="4"></rect>`;
const AYNA = g('translate(123 150)', `<rect x="-58" y="-9" width="116" height="18" rx="6" fill="#FFFFFF" stroke="${C.line}" stroke-width="5"></rect>` + ol('circle', 'r="26"', '#DCE3EA', 7) + `<circle r="17" fill="#B8C4D0"></circle><path d="M-10 -8Q-4 -14 4 -14" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"></path>`);

// ---------- Arka planlar ve efektler ----------
const GECE = `<circle cx="215" cy="300" r="222" fill="#1E2A5A"></circle><circle cx="215" cy="300" r="222" fill="none" stroke="#2C3B78" stroke-width="10"></circle>` +
  g('translate(340 70)', `<path d="M0 -40A40 40 0 1 0 26 30A32 32 0 1 1 0 -40Z" fill="${C.gold}"></path>`, 'm-moon') +
  [[90, 60, 1, 1], [180, 20, .7, 2], [60, 170, .8, 3], [400, 200, .7, 4], [380, 330, .9, 2], [40, 330, .6, 1], [260, 40, .6, 3]].map(([x, y, s, d]) => sparkle(x, y, s, `m-tw m-d${d}`, '#FFE7A3')).join('');
const KAR = `<circle cx="215" cy="300" r="222" fill="#EAF5FF"></circle>` +
  [[50, 40, 1, 1], [140, -10, .8, 2], [360, 30, 1, 3], [410, 160, .7, 4], [20, 220, .8, 2], [300, -20, .7, 1], [390, 320, .9, 3], [60, 380, .7, 4]].map(([x, y, s, d]) =>
    g(`translate(${x} ${y})`, `<g class="m-snow m-d${d}"><path d="M0 -10V10M-9 -5L9 5M-9 5L9 -5" stroke="#9CCBF0" stroke-width="${3.5 / s}" stroke-linecap="round" transform="scale(${s})"></path></g>`)).join('');
const YAGMUR = [[16, 0, 1], [44, 120, 2], [410, 40, 3], [392, 220, 4], [24, 300, 3], [418, 380, 1]].map(([x, y, d]) =>
  g(`translate(${x} ${y})`, `<path class="m-rain m-d${d}" d="M0 0L-4 18" stroke="#6FBDF0" stroke-width="5" stroke-linecap="round"></path>`)).join('');
const BIRIKINTI = `<g transform="translate(215 540)"><ellipse rx="150" ry="20" fill="#CFE9FB"></ellipse><ellipse class="m-ripple" rx="60" ry="8" fill="none" stroke="#8FD3FF" stroke-width="4"></ellipse><ellipse class="m-ripple m-d2" rx="60" ry="8" fill="none" stroke="#8FD3FF" stroke-width="4"></ellipse></g>`;
const FIDAN = g('translate(394 534)', `<ellipse cx="0" cy="2" rx="40" ry="10" fill="#B9845A"></ellipse>` +
  `<g class="m-grow">` + `<path d="M0 0Q-4 -40 2 -74" fill="none" stroke="${C.line}" stroke-width="10" stroke-linecap="round"></path><path d="M0 0Q-4 -40 2 -74" fill="none" stroke="#2FA67A" stroke-width="5" stroke-linecap="round"></path>` +
  g('translate(0 -40) rotate(-30)', `<g class="m-leafA">${ol('ellipse', 'cx="-18" cy="0" rx="18" ry="9"', '#3EC28A', 6)}</g>`) +
  g('translate(1 -58) rotate(28)', `<g class="m-leafB">${ol('ellipse', 'cx="18" cy="0" rx="18" ry="9"', '#3EC28A', 6)}</g>`) +
  g('translate(2 -74)', ol('ellipse', 'cx="0" cy="-12" rx="10" ry="15"', '#5BD69E', 6)) + `</g>`);
const KELEBEK = g('translate(70 200)', `<g class="m-fly"><g class="m-wing">${ol('path', 'd="M0 0C-14 -22 -32 -14 -24 2C-32 14 -14 22 0 4Z"', '#FFB31F', 5)}${ol('path', 'd="M0 0C14 -22 32 -14 24 2C32 14 14 22 0 4Z"', '#FFB31F', 5)}<circle cx="-14" cy="-6" r="4" fill="#fff"></circle><circle cx="14" cy="-6" r="4" fill="#fff"></circle></g><path d="M0 -8V12" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"></path></g>`);
const EKG = g('translate(352 120)', `<g class="m-pop">${ol('rect', 'x="-62" y="-34" width="124" height="62" rx="18"', '#fff', 7)}<path d="${MINI}" transform="translate(-38 -3) scale(1.3)" fill="${C.red}"></path><path class="m-ekg" d="M-20 0H-4L4 -18L14 20L24 -8L30 0H48" fill="none" stroke="${C.red}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path></g>`);

// Büyüteç: sağ gözün üstünde, içinde büyütülmüş göz.
const LENS = `<clipPath id="{ID}-lens"><circle cx="262" cy="276" r="44"></circle></clipPath>`;
const BUYUTEC = `<path d="M293 308L330 348" stroke="${C.line}" stroke-width="22" stroke-linecap="round"></path><path d="M293 308L330 348" stroke="#7A5A2A" stroke-width="13" stroke-linecap="round"></path>` +
  `<g clip-path="url(#{ID}-lens)"><circle cx="262" cy="276" r="44" fill="${C.red}"></circle><g transform="translate(262 276) scale(1.5) translate(-260 -274)">${eye('R', 'open', [-4, 0])}</g><circle cx="262" cy="276" r="44" fill="#BFE6FF" opacity=".18"></circle></g>` +
  `<circle cx="262" cy="276" r="44" fill="none" stroke="${C.line}" stroke-width="16"></circle><circle cx="262" cy="276" r="44" fill="none" stroke="#3B4252" stroke-width="9"></circle>` +
  `<path d="M232 254Q240 240 256 236" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".85"></path>`;

const BOOT = {fill: '#FFC53D', path: 'M-20 50V14Q-20 4 -8 4H12Q22 4 22 14V32Q38 34 40 46Q40 56 30 56H-14Q-20 56 -20 50Z',
  detail: `<path d="M-20 47H40Q40 56 30 56H-14Q-20 56 -20 50Z" fill="#E09A00"></path><path d="M-20 14H22" stroke="#E09A00" stroke-width="5"></path>`};

const OUTFITS = {
  cami: {
    label: 'Cuma', use: 'Takkesi başında, elinde tesbih; tesbih sallanır, eli kalbinde. Cuma ve kandil.',
    eyes: 'happy', mouth: 'soft', blush: 1, brows: 'calm', hat: TAKKE,
    armL: L([196, 410], 1, {abs: 128}), armR: R([326, 444], 1, {abs: -10}, {item: TESBIH}),
    fx: STARS_PLUS([[360, 140, .8, 1], [80, 120, .6, 3]])
  },
  okul: {
    label: 'Okul yolunda', use: 'Sırt çantasıyla yürür, çanta zıplar. Okul dönemi ve ilk ders.',
    cls: 'm-walk', eyes: 'open', mouth: 'smile', brows: 'up', behind: CANTA, cloth: ASKILAR,
    armL: {a: [-14, 18, 0]}, armR: {a: [-14, 18, 0]}
  },
  kis: {
    label: 'Kış', use: 'Beresi ve atkısıyla sıcak salep tutar; kar yağar, buhar tüter.',
    eyes: 'happy', mouth: 'soft', blush: 1, brows: 'calm', hat: BERE, cloth: ATKI, noHeart: true, near: KUPA_SICAK, bg: KAR,
    armL: L([168, 456], 1, -150), armR: R([262, 456], 1, -150)
  },
  ramazan: {
    label: 'Ramazan', use: 'Gecenin içinde fenerini taşır; fener sallanır, ışığı titrer, yıldızlar parlar.',
    eyes: 'happy', mouth: 'smile', blush: 1, brows: 'calm', bg: GECE,
    armL: L([196, 410], 1, {abs: 128}), armR: R([346, 330], 1, {abs: 200}, {item: g('scale(1.3)', FENER)})
  },
  bayram: {
    label: 'Bayram', use: 'Bayramlık yeleğiyle şeker ikram eder: "Buyurun!" Bayram sabahı.',
    eyes: 'happy', mouth: 'grin', blush: 1, brows: 'up', cloth: YELEK_BAYRAM,
    armL: {a: [-34, 32, 10]}, armR: R([356, 318], 1, {abs: 180}, {item: g('translate(-8 -14)', TEPSI), over: true}),
    fx: STARS_PLUS([[380, 200, .9, 1], [60, 180, .7, 3], [110, 70, .6, 2]])
  },
  kasif: {
    label: 'Kâşif', use: 'Büyüteçle sana bakar, kocaman göz kırpar; kelebek etrafında uçar. Keşif dersleri.',
    eyes: 'open', mouth: 'grin', brows: 'up', hat: KASIF, defs: LENS, near: BUYUTEC,
    armL: REST, armR: R([334, 354], 1, {abs: 140}), fx: KELEBEK
  },
  fidan: {
    label: 'Fidan', use: 'Hasır şapkasıyla fidanı sular; damlalar düşer, fidan büyür. Çevre ve paylaşma.',
    eyes: 'happy', mouth: 'smile', blush: 1, brows: 'calm', hat: HASIR,
    armL: REST, armR: R([338, 440], 1, {abs: -40}, {item: g('translate(-4 0) scale(.74)', KOVA)}), fx: FIDAN
  },
  gonullu: {
    label: 'Gönüllü', use: 'Yardım kolisini taşır, yeleği ve şapkasıyla yola çıkar. Kampanya ve gönüllülük.',
    cls: 'm-walk m-carry', eyes: 'open', mouth: 'grin', brows: 'up', hat: KEP_BASLIK, cloth: YELEK_GONULLU, noHeart: true, near: KOLI,
    armL: L([140, 446], 1, -150), armR: R([290, 446], 1, -150)
  },
  doktor: {
    label: 'Sağlıkçı', use: 'Önlüğü ve aynasıyla kendi kalbini dinler; kalp atışı ekranda çizilir.',
    eyes: 'open', look: [-3, 6], mouth: 'smile', brows: 'calm', stemTop: AYNA, cloth: ONLUK + STETO_NEAR,
    armL: REST, armR: R([256, 408], 1, {abs: 120}, {item: g('translate(4 10)', STETO_HEAD)}), fx: EKG
  },
  yagmur: {
    label: 'Yağmur', use: 'Şemsiyesi ve çizmeleriyle su birikintisine basar, damlalar sıçrar.',
    eyes: 'open', mouth: 'grin', brows: 'up', shoe: BOOT, fxBack: BIRIKINTI, vb: '-37 -118 504 715',
    armL: REST, armR: R([324, 318], 1, {abs: 180}, {item: SEMSIYE}), fx: YAGMUR
  },
  asci: {
    label: 'Aşçı', use: 'Çorbanın tadına bakar, gözleri mutlulukla kapanır: "Afiyet olsun!" İftar ve paylaşım.',
    eyes: 'happy', mouth: 'o', blush: 1, hat: ASCI, noHeart: false,
    armL: REST, armR: R([268, 376], 1, {abs: 150}, {item: KASIK}),
    fx: RISE_HEARTS([[300, 300, 1.1, '#FF6F91', 1, 'r'], [150, 260, .9, '#FF6F91', 3, 'l']])
  },
  mezun: {
    label: 'Mezun', use: 'Kep püskülü sallanır, diplomasını sallar, göz kırpar. Seri bitince ve sertifikada.',
    eyes: ['open', 'happy'], mouth: 'grin', brows: 'up', hat: KEP,
    armL: {a: [-140, -24, 0], item: DIPLOMA}, armR: REST,
    fx: STARS_PLUS([[60, 140, 1, 1], [380, 150, .9, 2], [360, 40, .7, 3], [100, 40, .6, 4]])
  }
};

const CSS = '';
module.exports = {OUTFITS, CSS};
},
'./genc.js': function (module, exports, require) {
// Biri maskotu · büyükler takımı (6, 7 ve 8. sınıf). Her poza giydirilebilir:
// ters kep, fermuarlı kapüşonlu, eşofman altı ve spor ayakkabı. Kalp önde görünür kalır.
const {ol, g, C} = require('./govde.js');

const K = {cap: '#22C7B8', capHi: '#7DF0E4', capDark: '#128F86', neon: '#2EE6D6', lime: '#C6FF3D', hood: '#E4E6F4', hoodDark: '#C3C7DF', hoodLine: '#2B2D55', zip: '#8A8FB5', sock: '#FFFFFF', pants: '#2B2D55'};
const clipBody = inner => `<g clip-path="url(#{ID}-bw)">${inner}</g>`;

// Ters kep: siperlik arkaya ve yana bakar, önde ayar kayışı görünür.
const KEP = g('translate(262 206) rotate(19)',
  ol('path', 'd="M36 2Q86 -10 112 6Q114 18 98 20Q66 14 40 20Z"', K.capDark, 8) +
  `<path d="M44 12Q78 4 104 12" fill="none" stroke="${K.lime}" stroke-width="5"></path>` +
  ol('path', 'd="M-64 14Q-64 -46 0 -48Q64 -46 64 14Q0 -6 -64 14Z"', K.cap, 8) +
  `<path d="M-46 -24Q-24 -42 4 -42" fill="none" stroke="${K.capHi}" stroke-width="9"></path>` +
  `<path d="M0 -47Q-6 -18 -2 6M0 -47Q30 -30 38 2" fill="none" stroke="${K.hoodLine}" stroke-width="3" opacity=".55"></path>` +
  `<path d="M-22 10Q-20 -8 0 -9Q20 -8 22 9Q0 3 -22 10Z" fill="${K.hoodLine}"></path><path d="M-16 4H16" stroke="${K.neon}" stroke-width="4"></path>` +
  `<circle cx="0" cy="-47" r="7" fill="${K.capDark}" stroke="${K.hoodLine}" stroke-width="3"></circle>`);

// Fermuarı açık kapüşonlu: iki ön parça, kapüşon yakası, ipler ve cepler.
const HL = 'M40 356Q122 346 164 382Q172 440 176 500H40Z', HR = 'M390 356Q308 346 266 382Q258 440 254 500H390Z';
const KAPUSONLU = clipBody(
  `<path d="${HL}" fill="${K.hood}"></path><path d="${HR}" fill="${K.hood}"></path>` +
  `<path d="M40 356Q122 346 164 382L150 404Q116 372 40 380Z" fill="${K.hoodDark}"></path><path d="M390 356Q308 346 266 382L280 404Q314 372 390 380Z" fill="${K.hoodDark}"></path>` +
  `<path d="M164 382Q172 440 176 500M266 382Q258 440 254 500" fill="none" stroke="${K.hoodLine}" stroke-width="6"></path>` +
  `<path d="M166 396Q173 446 177 500M264 396Q257 446 253 500" fill="none" stroke="${K.zip}" stroke-width="3.5" stroke-dasharray="5 5"></path>` +
  `<path d="M74 452Q112 444 150 452L152 500H74Z" fill="${K.hoodDark}"></path><path d="M356 452Q318 444 280 452L278 500H356Z" fill="${K.hoodDark}"></path>` +
  `<path d="M74 452Q112 444 150 452M356 452Q318 444 280 452" fill="none" stroke="${K.hoodLine}" stroke-width="4"></path>` +
  `<path d="M40 474H176M254 474H390" stroke="${K.zip}" stroke-width="3"></path>`) +
  `<g class="m-ip"><path d="M156 392Q154 420 158 444M274 392Q276 420 272 444" fill="none" stroke="${K.neon}" stroke-width="4.5"></path>` +
  `<rect x="152" y="440" width="10" height="16" rx="4" fill="${K.lime}" stroke="${K.hoodLine}" stroke-width="2.5"></rect><rect x="268" y="440" width="10" height="16" rx="4" fill="${K.lime}" stroke="${K.hoodLine}" stroke-width="2.5"></rect></g>`;

const SPOR = {
  fill: K.sock, leg: K.pants,
  path: 'M-24 44C-26 28 -10 22 6 22C26 22 42 31 42 45C42 53 35 58 25 58H-16C-23 58 -24 52 -24 44Z',
  detail: `<path d="M-24 48H42C41 54 35 58 25 58H-16C-22 58 -24 54 -24 48Z" fill="${C.red}"></path>` +
    `<path d="M-8 42Q10 30 34 40" fill="none" stroke="${K.neon}" stroke-width="5"></path><path d="M0 28L8 33M6 25L14 30" stroke="${K.zip}" stroke-width="3"></path>`
};

const SLEEVE = [K.hood, K.hoodDark];

// Herhangi bir poza takımı giydirir. Kendi şapkası, giysisi ya da ayakkabısı olan pozda o parçayı korur.
function giydir(p) {
  const out = {...p, cls: ((p.cls || '') + ' m-genc').trim()};
  if (!p.hat && !p.stemTop) out.hat = KEP;
  if (!p.cloth) { out.cloth = KAPUSONLU; out.sleeve = p.sleeve || SLEEVE; }
  if (!p.shoe) out.shoe = SPOR;
  if (p.mouth === 'smile') out.mouth = 'smirk';
  return out;
}

const CSS = '';

module.exports = {giydir, KEP, KAPUSONLU, SPOR, CSS, K};
}
  };
  var loaded = {};
  function load(name) {
    if (!loaded[name]) { var module = {exports: {}}; loaded[name] = module; sources[name](module, module.exports, load); }
    return loaded[name].exports;
  }
  var body = load('./govde.js'), poses = load('./pozlar.js').POSES, outfits = load('./kiyafetler.js').OUTFITS, kit = load('./genc.js');
  // Ekranlardaki duygu adları ile pozlar arasındaki köprü.
  var MOODS = {smile: 'durus', happy: 'selam', hello: 'selam', celebrate: 'aferin', think: 'dusun', wow: 'vay', sleep: 'uyku', sad: 'uzgun',
    read: 'oku', love: 'iyilik', trophy: 'kupa', laugh: 'kahkaha', shy: 'utangac', run: 'kos', thanks: 'tesekkur', pray: 'dua'};
  var LOGO = '<path d="M352 266A106 106 0 0 1 458 372V568H352Z" fill="#E20439"/><circle cx="496" cy="568" r="146" fill="#E20439"/><path d="M494.5 532C486 518 474 512 461 512C440 512 425 528 425 549C425 572 441 588 461 605C476 618 488 628 494.5 642C501 628 513 618 528 605C548 588 564 572 564 549C564 528 549 512 528 512C515 512 503 518 494.5 532Z" fill="#fff"/><path d="M455 527C459 527 461 530 459.5 535C457 542 455.5 550 456.5 560C457.5 568 459.5 574 462 579.5C455 576 449 570 445 563C441 556 440 548 441.5 541C443 533 448 527 455 527Z" fill="#E20439"/>';
  function theme() { return document.documentElement.getAttribute('data-tema') || 'cocuk'; }
  function resolve(name) { return poses[name] || outfits[name] ? name : MOODS[name] || 'durus'; }
  function escape(text) { return String(text).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  // Hicri takvime ve haftanın gününe göre günün kıyafeti; özel bir gün değilse boş döner.
  function outfitOfDay(date) {
    date = date || new Date();
    var month = 0, day = 0;
    try {
      var parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {month: 'numeric', day: 'numeric'}).formatToParts(date);
      parts.forEach(function (part) { if (part.type === 'month') month = +part.value; if (part.type === 'day') day = +part.value; });
    } catch (error) { month = 0; }
    if ((month === 10 && day <= 3) || (month === 12 && day >= 10 && day <= 13)) return 'bayram';
    if (month === 9) return 'ramazan';
    if (date.getDay() === 5) return 'cami';
    var m = date.getMonth(), d = date.getDate();
    if (m === 8 && d <= 21) return 'okul';
    if ((m === 11 || m <= 1) && d % 2 === 0) return 'kis';
    return '';
  }
  function svg(name, options) {
    options = options || {};
    var key = resolve(name), spec = poses[key] || outfits[key], look = options.tema || theme();
    if (look === 'genc' && options.kit !== false && poses[key]) spec = kit.giydir(spec);
    var extra = (options.cls || '') + (options.still ? ' m-still' : '');
    if (extra || options.small) spec = Object.assign({}, spec, {cls: ((spec.cls || '') + ' ' + extra).trim(), small: options.small || spec.small});
    return body.mascot(key, spec, {label: escape(options.label || 'Biri')});
  }
  function logo(options) {
    options = options || {};
    return '<svg class="biri-logo' + (options.cls ? ' ' + options.cls : '') + '" viewBox="340 254 316 472" role="img" aria-label="' + escape(options.label || 'Birlikte İyilik') + '" focusable="false">' + LOGO + '</svg>';
  }
  window.BiriMaskot = {svg: svg, logo: logo, mood: resolve, outfitOfDay: outfitOfDay, poses: Object.keys(poses), outfits: Object.keys(outfits),
    label: function (name) { var spec = poses[resolve(name)] || outfits[resolve(name)]; return spec.label; }};
})();

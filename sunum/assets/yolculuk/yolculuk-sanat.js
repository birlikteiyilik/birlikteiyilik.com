(function (root) {
  'use strict';
  // Yolculuk haritasının manzara çizimleri. Her çizim 80×80 kutuda, zemini y=76 çizgisindedir.
  // size: yol kenarındaki göreli boy; sky: yerde değil havada durur; anim: boşta çalan hareket.
  var SHADOW = '<ellipse cx="40" cy="76.5" rx="22" ry="3.6" fill="#7a5426" opacity=".12"/>';
  function star(cx, cy, r, fill) {
    var p = [];
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r * .45 : r; p.push((cx + Math.cos(a) * d).toFixed(1) + ' ' + (cy + Math.sin(a) * d).toFixed(1)); }
    return '<path d="M' + p.join(' L') + 'Z" fill="' + fill + '"/>';
  }
  function tulip(x, y, h, color, dark) {
    return '<path d="M' + x + ' 76 C' + (x - 1) + ' ' + (76 - h / 2) + ' ' + (x + 1) + ' ' + (y + 8) + ' ' + x + ' ' + (y + 4) + '" stroke="#3a9d5c" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M' + x + ' 72 C' + (x - 9) + ' 66 ' + (x - 9) + ' 58 ' + (x - 6) + ' 54 C' + (x - 4) + ' 62 ' + (x - 2) + ' 66 ' + x + ' 72Z" fill="#4bb06a"/>' +
      '<path d="M' + (x - 6) + ' ' + y + ' C' + (x - 7) + ' ' + (y - 8) + ' ' + (x - 3) + ' ' + (y - 11) + ' ' + x + ' ' + (y - 7) + ' C' + (x + 3) + ' ' + (y - 11) + ' ' + (x + 7) + ' ' + (y - 8) + ' ' + (x + 6) + ' ' + y + ' C' + (x + 6) + ' ' + (y + 6) + ' ' + (x - 6) + ' ' + (y + 6) + ' ' + (x - 6) + ' ' + y + 'Z" fill="' + color + '"/>' +
      '<path d="M' + x + ' ' + (y - 7) + ' C' + (x + 2) + ' ' + (y - 2) + ' ' + (x + 2) + ' ' + (y + 3) + ' ' + x + ' ' + (y + 4.5) + ' C' + (x + 5) + ' ' + (y + 4) + ' ' + (x + 6) + ' ' + (y + 1) + ' ' + (x + 6) + ' ' + y + ' C' + (x + 7) + ' ' + (y - 8) + ' ' + (x + 3) + ' ' + (y - 11) + ' ' + x + ' ' + (y - 7) + 'Z" fill="' + dark + '"/>';
  }
  function cypress(x, top, w) {
    return '<path d="M' + x + ' 76 V70" stroke="#7d5428" stroke-width="3"/>' +
      '<path d="M' + x + ' ' + top + ' C' + (x + w) + ' ' + (top + 18) + ' ' + (x + w * 1.1) + ' ' + (top + 38) + ' ' + (x + w * .6) + ' 71 H' + (x - w * .6) + ' C' + (x - w * 1.1) + ' ' + (top + 38) + ' ' + (x - w) + ' ' + (top + 18) + ' ' + x + ' ' + top + 'Z" fill="#2f8f5b"/>' +
      '<path d="M' + x + ' ' + top + ' C' + (x - w) + ' ' + (top + 18) + ' ' + (x - w * 1.1) + ' ' + (top + 38) + ' ' + (x - w * .6) + ' 71 H' + x + 'Z" fill="#3fae6c"/>' +
      '<path d="M' + (x - w * .45) + ' ' + (top + 26) + ' q' + (w * .4) + ' -4 ' + (w * .7) + ' 2 M' + (x - w * .6) + ' ' + (top + 42) + ' q' + (w * .5) + ' -4 ' + (w * .9) + ' 2" stroke="#7fd39a" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>';
  }

  var D = {
    /* ---------- Siyer: çöl, kervan, Mekke ---------- */
    palm: {size: 1.15, anim: 'sway', svg: SHADOW +
      '<path d="M35 76 C36 60 40 43 45 28 L49.5 29 C45.5 44 42.5 60 43.5 76Z" fill="#b07a3c"/><path d="M40.5 76 C41 60 43.5 44 47.5 29 L49.5 29 C45.5 44 42.5 60 43.5 76Z" fill="#8f5d26"/>' +
      '<path d="M36.5 68 h6.5 M37.5 60 h6.2 M39 52 h5.8 M40.6 44 h5.2 M42.4 36 h4.6" stroke="#7a4d1d" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="M46 28 C36 19 23 20 14 31 C25 26 36 27 46 30Z" fill="#2f9a52"/><path d="M46 28 C40 15 29 8 18 10 C29 14 38 20 45 30Z" fill="#45b865"/>' +
      '<path d="M47.5 28 C53 13 63 8 72 12 C61 14 55 20 49 30Z" fill="#45b865"/><path d="M48 29 C59 21 69 23 76 33 C65 28 57 28 48.5 31Z" fill="#2f9a52"/>' +
      '<path d="M46.5 28 C47.5 17 46 9 41 4 C51 9 52 19 49 29Z" fill="#62cc7c"/>' +
      '<path d="M44 26 C36 16 28 13 21 12 M50 26 C56 15 63 12 69 12.5" stroke="#9be3a8" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/>' +
      '<circle cx="44.5" cy="32" r="2.7" fill="#c0612b"/><circle cx="49" cy="32.5" r="2.7" fill="#a94f22"/><circle cx="46.6" cy="35.6" r="2.5" fill="#c0612b"/><circle cx="43.8" cy="31.2" r=".9" fill="#ffc48a"/>'},
    tent: {size: 1.05, anim: 'none', svg: SHADOW +
      '<path d="M40 22 L16 75" stroke="#7a5426" stroke-width="1.2" opacity=".5"/><path d="M8 76 L18 70 M72 76 L62 70" stroke="#7a5426" stroke-width="1.4"/>' +
      '<path d="M11 75 L40 21 L69 75Z" fill="#f1dcb2"/><path d="M40 21 L69 75 H40Z" fill="#dcc08f"/>' +
      '<path d="M40 21 L27 75 H33.5Z M40 21 L53 75 H46.5Z" fill="#e8613a"/><path d="M40 21 L53 75 H46.5Z" fill="#c94a26"/>' +
      '<path d="M40 44 L31 75 H49Z" fill="#5b3418"/><path d="M40 44 L49 75 H52 L42 44Z" fill="#f1dcb2"/>' +
      '<path d="M40 21 V9" stroke="#7a5426" stroke-width="2" stroke-linecap="round"/>' +
      '<path class="jm-flag" d="M40 9.5 C46 8 49 12 55 10.5 L53 15.5 C47.5 17 45 13.5 40 15Z" fill="#ffd25e"/>'},
    camel: {size: 1.2, anim: 'bob', svg: SHADOW +
      '<path d="M24 56 L23 75 M30 57 L31.5 75 M48 57 L46.5 75 M54 56 L56 75" stroke="#b57d3b" stroke-width="4.2" stroke-linecap="round"/>' +
      '<path d="M17 48 C13 51 12 55 13.5 59" stroke="#b57d3b" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      '<path d="M16 52 C16 44 21 40 27 40 C31 28 46 27 50 40 C56 41 60 46 60 52 C60 57 56 59.5 52 59.5 H21.5 C18 59.5 16 56 16 52Z" fill="#dba660"/>' +
      '<path d="M56 46 C62 40 61.5 31 63.5 25 C64.8 20.5 70 19 73.5 21.5 L77 24.6 C78 26.4 76.4 27.6 74.6 27.4 L71 27.2 C69 34 67 44 61 53Z" fill="#dba660"/>' +
      '<path d="M16.5 55 C28 58 46 58 59.5 54 C58.5 57.5 55.5 59.5 52 59.5 H21.5 C19 59.5 17.2 57.6 16.5 55Z" fill="#c48d48"/>' +
      '<path d="M27.5 40 C31.5 33.5 44.5 32.5 48.5 40 L50.5 50 H25.5Z" fill="#e8613a"/><path d="M25.5 50 H50.5" stroke="#ffd25e" stroke-width="2.6" stroke-dasharray="2 2.6"/><path d="M30 40.5 C34 36 42 35.6 46 40.5" stroke="#ffd25e" stroke-width="1.6" fill="none"/>' +
      '<circle cx="71" cy="22.6" r="1.25" fill="#3a2716"/><path d="M66.8 20.8 l-1.6 -3" stroke="#b57d3b" stroke-width="2" stroke-linecap="round"/><path d="M75.5 26 h1.6" stroke="#7a4d1d" stroke-width="1.2" stroke-linecap="round"/>'},
    dunes: {size: 1.25, anim: 'none', svg:
      '<path d="M0 76 C12 54 28 50 44 76Z" fill="#f4d394"/><path d="M28 76 C42 46 62 42 80 76Z" fill="#edc27a"/>' +
      '<path d="M57 44.5 C61 55 63 66 61 76 H80 C72 60 66 49 57 44.5Z" fill="#dfa95f"/><path d="M22 52.5 C25 60 26 68 25 76 H44 C37 64 30 56 22 52.5Z" fill="#e6b872"/>' +
      '<path d="M8 36 h13 M13 30 h10 M54 30 h12" stroke="#e7bd78" stroke-width="2" stroke-linecap="round"/>'},
    well: {size: 1, anim: 'none', svg: SHADOW +
      '<path d="M23 55 V27 M57 55 V27" stroke="#8f5d26" stroke-width="4" stroke-linecap="round"/><path d="M22 30.5 H58" stroke="#7a4d1d" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M16 29 L40 16 L64 29Z" fill="#c0612b"/><path d="M40 16 L64 29 H40Z" fill="#a14d22"/>' +
      '<path d="M40 31 V44" stroke="#8a6a45" stroke-width="1.4"/><path d="M35 44 h10 l-1.5 7.5 h-7Z" fill="#9a6a35"/><path d="M35 45.5 h10" stroke="#ffd25e" stroke-width="1.2"/>' +
      '<path d="M19 55 h42 v15 a21 6 0 0 1 -42 0Z" fill="#d6c9b4"/><path d="M48 55 h13 v15 a21 6 0 0 1 -13 5.6Z" fill="#c1b39b"/>' +
      '<ellipse cx="40" cy="55" rx="21" ry="5.5" fill="#b9aa91"/><ellipse cx="40" cy="55" rx="16" ry="3.6" fill="#3f3224"/>' +
      '<path d="M21 63 h38 M23 70 h34 M30 55 v8 M47 63 v7 M36 70 v6" stroke="#b5a68e" stroke-width="1.4"/>'},
    hira: {size: 1.3, anim: 'none', svg:
      '<path d="M2 76 L33 21 L48 44 L57 34 L78 76Z" fill="#cda374"/><path d="M33 21 L42 76 H78 L57 34 L48 44Z" fill="#b78a5c"/>' +
      '<path d="M33 21 L28 31 L33 28 L37 33Z" fill="#e3c39a"/><path d="M57 34 L54 40 L58 38 L61 41Z" fill="#e3c39a"/>' +
      '<path d="M27 64 C27 56 37 55.5 37.5 63.5 V67 H27Z" fill="#4a3424"/><path d="M24 67.5 h17" stroke="#9b7148" stroke-width="2" stroke-linecap="round"/>' +
      '<g class="jm-twinkle">' + star(62, 13, 6.5, '#ffd25e') + '</g><circle cx="20" cy="18" r="1.6" fill="#ffd25e" class="jm-twinkle"/>'},
    city: {size: 1.25, anim: 'none', svg: SHADOW +
      '<path d="M6 76 V50 h20 v26Z" fill="#f6e7cf"/><path d="M21 76 V50 h5 v26Z" fill="#e6d0ac"/>' +
      '<path d="M48 76 V54 h26 v22Z" fill="#efdcbc"/><path d="M68 76 V54 h6 v22Z" fill="#dcc29a"/>' +
      '<path d="M24 76 V42 h26 v34Z" fill="#fff7ea"/><path d="M44 76 V42 h6 v34Z" fill="#ead6b4"/>' +
      '<path d="M27 42 C27 30 47 30 47 42Z" fill="#e8c179"/><path d="M37 33 C42 33 46 37 47 42 H40 C40 37 39 35 37 33Z" fill="#d6a85a"/><path d="M37 32 v-5" stroke="#a86a0c" stroke-width="1.6"/><circle cx="37" cy="26" r="1.5" fill="#ffd25e"/>' +
      '<path d="M33 76 V66 a4 4 0 0 1 8 0 V76Z" fill="#9a6a35"/>' +
      '<path d="M11 62 v-3.5 a2.5 2.5 0 0 1 5 0 V62Z M28 54 v-3.5 a2.5 2.5 0 0 1 5 0 V54Z M39 54 v-3.5 a2.5 2.5 0 0 1 5 0 V54Z M54 66 v-3.5 a2.5 2.5 0 0 1 5 0 V66Z M62 66 v-3.5 a2.5 2.5 0 0 1 5 0 V66Z" fill="#a8743a"/>' +
      '<path d="M5 50 h22 M47 54 h28 M23 42 h28" stroke="#d9bf95" stroke-width="2"/>'},
    lantern: {size: .95, anim: 'none', svg:
      '<ellipse cx="40" cy="76.5" rx="10" ry="2.4" fill="#7a5426" opacity=".14"/><path d="M34 76 h12" stroke="#5d4a3a" stroke-width="4" stroke-linecap="round"/><path d="M40 75 V24 H55" stroke="#5d4a3a" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<g class="jm-swing" style="transform-origin:55px 24px"><path d="M55 24 v6" stroke="#5d4a3a" stroke-width="1.6"/><circle cx="55" cy="44" r="13" fill="#ffd25e" opacity=".22"/>' +
      '<path d="M48 34 h14 l-2.4 4 h-9.2Z" fill="#a86a0c"/><path d="M49.5 38 h11 l-1.6 14 h-7.8Z" fill="#ffd25e"/><path d="M55 38 h5.5 l-1.6 14 h-3.9Z" fill="#f5b73a"/><path d="M52 52 h6 l-.8 3 h-4.4Z" fill="#a86a0c"/><path d="M55 41 v8" stroke="#fff6d6" stroke-width="1.6" stroke-linecap="round"/></g>'},
    rocks: {size: .75, anim: 'none', svg:
      '<path d="M12 76 C12 64 22 58 32 61 C38 56 50 58 52 66 C60 64 68 69 68 76Z" fill="#d6cbbb"/><path d="M40 60 C46 58 51 61 52 66 C58 66 66 70 68 76 H44 C46 70 45 64 40 60Z" fill="#bfb19c"/>' +
      '<path d="M18 76 C18 72 20 70 22 69 M60 76 c0 -4 2 -6 4 -7" stroke="#6fbf7d" stroke-width="2" stroke-linecap="round"/>'},

    /* ---------- Fıkıh: cami, şadırvan, servi ---------- */
    mosque: {size: 1.3, anim: 'none', svg: SHADOW +
      '<path d="M10 76 V50 h50 v26Z" fill="#fffaf2"/><path d="M48 76 V50 h12 v26Z" fill="#efe2cb"/>' +
      '<path d="M16 50 C16 33 54 33 54 50Z" fill="#19b49a"/><path d="M35 35.4 C45 36 52 42 54 50 H43 C43 43 40 38 35 35.4Z" fill="#0f8f7a"/><path d="M22 46 C23 40 28 37 33 36" stroke="#8fe6d4" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M35 35 V28" stroke="#d9921a" stroke-width="1.8"/><path d="M35 22.5 a3.4 3.4 0 1 0 2.6 5.6 a2.6 2.6 0 1 1 -2.6 -5.6z" fill="#ffd25e"/>' +
      '<path d="M7 50 h56" stroke="#0b6b62" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M64 76 V26 h9 v50Z" fill="#fffaf2"/><path d="M69 76 V26 h4 v50Z" fill="#efe2cb"/><path d="M62 42 h13" stroke="#0b6b62" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M63.5 26 L68.5 8 L73.5 26Z" fill="#19b49a"/><path d="M68.5 8 L73.5 26 H68.5Z" fill="#0f8f7a"/><circle cx="68.5" cy="6" r="1.6" fill="#ffd25e"/>' +
      '<path d="M29 76 V65 a6 6 0 0 1 12 0 V76Z" fill="#0b6b62"/><path d="M15 64 v-4 a3 3 0 0 1 6 0 v4Z M49 64 v-4 a3 3 0 0 1 6 0 v4Z M66 36 v-3 a2 2 0 0 1 4 0 v3Z" fill="#9ad8c8"/>'},
    cypress: {size: 1.15, anim: 'sway', svg: '<ellipse cx="44" cy="76.5" rx="20" ry="3.2" fill="#7a5426" opacity=".12"/>' + cypress(34, 8, 10) + cypress(56, 26, 8)},
    fountain: {size: 1.1, anim: 'none', svg: SHADOW +
      '<path d="M24 31 V62 M56 31 V62" stroke="#8fb5c2" stroke-width="2.6"/><path d="M19 32 Q40 12 61 32Z" fill="#19b49a"/><path d="M40 18 Q52 22 61 32 H46 C46 26 44 21 40 18Z" fill="#0f8f7a"/><circle cx="40" cy="16" r="2" fill="#ffd25e"/>' +
      '<path d="M37 61 V44 h6 v17Z" fill="#cfe0e6"/><path d="M28 43 h24 a12 5 0 0 1 -24 0Z" fill="#bcd3dc"/>' +
      '<path class="jm-water" d="M36 45 C31 47 29.5 52 29 60 M44 45 C49 47 50.5 52 51 60" stroke="#6cc0ec" stroke-width="2" fill="none" stroke-linecap="round" stroke-dasharray="3 4"/>' +
      '<path d="M13 64 h54 l-4 11 H17Z" fill="#d9e9ef"/><path d="M50 64 h17 l-4 11 H48Z" fill="#c4dbe3"/><rect x="11" y="61" width="58" height="5" rx="2.5" fill="#a9c6d1"/><path d="M17 63.5 h46" stroke="#7cc8f0" stroke-width="2.4" stroke-linecap="round"/>'},
    rahle: {size: .95, anim: 'none', svg: '<ellipse cx="40" cy="76.5" rx="18" ry="3" fill="#7a5426" opacity=".12"/>' +
      '<path d="M25 76 L55 47 M55 76 L25 47" stroke="#9a6a35" stroke-width="5" stroke-linecap="round"/><path d="M40 61.5 l-2.4 -2.4 l2.4 -2.4 l2.4 2.4z" fill="#ffd25e"/>' +
      '<path d="M17 47 C25 40.5 34 40.5 40 45 C46 40.5 55 40.5 63 47 L60 50.5 C53 46 46 46 40 50.5 C34 46 27 46 20 50.5Z" fill="#0b6b62"/>' +
      '<path d="M19 45.5 C26 39.5 34 39.5 40 43.5 C46 39.5 54 39.5 61 45.5 L58.5 48 C52 44 46 44 40 48 C34 44 28 44 21.5 48Z" fill="#fffaf0"/>' +
      '<path d="M40 43.5 V48 M25 44 q6 -3 11 0 M44 44 q6 -3 11 0 M26 46.4 q5 -2.4 9.5 0 M44.5 46.4 q5 -2.4 9.5 0" stroke="#c9b48c" stroke-width="1" fill="none"/>' +
      '<g class="jm-twinkle">' + star(52, 30, 4, '#ffd25e') + '</g>'},
    kandil: {size: .9, anim: 'none', svg:
      '<path d="M20 76 V34 C20 20 60 20 60 34 V76" stroke="#e7d7bd" stroke-width="5" fill="none"/><path d="M17 76 h8 M55 76 h8" stroke="#d9c39f" stroke-width="4" stroke-linecap="round"/>' +
      '<g class="jm-swing" style="transform-origin:40px 24px"><path d="M40 24 V40 M33 40 L40 30 L47 40" stroke="#a86a0c" stroke-width="1.2" fill="none"/><circle cx="40" cy="50" r="13" fill="#ffd25e" opacity=".22"/>' +
      '<path d="M31 41 h18 C49 52 45 57 40 57 C35 57 31 52 31 41Z" fill="#19b49a"/><path d="M40 41 h9 C49 52 45 57 40 57Z" fill="#0f8f7a"/><path d="M33 44 h14" stroke="#ffd25e" stroke-width="1.6"/>' +
      '<path d="M40 49 c-2 -3 0 -6 0 -6 s2 3 0 6z" fill="#fff3c4"/><circle cx="40" cy="58.5" r="1.6" fill="#ffd25e"/></g>'},
    drops: {size: .85, anim: 'none', svg:
      '<g class="jm-bob" style="--d:0s"><path d="M24 34 C29 42 33 47 33 52 a9 9 0 0 1 -18 0 C15 47 19 42 24 34z" fill="#7cc8f0"/><path d="M19.5 51 a4.5 4.5 0 0 0 3 4.4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></g>' +
      '<g class="jm-bob" style="--d:-.8s"><path d="M50 20 C56 30 61 36 61 42 a11 11 0 0 1 -22 0 C39 36 44 30 50 20z" fill="#4aa6dc"/><path d="M44.5 41 a5.5 5.5 0 0 0 3.6 5.4" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>' +
      '<g class="jm-bob" style="--d:-1.6s"><path d="M60 54 C63.5 59 66 62 66 65.5 a6 6 0 0 1 -12 0 C54 62 56.5 59 60 54z" fill="#9ad6f4"/></g>' +
      '<path d="M8 76 C20 70 60 70 72 76Z" fill="#cfe9f6"/>'},

    /* ---------- Âdâb: mahalle, bahçe ---------- */
    house: {size: 1.2, anim: 'none', svg: SHADOW +
      '<rect x="18" y="40" width="44" height="36" rx="3" fill="#fff4e4"/><path d="M50 40 h12 v33 a3 3 0 0 1 -3 3 h-9Z" fill="#f2dfc5"/>' +
      '<rect x="51" y="19" width="7" height="13" fill="#c8395b"/><path class="jm-smoke" d="M54.5 15 c-3 -2 -1 -5 1 -6 c2 -1 1 -4 -1 -5" stroke="#d8d2e6" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<path d="M11 43 L40 17 L69 43Z" fill="#ff8aa0"/><path d="M40 17 L69 43 H50Z" fill="#ee6f89"/><path d="M11 43 h58 l-3 4 H14Z" fill="#c8395b"/>' +
      '<path d="M40 36.5 c-3 -4.2 -8.4 -1 -5 3.2 l5 4.3 l5 -4.3 c3.4 -4.2 -2 -7.4 -5 -3.2z" fill="#ffd25e"/>' +
      '<rect x="34" y="56" width="12" height="20" rx="6" fill="#c8395b"/><circle cx="43" cy="66.5" r="1.1" fill="#ffd25e"/>' +
      '<rect x="22" y="51" width="9" height="9" rx="2" fill="#bfe3ff"/><rect x="49" y="51" width="9" height="9" rx="2" fill="#a9d6f7"/><path d="M26.5 51 v9 M22 55.5 h9 M53.5 51 v9 M49 55.5 h9" stroke="#fff" stroke-width="1.4"/>' +
      '<circle cx="24" cy="74" r="2.6" fill="#ff8aa0"/><circle cx="29" cy="73.6" r="2.4" fill="#ffd25e"/><circle cx="56" cy="74" r="2.6" fill="#ff8aa0"/>'},
    tree: {size: 1.15, anim: 'sway', svg: SHADOW +
      '<path d="M36.5 76 C38 66 38 58 35.5 51 H44.5 C42 58 42 66 43.5 76Z" fill="#9a6a35"/><path d="M40 76 C41 66 41 58 41.5 51 H44.5 C42 58 42 66 43.5 76Z" fill="#7d5428"/>' +
      '<circle cx="27" cy="43" r="12.5" fill="#43a964"/><circle cx="53" cy="43" r="12.5" fill="#3a9d5c"/><circle cx="40" cy="33" r="19" fill="#55bd74"/><circle cx="33" cy="26" r="7" fill="#7fd696"/>' +
      '<circle cx="30" cy="38" r="2.7" fill="#ef4d6b"/><circle cx="47" cy="30" r="2.7" fill="#ef4d6b"/><circle cx="51" cy="44" r="2.7" fill="#ef4d6b"/><circle cx="38" cy="45" r="2.5" fill="#ff8aa0"/>'},
    tulips: {size: .85, anim: 'sway', svg: '<ellipse cx="40" cy="76.5" rx="18" ry="2.8" fill="#7a5426" opacity=".12"/>' +
      tulip(28, 46, 30, '#ef4d6b', '#c8395b') + tulip(52, 40, 36, '#ff8aa0', '#ee6f89') + tulip(40, 32, 44, '#ffc93c', '#f5a524')},
    bench: {size: 1, anim: 'none', svg: SHADOW +
      '<path d="M18 76 V60 M62 76 V60 M22 60 V50 M58 60 V50" stroke="#7d5428" stroke-width="3.4" stroke-linecap="round"/>' +
      '<rect x="12" y="56" width="56" height="6" rx="3" fill="#c0612b"/><rect x="15" y="41" width="50" height="5" rx="2.5" fill="#d9783f"/><rect x="15" y="48" width="50" height="4.5" rx="2.2" fill="#d9783f"/>' +
      '<path d="M27 56 h12 l-1.5 -6 h-9Z" fill="#4d59e0"/><path d="M28.5 52 h9" stroke="#fff" stroke-width="1.2"/>' +
      '<path d="M50 56 c0 -3 1.6 -5 4 -5 h4 c2 0 3 1.6 3 3 v2Z" fill="#ffd25e"/><path d="M52 51 c1 -2.4 3 -3.4 5 -2.6" stroke="#3ec28a" stroke-width="1.6" fill="none" stroke-linecap="round"/>'},
    birdhouse: {size: .95, anim: 'none', svg: '<ellipse cx="40" cy="76.5" rx="10" ry="2.4" fill="#7a5426" opacity=".14"/>' +
      '<path d="M40 76 V42" stroke="#9a6a35" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M27 44 V28 L40 17 L53 28 V44Z" fill="#ffd25e"/><path d="M40 17 L53 28 V44 H40Z" fill="#f5b73a"/><path d="M24 30 L40 15 L56 30" stroke="#c8395b" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="40" cy="32" r="4.5" fill="#6b3d1f"/><path d="M36 39.5 h8" stroke="#9a6a35" stroke-width="2.2" stroke-linecap="round"/>' +
      '<g class="jm-hop"><path d="M55 24 c0 -4 3 -6.5 6 -6.5 c3.5 0 5.5 2.5 5.5 5.5 c0 3 -2.5 5 -6 5 c-2 0 -4 -1.4 -5.5 -4z" fill="#4d59e0"/><path d="M66 21.5 l3 -.8 l-2.6 2.2z" fill="#f5a524"/><circle cx="63.5" cy="20.5" r=".9" fill="#fff"/><path d="M57 22.5 c2 -1.2 4 -1 5.5 .5" stroke="#7d8cff" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>'},
    flowerpot: {size: .8, anim: 'sway', svg: '<ellipse cx="40" cy="76.5" rx="12" ry="2.4" fill="#7a5426" opacity=".14"/>' +
      '<path d="M40 56 V30 M40 46 C34 44 31 40 31 36 C36 37 39 41 40 46Z M40 50 C46 48 49 44 49 40 C44 41 41 45 40 50Z" stroke="#3a9d5c" stroke-width="2.4" fill="#4bb06a"/>' +
      '<g transform="translate(40 26)">' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return '<ellipse cx="0" cy="-7" rx="3.4" ry="6.5" fill="#fff" transform="rotate(' + i * 45 + ')"/>'; }).join('') + '<circle r="4.4" fill="#ffc93c"/></g>' +
      '<path d="M28 56 h24 l-3 20 H31Z" fill="#e8613a"/><path d="M42 56 h10 l-3 20 h-6Z" fill="#c94a26"/><rect x="26" y="54" width="28" height="5" rx="2" fill="#f07b4f"/>'},

    /* ---------- İbremetre: ölçü, yön, yükseklik ---------- */
    scales: {size: 1, anim: 'none', svg: SHADOW +
      '<path d="M27 76 h26 l-4 -6.5 h-18Z" fill="#3d45c4"/><rect x="38" y="25" width="4" height="46" rx="2" fill="#7d8cff"/><circle cx="40" cy="22" r="4" fill="#ffd25e"/>' +
      '<g class="jm-tilt" style="transform-origin:40px 27px"><rect x="12" y="25" width="56" height="4" rx="2" fill="#3d45c4"/>' +
      '<path d="M16 29 L10 47 M16 29 L22 47 M64 29 L58 47 M64 29 L70 47" stroke="#8a91ad" stroke-width="1.2"/>' +
      '<path d="M7 47 h18 a9 4.5 0 0 1 -18 0Z" fill="#ffd25e"/><path d="M55 47 h18 a9 4.5 0 0 1 -18 0Z" fill="#ffd25e"/><path d="M16 47 h9 a9 4.5 0 0 1 -9 4.5Z M64 47 h9 a9 4.5 0 0 1 -9 4.5Z" fill="#f5b73a"/>' +
      '<path d="M16 46 c-3.5 -4.5 -.5 -8 2.2 -6 c1.8 -2.6 5.4 -.4 3 3.4 z" fill="#ef4d6b"/>' + star(64, 42.5, 4.6, '#7d8cff') + '</g>'},
    signpost: {size: 1, anim: 'none', svg: SHADOW +
      '<path d="M40 76 V18" stroke="#9a6a35" stroke-width="4.5" stroke-linecap="round"/><path d="M42 76 V20" stroke="#7d5428" stroke-width="1.6"/>' +
      '<path d="M41 24 h26 l7 6 l-7 6 H41Z" fill="#7d8cff"/><path d="M41 31 h29 l4 -1 l-7 6 H41Z" fill="#5d6be8"/><path d="M47 30 h16" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M39 42 H14 l-7 6 l7 6 H39Z" fill="#ffd25e"/><path d="M39 49 H10 l-3 -1 l7 6 H39Z" fill="#f5b73a"/><path d="M33 48 H18" stroke="#a86a0c" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M30 76 c0 -4 3 -7 6 -7 M50 76 c0 -3 -2 -6 -5 -6" stroke="#6fbf7d" stroke-width="2.2" stroke-linecap="round" fill="none"/>'},
    lighthouse: {size: 1.3, anim: 'none', svg:
      '<path class="jm-beam" d="M40 20 L4 10 L4 30Z M40 20 L76 10 L76 30Z" fill="#ffe39a" opacity=".45"/>' +
      '<path d="M18 76 C20 68 28 66 34 68 C40 64 52 66 56 70 C60 70 64 72 64 76Z" fill="#a9a2b8"/><path d="M44 66 C50 65.5 55 67 56 70 C60 70 64 72 64 76 H48 C50 72 48 68 44 66Z" fill="#8f88a3"/>' +
      '<path d="M32 70 L35 30 H45 L48 70Z" fill="#fff"/><path d="M40 30 H45 L48 70 H40Z" fill="#eceefb"/>' +
      '<path d="M33.2 54 L33.8 46 H46.2 L46.8 54Z M34.4 38 L34.7 34 H45.3 L45.6 38Z M32.2 70 L32.6 62 H47.4 L47.8 70Z" fill="#4d59e0"/>' +
      '<rect x="33" y="16" width="14" height="13" rx="2" fill="#ffd25e"/><rect x="31" y="27.5" width="18" height="3.5" rx="1.5" fill="#3d45c4"/><path d="M32 16 L40 9 L48 16Z" fill="#3d45c4"/><path d="M37 16 v13 M43 16 v13" stroke="#f5b73a" stroke-width="1.6"/><circle cx="40" cy="8" r="1.6" fill="#3d45c4"/>'},
    peaks: {size: 1.3, anim: 'none', svg:
      '<path d="M0 76 L26 34 L40 52 L54 24 L80 76Z" fill="#8b95e8"/><path d="M54 24 L60 76 H80Z M26 34 L30 76 H40 L40 52Z" fill="#6f7bd9"/>' +
      '<path d="M54 24 L47.5 37 L52 35 L55 39 L59 34.5 L61.5 37Z" fill="#fff"/><path d="M26 34 L21 42 L25 40.5 L28 43 L31 41.5Z" fill="#fff"/>' +
      '<path d="M54 24 V9" stroke="#3d45c4" stroke-width="1.8"/><path class="jm-flag" d="M54 9.5 C59 8 62 11.5 67 10 L65.5 15 C60.5 16.5 58.5 13 54 14.5Z" fill="#ef4d6b"/>'},
    pine: {size: 1.1, anim: 'sway', svg: SHADOW +
      '<path d="M38 76 V64 h4 v12Z" fill="#7d5428"/>' +
      '<path d="M40 8 L56 34 H24Z" fill="#3e9a72"/><path d="M40 22 L60 50 H20Z" fill="#348a64"/><path d="M40 36 L64 66 H16Z" fill="#2c7b58"/>' +
      '<path d="M40 8 L56 34 H40Z M40 22 L60 50 H40Z M40 36 L64 66 H40Z" fill="#000" opacity=".1"/>' +
      '<circle cx="34" cy="46" r="1.8" fill="#ffd25e"/><circle cx="46" cy="58" r="1.8" fill="#ef4d6b"/><circle cx="38" cy="28" r="1.6" fill="#7d8cff"/>'},
    gauge: {size: 1, anim: 'none', svg: SHADOW +
      '<path d="M34 76 L37 56 H43 L46 76Z" fill="#3d45c4"/>' +
      '<path d="M10 52 A30 30 0 0 1 70 52 Z" fill="#fff"/><path d="M10 52 A30 30 0 0 1 70 52" stroke="#3d45c4" stroke-width="4" fill="none"/>' +
      '<path d="M17 50 A23 23 0 0 1 28 31" stroke="#ef4d6b" stroke-width="5" fill="none"/><path d="M31 29.5 A23 23 0 0 1 49 29.5" stroke="#3ec28a" stroke-width="5" fill="none"/><path d="M52 31 A23 23 0 0 1 63 50" stroke="#f5a524" stroke-width="5" fill="none"/>' +
      '<g class="jm-needle" style="transform-origin:40px 52px"><path d="M40 52 L40 28" stroke="#1b2142" stroke-width="3" stroke-linecap="round"/></g><circle cx="40" cy="52" r="4.4" fill="#1b2142"/><path d="M8 54 h64" stroke="#3d45c4" stroke-width="4" stroke-linecap="round"/>'},

    /* ---------- Ortak ---------- */
    bush: {size: .75, anim: 'sway', svg: '<ellipse cx="40" cy="76.5" rx="22" ry="3" fill="#7a5426" opacity=".12"/>' +
      '<circle cx="26" cy="64" r="12" fill="#4bb06a"/><circle cx="54" cy="64" r="12" fill="#3a9d5c"/><circle cx="40" cy="56" r="15" fill="#5cc27a"/><path d="M14 76 h52 v-8 H14Z" fill="#4bb06a"/>' +
      '<circle cx="34" cy="52" r="5" fill="#86da9c"/><circle cx="30" cy="62" r="2.4" fill="#fff"/><circle cx="48" cy="58" r="2.4" fill="#ffd25e"/><circle cx="56" cy="68" r="2.4" fill="#ff8aa0"/>'},
    flowers: {size: .6, anim: 'sway', svg:
      [[22, 50, '#ff8aa0'], [40, 40, '#ffd25e'], [58, 52, '#7d8cff']].map(function (f) {
        return '<path d="M' + f[0] + ' 76 V' + f[1] + '" stroke="#3a9d5c" stroke-width="2.4"/><g transform="translate(' + f[0] + ' ' + f[1] + ')">' +
          [0, 1, 2, 3, 4].map(function (i) { return '<circle cx="0" cy="-5" r="4" fill="' + f[2] + '" transform="rotate(' + i * 72 + ')"/>'; }).join('') + '<circle r="3" fill="#fff6d6"/></g>';
      }).join('')},
    cloud: {size: 1, sky: true, anim: 'drift', svg:
      '<path d="M12 52 a10 10 0 0 1 9 -13 a15 15 0 0 1 27 -5 a12 12 0 0 1 20 9 a8.5 8.5 0 0 1 -1 17 H18 a8 8 0 0 1 -6 -8Z" fill="#fff"/>' +
      '<path d="M14 56 c4 3 46 3 53 0 c0 1.8 -.6 3.4 -1 4 H18 c-2 0 -3.4 -1.6 -4 -4Z" fill="#e9ecf7"/>'},
    birds: {size: .8, sky: true, anim: 'drift', svg:
      '<g class="jm-flap"><path d="M14 40 q8 -8 14 0 q6 -8 14 0" stroke="#5a6187" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>' +
      '<g class="jm-flap" style="--d:-.35s"><path d="M44 28 q6 -6 11 0 q5 -6 11 0" stroke="#5a6187" stroke-width="2.3" fill="none" stroke-linecap="round"/></g>'},
    sparkle: {size: .7, sky: true, anim: 'none', svg:
      '<g class="jm-twinkle"><path d="M30 20 C31 30 34 33 44 34 C34 35 31 38 30 48 C29 38 26 35 16 34 C26 33 29 30 30 20Z" fill="#ffd25e"/></g>' +
      '<g class="jm-twinkle" style="--d:-.9s"><path d="M58 40 C58.6 45 60 46.4 65 47 C60 47.6 58.6 49 58 54 C57.4 49 56 47.6 51 47 C56 46.4 57.4 45 58 40Z" fill="#ffe39a"/></g>'},
    balloon: {size: 1, sky: true, anim: 'float', svg:
      '<path d="M40 8 C56 8 64 20 62 32 C60 42 50 48 46 54 H34 C30 48 20 42 18 32 C16 20 24 8 40 8Z" fill="#ef4d6b"/>' +
      '<path d="M40 8 C46 12 48 30 44 54 H36 C32 30 34 12 40 8Z" fill="#ffd25e"/><path d="M40 8 C56 8 64 20 62 32 C60 42 50 48 46 54 H44 C48 30 46 12 40 8Z" fill="#000" opacity=".08"/>' +
      '<path d="M35 54 L36 62 M45 54 L44 62" stroke="#7a5426" stroke-width="1.2"/><path d="M35 62 h10 v7 a2 2 0 0 1 -2 2 h-6 a2 2 0 0 1 -2 -2Z" fill="#9a6a35"/>'},
    kite: {size: .85, sky: true, anim: 'float', svg:
      '<path d="M40 6 L58 26 L40 52 L22 26Z" fill="#7d8cff"/><path d="M40 6 L58 26 L40 26Z M40 26 L22 26 L40 52Z" fill="#4d59e0"/><path d="M40 6 V52 M22 26 H58" stroke="#fff" stroke-width="1.2" opacity=".8"/>' +
      '<path class="jm-tail" d="M40 52 C34 58 46 62 40 68 C34 74 44 76 40 80" stroke="#8a91ad" stroke-width="1.4" fill="none"/><path d="M36 60 l4 1.5 l-4 1.5z M44 67 l-4 1.5 l4 1.5z" fill="#ffd25e"/>'},
    heart: {size: .75, sky: true, anim: 'float', svg:
      '<path d="M40 52 C24 42 18 34 18 26 a11 11 0 0 1 22 -3 a11 11 0 0 1 22 3 c0 8 -6 16 -22 26z" fill="#ff8aa0"/><path d="M27 25 a6 6 0 0 1 6 -5" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"/>' +
      '<path d="M40 52 C39 60 42 66 40 76" stroke="#c8395b" stroke-width="1.2" fill="none"/>'}
  };

  var THEMES = {
    siyer: {ground: ['palm', 'tent', 'camel', 'dunes', 'well', 'hira', 'city', 'lantern', 'palm', 'camel', 'rocks'], sky: ['birds', 'sparkle', 'cloud']},
    fikih: {ground: ['mosque', 'cypress', 'fountain', 'rahle', 'kandil', 'drops', 'cypress', 'bush'], sky: ['cloud', 'sparkle', 'birds']},
    adab: {ground: ['house', 'tree', 'tulips', 'bench', 'birdhouse', 'flowerpot', 'tree', 'bush', 'flowers'], sky: ['heart', 'birds', 'cloud', 'balloon']},
    ibre: {ground: ['scales', 'signpost', 'lighthouse', 'peaks', 'pine', 'gauge', 'pine', 'rocks'], sky: ['balloon', 'kite', 'cloud', 'birds']},
    akaid: {ground: ['scales', 'signpost', 'lighthouse', 'peaks', 'pine', 'gauge', 'pine', 'rocks'], sky: ['balloon', 'kite', 'cloud', 'birds']}
  };

  function draw(name) { var item = D[name]; return item ? '<svg class="jm-art" viewBox="0 0 80 80" aria-hidden="true" focusable="false">' + item.svg + '</svg>' : ''; }

  // Başlangıç bayrağı, hedef kapısı ve ünite sonu simgeleri.
  function flag(color) {
    return '<svg viewBox="0 0 60 80" aria-hidden="true" focusable="false"><ellipse cx="22" cy="77" rx="16" ry="3" fill="#7a5426" opacity=".14"/>' +
      '<path d="M10 77 C10 70 16 67 22 67 C28 67 34 70 34 77Z" fill="#cfc2ae"/><path d="M22 67 C28 67 34 70 34 77 H24 C24 72 23.5 69 22 67Z" fill="#b9aa91"/>' +
      '<path d="M22 70 V8" stroke="#7d5428" stroke-width="3.4" stroke-linecap="round"/><circle cx="22" cy="7" r="3" fill="#ffd25e"/>' +
      '<path class="jm-flag" d="M23 10 C33 6 40 14 52 9 L48 22 L52 34 C40 39 33 31 23 35Z" fill="' + color + '"/><path d="M23 10 C33 6 40 14 52 9 L48 22 C38 26 32 19 23 22Z" fill="#fff" opacity=".18"/>' +
      '<path d="M31 18.5 l2 4 4.4 .6 -3.2 3 .8 4.4 -4 -2.1 -4 2.1 .8 -4.4 -3.2 -3 4.4 -.6z" fill="#fff"/></svg>';
  }
  function gate(color, deep, done) {
    var glow = done ? '<circle cx="60" cy="58" r="56" fill="#ffd25e" opacity=".22" class="jm-glow"/>' : '';
    return '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">' + glow + '<ellipse cx="60" cy="116" rx="46" ry="4" fill="#7a5426" opacity=".14"/>' +
      '<path d="M18 116 V52 H34 V116Z M86 116 V52 H102 V116Z" fill="' + color + '"/><path d="M28 116 V52 H34 V116Z M96 116 V52 H102 V116Z" fill="' + deep + '"/>' +
      '<path d="M14 52 h24 v-6 h-24Z M82 52 h24 v-6 h-24Z" fill="' + deep + '"/><path d="M16 46 L26 34 L36 46Z M84 46 L94 34 L104 46Z" fill="' + color + '"/><circle cx="26" cy="32" r="2.4" fill="#ffd25e"/><circle cx="94" cy="32" r="2.4" fill="#ffd25e"/>' +
      '<path d="M26 60 C26 22 94 22 94 60" stroke="' + color + '" stroke-width="13" fill="none"/><path d="M26 60 C26 30 94 30 94 60" stroke="' + deep + '" stroke-width="3" fill="none" opacity=".5"/>' +
      '<path d="M32 60 C32 34 88 34 88 60 V116 H32Z" fill="#fff8ec" opacity=".55"/>' +
      '<path d="M30 44 C44 52 76 52 90 44" stroke="#a86a0c" stroke-width="1.2" fill="none"/>' +
      [36, 46, 56, 66, 76, 84].map(function (x, i) { var y = 44 + Math.sin((x - 30) / 60 * Math.PI) * 6.5; return '<path d="M' + (x - 3.4) + ' ' + y + ' L' + x + ' ' + (y + 8) + ' L' + (x + 3.4) + ' ' + y + 'Z" fill="' + ['#ef4d6b', '#ffd25e', '#3ec28a', '#7d8cff', '#ff8aa0', '#ffc93c'][i] + '"/>'; }).join('') +
      '<path d="M60 26 V12" stroke="#a86a0c" stroke-width="2"/><path d="M60 0 a7 7 0 1 0 5.6 11.2 a5.4 5.4 0 1 1 -5.6 -11.2z" fill="#ffd25e"/>' +
      '<path d="M46 116 V92 a14 14 0 0 1 28 0 V116Z" fill="' + deep + '" opacity=".35"/>' +
      (done ? '<g class="jm-twinkle">' + star(16, 22, 6, '#ffd25e') + '</g><g class="jm-twinkle" style="--d:-.7s">' + star(106, 18, 5, '#ffd25e') + '</g>' : '') + '</svg>';
  }
  function trophy() {
    return '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M12 7 h16 v7 a8 8 0 0 1 -16 0Z" fill="currentColor"/><path d="M12 9 H6 c0 6 3 9 7 9 M28 9 h6 c0 6 -3 9 -7 9" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      '<path d="M18 22 h4 v6 h-4Z M13 33 h14 v-3 a2 2 0 0 0 -2 -2 h-10 a2 2 0 0 0 -2 2Z" fill="currentColor"/><path d="M16 10 v5" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/></svg>';
  }
  function chest() {
    return '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M7 18 h26 v13 a2 2 0 0 1 -2 2 H9 a2 2 0 0 1 -2 -2Z" fill="currentColor"/><path d="M7 18 C7 10 12 8 20 8 C28 8 33 10 33 18Z" fill="currentColor" opacity=".75"/>' +
      '<path d="M7 18 h26" stroke="#fff" stroke-width="2" opacity=".6"/><rect x="17" y="16" width="6" height="8" rx="1.6" fill="#fff" opacity=".85"/><circle cx="20" cy="20.5" r="1.2" fill="currentColor"/></svg>';
  }

  /* ---------- Derse özel çizim ----------
     Yol kenarındaki çizim dersin kendisinden gelir:
       letters  Elifbâ dersleri: dersin kendi harfleri, pul biçiminde bir karoda (aşağıdaki LETTERS, tek yer).
       stamp    pulu olan ders: lesson.pullar[0].gorsel adresi olduğu gibi küçük bir <img> olur.
       theme    ikisi de yoksa serinin rastgele manzara çizimi (THEMES). */
  // Besmele ve Allah'ın adı yazılmaz; yalnız dersin öğrettiği harfler. Sıra ders başlığındaki sıradır.
  var LETTERS = {
    'kuran-01': ['ا', 'ب', 'ت', 'ث'],          // Elif, Be, Te, Se
    'kuran-02': ['ج', 'ح', 'خ'],                    // Cim, Ha, Hı
    'kuran-03': ['د', 'ذ', 'ر', 'ز'],          // Dal, Zel, Ra, Ze
    'kuran-04': ['س', 'ش', 'ص', 'ض'],          // Sin, Şın, Sad, Dad
    'kuran-05': ['ط', 'ظ', 'ع', 'غ'],          // Tı, Zı, Ayn, Gayn
    'kuran-06': ['ف', 'ق', 'ك'],                    // Fe, Kaf, Kef
    'kuran-07': ['ل', 'م', 'ن'],                    // Lam, Mim, Nun
    'kuran-08': ['و', 'ه', 'لا', 'ي']     // Vav, He, Lamelif, Ye
  };
  var ARABIC_FONT = "Amiri, 'Scheherazade New', 'Noto Naskh Arabic', 'Geeza Pro', 'Al Nile', Damascus, 'Traditional Arabic', serif";
  var TILE_COLORS = ['#1f9c9c', '#cc4a30', '#1d44a8'];
  var SAFE_SRC = /^(?:https?:\/\/|\.{0,2}\/)?[\w-][^\s"'<>\\]*$/;

  function attr(value) { return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function stampSrc(lesson) {
    var pul = lesson && Array.isArray(lesson.pullar) ? lesson.pullar[0] : null, src = pul && pul.gorsel;
    return typeof src === 'string' && src.length < 600 && SAFE_SRC.test(src) && !/^(?:javascript|data|vbscript):/i.test(src) ? src : '';
  }
  function choose(lesson) {
    var letters = lesson && LETTERS[lesson.id];
    if (letters) return {kind: 'letters', letters: letters.slice()};
    var src = stampSrc(lesson);
    return src ? {kind: 'stamp', src: src} : {kind: 'theme'};
  }
  // Tırtıklı kenarlı küçük pul karosu; harfler sağdan sola okunacak sırayla (üstte sağdan sola, altta ortada).
  function letterTile(letters, ordinal) {
    var w = 62, h = 76, r = 2.2, step = 6.2, d = 'M' + r + ' 0', i, color = TILE_COLORS[Math.abs(ordinal || 0) % TILE_COLORS.length];
    function notch(a, b) { d += 'L' + a + 'A' + r + ' ' + r + ' 0 0 0 ' + b; }
    for (i = step; i < w; i += step) notch((i - r) + ' 0', (i + r) + ' 0');
    notch((w - r) + ' 0', w + ' ' + r);
    for (i = step; i < h; i += step) notch(w + ' ' + (i - r), w + ' ' + (i + r));
    notch(w + ' ' + (h - r), (w - r) + ' ' + h);
    for (i = w - step; i > 0; i -= step) notch((i + r) + ' ' + h, (i - r) + ' ' + h);
    notch(r + ' ' + h, '0 ' + (h - r));
    for (i = h - step; i > 0; i -= step) notch('0 ' + (i + r), '0 ' + (i - r));
    notch('0 ' + r, r + ' 0');
    var count = letters.length, cells = [];
    // İki sütun, ilk harf sağda; tek kalan harf ortada.
    letters.forEach(function (letter, k) {
      var row = Math.floor(k / 2), alone = count - row * 2 === 1, x = alone ? 31 : (k % 2 === 0 ? 44.5 : 17.5), y = count > 2 ? 33 + row * 22 : 41;
      cells.push('<text x="' + x + '" y="' + y + '" text-anchor="middle" dominant-baseline="central" font-family="' + ARABIC_FONT + '" font-weight="700" font-size="' + (letter.length > 1 ? 18 : 21) + '" fill="#fff4d6">' + letter + '</text>');
    });
    return '<svg class="jm-art jm-tile" viewBox="-1 -1 64 78" aria-hidden="true" focusable="false">' +
      '<path d="' + d + 'Z" fill="#fbf3df" stroke="rgba(60,40,10,.18)" stroke-width=".5"/>' +
      '<rect x="6" y="6" width="50" height="64" rx="1.5" fill="' + color + '"/><rect x="8" y="8" width="46" height="60" rx="1" fill="none" stroke="#e5bf68" stroke-width="1"/>' +
      star(31, 15, 3.6, '#e5bf68') + cells.join('') + '</svg>';
  }
  function stampImg(src, size) {
    var px = Math.round(size);
    return '<img class="jm-art jm-stamp" src="' + attr(src) + '" alt="" width="' + px + '" height="' + px + '" loading="lazy" decoding="async" draggable="false">';
  }
  // choice: choose() sonucu; size: piksel boyu (img'e yazılır, yerleşim kaymaz); ordinal: dersin sırası (karo rengi).
  function lessonDraw(choice, size, ordinal) {
    return choice.kind === 'letters' ? letterTile(choice.letters, ordinal) : choice.kind === 'stamp' ? stampImg(choice.src, size) : '';
  }

  root.BiriJourneyArt = {draw: draw, has: function (name) { return !!D[name]; }, info: function (name) { return D[name] || null; }, themes: THEMES,
    letters: LETTERS, choose: choose, letterTile: letterTile, stampImg: stampImg, lessonDraw: lessonDraw, flag: flag, gate: gate, trophy: trophy, chest: chest};
})(typeof window !== 'undefined' ? window : globalThis);

# Birlikte İyilik Ağacı

Reference: the ICQR Magic Tree interaction in the user-supplied recording. The
implementation is an original Three.js scene; it uses no ICQR iframe, assets,
API, or service. Three.js r180 is served locally with its MIT license.

## Placements

| Page | Initial theme | Purpose |
| --- | --- | --- |
| `/` | Filiz, green foliage | Share the academy after the support section |
| `/destek-ol` | Bereket, amber maple leaves | Share the support/community journey |
| `/destek-ol/gonullu-ol` | Bahar, pink blossoms | Share the volunteering journey |
| `/qr` | Filiz, compact card after the existing links | Download/share a QR without displacing application links |
| `/iyilik-agaci` | All three themes, fullscreen controls | A presentation for events and meetings |

Every QR and destination link encodes exactly `https://birlikteiyilik.com/qr`.
Changing the theme does not change this destination. The scene represents the
academy symbolically; it does not imply donations, planting, or progress data.

## Rendering and interaction

The scene has tapered curved branches, a procedural bark texture, bent leaf
geometry, distinct blossoms/maple leaves, moving foliage, falling petals,
grass, stone tiles, books, and soft directional shadows. Instances share
geometry; tapered branches are merged into one draw and flat foliage uses
Three.js's single-pass vegetation rendering. The tree can be rotated horizontally and changes to a frontal QR in
1.35 seconds. Leaf particles become QR modules and the final pose is overlaid
with the exact SVG artwork so the code remains stable and sharp.

There are 1,250 foliage instances on narrow viewports and 1,700 on wide ones.
Pixel ratio is capped at 1.6; the frame loop is capped at 60 fps and stops
outside the viewport, in a hidden document, when paused, or in QR view. Reduced
motion disables wind and replaces the morph with an immediate state change.
When JavaScript/WebGL is unavailable, the usable SVG and destination link
remain. All scene resources are same-origin and work with the existing CSP.

The Three.js archive was obtained from the npm registry and checked against
the registry's SHA-512 integrity:
`o+qycAMZrh+TsE01GqWUxUIKR1AL0S8pq7zDkYOQw8GqfX8b8VoCKYUoHbhiX5j+7hr8XsuHDVU6+gkQJQKg9w==`.

## Source and regeneration

- Shared source: `_src/static/js/qr-tree-*-v1.js`, `_src/static/css/qr-tree-v1.css`.
- Published copies: the corresponding paths under `/js` and `/css`.
- Markup partial: `_src/templates/partials/qr-tree.html`.
- Home source: `_src/templates/pages/index.html`; published `index.html` is
  edited alongside it. Support, volunteer, and QR pages are maintained as
  static HTML. Presentation source is `_src/templates/pages/iyilik-agaci.html`.
- QR SVG/matrix: run `python _src/generate_tree_qr.py` with `qrcode==8.2`.
  The generator writes both source and published copies. It uses version 4,
  high error correction, square modules, and a four-module white quiet zone.
- Do not run the entire SSG over the checkout to update one widget. Validate
  with `python _src/build.py --base /review --output /tmp/bia-tree-build` and
  update only the intended published files. New source JS/CSS must also be
  copied to the corresponding published paths before deployment.
- Bump asset filenames when changing a published version because `/js` and
  `/css` have immutable caching in `vercel.json`.

Official implementation references consulted:

- https://threejs.org/docs/#api/en/objects/InstancedMesh
- https://threejs.org/docs/#api/en/renderers/WebGLRenderer
- https://github.com/lincolnloop/python-qrcode/tree/v8.2

Validate QR screenshots with an independent decoder, such as ZXing, across
themes and desktop/mobile sizes. Also check pointer rotation, keyboard
activation, pause, reduced motion, WebGL/JavaScript fallback, fullscreen,
resource loading, CSP, and the existing Node tests. Browser emulation and
image decoding do not replace testing on physical devices.

The reusable decoding/layout regression is `tests/qr-tree.browser.py`.
Install `_src/requirements-qr-tree-qa.txt` in a QA virtual environment; use the
system Chromium or install it with `python -m playwright install chromium`.
With the site served locally, run
`python tests/qr-tree.browser.py --url http://127.0.0.1:8080`.

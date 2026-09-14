# Kendi Yolunda — light editorial site

`index.html`, `light.css` and `light.js` are the active site. No framework, animation library, Remotion player or scroll-to-video-time controller is loaded.

The narrative uses normal native page scrolling. On desktop, a sticky image column softly blends between three images while text remains in document flow. On tablet/mobile, each image is inline with its corresponding text. The page does not intercept wheel/touch inputs, apply scroll momentum or force chapter snapping. Reduced-motion users get static imagery.

The header artwork is a generated still, with an optional 14-second, subtle camera-motion MP4 loop (not live-action footage). It only loads when visible, pauses offscreen and supports a persistent user pause. The three posters were generated with the built-in Imagegen tool; the lettering is baked into each asset. All pictured people were specified as adult men. Existing Birlikte İyilik branding and the original project PDF are preserved.

Run `node --test tests/yon-light.test.mjs` from the repository root. No development server is needed. The old film assets and Remotion sources are retained as historical deliverables but are not referenced by the active page.

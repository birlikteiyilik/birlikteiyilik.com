# Kendi Yolunda — presentation film

The site plays pre-rendered H.264 MP4 video. It does not mount React or Remotion Player in the browser. All typography, scene transitions, imagery and motion are baked into the film.

The two compositions share a 2310-frame, 30fps timeline (77 seconds). Desktop is 1920×1080. Mobile is composed at 1080×1920 and exported at 720×1280. Original visual assets live in `../assets`, configured as Remotion's public directory.

The independent film design lives in `src/film`. A persistent red line morphs point-for-point through a road, knot, six checkpoints, compass, waveform, steps, practice dial, portfolio binding, shield, follow-up route and open road. Typography is paced around those transformations, with 4–5 second reading holds. The earlier `src/scenes` files are retained as historical source but are not used by either film composition.

## Editing and rendering

```sh
pnpm install --frozen-lockfile
pnpm studio
pnpm render:desktop
pnpm render:mobile
```

Encode each master for scroll seeking. Six-frame GOPs, no B-frames, and faststart enable low-latency reverse/forward seeking and progressive loading:

```sh
ffmpeg -i out/desktop.mp4 -an -c:v libx264 -preset fast -crf 23 -g 6 -keyint_min 6 -sc_threshold 0 -bf 0 -pix_fmt yuv420p -movflags +faststart ../assets/kendi-yolunda-desktop-v1.mp4
ffmpeg -i out/mobile.mp4 -an -c:v libx264 -preset fast -crf 23 -g 6 -keyint_min 6 -sc_threshold 0 -bf 0 -pix_fmt yuv420p -movflags +faststart ../assets/kendi-yolunda-mobile-v1.mp4
ffmpeg -ss 4 -i out/desktop.mp4 -frames:v 1 -q:v 3 ../assets/film-desktop-poster.jpg
ffmpeg -ss 4 -i out/mobile.mp4 -frames:v 1 -q:v 3 ../assets/film-mobile-poster.jpg
```

Increment asset versions in `../video-scroll.js` and `../index.html` after replacing published films. Update the duration/scene labels in the scroll controller when editing timeline timing.

## Website behavior

The native video remains paused while scroll controls `currentTime`. The controller permits only one seek at a time and eases toward the newest scroll target. Portrait orientation loads only the mobile film. The “Filmi izle” control switches to regular playback with native controls; returning to scroll mode preserves the current position. There is a downloadable MP4, source PDF and text transcript below the story. Audio is intentionally absent so reverse scrubbing is silent.

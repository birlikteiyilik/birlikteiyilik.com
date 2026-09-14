import {TOTAL} from './system';

export const CAMERA_START = 96;
export const CAMERA_END = TOTAL - 96;
export const PAGE_COUNT = 11;
export const PAGE_TRAVEL = (CAMERA_END - CAMERA_START) / (PAGE_COUNT - 1);

// Continuous, monotonic motion. The linear component keeps the camera moving
// through reading holds; smoothstep supplies a gentle acceleration between them.
export function cameraPage(frame: number): number {
  const progress = Math.max(0, Math.min(PAGE_COUNT - 1, (frame - CAMERA_START) / PAGE_TRAVEL));
  const page = Math.floor(progress);
  const u = progress - page;
  const smooth = u * u * u * (u * (u * 6 - 15) + 10);
  return page + .18 * u + .82 * smooth;
}

export function sceneStart(index: number): number {
  return index === 0 ? 0 : Math.max(0, Math.round(CAMERA_START + (index - 1) * PAGE_TRAVEL - 40));
}

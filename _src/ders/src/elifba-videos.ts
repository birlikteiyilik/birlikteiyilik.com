export const elifbaPlaylistId = "PLyi8Qf72STLgAI-MhiAnuZFNe9c6iIgx5";
export const elifbaPlaylistUrl = `https://www.youtube.com/playlist?list=${elifbaPlaylistId}`;

/** Videos confirmed by hand; the rest of the playlist is read from YouTube when the page opens. */
export const knownElifbaVideos: { id: string; title: string }[] = [
  { id: "EqgHsdzLvWc", title: "ElifBa Mobil - Ders 01 / Harfler" },
];

export type VideoCover = { lesson: string; topic: string };

/** "ElifBa Mobil - Ders 01 / Harfler" → { lesson: "Ders 01", topic: "Harfler" }. */
export function videoCover(title: string | undefined, position: number): VideoCover {
  const fallback = { lesson: `Ders ${String(position).padStart(2, "0")}`, topic: "" };
  if (!title) return fallback;
  const match = /ders\s*(\d+)\s*(?:[/:|–-]\s*(.+))?$/i.exec(title.trim());
  if (match) return { lesson: `Ders ${match[1].padStart(2, "0")}`, topic: (match[2] || "").trim() };
  const cleaned = title.replace(/^elif\s*-?\s*ba\s*(mobil)?\s*[-–:|]?\s*/i, "").trim();
  return { lesson: fallback.lesson, topic: cleaned || title.trim() };
}

/** The video's own YouTube cover (480×360, letterboxed for 16:9 videos; cropped by the card). */
export function thumbnailUrl(id: string) {
  return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
}

export function embedUrl(id: string, autoplay = true) {
  const params = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" });
  if (autoplay) params.set("autoplay", "1");
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${params}`;
}

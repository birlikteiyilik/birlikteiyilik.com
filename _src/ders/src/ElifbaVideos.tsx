import { useCallback, useEffect, useRef, useState } from "react";
import { elifbaPlaylistId, elifbaPlaylistUrl, embedUrl, knownElifbaVideos, thumbnailUrl, videoCover } from "./elifba-videos";

type Video = { id: string; title?: string };
type YouTubePlayer = {
  getPlaylist: () => string[] | null;
  cueVideoById: (id: string) => void;
  getVideoData: () => { video_id?: string; title?: string };
  destroy: () => void;
};
type YouTubeNamespace = { Player: new (element: HTMLElement, options: Record<string, unknown>) => YouTubePlayer };
declare global {
  interface Window { YT?: YouTubeNamespace; onYouTubeIframeAPIReady?: () => void }
}

const titleCacheKey = "elifba-video-basliklari-v1";

function readTitleCache(): Record<string, string> {
  try { return JSON.parse(window.localStorage.getItem(titleCacheKey) || "{}"); } catch (_) { return {}; }
}
function writeTitleCache(titles: Record<string, string>) {
  try { window.localStorage.setItem(titleCacheKey, JSON.stringify(titles)); } catch (_) { /* Private windows may block storage. */ }
}

let apiPromise: Promise<YouTubeNamespace> | null = null;
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  apiPromise ??= new Promise<YouTubeNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { previous?.(); if (window.YT) resolve(window.YT); };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => { apiPromise = null; reject(new Error("YouTube yüklenemedi")); };
    document.head.append(script);
  });
  return apiPromise;
}

/**
 * Reads the playlist's video ids (and, one by one, their titles) through a hidden YouTube player,
 * so new videos added to the playlist appear here without a site update.
 */
function usePlaylist() {
  const [videos, setVideos] = useState<Video[]>(() => {
    const cache = readTitleCache();
    return knownElifbaVideos.map((video) => ({ id: video.id, title: cache[video.id] || video.title }));
  });
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let player: YouTubePlayer | null = null;
    let poll = 0;
    const timeout = window.setTimeout(() => { if (!disposed) setState((current) => current === "loading" ? "failed" : current); }, 12000);
    const titles = readTitleCache();
    knownElifbaVideos.forEach((video) => { titles[video.id] ||= video.title; });
    let queue: string[] = [];
    let pending: string | null = null;
    let titleTimer = 0;

    const nextTitle = () => {
      window.clearTimeout(titleTimer);
      if (disposed || !player) return;
      pending = queue.shift() || null;
      if (!pending) return;
      player.cueVideoById(pending);
      // A video whose details never arrive keeps its numbered cover; the rest still load.
      titleTimer = window.setTimeout(nextTitle, 5000);
    };
    const readTitle = () => {
      if (!player || !pending) return;
      const data = player.getVideoData();
      if (data.video_id === pending && data.title) {
        titles[pending] = data.title;
        writeTitleCache(titles);
        const id = pending;
        setVideos((current) => current.map((video) => video.id === id ? { ...video, title: data.title } : video));
        nextTitle();
      }
    };
    const readPlaylist = () => {
      const ids = player?.getPlaylist();
      if (!ids?.length || disposed) return false;
      window.clearInterval(poll);
      window.clearTimeout(timeout);
      setVideos(ids.map((id) => ({ id, title: titles[id] })));
      setState("ready");
      queue = ids.filter((id) => !titles[id]);
      nextTitle();
      return true;
    };

    loadYouTubeApi().then((YT) => {
      if (disposed || !hostRef.current) return;
      const target = document.createElement("div");
      hostRef.current.replaceChildren(target);
      player = new YT.Player(target, {
        width: 1, height: 1, host: "https://www.youtube-nocookie.com",
        playerVars: { listType: "playlist", list: elifbaPlaylistId, autoplay: 0, controls: 0, playsinline: 1 },
        events: {
          onReady: () => { if (!readPlaylist()) poll = window.setInterval(readPlaylist, 500); },
          onStateChange: (event: { data: number }) => { if (event.data === 5 || event.data === -1) readTitle(); },
        },
      });
    }).catch(() => { if (!disposed) setState("failed"); });

    return () => {
      disposed = true;
      window.clearInterval(poll);
      window.clearTimeout(timeout);
      window.clearTimeout(titleTimer);
      player?.destroy();
    };
  }, []);

  return { videos, state, hostRef };
}

export function ElifbaVideos() {
  const { videos, state, hostRef } = usePlaylist();
  const [openId, setOpenId] = useState<string | null>(() => new URLSearchParams(window.location.search).get("video"));
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openIndex = openId ? videos.findIndex((video) => video.id === openId) : -1;
  const openVideo = openIndex >= 0 ? videos[openIndex] : openId ? { id: openId } : null;

  const setOpen = useCallback((id: string | null) => {
    setOpenId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("video", id); else url.searchParams.delete("video");
    window.history.replaceState({}, "", url);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (openId && !dialog.open) dialog.showModal();
    if (!openId && dialog.open) dialog.close();
  }, [openId]);

  const cover = (video: Video, index: number) => videoCover(video.title, index + 1);
  const openCover = openVideo ? cover(openVideo, Math.max(0, openIndex)) : null;

  return (
    <main className="video-library">
      <div className="video-library-intro">
        <p className="hub-eyebrow">ELİFBA · VİDEO DERSLER</p>
        <h2>Harf harf, ders ders</h2>
        <p>Bir derse dokunun; video bu sayfada açılır. Hocalar derste ekrana yansıtabilir, öğrenciler evde tekrar edebilir.</p>
        <a className="video-library-source" href={elifbaPlaylistUrl} target="_blank" rel="noopener noreferrer">YouTube’da oynatma listesi ↗</a>
      </div>
      {state === "loading" && <p className="video-library-status" role="status">Dersler listeleniyor…</p>}
      {state === "failed" && (
        <div className="video-library-fallback">
          <p role="status">Ders listesi şu anda okunamadı. Oynatma listesini aşağıdan izleyebilirsiniz.</p>
          <div className="video-frame"><iframe src={`https://www.youtube-nocookie.com/embed/videoseries?list=${elifbaPlaylistId}&rel=0`} title="Elifba video dersleri oynatma listesi" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" /></div>
        </div>
      )}
      <ol className="video-grid" aria-label="Elifba video dersleri">
        {videos.map((video, index) => {
          const { lesson, topic } = cover(video, index);
          return (
            <li key={video.id}>
              <button className={`video-cover video-cover-${index % 4}`} onClick={() => setOpen(video.id)} aria-label={`${lesson}${topic ? `: ${topic}` : ""} videosunu aç`}>
                <span className="video-cover-art" aria-hidden="true">
                  {/* If YouTube's cover cannot load, the drawn card behind it stays visible. */}
                  <img src={thumbnailUrl(video.id)} alt="" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.hidden = true; }} />
                  <span className="video-cover-play">▶</span>
                </span>
                <span className="video-cover-text"><strong>{lesson}</strong><span>{topic || "Elifba"}</span></span>
              </button>
            </li>
          );
        })}
      </ol>
      <div ref={hostRef} className="video-playlist-reader" aria-hidden="true" />
      <dialog ref={dialogRef} className="video-dialog" onClose={() => setOpen(null)} onClick={(event) => { if (event.target === event.currentTarget) setOpen(null); }} aria-label={openCover ? `${openCover.lesson} ${openCover.topic}` : "Video"}>
        {openVideo && openCover && (
          <div className="video-dialog-inner">
            <header>
              <div><strong>{openCover.lesson}</strong>{openCover.topic && <span>{openCover.topic}</span>}</div>
              <button onClick={() => setOpen(null)} aria-label="Videoyu kapat">Kapat ✕</button>
            </header>
            <div className="video-frame"><iframe key={openVideo.id} src={embedUrl(openVideo.id)} title={openVideo.title || openCover.lesson} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
            <footer>
              <button disabled={openIndex <= 0} onClick={() => setOpen(videos[openIndex - 1].id)}>← Önceki ders</button>
              <span>{openIndex >= 0 ? `${openIndex + 1} / ${videos.length}` : ""}</span>
              <button disabled={openIndex < 0 || openIndex >= videos.length - 1} onClick={() => setOpen(videos[openIndex + 1].id)}>Sonraki ders →</button>
            </footer>
          </div>
        )}
      </dialog>
    </main>
  );
}

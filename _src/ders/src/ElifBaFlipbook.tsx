import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { PageFlip } from "page-flip/dist/js/page-flip.module.js";
import { flipbookGesture } from "./flipbookGesture";

const pageCount = 56;
const assets = `${import.meta.env.BASE_URL}assets/`;
export const elifBaPageImage = (page: number) => `${assets}elif-ba-pages/page-${String(page).padStart(2, "0")}.webp`;

export type FlipbookHandle = {
  next: () => void;
  previous: () => void;
  goTo: (page: number) => void;
};

type Props = {
  initialPage: number;
  onPageChange: (page: number, spread: boolean) => void;
  onTurningChange: (turning: boolean) => void;
};

export const ElifBaFlipbook = forwardRef<FlipbookHandle, Props>(function ElifBaFlipbook({ initialPage, onPageChange, onTurningChange }, ref) {
  const stageRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<PageFlip | null>(null);
  const loadNearbyRef = useRef<(index: number) => void>(() => {});
  const initialPageRef = useRef(initialPage);
  const callbacks = useRef({ onPageChange, onTurningChange });

  useLayoutEffect(() => { callbacks.current = { onPageChange, onTurningChange }; });

  useImperativeHandle(ref, () => ({
    next: () => bookRef.current?.flipPrev(),
    previous: () => bookRef.current?.flipNext(),
    goTo: (page) => {
      loadNearbyRef.current(pageCount - page);
      bookRef.current?.turnToPage(pageCount - page);
    },
  }), []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let disposed = false;
    const host = document.createElement("div");
    host.className = "flipbook";
    stage.appendChild(host);
    const fitHeight = () => {
      const columns = stage.clientWidth < 960 ? 1 : 2;
      host.style.height = `${Math.min(stage.clientHeight, stage.clientWidth / columns * 1800 / 1273)}px`;
    };
    fitHeight();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const book = new PageFlip(host, {
      width: 1273, height: 1800, size: "stretch",
      minWidth: 480, maxWidth: 1273, minHeight: 100, maxHeight: 1800,
      autoSize: false, usePortrait: true, showCover: true,
      startPage: pageCount - initialPageRef.current,
      flippingTime: reducedMotion.matches ? 1 : 650,
      maxShadowOpacity: 0.22, drawShadow: true,
      useMouseEvents: false, mobileScrollSupport: false,
      showPageCorners: false,
    });
    const pages = Array.from({ length: pageCount }, (_, index) => {
      // Reversing the leaves gives a real right-to-left book without mirroring its artwork.
      const page = pageCount - index;
      const element = document.createElement("div");
      element.className = "flipbook-page";
      element.setAttribute("role", "group");
      element.setAttribute("aria-label", `Sayfa ${page}`);
      element.setAttribute("aria-hidden", "true");
      const image = document.createElement("img");
      image.alt = `Elif Ba müfredatı, ${page}. sayfa`;
      image.width = 1273;
      image.height = 1800;
      image.draggable = false;
      image.decoding = "async";
      image.addEventListener("load", () => element.classList.add("is-loaded"));
      image.addEventListener("error", () => element.classList.add("has-error"));
      const fallback = document.createElement("div");
      fallback.className = "flipbook-page-fallback";
      const message = document.createElement("span");
      message.textContent = `${page}. sayfa yükleniyor…`;
      const link = document.createElement("a");
      link.href = `${assets}elif-ba-mufredat.pdf#page=${page}`;
      link.textContent = "PDF’yi aç ↗";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      fallback.append(message, link);
      element.append(fallback, image);
      return element;
    });
    const loadNearby = (index: number) => {
      // Fetch the current spread and its neighbours before they are turned into view.
      for (let i = Math.max(0, index - 3); i <= Math.min(pageCount - 1, index + 4); i++) {
        const image = pages[i].querySelector("img")!;
        if (!image.hasAttribute("src")) image.src = elifBaPageImage(pageCount - i);
      }
    };
    loadNearbyRef.current = loadNearby;
    let previousMode: "portrait" | "landscape" | null = null;
    let visiblePage = initialPageRef.current;
    const syncPage = () => {
      if (disposed) return;
      const index = book.getCurrentPageIndex();
      const mode = book.getOrientation();
      const wasSpread = previousMode === "landscape";
      previousMode = mode;
      if (wasSpread && mode === "portrait" && pageCount - index !== visiblePage) {
        book.turnToPage(pageCount - visiblePage);
        return;
      }
      const spread = mode === "landscape" && index > 0 && index < pageCount - 1;
      loadNearby(index);
      pages.forEach((element, i) => element.setAttribute("aria-hidden", String(i !== index && !(spread && i === index + 1))));
      host.dataset.cover = !spread && book.getOrientation() === "landscape" ? (index === 0 ? "front" : "back") : "none";
      host.style.setProperty("--flipbook-page-width", `${book.getBoundsRect().pageWidth}px`);
      visiblePage = pageCount - index - (spread ? 1 : 0);
      callbacks.current.onPageChange(visiblePage, spread);
    };
    book.on("flip", syncPage);
    book.on("init", syncPage);
    book.on("changeOrientation", syncPage);
    book.on("changeState", ({ data }) => {
      if (!disposed) callbacks.current.onTurningChange(data === "flipping" || data === "user_fold");
    });
    loadNearby(pageCount - initialPageRef.current);
    book.loadFromHTML(pages);
    bookRef.current = book;
    type Gesture = { id: number; x: number; y: number; startedAt: number; simple: boolean; bounds: { left: number; right: number; top: number; height: number } };
    let gesture: Gesture | null = null;
    const localPoint = (x: number, y: number) => {
      const rect = book.getUI().getDistElement().getBoundingClientRect();
      return { x: x - rect.left, y: y - rect.top };
    };
    const release = (id: number) => { if (stage.hasPointerCapture(id)) stage.releasePointerCapture(id); };
    const pointerDown = (event: PointerEvent) => {
      if (!event.isPrimary) { if (gesture) release(gesture.id); gesture = null; return; }
      const target = event.target instanceof Element ? event.target : null;
      const leaf = target?.closest<HTMLElement>(".flipbook-page");
      if (!leaf || target?.closest("a, button") || event.button !== 0 || book.getState() === "flipping") return;
      event.preventDefault();
      const rects = Array.from(host.querySelectorAll<HTMLElement>('.flipbook-page[aria-hidden="false"]')).map((page) => page.getBoundingClientRect());
      const bounds = { left: Math.min(...rects.map((rect) => rect.left)), right: Math.max(...rects.map((rect) => rect.right)), top: Math.min(...rects.map((rect) => rect.top)), height: Math.max(...rects.map((rect) => rect.height)) };
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, startedAt: performance.now(), simple: event.pointerType !== "mouse" || book.getOrientation() === "portrait", bounds };
      stage.setPointerCapture(event.pointerId);
      if (!gesture.simple) book.startUserTouch(localPoint(event.clientX, event.clientY));
    };
    const pointerMove = (event: PointerEvent) => {
      if (gesture?.id !== event.pointerId) return;
      event.preventDefault();
      if (!gesture.simple) book.userMove(localPoint(event.clientX, event.clientY), false);
    };
    const pointerUp = (event: PointerEvent) => {
      if (gesture?.id !== event.pointerId) return;
      event.preventDefault();
      const completed = gesture;
      gesture = null;
      release(event.pointerId);
      if (!completed.simple) { book.userStop(localPoint(event.clientX, event.clientY)); return; }
      const direction = flipbookGesture({ x: completed.x, y: completed.y }, { x: event.clientX, y: event.clientY }, completed.bounds, performance.now() - completed.startedAt);
      const corner = completed.y < completed.bounds.top + completed.bounds.height / 2 ? "top" : "bottom";
      if (direction === "next") book.flipPrev(corner);
      else if (direction === "previous") book.flipNext(corner);
    };
    const pointerCancel = () => {
      if (!gesture) return;
      const cancelled = gesture;
      gesture = null;
      release(cancelled.id);
      if (!cancelled.simple) book.userStop(localPoint(cancelled.x, cancelled.y));
    };
    stage.addEventListener("pointerdown", pointerDown);
    stage.addEventListener("pointermove", pointerMove);
    stage.addEventListener("pointerup", pointerUp);
    stage.addEventListener("pointercancel", pointerCancel);
    stage.addEventListener("lostpointercapture", pointerCancel);
    const observer = new ResizeObserver(() => {
      if (stage.clientWidth && stage.clientHeight) { fitHeight(); book.update(); syncPage(); }
    });
    observer.observe(stage);
    const updateMotion = () => {
      book.getSettings().flippingTime = reducedMotion.matches ? 1 : 650;
    };
    reducedMotion.addEventListener("change", updateMotion);
    return () => {
      disposed = true;
      observer.disconnect();
      stage.removeEventListener("pointerdown", pointerDown);
      stage.removeEventListener("pointermove", pointerMove);
      stage.removeEventListener("pointerup", pointerUp);
      stage.removeEventListener("pointercancel", pointerCancel);
      stage.removeEventListener("lostpointercapture", pointerCancel);
      reducedMotion.removeEventListener("change", updateMotion);
      ["flip", "init", "changeOrientation", "changeState"].forEach((event) => book.off(event));
      bookRef.current = null;
      loadNearbyRef.current = () => {};
      // The library also registers resize listeners when its own input handlers are disabled.
      book.getSettings().useMouseEvents = true;
      book.destroy();
    };
  }, []);

  return <div className="flipbook-stage" ref={stageRef} aria-label="Elif Ba sayfa çevirme kitabı" title="Sonraki sayfa için sol kenara dokunun veya sayfayı sağa sürükleyin" />;
});

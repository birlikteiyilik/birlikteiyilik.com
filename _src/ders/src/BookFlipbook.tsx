import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import { PageFlip } from "page-flip/dist/js/page-flip.module.js";
import { flipbookGesture } from "./flipbookGesture";
import { bookPageImage, bookPdfHref, type Book } from "./books";

export type FlipbookHandle = {
  next: () => void;
  previous: () => void;
  goTo: (page: number) => void;
};

type Props = {
  book: Book;
  initialPage: number;
  onPageChange: (page: number, spread: boolean) => void;
  onTurningChange: (turning: boolean) => void;
};

export const BookFlipbook = forwardRef<FlipbookHandle, Props>(function BookFlipbook({ book: edition, initialPage, onPageChange, onTurningChange }, ref) {
  const { pageCount, width, height, direction } = edition;
  const isRtl = direction === "rtl";
  const stageRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<PageFlip | null>(null);
  const loadNearbyRef = useRef<(index: number) => void>(() => {});
  const initialPageRef = useRef(initialPage);
  const callbacks = useRef({ onPageChange, onTurningChange });

  useLayoutEffect(() => { callbacks.current = { onPageChange, onTurningChange }; });

  useImperativeHandle(ref, () => ({
    next: () => isRtl ? bookRef.current?.flipPrev() : bookRef.current?.flipNext(),
    previous: () => isRtl ? bookRef.current?.flipNext() : bookRef.current?.flipPrev(),
    goTo: (page) => {
      const index = isRtl ? pageCount - page : page - 1;
      loadNearbyRef.current(index);
      bookRef.current?.turnToPage(index);
    },
  }), [isRtl, pageCount]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let disposed = false;
    const host = document.createElement("div");
    host.className = "flipbook";
    stage.appendChild(host);
    const fitHeight = () => {
      const columns = stage.clientWidth < 960 ? 1 : 2;
      host.style.height = `${Math.min(stage.clientHeight, stage.clientWidth / columns * height / width)}px`;
    };
    fitHeight();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // An odd RTL book needs pairs from index 0 so its final leaf (the front cover) stays single.
    const showCover = !isRtl || pageCount % 2 === 0;
    const book = new PageFlip(host, {
      width, height, size: "stretch",
      minWidth: 480, maxWidth: width, minHeight: 100, maxHeight: height,
      autoSize: false, usePortrait: true, showCover,
      startPage: isRtl ? pageCount - initialPageRef.current : initialPageRef.current - 1,
      flippingTime: reducedMotion.matches ? 1 : 650,
      maxShadowOpacity: 0.22, drawShadow: true,
      useMouseEvents: false, mobileScrollSupport: false,
      showPageCorners: false,
    });
    const pages = Array.from({ length: pageCount }, (_, index) => {
      // RTL editions reverse the leaves without mirroring the page artwork.
      const page = isRtl ? pageCount - index : index + 1;
      const element = document.createElement("div");
      element.className = "flipbook-page";
      element.setAttribute("role", "group");
      element.setAttribute("aria-label", `Sayfa ${page}`);
      element.setAttribute("aria-hidden", "true");
      const image = document.createElement("img");
      image.alt = `${edition.imageLabel}, ${page}. sayfa`;
      image.width = width;
      image.height = height;
      image.draggable = false;
      image.decoding = "async";
      image.addEventListener("load", () => element.classList.add("is-loaded"));
      image.addEventListener("error", () => element.classList.add("has-error"));
      const fallback = document.createElement("div");
      fallback.className = "flipbook-page-fallback";
      const message = document.createElement("span");
      message.textContent = `${page}. sayfa yükleniyor…`;
      const link = document.createElement("a");
      link.href = `${bookPdfHref(edition)}#page=${page}`;
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
        if (!image.hasAttribute("src")) image.src = bookPageImage(edition, isRtl ? pageCount - i : i + 1);
      }
      // A long book should only retain nearby decoded images in its DOM.
      pages.forEach((element, i) => {
        if (Math.abs(i - index) <= 6) return;
        const image = element.querySelector("img")!;
        if (image.hasAttribute("src")) {
          image.removeAttribute("src");
          element.classList.remove("is-loaded", "has-error");
        }
      });
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
      const page = isRtl ? pageCount - index : index + 1;
      if (wasSpread && mode === "portrait" && page !== visiblePage) {
        book.turnToPage(isRtl ? pageCount - visiblePage : visiblePage - 1);
        return;
      }
      const spread = mode === "landscape" && (!showCover || index > 0) && index < pageCount - 1;
      loadNearby(index);
      pages.forEach((element, i) => element.setAttribute("aria-hidden", String(i !== index && !(spread && i === index + 1))));
      host.dataset.cover = !spread && book.getOrientation() === "landscape" ? (index === 0 ? "front" : "back") : "none";
      host.style.setProperty("--flipbook-page-width", `${book.getBoundsRect().pageWidth}px`);
      visiblePage = isRtl ? page - (spread ? 1 : 0) : page;
      callbacks.current.onPageChange(visiblePage, spread);
    };
    book.on("flip", syncPage);
    book.on("init", syncPage);
    book.on("changeOrientation", syncPage);
    book.on("changeState", ({ data }) => {
      if (!disposed) callbacks.current.onTurningChange(data === "flipping" || data === "user_fold");
    });
    loadNearby(isRtl ? pageCount - initialPageRef.current : initialPageRef.current - 1);
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
      const turn = flipbookGesture({ x: completed.x, y: completed.y }, { x: event.clientX, y: event.clientY }, completed.bounds, performance.now() - completed.startedAt, direction);
      const corner = completed.y < completed.bounds.top + completed.bounds.height / 2 ? "top" : "bottom";
      if (turn === "next") { if (isRtl) book.flipPrev(corner); else book.flipNext(corner); }
      else if (turn === "previous") { if (isRtl) book.flipNext(corner); else book.flipPrev(corner); }
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
  }, [edition, pageCount, width, height, direction, isRtl]);

  return <div className="flipbook-stage" ref={stageRef} aria-label={`${edition.title} sayfa çevirme kitabı`} title={isRtl ? "Sonraki sayfa için sol kenara dokunun veya sayfayı sağa sürükleyin" : "Sonraki sayfa için sağ kenara dokunun veya sayfayı sola sürükleyin"} />;
});

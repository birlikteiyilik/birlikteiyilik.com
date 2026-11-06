import type { ProgramBlock } from "./program-text";

export type ProgramTopicBlocks = { number: number; title: string; blocks: ProgramBlock[] };
export type ProgramPages = {
  /** Each leaf's body content, already split to fit one page. */
  pages: HTMLElement[][];
  /** Topic number shown on each leaf (index 0 is page 1). */
  pageTopics: number[];
  /** First page of each topic, by topic number. */
  topicStarts: Map<number, number>;
};

/** Pages are measured at this width; leaf type sizes use container units, so the split holds at every size. */
const measureWidth = 600;
export const programLeafRatio = 1754 / 1240;

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

/** Plain text with any web addresses turned into links that open in a new tab. */
function linkedText(element: HTMLElement, text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  parts.forEach((part, index) => {
    if (index % 2 === 0) { if (part) element.append(part); return; }
    const href = part.replace(/[).,;]+$/, "");
    const anchor = node("a", "program-inline-link", href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""));
    anchor.href = href; anchor.target = "_blank"; anchor.rel = "noopener noreferrer";
    element.append(anchor, part.slice(href.length));
  });
  return element;
}

function renderBlock(block: ProgramBlock): HTMLElement {
  switch (block.kind) {
    case "title": {
      const title = node("h2", "program-title");
      title.append(node("span", "program-title-number", `Konu ${block.number}`), node("span", "", block.text));
      return title;
    }
    case "activities": {
      const box = node("div", "program-activities");
      box.append(node("span", "program-activities-label", block.links.length > 1 ? "Etkinlikler" : "Etkinlik"));
      block.links.forEach((link) => {
        const anchor = node("a", "", `${link.label} ↗`);
        anchor.href = link.href; anchor.target = "_blank"; anchor.rel = "noopener noreferrer";
        anchor.setAttribute("aria-label", `${link.label} Wordwall etkinliği (yeni sekmede açılır)`);
        box.append(anchor);
      });
      return box;
    }
    case "quote": return linkedText(node("blockquote", "program-quote"), block.text);
    case "heading": return node("h3", "program-heading", block.text);
    case "paragraph": return linkedText(node("p"), block.text);
    case "list": {
      const list = node("ul");
      block.items.forEach((item) => list.append(linkedText(node("li"), item)));
      return list;
    }
    case "verse": {
      const verse = node("div", "program-verse");
      block.lines.forEach((line) => verse.append(node("p", "", line)));
      return verse;
    }
  }
}

/** "large" sets bigger type for phone screens, where a leaf is only about 360 pixels wide. */
export type ProgramType = "regular" | "large";

export function programLeafShell(header: [string, string], footer: string, type: ProgramType = "regular") {
  const leaf = node("div", `text-leaf program-leaf is-${type}`);
  const top = node("header", "text-leaf-header");
  top.append(node("span", "", header[0]), node("span", "program-leaf-topic", header[1]));
  const body = node("div", "text-leaf-body program-leaf-body");
  leaf.append(top, body, node("footer", "text-leaf-footer", footer));
  return { leaf, body };
}

/**
 * Lays the topics out on fixed-size leaves, each topic starting on a new leaf. Long paragraphs,
 * lists and poems continue on the next leaf; a heading never stays alone at the foot of a page.
 */
export function paginateProgram(topics: ProgramTopicBlocks[], type: ProgramType = "regular"): ProgramPages {
  const frame = node("div", "flipbook-page is-text program-measure");
  Object.assign(frame.style, { position: "fixed", left: "-10000px", top: "0", width: `${measureWidth}px`, height: `${measureWidth * programLeafRatio}px`, visibility: "hidden", pointerEvents: "none" });
  const { leaf, body } = programLeafShell(["Yaş", "Konu"], "1", type);
  frame.append(leaf);
  document.body.append(frame);

  const pages: HTMLElement[][] = [];
  const pageTopics: number[] = [];
  const topicStarts = new Map<number, number>();
  let current: HTMLElement[] = [];
  let topic = 0;
  const fits = () => body.scrollHeight <= body.clientHeight;
  const closePage = () => {
    if (!current.length) return;
    pages.push(current); pageTopics.push(topic);
    current = []; body.replaceChildren();
  };
  /** Starts a new leaf, taking along a heading that would otherwise end the old one. */
  const turn = () => {
    const carried: HTMLElement[] = [];
    while (current.length && /^H[23]$/.test(current.at(-1)!.tagName)) carried.unshift(current.pop()!);
    if (!current.length) { current = carried; return; }
    closePage();
    carried.forEach((element) => { body.append(element); current.push(element); });
  };
  const onlyHeadings = () => current.every((element) => /^H[23]$/.test(element.tagName));
  const add = (element: HTMLElement) => { body.append(element); current.push(element); };
  const tryAdd = (element: HTMLElement) => { body.append(element); if (fits()) { current.push(element); return true; } element.remove(); return false; };

  const placeWords = (block: Extract<ProgramBlock, { kind: "paragraph" | "quote" }>) => {
    let words = block.text.split(" ");
    while (words.length) {
      const whole = renderBlock({ ...block, text: words.join(" ") });
      if (tryAdd(whole)) return;
      // The largest leading run of words that still fits on this page.
      let low = 0, high = words.length - 1;
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        const part = renderBlock({ ...block, text: words.slice(0, middle).join(" ") });
        body.append(part);
        const ok = fits();
        part.remove();
        if (ok) low = middle; else high = middle - 1;
      }
      if (low < 6 || words.length - low < 4) {
        // A fresh leaf (or one holding only headings) takes whatever fits rather than turning again.
        if (onlyHeadings()) {
          if (low < 1) { add(whole); return; }
        } else { turn(); continue; }
      }
      const part = renderBlock({ ...block, text: words.slice(0, low).join(" ") });
      part.classList.add("continues");
      add(part);
      closePage();
      words = words.slice(low);
    }
  };
  const placeLines = (block: Extract<ProgramBlock, { kind: "list" | "verse" }>) => {
    let rest = block.kind === "list" ? block.items : block.lines;
    while (rest.length) {
      if (tryAdd(renderBlock(block.kind === "list" ? { kind: "list", items: rest } : { kind: "verse", lines: rest }))) return;
      let count = 0;
      while (count < rest.length) {
        const part = renderBlock(block.kind === "list" ? { kind: "list", items: rest.slice(0, count + 1) } : { kind: "verse", lines: rest.slice(0, count + 1) });
        body.append(part);
        const ok = fits();
        part.remove();
        if (!ok) break;
        count++;
      }
      if (count === 0) {
        if (onlyHeadings()) count = 1; else { turn(); continue; }
      }
      add(renderBlock(block.kind === "list" ? { kind: "list", items: rest.slice(0, count) } : { kind: "verse", lines: rest.slice(0, count) }));
      closePage();
      rest = rest.slice(count);
    }
  };

  try {
    for (const item of topics) {
      closePage();
      topic = item.number;
      topicStarts.set(item.number, pages.length + 1);
      for (const block of item.blocks) {
        if (block.kind === "paragraph" || block.kind === "quote") placeWords(block);
        else if (block.kind === "list" || block.kind === "verse") placeLines(block);
        else {
          const element = renderBlock(block);
          if (!tryAdd(element)) { turn(); add(element); }
        }
      }
    }
    closePage();
  } finally {
    frame.remove();
  }
  return { pages, pageTopics, topicStarts };
}

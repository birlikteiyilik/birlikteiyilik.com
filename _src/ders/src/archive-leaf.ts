import { readingBlocks } from "./native-curriculum.ts";
import { pageHeading } from "./archive-weeks.ts";
import type { ArchivePage } from "./lesson-guide.ts";

/** Longer source pages use a smaller type step so a whole page fits on one leaf. */
export function leafDensity(text: string) {
  const length = text.replace(/\s+/g, " ").trim().length;
  return length < 900 ? "roomy" : length < 1500 ? "regular" : length < 2200 ? "compact" : "dense";
}

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function renderArchiveLeaf(page: ArchivePage, label: string, position: number, total: number) {
  const leaf = node("div", "text-leaf");
  const header = node("header", "text-leaf-header");
  header.append(node("span", "", label), node("span", "", `Sayfa ${page.number}`));
  const body = node("div", `text-leaf-body is-${leafDensity(page.text)}`);
  let text = page.text;
  const heading = pageHeading(text);
  if (heading) {
    body.append(node("h2", "text-leaf-title", heading));
    // Drop the source title line (and a lone "Konu:" label before it); the heading replaces them.
    const lines = text.split("\n");
    let index = lines.findIndex((line) => line.trim());
    if (/^konu\s*[:.]?\s*$/i.test(lines[index].trim())) index = lines.findIndex((line, i) => i > index && line.trim());
    text = lines.slice(index + 1).join("\n");
  }
  for (const block of readingBlocks(text)) {
    if (block.kind === "list") {
      const list = node("ul");
      block.items.forEach((item) => list.append(node("li", "", item)));
      body.append(list);
    } else body.append(node(block.kind === "heading" ? "h3" : "p", "", block.text));
  }
  const footer = node("footer", "text-leaf-footer", `${position} / ${total}`);
  leaf.append(header, body, footer);
  return leaf;
}

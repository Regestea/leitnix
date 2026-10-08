/**
 * Detects a Markdown document that rendered to nothing.
 *
 * The parse tree cannot answer this. A components map can drop a block's
 * children and still return a perfectly valid element - a renderer that looks
 * correct and emits an empty `<p>` - and the hast tree it was given still has
 * the text in it. The only honest signal is the DOM that came out, so this
 * measures the mounted element.
 */

/** The smallest surface the measurement needs, so it can be exercised without
 *  a DOM. */
export interface Measurable {
  textContent: string | null;
  querySelector(selectors: string): unknown;
}

/** Content a reader can see even when there is no text at all: a picture, a
 *  rendered Mermaid diagram, an embed, a table, a code frame. Without this a
 *  card holding only an image would look blank and be "rescued" by the
 *  source fallback. */
const VISUAL_CONTENT = "img, svg, iframe, table, canvas, video, pre, code";

export function isBlankDocument(host: Measurable | null): boolean {
  // No element yet: the ref also fires with null on unmount, and reading that
  // as "blank" would flip the fallback on and then off again in a loop.
  if (!host) return false;
  if ((host.textContent ?? "").trim().length > 0) return false;
  return host.querySelector(VISUAL_CONTENT) === null;
}
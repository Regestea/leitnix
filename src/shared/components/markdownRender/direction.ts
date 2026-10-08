/**
 * Text direction heuristics for rendered Markdown blocks.
 *
 * Direction follows the DOMINANT language of the block, counted per WORD
 * rather than per letter so a long Latin token ("TypeScript" = 10 letters)
 * can't drown out several short Persian words ("از", "در", "با"):
 *   "استفاده از useEffect در React با TypeScript" -> rtl  (4 fa vs 3 en words)
 *   "useEffect برای همگام‌سازی..."               -> rtl  (7 fa vs 1 en words)
 *   "1- hello world"                              -> ltr  (0 fa vs 2 en words)
 * Digits, spaces and punctuation are neutral and don't vote.
 *
 * Pure text analysis - no DOM - so the renderer and the AI-translation prompt
 * builder share one implementation.
 */

/** A resolved text direction. `undefined` means "no opinion", so the
 *  surrounding page default applies (e.g. a block holding only an image). */
export type TextDir = "rtl" | "ltr" | undefined;

export function isRtlCodePoint(cp: number): boolean {
  return (
    (cp >= 0x0590 && cp <= 0x05ff) || // Hebrew
    (cp >= 0x0600 && cp <= 0x06ff) || // Arabic
    (cp >= 0x0750 && cp <= 0x077f) || // Arabic Supplement
    (cp >= 0xfb50 && cp <= 0xfdff) || // Arabic Presentation Forms-A
    (cp >= 0xfe70 && cp <= 0xfeff) // Arabic Presentation Forms-B
  );
}

export function isArabicDigit(cp: number): boolean {
  return (
    (cp >= 0x0660 && cp <= 0x0669) || // Arabic-Indic digits 0-9
    (cp >= 0x06f0 && cp <= 0x06f9) // Extended Arabic-Indic (Persian) digits
  );
}

/** Direction contributed by a single whitespace-delimited word, or
 *  `undefined` when the word is neutral (digits/punctuation only). */
export function classifyWord(word: string): "rtl" | "ltr" | undefined {
  for (const ch of word) {
    const cp = ch.codePointAt(0) ?? 0;
    if (isArabicDigit(cp)) continue;
    if (isRtlCodePoint(cp)) return "rtl";
    if (/[a-zA-Z]/.test(ch)) return "ltr";
  }
  return undefined;
}

/**
 * Direction of one block of text: `"rtl"`, `"ltr"`, or `undefined` when
 * there is nothing to judge (the page default then applies, which matters for
 * a block whose only content is an image).
 *
 * The leading-character rule matters: a paragraph that opens with a Persian or
 * Arabic digit is conventionally Persian and aligns right regardless of what
 * follows. Digits-and-punctuation-only text resolves to `"ltr"`, matching
 * Unicode's own base-direction resolution for a paragraph with no strong
 * character - which is what puts an ordered list of decimals on the left
 * rather than mirroring it inside a Persian card.
 */
export function getTextDir(text: string): TextDir {
  const lead = text.trim();
  if (!lead) return undefined;
  const leadCp = lead.codePointAt(0) ?? 0;
  if (isArabicDigit(leadCp)) return "rtl";
  if (isRtlCodePoint(leadCp)) return "rtl";

  let rtlWords = 0;
  let ltrWords = 0;
  for (const raw of text.split(/\s+/)) {
    if (!raw) continue;
    const cls = classifyWord(raw);
    if (cls === "rtl") rtlWords++;
    else if (cls === "ltr") ltrWords++;
  }

  if (rtlWords > ltrWords) return "rtl";
  if (ltrWords > rtlWords) return "ltr";

  // Equal word counts (or none): decide by the first strong letter, so a
  // sentence that opens with a Latin token inside Persian text still lands on
  // the side its majority of letters imply.
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (isArabicDigit(cp)) continue;
    if (isRtlCodePoint(cp)) return "rtl";
    if (/[a-zA-Z]/.test(ch)) return "ltr";
  }
  return "ltr";
}

/** The CSS text-alignment that goes with a direction. */
export function textAlignForDir(dir: TextDir): "right" | "left" | undefined {
  return dir === "rtl" ? "right" : dir === "ltr" ? "left" : undefined;
}
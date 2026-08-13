import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLanguage, faVolumeHigh, faStop } from "@fortawesome/free-solid-svg-icons";
import MarkdownTable from "../markdownTable/MarkdownTable";
import MermaidDiagram from "../MermaidDiagram";
import { translationService } from "../../../services/translationService";
import { textToSpeechService } from "../../../services/textToSpeechService";
import { LANGUAGES } from "../../../shared/constants/languages";
import { useSettingStore } from "../../../stores/settingStore";
import styles from "./MarkdownRender.module.css";

// RTL helper
function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    if (props.children) return extractText(props.children);
  }
  return "";
}

function isRtlCodePoint(cp: number): boolean {
  return (
    (cp >= 0x0590 && cp <= 0x05ff) || // Hebrew
    (cp >= 0x0600 && cp <= 0x06ff) || // Arabic
    (cp >= 0x0750 && cp <= 0x077f) || // Arabic Supplement
    (cp >= 0xfb50 && cp <= 0xfdff) || // Arabic Presentation Forms-A
    (cp >= 0xfe70 && cp <= 0xfeff) // Arabic Presentation Forms-B
  );
}

function isArabicDigit(cp: number): boolean {
  return (
    (cp >= 0x0660 && cp <= 0x0669) || // Arabic-Indic digits ٠-٩
    (cp >= 0x06f0 && cp <= 0x06f9) // Extended Arabic-Indic (Persian) digits ۰-۹
  );
}

// Direction is decided by the DOMINANT language of the prose, counted per WORD
// rather than per letter. Counting per letter lets one long Latin token
// (e.g. "TypeScript" = 10 letters) drown out several short Persian function
// words ("از", "در", "با"). Counting per word treats the sentence as Persian
// as long as Persian/Arabic words make up the majority of the prose:
//   "استفاده از useEffect در React با TypeScript" -> rtl  (4 fa vs 3 en words)
//   "useEffect برای همگام‌سازی..."               -> rtl  (7 fa vs 1 en words)
//   "1- hello world"                              -> ltr  (0 fa vs 2 en words)
// Digits, spaces, punctuation and markdown markers are neutral and don't vote.
function classifyWord(word: string): "rtl" | "ltr" | undefined {
  for (const ch of word) {
    const cp = ch.codePointAt(0) ?? 0;
    if (isArabicDigit(cp)) continue; // Arabic/Persian digits are neutral
    if (isRtlCodePoint(cp)) return "rtl";
    if (/[a-zA-Z]/.test(ch)) return "ltr";
  }
  return undefined; // only digits/symbols -> neutral
}

function getDir(node: React.ReactNode): "rtl" | "ltr" | undefined {
  const text = extractText(node);
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

  // Equal or no words: decide by first strong letter (start with Persian -> rtl)
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (isArabicDigit(cp)) continue;
    if (isRtlCodePoint(cp)) return "rtl";
    if (/[a-zA-Z]/.test(ch)) return "ltr";
  }
  return undefined;
}

function dirProps(children: React.ReactNode): {
  dir?: "rtl" | "ltr";
  style?: React.CSSProperties;
} {
  const dir = getDir(children);
  return {
    dir,
    style: dir === "rtl" ? { textAlign: "right" } : undefined,
  };
}

function preserveCode(input: string): { text: string; snippets: string[] } {
  const snippets: string[] = [];
  let idx = 0;
  const text = input.replace(
    /(```[\s\S]*?```|`[^`\n]+`)/g,
    (match) => {
      const placeholder = `@@CODE_${idx}@@`;
      snippets.push(match);
      idx++;
      return placeholder;
    },
  );
  return { text, snippets };
}

function restoreCode(translated: string, snippets: string[]): string {
  let idx = 0;
  return translated.replace(/@@CODE_\d+@@/g, () => snippets[idx++] ?? "");
}

function stripMarkdown(text: string): string {
  const { text: clean, snippets } = preserveCode(text);
  const stripped = clean
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`[^`\n]+`/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^[-*_]{3,}\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return restoreCode(stripped, snippets);
}

function SectionTtsBadge({ mdContent, langHint }: { mdContent: string; langHint?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    if (isPlaying) {
      await textToSpeechService.stop();
      setIsPlaying(false);
      return;
    }
    const plain = stripMarkdown(mdContent);
    const lang = langHint ?? await translationService.detectLanguageAsync(plain);
    setIsPlaying(true);
    await textToSpeechService.speak({ text: plain, lang });
    setIsPlaying(false);
  }

  return (
    <button
      type="button"
      className={`${styles.sectionTtsBadge}${isPlaying ? ` ${styles.ttsButtonActive}` : ""}`}
      onClick={handleClick}
    >
      <FontAwesomeIcon icon={isPlaying ? faStop : faVolumeHigh} />
    </button>
  );
}

function SectionContent({
  children,
  tag: Tag,
  className,
  targetLang,
  translated,
  showControl,
  showReadBadge,
}: {
  children?: React.ReactNode;
  tag: React.ElementType;
  className?: string;
  targetLang: string;
  translated: string | null;
  showControl: boolean;
  showReadBadge: boolean;
}) {
  const text = extractText(children);
  const [secTranslated, setSecTranslated] = useState<string | null>(null);
  const [secTranslating, setSecTranslating] = useState(false);

  async function handleSecTranslate(e: React.MouseEvent) {
    e.preventDefault();
    if (secTranslated) { setSecTranslated(null); return; }
    setSecTranslating(true);
    try {
      const { text: clean, snippets } = preserveCode(text);
      const result = await translationService.translateAsync(clean, targetLang);
      setSecTranslated(restoreCode(result.translatedText, snippets));
    } catch { console.error("Section translation failed"); }
    finally { setSecTranslating(false); }
  }

  return (
    <Tag className={className} {...dirProps(secTranslated ?? children)}>
      {secTranslated ?? children}
      {text && showReadBadge && <SectionTtsBadge mdContent={text} langHint={secTranslated ? targetLang : undefined} />}
      {!translated && showControl && text && (
        <button
          type="button"
          className={`${styles.sectionTranslateBadge}${secTranslating ? ` ${styles.ttsButtonActive}` : ""}`}
          onClick={handleSecTranslate}
          disabled={secTranslating}
        >
          <FontAwesomeIcon icon={faLanguage} />
        </button>
      )}
    </Tag>
  );
}

export default function MarkdownRender({ markdown, isShowTranslationControl: propShowTranslation, isShowReadBadge: propShowReadBadge, isDisableGlobalTranslate }: { markdown: string; isShowTranslationControl?: boolean; isShowReadBadge?: boolean; isDisableGlobalTranslate?: boolean }) {
  const { isShowTranslationControl: storeShowTranslation, defaultTranslationTarget, readAloudBadge } = useSettingStore();
  const showControl = propShowTranslation ?? storeShowTranslation;
  const showReadBadge = propShowReadBadge ?? readAloudBadge;
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState(defaultTranslationTarget);
  async function handleTranslate() {
    if (translated) {
      setTranslated(null);
      return;
    }
    setTranslating(true);
    try {
      const { text, snippets } = preserveCode(markdown);
      const result = await translationService.translateAsync(text, targetLang);
      setTranslated(restoreCode(result.translatedText, snippets));
    } catch {
      console.error("Translation failed");
    } finally {
      setTranslating(false);
    }
  }

  const content = translated ?? markdown;

  return (
    <>
      {showControl && !isDisableGlobalTranslate && (
        <div className={styles.translateBar}>
          <button
            className={styles.translateButton}
            onClick={handleTranslate}
            disabled={translating}
          >
            <FontAwesomeIcon icon={faLanguage} />
            {translating ? " Translating..." : translated ? " Show Original" : " Translate"}
          </button>
          <select
            className={styles.langSelect}
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            disabled={translating}
          >
            {LANGUAGES.map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
      )}
      <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeKatex]}
      components={{
        input(props) {
          // react-markdown may inject a `node` (hast) prop when `passNode` is on;
          // strip it so it never reaches the DOM <input> (GFM task-list checkboxes).
          // `ref` is reserved by React and never appears in `props`, so no need to
          // pull it out here.
          const { node, ...rest } = props as { node?: unknown } & Record<
            string,
            unknown
          >;
          void node;
          return <input {...rest} />;
        },
        p: (props) => <SectionContent {...props} tag="p" targetLang={targetLang} translated={translated} showControl={showControl} showReadBadge={showReadBadge} />,
        h1: (props) => <SectionContent {...props} tag="h1" className={styles.heading} targetLang={targetLang} translated={translated} showControl={showControl} showReadBadge={showReadBadge} />,
        h2: (props) => <SectionContent {...props} tag="h2" className={styles.heading} targetLang={targetLang} translated={translated} showControl={showControl} showReadBadge={showReadBadge} />,
        h3: (props) => <SectionContent {...props} tag="h3" className={styles.heading} targetLang={targetLang} translated={translated} showControl={showControl} showReadBadge={showReadBadge} />,
        h4: (props) => <SectionContent {...props} tag="h4" className={styles.heading} targetLang={targetLang} translated={translated} showControl={showControl} showReadBadge={showReadBadge} />,
        ul({ children }) {
          return <ul {...dirProps(children)}>{children}</ul>;
        },
        ol({ children }) {
          return <ol {...dirProps(children)}>{children}</ol>;
        },
        li: (props) => <SectionContent {...props} tag="li" className={styles.listItem} targetLang={targetLang} translated={translated} showControl={showControl} showReadBadge={showReadBadge} />,
        strong({ children }) {
          return <strong className={styles.strong}>{children}</strong>;
        },
        blockquote({ children }) {
          return <blockquote {...dirProps(children)}>{children}</blockquote>;
        },
        table: MarkdownTable,
        td: (props) => <SectionContent {...props} tag="td" targetLang={targetLang} translated={translated} showControl={showControl} showReadBadge={showReadBadge} />,
        th: (props) => <SectionContent {...props} tag="th" targetLang={targetLang} translated={translated} showControl={showControl} showReadBadge={showReadBadge} />,
        iframe({ ...props }) {
          return (
            <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", margin: "1rem 0" }}>
              <iframe
                {...props}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                  borderRadius: "0.75rem",
                }}
                allowFullScreen
              />
            </div>
          );
        },
        code({ className, children }) {
          const match = /language-(\w+)/.exec(className || "");
          if (match?.[1] === "mermaid") {
            return <MermaidDiagram chart={String(children).trim()} />;
          }
          return match ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
              className={styles.markdownCodeBlock}
              customStyle={{ margin: 0 }}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code className={styles.markdownInlineCode}>{children}</code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
    </>
  );
}
import React, { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLanguage, faVolumeHigh, faStop } from "@fortawesome/free-solid-svg-icons";
import MarkdownTable from "./MarkdownTable";
import MermaidDiagram from "./MermaidDiagram";
import { translationService } from "../../services/translationService";
import { textToSpeechService } from "../../services/textToSpeechService";
import { LANGUAGES } from "../../shared/constants/languages";
import { useSettingStore } from "../../features/settings/store/settingStore";
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

interface Section {
  level: number;
  text: string;
}

function extractSections(md: string): Section[] {
  const sections: Section[] = [];
  const regex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(md)) !== null) {
    sections.push({ level: match[1].length, text: match[2] });
  }
  return sections;
}

function getSectionContent(md: string, index: number): string {
  const lines = md.split("\n");
  let headingCount = -1;
  let start = 0;
  let end = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const headingMatch = lines[i].match(/^(#{1,6})\s+.+$/);
    if (headingMatch) {
      headingCount++;
      if (headingCount === index) {
        start = i;
      } else if (headingCount === index + 1) {
        end = i;
        break;
      }
    }
  }

  return lines.slice(start, end).join("\n");
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

export default function MarkdownRender({ markdown, isShowTranslationControl: propShowTranslation }: { markdown: string; isShowTranslationControl?: boolean }) {
  const { isShowTranslationControl: storeShowTranslation, defaultTranslationTarget } = useSettingStore();
  const showControl = propShowTranslation ?? storeShowTranslation;
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
  const sections = useMemo(() => extractSections(content), [content]);
  const sectionContents = useMemo(
    () => sections.map((_, i) => getSectionContent(content, i)),
    [content, sections],
  );
  const sectionIndexRef = useRef(0);

  const langLabel = LANGUAGES.find(([c]) => c === targetLang)?.[1] ?? targetLang;
  sectionIndexRef.current = 0;

  function headingWithBadge(children: React.ReactNode) {
    const idx = sectionIndexRef.current;
    sectionIndexRef.current += 1;
    const mdContent = sectionContents[idx];
    return (
      <>
        {children}
        {mdContent && <SectionTtsBadge mdContent={mdContent} langHint={translated ? targetLang : undefined} />}
      </>
    );
  }

  return (
    <>
      {showControl && (
        <div className={styles.translateBar}>
          <button
            className={styles.translateButton}
            onClick={handleTranslate}
            disabled={translating}
          >
            <FontAwesomeIcon icon={faLanguage} />
            {translating ? " Translating..." : translated ? " Show Original" : ` Translate to ${langLabel}`}
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
        p({ children }) {
          return <p {...dirProps(children)}>{children}</p>;
        },
        h1({ children }) {
          return <h1 className={styles.heading} {...dirProps(children)}>{headingWithBadge(children)}</h1>;
        },
        h2({ children }) {
          return <h2 className={styles.heading} {...dirProps(children)}>{headingWithBadge(children)}</h2>;
        },
        h3({ children }) {
          return <h3 className={styles.heading} {...dirProps(children)}>{headingWithBadge(children)}</h3>;
        },
        h4({ children }) {
          return <h4 className={styles.heading} {...dirProps(children)}>{headingWithBadge(children)}</h4>;
        },
        ul({ children }) {
          return <ul {...dirProps(children)}>{children}</ul>;
        },
        ol({ children }) {
          return <ol {...dirProps(children)}>{children}</ol>;
        },
        li({ children }) {
          return <li className={styles.listItem} {...dirProps(children)}>{children}</li>;
        },
        strong({ children }) {
          return <strong className={styles.strong}>{children}</strong>;
        },
        blockquote({ children }) {
          return <blockquote {...dirProps(children)}>{children}</blockquote>;
        },
        table: MarkdownTable,
        td({ children }) {
          return <td {...dirProps(children)}>{children}</td>;
        },
        th({ children }) {
          return <th {...dirProps(children)}>{children}</th>;
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
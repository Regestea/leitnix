import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLanguage } from "@fortawesome/free-solid-svg-icons";
import MarkdownTable from "./MarkdownTable";
import MermaidDiagram from "./MermaidDiagram";
import { translationService } from "../../services/translationService";
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

const LANGUAGES: [string, string][] = [
  ["af", "Afrikaans"], ["sq", "Albanian"], ["am", "Amharic"], ["ar", "Arabic"],
  ["hy", "Armenian"], ["az", "Azerbaijani"], ["eu", "Basque"], ["be", "Belarusian"],
  ["bn", "Bengali"], ["bs", "Bosnian"], ["bg", "Bulgarian"], ["ca", "Catalan"],
  ["ceb", "Cebuano"], ["ny", "Chichewa"], ["zh-CN", "Chinese (Simplified)"],
  ["zh-TW", "Chinese (Traditional)"], ["co", "Corsican"], ["hr", "Croatian"],
  ["cs", "Czech"], ["da", "Danish"], ["nl", "Dutch"], ["en", "English"],
  ["eo", "Esperanto"], ["et", "Estonian"], ["tl", "Filipino"], ["fi", "Finnish"],
  ["fr", "French"], ["fy", "Frisian"], ["gl", "Galician"], ["ka", "Georgian"],
  ["de", "German"], ["el", "Greek"], ["gu", "Gujarati"], ["ht", "Haitian Creole"],
  ["ha", "Hausa"], ["haw", "Hawaiian"], ["iw", "Hebrew"], ["hi", "Hindi"],
  ["hmn", "Hmong"], ["hu", "Hungarian"], ["is", "Icelandic"], ["ig", "Igbo"],
  ["id", "Indonesian"], ["ga", "Irish"], ["it", "Italian"], ["ja", "Japanese"],
  ["jw", "Javanese"], ["kn", "Kannada"], ["kk", "Kazakh"], ["km", "Khmer"],
  ["rw", "Kinyarwanda"], ["ko", "Korean"], ["ku", "Kurdish (Kurmanji)"],
  ["ky", "Kyrgyz"], ["lo", "Lao"], ["la", "Latin"], ["lv", "Latvian"],
  ["lt", "Lithuanian"], ["lb", "Luxembourgish"], ["mk", "Macedonian"],
  ["mg", "Malagasy"], ["ms", "Malay"], ["ml", "Malayalam"], ["mt", "Maltese"],
  ["mi", "Maori"], ["mr", "Marathi"], ["mn", "Mongolian"], ["my", "Myanmar (Burmese)"],
  ["ne", "Nepali"], ["no", "Norwegian"], ["or", "Odia (Oriya)"], ["ps", "Pashto"],
  ["fa", "Persian"], ["pl", "Polish"], ["pt", "Portuguese"], ["pa", "Punjabi"],
  ["ro", "Romanian"], ["ru", "Russian"], ["sm", "Samoan"], ["gd", "Scots Gaelic"],
  ["sr", "Serbian"], ["st", "Sesotho"], ["sn", "Shona"], ["sd", "Sindhi"],
  ["si", "Sinhala"], ["sk", "Slovak"], ["sl", "Slovenian"], ["so", "Somali"],
  ["es", "Spanish"], ["su", "Sundanese"], ["sw", "Swahili"], ["sv", "Swedish"],
  ["tg", "Tajik"], ["ta", "Tamil"], ["tt", "Tatar"], ["te", "Telugu"],
  ["th", "Thai"], ["tr", "Turkish"], ["tk", "Turkmen"], ["uk", "Ukrainian"],
  ["ur", "Urdu"], ["ug", "Uyghur"], ["uz", "Uzbek"], ["vi", "Vietnamese"],
  ["cy", "Welsh"], ["xh", "Xhosa"], ["yi", "Yiddish"], ["yo", "Yoruba"],
  ["zu", "Zulu"],
];

export default function MarkdownRender({ markdown, isShowTranslationControl = false }: { markdown: string; isShowTranslationControl?: boolean }) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState("fa");

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

  const langLabel = LANGUAGES.find(([c]) => c === targetLang)?.[1] ?? targetLang;
  const content = translated ?? markdown;

  return (
    <>
      {isShowTranslationControl && (
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
          return <h1 className={styles.heading} {...dirProps(children)}>{children}</h1>;
        },
        h2({ children }) {
          return <h2 className={styles.heading} {...dirProps(children)}>{children}</h2>;
        },
        h3({ children }) {
          return <h3 className={styles.heading} {...dirProps(children)}>{children}</h3>;
        },
        h4({ children }) {
          return <h4 className={styles.heading} {...dirProps(children)}>{children}</h4>;
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
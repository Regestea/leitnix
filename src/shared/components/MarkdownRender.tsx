import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import MarkdownTable from "./MarkdownTable";
import MermaidDiagram from "./MermaidDiagram";
import "./MarkdownRender.css";

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
    if (isArabicDigit(cp)) continue; // اعداد عربی/فارسی خنثی هستند
    if (isRtlCodePoint(cp)) return "rtl";
    if (/[a-zA-Z]/.test(ch)) return "ltr";
  }
  return undefined; // فقط ارقام/علائم -> خنثی
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

  // مساوی یا بدون کلمه: تصمیم بر اساس اولین حرف قوی (شروع با فارسی -> rtl)
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

export default function MarkdownRender({ markdown }: { markdown: string }) {
  return (
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
          return <h1 {...dirProps(children)}>{children}</h1>;
        },
        h2({ children }) {
          return <h2 {...dirProps(children)}>{children}</h2>;
        },
        h3({ children }) {
          return <h3 {...dirProps(children)}>{children}</h3>;
        },
        h4({ children }) {
          return <h4 {...dirProps(children)}>{children}</h4>;
        },
        ul({ children }) {
          return <ul {...dirProps(children)}>{children}</ul>;
        },
        ol({ children }) {
          return <ol {...dirProps(children)}>{children}</ol>;
        },
        li({ children }) {
          return <li {...dirProps(children)}>{children}</li>;
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
              className="markdown-code-block"
              customStyle={{ margin: 0 }}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code className="markdown-inline-code">{children}</code>
          );
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
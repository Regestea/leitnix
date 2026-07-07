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

// First-strong-character detection (same idea as the browser's `dir="auto"`):
// skip digits, spaces, punctuation and markdown markers (e.g. the "1-" prefix),
// then let the FIRST actual letter decide the direction.
//   "1- جمله فارسی" -> rtl   |   "1- hello" -> ltr
function getDir(node: React.ReactNode): "rtl" | "ltr" | undefined {
  const text = extractText(node);

  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (isArabicDigit(cp)) continue; // اعداد عربی/فارسی ضعیف هستند
    if (isRtlCodePoint(cp)) return "rtl";
    if (/[a-zA-Z]/.test(ch)) return "ltr";
    // ارقام لاتین، فاصله‌ها، علائم نگارشی و نشانه‌های مارک‌داون نادیده گرفته می‌شن
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
        input({ node, ...props }) {
          const { ref: _ref, ...rest } = props as Record<string, unknown>;
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
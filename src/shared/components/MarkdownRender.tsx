import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
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

function getDir(node: React.ReactNode): "rtl" | "ltr" | undefined {
  const text = extractText(node);
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (
      (cp >= 0x0590 && cp <= 0x05ff) || // Hebrew
      (cp >= 0x0600 && cp <= 0x06ff) || // Arabic / Persian
      (cp >= 0x0750 && cp <= 0x077f) || // Arabic Supplement
      (cp >= 0xfb50 && cp <= 0xfdff) || // Arabic Presentation A
      (cp >= 0xfe70 && cp <= 0xfeff)    // Arabic Presentation B
    ) {
      return "rtl";
    }
    if (cp > 0x7e) continue; // skip non-ASCII non-RTL (emoji, CJK…)
    if (/[a-zA-Z0-9]/.test(ch)) return "ltr";
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
        li({ children }) {
          return <li {...dirProps(children)}>{children}</li>;
        },
        blockquote({ children }) {
          return <blockquote {...dirProps(children)}>{children}</blockquote>;
        },
        td({ children }) {
          return <td {...dirProps(children)}>{children}</td>;
        },
        th({ children }) {
          return <th {...dirProps(children)}>{children}</th>;
        },
        code({ className, children }) {
          const match = /language-(\w+)/.exec(className || "");
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
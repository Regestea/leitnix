import React, {
  isValidElement,
  useCallback,
  useMemo,
  useState,
} from "react";
import type { CSSProperties, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLanguage,
  faStop,
  faVolumeHigh,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import MarkdownTable from "../markdownTable/MarkdownTable";
import MermaidDiagram from "./MermaidDiagram";
import { CodeBlock } from "./CodeBlock";
import { REHYPE_LINE_BREAKS_ONLY, REHYPE_SAFE_HTML } from "./rehypeSafeHtml";
import { isBlankDocument } from "./blankDocument";
import { escapeHtmlInMarkdown, textOfChildren } from "./markdownSource";
import { safeUrlTransform } from "./safeUrl";
import { getTextDir, textAlignForDir } from "./direction";
import type { TextDir } from "./direction";
import { translationService } from "../../../services/translationService";
import { translateWithAI } from "../../../services/aiTranslationService";
import { textToSpeechService } from "../../../services/textToSpeechService";
import { LANGUAGES } from "../../../shared/constants/languages";
import { useSettingStore } from "../../../stores/settingStore";
import styles from "./MarkdownRender.module.css";

/** Stable plugin lists: react-markdown re-parses the whole document whenever
 *  a plugin array's identity changes, so these must never be recreated on
 *  every render.
 *
 *  The "no raw HTML" mode still parses the one tag the source escaper spared
 *  (`<br>`), which is how line breaks inside a table cell survive in
 *  AI-written content. */
const REMARK_PLUGINS = [remarkGfm, remarkMath];
const REHYPE_PLUGINS = [...REHYPE_SAFE_HTML, rehypeKatex];
const REHYPE_PLUGINS_NO_RAW = [...REHYPE_LINE_BREAKS_ONLY, rehypeKatex];

/* ---------- RTL helpers ---------- */

function dirProps(node: ReactNode): { dir?: TextDir; style?: CSSProperties } {
  const dir = getTextDir(textOfChildren(node));
  const textAlign = textAlignForDir(dir);
  return {
    ...(dir ? { dir } : {}),
    ...(textAlign ? { style: { textAlign } } : {}),
  };
}

/** True when this subtree contains a KaTeX root.
 *
 *  `rehypeKatex` expands one formula into hundreds of nested spans (`.katex`,
 *  `.base`, `.mord`, `.mrel`, ...). None of them may be given a `dir` or a
 *  `text-align`: KaTeX builds the expression out of inline-blocks and relies on
 *  their natural order, and stamping `text-align` on `.base`/`.mord` re-flows
 *  the symbols and the spacing between them. The failure is subtle because the
 *  formula still *parses* - it just comes out visibly wrong. So a subtree that
 *  contains math is rendered exactly as KaTeX emitted it. */
function hasMath(node: ReactNode): boolean {
  if (Array.isArray(node)) return node.some(hasMath);
  if (!isValidElement(node)) return false;
  const props = node.props as { className?: unknown; children?: ReactNode };
  if (String(props.className ?? "").includes("katex")) return true;
  return hasMath(props.children);
}

/* ---------- Mermaid node helpers ---------- */

interface MdNode {
  type: string;
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: MdNode[];
}

function toMdNode(value: unknown): MdNode | null {
  return value && typeof value === "object" ? (value as MdNode) : null;
}

function mdText(node: MdNode | null): string {
  if (!node) return "";
  if (node.type === "text" || node.type === "raw") return node.value ?? "";
  return (node.children ?? []).map((child) => mdText(child)).join("");
}

function textContent(children: ReactNode): string {
  return Array.isArray(children) ? children.join("") : String(children ?? "");
}

/** A card image.
 *
 *  Deliberately a plain `<img>`: the zoom/pan/fullscreen frame is a pointer
 *  affordance, and on a phone the picture is already the width of the screen
 *  with native pinch-to-zoom on top. The height cap is what matters here, so
 *  a tall illustration cannot push the rest of the card out of view. */
function MdImage({ src, alt }: { src?: string; alt?: string }) {
  return <img src={src} alt={alt ?? "Image"} className={styles.mdImage} loading="lazy" />;
}

/* ---------- Translation / read-aloud plumbing ---------- */

/** Placeholder text that stands in for a code span while the text is sent to a
 *  translator, so identifiers, snippets and URLs come back untouched. */
function preserveCode(input: string): { text: string; snippets: string[] } {
  const snippets: string[] = [];
  let idx = 0;
  const text = input.replace(/(```[\s\S]*?```|`[^`\n]+`)/g, (match) => {
    const placeholder = `@@CODE_${idx}@@`;
    snippets.push(match);
    idx++;
    return placeholder;
  });
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
    const lang = langHint ?? (await translationService.detectLanguageAsync(plain));
    setIsPlaying(true);
    await textToSpeechService.speak({ text: plain, lang });
    setIsPlaying(false);
  }

  return (
    <button
      type="button"
      className={`${styles.sectionTtsBadge}${isPlaying ? ` ${styles.ttsButtonActive}` : ""}`}
      onClick={handleClick}
      title={isPlaying ? "Stop reading" : "Read this section aloud"}
    >
      <FontAwesomeIcon icon={isPlaying ? faStop : faVolumeHigh} />
    </button>
  );
}

/** Wraps one block (a paragraph, a heading, a list item, a table cell) so it
 *  can be translated or read aloud on its own.
 *
 *  The badges live *inside* the block, which is why the text handed to a
 *  translator is extracted from the children rather than the block's own
 *  source: what the user sees is what gets sent. */
function SectionContent({
  children,
  tag: Tag,
  className,
  targetLang,
  translated,
  showControl,
  showReadBadge,
  style,
}: {
  children?: ReactNode;
  tag: React.ElementType;
  className?: string;
  targetLang: string;
  translated: string | null;
  showControl: boolean;
  showReadBadge: boolean;
  /** Overrides the direction-derived alignment. A paragraph holding nothing
   *  but a formula is centered instead of following its own text direction. */
  style?: CSSProperties;
}) {
  const text = textOfChildren(children);
  const [secTranslated, setSecTranslated] = useState<string | null>(null);
  const [secTranslating, setSecTranslating] = useState(false);

  async function handleSecTranslate(e: React.MouseEvent) {
    e.preventDefault();
    if (secTranslated) {
      setSecTranslated(null);
      return;
    }
    setSecTranslating(true);
    try {
      const { text: clean, snippets } = preserveCode(text);
      const result = await translationService.translateAsync(clean, targetLang);
      setSecTranslated(restoreCode(result.translatedText, snippets));
    } catch {
      console.error("Section translation failed");
    } finally {
      setSecTranslating(false);
    }
  }

  const dir = dirProps(secTranslated ?? children);
  return (
    <Tag className={className} dir={dir.dir} style={style ?? dir.style}>
      {secTranslated ?? children}
      {text && showReadBadge && (
        <SectionTtsBadge mdContent={text} langHint={secTranslated ? targetLang : undefined} />
      )}
      {!translated && showControl && text && (
        <button
          type="button"
          className={`${styles.sectionTranslateBadge}${secTranslating ? ` ${styles.ttsButtonActive}` : ""}`}
          onClick={handleSecTranslate}
          disabled={secTranslating}
          title="Translate this section"
        >
          <FontAwesomeIcon icon={faLanguage} />
        </button>
      )}
    </Tag>
  );
}

/** Code and diagram renderers. Split out from the rest of the map so the
 *  heading/list/table renderers stay shared; the syntax and diagram themes
 *  follow the app theme. */
function createBlockComponents(): Pick<Components, "code" | "pre"> {
  return {
    code: ({ className, children }) => {
      const match = /language-(\w+)/.exec(className ?? "");
      if (match) {
        const language = match[1].toLowerCase();
        if (language === "mermaid") {
          return <MermaidDiagram chart={textContent(children).trim()} />;
        }
        return <CodeBlock code={textContent(children)} language={match[1]} />;
      }
      return (
        <code dir="ltr" className={styles.markdownInlineCode}>
          {children}
        </code>
      );
    },
    pre: ({ children, node }) => {
      /* Block code (`pre > code`) without a language carries no
       * `language-*` class, so the `code` renderer would mistake it for
       * inline code and style it as an inline pill. Catch that shape here (a
       * `pre` whose only meaningful child is a `code` element with no
       * language) and render it as a plain block instead. Fenced blocks
       * *with* a language keep flowing through the `code` renderer into
       * `CodeBlock` untouched, and raw-HTML `<pre>` elements (any other
       * shape) render as before. */
      const root = toMdNode(node);
      const kids = (root?.children ?? []).filter(
        (child) => child.type !== "text" || (child.value ?? "").trim(),
      );
      if (kids.length === 1 && kids[0]?.tagName === "code") {
        const codeEl = kids[0];
        const cls = codeEl.properties?.className;
        const cn = Array.isArray(cls) ? cls.join(" ") : String(cls ?? "");
        if (!/language-(\w+)/.test(cn)) {
          const text = (codeEl.children ?? []).map((child) => mdText(child)).join("");
          return (
            <pre className={styles.blockCode}>
              <code>{text}</code>
            </pre>
          );
        }
      }
      return <>{children}</>;
    },
  };
}

/** Props every translatable block needs. Passed to the component map so each
 *  paragraph, heading, list item and table cell can be translated or read on
 *  its own. */
interface SectionOptions {
  targetLang: string;
  translated: string | null;
  showControl: boolean;
  showReadBadge: boolean;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
function createBaseComponents(section: SectionOptions): Components {
  return {
  h1: (props) => (
    <SectionContent {...props} tag="h1" className={`${styles.heading} ${styles.h1}`} {...section} />
  ),
  h2: (props) => (
    <SectionContent {...props} tag="h2" className={`${styles.heading} ${styles.h2}`} {...section} />
  ),
  h3: (props) => (
    <SectionContent {...props} tag="h3" className={`${styles.heading} ${styles.h3}`} {...section} />
  ),
  h4: (props) => (
    <SectionContent {...props} tag="h4" className={`${styles.heading} ${styles.h4}`} {...section} />
  ),
  h5: (props) => (
    <SectionContent {...props} tag="h5" className={`${styles.heading} ${styles.h5}`} {...section} />
  ),
  h6: (props) => (
    <SectionContent {...props} tag="h6" className={`${styles.heading} ${styles.h6}`} {...section} />
  ),
  div: ({ children, node: _node, ...props }) => (
    <div {...props} {...dirProps(children)}>
      {children}
    </div>
  ),
  span: ({ children, node: _node, ...props }) =>
    // Math subtrees pass through untouched (see `hasMath`).
    hasMath(children) ? (
      <span {...props}>{children}</span>
    ) : (
      <span {...props} {...dirProps(children)}>
        {children}
      </span>
    ),
  p: ({ children, node: _node, ...props }) => {
    const kids = Array.isArray(children) ? children : [children];
    const mathOnly =
      kids.length > 0 &&
      kids.every(
        (child) =>
          isValidElement(child) &&
          String((child.props as { className?: unknown })?.className ?? "").includes("katex"),
      );
    return (
      <SectionContent
        {...props}
        children={children}
        tag="p"
        className={styles.p}
        style={mathOnly ? { textAlign: "center" } : undefined}
        {...section}
      />
    );
  },
  a: ({ href, children, ...props }) => {
    // No destination (or a non-website one, already blanked by
    // `safeUrlTransform`): render plain text with no link affordance, so
    // clicking does nothing instead of navigating the app window to a blank
    // page or running a `javascript:` payload.
    if (!href) {
      return <span>{children}</span>;
    }
    return (
      <a
        {...props}
        dir="ltr"
        href={href}
        className={styles.link}
        target="_blank"
        rel="noreferrer"
      >
        {children}
      </a>
    );
  },
  ul: ({ children, node: _node, className, ...props }) => {
    const cn = Array.isArray(className) ? className.join(" ") : (className ?? "");
    const isTaskList = cn.includes("contains-task-list");
    return (
      <ul
        className={`${isTaskList ? styles.tasks : styles.list} ${cn}`}
        {...props}
        {...dirProps(children)}
      >
        {children}
      </ul>
    );
  },
  ol: ({ children, node: _node, className, ...props }) => {
    const cn = Array.isArray(className) ? className.join(" ") : (className ?? "");
    const isTaskList = cn.includes("contains-task-list");
    return (
      <ol
        className={`${isTaskList ? styles.tasks : styles.list} ${cn}`}
        {...props}
        {...dirProps(children)}
      >
        {children}
      </ol>
    );
  },
  li: ({ children, node: _node, className, ...props }) => {
    const cn = Array.isArray(className) ? className.join(" ") : (className ?? "");
    const isTaskItem = cn.includes("task-list-item");
    return (
      <SectionContent
        {...props}
        children={children}
        tag="li"
        className={`${isTaskItem ? styles.taskItem : styles.listItem} ${cn}`}
        {...section}
      />
    );
  },
  input: (props) => {
    // react-markdown may inject a `node` (hast) prop; strip it so it never
    // reaches the DOM <input> (GFM task-list checkboxes). `ref` is reserved
    // by React and never appears in `props`, so no need to pull it out here.
    const { node, ...rest } = props as { node?: unknown } & Record<string, unknown>;
    void node;
    return <input {...rest} className={styles.taskCheckbox} />;
  },
  blockquote: ({ children, node: _node, ...props }) => (
    <blockquote className={styles.blockquote} {...props} {...dirProps(children)}>
      {children}
    </blockquote>
  ),
  hr: () => <hr className={styles.hr} />,
  img: ({ src, alt }) => <MdImage src={src} alt={alt ?? "Image"} />,
  th: (props) => (
    <SectionContent {...props} tag="th" className={styles.cell} {...section} />
  ),
  td: (props) => (
    <SectionContent {...props} tag="td" className={styles.cell} {...section} />
  ),
  table: MarkdownTable,
  iframe: ({ src, children, ...props }) => {
    /* An embedded video needs a fixed-ratio wrapper: a bare <iframe> is
     * 300x150 by default and its content is a separate document the parent's
     * stylesheet cannot reach. With no source there is nothing to show, and the
     * wrapper would be a permanent empty 16:9 block in the card. */
    if (!src) return null;
    return (
      <div className={styles.iframeWrap}>
        <iframe {...props} src={src} className={styles.iframe} allowFullScreen />
      </div>
    );
  },
  };
}
/* eslint-enable @typescript-eslint/no-unused-vars */

interface MarkdownRenderProps {
  markdown: string;
  isShowTranslationControl?: boolean;
  isShowReadBadge?: boolean;
  isDisableGlobalTranslate?: boolean;
  /** Parses raw HTML embedded in the markdown. Defaults to true; disable for
   *  AI-produced content so HTML/JSX snippets render as literal text. */
  rawHtml?: boolean;
  /** When the document renders empty, show the Markdown source in its place.
   *  On by default: an empty card reads as a broken card, and the source is
   *  exactly what says which construct the renderer dropped. */
  showSourceWhenBlank?: boolean;
  className?: string;
}

export default function MarkdownRender({
  markdown,
  isShowTranslationControl: propShowTranslation,
  isShowReadBadge: propShowReadBadge,
  isDisableGlobalTranslate,
  rawHtml = true,
  showSourceWhenBlank = true,
  className = "",
}: MarkdownRenderProps) {
  const {
    isShowTranslationControl: storeShowTranslation,
    defaultTranslationTarget,
    readAloudBadge,
  } = useSettingStore();
  const showControl = propShowTranslation ?? storeShowTranslation;
  const showReadBadge = propShowReadBadge ?? readAloudBadge;

  const [translated, setTranslated] = useState<string | null>(null);
  const [translationSource, setTranslationSource] = useState<"google" | "ai" | null>(null);
  const [translating, setTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState(defaultTranslationTarget);

  async function handleTranslate(source: "google" | "ai") {
    if (translated && translationSource === source) {
      setTranslated(null);
      setTranslationSource(null);
      return;
    }
    setTranslating(true);
    try {
      const { text, snippets } = preserveCode(markdown);
      let resultText: string;
      if (source === "ai") {
        resultText = await translateWithAI(text, targetLang);
      } else {
        const result = await translationService.translateAsync(text, targetLang);
        resultText = result.translatedText;
      }
      setTranslated(restoreCode(resultText, snippets));
      setTranslationSource(source);
    } catch {
      console.error("Translation failed");
    } finally {
      setTranslating(false);
    }
  }

  const content = translated ?? markdown;

  /** The rendered document is expensive to build (markdown parse + per-node
   *  RTL analysis + syntax highlighting), so it is memoized on the inputs that
   *  actually change what it contains. */
  const components = useMemo<Components>(
    () => ({
      ...createBaseComponents({ targetLang, translated, showControl, showReadBadge }),
      ...createBlockComponents(),
    }),
    [targetLang, translated, showControl, showReadBadge],
  );

  /** In "no raw HTML" mode the angle brackets are escaped in the *source*
   *  before parsing, so an HTML or JSX snippet inside an AI answer renders as
   *  the literal text it is instead of becoming live markup. */
  const body = useMemo(
    () => (rawHtml ? content : escapeHtmlInMarkdown(content)),
    [content, rawHtml],
  );

  /** The rendered document is expensive to build (markdown parse + per-node
   *  RTL analysis + syntax highlighting), so it is memoized on the inputs that
   *  actually change what it contains. */
  const documentElement = useMemo(
    () => (
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={rawHtml ? REHYPE_PLUGINS : REHYPE_PLUGINS_NO_RAW}
        components={components}
        urlTransform={safeUrlTransform}
      >
        {body}
      </ReactMarkdown>
    ),
    [body, rawHtml, components],
  );

  /** The Markdown whose render came out blank. Keyed by the source itself, so
   *  editing the card clears it with no effect and no extra render: a new
   *  source simply no longer matches. */
  const [blankSource, setBlankSource] = useState<string | null>(null);
  /** Measured from a ref callback (commit phase), not an effect: this is a
   *  measurement of what came out, not a synchronisation with anything
   *  outside. The update is a no-op when the verdict is unchanged, so a card
   *  that renders the same way on every re-render settles immediately. */
  const measureDocument = useCallback(
    (host: HTMLDivElement | null) => {
      if (!host) return; // unmounted: the fallback replaces it, nothing to read
      const blank = isBlankDocument(host);
      setBlankSource((prev) => {
        const next = blank ? markdown : null;
        return prev === next ? prev : next;
      });
    },
    [markdown],
  );

  const showSource =
    showSourceWhenBlank && markdown.trim().length > 0 && blankSource === markdown;

  return (
    <>
      {showControl && !isDisableGlobalTranslate && (
        <div className={styles.translateBar}>
          <button
            className={styles.translateButton}
            onClick={() => handleTranslate("google")}
            disabled={translating}
          >
            <FontAwesomeIcon icon={faLanguage} />
            {translating && translationSource === "google"
              ? " Translating..."
              : translated && translationSource === "google"
                ? " Show Original"
                : " Translate"}
          </button>
          <button
            className={styles.translateButton}
            onClick={() => handleTranslate("ai")}
            disabled={translating}
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} />
            {translating && translationSource === "ai"
              ? " AI Translating..."
              : translated && translationSource === "ai"
                ? " Show Original"
                : " AI Translate"}
          </button>
          <select
            className={styles.langSelect}
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            disabled={translating}
            aria-label="Translation target language"
          >
            {LANGUAGES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}
      {showSource ? (
        <pre className={styles.sourceFallback} dir="auto">
          <span className={styles.sourceFallbackLabel}>
            Nothing rendered for this Markdown - showing the source
          </span>
          {markdown}
        </pre>
      ) : (
        <div
          ref={measureDocument}
          className={`${styles.markdownBody}${className ? ` ${className}` : ""}`}
        >
          {documentElement}
        </div>
      )}
    </>
  );
}


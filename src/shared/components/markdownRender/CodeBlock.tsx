import { useCallback, useState } from "react";
import type { CSSProperties } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import { useThemeStore } from "../../../stores/themeStore";
import styles from "./CodeBlock.module.css";

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
  /** Fixed syntax theme; null/undefined = follow the app theme. */
  themeOverride?: "Light" | "Dark" | null;
  /** Fixed block background; null/undefined = follow the theme card. */
  background?: string | null;
}

/** How long the "Copied" confirmation stays on the copy button. */
const COPY_FEEDBACK_MS = 1600;

export function CodeBlock({
  code,
  language = "typescript",
  showLineNumbers = false,
  className = "",
  themeOverride,
  background,
}: CodeBlockProps) {
  const theme = useThemeStore((state) => state.theme);
  const effective = themeOverride ?? theme;
  const prismStyle = effective === "Dark" ? oneDark : oneLight;
  const [copied, setCopied] = useState(false);
  const classes = [styles.host, className].filter(Boolean).join(" ");

  const customStyle: CSSProperties = {
    margin: 0,
    padding: "1rem 1.25rem",
    background: "transparent",
    fontSize: "0.85rem",
    lineHeight: 1.6,
  };

  const hostStyle: CSSProperties | undefined = background
    ? { backgroundColor: background }
    : undefined;

  /** Electron's clipboard is reachable from the renderer, so no IPC needed.
   *  The button is only a convenience, so a failure is swallowed rather than
   *  surfaced as an error state on every code block. */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    } catch {
      /* clipboard unavailable - the code is still selectable by hand */
    }
  }, [code]);

  return (
    <div className={classes} style={hostStyle}>
      <div className={styles.toolbar}>
        <span className={styles.language}>{language}</span>
        <button
          type="button"
          className={`${styles.toolButton} ${copied ? styles.toolButtonDone : ""}`}
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          title="Copy code"
        >
          <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={prismStyle}
        showLineNumbers={showLineNumbers}
        customStyle={customStyle}
        codeTagProps={{ style: { fontFamily: "inherit" } }}
      >
        {code.trimEnd()}
      </SyntaxHighlighter>
    </div>
  );
}
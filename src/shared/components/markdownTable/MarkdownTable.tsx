// MarkdownTable.tsx
import React from "react";
import styles from "./MarkdownTable.module.css";

function MarkdownTable({ children }: { children?: React.ReactNode }) {
  return (
    <div className={styles.markdownTableWrapper}>
      <table>{children}</table>
    </div>
  );
}

export default MarkdownTable;
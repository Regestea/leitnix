// MarkdownTable.tsx
import React from "react";
import "./MarkdownTable.css";

function MarkdownTable({ children }: { children?: React.ReactNode }) {
  return (
    <div className="markdown-table-wrapper">
      <table>{children}</table>
    </div>
  );
}

export default MarkdownTable;
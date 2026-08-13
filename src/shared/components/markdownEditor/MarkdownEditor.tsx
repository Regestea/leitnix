import { useCallback, useRef, useState } from 'react';
import styles from './MarkdownEditor.module.css';

// ─── Types ──────────────────────────────────────────────────────────────────

interface MarkdownEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

interface ToolbarAction {
  type: 'button' | 'separator';
  label?: string;
  tooltip?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action?: (state: SelectionState) => InsertResult;
}

interface SelectionState {
  value: string;
  selectionStart: number;
  selectionEnd: number;
  selectedText: string;
}

interface InsertResult {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const Icons = {
  Bold: () => (
    <svg viewBox="0 0 24 24"><path d="M6 4h8a4 4 0 0 1 0 8H6z"/><path d="M6 12h9a4 4 0 0 1 0 8H6z"/></svg>
  ),
  Italic: () => (
    <svg viewBox="0 0 24 24"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
  ),
  Strikethrough: () => (
    <svg viewBox="0 0 24 24"><path d="M17.3 12H6.7"/><path d="M10 7.3C10 6 11 5 12.5 5S15 5.8 15 7.3c0 1-.4 1.7-1.5 2.7"/><path d="M14 16.7c0 1.3-1 2.3-2.5 2.3S9 18.2 9 16.7c0-1.2.5-2 1.5-2.7"/></svg>
  ),
  Heading: () => (
    <svg viewBox="0 0 24 24"><path d="M4 12h16"/><path d="M4 5v14"/><path d="M20 5v14"/></svg>
  ),
  H1: () => (
    <svg viewBox="0 0 24 24"><text x="2" y="18" fontFamily="monospace" fontSize="16" fill="currentColor" stroke="none">H1</text></svg>
  ),
  H2: () => (
    <svg viewBox="0 0 24 24"><text x="2" y="18" fontFamily="monospace" fontSize="16" fill="currentColor" stroke="none">H2</text></svg>
  ),
  H3: () => (
    <svg viewBox="0 0 24 24"><text x="2" y="18" fontFamily="monospace" fontSize="16" fill="currentColor" stroke="none">H3</text></svg>
  ),
  Code: () => (
    <svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
  ),
  CodeBlock: () => (
    <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 9l-3 3 3 3"/><path d="M15 9l3 3-3 3"/></svg>
  ),
  Link: () => (
    <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
  ),
  Image: () => (
    <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
  ),
  ListUnordered: () => (
    <svg viewBox="0 0 24 24"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></svg>
  ),
  ListOrdered: () => (
    <svg viewBox="0 0 24 24"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
  ),
  Quote: () => (
    <svg viewBox="0 0 24 24"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
  ),
  HorizontalRule: () => (
    <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12" strokeWidth="2.5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>
  ),
  Table: () => (
    <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
  ),
  TaskList: () => (
    <svg viewBox="0 0 24 24"><rect x="3" y="5" width="6" height="6" rx="1"/><polyline points="5 8 7 10 11 6"/><line x1="13" y1="8" x2="21" y2="8"/><rect x="3" y="14" width="6" height="6" rx="1"/><line x1="13" y1="17" x2="21" y2="17"/></svg>
  ),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wrapSelection(
  { value, selectionStart, selectionEnd, selectedText }: SelectionState,
  before: string,
  after: string,
  placeholder: string,
): InsertResult {
  const text = selectedText || placeholder;
  const newValue =
    value.slice(0, selectionStart) +
    before +
    text +
    after +
    value.slice(selectionEnd);
  return {
    value: newValue,
    selectionStart: selectionStart + before.length,
    selectionEnd: selectionStart + before.length + text.length,
  };
}

function insertLinePrefix(
  { value, selectionStart, selectionEnd }: SelectionState,
  prefix: string,
  placeholder: string,
): InsertResult {
  // Find start of current line
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const lineEnd = value.indexOf('\n', selectionEnd);
  const end = lineEnd === -1 ? value.length : lineEnd;
  const lineContent = value.slice(lineStart, end);

  // Toggle: if line already starts with prefix, remove it
  if (lineContent.startsWith(prefix)) {
    const removed = value.slice(0, lineStart) + lineContent.slice(prefix.length) + value.slice(end);
    return {
      value: removed,
      selectionStart: Math.max(lineStart, selectionStart - prefix.length),
      selectionEnd: Math.max(lineStart, selectionEnd - prefix.length),
    };
  }

  const insert = lineContent.trim() === '' ? prefix + placeholder : prefix + lineContent;
  const newValue = value.slice(0, lineStart) + insert + value.slice(end);
  const delta = prefix.length;
  return {
    value: newValue,
    selectionStart: selectionStart + delta,
    selectionEnd: selectionEnd + delta,
  };
}

function insertBlock(
  { value, selectionStart }: SelectionState,
  text: string,
): InsertResult {
  const before = selectionStart > 0 && value[selectionStart - 1] !== '\n' ? '\n' : '';
  const insert = before + text;
  const newValue = value.slice(0, selectionStart) + insert + value.slice(selectionStart);
  const cursor = selectionStart + insert.length;
  return { value: newValue, selectionStart: cursor, selectionEnd: cursor };
}

// ─── Toolbar Actions Config ───────────────────────────────────────────────────

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  {
    type: 'button',
    tooltip: 'Bold',
    shortcut: 'Ctrl+B',
    icon: <Icons.Bold />,
    action: (s) => wrapSelection(s, '**', '**', 'bold text'),
  },
  {
    type: 'button',
    tooltip: 'Italic',
    shortcut: 'Ctrl+I',
    icon: <Icons.Italic />,
    action: (s) => wrapSelection(s, '_', '_', 'italic text'),
  },
  {
    type: 'button',
    tooltip: 'Strikethrough',
    icon: <Icons.Strikethrough />,
    action: (s) => wrapSelection(s, '~~', '~~', 'strikethrough'),
  },
  { type: 'separator' },
  {
    type: 'button',
    tooltip: 'Heading 1',
    icon: <Icons.H1 />,
    action: (s) => insertLinePrefix(s, '# ', 'Heading 1'),
  },
  {
    type: 'button',
    tooltip: 'Heading 2',
    icon: <Icons.H2 />,
    action: (s) => insertLinePrefix(s, '## ', 'Heading 2'),
  },
  {
    type: 'button',
    tooltip: 'Heading 3',
    icon: <Icons.H3 />,
    action: (s) => insertLinePrefix(s, '### ', 'Heading 3'),
  },
  { type: 'separator' },
  {
    type: 'button',
    tooltip: 'Inline Code',
    shortcut: 'Ctrl+`',
    icon: <Icons.Code />,
    action: (s) => wrapSelection(s, '`', '`', 'code'),
  },
  {
    type: 'button',
    tooltip: 'Code Block',
    icon: <Icons.CodeBlock />,
    action: (s) => insertBlock(s, '```\n' + (s.selectedText || 'code here') + '\n```\n'),
  },
  { type: 'separator' },
  {
    type: 'button',
    tooltip: 'Link',
    shortcut: 'Ctrl+K',
    icon: <Icons.Link />,
    action: (s) => {
      const text = s.selectedText || 'link text';
      const result = wrapSelection({ ...s, selectedText: text }, '[', '](url)', '');
      return {
        value: result.value,
        selectionStart: result.selectionEnd - 4,  // select "url"
        selectionEnd: result.selectionEnd - 1,
      };
    },
  },
  {
    type: 'button',
    tooltip: 'Image',
    icon: <Icons.Image />,
    action: (s) => {
      const alt = s.selectedText || 'alt text';
      const insert = `![${alt}](url)`;
      const newValue = s.value.slice(0, s.selectionStart) + insert + s.value.slice(s.selectionEnd);
      const urlStart = s.selectionStart + alt.length + 4;
      return { value: newValue, selectionStart: urlStart, selectionEnd: urlStart + 3 };
    },
  },
  { type: 'separator' },
  {
    type: 'button',
    tooltip: 'Bullet List',
    icon: <Icons.ListUnordered />,
    action: (s) => insertLinePrefix(s, '- ', 'list item'),
  },
  {
    type: 'button',
    tooltip: 'Numbered List',
    icon: <Icons.ListOrdered />,
    action: (s) => insertLinePrefix(s, '1. ', 'list item'),
  },
  {
    type: 'button',
    tooltip: 'Task List',
    icon: <Icons.TaskList />,
    action: (s) => insertLinePrefix(s, '- [ ] ', 'task'),
  },
  { type: 'separator' },
  {
    type: 'button',
    tooltip: 'Blockquote',
    icon: <Icons.Quote />,
    action: (s) => insertLinePrefix(s, '> ', 'quote'),
  },
  {
    type: 'button',
    tooltip: 'Horizontal Rule',
    icon: <Icons.HorizontalRule />,
    action: (s) => insertBlock(s, '\n---\n'),
  },
  {
    type: 'button',
    tooltip: 'Table',
    icon: <Icons.Table />,
    action: (s) =>
      insertBlock(
        s,
        '| Header | Header | Header |\n| ------ | ------ | ------ |\n| Cell   | Cell   | Cell   |\n',
      ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function MarkdownEditor({
  value: externalValue,
  onChange,
  placeholder = 'Start writing Markdown…',
  className,
  style,
}: MarkdownEditorProps) {
  const [internalValue, setInternalValue] = useState('');
  const isControlled = externalValue !== undefined;
  const value = isControlled ? externalValue : internalValue;

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Stats ──────────────────────────────────────────────
  const wordCount = value.trim() === '' ? 0 : value.trim().split(/\s+/).length;
  const lineCount = value === '' ? 1 : value.split('\n').length;
  const charCount = value.length;

  // ── Change handler ─────────────────────────────────────
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
      if (!isControlled) setInternalValue(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  // ── Keyboard shortcuts ─────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = textareaRef.current!;

      // Tab → indent
      if (e.key === 'Tab') {
        e.preventDefault();
        const { selectionStart, selectionEnd } = textarea;
        const next =
          value.slice(0, selectionStart) + '  ' + value.slice(selectionEnd);
        if (!isControlled) setInternalValue(next);
        onChange?.(next);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
        });
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      const shortcutMap: Record<string, number> = {
        b: 0,   // Bold
        i: 1,   // Italic
        '`': 8, // Inline Code
        k: 11,  // Link
      };

      const idx = shortcutMap[e.key.toLowerCase()];
      if (idx === undefined) return;

      e.preventDefault();
      const action = TOOLBAR_ACTIONS[idx];
      if (action.type !== 'button' || !action.action) return;

      const { selectionStart, selectionEnd } = textarea;
      const result = action.action({
        value,
        selectionStart,
        selectionEnd,
        selectedText: value.slice(selectionStart, selectionEnd),
      });

      if (!isControlled) setInternalValue(result.value);
      onChange?.(result.value);
      requestAnimationFrame(() => {
        textarea.selectionStart = result.selectionStart;
        textarea.selectionEnd = result.selectionEnd;
        textarea.focus();
      });
    },
    [value, isControlled, onChange],
  );

  // ── Toolbar click ──────────────────────────────────────
  const handleToolbarAction = useCallback(
    (action: (state: SelectionState) => InsertResult) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { selectionStart, selectionEnd } = textarea;
      const result = action({
        value,
        selectionStart,
        selectionEnd,
        selectedText: value.slice(selectionStart, selectionEnd),
      });

      if (!isControlled) setInternalValue(result.value);
      onChange?.(result.value);

      requestAnimationFrame(() => {
        textarea.selectionStart = result.selectionStart;
        textarea.selectionEnd = result.selectionEnd;
        textarea.focus();
      });
    },
    [value, isControlled, onChange],
  );

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className={`${styles.mdEditor}${className ? ` ${className}` : ''}`} style={style}>
      {/* Toolbar */}
      <div className={styles.mdToolbar} role="toolbar" aria-label="Markdown formatting">
        {TOOLBAR_ACTIONS.map((item, i) => {
          if (item.type === 'separator') {
            return <div key={`sep-${i}`} className={styles.mdToolbarSeparator} aria-hidden="true" />;
          }
          return (
            <button
              key={item.tooltip}
              className={styles.mdBtn}
              data-tooltip={item.tooltip}
              data-shortcut={item.shortcut}
              aria-label={item.tooltip}
              type="button"
              onMouseDown={(e) => {
                // prevent textarea blur
                e.preventDefault();
                if (item.action) handleToolbarAction(item.action);
              }}
            >
              {item.icon}
            </button>
          );
        })}
      </div>

      {/* Editor */}
      <div className={styles.mdTextareaWrap}>
        <textarea
          ref={textareaRef}
          className={styles.mdTextarea}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Markdown editor"
        />
      </div>

      {/* Status bar */}
      <div className={styles.mdStatusbar}>
        <span>Markdown</span>
        <div className={styles.mdStatusbarRight}>
          <span>{wordCount} words</span>
          <span>{lineCount} lines</span>
          <span>{charCount} chars</span>
        </div>
      </div>
    </div>
  );
}
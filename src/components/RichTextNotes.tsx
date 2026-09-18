import React from 'react';
import { Bold, Italic, List, ListOrdered, Code } from 'lucide-react';
import { hapticButtonClick } from '../utils/haptics';

interface RichTextNotesViewProps {
  content: string;
  isCompleted?: boolean;
}

export const RichTextNotesView: React.FC<RichTextNotesViewProps> = ({ content, isCompleted }) => {
  if (!content) return null;

  // Render formatted lines (lists, code blocks, bold, italics, links)
  const lines = content.split('\n');

  const renderInlineFormatted = (text: string) => {
    // Regex matching bold, italic, code, and URLs
    // 1. URLs
    // 2. Bold **text**
    // 3. Italic *text*
    // 4. Code `code`
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|https?:\/\/[^\s]+)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={index} className="font-bold text-zinc-900 dark:text-zinc-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <em key={index} className="italic text-zinc-800 dark:text-zinc-200">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={index}
            className="rounded bg-zinc-150 px-1 py-0.5 font-mono text-[11px] text-pink-600 dark:bg-zinc-800 dark:text-pink-400"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('http://') || part.startsWith('https://')) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-sky-600 hover:text-sky-700 underline underline-offset-2 dark:text-sky-400 dark:hover:text-sky-300"
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div
      className={`mt-1 text-xs leading-relaxed space-y-0.5 transition-all ${
        isCompleted
          ? 'text-zinc-400/80 dark:text-zinc-600'
          : 'text-zinc-600 dark:text-zinc-400'
      }`}
    >
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Bullet list item
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1.5">
              <span className="text-zinc-400 dark:text-zinc-500 font-bold">•</span>
              <span>{renderInlineFormatted(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Numbered list item (e.g. 1. , 2. )
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1.5">
              <span className="text-zinc-400 dark:text-zinc-500 font-semibold text-[11px] min-w-3">
                {numMatch[1]}.
              </span>
              <span>{renderInlineFormatted(numMatch[2])}</span>
            </div>
          );
        }

        // Standard text paragraph
        return (
          <p key={idx} className="min-h-[1.1rem]">
            {renderInlineFormatted(line)}
          </p>
        );
      })}
    </div>
  );
};

interface RichTextToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (val: string) => void;
}

export const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
  textareaRef,
  value,
  onChange,
}) => {
  const insertFormatting = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    hapticButtonClick();
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(`${value}${prefix}${defaultPlaceholder}${suffix}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultPlaceholder;

    const before = value.substring(0, start);
    const after = value.substring(end);

    const newText = `${before}${prefix}${selectedText}${suffix}${after}`;
    onChange(newText);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      const newCursor = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const insertLinePrefix = (prefix: string) => {
    hapticButtonClick();
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(`${value}\n${prefix}`);
      return;
    }

    const start = textarea.selectionStart;
    const before = value.substring(0, start);
    const after = value.substring(start);

    // If already on a fresh line, don't add extra newline
    const needsNewline = before.length > 0 && !before.endsWith('\n');
    const newText = `${before}${needsNewline ? '\n' : ''}${prefix}${after}`;
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursor = start + (needsNewline ? 1 : 0) + prefix.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  return (
    <div className="flex items-center gap-1 py-1 border-b border-zinc-150 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mr-1">
        Format:
      </span>
      <button
        type="button"
        onClick={() => insertFormatting('**', '**', 'bold text')}
        title="Bold text (**text**)"
        className="p-1 rounded-md hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 cursor-pointer transition-colors"
      >
        <Bold className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => insertFormatting('*', '*', 'italic text')}
        title="Italic text (*text*)"
        className="p-1 rounded-md hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 cursor-pointer transition-colors"
      >
        <Italic className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => insertLinePrefix('- ')}
        title="Bullet list (- item)"
        className="p-1 rounded-md hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 cursor-pointer transition-colors"
      >
        <List className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => insertLinePrefix('1. ')}
        title="Numbered list (1. item)"
        className="p-1 rounded-md hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 cursor-pointer transition-colors"
      >
        <ListOrdered className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => insertFormatting('`', '`', 'code')}
        title="Inline code (`code`)"
        className="p-1 rounded-md hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 cursor-pointer transition-colors"
      >
        <Code className="h-3 w-3" />
      </button>
    </div>
  );
};

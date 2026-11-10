import React, { useState } from 'react';
import { ChatMessage as ChatMessageType } from '../types/chat';
import { CodeBlock } from './CodeBlock';
import {
  Copy,
  Check,
  Sparkles,
  Pencil,
  X
} from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  onImageClick?: (url: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onImageClick, onEditMessage }) => {
  const [copied, setCopied] = useState(false);
  const [userCopied, setUserCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const isUser = message.role === 'user';

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy message:', e);
    }
  };

  const handleCopyUserPrompt = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setUserCopied(true);
      setTimeout(() => setUserCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy user prompt:', e);
    }
  };

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    if (onEditMessage) {
      onEditMessage(message.id, trimmed);
    }
    setIsEditing(false);
  };

  // Modern Markdown Parser
  const renderFormattedContent = (content: string) => {
    const codeBlockRegex = /```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        const textChunk = content.substring(lastIndex, matchIndex);
        elements.push(
          <div key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-7 text-zinc-800 dark:text-zinc-200">
            {renderInlineMarkdown(textChunk)}
          </div>
        );
      }

      const lang = match[1] || 'plaintext';
      const code = match[2];
      elements.push(<CodeBlock key={`code-${matchIndex}`} language={lang} code={code} />);

      lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      const openBlockMatch = remainingText.match(/^([\s\S]*?)```([a-zA-Z0-9_\-+]*)\n([\s\S]*)$/);
      if (openBlockMatch) {
        const textBefore = openBlockMatch[1];
        const streamLang = openBlockMatch[2] || 'plaintext';
        const streamCode = openBlockMatch[3];
        if (textBefore) {
          elements.push(
            <div key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-7 text-zinc-800 dark:text-zinc-200">
              {renderInlineMarkdown(textBefore)}
            </div>
          );
        }
        elements.push(
          <CodeBlock
            key={`code-stream-${lastIndex}`}
            language={streamLang}
            code={streamCode}
            isStreaming={message.isStreaming}
          />
        );
      } else {
        elements.push(
          <div key={`text-${lastIndex}`} className="whitespace-pre-wrap leading-7 text-zinc-800 dark:text-zinc-200">
            {renderInlineMarkdown(remainingText)}
          </div>
        );
      }
    }

    return elements.length > 0 ? elements : <p className="whitespace-pre-wrap leading-7">{content}</p>;
  };

  const renderInlineMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Markdown Images: ![alt](url)
      const imgMatch = line.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        const alt = imgMatch[1];
        const src = imgMatch[2];
        return (
          <div key={idx} className="my-3 rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-white/10 max-w-lg shadow-sm">
            <img
              src={src}
              alt={alt}
              className="w-full h-auto max-h-[360px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => onImageClick?.(src)}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            {alt && <div className="p-2 text-[11px] text-zinc-500 text-center bg-zinc-50 dark:bg-black/20">{alt}</div>}
          </div>
        );
      }

      if (line.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-lg font-bold text-zinc-900 dark:text-white mt-5 mb-2.5 tracking-tight">
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-base font-bold text-zinc-900 dark:text-white mt-4 mb-2 tracking-tight">
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('#### ')) {
        return (
          <h4 key={idx} className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-3 mb-1">
            {line.replace('#### ', '')}
          </h4>
        );
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="my-3 border-l-2 border-indigo-500 bg-indigo-50/50 dark:bg-white/[0.02] pl-3.5 py-1.5 rounded-r-xl text-zinc-700 dark:text-zinc-300 italic text-[14.5px]">
            {line.replace('> ', '')}
          </blockquote>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-2.5 my-1.5 pl-1.5 text-zinc-800 dark:text-zinc-200 text-[14.5px]">
            <span className="text-indigo-600 dark:text-indigo-400 mt-2 text-[6px]">•</span>
            <span className="leading-relaxed flex-1">{formatInlineStyles(line.substring(2))}</span>
          </div>
        );
      }
      const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        return (
          <div key={idx} className="flex items-start gap-2.5 my-1.5 pl-1.5 text-zinc-800 dark:text-zinc-200 text-[14.5px]">
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs mt-0.5 min-w-[18px]">{numMatch[1]}.</span>
            <span className="leading-relaxed flex-1">{formatInlineStyles(numMatch[2])}</span>
          </div>
        );
      }
      if (line.trim() === '---' || line.trim() === '***') {
        return <div key={idx} className="my-3" />;
      }
      return (
        <p key={idx} className={line.trim() === '' ? 'h-2.5' : 'my-1.5 text-[15px] leading-[1.75]'}>
          {formatInlineStyles(line)}
        </p>
      );
    });
  };

  const formatInlineStyles = (line: string) => {
    // Matches **bold**, `code`, or safe markdown links [text](https://url)
    const regex = /(\*\*.*?\*\*|`.*?`|\[(?:[^\]]+)\]\((?:https?:\/\/[^\s)]+)\))/g;
    const parts = line.split(regex);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-zinc-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-[#24242a] border border-zinc-200 dark:border-white/10 font-mono text-indigo-700 dark:text-indigo-300 text-xs mx-0.5">
            {part.slice(1, -1)}
          </code>
        );
      }
      const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (linkMatch) {
        const linkText = linkMatch[1];
        const linkUrl = linkMatch[2];
        return (
          <a
            key={i}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            {linkText}
          </a>
        );
      }
      return part;
    });
  };

  // Modern User Bubble Layout (ChatGPT / Claude Style) with Edit & Copy
  if (isUser) {
    if (isEditing) {
      return (
        <div className="py-2.5 px-4 w-full animate-fade-in">
          <div className="max-w-3xl mx-auto w-full flex justify-end">
            <div className="w-fit min-w-[280px] sm:min-w-[360px] max-w-[88%] sm:max-w-[80%] md:max-w-[72%] rounded-2xl bg-[#f4f5f8] dark:bg-[#23242e] shadow-xl shadow-black/10 dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] p-3.5 sm:p-4 transition-all duration-150">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit();
                  } else if (e.key === 'Escape') {
                    setIsEditing(false);
                    setEditText(message.content);
                  }
                }}
                className="w-full bg-transparent text-[14.5px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none resize-none leading-relaxed selection:bg-indigo-500/25 px-1 py-0.5"
                rows={Math.min(Math.max(editText.split('\n').length, 1), 6)}
                autoFocus
                dir="auto"
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(message.content);
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={!editText.trim()}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 dark:shadow-indigo-500/25 transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="py-2.5 px-4 w-full">
        <div className="max-w-3xl mx-auto w-full flex flex-col items-end group">
          <div className="w-fit max-w-[85%] sm:max-w-[78%] md:max-w-[72%] rounded-2xl sm:rounded-[22px] bg-[#f0f2f5] dark:bg-[#282932] px-4.5 py-2.5 sm:px-5 sm:py-3 text-[14.5px] sm:text-[15px] text-zinc-900 dark:text-[#f3f4f6] shadow-sm shadow-indigo-500/[0.04] dark:shadow-[0_2px_14px_rgba(0,0,0,0.25),0_0_15px_rgba(99,102,241,0.04)] leading-relaxed transition-all duration-150 selection:bg-indigo-500/25">
            {/* User Attached Images */}
            {message.images && message.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2.5">
                {message.images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => onImageClick?.(img)}
                    className="relative cursor-pointer rounded-xl overflow-hidden border border-zinc-300 dark:border-white/15 max-w-[200px] max-h-[150px] shadow"
                  >
                    <img src={img} alt="Attachment" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            <p className="whitespace-pre-wrap selection:bg-indigo-500/25 font-sans leading-[1.65]" dir="auto">{message.content}</p>
          </div>

          {/* User Message Action Bar: Edit & Copy (Smooth hover reveal) */}
          <div className="flex items-center gap-1 mt-1 pr-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={handleCopyUserPrompt}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
              title="Copy prompt"
            >
              {userCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Copied!</span>
                </>
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {onEditMessage && (
              <button
                onClick={() => {
                  setEditText(message.content);
                  setIsEditing(true);
                }}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                title="Edit message"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Modern Assistant Layout (Parallel with command bar)
  return (
    <div className="py-4 px-4 w-full">
      <div className="max-w-3xl mx-auto w-full">
        {/* Subtle Assistant Brand Header */}
        <div className="flex items-center gap-2 mb-2.5 select-none">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-sm shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-white dark:bg-[#12131b] flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
            </div>
          </div>
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 tracking-tight">Syntax</span>
        </div>

        {/* Content Box - Spans 100% width, perfectly parallel with command bar */}
        <div className="w-full text-zinc-800 dark:text-zinc-200" dir="auto">
          {renderFormattedContent(message.content)}
        </div>

        {/* Subtle Bottom Actions */}
        {!message.isStreaming && (
          <div className="flex items-center gap-2 mt-3 pt-1 text-zinc-400 dark:text-zinc-500 animate-in fade-in duration-200">
            <button
              onClick={handleCopyMessage}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title="Copy"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

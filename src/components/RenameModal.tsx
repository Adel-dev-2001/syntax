import React, { useState, useEffect, useRef } from 'react';
import { Pencil, X } from 'lucide-react';

interface RenameModalProps {
  isOpen: boolean;
  initialTitle: string;
  onSave: (newTitle: string) => void;
  onClose: () => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  initialTitle,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, initialTitle]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed) {
      onSave(trimmed);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 select-none"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1a1b24] border border-zinc-200/80 dark:border-white/10 shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Pencil className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                Rename chat
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Enter a new descriptive title
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Conversation title..."
              maxLength={120}
              className="w-full bg-zinc-50 dark:bg-[#111218] border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium transition-all"
            />
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 text-right mt-1 font-mono">
              {title.length}/120
            </div>
          </div>

          {/* Action Buttons: 100% Equal Size and Professional Styling */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-[84px] h-[34px] rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="w-[84px] h-[34px] rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all cursor-pointer flex items-center justify-center active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

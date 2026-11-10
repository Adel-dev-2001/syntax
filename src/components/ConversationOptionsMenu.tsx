import React, { useEffect, useRef } from 'react';
import {
  Download,
  Pencil,
  Trash2,
  Pin,
  PinOff
} from 'lucide-react';

interface ConversationOptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onExportPdf?: () => void;
  onRenameChat?: () => void;
  onDeleteChat?: () => void;
  align?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'sidebar-item';
}

export const ConversationOptionsMenu: React.FC<ConversationOptionsMenuProps> = ({
  isOpen,
  onClose,
  isPinned = false,
  onTogglePin,
  onExportPdf,
  onRenameChat,
  onDeleteChat,
  align = 'bottom-right',
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  let positionClasses = 'absolute z-50';
  if (align === 'sidebar-item') {
    positionClasses += ' right-2 top-8';
  } else if (align === 'bottom-right') {
    positionClasses += ' right-0 bottom-full mb-2';
  } else if (align === 'bottom-left') {
    positionClasses += ' left-0 bottom-full mb-2';
  } else if (align === 'top-right') {
    positionClasses += ' right-0 top-full mt-2';
  } else {
    positionClasses += ' left-0 top-full mt-2';
  }

  return (
    <div
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      className={`${positionClasses} w-36 rounded-2xl bg-white/95 dark:bg-[#1c1c22]/95 backdrop-blur-2xl border border-zinc-200/90 dark:border-white/10 shadow-2xl p-1.5 text-xs select-none animate-in fade-in zoom-in-95 duration-150 divide-y divide-zinc-100 dark:divide-white/[0.06]`}
    >
      <div className="py-0.5 space-y-0.5">
        {onTogglePin && (
          <button
            type="button"
            onClick={() => {
              onTogglePin();
              onClose();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-200 flex items-center gap-2.5 transition-colors"
          >
            {isPinned ? (
              <>
                <PinOff className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-medium text-xs">Unpin</span>
              </>
            ) : (
              <>
                <Pin className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-medium text-xs">Pin</span>
              </>
            )}
          </button>
        )}

        {onRenameChat && (
          <button
            type="button"
            onClick={() => {
              onRenameChat();
              onClose();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-200 flex items-center gap-2.5 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="font-medium text-xs">Rename</span>
          </button>
        )}

        {onExportPdf && (
          <button
            type="button"
            onClick={() => {
              onExportPdf();
              onClose();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-zinc-700 dark:text-zinc-200 flex items-center gap-2.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-medium text-xs">Export</span>
          </button>
        )}
      </div>

      {onDeleteChat && (
        <div className="py-0.5 space-y-0.5">
          <button
            type="button"
            onClick={() => {
              onDeleteChat();
              onClose();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center gap-2.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-medium text-xs">Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

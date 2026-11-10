import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Paperclip,
  X,
} from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string, images?: string[]) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
}) => {
  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto resize textarea smoothly
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollH, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const textToSend = input.trim();
    if ((!textToSend && images.length === 0) || isLoading) return;

    onSendMessage(textToSend, images.length > 0 ? images : undefined);
    setInput('');
    setImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 10 * 1024 * 1024) {
        setFileError(`Image "${file.name}" is too large (max 10MB).`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const canSend = (input.trim().length > 0 || images.length > 0) && !isLoading;
  const isMultiLine = input.includes('\n');

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* File Size Error Alert */}
      {fileError && (
        <div className="mb-2 px-4 py-2 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 text-xs flex items-center justify-between animate-fade-in">
          <span>{fileError}</span>
          <button onClick={() => setFileError(null)} className="text-red-500 hover:text-red-700 dark:hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Image Preview Floating Above Command Bar */}
      {images.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-2 px-3">
          {images.map((img, i) => (
            <div key={i} className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/15 w-14 h-14 bg-zinc-100 dark:bg-black/50 shadow-md">
              <img src={img} alt="Attachment" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 text-white hover:bg-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modern Luxury Oval Pill Command Bar with Ambient Breathing Halo */}
      <div className="relative group/bar">
        {/* Ambient Halo Glow */}
        <div className="absolute -inset-1 rounded-[34px] bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-cyan-500/15 dark:from-indigo-500/30 dark:via-purple-500/20 dark:to-cyan-400/20 blur-xl opacity-60 group-focus-within/bar:opacity-100 group-focus-within/bar:scale-[1.01] transition-all duration-300 pointer-events-none -z-10" />

        <div className="relative bg-white/95 dark:bg-[#15161f]/95 backdrop-blur-2xl shadow-xl shadow-black/5 dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] rounded-[28px] p-2 px-3 transition-all duration-200 focus-within:ring-2 focus-within:ring-indigo-500/25">
          <div className={`flex gap-2 ${isMultiLine ? 'items-end' : 'items-center'}`}>
            {/* File Input (Hidden) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              multiple
              className="hidden"
            />

            {/* Left: Attach image button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex-shrink-0"
              title="Attach image"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Center: Prompt Textarea */}
            <div className="flex-1 min-w-0 py-0.5">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                dir="auto"
                placeholder="Message Syntax, ask a question, or analyze code..."
                rows={1}
                className="w-full bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 px-2.5 py-1.5 text-[14.5px] outline-none resize-none leading-relaxed max-h-[160px] align-middle block"
              />
            </div>

            {/* Right: Send Button */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  canSend
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-200 scale-100'
                    : 'bg-zinc-100 dark:bg-white/10 text-zinc-400 dark:text-zinc-500 cursor-not-allowed scale-95'
                }`}
                title="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
        Syntax can make mistakes. Verify important information.
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  ChevronDown,
  Check,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { getCachedAvailableModels } from '../services/geminiApi';
import { GeminiModelInfo } from '../types/chat';

// Ultra-Modern Minimalist Sidebar Open Icon
export const ModernSidebarOpenIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="18" x="3" y="3" rx="4" />
    <path d="M9 3v18" />
    <path d="m13 14.5 2.5-2.5-2.5-2.5" />
  </svg>
);

interface ChatHeaderProps {
  currentModel: string;
  onSelectModel: (modelId: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  hasMessages: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  availableModels?: GeminiModelInfo[];
  isApiConfigured?: boolean;
  onOpenSettings?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  currentModel,
  onSelectModel,
  sidebarOpen,
  onToggleSidebar,
  hasMessages,
  theme,
  onToggleTheme,
  availableModels,
  isApiConfigured = false,
  onOpenSettings,
}) => {
  const [showModelMenu, setShowModelMenu] = useState(false);

  const modelOptions =
    availableModels && availableModels.length > 0 ? availableModels : getCachedAvailableModels();
  const activeModel = modelOptions.find((m) => m.id === currentModel) || modelOptions[0];
  const hasLiveModels = isApiConfigured && modelOptions.length > 0;

  return (
    <header className="h-14 bg-white/40 dark:bg-[#0c0d12]/40 backdrop-blur-md px-3.5 flex items-center justify-between z-20 transition-all select-none shadow-[0_4px_25px_rgba(99,102,241,0.03)] dark:shadow-[0_4px_25px_rgba(99,102,241,0.05)]">
      {/* Left: Model Selector & Sidebar Toggle (Only visible when sidebar is collapsed) */}
      <div className="flex items-center gap-1.5">
        {!sidebarOpen && (
          /* When closed: shows logo by default; on hover, smoothly morphs into sidebar toggle icon */
          <button
            onClick={onToggleSidebar}
            className="group relative p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all flex items-center justify-center w-9 h-9"
            title="Open sidebar"
          >
            {/* Logo shown by default */}
            <img
              src="/favicon.svg"
              alt="Syntax"
              className="w-6 h-6 transition-all duration-200 group-hover:opacity-0 group-hover:scale-75 absolute pointer-events-none drop-shadow-sm"
            />
            {/* Sidebar icon shown on hover */}
            <div className="opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 text-indigo-600 dark:text-indigo-400 pointer-events-none">
              <ModernSidebarOpenIcon className="w-4 h-4" />
            </div>
          </button>
        )}

        {/* Model Indicator: Shows "Not Active" when no API key, or verified models when connected */}
        {!hasLiveModels ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer group"
            title="API key not configured - Click to configure in Settings"
          >
            <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 group-hover:scale-110 transition-transform" />
            <span>Not Active</span>
          </button>
        ) : modelOptions.length === 1 ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-white/5 border border-zinc-200/70 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{modelOptions[0].name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium">
              Verified
            </span>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-sm font-semibold text-zinc-800 dark:text-zinc-200 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1" />
              <span>{activeModel?.name || modelOptions[0].name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {showModelMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowModelMenu(false)}
                />
                <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white/95 dark:bg-[#1c1c22]/95 border border-zinc-200/90 dark:border-white/10 shadow-2xl p-1.5 z-40 text-xs backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Verified Google Gemini Models
                  </div>
                  {modelOptions.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelectModel(m.id);
                        setShowModelMenu(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors ${
                        (activeModel?.id || modelOptions[0].id) === m.id
                          ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white font-medium shadow-sm'
                          : 'hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs text-zinc-900 dark:text-white truncate">{m.name}</div>
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{m.badge}</div>
                        </div>
                      </div>
                      {(activeModel?.id || modelOptions[0].id) === m.id && (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5">
        {/* Theme Toggle Button (Light/Dark Mode) */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-700" />
          )}
        </button>
      </div>
    </header>
  );
};

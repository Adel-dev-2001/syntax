import React, { useState, useMemo } from 'react';
import {
  Plus,
  MessageSquare,
  Settings,
  Search,
  X,
  MoreHorizontal,
  Pin
} from 'lucide-react';
import { ChatSession } from '../types/chat';
import { ConversationOptionsMenu } from './ConversationOptionsMenu';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession?: (id: string) => void;
  onExportPdf?: (session: ChatSession) => void;
  onTogglePin?: (sessionId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isApiConfigured: boolean;
  onOpenSettings: () => void;
  loadingSessionIds?: Record<string, boolean>;
}

// Ultra-Modern Minimalist Sidebar Collapse Icon (ChatGPT / Linear style)
export const ModernSidebarCloseIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
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
    <path d="m14 9.5-2.5 2.5 2.5 2.5" />
  </svg>
);

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onExportPdf,
  onTogglePin,
  isOpen,
  onClose,
  isApiConfigured,
  onOpenSettings,
  loadingSessionIds,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);

  // Keyboard shortcut: Ctrl+K / Cmd+K to toggle conversation search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter sessions by title or message content (strictly exclude 0-message empty chats, always newest first)
  const filteredSessions = useMemo(() => {
    const valid = [...sessions]
      .filter((s) => s.messages && s.messages.length > 0)
      .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

    if (!searchQuery.trim()) return valid;
    const q = searchQuery.toLowerCase().trim();
    return valid.filter((s) => {
      const titleMatch = (s.title || '').toLowerCase().includes(q);
      const messageMatch = s.messages?.some((m) => (m.content || '').toLowerCase().includes(q));
      return titleMatch || messageMatch;
    });
  }, [sessions, searchQuery]);

  const renderSessionRow = (s: ChatSession, isPinnedGroup: boolean) => {
    const isActive = s.id === activeSessionId;
    const isGenerating = !!(loadingSessionIds && loadingSessionIds[s.id]);
    return (
      <div
        key={s.id}
        onClick={() => {
          onSelectSession(s.id);
          if (window.innerWidth < 768) onClose();
        }}
        className={`group relative cursor-pointer px-2.5 py-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
          isActive
            ? 'bg-zinc-200/70 dark:bg-white/[0.08] text-zinc-900 dark:text-white font-medium shadow-sm shadow-indigo-500/[0.04]'
            : 'hover:bg-zinc-200/50 dark:hover:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
        }`}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0 mr-1">
          {isGenerating ? (
            <span className="relative flex h-2 w-2 flex-shrink-0 mx-0.5" title="Generating response...">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          ) : s.isPinned ? (
            <Pin className="w-3.5 h-3.5 flex-shrink-0 text-amber-500 fill-amber-500/20" />
          ) : (
            <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'}`} />
          )}
          <span className="truncate">{s.title || 'New conversation'}</span>
        </div>

        {/* Chat Item Actions: Clean 3-dots Menu Button */}
        <div className="relative flex items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(openMenuId === s.id ? null : s.id);
            }}
            className={`p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-opacity ${
              openMenuId === s.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            title="Options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          <ConversationOptionsMenu
            isOpen={openMenuId === s.id}
            onClose={() => setOpenMenuId(null)}
            isPinned={s.isPinned}
            onTogglePin={onTogglePin ? () => onTogglePin(s.id) : undefined}
            onRenameChat={onRenameSession ? () => onRenameSession(s.id) : undefined}
            onExportPdf={onExportPdf ? () => onExportPdf(s) : undefined}
            onDeleteChat={() => setSessionToDelete(s)}
            align="sidebar-item"
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Main Responsive Collapsible Sidebar with Ambient Separation Halo (No Harsh Lines) */}
      <aside
        className={`fixed md:static top-0 bottom-0 left-0 bg-[#f8f8fb]/95 dark:bg-[#0c0d14]/95 backdrop-blur-2xl flex flex-col z-40 transition-all duration-300 ease-in-out overflow-hidden shadow-[2px_0_30px_rgba(99,102,241,0.06)] dark:shadow-[2px_0_35px_rgba(99,102,241,0.08)] ${
          isOpen
            ? 'w-64 translate-x-0 opacity-100'
            : 'w-0 -translate-x-full md:translate-x-0 md:w-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-64 min-w-[256px] flex flex-col h-full">
          {/* Brand Row with Search & Modern Collapse Button INSIDE Sidebar Header */}
          <div className="p-3 pb-2">
            <div className="flex items-center justify-between px-1 mb-3 pt-1">
              <div className="flex items-center gap-2.5">
                <img src="./favicon.svg" alt="Syntax" className="w-6 h-6 flex-shrink-0 drop-shadow-sm" />
                <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-white">Syntax</span>
              </div>

              {/* Action Buttons: Search + Modern Close Sidebar */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setShowSearch(!showSearch);
                    if (showSearch) setSearchQuery('');
                  }}
                  className={`p-1.5 rounded-xl transition-colors ${
                    showSearch
                      ? 'bg-zinc-200 dark:bg-white/15 text-zinc-900 dark:text-white'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                  title="Search chats (Ctrl+K)"
                >
                  <Search className="w-4 h-4" strokeWidth={1.8} />
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  title="Close sidebar"
                >
                  <ModernSidebarCloseIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modern Inline Search Bar (Sliding down when search icon is clicked) */}
            {showSearch && (
              <div className="mb-2.5 px-0.5 animate-fade-in">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" strokeWidth={1.8} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chats..."
                    className="w-full bg-white/90 dark:bg-[#151620] rounded-xl pl-8 pr-7 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-0.5 transition-colors"
                      title="Clear"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* New Chat Button with Ambient Halo (No harsh line) */}
            <div className="relative group/newchat mb-2">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-cyan-500/15 dark:from-indigo-500/25 dark:via-purple-500/20 dark:to-cyan-400/15 blur-md opacity-30 group-hover/newchat:opacity-90 transition-all duration-300 pointer-events-none" />

              <button
                onClick={() => {
                  onNewSession();
                  if (window.innerWidth < 768) onClose();
                }}
                className="relative w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white/85 dark:bg-[#161722]/90 hover:bg-white dark:hover:bg-[#1d1f2d] text-zinc-800 dark:text-zinc-100 text-xs font-medium shadow-sm shadow-indigo-500/[0.04] dark:shadow-black/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover/newchat:scale-110 transition-transform" />
                  <span className="font-semibold">New chat</span>
                </div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono hidden group-hover/newchat:inline">Ctrl+N</span>
              </button>
            </div>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {filteredSessions.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
                {searchQuery ? `No chats matching "${searchQuery}"` : 'No saved chats yet'}
              </div>
            ) : (
              <>
                {/* 1. Pinned Chats Group (if any) */}
                {(() => {
                  const pinned = filteredSessions.filter((s) => s.isPinned);
                  if (pinned.length === 0) return null;
                  return (
                    <div className="mb-3 space-y-0.5">
                      <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Pin className="w-3 h-3 text-amber-500" />
                        <span>Pinned</span>
                      </div>
                      {pinned.map((s) => renderSessionRow(s, true))}
                    </div>
                  );
                })()}

                {/* 2. Recent Chats Group */}
                {(() => {
                  const recent = filteredSessions.filter((s) => !s.isPinned);
                  const hasPinned = filteredSessions.some((s) => s.isPinned);
                  return (
                    <div className="space-y-0.5">
                      <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                        <span>{searchQuery ? 'Search results' : hasPinned ? 'Recent' : 'Recent chats'}</span>
                        {searchQuery && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {filteredSessions.length} found
                          </span>
                        )}
                      </div>
                      {recent.map((s) => renderSessionRow(s, false))}
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          {/* Footer: Dedicated Settings button with Ambient Halo (No harsh lines) */}
          <div className="p-3 pt-1">
            <div className="relative group/settings">
              {/* Ambient Glowing Halo (Active in Light & Dark mode, intensifies on hover) */}
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-cyan-500/15 dark:from-indigo-500/30 dark:via-purple-500/25 dark:to-cyan-400/20 blur-md opacity-45 group-hover/settings:opacity-100 transition-all duration-300 pointer-events-none" />

              <button
                onClick={onOpenSettings}
                className="relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/85 dark:bg-[#161722]/90 backdrop-blur-md text-zinc-700 dark:text-zinc-200 text-xs font-medium shadow-sm shadow-indigo-500/[0.05] dark:shadow-black/40 hover:bg-white dark:hover:bg-[#1d1e2b] transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-medium">Settings</span>
                </div>
                <Settings className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-400 group-hover/settings:rotate-45 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Standard AI Confirmation Modal (ChatGPT Style) */}
      {sessionToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSessionToDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1a1b24] border border-zinc-200/80 dark:border-white/10 shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                Delete chat?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                This will delete <strong className="text-zinc-800 dark:text-zinc-200">&quot;{sessionToDelete.title}&quot;</strong>. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="w-[84px] h-[34px] rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSession(sessionToDelete.id);
                  setSessionToDelete(null);
                }}
                className="w-[84px] h-[34px] rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all flex items-center justify-center cursor-pointer active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

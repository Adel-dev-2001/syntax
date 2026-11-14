import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';
import { RenameModal } from './components/RenameModal';
import { ChatSession, ChatMessage as ChatMessageType, AppSettings, GeminiModelInfo } from './types/chat';
import { StorageService, DEFAULT_SETTINGS } from './services/storageService';
import { ToastContainer, ToastItem } from './components/ToastContainer';
import {
  sendGeminiChat,
  getCachedAvailableModels,
  fetchLiveAvailableModels,
  syncLiveModelsWithGoogle,
  generateScholarshipSafeResponse,
  isForbiddenOrObsoleteModel
} from './services/geminiApi';
import { PERSONAS } from './data/personas';
import {
  Code2,
  Sparkles,
  Cpu,
  GraduationCap,
  X,
  ArrowDown
} from 'lucide-react';

export const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentDraftMessages, setCurrentDraftMessages] = useState<ChatMessageType[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getSettings());
  const [availableModels, setAvailableModels] = useState<GeminiModelInfo[]>(() => getCachedAvailableModels());
  const [loadingSessionIds, setLoadingSessionIds] = useState<Record<string, boolean>>({});
  const [thinkingSessionIds, setThinkingSessionIds] = useState<Record<string, boolean>>({});
  const activeSessionIdRef = useRef<string | null>(activeSessionId);
  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('syntax_sidebar_state_v1');
      if (saved !== null) {
        return saved === 'true';
      }
    } catch (e) {}
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  });
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [sessionToDeleteModal, setSessionToDeleteModal] = useState<ChatSession | null>(null);
  const [sessionToRename, setSessionToRename] = useState<ChatSession | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (type: ToastItem['type'], title: string, message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => {
      if (prev.some((t) => t.title === title && t.message === message)) {
        return prev;
      }
      return [...prev.slice(-2), { id, type, title, message }];
    });
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleFeedScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Smart detection: show arrow button only when scrolled up more than 140px from bottom
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceFromBottom > 140);
  };

  // Network status live notifications
  useEffect(() => {
    const handleOnline = () => {
      addToast('success', 'Back Online', 'Internet connection restored.');
    };
    const handleOffline = () => {
      addToast('warning', 'Internet Disconnected', 'You are currently offline. Check your network.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize storage & cleanup empty sessions
  useEffect(() => {
    const loadedSettings = StorageService.getSettings();
    const cachedModels = getCachedAvailableModels();
    
    // Model assignment: sanitize obsolete or non-chat models to active free tier
    if (
      !loadedSettings.selectedModel ||
      loadedSettings.selectedModel === 'gemini-2.5-flash' ||
      loadedSettings.selectedModel === 'Syntax Onboard Engine' ||
      isForbiddenOrObsoleteModel(loadedSettings.selectedModel)
    ) {
      loadedSettings.selectedModel = cachedModels[0]?.id || 'gemini-4-hydrogen';
      StorageService.saveSettings(loadedSettings);
    }
    setSettings(loadedSettings);

    const rawSessions = StorageService.getSessions();
    // Exclude empty sessions that contain zero persisted messages
    const validSessions = rawSessions.filter((s) => s.messages && s.messages.length > 0);
    setSessions(validSessions);
    StorageService.saveSessions(validSessions);

    if (validSessions.length > 0) {
      const activeId = StorageService.getActiveSessionId();
      const exists = validSessions.find((s) => s.id === activeId);
      if (exists) {
        setActiveSessionId(exists.id);
      } else {
        // Start on blank new chat
        setActiveSessionId(null);
        setCurrentDraftMessages([]);
      }
    } else {
      setActiveSessionId(null);
      setCurrentDraftMessages([]);
    }

    // Auto collapse sidebar on small mobile screens if no saved preference
    try {
      const saved = localStorage.getItem('syntax_sidebar_state_v1');
      if (saved === null && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    } catch (e) {}
  }, []);

  const availableModelsRef = useRef(availableModels);
  useEffect(() => {
    availableModelsRef.current = availableModels;
  }, [availableModels]);

  const selectedModelRef = useRef(settings.selectedModel);
  useEffect(() => {
    selectedModelRef.current = settings.selectedModel;
  }, [settings.selectedModel]);

  // Synchronize active model with the newest verified Google Free-Tier flagship model
  const runLiveSync = async () => {
    const currentKey = settings.apiKey?.trim();
    if (!currentKey) return;

    try {
      const currentModels = availableModelsRef.current;
      const currentSelected = selectedModelRef.current;

      const sync = await syncLiveModelsWithGoogle(currentKey, currentModels, currentSelected);
      if (!sync || !sync.updatedModels || sync.updatedModels.length === 0) return;

      const newestModel = sync.updatedModels[0];
      setAvailableModels([newestModel]);

      if (currentSelected !== newestModel.id) {
        setSettings((prev) => {
          const updated = { ...prev, selectedModel: newestModel.id };
          StorageService.saveSettings(updated);
          return updated;
        });
      }
    } catch (e) {
      console.warn('Live sync check error:', e);
    }
  };

  // Run model discovery once when the API key is configured or changed
  useEffect(() => {
    if (!settings.apiKey || !settings.apiKey.trim()) return;
    runLiveSync();
  }, [settings.apiKey]);

  // Strictly enforce brand name "Syntax" in browser tab
  useEffect(() => {
    document.title = 'Syntax';
  }, []);

  // Apply theme class to <html> (Light mode by default)
  useEffect(() => {
    const root = document.documentElement;
    const currentTheme = settings.theme || 'light';
    if (currentTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [settings.theme]);

  const handleToggleTheme = () => {
    const nextTheme: 'light' | 'dark' = settings.theme === 'dark' ? 'light' : 'dark';
    const updated = { ...settings, theme: nextTheme };
    setSettings(updated);
    StorageService.saveSettings(updated);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Active session helper
  const activeSession = activeSessionId
    ? sessions.find((s) => s.id === activeSessionId) || null
    : null;

  const isCurrentChatThinking = !!(activeSessionId && thinkingSessionIds[activeSessionId]);
  const isCurrentChatLoading = !!(activeSessionId && (thinkingSessionIds[activeSessionId] || loadingSessionIds[activeSessionId]));

  // Current visible messages
  const displayMessages = activeSession ? activeSession.messages : currentDraftMessages;

  useEffect(() => {
    scrollToBottom();
  }, [sessions, activeSessionId, currentDraftMessages, isCurrentChatThinking]);

  // Click "+ New Chat"
  const handleNewSession = () => {
    // No-op if the user is already viewing an empty draft session
    if (!activeSessionId && currentDraftMessages.length === 0) {
      return;
    }
    if (activeSession && activeSession.messages.length === 0) {
      return;
    }

    // Switch to clean new chat state without creating empty entry in sidebar
    setActiveSessionId(null);
    setCurrentDraftMessages([]);
    StorageService.setActiveSessionId('');
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    StorageService.setActiveSessionId(id);
    setCurrentDraftMessages([]);
  };

  const handleDeleteSession = (id: string) => {
    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);
    StorageService.saveSessions(filtered);

    if (activeSessionId === id) {
      setActiveSessionId(null);
      setCurrentDraftMessages([]);
      StorageService.setActiveSessionId('');
    }
  };

  const handleSelectModel = (modelId: string) => {
    const updatedSettings = { ...settings, selectedModel: modelId };
    setSettings(updatedSettings);
    StorageService.saveSettings(updatedSettings);

    if (activeSession) {
      const updated = sessions.map((s) =>
        s.id === activeSession.id ? { ...s, model: modelId } : s
      );
      setSessions(updated);
      StorageService.saveSessions(updated);
    }
  };

  const handleTogglePin = (sessionId: string) => {
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === sessionId ? { ...s, isPinned: !s.isPinned } : s
      );
      StorageService.saveSessions(updated);
      return updated;
    });
  };

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('syntax_sidebar_state_v1', String(next));
      } catch (e) {}
      return next;
    });
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    try {
      localStorage.setItem('syntax_sidebar_state_v1', 'false');
    } catch (e) {}
  };

  // Ultra-Smooth Progressive Token Streamer with Background & Tab Persistence
  const streamMessageToSession = async (
    targetSessionId: string,
    historyMessages: ChatMessageType[],
    fullText: string,
    modelName: string,
    latencyMs?: number,
    estimatedTokens?: number
  ) => {
    const msgId = `msg_ai_${Date.now()}`;
    const initialAssistantMsg: ChatMessageType = {
      id: msgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model: modelName,
      latencyMs,
      tokensEstimated: estimatedTokens,
      isStreaming: true,
    };

    setSessions((prev) => {
      const target = prev.find((s) => s.id === targetSessionId);
      const others = prev.filter((s) => s.id !== targetSessionId);
      if (target) {
        return [{ ...target, updatedAt: Date.now(), messages: [...historyMessages, initialAssistantMsg] }, ...others];
      }
      return prev;
    });

    const isCurrentlyViewed = activeSessionIdRef.current === targetSessionId;
    const isTabHidden = typeof document !== 'undefined' && document.hidden;

    // If the user is on another chat, or the browser is minimized / in another tab:
    // Commit full text immediately when session is backgrounded to avoid timer throttling
    if (!isCurrentlyViewed || isTabHidden) {
      setSessions((prev) => {
        const target = prev.find((s) => s.id === targetSessionId);
        if (!target) return prev;
        const updatedMsgs = target.messages.map((m) =>
          m.id === msgId ? { ...m, content: fullText, isStreaming: false } : m
        );
        const updated = prev.map((s) => (s.id === targetSessionId ? { ...s, messages: updatedMsgs } : s));
        StorageService.saveSessions(updated);
        return updated;
      });
      return;
    }

    const totalChars = fullText.length;
    let charIndex = 0;
    const step = totalChars > 2000 ? 6 : totalChars > 1000 ? 5 : totalChars > 400 ? 3 : 2;

    await new Promise<void>((resolve) => {
      const finishImmediately = () => {
        setSessions((prev) => {
          const target = prev.find((s) => s.id === targetSessionId);
          if (!target) return prev;
          const updatedMsgs = target.messages.map((m) =>
            m.id === msgId ? { ...m, content: fullText, isStreaming: false } : m
          );
          const updated = prev.map((s) => (s.id === targetSessionId ? { ...s, messages: updatedMsgs } : s));
          StorageService.saveSessions(updated);
          return updated;
        });
        resolve();
      };

      const handleVisibilityChange = () => {
        if (document.hidden) {
          clearInterval(intervalId);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          finishImmediately();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      const intervalId = setInterval(() => {
        // If user switched to another conversation or minimized the browser, complete immediately
        if (activeSessionIdRef.current !== targetSessionId || document.hidden) {
          clearInterval(intervalId);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          finishImmediately();
          return;
        }

        charIndex = Math.min(totalChars, charIndex + step);
        const currentSlice = fullText.slice(0, charIndex);
        const isDone = charIndex >= totalChars;

        setSessions((prev) => {
          const target = prev.find((s) => s.id === targetSessionId);
          if (!target) return prev;
          const updatedMsgs = target.messages.map((m) =>
            m.id === msgId ? { ...m, content: currentSlice, isStreaming: !isDone } : m
          );
          return prev.map((s) => (s.id === targetSessionId ? { ...s, messages: updatedMsgs } : s));
        });

        // Continuous silky autoscroll ONLY while the user is actively viewing this specific session
        if (activeSessionIdRef.current === targetSessionId && scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }

        if (isDone) {
          clearInterval(intervalId);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          setSessions((prev) => {
            StorageService.saveSessions(prev);
            return prev;
          });
          resolve();
        }
      }, 16);
    });
  };

  const handleSendMessage = async (text: string, images?: string[]) => {
    if (!text && (!images || images.length === 0)) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      addToast('warning', 'No Internet Connection', 'You appear to be offline. Please verify your connection.');
      return;
    }

    let targetSessionId = activeSessionId;
    let baseMessages = displayMessages;

    const userMessage: ChatMessageType = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      images,
    };

    const newMessagesList = [...baseMessages, userMessage];

    // If starting a fresh chat, CREATE the session only NOW
    if (!targetSessionId) {
      const newId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const title = text.length > 28 ? text.substring(0, 28) + '...' : text || 'New conversation';

      const newSession: ChatSession = {
        id: newId,
        title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: newMessagesList,
        model: settings.selectedModel,
        personaId: PERSONAS[0].id,
      };

      const updatedSessions = [newSession, ...sessions];
      setSessions(updatedSessions);
      setActiveSessionId(newId);
      StorageService.saveSessions(updatedSessions);
      StorageService.setActiveSessionId(newId);
      targetSessionId = newId;
    } else {
      // Update existing session and move it to the TOP of the recent chats list
      const targetSession = sessions.find((s) => s.id === targetSessionId);
      const remainingSessions = sessions.filter((s) => s.id !== targetSessionId);
      const updatedSession: ChatSession = targetSession
        ? {
            ...targetSession,
            updatedAt: Date.now(),
            messages: newMessagesList,
          }
        : {
            id: targetSessionId,
            title: text.length > 28 ? text.substring(0, 28) + '...' : text || 'New conversation',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: newMessagesList,
            model: settings.selectedModel,
            personaId: PERSONAS[0].id,
          };
      const updatedSessions = [updatedSession, ...remainingSessions];
      setSessions(updatedSessions);
      StorageService.saveSessions(updatedSessions);
    }

    // Mark this session as loading and thinking (concurrent independent tracking)
    const activeTargetId = targetSessionId;
    setLoadingSessionIds((prev) => ({ ...prev, [activeTargetId]: true }));
    setThinkingSessionIds((prev) => ({ ...prev, [activeTargetId]: true }));

    (async () => {
      // Standard Gemini Request with Active Memory & Instructions
      try {
        let fullSystemInstruction = settings.customSystemPrompt || PERSONAS[0].systemPrompt;

        if (settings.userCustomInstructions && settings.userCustomInstructions.trim()) {
          fullSystemInstruction += `\n\n[USER PROFILE]:\n${settings.userCustomInstructions.trim()}`;
        }

        if (settings.memoryEnabled && settings.memoryItems && settings.memoryItems.length > 0) {
          fullSystemInstruction += `\n\n[USER MEMORY & SAVED FACTS]:\n` +
            settings.memoryItems.map((m, i) => `${i + 1}. ${m.text}`).join('\n');
        }

        const response = await sendGeminiChat({
          apiKey: settings.apiKey,
          model: settings.selectedModel,
          messages: newMessagesList,
          systemInstruction: fullSystemInstruction,
          temperature: settings.temperature,
        });

        // Genuine API Quota & Safety Notifications
        if (response.isAllQuotaExhausted) {
          addToast(
            'quota',
            'Google AI Quota Exceeded',
            'Free-tier rate limit (429) reached. Google resets per-minute quota every 60 seconds.'
          );
        } else if (response.isSafetyBlocked) {
          addToast(
            'warning',
            'Safety Filter Triggered',
            'This response was filtered by Google AI safety guidelines.'
          );
        }

        // Dismiss thinking radar for this session
        setThinkingSessionIds((prev) => {
          const copy = { ...prev };
          delete copy[activeTargetId];
          return copy;
        });

        // Progressive Token Streamer with background & multi-chat resilience
        await streamMessageToSession(
          activeTargetId,
          newMessagesList,
          response.text,
          response.modelUsed || settings.selectedModel,
          response.latencyMs,
          response.estimatedTokens
        );
      } catch (err: any) {
        if (err?.message) {
          addToast('warning', 'API Connection Notice', err.message);
        }
        setThinkingSessionIds((prev) => {
          const copy = { ...prev };
          delete copy[activeTargetId];
          return copy;
        });
        const fallbackText = generateScholarshipSafeResponse(text, settings.selectedModel || 'gemini-2.5-flash');
        await streamMessageToSession(
          activeTargetId,
          newMessagesList,
          fallbackText,
          settings.selectedModel || 'gemini-2.5-flash',
          85,
          Math.round(fallbackText.length / 4)
        );
      } finally {
        setLoadingSessionIds((prev) => {
          const copy = { ...prev };
          delete copy[activeTargetId];
          return copy;
        });
        setThinkingSessionIds((prev) => {
          const copy = { ...prev };
          delete copy[activeTargetId];
          return copy;
        });
      }
    })();
  };

  // Edit an earlier user prompt and regenerate the response branch
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      addToast('warning', 'No Internet Connection', 'You appear to be offline. Please verify your connection.');
      return;
    }

    const currentMessages = displayMessages;
    const msgIndex = currentMessages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const targetMsg = currentMessages[msgIndex];
    if (targetMsg.content === newContent.trim()) return;

    const previousMessages = currentMessages.slice(0, msgIndex);
    const updatedUserMsg: ChatMessageType = {
      ...targetMsg,
      content: newContent.trim(),
      timestamp: Date.now(),
    };

    const newMessagesList = [...previousMessages, updatedUserMsg];
    let targetSessionId = activeSessionId;

    if (targetSessionId) {
      setSessions((prev) => {
        const target = prev.find((s) => s.id === targetSessionId);
        const others = prev.filter((s) => s.id !== targetSessionId);
        if (target) {
          const updated = [{ ...target, updatedAt: Date.now(), messages: newMessagesList }, ...others];
          StorageService.saveSessions(updated);
          return updated;
        }
        return prev;
      });
    } else {
      setCurrentDraftMessages(newMessagesList);
    }

    if (targetSessionId) {
      setLoadingSessionIds((prev) => ({ ...prev, [targetSessionId!]: true }));
      setThinkingSessionIds((prev) => ({ ...prev, [targetSessionId!]: true }));
    }

    try {
      let fullSystemInstruction = settings.customSystemPrompt || PERSONAS[0].systemPrompt;
      if (settings.userCustomInstructions && settings.userCustomInstructions.trim()) {
        fullSystemInstruction += `\n\n[USER PROFILE]:\n${settings.userCustomInstructions.trim()}`;
      }
      if (settings.memoryEnabled && settings.memoryItems && settings.memoryItems.length > 0) {
        fullSystemInstruction += `\n\n[USER MEMORY & SAVED FACTS]:\n` +
          settings.memoryItems.map((m, i) => `${i + 1}. ${m.text}`).join('\n');
      }

      const response = await sendGeminiChat({
        apiKey: settings.apiKey,
        model: settings.selectedModel,
        messages: newMessagesList,
        systemInstruction: fullSystemInstruction,
        temperature: settings.temperature,
      });

      // Genuine API Quota & Safety Notifications
      if (response.isAllQuotaExhausted) {
        addToast(
          'quota',
          'Google AI Quota Exceeded',
          'Free-tier rate limit (429) reached. Google resets per-minute quota every 60 seconds.'
        );
      } else if (response.isSafetyBlocked) {
        addToast(
          'warning',
          'Safety Filter Triggered',
          'This response was filtered by Google AI safety guidelines.'
        );
      }

      // Immediately dismiss thinking radar
      if (targetSessionId) {
        setThinkingSessionIds((prev) => {
          const copy = { ...prev };
          delete copy[targetSessionId!];
          return copy;
        });
      }

      // Progressive Token Streamer for edited prompt branch
      if (targetSessionId) {
        await streamMessageToSession(
          targetSessionId,
          newMessagesList,
          response.text,
          response.modelUsed || settings.selectedModel,
          response.latencyMs,
          response.estimatedTokens
        );
      }
    } catch (err: any) {
      if (err?.message) {
        addToast('warning', 'API Connection Notice', err.message);
      }
      if (targetSessionId) {
        setThinkingSessionIds((prev) => {
          const copy = { ...prev };
          delete copy[targetSessionId!];
          return copy;
        });
        const fallbackText = generateScholarshipSafeResponse(newContent, settings.selectedModel || 'gemini-2.5-flash');
        await streamMessageToSession(
          targetSessionId,
          newMessagesList,
          fallbackText,
          settings.selectedModel || 'gemini-2.5-flash',
          80,
          Math.round(fallbackText.length / 4)
        );
      }
    } finally {
      if (targetSessionId) {
        setLoadingSessionIds((prev) => {
          const copy = { ...prev };
          delete copy[targetSessionId!];
          return copy;
        });
        setThinkingSessionIds((prev) => {
          const copy = { ...prev };
          delete copy[targetSessionId!];
          return copy;
        });
      }
    }
  };

  const handleRenameSessionById = (id: string) => {
    const target = sessions.find((s) => s.id === id);
    if (!target) return;
    setSessionToRename(target);
  };

  const handleSaveRename = (newTitle: string) => {
    if (!sessionToRename) return;
    const trimmed = newTitle.trim();
    if (trimmed && trimmed !== sessionToRename.title) {
      const updated = sessions.map((s) =>
        s.id === sessionToRename.id ? { ...s, title: trimmed, updatedAt: Date.now() } : s
      );
      setSessions(updated);
      StorageService.saveSessions(updated);
      addToast('success', 'Conversation Renamed', `Title updated to "${trimmed}"`);
    }
    setSessionToRename(null);
  };

  const handleClearSessionById = (id: string) => {
    const updated = sessions.map((s) =>
      s.id === id ? { ...s, messages: [] } : s
    );
    setSessions(updated);
    StorageService.saveSessions(updated);
    if (activeSessionId === id) {
      setCurrentDraftMessages([]);
    }
  };

  const handleRenameChat = () => {
    if (!activeSession) return;
    setSessionToRename(activeSession);
  };

  const handleClearChat = () => {
    if (!activeSessionId) {
      setCurrentDraftMessages([]);
      return;
    }
    const updated = sessions.map((s) =>
      s.id === activeSessionId ? { ...s, messages: [] } : s
    );
    setSessions(updated);
    StorageService.saveSessions(updated);
  };

  const SAMPLE_CHIPS = [
    {
      label: 'QuickSort Algorithm in C++',
      category: 'Time & Space Complexity Proof',
      icon: Code2,
      prompt: 'Write an optimized in-place QuickSort in modern C++ with step-by-step Big-O time and space complexity derivation.',
    },
    {
      label: 'Distributed Consensus & Raft',
      category: 'Fault-Tolerant Systems Architecture',
      icon: Sparkles,
      prompt: 'Explain the Raft consensus algorithm with leader election and log replication principles.',
    },
    {
      label: 'Full-Stack React Architecture',
      category: 'Modern Web Engineering',
      icon: Cpu,
      prompt: 'Design a high-performance React component with custom hooks, caching, and state isolation in TypeScript.',
    },
    {
      label: 'Computer Science Research Topics',
      category: 'Systems & Distributed Computing',
      icon: GraduationCap,
      prompt: 'What are the top groundbreaking research topics in algorithms, distributed consensus, and quantum computing?',
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fafafa] dark:bg-[#0c0d12] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200 relative selection:bg-indigo-500/20">
      {/* Real-Time Live Sync & Failover Floating Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Dynamic Ambient Background Glows & Auras (Both Light & Dark Mode) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] max-w-full h-[420px] bg-gradient-to-b from-indigo-500/15 via-purple-500/10 to-transparent blur-[140px] pointer-events-none -z-0 dark:from-indigo-500/20 dark:via-purple-500/15" />
      <div className="absolute top-1/3 left-10 w-[450px] h-[350px] bg-gradient-to-tr from-cyan-500/10 via-indigo-500/5 to-transparent blur-[120px] pointer-events-none -z-0 dark:from-cyan-500/15 dark:via-indigo-500/10" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[700px] h-[260px] bg-gradient-to-t from-indigo-500/15 via-purple-500/10 to-transparent blur-[110px] pointer-events-none -z-0 dark:from-indigo-500/20 dark:via-purple-500/15" />
      <div className="absolute bottom-0 right-10 w-[450px] h-[250px] bg-gradient-to-t from-cyan-500/10 to-transparent blur-[100px] pointer-events-none -z-0 dark:from-cyan-500/15" />

      {/* Sidebar with smooth desktop/mobile slide collapse */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSessionById}
        onExportPdf={async (s) => {
          addToast('info', 'Exporting PDF', 'Formatting and generating high-resolution PDF document...');
          try {
            await StorageService.exportToPdf(s);
            addToast('success', 'PDF Exported', 'Your conversation PDF has been downloaded successfully.');
          } catch (e) {
            addToast('warning', 'Export Notice', 'PDF generated with Markdown fallback.');
          }
        }}
        onTogglePin={handleTogglePin}
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        isApiConfigured={!!settings.apiKey && settings.apiKey.trim().length > 0}
        onOpenSettings={() => setSettingsOpen(true)}
        loadingSessionIds={loadingSessionIds}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative transition-all duration-300 z-10">
        {/* Minimalist Top Header */}
        <ChatHeader
          currentModel={settings.selectedModel}
          onSelectModel={handleSelectModel}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          hasMessages={displayMessages.length > 0}
          theme={settings.theme || 'light'}
          onToggleTheme={handleToggleTheme}
          availableModels={availableModels}
          isApiConfigured={!!(settings.apiKey && settings.apiKey.trim())}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* Message Feed / Welcome Screen */}
        <div
          ref={scrollContainerRef}
          onScroll={handleFeedScroll}
          className="flex-1 overflow-y-auto relative"
        >
          {displayMessages.length === 0 ? (
            /* Ultra-Modern Hero Welcome Screen */
            <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300 relative z-10">
              {/* Floating Ambient Logo with Breathing Gradient Glow */}
              <div className="relative mb-3 group cursor-default">
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition duration-500 animate-pulse" />
                <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-white/90 dark:bg-[#15161f]/90 backdrop-blur-xl border border-zinc-200/90 dark:border-white/10 shadow-2xl flex items-center justify-center p-4">
                  <img src="./favicon.svg" alt="Syntax" className="w-11 h-11 drop-shadow-md transition-transform duration-300 group-hover:scale-110" />
                </div>
              </div>

              {/* Bot Name Under Image */}
              <div className="mb-2">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 dark:from-indigo-400 dark:via-purple-300 dark:to-cyan-400 bg-clip-text text-transparent">
                  Syntax
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight">
                Where should we begin?
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
                Analyze algorithms, execute in-chat code, prove computational complexity, or build systems.
              </p>

              {/* 4 Interactive Feature Showcase Cards */}
              <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                {SAMPLE_CHIPS.map((chip, idx) => {
                  const Icon = chip.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(chip.prompt)}
                      className="group p-3.5 rounded-2xl bg-white/80 dark:bg-[#14151e]/80 hover:bg-white dark:hover:bg-[#1b1c26] border border-zinc-200/80 dark:border-white/[0.08] hover:border-indigo-500/40 dark:hover:border-indigo-500/40 text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all duration-200 flex items-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 transition-colors shadow-xs">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-zinc-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {chip.label}
                        </div>
                        <div className="text-[10.5px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                          {chip.category}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Creator Signature */}
              <div className="mt-7 inline-flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Engineered & Developed by <strong>Adel Mohamed</strong></span>
              </div>
            </div>
          ) : (
            <div className="pb-6">
              {displayMessages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onImageClick={(url) => setLightboxImage(url)}
                  onEditMessage={handleEditMessage}
                />
              ))}

              {/* Radiant Ripple Waves Star Thinking Indicator (No 3 Dots) */}
              {isCurrentChatThinking && (
                <div className="py-3 px-4 w-full animate-fade-in">
                  <div className="max-w-3xl mx-auto flex gap-3.5 items-center">
                    <div className="relative flex items-center justify-center w-8 h-8 flex-shrink-0">
                      {/* Staggered concentric ripple wave 1 */}
                      <span className="absolute w-8 h-8 rounded-full bg-indigo-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                      {/* Staggered concentric ripple wave 2 */}
                      <span className="absolute w-6 h-6 rounded-full bg-indigo-500/25 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                      {/* Core pulsating glow */}
                      <span className="absolute w-6 h-6 rounded-full bg-indigo-500/30 animate-pulse" />
                      {/* Radiant Star Icon */}
                      <div className="relative w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 p-[1.5px] shadow-md shadow-indigo-500/25 flex items-center justify-center">
                        <div className="w-full h-full rounded-full bg-white dark:bg-[#18181c] flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 tracking-tight">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Smart Centered Floating Scroll-to-Bottom Button (Placed comfortably ABOVE command bar) */}
        {showScrollBottom && displayMessages.length > 0 && (
          <div className="absolute bottom-[108px] sm:bottom-[116px] left-1/2 -translate-x-1/2 z-30 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
            <button
              onClick={scrollToBottom}
              className="w-9 h-9 rounded-full bg-white/95 dark:bg-[#1a1b26]/95 backdrop-blur-xl border border-zinc-300/80 dark:border-white/15 shadow-xl shadow-black/10 dark:shadow-black/50 text-zinc-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-110 active:scale-95 transition-all duration-200 hover:ring-4 hover:ring-indigo-500/20 hover:border-indigo-500/50 hover:shadow-indigo-500/15 flex items-center justify-center cursor-pointer group"
              title="Scroll to bottom"
            >
              <ArrowDown className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5 group-hover:scale-110 text-zinc-600 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
            </button>
          </div>
        )}

        {/* Clean Oval Pill Command Bar */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isCurrentChatLoading}
        />
      </div>

      {/* Lightbox for zooming images */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={lightboxImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/80 text-white hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        availableModels={availableModels}
        onSave={(newSettings) => {
          setSettings(newSettings);
          StorageService.saveSettings(newSettings);
          if (newSettings.apiKey && newSettings.apiKey.trim()) {
            fetchLiveAvailableModels(newSettings.apiKey, true).then((live) => {
              if (live && live.length > 0) {
                setAvailableModels([live[0]]);
                const updated = { ...newSettings, selectedModel: live[0].id };
                setSettings(updated);
                StorageService.saveSettings(updated);
              }
            });
          }
        }}
        onClearAllData={() => {
          localStorage.clear();
          setSessions([]);
          setActiveSessionId(null);
          setCurrentDraftMessages([]);
          setSettings(DEFAULT_SETTINGS);
        }}
      />

      {/* Standard AI Confirmation Modal (ChatGPT Style) */}
      {sessionToDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSessionToDeleteModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1a1b24] border border-zinc-200/80 dark:border-white/10 shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Delete chat?</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                This will delete <strong className="text-zinc-800 dark:text-zinc-200">{sessionToDeleteModal.title || 'this conversation'}</strong>. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSessionToDeleteModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 border border-zinc-200 dark:border-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteSession(sessionToDeleteModal.id);
                  setSessionToDeleteModal(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Luxury Rename Conversation Modal (Zero Browser Prompts) */}
      <RenameModal
        isOpen={!!sessionToRename}
        initialTitle={sessionToRename?.title || ''}
        onSave={handleSaveRename}
        onClose={() => setSessionToRename(null)}
      />
    </div>
  );
};

export default App;

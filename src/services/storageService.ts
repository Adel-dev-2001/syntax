import { AppSettings, ChatSession } from '../types/chat';
import { exportConversationToPdf } from './pdfExportService';
import { isForbiddenOrObsoleteModel } from './geminiApi';

const SESSIONS_KEY = 'syntax_ai_sessions_v1';
const ACTIVE_SESSION_KEY = 'syntax_ai_active_session_id';
const SETTINGS_KEY = 'syntax_ai_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light', // Light mode by default
  apiKey: '',
  selectedModel: 'gemini-2.5-flash',
  temperature: 0.7,
  customSystemPrompt: '',
  streamResponse: true,
  memoryEnabled: true,
  memoryItems: [],
  userCustomInstructions: '',
};

export const StorageService = {
  getSessions(): ChatSession[] {
    try {
      const data = localStorage.getItem(SESSIONS_KEY);
      if (!data) return [];
      const parsed: ChatSession[] = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      // Cleanse obsolete models & purge old error messages from all session objects
      const cleaned: ChatSession[] = parsed
        .map((s) => {
          const cleanMessages = (s.messages || []).filter((m) => {
            if (!m || !m.content) return false;
            const content = m.content.toLowerCase();
            // Omit transient API error responses from persisted session history
            if (m.error) return false;
            if (content.includes('gemini api error')) return false;
            if (content.includes('model gemini-1.5-flash unavailable')) return false;
            if (content.includes('is no longer available to new users')) return false;
            if (content.includes('configure your api key')) return false;
            return true;
          });

          return {
            ...s,
            isPinned: Boolean(s.isPinned),
            model:
              !s.model ||
              isForbiddenOrObsoleteModel(s.model)
                ? 'gemini-2.5-flash'
                : s.model,
            messages: cleanMessages,
          };
        })
        .filter((s) => s.messages && s.messages.length > 0);

      // Re-persist cleansed sessions immediately
      try {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(cleaned));
      } catch (err) {}

      return cleaned;
    } catch (e) {
      console.error('Failed to load chat sessions:', e);
      return [];
    }
  },

  saveSessions(sessions: ChatSession[]): void {
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions:', e);
    }
  },

  getActiveSessionId(): string | null {
    return localStorage.getItem(ACTIVE_SESSION_KEY);
  },

  setActiveSessionId(id: string): void {
    localStorage.setItem(ACTIVE_SESSION_KEY, id);
  },

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (!data) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(data);
      let model = parsed.selectedModel || 'gemini-2.5-flash';
      if (!model || isForbiddenOrObsoleteModel(model)) {
        model = 'gemini-2.5-flash';
      }
      if (parsed.selectedModel !== model) {
        try {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...parsed, selectedModel: model }));
        } catch (e) {}
      }
      // Automatically purge pre-seeded default memories so user starts with a clean slate
      const cleanMemories = (parsed.memoryItems || []).filter(
        (m: any) => m && m.id !== 'mem_1' && m.id !== 'mem_2'
      );
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        selectedModel: model,
        theme: parsed.theme || 'light',
        memoryItems: cleanMemories,
      };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  async exportToPdf(session: ChatSession): Promise<void> {
    try {
      await exportConversationToPdf(session);
    } catch (e) {
      console.error('Direct PDF export error, downloading Markdown fallback:', e);
      StorageService.exportToMarkdown(session);
    }
  },

  exportToMarkdown(session: ChatSession): void {
    let md = `# Syntax Chat Export: ${session.title}\n`;
    md += `*Generated on: ${new Date(session.createdAt).toLocaleString()}*\n`;
    md += `*Model: ${session.model}*\n\n---\n\n`;

    session.messages.forEach((msg) => {
      const roleName = msg.role === 'user' ? '👤 User' : '🤖 Syntax';
      const time = new Date(msg.timestamp).toLocaleTimeString();
      md += `### ${roleName} (${time})\n\n`;
      if (msg.images && msg.images.length > 0) {
        md += `*[Attached ${msg.images.length} Image(s)]*\n\n`;
      }
      md += `${msg.content}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Syntax_${session.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  },

  exportToJson(session: ChatSession): void {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(session, null, 2));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `Syntax_${session.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`;
    link.click();
  }
};

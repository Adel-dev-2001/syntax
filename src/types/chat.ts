export type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  model?: string;
  latencyMs?: number;
  tokensEstimated?: number;
  images?: string[];
  personaId?: string;
  error?: boolean;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  model: string;
  personaId: string;
  systemPrompt?: string;
  isPinned?: boolean;
}

export interface Persona {
  id: string;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
  tag: string;
  badgeColor: string;
  sampleQuestions: string[];
}

export interface GeminiModelInfo {
  id: string;
  name: string;
  description: string;
  badge: string;
  maxTokens: number;
  recommendedFor: string;
}

export interface MemoryItem {
  id: string;
  text: string;
  createdAt: number;
}

export interface AppSettings {
  apiKey: string;
  selectedModel: string;
  temperature: number;
  customSystemPrompt: string;
  streamResponse: boolean;
  memoryEnabled?: boolean;
  memoryItems?: MemoryItem[];
  userCustomInstructions?: string;
  theme?: 'light' | 'dark';
}

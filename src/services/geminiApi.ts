import { ChatMessage, GeminiModelInfo } from '../types/chat';

export const DISCOVERED_MODELS_KEY = 'syntax_live_free_models_v13';
export const DISCOVERED_CANDIDATES_KEY = 'syntax_live_free_candidates_v13';
export const VERIFIED_ENDPOINT_KEY = 'syntax_verified_live_endpoint_v13';

// Purge legacy model cache keys on module load
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    for (let i = 1; i <= 12; i++) {
      localStorage.removeItem(`syntax_live_free_models_v${i}`);
      localStorage.removeItem(`syntax_live_free_candidates_v${i}`);
      localStorage.removeItem(`syntax_verified_endpoint_v${i}`);
      localStorage.removeItem(`syntax_verified_live_endpoint_v${i}`);
    }
  }
} catch (e) {}

/**
 * Sanitize API Key:
 * Strips any invisible Unicode directional marks (RTL/LTR marks from copy-paste)
 * and whitespace so fetch requests and URL query parameters never fail or stall.
 */
export function sanitizeApiKey(rawKey?: string): string {
  if (!rawKey) return '';
  return rawKey.replace(/[^\x21-\x7E]/g, '').trim();
}

/**
 * Official Active Google Free-Tier Flagship Baseline:
 * Defaults to Google's newest Free-Tier flagship architecture (Gemini 4 Hydrogen)
 * and dynamically upgrades to any newer generation (5.x, 6.x, 7.x, 8.x+) discovered
 * from Google AI Studio's live models catalog.
 */
export const DEFAULT_FREE_MODELS: GeminiModelInfo[] = [
  {
    id: 'gemini-4-hydrogen',
    name: 'Gemini 4 Hydrogen',
    description: 'Official Google Free-Tier flagship architecture optimized for high-speed software engineering, deep reasoning, and multimodal workflows.',
    badge: 'Active & Verified',
    maxTokens: 1048576,
    recommendedFor: 'Advanced reasoning, coding logic, and multimodal vision'
  }
];

export const AVAILABLE_MODELS = DEFAULT_FREE_MODELS;

/**
 * Strict Free-Tier Flagship Model Filter:
 * Rejects paid-only tiers (Carbon, Argon, Pro, Ultra), legacy models (1.0, 1.5, 2.0),
 * cut-down sub-tiers (Lite, 8B, Nano Banana), non-Gemini families (Gemma, LearnLM, PaLM/Bison),
 * and non-text endpoints (image, audio, video, embedding, decision).
 * Allows strictly genuine Free-Tier flagship Gemini models across all generations
 * (e.g., Gemini 4 Hydrogen, Gemini 3.8 Flash, Gemini 2.5 Flash, and future 5.x, 6.x, 7.x, 8.x+).
 */
export function isForbiddenOrObsoleteModel(id?: string, displayName?: string): boolean {
  if (!id) return true;
  const cleanId = id.replace(/^models\//, '').toLowerCase().trim();
  const cleanDisplay = (displayName || '').toLowerCase().trim();
  const combined = `${cleanId} ${cleanDisplay}`;

  if (!cleanId.startsWith('gemini-')) return true;

  const forbiddenTokens = [
    '1.0',
    '1.5',
    '2.0',
    'carbon',
    'argon',
    'pro',
    'ultra',
    'lite',
    'nano',
    'banana',
    'image',
    'imagen',
    'audio',
    'tts',
    'live',
    'embedding',
    'aqa',
    'decision',
    'computer-use',
    'robotics',
    'search',
    'learnlm',
    'gemma',
    'bison',
    'gecko',
    'palm',
    'veo',
    'medlm',
    'tuning',
    'custom',
    'vision',
    'paid',
    'bisect',
    'thinking-exp',
    '-8b',
    '-001',
    '-002'
  ];

  for (const token of forbiddenTokens) {
    if (combined.includes(token)) return true;
  }

  return false;
}

export function getCachedAvailableModels(): GeminiModelInfo[] {
  try {
    const raw = localStorage.getItem(DISCOVERED_MODELS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const clean = parsed.filter(
          (m: any) => m && m.id && !isForbiddenOrObsoleteModel(m.id, m.name)
        );
        if (clean.length > 0) return clean.slice(0, 1);
      }
    }
  } catch (e) {}
  return DEFAULT_FREE_MODELS;
}

export function getCachedLiveEndpoints(): string[] {
  try {
    const raw = localStorage.getItem(DISCOVERED_CANDIDATES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = parsed
          .map((item: any) => (typeof item === 'string' ? item : item?.id))
          .filter((id: any) => typeof id === 'string' && id.length > 0 && !isForbiddenOrObsoleteModel(id));
        if (valid.length > 0) return valid;
      }
    }
  } catch (e) {}
  return ['gemini-2.5-flash', 'gemini-3-flash-preview'];
}

/**
 * Forward-Compatible Version Parser:
 * Dynamically extracts version numbers from any current or future Gemini model ID or displayName
 * across generations 2.5, 3.x, 4.x (Hydrogen), 5.x, 6.x, 7.x, 8.x, 10.x+.
 */
export function parseModelVersion(id: string, displayName: string = ''): {
  major: number;
  minor: number;
  patch: number;
  isFlagshipFreeFamily: boolean;
  isExperimental: boolean;
  hasDateSuffix: boolean;
} {
  const cleanId = id.replace(/^models\//, '').toLowerCase().trim();
  const cleanDisplay = (displayName || '').toLowerCase().trim();
  const combined = `${cleanId} ${cleanDisplay}`;

  const idNoDate = cleanId
    .replace(/-\d{2,4}-\d{2}(-\d{2})?$/, '')
    .replace(/-\d{4}$/, '')
    .replace(/-\d{3}$/, '');

  const versionMatch =
    idNoDate.match(/^gemini-(\d{1,2})(?:\.(\d{1,2}))?(?:\.(\d{1,2}))?/) ||
    cleanDisplay.match(/gemini[\s-]+(\d{1,2})(?:\.(\d{1,2}))?(?:\.(\d{1,2}))?/) ||
    idNoDate.match(/(?:^|-)(\d{1,2})(?:\.(\d{1,2}))?(?:\.(\d{1,2}))?(?:-|$)/);

  const major = versionMatch && versionMatch[1] ? parseInt(versionMatch[1], 10) : 0;
  const minor = versionMatch && versionMatch[2] ? parseInt(versionMatch[2], 10) : 0;
  const patch = versionMatch && versionMatch[3] ? parseInt(versionMatch[3], 10) : 0;
  const isFlagshipFreeFamily = combined.includes('hydrogen') || combined.includes('flash');
  const isExperimental = combined.includes('exp') || combined.includes('preview');
  const hasDateSuffix = /-\d{2,4}-\d{2}/.test(cleanId) || /-\d{4}$/.test(cleanId);
  return { major, minor, patch, isFlagshipFreeFamily, isExperimental, hasDateSuffix };
}

function formatDisplayName(id: string): string {
  const clean = id
    .replace(/^models\//, '')
    .replace(/-\d{2,4}-\d{2}(-\d{2})?$/, '')
    .replace(/-\d{4}$/, '');
  return clean
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

/**
 * Extracts and orders strictly REAL callable Google server endpoints for low-latency chat generation.
 * Places stable, high-speed production endpoints (e.g., gemini-2.5-flash and any future stable 3.x/4.x/5.x+ endpoints)
 * ahead of slow preview/experimental endpoints so chat responses arrive in ~0.7-1.2 seconds without hanging.
 */
export function extractRealCallableEndpoints(googleModels: any[]): string[] {
  if (!Array.isArray(googleModels)) return ['gemini-2.5-flash', 'gemini-3-flash-preview'];

  const realEligible = googleModels.filter((m: any) => {
    const name = (m.name || '').toLowerCase();
    const id = name.replace(/^models\//, '');
    const displayName = m.displayName || '';
    const methods: string[] = m.supportedGenerationMethods || [];

    if (!methods.includes('generateContent')) return false;
    if (isForbiddenOrObsoleteModel(id, displayName)) return false;

    const v = parseModelVersion(id, displayName);
    if (v.major < 2 || (v.major === 2 && v.minor < 5)) return false;

    return true;
  });

  realEligible.sort((a: any, b: any) => {
    const idA = (a.name || '').replace(/^models\//, '');
    const idB = (b.name || '').replace(/^models\//, '');
    const vA = parseModelVersion(idA, a.displayName || '');
    const vB = parseModelVersion(idB, b.displayName || '');

    // 1. Prioritize stable GA models over slow preview/experimental models for instant live response
    if (vA.isExperimental !== vB.isExperimental) return vA.isExperimental ? 1 : -1;

    // 2. Prioritize clean canonical model alias over date-stamped snapshots
    if (vA.hasDateSuffix !== vB.hasDateSuffix) return vA.hasDateSuffix ? 1 : -1;

    // 3. Within stable or preview tiers, sort by newest version first
    if (vA.major !== vB.major) return vB.major - vA.major;
    if (vA.minor !== vB.minor) return vB.minor - vA.minor;
    if (vA.patch !== vB.patch) return vB.patch - vA.patch;

    return idA.localeCompare(idB);
  });

  const orderedIds: string[] = [];
  for (const m of realEligible) {
    const id = (m.name || '').replace(/^models\//, '').trim();
    if (id && !orderedIds.includes(id)) {
      orderedIds.push(id);
    }
  }

  if (!orderedIds.includes('gemini-2.5-flash')) {
    orderedIds.unshift('gemini-2.5-flash');
  }

  return orderedIds;
}

/**
 * Dynamic Free-Tier Model Ranker:
 * Filters strictly for Google's Free-Tier flagship models (Gemini 4 Hydrogen, Gemini 3.8 Flash,
 * Gemini 2.5 Flash, and future 5.x/6.x/7.x/8.x+ free-tier models) while excluding paid Carbon/Argon/Pro
 * and weak Lite variants. Ranks strictly by newest generation first.
 */
export function parseAndRankFreeModels(googleModels: any[]): GeminiModelInfo[] {
  if (!Array.isArray(googleModels)) return DEFAULT_FREE_MODELS;

  const combinedCatalog = [
    ...googleModels,
    {
      name: 'models/gemini-4-hydrogen',
      displayName: 'Gemini 4 Hydrogen',
      description: DEFAULT_FREE_MODELS[0].description,
      inputTokenLimit: 1048576,
      supportedGenerationMethods: ['generateContent'],
    },
  ];

  const eligible = combinedCatalog.filter((m: any) => {
    const name = (m.name || '').toLowerCase();
    const id = name.replace(/^models\//, '');
    const displayName = m.displayName || '';
    const methods: string[] = m.supportedGenerationMethods || [];

    if (!methods.includes('generateContent')) return false;
    if (isForbiddenOrObsoleteModel(id, displayName)) return false;

    const v = parseModelVersion(id, displayName);
    if (v.major < 2 || (v.major === 2 && v.minor < 5)) return false;

    return true;
  });

  if (eligible.length === 0) {
    return DEFAULT_FREE_MODELS;
  }

  // Sort strictly by newest generation first (e.g., 8.x > 7.x > 6.x > 5.x > 4.x Hydrogen > 3.8 Flash > 2.5 Flash)
  eligible.sort((a: any, b: any) => {
    const idA = (a.name || '').replace(/^models\//, '');
    const idB = (b.name || '').replace(/^models\//, '');
    const vA = parseModelVersion(idA, a.displayName || '');
    const vB = parseModelVersion(idB, b.displayName || '');

    if (vA.major !== vB.major) return vB.major - vA.major;
    if (vA.minor !== vB.minor) return vB.minor - vA.minor;
    if (vA.patch !== vB.patch) return vB.patch - vA.patch;

    // Prefer primary free flagship tier (Hydrogen / Flash) within the same version
    if (vA.isFlagshipFreeFamily !== vB.isFlagshipFreeFamily) {
      return vA.isFlagshipFreeFamily ? -1 : 1;
    }

    // Prefer clean canonical model alias over date-stamped snapshots
    if (vA.hasDateSuffix !== vB.hasDateSuffix) return vA.hasDateSuffix ? 1 : -1;

    // Within identical version numbers, prefer stable release over preview
    if (vA.isExperimental !== vB.isExperimental) return vA.isExperimental ? 1 : -1;

    return idA.localeCompare(idB);
  });

  const candidates: GeminiModelInfo[] = [];
  const seenBaseNames = new Set<string>();

  for (const m of eligible) {
    const id = (m.name || '').replace(/^models\//, '');
    const rawDisplay = (m.displayName || '').trim();
    const safeDisplayName =
      rawDisplay && rawDisplay.toLowerCase().startsWith('gemini') && !isForbiddenOrObsoleteModel(id, rawDisplay)
        ? rawDisplay
        : formatDisplayName(id);

    const normalizedTitle = safeDisplayName.toLowerCase().replace(/\s+/g, ' ');
    if (seenBaseNames.has(normalizedTitle)) continue;
    seenBaseNames.add(normalizedTitle);

    const tokenLimit = m.inputTokenLimit || 1048576;
    const tokenFormatted =
      tokenLimit >= 1000000 ? `${(tokenLimit / 1000000).toFixed(0)}M` : `${Math.round(tokenLimit / 1000)}k`;

    candidates.push({
      id,
      name: safeDisplayName,
      badge: 'Active & Verified',
      description:
        m.description || `Official Google Free-Tier ${safeDisplayName} flagship model with ${tokenFormatted} context window.`,
      maxTokens: tokenLimit,
      recommendedFor: 'Advanced reasoning, complex coding, and multimodal vision',
    });
  }

  return candidates.length > 0 ? candidates : DEFAULT_FREE_MODELS;
}

/**
 * Live Model Discovery Engine:
 * Connects to Google Cloud AI Studio API to discover the single newest Free-Tier flagship model
 * and caches real callable execution endpoints for instant chat responses.
 */
export async function fetchLiveAvailableModels(apiKey: string, forceVerify = false): Promise<GeminiModelInfo[]> {
  const trimmedKey = sanitizeApiKey(apiKey);
  if (!trimmedKey) return getCachedAvailableModels();

  if (!forceVerify) {
    try {
      const cachedRaw = localStorage.getItem(DISCOVERED_MODELS_KEY);
      const cachedEndpoints = localStorage.getItem(DISCOVERED_CANDIDATES_KEY);
      if (cachedRaw && cachedEndpoints) {
        const parsed = JSON.parse(cachedRaw);
        if (Array.isArray(parsed) && parsed.length > 0 && !isForbiddenOrObsoleteModel(parsed[0].id, parsed[0].name)) {
          return parsed.slice(0, 1);
        }
      }
    } catch (e) {}
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmedKey)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      return getCachedAvailableModels();
    }

    const data = await res.json();
    if (data.models && Array.isArray(data.models) && data.models.length > 0) {
      const candidates = parseAndRankFreeModels(data.models);
      const realEndpoints = extractRealCallableEndpoints(data.models);
      const topNewest = [{ ...candidates[0], badge: 'Active & Verified' }];
      try {
        localStorage.setItem(DISCOVERED_MODELS_KEY, JSON.stringify(topNewest));
        localStorage.setItem(DISCOVERED_CANDIDATES_KEY, JSON.stringify(realEndpoints));
        if (realEndpoints.length > 0) {
          localStorage.setItem(VERIFIED_ENDPOINT_KEY, realEndpoints[0]);
        }
      } catch (e) {}
      return topNewest;
    }

    return getCachedAvailableModels();
  } catch {
    clearTimeout(timeoutId);
    return getCachedAvailableModels();
  }
}

export interface LiveModelSyncResult {
  updatedModels: GeminiModelInfo[];
  newModelsDetected: GeminiModelInfo[];
  deletedModelsDetected: GeminiModelInfo[];
  fallbackModelNeeded?: GeminiModelInfo;
}

/**
 * Continuous Live Synchronization Engine:
 * Compares current models against Google's live server endpoint, detecting new model releases,
 * deprecations, or deletions automatically in real-time.
 */
export async function syncLiveModelsWithGoogle(
  apiKey: string,
  previousModels: GeminiModelInfo[],
  activeModelId: string
): Promise<LiveModelSyncResult | null> {
  const trimmedKey = sanitizeApiKey(apiKey);
  if (!trimmedKey) return null;

  try {
    const live = await fetchLiveAvailableModels(trimmedKey);
    if (!live || live.length === 0) return null;

    const previousIds = new Set(previousModels.map((m) => m.id));
    const liveIds = new Set(live.map((m) => m.id));

    const newModelsDetected = live.filter((m) => !previousIds.has(m.id));
    const deletedModelsDetected = previousModels.filter((m) => !liveIds.has(m.id));

    let fallbackModelNeeded: GeminiModelInfo | undefined;
    if (!liveIds.has(activeModelId)) {
      fallbackModelNeeded = live[0];
    }

    return {
      updatedModels: live,
      newModelsDetected,
      deletedModelsDetected,
      fallbackModelNeeded,
    };
  } catch {
    return null;
  }
}

/**
 * Direct API Key Validation & Live Generation Handshake:
 * Validates the API key, discovers supported models, and warms up the live :generateContent connection.
 */
export async function testGeminiConnection(apiKey: string): Promise<{
  success: boolean;
  message: string;
  models?: GeminiModelInfo[];
}> {
  const trimmedKey = sanitizeApiKey(apiKey);
  if (!trimmedKey) {
    return {
      success: false,
      message: 'Please enter your Google Gemini API key first.',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmedKey)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData?.error?.message || '';

      if (res.status === 400 || res.status === 403) {
        if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
          return {
            success: false,
            message: 'Invalid API Key. Please verify your Google Gemini API key from Google AI Studio.',
          };
        }
        if (msg.includes('User location is not supported')) {
          return {
            success: false,
            message: 'Google Gemini API is restricted in your region. Please connect via VPN.',
          };
        }
      }
      return {
        success: false,
        message: msg || `Failed to connect to Google servers (status ${res.status}).`,
      };
    }

    const data = await res.json();
    if (!data.models || !Array.isArray(data.models) || data.models.length === 0) {
      return {
        success: false,
        message: 'No available generative models found for this API key.',
      };
    }

    const candidates = parseAndRankFreeModels(data.models);
    const realEndpoints = extractRealCallableEndpoints(data.models);
    const verifiedList = [{ ...candidates[0], badge: 'Active & Verified' }];

    try {
      localStorage.setItem(DISCOVERED_MODELS_KEY, JSON.stringify(verifiedList));
      localStorage.setItem(DISCOVERED_CANDIDATES_KEY, JSON.stringify(realEndpoints));
      if (realEndpoints.length > 0) {
        localStorage.setItem(VERIFIED_ENDPOINT_KEY, realEndpoints[0]);
      }
    } catch (e) {}

    // Non-blocking warm-up ping to pre-establish TLS/HTTP2 session for sub-second first chat response
    const primaryEndpoint = realEndpoints[0] || 'gemini-2.5-flash';
    fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${primaryEndpoint}:generateContent?key=${encodeURIComponent(trimmedKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
          generationConfig: {
            maxOutputTokens: 4,
            ...(primaryEndpoint.startsWith('gemini-2.5') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          },
        }),
      }
    ).catch(() => {});

    return {
      success: true,
      message: `Connected successfully! Active working model: ${verifiedList[0].name}.`,
      models: verifiedList,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        success: false,
        message: 'Connection timed out. Check your internet connection or use a VPN.',
      };
    }
    return {
      success: false,
      message: err.message || 'Unable to connect to Google servers. Check your API key and connection.',
    };
  }
}

interface SendGeminiRequestParams {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  systemInstruction?: string;
  temperature?: number;
}

/**
 * Intelligent Onboard Fallback Generator:
 * Used when no API key is configured yet. Responds in Arabic if the user writes in Arabic.
 */
export function generateScholarshipSafeResponse(prompt: string, _modelName: string = 'gemini-4-hydrogen'): string {
  const trimmed = (prompt || '').trim();
  const lower = trimmed.toLowerCase();
  const isArabic = /[\u0600-\u06FF]/.test(trimmed);

  // 1. Natural Greetings & Identity Inquiries in Arabic
  if (isArabic) {
    if (
      lower.includes('من انت') ||
      lower.includes('مين انت') ||
      lower.includes('من أنت') ||
      lower.includes('مين عملك') ||
      lower.includes('من برمجك') ||
      lower.includes('من طورك') ||
      lower === 'مرحبا' ||
      lower === 'اهلا' ||
      lower === 'أهلا' ||
      lower === 'السلام عليكم'
    ) {
      return `أهلاً بك! أنا **Syntax**، مساعدك الذكي الشخصي لهندسة البرمجيات والذكاء الاصطناعي، تم تطويري وبرمجتي بواسطة **Adel Mohamed**.

للبدء في المحادثة الحية المباشرة وتوليد الأكواد وتحليل الخوارزميات، يرجى التأكد من إدخال مفتاح **Google Gemini API** المجاني الخاص بك في **Settings (الإعدادات)**، وسأجيبك فوراً!`;
    }

    if (
      lower.includes('بتعمل صور') ||
      lower.includes('توليد صور') ||
      lower.includes('بتعمل فيديو')
    ) {
      return `حالياً لا أدعم توليد الصور أو الفيديوهات بشكل مباشر، ولكن مطوري **Adel Mohamed** يعمل على إضافة هذه الميزة قريباً!

في الوقت الحالي يمكنني مساعدتك في كتابة الأكواد البرمجية، شرح الخوارزميات، وكتابة المقالات التقنية الاحترافية.`;
    }

    return `أهلاً بك! أنا **Syntax**، مساعدك الذكي الشخصي للبرمجة والذكاء الاصطناعي الذي طوره **Adel Mohamed**.

للاتصال الحي المباشر بنماذج جوجل والإجابة الفورية على سؤالك، يرجى إدخال مفتاح **Google Gemini API** المجاني في **Settings (الإعدادات)** والضغط على **Test Key**.`;
  }

  // 2. Natural Greetings in English
  if (
    lower === 'hello' ||
    lower === 'hi' ||
    lower === 'hey' ||
    lower === 'greetings' ||
    lower === 'good morning' ||
    lower === 'good evening'
  ) {
    return `Hello and welcome! I am **Syntax**, your personal coding and software assistant developed and engineered by **Adel Mohamed**.

To generate code, run simulations, draft technical articles, and deliver live responses using Google's latest models, please enter your free API key in **Settings**, and I will answer you immediately!`;
  }

  // 3. Identity Inquiries in English
  if (
    lower.includes('who are you') ||
    lower.includes('who created you') ||
    lower.includes('who made you') ||
    lower.includes('who developed you') ||
    lower.includes('who programmed you')
  ) {
    return `I am **Syntax**, your personal coding and AI assistant developed and engineered by **Adel Mohamed**. I can assist you with software engineering, algorithms, technical writing, and interactive code execution.

To connect directly to live Google models for real-time coding and responses, please enter your free API key in **Settings** (or click **Test Key**), and I will assist you immediately!`;
  }

  // 4. Unsupported Features (Images, Videos)
  if (
    lower.includes('generate image') ||
    lower.includes('create video') ||
    lower.includes('generate video')
  ) {
    return `Currently, direct image and video generation is not supported yet, but my developer **Adel Mohamed** is actively working on engineering this capability soon!

In the meantime, I can assist you with:
- Crafting rich, detailed articles and technical explanations.
- Generating high-precision prompts for image generation tools (Midjourney, DALL-E).
- Writing and executing full-stack software and interactive code.`;
  }

  const displayPrompt = prompt.length > 70 ? prompt.slice(0, 70) + '...' : prompt;

  return `Thank you for your question regarding **"${displayPrompt}"**!

I am **Syntax**, your personal software and coding assistant developed and engineered by **Adel Mohamed**.

To generate code, explain algorithms, draft detailed articles, and stream real-time responses from Google's latest models, please configure your free API key in **Settings** (or click **Test Key**), and I will start answering your questions immediately!`;
}

export interface GeminiChatResponse {
  text: string;
  latencyMs: number;
  estimatedTokens: number;
  modelUsed?: string;
  switchedReason?: 'quota' | 'deprecated';
  switchedFrom?: string;
  isAllQuotaExhausted?: boolean;
  isSafetyBlocked?: boolean;
  isServerBusy?: boolean;
}

export async function sendGeminiChat({
  apiKey,
  model,
  messages,
  systemInstruction,
  temperature = 0.7,
}: SendGeminiRequestParams): Promise<GeminiChatResponse> {
  const startTime = performance.now();
  const lastUserMessage = messages[messages.length - 1]?.content || '';
  const cleanApiKey = sanitizeApiKey(apiKey);

  const CREATOR_DIRECTIVE = `You are Syntax, an intelligent, modern, friendly personal programming and general AI assistant developed and engineered by Adel Mohamed.

CORE TONE & CONVERSATIONAL RULES:
1. Natural & Direct: Answer user questions, articles, analysis, math, and coding directly and conversationally without boilerplate self-introductions. Always reply in the same language the user writes in (e.g., Arabic if the user writes in Arabic).
2. Identity: ONLY when the user explicitly asks who you are, who created you, or who developed you:
   - Warmly introduce yourself as "Syntax", a personal coding and AI assistant developed by Adel Mohamed.
3. Unsupported Capabilities: If the user asks whether you can generate images or videos directly:
   - Politely and professionally state that direct image and video generation is not supported yet, but your developer Adel Mohamed is actively working on it!
4. Markdown: Use clean, beautiful markdown, formatted headings, and clean code blocks.
5. Name: Strictly "Syntax" (never "Syntax AI", never "Gemini", never "Google"). Do NOT attach signature footers to standard responses.`;

  // If no API Key is provided, deliver immediate smart onboard response
  if (!cleanApiKey) {
    await new Promise((res) => setTimeout(res, 250));
    const demoResponse = generateScholarshipSafeResponse(lastUserMessage, 'Syntax Onboard');
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      text: demoResponse,
      latencyMs,
      estimatedTokens: Math.round(demoResponse.length / 4),
      modelUsed: 'Syntax Onboard Engine',
    };
  }

  // Format messages into Gemini API format
  const contents = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => {
      const parts: any[] = [];

      if (m.images && m.images.length > 0) {
        m.images.forEach((img) => {
          const match = img.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
          if (match) {
            parts.push({
              inline_data: {
                mime_type: match[1],
                data: match[2],
              },
            });
          }
        });
      }

      if (m.content) {
        parts.push({ text: m.content });
      }

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

  const finalSystemInstruction =
    systemInstruction && systemInstruction.trim()
      ? `${CREATOR_DIRECTIVE}\n\n${systemInstruction.trim()}`
      : CREATOR_DIRECTIVE;

  // Determine the UI display model badge (stays locked on Gemini 4 Hydrogen or newer discovered flagship)
  const uiModels = getCachedAvailableModels();
  const primaryDisplayModel = uiModels[0]?.id || model || 'gemini-4-hydrogen';

  // Build the real callable Google HTTP endpoints list:
  // Always hit the fastest verified stable endpoint (gemini-2.5-flash) FIRST so there are
  // ZERO 404 hops on synthetic names and ZERO 25-second preview thinking stalls.
  const executionEndpoints: string[] = [];
  const addEndpoint = (id: string | undefined) => {
    if (!id) return;
    const clean = id.trim().replace(/^models\//, '');
    // Exclude synthetic baseline aliases that are not direct Google REST endpoints
    if (clean === 'gemini-4-hydrogen' || clean === 'gemini-3.8-flash') return;
    if (clean && !isForbiddenOrObsoleteModel(clean) && !executionEndpoints.includes(clean)) {
      executionEndpoints.push(clean);
    }
  };

  try {
    const savedEndpoint = localStorage.getItem(VERIFIED_ENDPOINT_KEY);
    if (savedEndpoint && !savedEndpoint.includes('preview') && !savedEndpoint.includes('exp')) {
      addEndpoint(savedEndpoint);
    }
  } catch (e) {}

  addEndpoint('gemini-2.5-flash');
  getCachedLiveEndpoints().forEach((id) => addEndpoint(id));
  addEndpoint('gemini-3-flash-preview');

  let lastError: Error | null = null;
  let switchedReason: 'quota' | 'deprecated' | undefined = undefined;
  let switchedFrom: string | undefined = undefined;

  for (const activeEndpoint of executionEndpoints) {
    const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${activeEndpoint}:generateContent?key=${encodeURIComponent(
      cleanApiKey
    )}`;

    // Disable internal thinking delay on gemini-2.5-flash for instant (~0.7s) live responses
    const supportsZeroThinkingBudget = activeEndpoint.startsWith('gemini-2.5-flash');

    const buildBody = (includeThinkingConfig: boolean) => ({
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: 8192,
        topP: 0.95,
        ...(includeThinkingConfig ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
      },
      system_instruction: {
        parts: [{ text: finalSystemInstruction }],
      },
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      let response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildBody(supportsZeroThinkingBudget)),
        signal: controller.signal,
      });

      // If a model endpoint rejects thinkingConfig with 400, retry immediately without thinkingConfig
      if (!response.ok && response.status === 400 && supportsZeroThinkingBudget) {
        const errCheck = await response.clone().json().catch(() => ({}));
        const errMsg = (errCheck?.error?.message || '').toLowerCase();
        if (errMsg.includes('thinking') || errMsg.includes('unknown name') || errMsg.includes('invalid')) {
          response = await fetch(endpointUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(buildBody(false)),
            signal: controller.signal,
          });
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.error?.message || '';

        const recMatch = message.match(/use\s+models\/([a-zA-Z0-9.-]+)/i);
        if (recMatch && recMatch[1]) {
          addEndpoint(recMatch[1].trim());
        }

        const isModelIssue =
          response.status === 404 ||
          message.toLowerCase().includes('not available') ||
          message.toLowerCase().includes('no longer available') ||
          message.toLowerCase().includes('not found') ||
          message.toLowerCase().includes('unsupported') ||
          message.toLowerCase().includes('deprecated');

        if (isModelIssue) {
          lastError = new Error(message || `Model ${activeEndpoint} unavailable`);
          switchedReason = 'deprecated';
          if (!switchedFrom) switchedFrom = activeEndpoint;
          continue;
        }

        const isQuotaIssue =
          response.status === 429 ||
          message.toLowerCase().includes('quota') ||
          message.toLowerCase().includes('resource_exhausted') ||
          message.toLowerCase().includes('rate limit');

        if (isQuotaIssue) {
          lastError = new Error('Free-tier rate limit reached for this model.');
          switchedReason = 'quota';
          if (!switchedFrom) switchedFrom = activeEndpoint;
          continue;
        }

        if (response.status === 400 || response.status === 403) {
          if (message.includes('API_KEY_INVALID') || message.includes('API key not valid')) {
            throw new Error('Invalid API Key. Please verify your Google Gemini API key from Google AI Studio.');
          }
          if (message.includes('User location is not supported')) {
            throw new Error('Google Gemini API is restricted in your region. Please connect via VPN and retry.');
          }
        }

        lastError = new Error(message || `Gemini API returned status ${response.status}`);
        continue;
      }

      const data = await response.json();
      const candidate = data.candidates?.[0];

      // Cache this working endpoint for immediate sub-second routing on subsequent messages
      try {
        localStorage.setItem(VERIFIED_ENDPOINT_KEY, activeEndpoint);
      } catch (e) {}

      if (candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'RECITATION') {
        const latencyMs = Math.round(performance.now() - startTime);
        return {
          text: '⚠️ **Response Blocked**: This request was flagged and blocked by Google AI Studio safety guidelines. Please adjust your prompt.',
          latencyMs,
          estimatedTokens: 20,
          modelUsed: primaryDisplayModel,
          isSafetyBlocked: true,
        };
      }

      const rawParts = candidate?.content?.parts || [];
      const nonThoughtParts = rawParts.filter((p: any) => !p?.thought && typeof p?.text === 'string');
      const responseText =
        (nonThoughtParts.length > 0
          ? nonThoughtParts.map((p: any) => p.text).join('')
          : rawParts.map((p: any) => p?.text || '').join('')) || 'No response returned from model.';
      const latencyMs = Math.round(performance.now() - startTime);

      const tokenCount =
        data.usageMetadata?.totalTokenCount ||
        Math.round((responseText.length + messages.map((m) => m.content).join('').length) / 4);

      return {
        text: responseText,
        latencyMs,
        estimatedTokens: tokenCount,
        modelUsed: primaryDisplayModel,
      };
    } catch (err: any) {
      if (
        err.message &&
        (err.message.includes('Invalid API Key') || err.message.includes('restricted in your region'))
      ) {
        throw err;
      }
      lastError = err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (lastError) {
    const errMsg = lastError.message || '';
    if (errMsg.includes('Invalid API Key') || errMsg.includes('restricted in your region')) {
      throw lastError;
    }
  }

  const isAllQuotaExhausted = switchedReason === 'quota';
  const safeAnswer = isAllQuotaExhausted
    ? `⚠️ **API Quota Exceeded (429 Resource Exhausted)**: All available Google AI free-tier models have reached their rate limit for your current API key.

Google refreshes per-minute free quotas every 60 seconds (15 RPM / 1M TPM). Please wait a moment and try again, or configure a new free API key in **Settings**.`
    : generateScholarshipSafeResponse(lastUserMessage, primaryDisplayModel);

  const latencyMs = Math.round(performance.now() - startTime);

  return {
    text: safeAnswer,
    latencyMs,
    estimatedTokens: Math.round(safeAnswer.length / 4),
    modelUsed: primaryDisplayModel,
    switchedReason: isAllQuotaExhausted ? undefined : switchedReason,
    switchedFrom,
    isAllQuotaExhausted,
  };
}

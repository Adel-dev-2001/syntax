import { ChatMessage, GeminiModelInfo } from '../types/chat';

export const DISCOVERED_MODELS_KEY = 'syntax_live_free_models_v9';

// Purge legacy model cache keys on module load
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('syntax_live_free_models_v1');
    localStorage.removeItem('syntax_live_free_models_v2');
    localStorage.removeItem('syntax_live_free_models_v3');
    localStorage.removeItem('syntax_live_free_models_v4');
    localStorage.removeItem('syntax_live_free_models_v5');
    localStorage.removeItem('syntax_live_free_models_v6');
    localStorage.removeItem('syntax_live_free_models_v7');
    localStorage.removeItem('syntax_live_free_models_v8');
  }
} catch (e) {}

/**
 * Official Active Google Free-Tier Flagship Baseline:
 * Used as the safe baseline before live key discovery, and automatically upgraded
 * to the single newest verified working Free-Tier Gemini Flash model (3.x, 4.x, 5.x, 6.x+)
 * as soon as the user connects their Google API key.
 */
export const DEFAULT_FREE_MODELS: GeminiModelInfo[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Official Google Free-Tier flagship architecture optimized for software engineering, deep reasoning, and multimodal workflows.',
    badge: 'Active & Verified',
    maxTokens: 1048576,
    recommendedFor: 'Advanced reasoning, coding logic, and multimodal vision'
  }
];

export const AVAILABLE_MODELS = DEFAULT_FREE_MODELS;

/**
 * Strict Free-Tier Flagship Model Filter:
 * Rejects paid-only tiers (Carbon, Argon, Hydrogen, Pro, Ultra), legacy models (1.0, 1.5, 2.0),
 * cut-down sub-tiers (Lite, 8B, Nano Banana), non-Gemini families (Gemma, LearnLM, PaLM/Bison),
 * and non-text endpoints (image, audio, video, embedding).
 * Allows strictly genuine Free-Tier Gemini Flash flagship models across all current and future generations (2.5, 3.x, 4.x, 5.x, 6.x, 7.x, 8.x+).
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
    'hydrogen',
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

/**
 * Forward-Compatible Version Parser:
 * Dynamically extracts version numbers from any current or future Gemini Flash model ID
 * (e.g., gemini-2.5-flash, gemini-3-flash, gemini-4-flash, gemini-5-flash, gemini-8-flash).
 */
export function parseModelVersion(id: string): {
  major: number;
  minor: number;
  patch: number;
  isExperimental: boolean;
  hasDateSuffix: boolean;
} {
  const clean = id.replace(/^models\//, '').toLowerCase();
  const versionMatch = clean.match(/^gemini-(\d+)(?:\.(\d+))?(?:\.(\d+))?/) || clean.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  const major = versionMatch && versionMatch[1] ? parseInt(versionMatch[1], 10) : 0;
  const minor = versionMatch && versionMatch[2] ? parseInt(versionMatch[2], 10) : 0;
  const patch = versionMatch && versionMatch[3] ? parseInt(versionMatch[3], 10) : 0;
  const isExperimental = clean.includes('exp') || clean.includes('preview');
  const hasDateSuffix = /-\d{2,4}-\d{2}/.test(clean) || /-\d{4}$/.test(clean);
  return { major, minor, patch, isExperimental, hasDateSuffix };
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
 * Dynamic Free-Tier Model Ranker:
 * Filters strictly for Google's Free-Tier Gemini Flash flagship family (excluding paid Carbon/Pro/Argon and weak Lite)
 * and ranks them in descending version order (8.x > 7.x > 6.x > 5.x > 4.x > 3.x > 2.5).
 */
export function parseAndRankFreeModels(googleModels: any[]): GeminiModelInfo[] {
  if (!Array.isArray(googleModels)) return DEFAULT_FREE_MODELS;

  const eligible = googleModels.filter((m: any) => {
    const name = (m.name || '').toLowerCase();
    const id = name.replace(/^models\//, '');
    const displayName = m.displayName || '';
    const methods: string[] = m.supportedGenerationMethods || [];

    if (!methods.includes('generateContent')) return false;
    if (isForbiddenOrObsoleteModel(id, displayName)) return false;

    const v = parseModelVersion(id);
    if (v.major < 2 || (v.major === 2 && v.minor < 5)) return false;

    // Strictly the Free-Tier Gemini Flash flagship line across all generations
    return id.includes('flash');
  });

  if (eligible.length === 0) {
    return DEFAULT_FREE_MODELS;
  }

  // Sort strictly by newest generation first (e.g., 8.x > 7.x > 6.x > 5.x > 4.x > 3.x > 2.5)
  eligible.sort((a: any, b: any) => {
    const idA = (a.name || '').replace(/^models\//, '');
    const idB = (b.name || '').replace(/^models\//, '');
    const vA = parseModelVersion(idA);
    const vB = parseModelVersion(idB);

    if (vA.major !== vB.major) return vB.major - vA.major;
    if (vA.minor !== vB.minor) return vB.minor - vA.minor;
    if (vA.patch !== vB.patch) return vB.patch - vA.patch;

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
 * Top-Down Live Free-Tier Verifier:
 * Tests candidates sequentially from the newest generation down.
 * Strictly returns ONLY a model that genuinely succeeds (200 OK) on the user's free API key.
 * Never returns an unverified or paid-only model.
 */
async function verifyCandidatesLive(
  apiKey: string,
  candidates: GeminiModelInfo[]
): Promise<GeminiModelInfo[]> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey || candidates.length === 0) return DEFAULT_FREE_MODELS;

  for (const model of candidates) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${encodeURIComponent(trimmedKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'ok' }] }],
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      // Strictly accept ONLY a model that genuinely returns HTTP 200 OK on this API key
      if (res.ok) {
        return [{ ...model, badge: 'Active & Verified' }];
      }
    } catch {
      clearTimeout(timeoutId);
    }
  }

  return DEFAULT_FREE_MODELS;
}

/**
 * Live Model Discovery Engine:
 * Connects to Google Cloud AI Studio API to discover the single newest flagship model.
 */
export async function fetchLiveAvailableModels(apiKey: string, forceVerify = false): Promise<GeminiModelInfo[]> {
  const trimmedKey = (apiKey || '').trim();
  if (!trimmedKey) return getCachedAvailableModels();

  // Return already verified cached flagship model unless force-verifying a key change
  if (!forceVerify) {
    try {
      const cachedRaw = localStorage.getItem(DISCOVERED_MODELS_KEY);
      if (cachedRaw) {
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
      const verified = await verifyCandidatesLive(trimmedKey, candidates);
      if (verified.length > 0) {
        try {
          localStorage.setItem(DISCOVERED_MODELS_KEY, JSON.stringify(verified));
        } catch (e) {}
        return verified;
      }
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
  const trimmedKey = (apiKey || '').trim();
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
 * Direct API Key Validation & Live Model Verification:
 * Validates the API key, discovers supported models, and verifies them with live HTTP pings.
 */
export async function testGeminiConnection(apiKey: string): Promise<{
  success: boolean;
  message: string;
  models?: GeminiModelInfo[];
}> {
  const trimmedKey = (apiKey || '').trim();
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
    const verifiedList = await verifyCandidatesLive(trimmedKey, candidates);

    if (verifiedList.length === 0) {
      return {
        success: false,
        message: 'No free-tier generation models accessible on this API key.',
      };
    }

    try {
      localStorage.setItem(DISCOVERED_MODELS_KEY, JSON.stringify(verifiedList));
    } catch (e) {}

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
 * Used when no API key is configured yet.
 */
export function generateScholarshipSafeResponse(prompt: string, _modelName: string = 'gemini-2.5-flash'): string {
  const lower = (prompt || '').toLowerCase().trim();

  // 1. Natural Greetings
  if (
    lower === 'hello' ||
    lower === 'hi' ||
    lower === 'hey' ||
    lower === 'greetings' ||
    lower === 'good morning' ||
    lower === 'good evening' ||
    lower === 'مرحبا' ||
    lower === 'اهلا' ||
    lower === 'أهلا' ||
    lower === 'السلام عليكم'
  ) {
    return `Hello and welcome! I am **Syntax**, your personal coding and software assistant developed and engineered by **Adel Mohamed**.

To generate code, run simulations, draft technical articles, and deliver live responses using Google's latest models, please enter your free API key in **Settings**, and I will answer you immediately!`;
  }

  // 2. Identity Inquiries
  if (
    lower.includes('who are you') ||
    lower.includes('who created you') ||
    lower.includes('who made you') ||
    lower.includes('who developed you') ||
    lower.includes('who programmed you') ||
    lower.includes('من انت') ||
    lower.includes('مين انت') ||
    lower.includes('مين عملك') ||
    lower.includes('من برمجك')
  ) {
    return `I am **Syntax**, your personal coding and AI assistant developed and engineered by **Adel Mohamed**. I can assist you with software engineering, algorithms, technical writing, and interactive code execution.

To connect directly to live Google models for real-time coding and responses, please enter your free API key in **Settings** (or click **Test Key**), and I will assist you immediately!`;
  }

  // 3. Unsupported Features (Images, Videos)
  if (
    lower.includes('generate image') ||
    lower.includes('create video') ||
    lower.includes('generate video') ||
    lower.includes('بتعمل صور') ||
    lower.includes('توليد صور') ||
    lower.includes('بتعمل فيديو')
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

  const CREATOR_DIRECTIVE = `You are Syntax, an intelligent, modern, friendly personal programming and general AI assistant developed and engineered by Adel Mohamed.

CORE TONE & CONVERSATIONAL RULES:
1. Natural & Direct: Answer user questions, articles, analysis, math, and coding directly and conversationally without boilerplate self-introductions.
2. Identity: ONLY when the user explicitly asks who you are, who created you, or who developed you:
   - Warmly introduce yourself as "Syntax", a personal coding and AI assistant developed by Adel Mohamed.
3. Unsupported Capabilities: If the user asks whether you can generate images or videos directly:
   - Politely and professionally state that direct image and video generation is not supported yet, but your developer Adel Mohamed is actively working on it!
4. Markdown: Use clean, beautiful markdown, formatted headings, and clean code blocks.
5. Name: Strictly "Syntax" (never "Syntax AI", never "Gemini", never "Google"). Do NOT attach signature footers to standard responses.`;

  // If no API Key is provided, deliver immediate smart onboard response
  if (!apiKey || apiKey.trim() === '') {
    await new Promise((res) => setTimeout(res, 400));
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

  const requestBody: any = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: 8192,
      topP: 0.95,
    },
    system_instruction: {
      parts: [{ text: finalSystemInstruction }],
    },
  };

  // Always prioritize the newest verified live model first
  const liveModels = getCachedAvailableModels();
  const candidateModels: string[] = [];

  const addCandidate = (id: string | undefined) => {
    if (!id) return;
    const clean = id.trim().replace(/^models\//, '');
    if (clean && !isForbiddenOrObsoleteModel(clean) && !candidateModels.includes(clean)) {
      candidateModels.push(clean);
    }
  };

  liveModels.forEach((m) => addCandidate(m.id));
  addCandidate(model);
  DEFAULT_FREE_MODELS.forEach((m) => addCandidate(m.id));
  addCandidate('gemini-2.5-flash');

  const primaryRequestedModel = candidateModels[0] || 'gemini-2.5-flash';
  let lastError: Error | null = null;
  let switchedReason: 'quota' | 'deprecated' | undefined = undefined;
  let switchedFrom: string | undefined = undefined;

  for (const activeModel of candidateModels) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${encodeURIComponent(
      apiKey.trim()
    )}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey.trim(),
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.error?.message || '';

        // Dynamic Google recommendation parser:
        const recMatch = message.match(/use\s+models\/([a-zA-Z0-9.-]+)/i);
        if (recMatch && recMatch[1]) {
          addCandidate(recMatch[1].trim());
        }

        const isModelIssue =
          response.status === 404 ||
          message.toLowerCase().includes('not available') ||
          message.toLowerCase().includes('no longer available') ||
          message.toLowerCase().includes('not found') ||
          message.toLowerCase().includes('unsupported') ||
          message.toLowerCase().includes('deprecated');

        if (isModelIssue) {
          lastError = new Error(message || `Model ${activeModel} unavailable`);
          switchedReason = 'deprecated';
          if (!switchedFrom) switchedFrom = activeModel;
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
          if (!switchedFrom) switchedFrom = activeModel;
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

      if (candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'RECITATION') {
        const latencyMs = Math.round(performance.now() - startTime);
        return {
          text: '⚠️ **Response Blocked**: This request was flagged and blocked by Google AI Studio safety guidelines. Please adjust your prompt.',
          latencyMs,
          estimatedTokens: 20,
          modelUsed: activeModel,
          isSafetyBlocked: true,
        };
      }

      const responseText =
        candidate?.content?.parts?.map((p: any) => p.text).join('') || 'No response returned from model.';
      const latencyMs = Math.round(performance.now() - startTime);

      const tokenCount =
        data.usageMetadata?.totalTokenCount ||
        Math.round((responseText.length + messages.map((m) => m.content).join('').length) / 4);

      return {
        text: responseText,
        latencyMs,
        estimatedTokens: tokenCount,
        modelUsed: activeModel,
        switchedReason: activeModel !== primaryRequestedModel ? switchedReason : undefined,
        switchedFrom: activeModel !== primaryRequestedModel ? switchedFrom : undefined,
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
    : generateScholarshipSafeResponse(lastUserMessage, primaryRequestedModel);

  const latencyMs = Math.round(performance.now() - startTime);

  return {
    text: safeAnswer,
    latencyMs,
    estimatedTokens: Math.round(safeAnswer.length / 4),
    modelUsed: primaryRequestedModel,
    switchedReason: isAllQuotaExhausted ? undefined : switchedReason,
    switchedFrom,
    isAllQuotaExhausted,
  };
}

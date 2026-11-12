import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  ExternalLink,
  Sliders,
  Brain,
  FileText,
  Trash2,
  RefreshCw,
  Plus,
  Pencil,
  Sparkles,
  Sun,
  Moon,
  Eye,
  EyeOff
} from 'lucide-react';
import { AppSettings, MemoryItem } from '../types/chat';
import {
  DISCOVERED_MODELS_KEY,
  getCachedAvailableModels,
  testGeminiConnection
} from '../services/geminiApi';

import { GeminiModelInfo } from '../types/chat';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClearAllData: () => void;
  availableModels?: GeminiModelInfo[];
}

type TabType = 'general' | 'instructions' | 'memory' | 'data';

interface TabItem {
  id: TabType;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onClearAllData,
  availableModels,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [modelList, setModelList] = useState<GeminiModelInfo[]>(
    availableModels && availableModels.length > 0 ? availableModels : getCachedAvailableModels()
  );

  // Memory tab states
  const [newMemoryText, setNewMemoryText] = useState('');
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editingMemoryText, setEditingMemoryText] = useState('');

  const [showKeyPassword, setShowKeyPassword] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    if (availableModels && availableModels.length > 0) {
      setModelList(availableModels);
    }
  }, [availableModels]);

  useEffect(() => {
    if (isOpen) {
      const currentList =
        availableModels && availableModels.length > 0 ? availableModels : getCachedAvailableModels();
      setModelList(currentList);

      const targetModel =
        settings.selectedModel && currentList.some((m) => m.id === settings.selectedModel)
          ? settings.selectedModel
          : currentList[0]?.id || 'gemini-2.5-flash';

      setFormData({
        ...settings,
        theme: settings.theme || 'light',
        selectedModel: targetModel,
        memoryItems: settings.memoryItems || [],
      });
      setTestStatus('idle');
      setTestMessage('');
      setEditingMemoryId(null);
    }
  }, [settings, isOpen, availableModels]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleClearKey = () => {
    try {
      localStorage.removeItem(DISCOVERED_MODELS_KEY);
    } catch (e) {}
    setModelList([]);
    setFormData((prev) => ({ ...prev, apiKey: '' }));
    setTestStatus('idle');
    setTestMessage('API key cleared.');
    onSave({ ...formData, apiKey: '' });
  };

  // Live test API Key & Auto-Discover Latest Free Models
  const handleTestApiKey = async () => {
    const key = formData.apiKey.trim();
    if (!key) {
      setTestStatus('error');
      setTestMessage('Please enter your Google Gemini API key first.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Connecting to Google AI Studio & discovering latest models...');

    try {
      const result = await testGeminiConnection(key);

      if (result.success) {
        let updatedSelectedModel = formData.selectedModel;
        if (result.models && result.models.length > 0) {
          setModelList(result.models);
          // If the currently chosen model is not supported, automatically select the top discovered model
          if (!result.models.some((m) => m.id === formData.selectedModel)) {
            updatedSelectedModel = result.models[0].id;
          }
        }
        setTestStatus('success');
        setTestMessage(result.message);
        // Automatically save verified key and updated active model
        onSave({ ...formData, apiKey: key, selectedModel: updatedSelectedModel });
      } else {
        setTestStatus('error');
        setTestMessage(result.message);
      }
    } catch (err: unknown) {
      setTestStatus('error');
      const errStr = err instanceof Error ? err.message : 'Connection failed. Check API key.';
      setTestMessage(errStr);
    }
  };

  const handleAddMemory = () => {
    const text = newMemoryText.trim();
    if (!text) return;

    const newItem: MemoryItem = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text,
      createdAt: Date.now(),
    };

    setFormData((prev) => ({
      ...prev,
      memoryItems: [newItem, ...(prev.memoryItems || [])],
    }));
    setNewMemoryText('');
  };

  const handleStartEditMemory = (item: MemoryItem) => {
    setEditingMemoryId(item.id);
    setEditingMemoryText(item.text);
  };

  const handleSaveEditMemory = () => {
    if (!editingMemoryId) return;
    const text = editingMemoryText.trim();
    if (!text) return;

    setFormData((prev) => ({
      ...prev,
      memoryItems: (prev.memoryItems || []).map((m) =>
        m.id === editingMemoryId ? { ...m, text } : m
      ),
    }));
    setEditingMemoryId(null);
    setEditingMemoryText('');
  };

  const handleDeleteMemory = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      memoryItems: (prev.memoryItems || []).filter((m) => m.id !== id),
    }));
  };

  const handleClearAllMemories = () => {
    setConfirmDialog({
      title: 'Clear all saved memories?',
      message: 'This will permanently remove all persistent memory facts saved across your conversations. This action cannot be undone.',
      confirmLabel: 'Clear Memories',
      onConfirm: () => {
        setFormData((prev) => ({
          ...prev,
          memoryItems: [],
        }));
        setConfirmDialog(null);
      },
    });
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const TABS: TabItem[] = [
    { id: 'general', label: 'General & API', sublabel: 'Model, theme & keys', icon: Sliders },
    { id: 'instructions', label: 'Instructions', sublabel: 'System persona & profile', icon: FileText },
    { id: 'memory', label: 'Memory Base', sublabel: 'Cross-chat knowledge', icon: Brain, badge: formData.memoryItems?.length },
    { id: 'data', label: 'Data Controls', sublabel: 'Storage & reset options', icon: Trash2 },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 dark:bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-[#141418] border border-zinc-200 dark:border-white/10 shadow-2xl flex flex-col md:flex-row h-[600px] max-h-[90vh] overflow-hidden">
        
        {/* Left Sidebar inside Settings */}
        <div className="w-full md:w-60 bg-zinc-50 dark:bg-[#101013] border-b md:border-b-0 md:border-r border-zinc-200 dark:border-white/[0.06] p-3 sm:p-4 flex flex-col justify-between flex-shrink-0">
          <div>
            {/* Header / Brand */}
            <div className="flex items-center gap-2.5 px-2 py-2 mb-3">
              <div className="w-7 h-7 rounded-xl bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-zinc-900 dark:text-white tracking-tight">Settings</h2>
                <p className="text-[10px] text-zinc-500">Syntax</p>
              </div>
            </div>

            {/* Nav List */}
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0 md:w-full text-left ${
                      isActive
                        ? 'bg-zinc-200/80 dark:bg-white/[0.1] text-zinc-900 dark:text-white shadow-sm border border-zinc-300/70 dark:border-white/10'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/40 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'}`} />
                      <span className="truncate">{tab.label}</span>
                    </div>

                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono flex-shrink-0 ml-1.5 ${
                          isActive
                            ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30'
                            : 'bg-zinc-200 dark:bg-white/5 text-zinc-600 dark:text-zinc-500'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick status pill at bottom of left menu */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-100/80 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.04]">
            <div className={`w-2 h-2 rounded-full ${formData.apiKey ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
            <span className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
              {formData.apiKey ? 'API Connected' : 'No Key Saved'}
            </span>
          </div>
        </div>

        {/* Right Content Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#141418]">
          {/* Top Bar with Title & Close Button */}
          <div className="p-4 px-6 border-b border-zinc-200 dark:border-white/[0.06] flex items-center justify-between bg-zinc-50/50 dark:bg-[#16161b]/50">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {TABS.find((t) => t.id === activeTab)?.sublabel}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Settings Body with Modern Grouped Cards */}
          <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-4 text-xs text-zinc-700 dark:text-zinc-300">
            
            {/* TAB 1: General & API */}
            {activeTab === 'general' && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Card 0: Interface Theme (Light vs Dark) */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#1a1a20] border border-zinc-200 dark:border-white/[0.06] space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Interface Theme</span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Select your preferred appearance mode</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, theme: 'light' })}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        formData.theme !== 'dark'
                          ? 'bg-white text-zinc-900 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                          : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10'
                      }`}
                    >
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Light (Default)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, theme: 'dark' })}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        formData.theme === 'dark'
                          ? 'bg-[#18181c] text-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                          : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10'
                      }`}
                    >
                      <Moon className="w-4 h-4 text-indigo-400" />
                      <span>Dark Mode</span>
                    </button>
                  </div>
                </div>

                {/* Card 1: API Key */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#1a1a20] border border-zinc-200 dark:border-white/[0.06] space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Google Gemini API Key</span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Direct client-side connection to Google Cloud AI Studio</span>
                    </div>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 text-[11px] font-medium transition-colors"
                    >
                      <span>Get Free Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* API Key Input with Eye Toggle */}
                  <div className="relative">
                    <input
                      type={showKeyPassword ? 'text' : 'password'}
                      value={formData.apiKey}
                      onChange={(e) => {
                        setFormData({ ...formData, apiKey: e.target.value });
                        setTestStatus('idle');
                      }}
                      placeholder="AIzaSy..."
                      className="w-full bg-white dark:bg-[#121216] border border-zinc-200 dark:border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeyPassword(!showKeyPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5"
                      title={showKeyPassword ? 'Hide Key' : 'Show Key'}
                    >
                      {showKeyPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Compact Professional Action Toolbar: Test Key & Delete Key */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleTestApiKey}
                      disabled={testStatus === 'testing' || !formData.apiKey.trim()}
                      className={`h-8 px-3.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                        testStatus === 'success'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : testStatus === 'testing'
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 cursor-wait'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/20'
                      }`}
                    >
                      {testStatus === 'testing' ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin text-white" />
                          <span className="text-white font-semibold">Testing...</span>
                        </>
                      ) : testStatus === 'success' ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Connected</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>Test Key</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleClearKey}
                      disabled={!formData.apiKey || testStatus === 'testing'}
                      className="h-8 px-3.5 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                      title="Clear or remove saved API key"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete Key</span>
                    </button>
                  </div>

                  {/* Feedback Message (Only Shown After Test Completes, Zero Duplicate Spinners) */}
                  {testStatus === 'success' && (
                    <div className="text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5 pt-1.5 font-medium">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{testMessage}</span>
                    </div>
                  )}
                  {testStatus === 'error' && (
                    <div className="text-red-500 text-xs pt-1.5 font-medium leading-relaxed bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                      {testMessage}
                    </div>
                  )}
                </div>

                {/* Card 2: Model Picker - Only shows verified working model when API key is connected */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#1a1a20] border border-zinc-200 dark:border-white/[0.06] space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">
                      Active Google Gemini Free-Tier Model
                    </span>
                    {formData.apiKey && modelList.length > 0 && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        ● Verified Working
                      </span>
                    )}
                  </div>

                  {!formData.apiKey || formData.apiKey.trim().length === 0 || modelList.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#121216] border border-dashed border-zinc-300 dark:border-white/10 text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Enter your API key above and click &quot;Test Key&quot;</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        Syntax will automatically ping Google AI Studio and activate strictly the working free-tier model.
                      </p>
                    </div>
                  ) : modelList.length === 1 ? (
                    <div className="p-3 rounded-xl bg-white dark:bg-[#121216] border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-zinc-900 dark:text-white flex items-center gap-1.5">
                            <span>{modelList[0].name}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          </div>
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                            {modelList[0].id} • Free Tier
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Active & Verified
                      </span>
                    </div>
                  ) : (
                    <select
                      value={formData.selectedModel}
                      onChange={(e) => setFormData({ ...formData, selectedModel: e.target.value })}
                      className="w-full bg-white dark:bg-[#121216] border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm font-medium"
                    >
                      {modelList.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} - {m.badge}
                        </option>
                      ))}
                    </select>
                  )}
                  {formData.apiKey && modelList.length > 0 && (() => {
                    const currentModelObj = modelList.find((m) => m.id === formData.selectedModel) || modelList[0];
                    return (
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                        Active: <strong className="text-zinc-800 dark:text-zinc-200">{currentModelObj?.name}</strong> {currentModelObj?.description ? `(${currentModelObj.description})` : '(direct zero-cost free-tier access via Google Cloud AI Studio).'}
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* TAB 2: Instructions */}
            {activeTab === 'instructions' && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#1a1a20] border border-zinc-200 dark:border-white/[0.06] space-y-2.5 shadow-sm">
                  <div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">System Guidelines & Formatting</span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">How would you like Syntax to format answers and think?</span>
                  </div>
                  <textarea
                    value={formData.customSystemPrompt}
                    onChange={(e) => setFormData({ ...formData, customSystemPrompt: e.target.value })}
                    placeholder="e.g. Always write clean modern C++20, provide Big-O time and space complexity derivations, be concise..."
                    rows={4}
                    className="w-full bg-white dark:bg-[#121216] border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed shadow-sm"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#1a1a20] border border-zinc-200 dark:border-white/[0.06] space-y-2.5 shadow-sm">
                  <div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">User Background Profile</span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">What context should Syntax keep in mind about you?</span>
                  </div>
                  <textarea
                    value={formData.userCustomInstructions}
                    onChange={(e) => setFormData({ ...formData, userCustomInstructions: e.target.value })}
                    placeholder="e.g. Computer Science student, preparing algorithms, research projects in distributed systems..."
                    rows={3}
                    className="w-full bg-white dark:bg-[#121216] border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: Memory Knowledge Base */}
            {activeTab === 'memory' && (
              <div className="space-y-4 animate-fade-in">
                {/* Modern Switch Card */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#1a1a20] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-between shadow-sm">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Cross-Session Memory</span>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                      Enables Syntax to recall knowledge and preferences across all chats.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, memoryEnabled: !formData.memoryEnabled })}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                      formData.memoryEnabled ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      formData.memoryEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Add Memory Input Card */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#1a1a20] border border-zinc-200 dark:border-white/[0.06] space-y-3 shadow-sm">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Add Knowledge Item</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMemoryText}
                      onChange={(e) => setNewMemoryText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMemory();
                        }
                      }}
                      placeholder="e.g. Prefer algorithms in C++ with space/time complexity..."
                      className="flex-1 bg-white dark:bg-[#121216] border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddMemory}
                      disabled={!newMemoryText.trim()}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        newMemoryText.trim()
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-sm hover:bg-zinc-800 dark:hover:bg-zinc-200'
                          : 'bg-zinc-200 dark:bg-white/5 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Stored Memory List Card */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#1a1a20] border border-zinc-200 dark:border-white/[0.06] space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                      Saved Knowledge ({formData.memoryItems?.length || 0})
                    </span>
                    {formData.memoryItems && formData.memoryItems.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllMemories}
                        className="text-[11px] text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {(!formData.memoryItems || formData.memoryItems.length === 0) ? (
                    <div className="p-6 rounded-xl bg-white dark:bg-[#121216] border border-dashed border-zinc-200 dark:border-white/10 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                      No memories saved yet. Add your habits or preferences above so Syntax always remembers them.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {formData.memoryItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-white/[0.06] flex items-start justify-between gap-3 text-xs group hover:border-zinc-300 dark:hover:border-white/10 transition-colors shadow-sm"
                        >
                          {editingMemoryId === item.id ? (
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                value={editingMemoryText}
                                onChange={(e) => setEditingMemoryText(e.target.value)}
                                className="flex-1 bg-zinc-50 dark:bg-black/50 border border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-zinc-900 dark:text-white focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={handleSaveEditMemory}
                                className="px-2.5 py-1 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-black text-[11px] font-semibold"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingMemoryId(null)}
                                className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 text-[11px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1 min-w-0">
                                <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed">{item.text}</p>
                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-1 block">
                                  {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditMemory(item)}
                                  className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMemory(item.id)}
                                  className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-red-500"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Data Controls */}
            {activeTab === 'data' && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#1a1a20] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-between shadow-sm">
                  <div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Clear Chat Conversations</span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Deletes all saved chat threads from browser local storage.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDialog({
                        title: 'Delete all chat history?',
                        message: 'This will permanently remove all your saved chat threads and conversations. This action cannot be undone.',
                        confirmLabel: 'Delete All Chats',
                        onConfirm: () => {
                          onClearAllData();
                          setConfirmDialog(null);
                          onClose();
                        },
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Clear History
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#1a1a20] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-between shadow-sm">
                  <div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs block">Factory Reset</span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Resets API key, custom instructions, and memory to defaults.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDialog({
                        title: 'Factory reset Syntax?',
                        message: 'This will erase your API key, custom persona instructions, memories, and restored settings to fresh factory defaults. The page will reload.',
                        confirmLabel: 'Reset Everything',
                        onConfirm: () => {
                          localStorage.clear();
                          window.location.reload();
                        },
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-zinc-200 dark:bg-white/5 hover:bg-zinc-300 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-white/10 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Reset Everything
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="p-4 px-6 border-t border-zinc-200 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-[#16161b]/50 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold shadow-md transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>

      </div>

      {/* Modern Luxury Confirmation Dialog (ChatGPT / Claude Style) */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 select-none"
          onClick={() => setConfirmDialog(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#181922] border border-zinc-200/90 dark:border-white/10 shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-150 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/15 border border-red-200/70 dark:border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

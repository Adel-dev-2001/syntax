import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  Copy,
  Play,
  Pause,
  RotateCcw,
  Code as CodeIcon,
  Maximize2,
  Minimize2,
  ExternalLink,
  Terminal,
  X
} from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
  isStreaming?: boolean;
}

interface RunOutput {
  text: string;
  isError?: boolean;
  durationMs?: number;
}

type ViewTab = 'code' | 'preview';

// Languages that should strictly NEVER have an in-browser runner or "Live App" button
const NON_RUNNABLE_LANGUAGES = new Set([
  'bash', 'sh', 'shell', 'zsh', 'terminal', 'cmd', 'powershell', 'ps1',
  'json', 'yaml', 'yml', 'toml', 'ini', 'xml', 'env',
  'markdown', 'md', 'text', 'txt', 'plaintext', '',
  'dockerfile', 'docker', 'makefile',
  'sql',
  'python', 'py', // Native python scripts (e.g. pygame, numpy) require local python interpreter
  'c', 'cpp', 'c++', 'csharp', 'cs', 'java', 'rust', 'rs', 'go', 'golang',
  'php', 'ruby', 'rb', 'swift', 'kotlin', 'kt', 'dart', 'scala', 'r', 'lua'
]);

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code, isStreaming = false }) => {
  const [activeTab, setActiveTab] = useState<ViewTab>('code');
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [output, setOutput] = useState<RunOutput | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const cleanLang = (language || '').toLowerCase().trim();

  // 1. Detect genuine in-browser interactive web applications (HTML, Canvas, Games, SVG)
  const isInteractiveApp = (() => {
    // Explicitly non-runnable languages must never trigger interactive app
    if (NON_RUNNABLE_LANGUAGES.has(cleanLang)) return false;

    // Explicit HTML or SVG
    if (cleanLang === 'html' || cleanLang === 'svg') return true;

    // Code actually contains HTML structure
    if (code.includes('<!DOCTYPE html') || code.includes('<html')) return true;

    // Canvas visual game with actual canvas script
    if (code.includes('<canvas') && (code.includes('<script') || code.includes('getContext('))) return true;

    return false;
  })();

  // 2. Detect runnable pure browser JavaScript snippets
  const isRunnableScript = (() => {
    if (isInteractiveApp) return false;
    if (cleanLang === 'javascript' || cleanLang === 'js') {
      // Exclude Node.js backend modules or React JSX imports
      if (code.includes('require(') || code.includes('import express') || code.includes('from \'react\'')) {
        return false;
      }
      return true;
    }
    return false;
  })();

  // Only show runner / switch if the code can actually be executed in the browser
  const canRun = isInteractiveApp || isRunnableScript;

  // Focus iframe when switching to preview
  useEffect(() => {
    if (activeTab === 'preview' && isInteractiveApp && iframeRef.current) {
      setTimeout(() => {
        iframeRef.current?.focus();
      }, 100);
    }
  }, [activeTab, refreshKey, isInteractiveApp]);

  // Handle Escape key to close fullscreen (From both parent window and iframe postMessage)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    const handleMessage = (e: MessageEvent) => {
      if (e.data === 'SYNTAX_EXIT_FULLSCREEN') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy code:', e);
    }
  };

  const handleTogglePause = () => {
    setIsPaused((prev) => {
      const next = !prev;
      try {
        iframeRef.current?.contentWindow?.postMessage(
          next ? 'SYNTAX_PAUSE' : 'SYNTAX_RESUME',
          '*'
        );
      } catch (err) {}
      return next;
    });
  };

  // Build clean sandboxed HTML document with deep animation & timer pausing
  const getExecutableHtml = (): string => {
    // Intercept RAF, intervals, timeouts, audio, alert/confirm/prompt at the very beginning of execution
    const pauseInterceptorScript = `
<style id="syntax-pause-styles">
  .syntax-paused, .syntax-paused * {
    animation-play-state: paused !important;
  }
</style>
<script>
(function() {
  window.__syntax_is_paused = false;
  var _origRAF = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : null;
  var _origCAF = window.cancelAnimationFrame ? window.cancelAnimationFrame.bind(window) : null;
  var _origSetInterval = window.setInterval ? window.setInterval.bind(window) : null;
  var _origSetTimeout = window.setTimeout ? window.setTimeout.bind(window) : null;
  var _rafQueue = [];

  // Suppress all browser native alert/confirm/prompt popups with sleek centered in-app modal
  window.alert = function(msg) {
    try {
      var hud = document.getElementById('syntax-runner-toast');
      if (!hud) {
        hud = document.createElement('div');
        hud.id = 'syntax-runner-toast';
        hud.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%, -50%) scale(1);background:rgba(15,23,42,0.96);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:#f8fafc;padding:16px 26px;border-radius:18px;font-family:system-ui,-apple-system,sans-serif;font-size:13px;font-weight:600;box-shadow:0 25px 60px rgba(0,0,0,0.85),0 0 0 1px rgba(99,102,241,0.5);z-index:999999;text-align:center;max-width:85%;line-height:1.6;cursor:pointer;user-select:none;transition:all 0.2s cubic-bezier(0.16,1,0.3,1);';
        hud.onclick = function() {
          hud.style.opacity = '0';
          hud.style.transform = 'translate(-50%, -50%) scale(0.95)';
        };
        document.body.appendChild(hud);
      }
      hud.textContent = String(msg);
      hud.style.opacity = '1';
      hud.style.transform = 'translate(-50%, -50%) scale(1)';
      clearTimeout(window.__syntax_toast_timer);
      window.__syntax_toast_timer = setTimeout(function() {
        if (hud) {
          hud.style.opacity = '0';
          hud.style.transform = 'translate(-50%, -50%) scale(0.95)';
        }
      }, 4000);
    } catch(e) {}
  };
  window.confirm = function(msg) {
    console.log('[Confirm suppressed]:', msg);
    return true;
  };
  window.prompt = function(msg, def) {
    console.log('[Prompt suppressed]:', msg);
    return def || '';
  };

  if (_origRAF) {
    window.requestAnimationFrame = function(cb) {
      if (window.__syntax_is_paused) {
        _rafQueue.push(cb);
        return -1;
      }
      return _origRAF(function(time) {
        if (window.__syntax_is_paused) {
          _rafQueue.push(cb);
        } else {
          cb(time);
        }
      });
    };
  }

  if (_origSetInterval) {
    window.setInterval = function(fn, delay) {
      var args = Array.prototype.slice.call(arguments, 2);
      return _origSetInterval(function() {
        if (!window.__syntax_is_paused) {
          if (typeof fn === 'function') fn.apply(null, args);
          else if (typeof fn === 'string') eval(fn);
        }
      }, delay);
    };
  }

  if (_origSetTimeout) {
    window.setTimeout = function(fn, delay) {
      var args = Array.prototype.slice.call(arguments, 2);
      return _origSetTimeout(function retry() {
        if (window.__syntax_is_paused) {
          _origSetTimeout(retry, 50);
        } else {
          if (typeof fn === 'function') fn.apply(null, args);
          else if (typeof fn === 'string') eval(fn);
        }
      }, delay);
    };
  }

  function applyPause() {
    window.__syntax_is_paused = true;
    try {
      if (document.documentElement) document.documentElement.classList.add('syntax-paused');
      var media = document.querySelectorAll('audio, video');
      for (var i = 0; i < media.length; i++) {
        if (!media[i].paused) {
          media[i].__syntax_was_playing = true;
          media[i].pause();
        }
      }
    } catch(e) {}
  }

  function applyResume() {
    window.__syntax_is_paused = false;
    try {
      if (document.documentElement) document.documentElement.classList.remove('syntax-paused');
      var media = document.querySelectorAll('audio, video');
      for (var i = 0; i < media.length; i++) {
        if (media[i].__syntax_was_playing) {
          media[i].play().catch(function(){});
          media[i].__syntax_was_playing = false;
        }
      }
    } catch(e) {}

    var queued = _rafQueue.slice();
    _rafQueue = [];
    for (var j = 0; j < queued.length; j++) {
      if (_origRAF) _origRAF(queued[j]);
    }
  }

  window.addEventListener('message', function(e) {
    if (e.data === 'SYNTAX_PAUSE') {
      applyPause();
    } else if (e.data === 'SYNTAX_RESUME') {
      applyResume();
    }
  });

  window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      try {
        window.parent.postMessage('SYNTAX_EXIT_FULLSCREEN', '*');
      } catch(err) {}
    }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
      e.preventDefault();
    }
  }, { passive: false });
})();
</script>`;

    const hasDoctype = code.includes('<!DOCTYPE') || code.includes('<html');

    if (hasDoctype) {
      if (code.includes('<head>')) {
        return code.replace('<head>', `<head>${pauseInterceptorScript}`);
      }
      if (/<head[^>]*>/i.test(code)) {
        return code.replace(/(<head[^>]*>)/i, `$1${pauseInterceptorScript}`);
      }
      if (/<html[^>]*>/i.test(code)) {
        return code.replace(/(<html[^>]*>)/i, `$1<head>${pauseInterceptorScript}</head>`);
      }
      return `${pauseInterceptorScript}${code}`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  ${pauseInterceptorScript}
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: auto;
      background: #0d0f17;
      color: #f1f5f9;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      user-select: none;
    }
    canvas {
      display: block;
      background: #000;
      border: 2px solid #6366f1;
      border-radius: 12px;
      box-shadow: 0 16px 40px rgba(0,0,0,0.85);
      max-width: 96%;
      max-height: 92vh;
      object-fit: contain;
    }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
  };

  const handleOpenNewTab = () => {
    try {
      const html = getExecutableHtml();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.error('Failed to open in new tab:', e);
    }
  };

  // Switch to Runner / Output View
  const handleSwitchToRun = async () => {
    if (activeTab === 'preview') return;
    setIsPaused(false);

    // Interactive web app or game
    if (isInteractiveApp) {
      setActiveTab('preview');
      setRefreshKey((k) => k + 1);
      setTimeout(() => {
        iframeRef.current?.focus();
      }, 100);
      return;
    }

    // Execute runnable browser JavaScript
    if (isRunnableScript) {
      setIsRunning(true);
      const startTime = performance.now();
      try {
        const logs: string[] = [];
        const formatArg = (a: any): string => {
          if (typeof a === 'object' && a !== null) {
            try {
              return JSON.stringify(a, null, 2);
            } catch {
              return String(a);
            }
          }
          return String(a);
        };

        const customConsole = {
          log: (...args: any[]) => logs.push(args.map(formatArg).join(' ')),
          warn: (...args: any[]) => logs.push('[WARN] ' + args.map(formatArg).join(' ')),
          error: (...args: any[]) => logs.push('[ERROR] ' + args.map(formatArg).join(' ')),
          info: (...args: any[]) => logs.push(args.map(formatArg).join(' ')),
        };

        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
        const runFn = new AsyncFunction('console', `"use strict";\n${code}`);
        const result = await runFn(customConsole);

        if (result !== undefined) {
          logs.push(`↳ Return: ${formatArg(result)}`);
        }

        const durationMs = Math.round((performance.now() - startTime) * 10) / 10;
        setOutput({
          text: logs.length > 0 ? logs.join('\n') : '[Code executed successfully with exit code 0]',
          isError: false,
          durationMs,
        });
      } catch (err: any) {
        setOutput({
          text: `Error: ${err.message}`,
          isError: true,
          durationMs: Math.round(performance.now() - startTime),
        });
      } finally {
        setIsRunning(false);
        setActiveTab('preview');
      }
    }
  };

  const handleRestart = () => {
    setRefreshKey((k) => k + 1);
    setIsPaused(false);
    if (isRunnableScript) {
      handleSwitchToRun();
    } else {
      setTimeout(() => iframeRef.current?.focus(), 50);
    }
  };

  return (
    <>
      <div
        dir="ltr"
        className="my-3 w-full rounded-2xl overflow-hidden bg-[#161720] shadow-lg shadow-black/5 dark:shadow-[0_4px_30px_rgba(0,0,0,0.5),0_0_25px_rgba(99,102,241,0.06)] select-text font-mono text-xs text-left transition-all"
      >
        {/* Header - Always LTR */}
        <div className="flex items-center justify-between px-3.5 py-2 bg-[#1e202a] text-xs">
          {/* Left: Language & Optional Mode Switcher (ONLY when code is runnable) */}
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-zinc-300 font-semibold text-xs lowercase tracking-wide">
              {cleanLang || 'code'}
            </span>

            {/* In-Place View Switcher: ONLY for interactive web apps or runnable scripts */}
            {canRun && !isStreaming && (
              <div className="flex items-center p-0.5 rounded-lg bg-black/40">
                <button
                  type="button"
                  onClick={() => setActiveTab('code')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-sans font-medium transition-all ${
                    activeTab === 'code'
                      ? 'bg-zinc-800 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  } cursor-pointer`}
                  title="View code"
                >
                  <CodeIcon className="w-3.5 h-3.5" />
                  <span>Code</span>
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToRun}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-sans font-medium transition-all ${
                    activeTab === 'preview'
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  } cursor-pointer`}
                  title={isInteractiveApp ? 'Run interactive app' : 'Execute code'}
                >
                  {isRunning ? (
                    <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : isInteractiveApp ? (
                    <Play className="w-3 h-3 fill-current" />
                  ) : (
                    <Terminal className="w-3 h-3" />
                  )}
                  <span>{isInteractiveApp ? 'Live App' : 'Run'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Live Preview Controls: Restart, Pause, Fullscreen, New Tab */}
            {canRun && activeTab === 'preview' && (
              <>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="px-2 py-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                  title="Restart"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Restart</span>
                </button>

                {isInteractiveApp && (
                  <>
                    <button
                      type="button"
                      onClick={handleTogglePause}
                      className={`px-2 py-1 rounded-md flex items-center gap-1 text-[11px] transition-colors cursor-pointer ${
                        isPaused
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'text-zinc-400 hover:text-white hover:bg-white/10'
                      }`}
                      title={isPaused ? "Resume game" : "Pause game"}
                    >
                      {isPaused ? (
                        <>
                          <Play className="w-3 h-3 fill-current text-amber-400" />
                          <span className="font-semibold text-amber-400">Resume</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-3 h-3" />
                          <span className="hidden sm:inline">Pause</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsFullscreen(true)}
                      className="px-2 py-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                      title="Fullscreen"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Fullscreen</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenNewTab}
                      className="px-2 py-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="hidden sm:inline">New Tab</span>
                    </button>
                  </>
                )}
              </>
            )}

            {/* Copy Button (Always present) */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-sans font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer"
              title="Copy code"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* View 1: Code View (Default with Professional Line Numbers Gutter) */}
        {(!canRun || activeTab === 'code') && (
          <div className="p-4 overflow-x-auto text-[13px] leading-relaxed text-[#e6edf3] font-mono">
            <div className="flex min-w-full">
              {/* Line Numbers Gutter (Unselectable, perfectly aligned) */}
              <div
                className="pr-3.5 mr-3.5 text-right select-none text-zinc-600 dark:text-zinc-600 font-mono text-xs border-r border-white/10 flex flex-col flex-shrink-0"
                aria-hidden="true"
              >
                {code.split('\n').map((_, i) => (
                  <span key={i} className="leading-relaxed">
                    {i + 1}
                  </span>
                ))}
              </div>

              {/* Code Content (Selectable & Copyable) */}
              <pre className="flex-1 font-mono font-normal overflow-visible m-0 p-0 text-[13px]">
                <code className="block leading-relaxed">{code}</code>
              </pre>
            </div>
          </div>
        )}

        {/* View 2: Live Interactive Sandbox / Output View (Replaces code in-place) */}
        {canRun && activeTab === 'preview' && (
          isInteractiveApp ? (
            <div className="relative bg-[#0c0d12] animate-in fade-in duration-150 overflow-hidden">
              <iframe
                key={refreshKey}
                ref={iframeRef}
                srcDoc={getExecutableHtml()}
                title="Interactive App Sandbox"
                sandbox="allow-scripts allow-forms allow-modals"
                className="w-full h-[480px] sm:h-[540px] border-none bg-black block"
              />

              {/* Modern Minimalist Unified Pause Pill (No redundant stacked buttons) */}
              {isPaused && (
                <div
                  onClick={handleTogglePause}
                  className="absolute inset-0 z-30 bg-black/70 backdrop-blur-xs flex items-center justify-center cursor-pointer animate-in fade-in duration-150 select-none p-4"
                >
                  <div className="group relative flex items-center gap-3.5 px-6 py-3.5 rounded-full bg-zinc-900/95 hover:bg-zinc-800 border border-white/15 backdrop-blur-xl shadow-2xl shadow-black/80 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-indigo-600 group-hover:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/40 transition-transform group-hover:scale-110">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-white tracking-wide">Game Paused</span>
                      <span className="text-[10px] text-zinc-400 group-hover:text-zinc-200 transition-colors">Click anywhere to resume</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#0c0d12] p-4 text-xs font-mono min-h-[160px] max-h-[380px] overflow-y-auto animate-in fade-in duration-150">
              {output ? (
                <>
                  <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-white/[0.06] text-[11px]">
                    <span className={`flex items-center gap-1.5 font-medium ${output.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                      <span>{output.isError ? '✕ Error' : '✓ Execution Output'}</span>
                      {output.durationMs !== undefined && (
                        <span className="text-zinc-500 font-normal">({output.durationMs}ms)</span>
                      )}
                    </span>
                  </div>
                  <pre className={`whitespace-pre-wrap leading-relaxed text-[12.5px] ${output.isError ? 'text-red-300' : 'text-zinc-200'}`}>
                    {output.text}
                  </pre>
                </>
              ) : (
                <div className="flex items-center justify-center h-32 text-zinc-500">
                  Click Run to execute code.
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Fullscreen Overlay Modal for Games / Interactive Web Apps */}
      {isFullscreen && (
        <div
          dir="ltr"
          className="fixed inset-0 z-[9999] bg-[#090a0f] flex flex-col p-3 sm:p-4 animate-in fade-in duration-200 select-none text-left"
        >
          {/* Prominent High-Contrast Floating Exit Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[99999] flex items-center gap-2 px-3.5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-2xl border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Exit Fullscreen (Esc)"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span className="font-semibold">Exit Fullscreen</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-mono">Esc</kbd>
          </button>

          {/* Fullscreen Top Bar */}
          <div className="flex items-center justify-between pb-3 px-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-white">Syntax Live Runner</span>
              <span className="text-xs text-zinc-400 font-mono">({cleanLang})</span>
            </div>

            <div className="flex items-center gap-2 pr-40 sm:pr-48">
              <button
                type="button"
                onClick={handleRestart}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Restart</span>
              </button>

              <button
                type="button"
                onClick={handleTogglePause}
                className={`p-2 rounded-xl flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${
                  isPaused
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
                }`}
                title={isPaused ? "Resume game" : "Pause game"}
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 fill-current text-amber-400" />
                    <span className="font-semibold text-amber-400">Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    <span className="hidden sm:inline">Pause</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleOpenNewTab}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">New Tab</span>
              </button>
            </div>
          </div>

          {/* Fullscreen Iframe Viewport */}
          <div className="flex-1 w-full mt-3 rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl relative">
            <iframe
              key={`fs-${refreshKey}`}
              srcDoc={getExecutableHtml()}
              title="Fullscreen Interactive App"
              sandbox="allow-scripts allow-forms allow-modals"
              className="w-full h-full border-none"
            />

            {/* Modern Minimalist Unified Pause Pill in Fullscreen */}
            {isPaused && (
              <div
                onClick={handleTogglePause}
                className="absolute inset-0 z-30 bg-black/70 backdrop-blur-xs flex items-center justify-center cursor-pointer animate-in fade-in duration-150 select-none p-4"
              >
                <div className="group relative flex items-center gap-3.5 px-6 py-3.5 rounded-full bg-zinc-900/95 hover:bg-zinc-800 border border-white/15 backdrop-blur-xl shadow-2xl shadow-black/80 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 group-hover:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/40 transition-transform group-hover:scale-110">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white tracking-wide">Game Paused</span>
                    <span className="text-[10px] text-zinc-400 group-hover:text-zinc-200 transition-colors">Click anywhere to resume</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

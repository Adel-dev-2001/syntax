import { ChatSession } from '../types/chat';

/**
 * Authentic Syntax SVG Logo (Official 4-point AI Star Spark Vector)
 */
const SYNTAX_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" width="36" height="36" style="display: block; flex-shrink: 0;">
  <defs>
    <linearGradient id="syntax-spark-grad-pdf" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="40%" stop-color="#6366f1" />
      <stop offset="75%" stop-color="#06b6d4" />
      <stop offset="100%" stop-color="#38bdf8" />
    </linearGradient>
    <linearGradient id="inner-spark-pdf" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#e0e7ff" />
    </linearGradient>
  </defs>
  <path d="M50 6 C50 32 32 50 6 50 C32 50 50 68 50 94 C50 68 68 50 94 50 C68 50 50 32 50 6 Z" fill="url(#syntax-spark-grad-pdf)" />
  <path d="M50 30 C50 42 42 50 30 50 C42 50 50 58 50 70 C50 58 58 50 70 50 C58 50 50 42 50 30 Z" fill="url(#inner-spark-pdf)" opacity="0.9" />
</svg>
`;

/**
 * High-Fidelity Multi-Language PDF Exporter:
 * Generates an executive, 100% selectable and copyable vector PDF document with true
 * Unicode support for Arabic (RTL, Cairo font), English (Inter), code blocks, and the
 * official Syntax vector logo.
 */
export async function exportConversationToPdf(session: ChatSession): Promise<void> {
  if (!session || !session.messages || session.messages.length === 0) {
    throw new Error('Conversation has no messages to export.');
  }

  const title = session.title || 'Syntax Conversation';
  const cleanTitle = title.replace(/[^a-zA-Z0-9_\u0600-\u06FF\s-]/g, '').trim().replace(/\s+/g, '_') || 'Syntax_Conversation';
  const dateStr = new Date(session.createdAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatMarkdownToHtml = (content: string): string => {
    if (!content) return '';

    let html = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Multi-line Code blocks ```lang ... ```
    html = html.replace(/```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<div style="background: #0f172a; color: #f8fafc; border-radius: 8px; padding: 12px 16px; margin: 12px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11.5px; line-height: 1.6; white-space: pre-wrap; word-break: break-all; direction: ltr; text-align: left; border: 1px solid #1e293b;"><div style="color: #94a3b8; font-size: 10px; text-transform: uppercase; margin-bottom: 6px; font-weight: bold; border-bottom: 1px solid #334155; padding-bottom: 4px;">${lang || 'Code'}</div>${code}</div>`;
    });

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code style="background: #f1f5f9; color: #4338ca; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; border: 1px solid #e2e8f0;">$1</code>');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 14.5px; font-weight: 700; color: #0f172a; margin: 12px 0 6px 0; direction: auto;">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 14px 0 6px 0; direction: auto;">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 16px 0 8px 0; direction: auto;">$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #0f172a; font-weight: 700;">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em style="color: #334155;">$1</em>');

    // Lists
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li style="margin: 4px 0; direction: auto;">$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul style="margin: 6px 0 6px 18px; padding-left: 8px;">$1</ul>');

    // Line breaks
    html = html.replace(/\n\n/g, '<div style="height: 8px;"></div>');
    html = html.replace(/\n/g, '<br/>');

    return html;
  };

  const messagesHtml = session.messages.map((msg) => {
    const isUser = msg.role === 'user';
    const senderTitle = isUser ? 'You' : 'Syntax';
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedBody = formatMarkdownToHtml(msg.content);

    const imagesHtml = msg.images && msg.images.length > 0
      ? `<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
          ${msg.images.map((img) => `<img src="${img}" style="max-height: 200px; max-width: 100%; border-radius: 8px; border: 1px solid #e2e8f0; object-fit: contain;" />`).join('')}
         </div>`
      : '';

    return `
      <div class="message-card" style="margin-bottom: 18px; page-break-inside: avoid; break-inside: avoid;">
        <div style="background: ${isUser ? '#f8fafc' : '#ffffff'}; border: 1px solid ${isUser ? '#e2e8f0' : '#e0e7ff'}; border-radius: 12px; padding: 16px 18px; box-shadow: ${isUser ? 'none' : '0 2px 6px rgba(99, 102, 241, 0.04)'};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid ${isUser ? '#edf2f7' : '#f1f5f9'};">
            <div style="display: flex; align-items: center; gap: 8px;">
              ${
                isUser
                  ? `<div style="width: 22px; height: 22px; border-radius: 6px; background: #e2e8f0; color: #334155; display: flex; align-items: center; justify-content: center; font-size: 11px;">👤</div>`
                  : `<div style="width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">${SYNTAX_LOGO_SVG}</div>`
              }
              <span style="font-weight: 700; font-size: 12.5px; color: ${isUser ? '#1e293b' : '#4338ca'};">
                ${senderTitle}
              </span>
            </div>
            <span style="font-size: 10px; color: #94a3b8; font-weight: 500;">${time}</span>
          </div>

          ${imagesHtml}

          <div style="font-size: 13px; line-height: 1.7; color: #1e293b; direction: auto; text-align: start; unicode-bidi: plaintext; user-select: text !important;">
            ${formattedBody}
          </div>
        </div>
      </div>
    `;
  }).join('');

  const fullPrintHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Syntax_${cleanTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background: #ffffff;
      color: #1e293b;
      font-family: 'Cairo', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 24px 32px;
      margin: 0 auto;
      max-width: 820px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      user-select: text !important;
    }

    @page {
      size: A4;
      margin: 14mm 12mm;
    }

    .header-container {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 22px;
    }

    .brand-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .brand-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-title {
      font-size: 19px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
    }

    .brand-sub {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }

    .meta-badge {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 6px 12px;
      text-align: right;
    }

    .doc-title {
      font-size: 19px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 10px;
      margin-bottom: 4px;
      direction: auto;
      text-align: start;
    }

    .meta-details {
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }

    .footer-bar {
      border-top: 1.5px solid #e2e8f0;
      padding-top: 14px;
      margin-top: 26px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10.5px;
      color: #94a3b8;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="header-container">
    <div class="brand-row">
      <div class="brand-left">
        ${SYNTAX_LOGO_SVG}
        <div>
          <div class="brand-title">Syntax</div>
          <div class="brand-sub">Intelligent AI Workspace • Created by Adel Mohamed</div>
        </div>
      </div>
      <div class="meta-badge">
        <div style="font-size: 9.5px; font-weight: 700; color: #6366f1; text-transform: uppercase;">Official Export</div>
        <div style="font-size: 10.5px; color: #475569; font-weight: 600;">${dateStr}</div>
      </div>
    </div>

    <div class="doc-title">${title}</div>
    <div class="meta-details">
      <span><strong>Model:</strong> ${session.model || 'Gemini 2.5 Flash'}</span>
      <span>•</span>
      <span><strong>Messages:</strong> ${session.messages.length}</span>
      <span>•</span>
      <span>100% Vector Text &amp; Multi-Language Support</span>
    </div>
  </div>

  <div class="messages-container">
    ${messagesHtml}
  </div>

  <div class="footer-bar">
    <span>Generated by <strong>Syntax</strong> • Engineered &amp; Developed by <strong>Adel Mohamed</strong></span>
    <span>100% Selectable &amp; Searchable PDF Document</span>
  </div>
</body>
</html>`;

  // Create an invisible iframe for native vector PDF print
  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'fixed';
  printIframe.style.right = '0';
  printIframe.style.bottom = '0';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = '0';
  printIframe.style.visibility = 'hidden';

  document.body.appendChild(printIframe);

  try {
    const iframeDoc = printIframe.contentWindow?.document;
    if (!iframeDoc) throw new Error('Could not access print frame.');

    iframeDoc.open();
    iframeDoc.write(fullPrintHtml);
    iframeDoc.close();

    // Allow CSS, Google Fonts, and SVG vectors to layout smoothly
    await new Promise((res) => setTimeout(res, 400));

    printIframe.contentWindow?.focus();
    printIframe.contentWindow?.print();

    // Clean up iframe after dialog opens
    setTimeout(() => {
      if (document.body.contains(printIframe)) {
        document.body.removeChild(printIframe);
      }
    }, 2000);
  } catch (err) {
    if (document.body.contains(printIframe)) {
      document.body.removeChild(printIframe);
    }
    throw err;
  }
}

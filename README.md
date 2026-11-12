<div align="center">

  <img src="public/favicon.svg" alt="Syntax Logo" width="96" />

  # Syntax
  ### Conversational AI & Developer Workspace

  Built and maintained by [**Adel Mohamed**](https://github.com/Adel-dev-2001)

  [![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Google Gemini API](https://img.shields.io/badge/API-Google_Gemini-4285F4?style=flat-square&logo=google&logoColor=white)](https://aistudio.google.com/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-2ea44f?style=flat-square)](LICENSE)

  [**Live Application**](https://adel-dev-2001.github.io/syntax/) | [**Source Repository**](https://github.com/Adel-dev-2001/syntax)

</div>

---

## Overview

**Syntax** is a client-side web application designed for software development, algorithmic problem-solving, and technical research. It connects directly to Google's Gemini REST API from the browser, allowing users to interact with live language models, run HTML/Canvas/JavaScript code snippets inside an isolated sandbox, manage persistent conversation histories, and export discussions to printable vector PDF documents.

The application runs entirely in the browser without an intermediate backend server. User settings, conversation logs, custom instructions, and API keys are stored locally in the browser's `localStorage` and are only transmitted directly to Google's official API endpoints over HTTPS.

---

## Academic & Learning Context Note

> **Note for Academic Reviewers and Evaluation Committees:**
>
> This project was developed by **Adel Mohamed** as part of a self-directed learning journey in software engineering, modern frontend development, and practical AI integration. The primary educational goals of building Syntax were to gain hands-on experience in:
> - Designing modular single-page applications with React and TypeScript.
> - Authenticating and communicating with external REST APIs (Google Gemini API), handling asynchronous data streams, and managing rate limits and error states gracefully.
> - Implementing client-side state persistence, browser security practices (such as sandboxed iframes and input sanitization), and technical documentation.
>
> Because this application was built as an educational project while actively learning and experimenting with these technologies, certain architectural patterns or edge cases may still have room for further refinement and optimization. Constructive feedback and academic review are always welcome as part of this ongoing learning process.

---

## Key Features

### 1. Live Google Gemini API Connection & Dynamic Model Discovery
- **Direct API Integration:** Communicates directly with `https://generativelanguage.googleapis.com/v1beta/models` using the user's Google AI Studio API key.
- **Forward-Compatible Model Discovery:** Instead of relying only on static model names, Syntax queries the live models endpoint, parses version numbers dynamically (supporting current `2.x` and `3.x` series as well as future model releases), and filters strictly for conversational free-tier models (`flash` and `lite` families) while excluding non-text endpoints (such as image-only, audio, or embedding models).
- **Live HTTP Verification:** When testing or syncing an API key, the system sends a lightweight verification request (`maxOutputTokens: 1`) to candidate models in parallel and keeps only the models that respond with an active status (`200 OK`).
- **Real-Time Model Switching & Failover:** Users can switch between verified models directly from the top header bar or the Settings modal. If the active model hits a per-minute rate limit (`HTTP 429`) or becomes unavailable (`HTTP 404`), Syntax automatically falls back to the next verified working model and displays a status notification.

### 2. Interactive Code Block & Sandboxed Execution
- **Code Formatting & Actions:** Renders fenced code blocks with language labels, line numbering support, one-click clipboard copy, and direct source file download.
- **In-Browser Live Runner:** Detects runnable web code (HTML5, CSS, SVG, Canvas applications, and pure browser JavaScript) and provides an in-place toggle between the **Code** view and the **Live App / Output** view.
- **Isolated Iframe Sandbox:** Interactive web previews execute inside a restricted iframe (`sandbox="allow-scripts allow-forms allow-modals"`) without `allow-same-origin`. This isolates the executed code in an opaque origin so it cannot access parent `localStorage`, cookies, or stored API keys.
- **Execution Controls:** Includes pause/resume overlays for Canvas games, a restart button, execution timing metrics for JavaScript console outputs, an option to open the preview in a separate tab, and a fullscreen view with `Esc` key support.

### 3. Conversation Management & Workflow Tools
- **Multi-Session Architecture:** Create unlimited chat sessions, rename titles, pin important conversations to the top of the sidebar, or delete sessions via a confirmation dialog.
- **Instant Search (`Ctrl + K`):** Filter saved conversations in real time by matching against both chat titles and message bodies.
- **Concurrent Background Generation:** Start a new conversation or switch between existing chats while another session is actively waiting for or streaming a response in the background.
- **Inline Prompt Editing:** Edit any previously sent user message in place to update the prompt and regenerate the assistant's response from that point in the conversation.
- **Multimodal Image Attachments:** Attach one or more images (up to 10MB per image) to analyze screenshots, diagrams, or code snippets alongside text prompts.

### 4. Custom Instructions, Memory & Domain Personas
- **Custom System Instructions:** Configure persistent system-level behavior rules and user background details in the Settings modal.
- **Memory Bank:** Add, edit, enable/disable, or delete specific personal notes and preferences that are appended to the model context across sessions.
- **Built-In Personas:** Includes pre-configured system prompts for:
  - *Syntax Algorithms & ICPC* (data structures, graph theory, and complexity analysis)
  - *CS Academic Researcher* (research structuring, formal computer science theory, and academic writing)
  - *Low-Level & Cloud Architect* (systems programming, concurrency, and backend architecture)
  - *Russian-English CS Bridge* (bilingual technical terminology and academic translation)

### 5. Vector PDF Export
- **Selectable PDF Reports:** Exports any conversation directly to a formatted PDF document (`pdfExportService.ts`).
- **Multilingual Typography:** Supports both Left-to-Right (English, Russian) and Right-to-Left (Arabic) text layout, preserving code blocks, timestamps, and conversation metadata.

### 6. System Alerts & Theme Support
- **Real-Time Status Notifications:** Displays clear toast alerts for network disconnection/reconnection, API rate-limit exhaustion (`HTTP 429`), safety filter blocks, and automatic model failovers.
- **Light & Dark Themes:** Initializes in light mode by default with an instant toggle to dark mode, backed by an inline script in `index.html` to prevent theme flickering on page load.

---

## Security & SEO Implementation

### Security Measures
- **Local-Only Credential Storage:** API keys are stored in the user's browser `localStorage` (`syntax_ai_settings_v1`) and sent strictly to `generativelanguage.googleapis.com` via the `X-goog-api-key` request header.
- **Sandbox Origin Isolation:** The code runner iframe omits `allow-same-origin` to prevent untrusted scripts from reading parent storage.
- **Safe Markdown Link Parsing:** Inline markdown links (`[label](url)`) are validated to allow only `http://` and `https://` protocols, preventing `javascript:` or `data:` URI injection, and are rendered with `target="_blank" rel="noopener noreferrer"`.

### SEO & Structured Data
- **Metadata & Social Cards:** Configured in `index.html` with canonical URLs, meta descriptions, keywords, Open Graph (`og:*`) tags, and Twitter Card metadata.
- **Schema.org JSON-LD:** Includes structured data graphs for `WebApplication` and `Person` (author attribution).
- **Indexing Assets:** Includes `public/robots.txt`, `public/sitemap.xml`, and a Progressive Web App manifest (`public/manifest.json`) with relative asset paths for compatibility with both root domains and GitHub Pages subpaths.

---

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| **UI Framework** | React 18.3 (Functional Components & Hooks) |
| **Language** | TypeScript 5.7 |
| **Build Tool** | Vite 6.0 |
| **Styling** | Tailwind CSS 3.4 & PostCSS |
| **Icons** | Lucide React |
| **PDF Generation** | Custom HTML/Vector Print Engine & jsPDF |
| **API Provider** | Google Gemini REST API (`v1beta`) |

---

## Project Structure

```text
syntax/
├── .github/
│   └── workflows/
│       └── deploy.yml                  # GitHub Actions workflow for GitHub Pages deployment
├── public/
│   ├── favicon.svg                     # Application vector icon
│   ├── logo.svg                        # Brand vector logo
│   ├── manifest.json                   # Web App Manifest
│   ├── robots.txt                      # Search crawler rules
│   └── sitemap.xml                     # XML sitemap
├── src/
│   ├── components/
│   │   ├── ChatHeader.tsx              # Top bar, live model selector, and theme toggle
│   │   ├── ChatInput.tsx               # Auto-resizing prompt input and image attachment bar
│   │   ├── ChatMessage.tsx             # Message renderer, markdown parser, and inline editor
│   │   ├── CodeBlock.tsx               # Code viewer and sandboxed HTML/JS runner
│   │   ├── ConversationOptionsMenu.tsx # Pin, rename, PDF export, and delete dropdown
│   │   ├── RenameModal.tsx             # Modal dialog for renaming chat sessions
│   │   ├── SettingsModal.tsx           # API key configuration, model tester, instructions, memory
│   │   ├── Sidebar.tsx                 # Collapsible session list, search bar, and delete modal
│   │   └── ToastContainer.tsx          # Notification toasts for network and API events
│   ├── data/
│   │   └── personas.ts                 # Pre-defined system personas and sample prompts
│   ├── services/
│   │   ├── geminiApi.ts                # Google Gemini API client, model ranker, and live verifier
│   │   ├── pdfExportService.ts         # Multi-language vector PDF export service
│   │   └── storageService.ts           # localStorage wrapper and state migration logic
│   ├── types/
│   │   └── chat.ts                     # TypeScript interfaces for messages, sessions, and settings
│   ├── App.tsx                         # Main application state and session controller
│   ├── index.css                       # Global styles and Tailwind imports
│   └── main.tsx                        # React application entry point
├── index.html                          # HTML shell, SEO meta tags, and JSON-LD schema
├── LICENSE                             # MIT License
├── package.json                        # Scripts and dependencies
├── postcss.config.js                   # PostCSS configuration
├── tailwind.config.js                  # Tailwind CSS configuration
├── tsconfig.json                       # TypeScript compiler configuration
└── vite.config.ts                      # Vite build configuration (relative base path)
```

---

## Getting Started Locally

### Prerequisites
- **Node.js** (v18.0.0 or newer)
- **npm** (v9.0.0 or newer)

### 1. Clone the Repository
```bash
git clone https://github.com/Adel-dev-2001/syntax.git
cd syntax
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 4. Build for Production
```bash
npm run build
```
The production-ready static files will be generated in the `dist/` directory.

---

## Configuring a Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and create a free API key.
2. Open **Syntax** and click **Settings** in the bottom-left corner of the sidebar.
3. Paste your key into the **Google Gemini API Key** field and click **Test Key**.
4. Syntax will verify the key against Google's servers, discover the active free-tier models available for your account, and save your configuration locally.

---

## Author

- **Adel Mohamed**
- **GitHub:** [@Adel-dev-2001](https://github.com/Adel-dev-2001)
- **Repository:** [github.com/Adel-dev-2001/syntax](https://github.com/Adel-dev-2001/syntax)

---

## License

This project is licensed under the [MIT License](LICENSE).

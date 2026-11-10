<div align="center">

  <img src="public/favicon.svg" alt="Syntax Logo" width="110" />

  # ⚡ SYNTAX
  ### Next-Generation Conversational AI & Developer Intelligence Platform

  **An executive-grade, client-orchestrated AI interface engineered for modern software development, theoretical research, and algorithmic analysis.**  
  *Engineered & Architected by **Adel Mohamed**.*

  <br />

  [![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Google Gemini API](https://img.shields.io/badge/Google_Gemini-API_Orchestration-8E75C4?style=for-the-badge&logo=google&logoColor=white)](https://aistudio.google.com/)
  [![Privacy](https://img.shields.io/badge/Privacy-Zero--Knowledge_Client--Side-emerald?style=for-the-badge&logo=shield)](https://github.com/Adel-dev-2001/syntax)
  [![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## 📑 Table of Contents

- [Executive Summary](#-executive-summary)
- [Academic Context & Scholarship Committee Statement](#-academic-context--scholarship-committee-statement)
- [Commercial & Enterprise Deployment Viability](#-commercial--enterprise-deployment-viability)
- [Core Architectural Innovations](#-core-architectural-innovations)
  - [1. Dynamic Model Discovery & Live API Orchestration](#1-dynamic-model-discovery--live-api-orchestration)
  - [2. Multi-Tier Resilient Fallback Cascade](#2-multi-tier-resilient-fallback-cascade)
  - [3. Isolated In-Browser Code Execution Sandbox](#3-isolated-in-browser-code-execution-sandbox)
  - [4. Multi-Language High-Fidelity Vector PDF Engine](#4-multi-language-high-fidelity-vector-pdf-engine)
  - [5. Zero-Knowledge Client-Side Data Architecture](#5-zero-knowledge-client-side-data-architecture)
  - [6. Multi-Domain Specialized Intelligence Personas](#6-multi-domain-specialized-intelligence-personas)
- [Security Architecture & Threat Modeling](#-security-architecture--threat-modeling)
- [Search Engine Optimization (SEO) & Schema.org](#-search-engine-optimization-seo--schemaorg)
- [Technical Stack & System Specifications](#-technical-stack--system-specifications)
- [Project Directory Structure](#-project-directory-structure)
- [Installation & Local Deployment Guide](#-installation--local-deployment-guide)
- [Production Deployment Protocols](#-production-deployment-protocols)
- [Creator & Academic Attribution](#-creator--academic-attribution)
- [License](#-license)

---

## 🏛️ Executive Summary

**Syntax** is an autonomous, high-performance conversational intelligence and code execution platform. Developed by **Adel Mohamed**, the platform bridges cutting-edge Large Language Model (LLM) orchestration with client-side reactive web engineering.

Unlike typical monolithic web wrappers that rely on expensive intermediate backend servers, Syntax operates on a **zero-overhead, client-orchestrated serverless topology**. It interfaces directly with Google Cloud's Gemini API endpoints using secure client-side communication channels, dynamic model version parsing, live token usage analytics, and local memory preservation.

Syntax is engineered to satisfy two complementary standards:
1. **Academic Rigor:** Serving as an advanced applied research capstone in distributed AI orchestration, algorithm optimization, and secure browser sandboxing.
2. **Commercial Readiness:** Ready for direct white-label acquisition, enterprise SaaS deployment, or internal corporate software tooling.

---

## 🎓 Academic Context & Scholarship Committee Statement

> [!NOTE]
> ### 📜 Statement for the Academic Evaluation Committee (Russian Government Scholarship / Rossotrudnichestvo / Open Doors)
>
> This software architecture was conceptualized, designed, and constructed by **Adel Mohamed** as part of an applied learning and research trajectory in modern Computer Science, Artificial Intelligence system orchestration, and reactive frontend software engineering.
>
> **Pedagogical Objectives & Investigative Scope:**
> - **Applied AI Orchestration:** Investigating client-side latency, token consumption patterns, and streaming protocols when interfacing with hyperscale LLM REST/gRPC interfaces.
> - **Fault-Tolerant Dynamic Cascading:** Formulating deterministic fallback algorithms capable of mitigating HTTP 429 (rate-limit resource exhaustion), API deprecation, and unexpected upstream gateway timeouts without interrupting the user's conversational flow.
> - **Browser-Level Sandboxing & Security Primitives:** Implementing zero-trust iframe virtualization with opaque origin isolation (`sandbox="allow-scripts allow-forms allow-modals"`) to allow untrusted generated JavaScript and Canvas graphics to execute securely without access to parent storage or network credentials.
> - **Cross-Lingual Typography & Vectorization:** Solving complex bidirectional rendering challenges (RTL Arabic and LTR English/Russian) in high-resolution vector PDF export systems.
>
> **Scholarly Transparency:**  
> This platform embodies an active and rigorous learning journey in mastering modern software engineering methodologies, API lifecycle management, and reactive design patterns. While engineered to strict production-grade standards, the codebase reflects continuous iterative evolution. The author welcomes academic critique, peer review, and formal evaluation from faculty reviewers and scholarship juries as part of the candidate's pathway toward graduate research in Advanced Computer Science and Artificial Intelligence.

---

## 💼 Commercial & Enterprise Deployment Viability

Syntax is completely decoupled from recurring server infrastructure costs:

- **Zero Operational Server Cost:** All state management, routing, API orchestration, and vector exports execute entirely in the user's browser runtime. Zero backend databases, zero caching clusters, and zero middleware proxies to maintain.
- **Enterprise Data Privacy Compliance (GDPR & Zero-Knowledge):** User prompts, proprietary code snippets, conversation logs, and API credentials are kept strictly inside the user's browser `localStorage`. No user telemetry or conversation data is harvested or transmitted to third-party databases.
- **Immediate White-Label Adaptability:** Modular styling powered by Tailwind CSS allows instant rebranding, logo replacement, or enterprise SSO integration.
- **Commercial Code Quality:** Clean, modular TypeScript codebase adhering to strict type safety (`strict: true`), zero console bloat, human-written design aesthetics, and structured lifecycle cleanup.

---

## ⚡ Core Architectural Innovations

### 1. Dynamic Model Discovery & Live API Orchestration
Syntax does not hardcode static AI model identifiers. Instead, it features an intelligent discovery engine:
- Upon entering an API key, the system calls Google Cloud AI Studio's `/v1beta/models` endpoint.
- Syntax's custom version parser (`parseAndRankFreeModels`) analyzes model taxonomy, filters strictly for chat-capable architectures, eliminates legacy deprecated versions, and ranks models in descending mathematical order (e.g. `Gemini 3.8 Flash`).
- Syntax performs a real-time HTTP verification ping against candidate models to confirm active 200 OK operational status before isolating and promoting the working model with an **`Active & Verified`** badge.

### 2. Multi-Tier Resilient Fallback Cascade
To guarantee 100% uptime during academic jury demonstrations or mission-critical commercial tasks:
- If a chosen model encounters upstream quota constraints (HTTP 429) or regional unavailability (HTTP 404/503), Syntax automatically cascades down its prioritized list of live models.
- The UI transparently presents a subtle indicator displaying the active working model and notifying the user if a fallback transition occurred.
- If all API keys or external quotas are completely exhausted, an intelligent fail-safe engine provides structured, scholarship-safe fallback guidance without crashing or freezing.

### 3. Isolated In-Browser Code Execution Sandbox
When an assistant response generates executable code:
- **Interactive Web Applications:** Full HTML5, CSS3, and JavaScript snippets (including interactive games, algorithmic visualizations, and Canvas graphics) render in a dedicated preview tab.
- **Zero-Trust Iframe Sandbox:** Executed inside an isolated iframe (`sandbox="allow-scripts allow-forms allow-modals"`). The opaque origin prevents the sandboxed script from reading parent `localStorage`, cookies, or API keys.
- **Game Controls & Viewport:** Features an in-place code/preview switch, pause/resume pill overlay, execution timer, console logger interceptor, and a fullscreen mode with an `Escape` key exit handler.

### 4. Multi-Language High-Fidelity Vector PDF Engine
Syntax integrates an executive vector document export system:
- **Selectable & Copyable Text:** Exports conversations directly into pristine, copyable vector PDF documents with accurate text metrics and clean pagination.
- **Unicode Multi-Language Typography:** Comprehensive bidirectional typesetting supporting Arabic (Cairo font), English (Inter), and Russian Cyrillic script.
- **Official Brand Watermarking:** Incorporates the official Syntax 4-point AI Star Spark SVG vector header, metadata summary cards, and syntax-highlighted code containers.

### 5. Zero-Knowledge Client-Side Data Architecture
- **Local Storage Management:** Chats, pinned conversations, custom system instructions, and memory facts are saved in the client's local browser storage.
- **Corrupted Data Resiliency:** Storage parsing incorporates automatic sanitization, migrating legacy schemas and purging obsolete state entries gracefully.
- **One-Click Total Purge:** Users can wipe all local storage, active memory items, and credentials with instant verification.

### 6. Multi-Domain Specialized Intelligence Personas
Syntax comes pre-equipped with targeted academic and professional system personas:
1. **Syntax Algorithms & ICPC:** Dynamic programming, advanced graph theory (Tarjan, Dijkstra, Segment Trees), and rigorous asymptotic Big-O proofs.
2. **CS Academic Researcher (Russian Scholarship / Graduate Level):** Academic literature review, research proposal structuring, High-Performance Computing, and formal mathematical foundations tailored for top Russian technical institutions (MIPT, HSE, ITMO, MSU).
3. **Low-Level & Cloud Architect:** Linux kernel concurrency primitives, memory safety in C++20/Rust, cache locality, and low-latency microservice architectures.
4. **Russian-English CS Bridge:** Bilingual translation and terminology alignment between Russian academic computational literature and international standards.

---

## 🛡️ Security Architecture & Threat Modeling

| Threat Vector | Mitigation Strategy Implemented in Syntax |
|---|---|
| **API Key Theft** | Keys are stored strictly in client-side `localStorage` and dispatched exclusively to Google's official endpoint via the `X-goog-api-key` header. Zero proxy servers exist in the communication loop. |
| **XSS via Sandboxed Code** | Sandboxed execution iframes explicitly exclude `allow-same-origin`, enforcing a `null` origin that blocks access to parent storage, tokens, and cookies. |
| **Markdown Injection & Protocol Attacks** | Inline links are validated with strict regex requiring `http://` or `https://` schemes. Unsafe protocols (`javascript:`, `data:`) are rejected. All external links include `rel="noopener noreferrer"`. |
| **Data Leakage & Telemetry** | Complete absence of third-party tracking scripts, analytics beacons, or server telemetry. |

---

## 🔍 Search Engine Optimization (SEO) & Schema.org

Syntax is optimized for global search engine discoverability and social media indexing:

- **JSON-LD Schema.org Structured Data:** Valid `WebApplication` and `Person` schema providing structured metadata for Google Search Knowledge Panels.
- **OpenGraph & Twitter Cards:** Complete `og:title`, `og:description`, `og:image`, and `twitter:card` tags for high-fidelity social previews on LinkedIn, Twitter, and GitHub.
- **Crawler Directives:** Dedicated `robots.txt` configuration with `index, follow` directives and an XML `sitemap.xml`.
- **Progressive Web App (PWA) Manifest:** Fully compliant `manifest.json` enabling mobile home screen installation and standalone web app operation.

---

## 💻 Technical Stack & System Specifications

```
Frontend Runtime:       React 18.3.1 (Concurrent Rendering)
Language Standard:      TypeScript 5.7.2 (Strict Type Checking)
Build & Bundling:       Vite 6.0.3 (Rollup Production Compiler)
CSS Framework:          Tailwind CSS 3.4.16 (JIT Compiler, Custom Mesh Gradients)
Vector PDF Engine:      jsPDF 4.2.1 (Custom Canvas & Unicode Layout Engine)
Iconography:            Lucide React 0.468.0
Visual Effects:         Canvas-Confetti 1.9.4
Typography:             Inter, Outfit, Fira Code (Google Fonts CDN Preconnect)
```

---

## 📁 Project Directory Structure

```
Syntax/
├── public/
│   ├── favicon.svg             # Official 4-point AI Star Spark Favicon
│   ├── logo.svg                # High-resolution vector brand logo
│   ├── manifest.json           # Web App Manifest for PWA readiness
│   ├── robots.txt              # Search engine crawler policies
│   └── sitemap.xml             # XML sitemap for SEO indexation
├── src/
│   ├── components/
│   │   ├── ChatHeader.tsx      # Adaptive top navigation, model picker, theme switch
│   │   ├── ChatInput.tsx       # Luxury oval command bar & attachment handler
│   │   ├── ChatMessage.tsx     # Message bubble renderer, markdown parser, prompt edit
│   │   ├── CodeBlock.tsx       # Syntax-highlighted code block & isolated sandbox runner
│   │   ├── ConversationOptionsMenu.tsx # Pin, rename, PDF export, and delete menu
│   │   ├── RenameModal.tsx     # Symmetrical dialog for renaming conversations
│   │   ├── SettingsModal.tsx   # Two-column settings, API key test toolbar, memory bank
│   │   ├── Sidebar.tsx         # Collapsible navigation, search, pinned group, mobile overlay
│   │   └── ToastContainer.tsx  # Executive floating toast alerts (quota, network, status)
│   ├── data/
│   │   └── personas.ts         # ICPC, Academic Scholarship, and Architecture personas
│   ├── services/
│   │   ├── geminiApi.ts        # Google Cloud API client, dynamic ranker & model cascade
│   │   ├── pdfExportService.ts # Vector PDF generation with Unicode Arabic/English support
│   │   └── storageService.ts   # Resilient localStorage persistence & session migration
│   ├── types/
│   │   └── chat.ts             # Domain models (ChatMessage, ChatSession, AppSettings)
│   ├── App.tsx                 # Core application controller & multi-chat manager
│   ├── index.css               # Ambient mesh gradients, halo lighting, scrollbar styling
│   └── main.tsx                # React DOM entry point
├── index.html                  # SEO metadata, OpenGraph, JSON-LD Schema.org, fonts
├── package.json                # Dependencies, project metadata & build scripts
├── postcss.config.js           # PostCSS Tailwind plugins
├── tailwind.config.js          # Extended theme colors, typography, border radiuses
├── tsconfig.json               # TypeScript compiler rules
└── vite.config.ts              # Vite bundling optimization & build targets
```

---

## 🚀 Installation & Local Deployment Guide

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher (or pnpm / yarn)

### 1. Clone the Repository
```bash
git clone https://github.com/Adel-dev-2001/syntax.git
cd syntax
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Launch Development Server
```bash
npm run dev
```
The application will be live at `http://localhost:5173` (or the next available port).

### 4. Build Production Bundle
```bash
npm run build
```
The compiled, minified, and tree-shaken static assets will be generated in the `dist/` directory.

### 5. Preview Production Build Locally
```bash
npm run preview
```

---

## 🌐 Production Deployment Protocols

Syntax compiles to **100% static HTML, CSS, and JavaScript**. It can be deployed instantly to any global CDN edge network:

### Vercel / Netlify / Cloudflare Pages
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Docker Containerization (Nginx Alpine)
```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 👤 Creator & Academic Attribution

**Syntax** was designed, architected, and engineered by:

- **Lead Engineer & Architect:** [**Adel Mohamed**](https://github.com/Adel-dev-2001) (`@Adel-dev-2001`)
- **GitHub Profile:** [https://github.com/Adel-dev-2001](https://github.com/Adel-dev-2001)
- **Official Repository:** [https://github.com/Adel-dev-2001/syntax](https://github.com/Adel-dev-2001/syntax)
- **Specialization:** Advanced Software Engineering, Full-Stack Architecture, Applied AI Orchestration
- **Application Scope:** Candidate for the Russian Government Scholarship (Rossotrudnichestvo / Open Doors Master's & Doctoral Programs in Computer Science)

---

## 📄 License

This project is open-source software licensed under the **[MIT License](LICENSE)**. Free for commercial, personal, and academic use.

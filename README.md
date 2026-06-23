# 🍭 Gemma's Pixel Quest: Local PC Deployment Guide

Bring this cutesy, retro-style 8-bit desktop chess board onto your own local machine! This guide provides step-by-step instructions for booting the React development workspace locally, building for production production-grade distribution, and pairing the client board with your local desktop LLM using **LM Studio**.

---

## 🛠️ Prerequisites

Before starting, ensure you have the following installed on your computer:
1. **Node.js** (v18.x or v20.x recommended) - [Download Node.js](https://nodejs.org/)
2. **npm** (comes bundled with Node.js) or **yarn**
3. **LM Studio** (for local offline Gemma AI play) - [Download LM Studio](https://lmstudio.ai/)

---

## 🚀 Step 1: Clone and Install Dependencies

1. **Download/Extract Project Source Files**
   If you exported this workspace as a `.zip` from AI Studio, extract it into your desired directory. Otherwise, navigate to the folder with `package.json`.

2. **Open Terminal & Install Packages**
   Run the following terminal command from the project root directory:
   ```bash
   npm install
   ```
   *(This downloads and configures all required dependencies, including Vite, Tailwind CSS, Chess.js, and Framer Motion.)*

---

## ⚡ Step 2: Launch the Local Server

Start the local live development server with Hot Module Replacement enabled:
```bash
npm run dev
```

By default, the server will launch and bind to:
* **URL:** `http://localhost:3000` (or `http://localhost:5173` if configured otherwise)
  
Open that URL in your web browser to enjoy the smooth, chiptune sound-enhanced, retro interactive chess battlefield!

---

## 🏗️ Step 3: Compile a Production Build

To bundle the application into highly optimized, static HTML/CSS/JS assets suitable for deployment to GitHub Pages, Netlify, Vercel, or custom servers, run:
```bash
npm run build
```

This generates a client-side distribution folder under:
* `/dist`

You can test-run this compiled bundle locally using:
```bash
npm run preview
```

---

## 🔌 Step 4: Connecting LM Studio (Gemma LLM Engine)

To unleash the customized **Gemma** commentary, reasoning, and smart move replies on your offline desktop:

1. **Launch LM Studio** on your PC.
2. Under the **Model Search Tab** (magnifying glass 🔍), search for your preferred model variant. We recommend **Gemma 2 2B Instruct** (or any 2B-7B instruct models in GGUF format).
3. **Download** the GGUF model files.
4. Head to the **Developer Tab** (plug icon 🔌) in LM Studio:
   * Select your downloaded Gemma model at the top.
   * Toggle **"Start Server"** to enable the local endpoint.
   * By default, the endpoint is hosted at: `http://localhost:1234/v1`
5. **CRITICAL STEP (CORS Setup):**
   * Make sure CORS is permitted in your LM Studio Server settings, allowing requests from your browser-rendered board (`http://localhost:3000`).
6. **Activate Gemma Mode in Game:**
   * Open the game in your browser (`http://localhost:3000`).
   * Locate the **LM Studio Settings** panel on the right side.
   * Set your server URL (default `http://localhost:1234/v1`).
   * Match the **Model Identifier** with your loaded model name (default: `gemma`).
   * Press **"Test"** on the interface. Once the indicator switches to **CONNECTED ACTIVE**, turn on the **"USE LOCAL GEMMA OPPONENT"** toggle.
   * Play a move! GemmaBot will calculate, respond, and chat back via cute retro chat bubbles!

---

## 🍬 Off-Grid? No Server? No Problem!

If you don't have LM Studio configuration ready, simply keep the "**USE LOCAL GEMMA OPPONENT**" toggle switched **OFF**. 
Our high-speed custom **8-bit MiniMax lookahead engine** will automatically kick in completely on-device, analyzing grid coordinates deep within the browser and playing as Black!

Enjoy your quest! Choice chocolate cupcakes and sweet strawberry teams await! 🍓👾

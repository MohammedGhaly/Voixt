# Voixt — Intelligent Voice to Text Web Application

> **Voixt** is a modern, web-based audio transcription studio featuring in-browser voice recording, intelligent silence-based audio chunking (preventing word splitting), luxury **Gold and Black** styling, and bilingual support (**English & Arabic**). Powered by Google Gemini AI with secure server-side execution for Netlify deployment.

---

## ✨ Features

- **Microphone Voice Recording**: High-fidelity in-browser audio capture with a live, animated gold visualizer and timer.
- **Intelligent Speech-Aware Audio Chunking**: Long recordings are dynamically sliced at natural silence intervals (speech pauses/breaths) instead of arbitrary time splits, ensuring words and syllables are never cut in half.
- **Netlify-Ready & API Key Security**: The Gemini API key is accessed exclusively via the Netlify serverless function (`netlify/functions/transcribe.js`). It is **never exposed** in client-side code or browser network requests.
- **Bilingual Interface & Smart AI Prompts**:
  - Full interface support for **English** and **العربية (Arabic)** with dynamic RTL/LTR layout and custom typography.
  - Dedicated AI transcription prompts tailored for Modern Standard Arabic, colloquial dialects, and English, with automatic filler word removal ("um", "uh", "يعني", "اه") and clean punctuation formatting.
- **File Upload Support**: Drag & drop or browse existing audio files (`.mp3`, `.wav`, `.m4a`, `.webm`, etc.).
- **Client Tools**: Real-time word/character/chunk counters, one-click text copy, and `.txt` file export.
- **Luxury Gold & Black Aesthetic**: Crafted with obsidian black hues, metallic gold gradients, glassmorphism, and responsive layouts.
- **SEO & Social Metatags**: Complete OpenGraph, Twitter card metadata, and a custom gold "V" SVG favicon.

---

## 📁 Project Structure

```
Voixt/
├── .env                         # Server environment variables (API_KEY)
├── .gitignore                   # Excludes .env and sensitive data from Git
├── package.json                 # Project configuration and scripts
├── netlify.toml                 # Netlify deployment & redirect settings
├── PLAN.md                      # Detailed technical design & roadmap
├── server.js                    # Local development server (serves static + emulates /api/transcribe)
│
├── netlify/
│   └── functions/
│       └── transcribe.js        # Netlify Serverless Function (secure Gemini AI proxy)
│
└── public/
    ├── index.html               # Main application entry point & SEO metatags
    ├── favicon.svg              # Minimalist gold "V" favicon
    ├── css/
    │   └── styles.css           # Gold & Black design system, typography, and RTL rules
    └── js/
        ├── app.js               # Application orchestration & UI controller
        ├── audio-recorder.js    # Browser microphone recording & live gold visualizer
        ├── audio-chunker.js     # Intelligent speech-pause audio chunker
        ├── i18n.js              # English/Arabic translation dictionary & RTL switcher
        └── api.js               # Frontend API client communicating with /api/transcribe
```

---

## 🚀 Running Locally

1. Ensure you have [Node.js](https://nodejs.org/) installed (v18+).
2. Ensure your `.env` file exists in the root folder with your Gemini API key:
   ```env
   API_KEY=your_gemini_api_key_here
   ```
3. Start the local server:
   ```bash
   npm start
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🌐 Deploying to Netlify

### Step 1: Push Code to GitHub / GitLab / Bitbucket
Ensure `.gitignore` is in place so `.env` is **NOT** committed to your repository.

### Step 2: Connect Repository to Netlify
1. Go to [Netlify](https://app.netlify.com/) and click **"Add new site"** -> **"Import an existing project"**.
2. Select your repository.
3. The build configuration in `netlify.toml` will be auto-detected:
   - **Publish directory**: `public`
   - **Functions directory**: `netlify/functions`

### Step 3: Configure Your API Key in Netlify
1. In your Netlify Site dashboard, go to:
   **Site configuration** -> **Environment variables**.
2. Click **Add a variable** -> **Add a single variable**:
   - Key: `API_KEY`
   - Value: `<your-gemini-api-key>`
3. Click **Deploy site**.

Your site will be live, and your API key remains 100% secure on the server!


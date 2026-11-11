# Voixt - Voice to Text Web Application Plan

## 1. Project Overview & Objectives
**Voixt** is a modern, responsive, web-based Voice-to-Text changer built with vanilla HTML5, CSS3, and modern JavaScript. The application records voice in the browser, intelligently chunks long recordings at natural speech pauses/silences (preventing audio word splitting), and converts the audio to high-accuracy text using the Google Gemini AI API via a secure backend function.

The user interface features a luxury **Gold and Black** aesthetic, full bilingual support (**English & Arabic** with full RTL layout), an engaging introductory landing section, custom favicon (letter "V"), comprehensive SEO/social metatags, and safe server-side API key handling for deployment on **Netlify**.

---

## 2. Architecture & File Structure

```
Voixt/
├── .env                         # Environment variables (API_KEY)
├── .gitignore                   # Git ignore for node_modules, .env, etc.
├── package.json                 # Project dependencies & run scripts
├── netlify.toml                 # Netlify deployment configuration
├── PLAN.md                      # Detailed project blueprint (this file)
├── server.js                    # Lightweight local dev server mimicking Netlify Functions
│
├── netlify/
│   └── functions/
│       └── transcribe.js        # Netlify Serverless Function for secure Gemini API calls
│
└── public/
    ├── index.html               # Main HTML structure, meta tags, and bilingual intro
    ├── favicon.svg              # Minimalist gold "V" favicon
    ├── css/
    │   └── styles.css           # Gold & Black design system, typography, animations, RTL
    └── js/
        ├── app.js               # Main application orchestration & UI state
        ├── audio-recorder.js    # In-browser microphone recording & live visualizer
        ├── audio-chunker.js     # Intelligent silence-detection & chunking algorithm
        ├── i18n.js              # Localization dictionary & RTL/LTR switcher (EN/AR)
        └── api.js               # Frontend API client communicating with /api/transcribe
```

---

## 3. Security & Netlify Deployment Strategy

### Security Requirement: Never Expose API Key to the Frontend
* **Client-side exposure risk**: If API calls were made directly from the browser, any visitor could inspect network traffic and extract the Gemini API Key.
* **Solution**: A **Netlify Serverless Function** (`/netlify/functions/transcribe.js` mapped to `/api/transcribe` via `netlify.toml`).
* The frontend uploads chunks to `/api/transcribe`.
* The serverless function accesses `process.env.API_KEY` (or `process.env.GEMINI_API_KEY`) on the server side and forwards the audio payload to the Google Gemini API.
* For local development, `server.js` serves the static assets and routes `/api/transcribe` requests through the same logic reading `.env`.

---

## 4. UI/UX Design & Branding

### 4.1 Theme: Gold & Black
* **Backgrounds**: Deep Obsidian Black (`#0a0a0c`, `#121216`), semi-transparent glassmorphic panels (`rgba(22, 22, 28, 0.75)` with blur).
* **Accents**: Radiant Metallic Gold (`#d4af37`, `#e5c158`, `#ffd700`), subtle gold glows, borders, and gradients.
* **Typography**:
  * English: Clean modern sans-serif (`Inter`, `Plus Jakarta Sans`, system fonts).
  * Arabic: Premium Arabic typography (`Cairo`, `Tajawal` via Google Fonts) with full RTL alignment.
* **Visual Elements**:
  * Glowing gold audio waveform / frequency visualizer during recording.
  * Interactive pulse animations for recording state.
  * Polished status indicators for recording, chunking, and transcribing phases.

### 4.2 Introductory Screen
* Prominent branding with the name **Voixt**.
* Subtitle & descriptive overview explaining the intelligent chunking and AI transcription capabilities.
* Quick-start action button taking users straight into the recording console.

### 4.3 Favicon & Metatags
* SVG Favicon: An elegant, stylized gold letter **"V"** with a subtle gradient and dark background.
* OpenGraph & Twitter tags for social sharing.
* Responsive viewport, description, theme-color (`#0a0a0c`), and bilingual search metadata.

---

## 5. Intelligent Audio Chunking Algorithm (No Word Splitting)

When dealing with long audio recordings, sending a single massive audio blob can cause timeouts or exceed payload limits. However, splitting at rigid time intervals (e.g., exactly every 30 seconds) can cut a word in half, causing garbled transcriptions.

### Intelligent Silence-Based Chunking Strategy:
1. **Decode Audio**: Use `AudioContext.decodeAudioData` to obtain the raw uncompressed `AudioBuffer` from the recorded audio stream.
2. **Compute Energy Envelope**:
   * Calculate RMS (Root Mean Square) volume energy over small sliding windows (e.g., 50ms – 100ms frames).
3. **Adaptive Silence Detection**:
   * Define a target chunk length (e.g., ~30–45 seconds) and a maximum boundary (e.g., 60 seconds).
   * Within the candidate search window (e.g., 25s to 45s), scan for the lowest energy dip (silence or whisper level) that lasts at least 200–300ms.
   * If a silence threshold (< 0.015 RMS) is met, choose the midpoint of that silence as the split point.
   * If continuous loud speech is found without total silence, pick the global minimum energy point in the window (natural breath pause).
4. **Export Clean Chunks**:
   * Slice the `AudioBuffer` at these exact sample points.
   * Encode each slice into a standard clean WAV/WebM format.
   * Transcribe chunks in order with chunk indexing and seamlessly concatenate the resulting text.

---

## 6. AI Prompt Engineering & Gemini Integration

### 6.1 Target Model
* Google Gemini (`gemini-2.5-flash` or `gemini-1.5-flash`) via the `generateContent` REST endpoint.

### 6.2 Specialized Prompts for Transcription

The prompt sent alongside the audio inline data will be tailored based on the user's selected mode:

#### For Spoken Language Transcription (Original):
```
You are an expert, professional audio transcriber.
Your task is to accurately transcribe the attached audio recording into clear, natural text.

Guidelines:
1. Accurately transcribe the spoken speech in its original language (Arabic or English).
2. If Arabic: Identify Modern Standard Arabic (Fusha) or regional dialects (Egyptian, Levantine, Gulf, etc.) and write them accurately with proper Arabic spelling and punctuation.
3. If English: Apply proper sentence casing, spelling, and standard punctuation (periods, commas, question marks).
4. Remove stuttering and filler sounds (e.g., "um", "uh", "like", "يعني", "اممم", "اه") unless essential to context.
5. Format into clean, logical sentences and paragraphs.
6. OUTPUT ONLY the transcribed text. Do NOT include any intro, commentary, metadata, or markdown code blocks (```).
```

#### For Language Conversion / Target Mode (e.g., Transcribe & Output in English or Arabic):
```
You are an expert bilingual speech-to-text converter and translator.
The user wants the transcription output strictly in: [TARGET_LANGUAGE: English | Arabic].

Guidelines:
1. Listen carefully to the attached speech.
2. If the audio is already in the target language, produce a polished, accurate transcription.
3. If the audio is in another language, translate and transcribe the spoken content faithfully into natural, fluent [TARGET_LANGUAGE].
4. Maintain the speaker's tone, nuance, and intent.
5. Format with proper punctuation, capitalization, and paragraphs.
6. OUTPUT ONLY the final converted text. Do NOT include any greetings, notes, explanations, or code fences.
```

---

## 7. Implementation Roadmap

1. **Step 1: Project Setup & Configuration**
   - Initialize `package.json` with scripts for local testing.
   - Configure `netlify.toml` for deployment and serverless routing.
   - Set up `.gitignore`.

2. **Step 2: Serverless Function (`netlify/functions/transcribe.js`) & Local Server (`server.js`)**
   - Implement secure handler extracting base64 audio and target language options.
   - Connect to Gemini API using `process.env.API_KEY`.
   - Incorporate the tailored prompt system.
   - Implement local Node HTTP server for zero-setup local previews.

3. **Step 3: Frontend Architecture & Gold/Black Styling**
   - Create `index.html` with semantic structure:
     * Header with logo, navigation, and language switch (EN/AR).
     * Hero / Intro section explaining **Voixt**.
     * Core recording console (record/pause/stop buttons, time display, status pill, visualizer).
     * Audio file upload alternative (drag & drop).
     * Output area with copy, download, and clear buttons.
   - Create `favicon.svg` with gold "V".
   - Create `styles.css` implementing the luxury gold-and-black theme, glassmorphism, responsive grid, and RTL styles for Arabic (`[dir="rtl"]`).

4. **Step 4: Audio Engine & Intelligent Chunker**
   - Implement `audio-recorder.js`: Microphone permission handling, Web Audio API context, real-time canvas visualizer with gold glow.
   - Implement `audio-chunker.js`: Decode audio buffer, compute amplitude envelopes, locate silent gaps between words, and produce chunk blobs.

5. **Step 5: Internationalization (i18n)**
   - Implement `i18n.js` with complete English and Arabic dictionaries.
   - Dynamic switching of UI text, document direction (`dir="ltr"` / `dir="rtl"`), and font adjustments.

6. **Step 6: Testing & Verification**
   - Test local execution via `node server.js`.
   - Test audio recording, visualizer response, intelligent chunking logic, and Gemini API transcription output.
   - Verify that the API key is never visible in frontend network calls.


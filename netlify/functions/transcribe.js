// Netlify Serverless Function: transcribe.js
// Securely proxies audio transcription requests to Gemini API without exposing API_KEY to clients.

const fs = require('fs');
const path = require('path');

// Auto-load .env in local environments if not already loaded
if (!process.env.API_KEY && !process.env.GEMINI_API_KEY) {
  try {
    const envPath = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch (e) {
    // Ignore in read-only environments
  }
}

const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest'
];

function buildPrompt(language = 'auto', mode = 'transcribe') {
  let langInstruction = '';
  if (language === 'ar') {
    langInstruction = `
- Target Output Language: ARABIC (العربية).
- If the speech is in Arabic: Transcribe faithfully. Support Modern Standard Arabic (الفصحى) or colloquial dialects (عامية) accurately with correct Arabic spelling and orthography.
- If the speech is in another language (e.g. English) and mode requires Arabic output: Translate and transcribe the spoken content faithfully and naturally into Arabic.
- Use proper Arabic punctuation (، ؟ . « »).`;
  } else if (language === 'en') {
    langInstruction = `
- Target Output Language: ENGLISH.
- If the speech is in English: Transcribe faithfully with proper English grammar, spelling, and sentence casing.
- If the speech is in another language (e.g. Arabic) and mode requires English output: Translate and transcribe the spoken content faithfully into natural, fluent English.
- Use standard English punctuation (. , ? ! " ").`;
  } else {
    langInstruction = `
- Language Mode: AUTO-DETECT.
- Accurately detect the spoken language (Arabic, English, or bilingual code-switching).
- Transcribe verbatim in the language(s) spoken with corresponding grammatical conventions and punctuation.`;
  }

  return `You are Voixt, an elite, professional voice-to-text audio transcriber and speech linguist.
Your sole mission is to listen to the attached audio recording and produce a crystal-clear, accurate, and beautifully formatted text transcription.

${langInstruction}

Strict Transcription Rules:
1. Purity: Output ONLY the final transcribed/translated text. Do NOT add any preamble (like "Here is the transcription:", "Sure!", etc.), conversational remarks, metadata, timestamps, or markdown code fence blocks (\`\`\`).
2. Clarity & Natural Flow: Clean up spoken disfluencies, stuttering, and verbal crutches (e.g., "um", "uh", "like", "you know", "يعني", "اممم", "اه", "ايوا") unless they are clearly critical to the meaning.
3. Formatting: Divide spoken thoughts into natural sentences and readable paragraphs. Ensure proper capitalization and punctuation.
4. Completeness: Do not invent words or hallucinate speech that was not present in the audio. If parts of the audio are pure silence or unintelligible noise, do not add filler sentences.
5. Numbers & Currencies: Write numbers, currencies, and dates naturally based on the spoken context (e.g., "$100" or "100 دولار", "2026").`;
}

exports.handler = async (event, context) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' })
    };
  }

  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Gemini API key is not configured on the server. Please check your environment variables.'
      })
    };
  }

  try {
    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON payload' })
      };
    }

    const { audio, mimeType = 'audio/wav', language = 'auto', mode = 'transcribe' } = payload;

    if (!audio) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing audio data in request' })
      };
    }

    // Strip base64 data URL prefix if present
    const cleanBase64 = audio.replace(/^data:[^;]+;base64,/, '');
    const cleanMime = (mimeType || 'audio/wav').split(';')[0].trim();

    const promptText = buildPrompt(language, mode);

    const requestBody = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: cleanMime,
                data: cleanBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        topP: 0.95
      }
    };

    let lastError = null;
    let transcriptionText = '';
    let chosenModel = '';

    // Attempt candidate models with fallback for high load / spikes
    for (const model of CANDIDATE_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        if (response.status === 200) {
          const data = await response.json();
          const candidate = data.candidates?.[0];
          const part = candidate?.content?.parts?.[0];
          transcriptionText = (part?.text || '').trim();
          chosenModel = model;
          break;
        } else {
          const errData = await response.json().catch(() => ({}));
          lastError = errData.error?.message || `HTTP ${response.status}`;
          // If status is 429 or 503 or 404, loop will try the next candidate model
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!chosenModel && !transcriptionText) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({
          error: `Gemini API transcription failed: ${lastError || 'Unknown upstream error'}`
        })
      };
    }

    // Remove any accidental markdown backticks if model wrapped text in ```
    const cleanedText = transcriptionText
      .replace(/^```[a-z]*\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        text: cleanedText,
        model: chosenModel
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: `Server error: ${err.message}` })
    };
  }
};

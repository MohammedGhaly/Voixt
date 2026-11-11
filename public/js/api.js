// api.js - Frontend client for communicating with the secure /api/transcribe endpoint

class VoixtApiClient {
  constructor(endpoint = '/api/transcribe') {
    this.endpoint = endpoint;
  }

  /**
   * Transcribes a single audio Blob by passing it to the serverless backend.
   * @param {Blob} blob - Audio blob (WAV, WebM, etc.)
   * @param {Object} options - { language: 'auto'|'en'|'ar', mode: 'transcribe'|'translate' }
   * @returns {Promise<{text: string, model: string}>}
   */
  async transcribeChunk(blob, options = {}) {
    const base64Audio = await this.blobToBase64(blob);
    const mimeType = blob.type || 'audio/wav';

    const payload = {
      audio: base64Audio,
      mimeType: mimeType,
      language: options.language || 'auto',
      mode: options.mode || 'transcribe'
    };

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      const errorMsg = data.error || `HTTP error ${response.status}`;
      throw new Error(errorMsg);
    }

    return {
      text: data.text || '',
      model: data.model || 'gemini'
    };
  }

  /**
   * Helper: converts a Blob to base64 string
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

window.VoixtApiClient = VoixtApiClient;


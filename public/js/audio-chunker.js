// audio-chunker.js
// Intelligent audio chunking based on speech energy & silence detection (avoids splitting words).

class AudioChunker {
  constructor(options = {}) {
    this.targetChunkSec = options.targetChunkSec || 35; // Default target duration per chunk
    this.searchMarginSec = options.searchMarginSec || 8; // Search +/- seconds around target for silence
    this.frameDurationMs = 50; // RMS analysis window (50ms)
    this.silenceThreshold = options.silenceThreshold || 0.015; // Low energy threshold for silence
  }

  /**
   * Splits an audio Blob into intelligent chunks sliced strictly at natural pauses/silences.
   * @param {Blob} audioBlob - The recorded audio blob
   * @param {Function} onProgress - Optional callback for chunking progress
   * @returns {Promise<{chunks: Array<{blob: Blob, start: number, end: number}>, totalDuration: number}>}
   */
  async chunkAudio(audioBlob, onProgress = null) {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    let audioBuffer;
    try {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (err) {
      // If decoding fails (e.g. empty or unsupported webm stream), fallback to original blob
      console.warn('decodeAudioData failed or was unsupported, returning single chunk:', err);
      return {
        chunks: [{ blob: audioBlob, start: 0, end: 0, index: 1, total: 1 }],
        totalDuration: 0
      };
    } finally {
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
    }

    const duration = audioBuffer.duration;
    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;

    // If audio is shorter than target chunk duration + margin, return as single chunk
    if (duration <= this.targetChunkSec + 5) {
      const wavBlob = this.audioBufferToWav(audioBuffer);
      return {
        chunks: [{ blob: wavBlob, start: 0, end: duration, index: 1, total: 1 }],
        totalDuration: duration
      };
    }

    // Step 1: Calculate energy envelope (RMS) across the entire audio buffer
    if (onProgress) onProgress({ status: 'analyzing', progress: 0.2 });
    const channelData = audioBuffer.getChannelData(0); // Analyze primary channel
    const frameSize = Math.floor(sampleRate * (this.frameDurationMs / 1000));
    const totalFrames = Math.floor(channelData.length / frameSize);
    const energyEnvelope = new Float32Array(totalFrames);

    for (let f = 0; f < totalFrames; f++) {
      let sumSquares = 0;
      const offset = f * frameSize;
      for (let i = 0; i < frameSize; i++) {
        const val = channelData[offset + i];
        sumSquares += val * val;
      }
      energyEnvelope[f] = Math.sqrt(sumSquares / frameSize);
    }

    // Step 2: Determine optimal split points based on natural pauses
    if (onProgress) onProgress({ status: 'detecting_pauses', progress: 0.5 });
    const splitPointsSec = [0];
    let currentCutSec = this.targetChunkSec;

    while (currentCutSec < duration - 8) {
      const windowStartSec = Math.max(splitPointsSec[splitPointsSec.length - 1] + 15, currentCutSec - this.searchMarginSec);
      const windowEndSec = Math.min(duration - 5, currentCutSec + this.searchMarginSec);

      if (windowEndSec <= windowStartSec) break;

      const startFrame = Math.floor((windowStartSec * sampleRate) / frameSize);
      const endFrame = Math.floor((windowEndSec * sampleRate) / frameSize);

      let bestFrame = startFrame;
      let minEnergy = Infinity;
      let longestSilenceStart = -1;
      let longestSilenceLen = 0;
      let currentSilenceStart = -1;

      // Scan search window for silence stretches or minimum energy valleys
      for (let f = startFrame; f < endFrame && f < totalFrames; f++) {
        const energy = energyEnvelope[f];

        // Track absolute minimum energy frame
        if (energy < minEnergy) {
          minEnergy = energy;
          bestFrame = f;
        }

        // Track consecutive silent frames (< silenceThreshold)
        if (energy <= this.silenceThreshold) {
          if (currentSilenceStart === -1) currentSilenceStart = f;
          const currentLen = f - currentSilenceStart + 1;
          if (currentLen > longestSilenceLen) {
            longestSilenceLen = currentLen;
            longestSilenceStart = currentSilenceStart;
          }
        } else {
          currentSilenceStart = -1;
        }
      }

      let chosenFrame = bestFrame;
      // If we found a sustained pause (>= 200ms of low energy), cut directly in the middle of it!
      if (longestSilenceLen >= Math.ceil(200 / this.frameDurationMs) && longestSilenceStart !== -1) {
        chosenFrame = Math.floor(longestSilenceStart + longestSilenceLen / 2);
      }

      const cutTimeSec = (chosenFrame * frameSize) / sampleRate;
      splitPointsSec.push(cutTimeSec);

      currentCutSec = cutTimeSec + this.targetChunkSec;
    }

    splitPointsSec.push(duration);

    // Step 3: Extract sliced audio buffers and encode into standard clean WAV blobs
    if (onProgress) onProgress({ status: 'slicing', progress: 0.7 });
    const chunks = [];
    const totalChunks = splitPointsSec.length - 1;

    for (let c = 0; c < totalChunks; c++) {
      const startSec = splitPointsSec[c];
      const endSec = splitPointsSec[c + 1];
      const startSample = Math.floor(startSec * sampleRate);
      const endSample = Math.floor(endSec * sampleRate);
      const chunkSamples = endSample - startSample;

      // Create new AudioBuffer for this slice
      const chunkBuffer = new AudioContext().createBuffer(numberOfChannels, chunkSamples, sampleRate);
      for (let ch = 0; ch < numberOfChannels; ch++) {
        const sourceChan = audioBuffer.getChannelData(ch);
        const destChan = chunkBuffer.getChannelData(ch);
        destChan.set(sourceChan.subarray(startSample, endSample));
      }

      const wavBlob = this.audioBufferToWav(chunkBuffer);
      chunks.push({
        blob: wavBlob,
        start: startSec,
        end: endSec,
        duration: endSec - startSec,
        index: c + 1,
        total: totalChunks
      });
    }

    if (onProgress) onProgress({ status: 'complete', progress: 1.0 });

    return {
      chunks,
      totalDuration: duration
    };
  }

  /**
   * Converts an AudioBuffer into an uncompressed 16-bit PCM WAV Blob.
   */
  audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    // Interleave channels
    let interleaved;
    if (numChannels === 2) {
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);
      const length = left.length + right.length;
      interleaved = new Float32Array(length);
      let inputIdx = 0;
      let outputIdx = 0;
      while (inputIdx < left.length) {
        interleaved[outputIdx++] = left[inputIdx];
        interleaved[outputIdx++] = right[inputIdx];
        inputIdx++;
      }
    } else {
      interleaved = buffer.getChannelData(0);
    }

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = interleaved.length * bytesPerSample;
    const bufferSize = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');

    // "fmt " sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, format, true); // AudioFormat
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // "data" sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write 16-bit PCM samples with clipping protection
    let offset = 44;
    for (let i = 0; i < interleaved.length; i++) {
      let sample = Math.max(-1, Math.min(1, interleaved[i]));
      // Convert float to 16-bit signed integer
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, sample, true);
      offset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

window.AudioChunker = AudioChunker;


// app.js - Main Application Controller for Voixt

document.addEventListener('DOMContentLoaded', () => {
  // Initialize i18n
  window.i18n.init();

  // DOM Elements
  const langEnBtn = document.getElementById('langEnBtn');
  const langArBtn = document.getElementById('langArBtn');

  // Intro elements
  const btnStartRecording = document.getElementById('btnStartRecording');
  const btnUploadAudio = document.getElementById('btnUploadAudio');
  const studioSection = document.getElementById('studioSection');

  // Studio Elements
  const statusPill = document.getElementById('statusPill');
  const statusText = document.getElementById('statusText');
  const timerDisplay = document.getElementById('timerDisplay');
  const visualizerCanvas = document.getElementById('visualizerCanvas');

  // Control Buttons
  const btnRecord = document.getElementById('btnRecord');
  const btnPause = document.getElementById('btnPause');
  const btnStop = document.getElementById('btnStop');
  const btnCancel = document.getElementById('btnCancel');

  // File Upload Elements
  const fileDropZone = document.getElementById('fileDropZone');
  const audioFileInput = document.getElementById('audioFileInput');
  const btnBrowseFile = document.getElementById('btnBrowseFile');

  // Settings
  const targetLanguageSelect = document.getElementById('targetLanguageSelect');
  const chunkSizeInput = document.getElementById('chunkSizeInput');
  const chunkSizeDisplay = document.getElementById('chunkSizeDisplay');

  // Progress Bar
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const progressLabel = document.getElementById('progressLabel');

  // Output Elements
  const outputTextarea = document.getElementById('outputTextarea');
  const statWords = document.getElementById('statWords');
  const statChars = document.getElementById('statChars');
  const statChunks = document.getElementById('statChunks');
  const btnCopy = document.getElementById('btnCopy');
  const btnDownload = document.getElementById('btnDownload');
  const btnClear = document.getElementById('btnClear');
  const toastNotification = document.getElementById('toastNotification');

  // Initialize Modules
  const recorder = new AudioRecorder(visualizerCanvas, (elapsedMs) => {
    timerDisplay.textContent = formatTime(elapsedMs);
  });
  const chunker = new AudioChunker({ targetChunkSec: parseInt(chunkSizeInput.value, 10) || 35 });
  const apiClient = new VoixtApiClient('/api/transcribe');

  let currentBlob = null;
  let isProcessing = false;

  // Language switch listeners
  langEnBtn.addEventListener('click', () => window.i18n.setLanguage('en'));
  langArBtn.addEventListener('click', () => window.i18n.setLanguage('ar'));

  // Intro actions
  btnStartRecording.addEventListener('click', () => {
    studioSection.scrollIntoView({ behavior: 'smooth' });
    startRecordingFlow();
  });

  btnUploadAudio.addEventListener('click', () => {
    studioSection.scrollIntoView({ behavior: 'smooth' });
    audioFileInput.click();
  });

  // Target Chunk Slider
  chunkSizeInput.addEventListener('input', (e) => {
    const val = e.target.value;
    chunkSizeDisplay.textContent = `${val}s`;
    chunker.targetChunkSec = parseInt(val, 10);
  });

  // Record Button
  btnRecord.addEventListener('click', () => {
    startRecordingFlow();
  });

  // Pause / Resume Button
  btnPause.addEventListener('click', () => {
    if (!recorder.isRecording) return;
    if (recorder.isPaused) {
      recorder.resume();
      btnPause.innerHTML = `<svg class="icon" viewBox="0 0 24 24"><path fill="currentColor" d="M14 19h4V5h-4v14zm-8 0h4V5H6v14z"/></svg><span data-i18n="btnPause">${window.i18n.t('btnPause')}</span>`;
      setStatus('statusRecording', 'recording');
    } else {
      recorder.pause();
      btnPause.innerHTML = `<svg class="icon" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg><span data-i18n="btnResume">${window.i18n.t('btnResume')}</span>`;
      setStatus('statusPaused', 'paused');
    }
  });

  // Stop Button
  btnStop.addEventListener('click', async () => {
    if (!recorder.isRecording) return;
    setStatus('statusProcessing', 'processing');
    setControlsState({ recording: false, processing: true });

    try {
      const audioBlob = await recorder.stop();
      if (!audioBlob || audioBlob.size === 0) {
        showToast(window.i18n.t('noAudioError'), 'error');
        resetToReady();
        return;
      }
      await processAndTranscribeAudio(audioBlob);
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
      resetToReady();
    }
  });

  // Cancel Button
  btnCancel.addEventListener('click', () => {
    recorder.cancel();
    timerDisplay.textContent = '00:00';
    resetToReady();
  });

  // File Upload Handlers
  btnBrowseFile.addEventListener('click', (e) => {
    e.stopPropagation();
    audioFileInput.click();
  });

  fileDropZone.addEventListener('click', () => {
    if (!isProcessing && !recorder.isRecording) {
      audioFileInput.click();
    }
  });

  fileDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDropZone.classList.add('drag-over');
  });

  fileDropZone.addEventListener('dragleave', () => {
    fileDropZone.classList.remove('drag-over');
  });

  fileDropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    fileDropZone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|m4a|aac|ogg|webm|flac)$/i)) {
        await processAndTranscribeAudio(file);
      } else {
        showToast('Please upload an audio file (.mp3, .wav, .m4a, .webm)', 'error');
      }
    }
  });

  audioFileInput.addEventListener('change', async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processAndTranscribeAudio(file);
      audioFileInput.value = '';
    }
  });

  // Copy Button
  btnCopy.addEventListener('click', async () => {
    const text = outputTextarea.value.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      const originalText = btnCopy.innerHTML;
      btnCopy.innerHTML = `<svg class="icon" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg> ${window.i18n.t('btnCopied')}`;
      showToast(window.i18n.t('copiedSuccess'), 'success');
      setTimeout(() => {
        btnCopy.innerHTML = originalText;
      }, 2000);
    } catch (err) {
      outputTextarea.select();
      document.execCommand('copy');
      showToast(window.i18n.t('copiedSuccess'), 'success');
    }
  });

  // Download Button
  btnDownload.addEventListener('click', () => {
    const text = outputTextarea.value.trim();
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Voixt_Transcription_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Clear Button
  btnClear.addEventListener('click', () => {
    outputTextarea.value = '';
    updateStats('', 0);
  });

  // Output stats updater
  outputTextarea.addEventListener('input', () => {
    const text = outputTextarea.value;
    updateStats(text, statChunks.textContent);
  });

  // Helper Functions
  async function startRecordingFlow() {
    if (recorder.isRecording || isProcessing) return;

    try {
      await recorder.start();
      setControlsState({ recording: true, processing: false });
      setStatus('statusRecording', 'recording');
      btnPause.innerHTML = `<svg class="icon" viewBox="0 0 24 24"><path fill="currentColor" d="M14 19h4V5h-4v14zm-8 0h4V5H6v14z"/></svg><span data-i18n="btnPause">${window.i18n.t('btnPause')}</span>`;
    } catch (err) {
      console.error(err);
      showToast(window.i18n.t('micPermissionError'), 'error');
      resetToReady();
    }
  }

  async function processAndTranscribeAudio(audioBlob) {
    isProcessing = true;
    setControlsState({ recording: false, processing: true });
    showProgress(0, window.i18n.t('statusProcessing'));

    try {
      // Step 1: Chunk audio at natural pauses (avoiding splitting words)
      const { chunks, totalDuration } = await chunker.chunkAudio(audioBlob, (progressInfo) => {
        if (progressInfo.status === 'analyzing') {
          showProgress(15, window.i18n.t('statusProcessing'));
        } else if (progressInfo.status === 'detecting_pauses') {
          showProgress(30, window.i18n.t('statusProcessing'));
        }
      });

      const totalChunks = chunks.length;
      if (totalChunks > 1) {
        showToast(window.i18n.t('chunkNotification', { count: totalChunks }), 'info');
      } else {
        showToast(window.i18n.t('singleChunkNotification'), 'info');
      }

      // Step 2: Transcribe chunks in parallel via serverless endpoint for maximum speed
      const targetLang = targetLanguageSelect.value;
      let completedCount = 0;

      setStatusText(window.i18n.t('statusTranscribing', { current: 1, total: totalChunks }), 'processing');

      const transcriptionPromises = chunks.map(async (chunk, index) => {
        const result = await apiClient.transcribeChunk(chunk.blob, {
          language: targetLang,
          mode: 'transcribe'
        });
        completedCount++;
        const percent = 30 + Math.floor((completedCount / totalChunks) * 65);
        showProgress(percent, window.i18n.t('statusTranscribing', { current: completedCount, total: totalChunks }));
        return { index, text: (result.text || '').trim() };
      });

      const results = await Promise.all(transcriptionPromises);
      
      // Sort by original index to ensure proper chronological order
      results.sort((a, b) => a.index - b.index);
      const combinedText = results.map(r => r.text).filter(Boolean).join('\n\n');
      outputTextarea.value = combinedText;
      updateStats(combinedText, totalChunks);

      showProgress(100, window.i18n.t('statusDone'));
      setStatus('statusDone', 'done');
      showToast(window.i18n.t('statusDone'), 'success');

      // Scroll to output
      outputTextarea.scrollIntoView({ behavior: 'smooth' });

      setTimeout(() => {
        hideProgress();
        resetToReady();
      }, 2500);

    } catch (err) {
      console.error(err);
      setStatus('statusError', 'error');
      showToast(`${window.i18n.t('apiError')}: ${err.message}`, 'error');
      hideProgress();
      resetToReady();
    } finally {
      isProcessing = false;
    }
  }

  function setControlsState({ recording, processing }) {
    btnRecord.disabled = recording || processing;
    btnPause.disabled = !recording || processing;
    btnStop.disabled = !recording || processing;
    btnCancel.disabled = !recording || processing;
    audioFileInput.disabled = recording || processing;
    fileDropZone.style.pointerEvents = (recording || processing) ? 'none' : 'auto';

    if (recording) {
      btnRecord.classList.add('pulse-gold');
    } else {
      btnRecord.classList.remove('pulse-gold');
    }
  }

  function resetToReady() {
    setControlsState({ recording: false, processing: false });
    setStatus('statusReady', 'ready');
    timerDisplay.textContent = '00:00';
    recorder.drawIdleState();
  }

  function setStatus(i18nKey, stateClass) {
    statusPill.className = `status-pill status-${stateClass}`;
    statusText.setAttribute('data-i18n', i18nKey);
    statusText.textContent = window.i18n.t(i18nKey);
  }

  function setStatusText(customText, stateClass) {
    statusPill.className = `status-pill status-${stateClass}`;
    statusText.removeAttribute('data-i18n');
    statusText.textContent = customText;
  }

  function showProgress(percent, label) {
    progressContainer.classList.remove('hidden');
    progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    progressLabel.textContent = label || `${percent}%`;
  }

  function hideProgress() {
    progressContainer.classList.add('hidden');
    progressBar.style.width = '0%';
  }

  function updateStats(text, chunkCount = 1) {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;

    statWords.textContent = words.toLocaleString();
    statChars.textContent = chars.toLocaleString();
    statChunks.textContent = chunkCount;
  }

  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function showToast(message, type = 'info') {
    toastNotification.textContent = message;
    toastNotification.className = `toast-notification toast-${type} show`;
    setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 4000);
  }

  // Draw initial canvas idle line
  recorder.drawIdleState();
});


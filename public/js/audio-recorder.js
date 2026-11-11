// audio-recorder.js
// Handles browser microphone recording, live gold visualizer, and stream lifecycle.

class AudioRecorder {
  constructor(canvasElement, onTimerUpdate = null) {
    this.canvas = canvasElement;
    this.canvasCtx = canvasElement ? canvasElement.getContext('2d') : null;
    this.onTimerUpdate = onTimerUpdate;

    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.animationId = null;

    this.startTime = 0;
    this.elapsedTime = 0;
    this.timerInterval = null;
    this.isRecording = false;
    this.isPaused = false;
  }

  static getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4'
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  }

  async start() {
    this.audioChunks = [];
    this.elapsedTime = 0;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    } catch (err) {
      throw new Error('PERMISSION_DENIED');
    }

    // Set up Web Audio API for live visualization
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 128;
    this.analyser.smoothingTimeConstant = 0.8;
    this.source.connect(this.analyser);

    const mimeType = AudioRecorder.getSupportedMimeType();
    const options = mimeType ? { mimeType } : {};

    try {
      this.mediaRecorder = new MediaRecorder(this.stream, options);
    } catch (err) {
      this.mediaRecorder = new MediaRecorder(this.stream);
    }

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.audioChunks.push(e.data);
      }
    };

    // Request data in chunks every 1000ms
    this.mediaRecorder.start(1000);
    this.isRecording = true;
    this.isPaused = false;
    this.startTime = Date.now();

    this.startTimer();
    this.startVisualizer();
  }

  pause() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.isPaused = true;
      clearInterval(this.timerInterval);
    }
  }

  resume() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.isPaused = false;
      this.startTime = Date.now() - this.elapsedTime;
      this.startTimer();
    }
  }

  async stop() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.cleanup();
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });
        this.cleanup();
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  cancel() {
    this.cleanup();
  }

  startTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.elapsedTime = Date.now() - this.startTime;
      if (this.onTimerUpdate) {
        this.onTimerUpdate(this.elapsedTime);
      }
    }, 100);
  }

  startVisualizer() {
    if (!this.canvas || !this.analyser) return;

    const canvas = this.canvas;
    const ctx = this.canvasCtx;
    const analyser = this.analyser;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!this.isRecording) return;
      this.animationId = requestAnimationFrame(draw);

      if (this.isPaused) {
        // Subtle resting wave when paused
        this.drawIdleState();
        return;
      }

      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barCount = 36;
      const barSpacing = 4;
      const totalSpacing = barSpacing * (barCount - 1);
      const barWidth = Math.max(3, (width - totalSpacing) / barCount);
      const step = Math.floor(bufferLength / barCount) || 1;

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] || 0;
        const percent = value / 255;
        const barHeight = Math.max(4, percent * (height * 0.85));

        const x = i * (barWidth + barSpacing);
        const y = (height - barHeight) / 2;

        // Gold Gradient
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#FFF3B3');
        gradient.addColorStop(0.4, '#E5C158');
        gradient.addColorStop(0.8, '#D4AF37');
        gradient.addColorStop(1, '#8C670D');

        ctx.fillStyle = gradient;
        ctx.shadowColor = '#D4AF37';
        ctx.shadowBlur = percent > 0.4 ? 8 : 2;

        // Rounded bar
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }
    };

    draw();
  }

  drawIdleState() {
    if (!this.canvas || !this.canvasCtx) return;
    const ctx = this.canvasCtx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }

  cleanup() {
    clearInterval(this.timerInterval);
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isRecording = false;
    this.isPaused = false;
    this.drawIdleState();
  }
}

window.AudioRecorder = AudioRecorder;


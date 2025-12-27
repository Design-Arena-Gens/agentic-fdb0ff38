'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const AUDIO_STREAM_URL =
  'https://nyc3.digitaloceanspaces.com/imagine-explainers/audio-explainers/677d671ccefba3c7c5245cb9/0640663b-c6f7-489c-ba8f-3d076c1ace3c-full.mp3';

const formatSeconds = (value: number) => {
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
};

type RecorderStatus = 'idle' | 'arming' | 'recording' | 'rendering' | 'error';

type SupportState = {
  isMediaRecorderSupported: boolean;
  canCaptureCanvas: boolean;
};

const initialSupportState: SupportState = {
  isMediaRecorderSupported: false,
  canCaptureCanvas: false
};

export function Visualizer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  const [support, setSupport] = useState<SupportState>(initialSupportState);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Ready to animate the entire podcast episode.');

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth * dpr;
    const height = canvas.clientHeight * dpr;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.scale(dpr, dpr);

    const visualWidth = canvas.clientWidth;
    const visualHeight = canvas.clientHeight;

    const gradient = context.createLinearGradient(0, 0, visualWidth, visualHeight);
    gradient.addColorStop(0, 'rgba(86, 160, 255, 0.25)');
    gradient.addColorStop(0.45, 'rgba(100, 250, 210, 0.15)');
    gradient.addColorStop(1, 'rgba(30, 18, 61, 0.45)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, visualWidth, visualHeight);

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);

    const waveformData = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(waveformData);

    const averageLevel = frequencyData.reduce((acc, value) => acc + value, 0) / frequencyData.length;
    const intensity = averageLevel / 255;

    const glowGradient = context.createRadialGradient(
      visualWidth / 2,
      visualHeight / 2,
      0,
      visualWidth / 2,
      visualHeight / 2,
      Math.max(visualWidth, visualHeight) * 0.75
    );
    glowGradient.addColorStop(0, `rgba(130, 255, 236, ${0.25 + intensity * 0.4})`);
    glowGradient.addColorStop(0.45, `rgba(86, 140, 255, ${0.25 + intensity * 0.3})`);
    glowGradient.addColorStop(1, 'rgba(5, 8, 18, 0.2)');
    context.fillStyle = glowGradient;
    context.fillRect(0, 0, visualWidth, visualHeight);

    const barCount = 120;
    const step = Math.floor(frequencyData.length / barCount);
    const barWidth = visualWidth / (barCount * 1.35);
    const centerY = visualHeight / 2;

    context.lineWidth = 1.2;
    context.strokeStyle = 'rgba(206, 255, 250, 0.35)';

    for (let i = 0; i < barCount; i += 1) {
      const value = frequencyData[i * step] / 255;
      const barHeight = Math.max(value * visualHeight * 0.38, 2);
      const x = (visualWidth / barCount) * i;

      context.beginPath();
      context.moveTo(x, centerY - barHeight);
      context.lineTo(x, centerY + barHeight);
      context.stroke();
    }

    context.beginPath();
    const sliceWidth = visualWidth / waveformData.length;
    let x = 0;

    for (let i = 0; i < waveformData.length; i += 1) {
      const v = waveformData[i] / 128.0;
      const y = v * (visualHeight / 2) * 0.9 + visualHeight * 0.05;

      if (i === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
      x += sliceWidth;
    }

    context.strokeStyle = 'rgba(76, 228, 230, 0.6)';
    context.lineWidth = 3.2;
    context.lineCap = 'round';
    context.stroke();

    const orbitCount = 6;
    context.globalCompositeOperation = 'lighter';
    for (let i = 0; i < orbitCount; i += 1) {
      const radius = (visualWidth / 3.2) * (1 + i * 0.1);
      const angle = (performance.now() / (2500 - i * 180)) % (Math.PI * 2);
      const amplitude = frequencyData[(i * 11) % frequencyData.length] / 255;
      const pulse = 0.18 + amplitude * 0.6;
      const orbitX = visualWidth / 2 + Math.cos(angle) * radius * 0.4;
      const orbitY = visualHeight / 2 + Math.sin(angle) * radius * 0.25;

      const particleGradient = context.createRadialGradient(orbitX, orbitY, 0, orbitX, orbitY, radius * 0.55);
      particleGradient.addColorStop(0, `rgba(${150 + i * 12}, ${255 - i * 25}, 255, ${pulse})`);
      particleGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      context.fillStyle = particleGradient;
      context.beginPath();
      context.arc(orbitX, orbitY, radius * 0.45, 0, Math.PI * 2);
      context.fill();
    }
    context.globalCompositeOperation = 'source-over';

    animationFrameRef.current = requestAnimationFrame(drawFrame);

    context.restore();
  }, []);

  const ensureAudioContext = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const audioElement = audioRef.current;
    if (!audioElement) {
      return;
    }

    if (!audioContextRef.current) {
      const AudioContextConstructor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) {
        setStatus('error');
        setStatusMessage('AudioContext is not supported in this browser.');
        return;
      }
      const context = new AudioContextConstructor();
      audioContextRef.current = context;
    }

    const audioContext = audioContextRef.current;
    if (!audioContext) {
      return;
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    if (!mediaSourceRef.current) {
      mediaSourceRef.current = audioContext.createMediaElementSource(audioElement);
    }

    if (!analyserRef.current) {
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.85;
      analyserRef.current = analyser;
    }

    const analyser = analyserRef.current;
    const source = mediaSourceRef.current;

    if (source && analyser) {
      try {
        source.disconnect();
      } catch (error) {
        // silently handle if already disconnected
      }

      source.connect(analyser);
      analyser.connect(audioContext.destination);
    }

  }, []);

  const startPlayback = useCallback(async () => {
    await ensureAudioContext();
    const audioElement = audioRef.current;
    if (!audioElement) {
      return;
    }

    try {
      await audioElement.play();
      setIsPlaying(true);
      setStatusMessage('Visualizing live audio in real time.');
      stopAnimation();
      drawFrame();
    } catch (error) {
      setStatus('error');
      setStatusMessage('Playback failed. Please tap the play button to allow audio.');
    }
  }, [drawFrame, ensureAudioContext, stopAnimation]);

  const pausePlayback = useCallback(() => {
    const audioElement = audioRef.current;
    if (!audioElement) {
      return;
    }
    audioElement.pause();
    setIsPlaying(false);
    setStatusMessage('Paused. Resume playback to continue the animation.');
    stopAnimation();
  }, [stopAnimation]);

  const teardownRecorder = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
  }, []);

  const handleRecordingStop = useCallback(() => {
    const chunks = recordedChunksRef.current;
    if (!chunks.length) {
      setStatus('error');
      setStatusMessage('Recording produced no data. Try once more.');
      return;
    }
    setStatus('rendering');

    const blob = new Blob(chunks, { type: 'video/webm' });
    const objectUrl = URL.createObjectURL(blob);
    setDownloadUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return objectUrl;
    });

    setStatus('idle');
    setStatusMessage('Video ready. Download and share your animated episode.');
    recordedChunksRef.current = [];
  }, []);

  const startRecording = useCallback(async () => {
    const audioElement = audioRef.current;
    const canvasElement = canvasRef.current;
    if (!audioElement || !canvasElement) {
      return;
    }

    await ensureAudioContext();

    const canvasStream = canvasElement.captureStream(60);
    const mediaElement = audioElement as HTMLMediaElement & {
      captureStream?: () => MediaStream;
      mozCaptureStream?: () => MediaStream;
    };
    const audioCapture = mediaElement.captureStream?.() ?? mediaElement.mozCaptureStream?.();

    if (!canvasStream) {
      setStatus('error');
      setStatusMessage('Canvas capture is not supported in this browser.');
      return;
    }

    if (!audioCapture) {
      setStatus('error');
      setStatusMessage('Audio capture is not supported in this browser.');
      return;
    }

    const composedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audioCapture.getAudioTracks()
    ]);

    if (!('MediaRecorder' in window)) {
      setStatus('error');
      setStatusMessage('MediaRecorder is not available in this environment.');
      return;
    }

    try {
      teardownRecorder();
      const recorder = new MediaRecorder(composedStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      mediaRecorderRef.current = recorder;

      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = handleRecordingStop;

      recorder.start(250);

      setStatus('recording');
      setStatusMessage('Recording the animated performance in real time…');
      setDownloadUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });

      audioElement.currentTime = 0;
      await audioElement.play();
      setIsPlaying(true);
      stopAnimation();
      drawFrame();
    } catch (error) {
      setStatus('error');
      setStatusMessage('Unable to start the recording. Please try again.');
    }
  }, [drawFrame, ensureAudioContext, handleRecordingStop, stopAnimation, teardownRecorder]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setStatus('rendering');
      setStatusMessage('Finishing up your video export…');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setSupport({
      isMediaRecorderSupported: 'MediaRecorder' in window,
      canCaptureCanvas: !!HTMLCanvasElement.prototype.captureStream
    });
  }, []);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) {
      return () => undefined;
    }

    const onLoadedMetadata = () => {
      setDuration(audioElement.duration || 0);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime || 0);
    };

    const onEnded = () => {
      setIsPlaying(false);
      stopAnimation();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        stopRecording();
      }
    };

    audioElement.addEventListener('loadedmetadata', onLoadedMetadata);
    audioElement.addEventListener('timeupdate', onTimeUpdate);
    audioElement.addEventListener('ended', onEnded);

    return () => {
      audioElement.removeEventListener('loadedmetadata', onLoadedMetadata);
      audioElement.removeEventListener('timeupdate', onTimeUpdate);
      audioElement.removeEventListener('ended', onEnded);
    };
  }, [stopAnimation, stopRecording]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      return () => undefined;
    }

    const resizeCanvas = () => {
      const bounds = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = bounds.width * dpr;
      canvas.height = bounds.height * dpr;
      canvas.style.width = `${bounds.width}px`;
      canvas.style.height = `${bounds.height}px`;
      const context = canvas.getContext('2d');
      if (context) {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.scale(dpr, dpr);
      }
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => () => {
    stopAnimation();
    teardownRecorder();
    const audioContext = audioContextRef.current;
    if (audioContext) {
      audioContext.close();
    }
  }, [stopAnimation, teardownRecorder]);

  const disabledRecordingReason = useMemo(() => {
    if (!support.isMediaRecorderSupported) {
      return 'MediaRecorder is not available in this browser.';
    }
    if (!support.canCaptureCanvas) {
      return 'Canvas capture is unsupported in this browser.';
    }
    return null;
  }, [support]);

  return (
    <div className="gradient-border">
      <div className="card" style={{ padding: '2rem', display: 'grid', gap: '2rem' }}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <span className="badge">
            <span aria-hidden="true">🔊</span>
            Full episode animation
          </span>
          <h1 className="section-title">Navigating the Autonomous Frontier</h1>
          <p className="section-subtitle">
            Watch the entire podcast episode morph into a living, generative animated video. The visuals pulse,
            orbit, and flow in sync with every beat of the voice-over.
          </p>
        </header>

        <div
          ref={containerRef}
          style={{
            position: 'relative',
            width: '100%',
            borderRadius: '24px',
            overflow: 'hidden',
            aspectRatio: '16/9',
            background: 'rgba(5, 8, 20, 0.75)',
            border: '1px solid rgba(120, 186, 255, 0.16)'
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block'
            }}
          />

          <div
            style={{
              position: 'absolute',
              inset: 'auto 1.5rem 1.5rem 1.5rem',
              padding: '1rem 1.2rem',
              borderRadius: '18px',
              background: 'linear-gradient(120deg, rgba(7, 11, 28, 0.86), rgba(12, 32, 41, 0.86))',
              border: '1px solid rgba(110, 206, 255, 0.18)',
              display: 'grid',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '1rem', letterSpacing: '0.04em' }}>Live Audio Feed</strong>
              <span style={{ color: 'rgba(220, 236, 255, 0.7)', fontFamily: 'monospace' }}>
                {formatSeconds(currentTime)} / {formatSeconds(duration || 0)}
              </span>
            </div>

            <audio
              ref={audioRef}
              src={AUDIO_STREAM_URL}
              preload="metadata"
              controls
              style={{ width: '100%' }}
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {!isPlaying ? (
                <button className="cta-btn" type="button" onClick={startPlayback}>
                  Play &amp; Animate
                </button>
              ) : (
                <button className="cta-btn secondary-btn" type="button" onClick={pausePlayback}>
                  Pause Animation
                </button>
              )}

              <button
                className="cta-btn"
                type="button"
                onClick={startRecording}
                disabled={status === 'recording' || !!disabledRecordingReason}
                style={{ opacity: status === 'recording' || disabledRecordingReason ? 0.6 : 1 }}
              >
                {status === 'recording' ? 'Recording…' : 'Record Full Video'}
              </button>
              <button
                className="cta-btn secondary-btn"
                type="button"
                onClick={stopRecording}
                disabled={status !== 'recording'}
              >
                Finish Recording
              </button>
            </div>

            <p style={{ margin: 0, color: 'rgba(170, 202, 255, 0.7)', fontSize: '0.9rem' }}>{statusMessage}</p>

            {disabledRecordingReason && (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255, 171, 171, 0.8)' }}>
                {disabledRecordingReason}
              </p>
            )}

            {downloadUrl && (
              <a
                href={downloadUrl}
                download="navigating-the-autonomous-frontier.webm"
                className="cta-btn"
                style={{ textAlign: 'center' }}
              >
                Download Animated Video
              </a>
            )}
          </div>
        </div>

        <section>
          <h2 style={{ fontSize: '1.4rem', margin: 0, letterSpacing: '-0.01em' }}>What makes this reactive video special?</h2>
          <div className="metrics-grid">
            <div className="metric">
              <strong>Audio-Reactive</strong>
              <span>The waveform, particle orbits, and light flows all respond live to the narrator&apos;s cadence.</span>
            </div>
            <div className="metric">
              <strong>Full-Length</strong>
              <span>No snippets here—the entire episode is captured and rendered with synchronized visuals.</span>
            </div>
            <div className="metric">
              <strong>Exportable</strong>
              <span>Generate a downloadable WebM video that includes both the animation and the voice track.</span>
            </div>
            <div className="metric">
              <strong>Browser Native</strong>
              <span>Runs fully in-browser with Web Audio, Canvas, and MediaRecorder APIs—deployment ready for Vercel.</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Visualizer;

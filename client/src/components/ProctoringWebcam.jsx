import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, Maximize, Minimize2, ChevronDown, ChevronUp } from 'lucide-react';

export default function ProctoringWebcam({
  cameraActive = false,
  micActive = false,
  fullscreenActive = false,
  onCameraError,
  onMicError,
  onStreamStopped,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const [audioVolume, setAudioVolume] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [streamError, setStreamError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function setupMedia() {
      if (!cameraActive && !micActive) return;

      try {
        const constraints = {
          video: cameraActive ? { width: { ideal: 320 }, height: { ideal: 240 } } : false,
          audio: micActive ? true : false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current && cameraActive) {
          videoRef.current.srcObject = stream;
        }

        // Listen for sudden camera track loss
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            if (mounted) {
              setStreamError('Camera feed disconnected');
              if (onStreamStopped) onStreamStopped();
            }
          };
        }

        // Set up audio volume analysis
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack && micActive) {
          try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioCtx();
            audioContextRef.current = audioCtx;
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 128;
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkVolume = () => {
              if (!mounted || audioCtx.state === 'closed') return;
              analyser.getByteFrequencyData(dataArray);
              let total = 0;
              for (let i = 0; i < dataArray.length; i++) total += dataArray[i];
              const avg = total / dataArray.length;
              setAudioVolume(Math.min(100, Math.round((avg / 128) * 100)));
              requestAnimationFrame(checkVolume);
            };
            checkVolume();
          } catch (e) {}
        }
      } catch (err) {
        if (mounted) {
          setStreamError(err.message || 'Media stream error');
          if (onCameraError) onCameraError(err);
        }
      }
    }

    setupMedia();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [cameraActive, micActive]);

  if (!cameraActive && !micActive) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-300 w-56">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700/60">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Proctoring Active</span>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-slate-400 hover:text-white transition p-0.5"
          title={isMinimized ? 'Expand' : 'Collapse'}
        >
          {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {!isMinimized && (
        <div className="p-2 space-y-2">
          {/* Camera Viewport */}
          {cameraActive && (
            <div className="relative w-full h-32 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              {streamError ? (
                <div className="text-center p-2 text-rose-400 text-xs">
                  <CameraOff className="w-5 h-5 mx-auto mb-1 opacity-75" />
                  <span>{streamError}</span>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover mirror"
                />
              )}
            </div>
          )}

          {/* Indicators & Audio Meter */}
          <div className="flex items-center justify-between text-[11px] text-slate-300 px-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                {cameraActive && !streamError ? (
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <CameraOff className="w-3.5 h-3.5 text-rose-400" />
                )}
              </span>
              <span className="flex items-center gap-1">
                {micActive ? (
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <MicOff className="w-3.5 h-3.5 text-slate-500" />
                )}
              </span>
              <span className="flex items-center gap-1">
                <Maximize
                  className={`w-3.5 h-3.5 ${fullscreenActive ? 'text-indigo-400' : 'text-slate-500'}`}
                />
              </span>
            </div>

            {/* Mic Volume Level Bar */}
            {micActive && (
              <div className="flex items-center gap-1 w-20">
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-75"
                    style={{ width: `${audioVolume}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

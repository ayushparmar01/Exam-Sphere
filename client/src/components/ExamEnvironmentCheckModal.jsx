import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  Mic,
  Maximize,
  Wifi,
  HardDrive,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

export default function ExamEnvironmentCheckModal({
  isOpen,
  examConfig = {},
  onPass,
  onCancel,
}) {
  const [browserReady, setBrowserReady] = useState(true);
  const [networkReady, setNetworkReady] = useState(navigator.onLine);
  const [cameraStatus, setCameraStatus] = useState('CHECKING'); // 'CHECKING', 'READY', 'DENIED', 'UNAVAILABLE', 'NOT_REQUIRED'
  const [micStatus, setMicStatus] = useState('CHECKING');
  const [fullscreenReady, setFullscreenReady] = useState(false);
  const [storageReady, setStorageReady] = useState(true);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  const cameraRequired = !!examConfig.cameraRequired;
  const micRequired = !!examConfig.microphoneRequired;
  const fullscreenRequired = !!examConfig.fullscreenRequired;

  useEffect(() => {
    if (!isOpen) return;

    // 1. Storage Check
    try {
      localStorage.setItem('__exam_test__', '1');
      localStorage.removeItem('__exam_test__');
      setStorageReady(true);
    } catch (e) {
      setStorageReady(false);
    }

    // 2. Network Check
    setNetworkReady(navigator.onLine);

    // 3. Camera Check
    if (cameraRequired || examConfig.cameraMonitoringEnabled) {
      checkCamera();
    } else {
      setCameraStatus('NOT_REQUIRED');
    }

    // 4. Microphone Check
    if (micRequired || examConfig.microphoneMonitoringEnabled) {
      checkMicrophone();
    } else {
      setMicStatus('NOT_REQUIRED');
    }

    // 5. Fullscreen capability check
    const canFullscreen = !!(
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled ||
      document.msFullscreenEnabled
    );
    setFullscreenReady(canFullscreen);

    return () => {
      // Clean up test stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isOpen]);

  const checkCamera = async () => {
    setCameraStatus('CHECKING');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraStatus('UNAVAILABLE');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraStatus('READY');
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('DENIED');
      } else {
        setCameraStatus('UNAVAILABLE');
      }
    }
  };

  const checkMicrophone = async () => {
    setMicStatus('CHECKING');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicStatus('UNAVAILABLE');
        return;
      }
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStatus('READY');

      // Set up audio meter preview
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(audioStream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        setIsTestingAudio(true);

        const updateMeter = () => {
          if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          requestAnimationFrame(updateMeter);
        };
        updateMeter();
      } catch (e) {}
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicStatus('DENIED');
      } else {
        setMicStatus('UNAVAILABLE');
      }
    }
  };

  // Determine whether candidate is allowed to proceed
  const cameraPassed = !cameraRequired || cameraStatus === 'READY';
  const micPassed = !micRequired || micStatus === 'READY';
  const fullscreenPassed = !fullscreenRequired || fullscreenReady;
  const isReadyToProceed = browserReady && networkReady && storageReady && cameraPassed && micPassed && fullscreenPassed;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-fade-in text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Exam Environment Readiness Check</h2>
              <p className="text-sm text-slate-400">Verifying browser capabilities & device permissions</p>
            </div>
          </div>
        </div>

        {/* Camera Preview Area (if camera required) */}
        {(cameraRequired || examConfig.cameraMonitoringEnabled) && (
          <div className="mb-6 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-400" />
                Live Camera Feed Verification
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  cameraStatus === 'READY'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {cameraStatus === 'READY' ? 'Stream Active' : cameraStatus}
              </span>
            </div>
            <div className="relative w-full h-48 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover mirror"
              />
              {cameraStatus !== 'READY' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-center p-4">
                  <Camera className="w-8 h-8 text-slate-500 mb-2" />
                  <p className="text-sm font-medium text-slate-300">
                    {cameraStatus === 'DENIED'
                      ? 'Camera permission denied. Please allow camera access in your browser settings.'
                      : cameraStatus === 'UNAVAILABLE'
                      ? 'No camera device detected on this system.'
                      : 'Requesting camera stream...'}
                  </p>
                  <button
                    onClick={checkCamera}
                    className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-check Camera
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Microphone Audio Meter (if mic required) */}
        {(micRequired || examConfig.microphoneMonitoringEnabled) && (
          <div className="mb-6 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-cyan-400" />
                Microphone Input Test
              </span>
              <span className="text-xs text-slate-400">Speak into your mic to test level</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-rose-500 transition-all duration-75"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
          </div>
        )}

        {/* Environment Checklist */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-sm font-semibold">Browser & Platform Support</p>
                <p className="text-xs text-slate-400">HTML5, WebSockets, Canvas enabled</p>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800">
            <div className="flex items-center gap-3">
              <Wifi className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-semibold">Network Connection</p>
                <p className="text-xs text-slate-400">{networkReady ? 'Online & Stable' : 'Offline'}</p>
              </div>
            </div>
            {networkReady ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-500" />
            )}
          </div>

          {cameraRequired && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-indigo-400" />
                <div>
                  <p className="text-sm font-semibold">Webcam Integrity Feed</p>
                  <p className="text-xs text-slate-400">Required by exam policy</p>
                </div>
              </div>
              {cameraStatus === 'READY' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500" />
              )}
            </div>
          )}

          {micRequired && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-3">
                <Mic className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="text-sm font-semibold">Microphone Audio Monitoring</p>
                  <p className="text-xs text-slate-400">Required by exam policy</p>
                </div>
              </div>
              {micStatus === 'READY' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500" />
              )}
            </div>
          )}

          {fullscreenRequired && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-3">
                <Maximize className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm font-semibold">Fullscreen Mode</p>
                  <p className="text-xs text-slate-400">Will expand upon entering examination</p>
                </div>
              </div>
              {fullscreenReady ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-teal-400" />
              <div>
                <p className="text-sm font-semibold">Local Answer Persistence</p>
                <p className="text-xs text-slate-400">Offline resilient answer queue initialized</p>
              </div>
            </div>
            {storageReady ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-500" />
            )}
          </div>
        </div>

        {/* Browser Extension & Privacy Notice */}
        <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Candidate Notice:</span> Please close extraneous applications and manually
            disable third-party browser extensions that inject code. Proctoring signals are recorded as integrity
            indicators for academic evaluation.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition"
          >
            Cancel & Return
          </button>

          <button
            onClick={onPass}
            disabled={!isReadyToProceed}
            className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition shadow-lg ${
              isReadyToProceed
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            Enter Examination <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

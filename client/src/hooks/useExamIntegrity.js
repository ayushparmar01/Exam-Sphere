import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';

export const useExamIntegrity = (attemptId, active = true) => {
  const [warningCount, setWarningCount] = useState(0);
  const [riskScore, setRiskScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState('LOW');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [lastWarningMessage, setLastWarningMessage] = useState('');
  const lastEventTimeRef = useRef({});

  const sendEvent = useCallback(
    async (eventType, metadata = {}) => {
      if (!attemptId || !active) return;

      // Throttle rapid duplicate events (e.g. repeated blurs within 1 second)
      const now = Date.now();
      const lastTime = lastEventTimeRef.current[eventType] || 0;
      if (now - lastTime < 1000) {
        return;
      }
      lastEventTimeRef.current[eventType] = now;

      try {
        const res = await api.post(`/attempts/${attemptId}/integrity-event`, {
          eventType,
          metadata,
        });

        if (res.data?.data) {
          const { riskScore: newScore, riskLevel: newLevel } = res.data.data;
          setRiskScore(newScore);
          setRiskLevel(newLevel);
        }
      } catch (e) {
        // Quiet fail telemetry
      }
    },
    [attemptId, active]
  );

  useEffect(() => {
    if (!active || !attemptId) return;

    // 1. Tab switch (Visibility change)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarningCount((c) => c + 1);
        setLastWarningMessage('Tab switch detected. You must keep this assessment window focused.');
        setShowWarningModal(true);
        sendEvent('TAB_SWITCH', { timestamp: new Date().toISOString() });
      } else {
        sendEvent('WINDOW_FOCUS', { timestamp: new Date().toISOString() });
      }
    };

    // 2. Window Blur & Focus
    const handleBlur = () => {
      setWarningCount((c) => c + 1);
      setLastWarningMessage('Window focus lost. Please maintain focus on the exam interface.');
      setShowWarningModal(true);
      sendEvent('WINDOW_BLUR', { timestamp: new Date().toISOString() });
    };

    const handleFocus = () => {
      sendEvent('WINDOW_FOCUS', { timestamp: new Date().toISOString() });
    };

    // 3. Fullscreen state
    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      if (!isFullscreen) {
        setWarningCount((c) => c + 1);
        setLastWarningMessage('Fullscreen exited. Assessment policy requires active fullscreen mode.');
        setShowWarningModal(true);
        sendEvent('FULLSCREEN_EXIT', { timestamp: new Date().toISOString() });
      } else {
        sendEvent('FULLSCREEN_ENTER', { timestamp: new Date().toISOString() });
      }
    };

    // 4. Clipboard restrictions: Copy, Cut, Paste
    const handleCopy = (e) => {
      e.preventDefault();
      setLastWarningMessage('Copying is disabled during the examination.');
      setShowWarningModal(true);
      sendEvent('COPY_ATTEMPT', { target: e.target?.tagName || 'UNKNOWN' });
    };

    const handleCut = (e) => {
      e.preventDefault();
      setLastWarningMessage('Cutting text is disabled during the examination.');
      setShowWarningModal(true);
      sendEvent('CUT_ATTEMPT', { target: e.target?.tagName || 'UNKNOWN' });
    };

    const handlePaste = (e) => {
      e.preventDefault();
      setLastWarningMessage('Pasting content is disabled during the examination.');
      setShowWarningModal(true);
      sendEvent('PASTE_ATTEMPT', { target: e.target?.tagName || 'UNKNOWN' });
    };

    // 5. Context menu (Right Click)
    const handleContextMenu = (e) => {
      e.preventDefault();
      setLastWarningMessage('Context menu is disabled during the examination.');
      setShowWarningModal(true);
      sendEvent('CONTEXT_MENU_ATTEMPT', {});
    };

    // 6. DevTools Keyboard Shortcut Heuristics (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U'))
      ) {
        e.preventDefault();
        setWarningCount((c) => c + 1);
        setLastWarningMessage('Developer tools shortcuts are restricted during testing.');
        setShowWarningModal(true);
        sendEvent('DEVTOOLS_HEURISTIC', { key: e.key });
      }
    };

    // 7. Network offline/online
    const handleOffline = () => {
      sendEvent('NETWORK_OFFLINE', {});
    };

    const handleOnline = () => {
      sendEvent('NETWORK_RECOVERED', {});
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [attemptId, active, sendEvent]);

  return {
    warningCount,
    riskScore,
    riskLevel,
    showWarningModal,
    dismissWarning: () => setShowWarningModal(false),
    lastWarningMessage,
    sendEvent,
  };
};

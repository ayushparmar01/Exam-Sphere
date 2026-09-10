import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

/**
 * High-reliability Offline Answer Queue with LocalStorage Persistence
 * Automatically detects offline/online transitions and flushes queued answers with timestamps.
 */
export function useOfflineQueue(attemptId) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState('SYNCED'); // 'SYNCED', 'OFFLINE', 'SYNCING'
  const [pendingCount, setPendingCount] = useState(0);
  const [syncMessage, setSyncMessage] = useState('');

  const queueKey = `examsphere_queue_${attemptId}`;
  const isSyncingRef = useRef(false);

  // Load pending queue from localStorage
  const getQueue = useCallback(() => {
    if (!attemptId) return [];
    try {
      const data = localStorage.getItem(queueKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }, [attemptId, queueKey]);

  // Save pending queue to localStorage
  const setQueue = useCallback(
    (queue) => {
      if (!attemptId) return;
      try {
        localStorage.setItem(queueKey, JSON.stringify(queue));
        setPendingCount(queue.length);
      } catch (e) {}
    },
    [attemptId, queueKey]
  );

  // Flush queue to backend
  const flushQueue = useCallback(async () => {
    if (!attemptId || isSyncingRef.current || !navigator.onLine) return;

    const queue = getQueue();
    if (queue.length === 0) {
      setSyncStatus('SYNCED');
      setSyncMessage('All answers synced ✓');
      return;
    }

    isSyncingRef.current = true;
    setSyncStatus('SYNCING');
    setSyncMessage('Connection restored — Synchronizing...');

    try {
      await api.put(`/attempts/${attemptId}/sync-answers`, {
        answers: queue,
      });

      // Clear queue on success
      setQueue([]);
      setSyncStatus('SYNCED');
      setSyncMessage('All answers synced ✓');

      // Clear success message after 4s
      setTimeout(() => {
        setSyncMessage('');
      }, 4000);
    } catch (err) {
      // Failed to flush, keep in queue
      setSyncStatus('OFFLINE');
      setSyncMessage('Failed to sync. Answers remain safe locally.');
    } finally {
      isSyncingRef.current = false;
    }
  }, [attemptId, getQueue, setQueue]);

  // Queue an answer locally and attempt to save
  const enqueueAnswer = useCallback(
    async ({
      questionId,
      selectedOption,
      selectedOptions,
      numericalValue,
      textAnswer,
      markedForReview,
      visited,
      currentQuestionIndex,
    }) => {
      const timestamp = Date.now();
      const payload = {
        questionId,
        selectedOption: selectedOption !== undefined ? selectedOption : null,
        selectedOptions: Array.isArray(selectedOptions) ? selectedOptions : [],
        numericalValue: typeof numericalValue === 'number' && !isNaN(numericalValue) ? numericalValue : null,
        textAnswer: typeof textAnswer === 'string' ? textAnswer : null,
        markedForReview: !!markedForReview,
        visited: !!visited,
        clientTimestamp: timestamp,
      };

      // 1. Persist locally first
      const currentQueue = getQueue();
      const existingIdx = currentQueue.findIndex((q) => q.questionId === questionId);
      if (existingIdx >= 0) {
        currentQueue[existingIdx] = payload;
      } else {
        currentQueue.push(payload);
      }
      setQueue(currentQueue);

      // 2. If online, send directly to API
      if (navigator.onLine) {
        try {
          await api.put(`/attempts/${attemptId}/answer`, {
            ...payload,
            currentQuestionIndex,
          });

          // Remove successfully sent item from local queue
          const updated = getQueue().filter((q) => q.questionId !== questionId);
          setQueue(updated);
          if (updated.length === 0) {
            setSyncStatus('SYNCED');
          }
        } catch (err) {
          // If network error occurred, keep in queue
          setSyncStatus('OFFLINE');
          setSyncMessage('Offline — Your answers are stored locally and will sync automatically.');
        }
      } else {
        setSyncStatus('OFFLINE');
        setSyncMessage('Offline — Your answers are stored locally and will sync automatically.');
      }
    },
    [attemptId, getQueue, setQueue]
  );

  // Listen to browser network changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      flushQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('OFFLINE');
      setSyncMessage('Offline — Your answers are stored locally and will sync automatically.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (getQueue().length > 0 && navigator.onLine) {
      flushQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushQueue, getQueue]);

  return {
    isOnline,
    syncStatus,
    pendingCount,
    syncMessage,
    enqueueAnswer,
    flushQueue,
  };
}

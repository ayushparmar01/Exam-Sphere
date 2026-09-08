import { useState, useEffect, useRef } from 'react';

export const useTimer = (initialSeconds, onExpire) => {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds || 0);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    setRemainingSeconds(initialSeconds || 0);
  }, [initialSeconds]);

  useEffect(() => {
    if (remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onExpireRef.current) {
            onExpireRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  // Format HH:MM:SS
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const formatted = [
    hours > 0 ? String(hours).padStart(2, '0') : null,
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ]
    .filter(Boolean)
    .join(':');

  return {
    remainingSeconds,
    formatted,
    isUrgent: remainingSeconds > 0 && remainingSeconds <= 300, // < 5 mins
    isExpired: remainingSeconds <= 0,
  };
};

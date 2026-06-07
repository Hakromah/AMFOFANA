'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const INACTIVITY_MS = 10 * 60 * 1000; // 10 minutes before warning
const WARNING_DURATION = 60;           // 60 second countdown then logout

export function useSessionTimeout() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_DURATION);

  // Refs to avoid stale closures
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningActive = useRef(false);

  const clearAllTimers = () => {
    if (inactivityRef.current) { clearTimeout(inactivityRef.current);  inactivityRef.current = null; }
    if (countdownRef.current)  { clearInterval(countdownRef.current);  countdownRef.current  = null; }
  };

  const doLogout = useCallback(() => {
    clearAllTimers();
    warningActive.current = false;
    // Clear auth tokens
    try {
      Cookies.remove('accessToken', { path: '/' });
      Cookies.remove('userRole',    { path: '/' });
    } catch {}
    window.location.href = '/login';
  }, []);

  const startCountdown = useCallback(() => {
    warningActive.current = true;
    setShowWarning(true);
    let remaining = WARNING_DURATION;
    setCountdown(remaining);

    countdownRef.current = setInterval(() => {
      remaining--;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(countdownRef.current!);
        countdownRef.current = null;
        doLogout();
      }
    }, 1000);
  }, [doLogout]);

  const scheduleInactivityTimer = useCallback(() => {
    clearAllTimers();
    inactivityRef.current = setTimeout(startCountdown, INACTIVITY_MS);
  }, [startCountdown]);

  // "Stay Logged In" — reset everything
  const stayLoggedIn = useCallback(() => {
    clearAllTimers();
    warningActive.current = false;
    setShowWarning(false);
    setCountdown(WARNING_DURATION);
    scheduleInactivityTimer();
  }, [scheduleInactivityTimer]);

  useEffect(() => {
    const handleActivity = () => {
      // Only reset the inactivity timer when warning is NOT showing
      if (!warningActive.current) {
        scheduleInactivityTimer();
      }
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));

    // Start the initial timer
    scheduleInactivityTimer();

    return () => {
      clearAllTimers();
      events.forEach(e => window.removeEventListener(e, handleActivity));
    };
  }, [scheduleInactivityTimer]);

  return { showWarning, countdown, stayLoggedIn, doLogout };
}

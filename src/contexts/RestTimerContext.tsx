import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export interface TimerPreset {
  label: string;
  secs: number;
}

export const DEFAULT_PRESETS: TimerPreset[] = [
  { label: '30s', secs: 30 },
  { label: '60s', secs: 60 },
  { label: '90s', secs: 90 },
  { label: '2m', secs: 120 },
  { label: '3m', secs: 180 },
  { label: '5m', secs: 300 },
];

interface RestTimerContextType {
  totalSeconds: number;
  remainingSeconds: number;
  isActive: boolean;
  soundEnabled: boolean;
  isTimerModalOpen: boolean;
  autoStartOnComplete: boolean;
  presets: TimerPreset[];
  formattedTime: string;
  progressPercent: number;
  setIsTimerModalOpen: (open: boolean) => void;
  openTimer: (defaultSecs?: number) => void;
  closeTimer: () => void;
  startTimer: (seconds?: number) => void;
  pauseTimer: () => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  adjustTime: (deltaSeconds: number) => void;
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setAutoStartOnComplete: React.Dispatch<React.SetStateAction<boolean>>;
  selectPreset: (secs: number) => void;
}

const RestTimerContext = createContext<RestTimerContextType | undefined>(undefined);

export const RestTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [totalSeconds, setTotalSeconds] = useState<number>(90);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(90);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(false);
  const [autoStartOnComplete, setAutoStartOnComplete] = useState<boolean>(true);

  const endTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<any>(null);

  // Audio chime
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.3); // D6

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);

      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (e) {
      console.warn('Audio chime unsupported or blocked:', e);
    }
  };

  // Timestamp-based countdown to survive throttling and background delays
  useEffect(() => {
    if (isActive) {
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + remainingSeconds * 1000;
      }

      intervalRef.current = setInterval(() => {
        if (!endTimeRef.current) return;
        const diffMs = endTimeRef.current - Date.now();
        const secondsLeft = Math.max(0, Math.ceil(diffMs / 1000));

        setRemainingSeconds(secondsLeft);

        if (secondsLeft <= 0) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          endTimeRef.current = null;
          setIsActive(false);
          playChime();
        }
      }, 250);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      endTimeRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const startTimer = (seconds?: number) => {
    const target = seconds !== undefined ? seconds : (remainingSeconds > 0 ? remainingSeconds : totalSeconds);
    const validTarget = Math.max(1, target);
    if (seconds !== undefined) {
      setTotalSeconds(validTarget);
    }
    setRemainingSeconds(validTarget);
    endTimeRef.current = Date.now() + validTarget * 1000;
    setIsActive(true);
  };

  const pauseTimer = () => {
    setIsActive(false);
    endTimeRef.current = null;
  };

  const toggleTimer = () => {
    if (isActive) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const resetTimer = () => {
    pauseTimer();
    setRemainingSeconds(totalSeconds);
  };

  const adjustTime = (deltaSeconds: number) => {
    const nextRemaining = Math.max(0, remainingSeconds + deltaSeconds);
    const nextTotal = Math.max(nextRemaining, totalSeconds + deltaSeconds);
    setRemainingSeconds(nextRemaining);
    setTotalSeconds(Math.max(1, nextTotal));
    if (isActive) {
      endTimeRef.current = Date.now() + nextRemaining * 1000;
    }
  };

  const selectPreset = (secs: number) => {
    setTotalSeconds(secs);
    startTimer(secs);
  };

  const openTimer = (defaultSecs?: number) => {
    if (defaultSecs !== undefined) {
      setTotalSeconds(defaultSecs);
      startTimer(defaultSecs);
    }
    setIsTimerModalOpen(true);
  };

  const closeTimer = () => {
    setIsTimerModalOpen(false);
  };

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  const progressPercent = totalSeconds > 0 ? Math.min(100, Math.max(0, ((totalSeconds - remainingSeconds) / totalSeconds) * 100)) : 0;

  return (
    <RestTimerContext.Provider
      value={{
        totalSeconds,
        remainingSeconds,
        isActive,
        soundEnabled,
        isTimerModalOpen,
        autoStartOnComplete,
        presets: DEFAULT_PRESETS,
        formattedTime,
        progressPercent,
        setIsTimerModalOpen,
        openTimer,
        closeTimer,
        startTimer,
        pauseTimer,
        toggleTimer,
        resetTimer,
        adjustTime,
        setSoundEnabled,
        setAutoStartOnComplete,
        selectPreset
      }}
    >
      {children}
    </RestTimerContext.Provider>
  );
};

export const useRestTimer = () => {
  const context = useContext(RestTimerContext);
  if (!context) {
    throw new Error('useRestTimer must be used within a RestTimerProvider');
  }
  return context;
};

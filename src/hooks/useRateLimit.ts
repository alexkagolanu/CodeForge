/**
 * Rate Limiting Hook - Prevents spam submissions
 */

import { useState, useCallback, useRef } from 'react';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  cooldownMs: number;
}

interface RateLimitState {
  attempts: number;
  windowStart: number;
  cooldownUntil: number | null;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 2, // 2 submissions per window
  windowMs: 60 * 1000, // 1 minute window
  cooldownMs: 60 * 1000, // 1 minute cooldown
};

export function useRateLimit(config: Partial<RateLimitConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [state, setState] = useState<RateLimitState>({
    attempts: 0,
    windowStart: Date.now(),
    cooldownUntil: null,
  });
  const lastCodeHash = useRef<string | null>(null);

  const hashCode = (code: string): string => {
    // Simple hash function for code comparison
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  };

  const checkRateLimit = useCallback((code: string): { allowed: boolean; message?: string; waitTime?: number } => {
    const now = Date.now();

    // Check cooldown
    if (state.cooldownUntil && now < state.cooldownUntil) {
      const waitTime = Math.ceil((state.cooldownUntil - now) / 1000);
      return {
        allowed: false,
        message: `Rate limited. Please wait ${waitTime} seconds.`,
        waitTime,
      };
    }

    // Check for duplicate code submission
    const codeHash = hashCode(code);
    if (lastCodeHash.current === codeHash) {
      return {
        allowed: false,
        message: 'Please modify your code before submitting again.',
      };
    }

    // Reset window if expired
    if (now - state.windowStart > finalConfig.windowMs) {
      setState({
        attempts: 0,
        windowStart: now,
        cooldownUntil: null,
      });
      return { allowed: true };
    }

    // Check attempts in current window
    if (state.attempts >= finalConfig.maxAttempts) {
      const cooldownUntil = now + finalConfig.cooldownMs;
      setState(prev => ({ ...prev, cooldownUntil }));
      return {
        allowed: false,
        message: `Too many submissions. Please wait ${Math.ceil(finalConfig.cooldownMs / 1000)} seconds.`,
        waitTime: Math.ceil(finalConfig.cooldownMs / 1000),
      };
    }

    return { allowed: true };
  }, [state, finalConfig]);

  const recordAttempt = useCallback((code: string) => {
    const codeHash = hashCode(code);
    lastCodeHash.current = codeHash;
    setState(prev => ({
      ...prev,
      attempts: prev.attempts + 1,
    }));
  }, []);

  const getRemainingAttempts = useCallback((): number => {
    const now = Date.now();
    if (now - state.windowStart > finalConfig.windowMs) {
      return finalConfig.maxAttempts;
    }
    return Math.max(0, finalConfig.maxAttempts - state.attempts);
  }, [state, finalConfig]);

  const getCooldownRemaining = useCallback((): number => {
    if (!state.cooldownUntil) return 0;
    const remaining = state.cooldownUntil - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }, [state.cooldownUntil]);

  return {
    checkRateLimit,
    recordAttempt,
    getRemainingAttempts,
    getCooldownRemaining,
    isInCooldown: state.cooldownUntil ? Date.now() < state.cooldownUntil : false,
  };
}

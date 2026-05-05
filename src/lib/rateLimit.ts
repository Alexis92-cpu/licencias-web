// src/lib/rateLimit.ts
// Simple client-side rate limiting to mitigate basic brute force
// For real security, rate limiting must be handled by Supabase/Vercel server-side.

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

interface RateLimitState {
  attempts: number;
  lockoutUntil: number | null;
}

const getRateLimitState = (): RateLimitState => {
  const stored = localStorage.getItem('auth_rate_limit');
  if (stored) {
    return JSON.parse(stored);
  }
  return { attempts: 0, lockoutUntil: null };
};

const saveRateLimitState = (state: RateLimitState) => {
  localStorage.setItem('auth_rate_limit', JSON.stringify(state));
};

export const checkRateLimit = (): { allowed: boolean; waitMinutes?: number } => {
  const state = getRateLimitState();
  const now = Date.now();

  if (state.lockoutUntil && now < state.lockoutUntil) {
    const waitMinutes = Math.ceil((state.lockoutUntil - now) / 60000);
    return { allowed: false, waitMinutes };
  }

  // Clear lockout if time has passed
  if (state.lockoutUntil && now >= state.lockoutUntil) {
    saveRateLimitState({ attempts: 0, lockoutUntil: null });
  }

  return { allowed: true };
};

export const recordFailedAttempt = () => {
  const state = getRateLimitState();
  state.attempts += 1;

  if (state.attempts >= MAX_ATTEMPTS) {
    state.lockoutUntil = Date.now() + LOCKOUT_MS;
  }

  saveRateLimitState(state);
};

export const clearRateLimit = () => {
  localStorage.removeItem('auth_rate_limit');
};

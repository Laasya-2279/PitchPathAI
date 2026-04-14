'use client';

import { useState } from 'react';
import { setSimMode } from '@/services/api';

/**
 * Animated pill toggle for simulation mode: Normal ↔ Match Day
 */
export default function SimModeToggle({ currentMode = 'normal', onModeChange }) {
  const [mode, setMode] = useState(currentMode);
  const [loading, setLoading] = useState(false);

  const toggleMode = async () => {
    const newMode = mode === 'normal' ? 'match_day' : 'normal';
    setLoading(true);
    try {
      const res = await setSimMode(newMode);
      if (res.success) {
        setMode(res.mode);
        onModeChange?.(res.mode);
      }
    } catch (e) {
      console.error('Mode toggle error:', e);
    } finally {
      setLoading(false);
    }
  };

  const isMatchDay = mode === 'match_day';

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium" style={{ color: !isMatchDay ? 'var(--foreground)' : 'var(--muted)' }}>
        Normal
      </span>

      <button
        onClick={toggleMode}
        disabled={loading}
        className="relative w-16 h-8 rounded-full transition-all duration-300 focus:outline-none"
        style={{
          background: isMatchDay
            ? 'linear-gradient(135deg, #ef4444, #f97316)'
            : 'var(--surface)',
          border: isMatchDay ? 'none' : '1px solid var(--border)',
          boxShadow: isMatchDay ? '0 0 16px rgba(239, 68, 68, 0.3)' : 'none',
        }}
      >
        <div
          className="absolute top-1 w-6 h-6 rounded-full shadow-md transition-all duration-300 flex items-center justify-center text-xs"
          style={{
            left: isMatchDay ? '34px' : '4px',
            background: 'white',
          }}
        >
          {loading ? (
            <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            isMatchDay ? '🔥' : '☀️'
          )}
        </div>
      </button>

      <span className="text-sm font-medium" style={{ color: isMatchDay ? '#ef4444' : 'var(--muted)' }}>
        Match Day
      </span>
    </div>
  );
}

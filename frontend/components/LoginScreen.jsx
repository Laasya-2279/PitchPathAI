'use client';

import { useAuth } from '@/hooks/useAuth';

/**
 * Premium glassmorphism login screen for hackathon WOW factor.
 */
export default function LoginScreen() {
  const { loginWithGoogle, loading } = useAuth();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0b0f1a] overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#4f46e5] rounded-full blur-[120px] opacity-20 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#10b981] rounded-full blur-[120px] opacity-10 animate-pulse" />

      <div className="glass-card p-10 max-w-md w-full text-center slide-up relative z-10 border border-white/10">
        <div className="mb-8">
          <div className="w-20 h-20 bg-[var(--accent)] rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 shadow-lg shadow-[var(--accent)]/20 animate-bounce">
            🏟️
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">PitchPath AI</h1>
          <p className="text-[var(--muted)] text-sm">Smart Stadium Digital Twin Dashboard</p>
        </div>

        <p className="text-white/80 text-sm mb-8 leading-relaxed">
          Welcome to the next generation of fan experience. Please sign in with your Google account to access real-time stadium navigation and analytics.
        </p>

        <button
          onClick={loginWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-black py-3.5 px-6 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          {loading ? 'Connecting...' : 'Sign in with Google'}
        </button>

        <div className="mt-8 pt-8 border-t border-white/5">
          <p className="text-[10px] text-white/30 uppercase tracking-[2px] font-semibold">
            Hackathon Edition • Optimized for 132k Seats
          </p>
        </div>
      </div>
    </div>
  );
}

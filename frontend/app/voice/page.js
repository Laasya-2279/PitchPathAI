'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import VoiceChat from '@/components/VoiceChat';

/**
 * Voice Assistant Page (v2)
 * Full-screen voice chat interface with navigation triggers.
 * Extended with match and stadium query example chips.
 */
export default function VoicePage() {
  const router = useRouter();
  const [navigatingRoute, setNavigatingRoute] = useState(null);

  const handleNavigate = (route) => {
    setNavigatingRoute(route);
    // Store route and redirect to AR page
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pitchpath_route', JSON.stringify(route));
    }
    setTimeout(() => {
      router.push('/ar');
    }, 1500);
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16 flex flex-col max-w-2xl mx-auto w-full h-screen overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-lg shadow-lg">
              🎤
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                <span className="gradient-text">Voice Assistant</span>
              </h1>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Navigate, check scores, or learn about the stadium
              </p>
            </div>
          </div>

          {/* Example queries — expanded with match + stadium */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              { text: '"Take me to Block M"', category: '🧭' },
              { text: '"Nearest washroom"', category: '📍' },
              { text: '"What\'s the score?"', category: '🏏' },
              { text: '"Who is batting?"', category: '🏏' },
              { text: '"Stadium history"', category: '🏟️' },
              { text: '"Is Gate 2 crowded?"', category: '📊' },
            ].map((q) => (
              <span key={q.text} className="text-xs px-2.5 py-1 rounded-full cursor-default" style={{
                background: 'var(--surface)',
                color: 'var(--muted)',
                border: '1px solid var(--border)',
              }}>
                {q.category} {q.text}
              </span>
            ))}
          </div>
        </div>

        {/* Navigating overlay */}
        {navigatingRoute && (
          <div className="absolute inset-0 z-50 flex items-center justify-center fade-in" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <div className="text-center">
              <div className="text-4xl mb-4 float">🧭</div>
              <p className="text-white text-lg font-semibold mb-2">Opening AR Navigation</p>
              <p className="text-gray-400 text-sm">Route: {navigatingRoute.pathNames?.join(' → ')}</p>
              <div className="mt-4 w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          </div>
        )}

        {/* Chat interface */}
        <VoiceChat onNavigate={handleNavigate} currentLocation="gate_1" />
      </main>
    </>
  );
}

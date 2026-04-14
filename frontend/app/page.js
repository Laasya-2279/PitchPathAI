'use client';

import Navbar from '@/components/Navbar';
import QuickActions from '@/components/QuickActions';
import CrowdPreview from '@/components/CrowdPreview';
import useCrowdData from '@/hooks/useCrowdData';

/**
 * Home Dashboard — Landing page with hero, quick actions, and crowd preview.
 */
export default function HomePage() {
  const { crowdData, isConnected } = useCrowdData();

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20 pb-8 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        {/* Hero Section */}
        <section className="mb-8 fade-in">
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10" style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.08))',
            border: '1px solid var(--glass-border)',
          }}>
            {/* Animated background orbs */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 float" style={{
              background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)',
              filter: 'blur(40px)',
            }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15" style={{
              background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)',
              filter: 'blur(40px)',
              animation: 'float 4s ease-in-out infinite reverse',
            }} />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{
                  background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: isConnected ? '#10b981' : '#f59e0b',
                }}>
                  {isConnected ? '● Live' : '○ Connecting'}
                </div>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Narendra Modi Stadium</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold mb-3 leading-tight">
                <span className="gradient-text">PitchPath</span>{' '}
                <span style={{ color: 'var(--foreground)' }}>AI</span>
              </h1>

              <p className="text-base sm:text-lg max-w-xl leading-relaxed mb-6" style={{ color: 'var(--muted)' }}>
                Smart stadium navigation powered by AR, voice AI, and real-time crowd intelligence. Find your way in the world&apos;s largest cricket stadium.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                {[
                  { value: '132K', label: 'Capacity', icon: '🏟️' },
                  { value: '18', label: 'Blocks', icon: '🧱' },
                  { value: '4', label: 'Gates', icon: '🚪' },
                  { value: crowdData?.summary ? `${Math.round(crowdData.summary.averageDensity * 100)}%` : '—', label: 'Avg Load', icon: '📊' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <span className="text-xl">{stat.icon}</span>
                    <div>
                      <div className="text-lg sm:text-xl font-bold" style={{ color: 'var(--foreground)' }}>{stat.value}</div>
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Quick Actions</h2>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Choose an action below</span>
          </div>
          <QuickActions />
        </section>

        {/* Crowd Preview + Info */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Live Crowd Intelligence</h2>
            <a href="/heatmap" className="text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all" style={{ color: 'var(--accent)' }}>
              Full View
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <CrowdPreview />
            </div>

            {/* Tips panel */}
            <div className="glass-card p-5 flex flex-col gap-4 fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>💡 Tips</h3>
              <div className="space-y-3">
                {[
                  { icon: '🎤', text: 'Say "Take me to Block M" to start AR navigation' },
                  { icon: '🗺️', text: 'Check the heatmap before heading to food courts' },
                  { icon: '⚡', text: 'Routes auto-avoid crowded zones for faster travel' },
                  { icon: '🔊', text: 'Voice assistant can answer crowd and queue questions' },
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ background: 'var(--surface)' }}>
                    <span className="text-base mt-0.5">{tip.icon}</span>
                    <span className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

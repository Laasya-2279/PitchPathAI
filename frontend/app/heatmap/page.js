'use client';

import Navbar from '@/components/Navbar';
import StadiumHeatmap from '@/components/StadiumHeatmap';

/**
 * Crowd Heatmap Page
 * Full interactive stadium visualization with live crowd data.
 */
export default function HeatmapPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20 pb-8 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="fade-in">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                  <span className="gradient-text">Crowd Heatmap</span>
                </h1>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Real-time crowd density across Narendra Modi Stadium
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium" style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
              }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Updates every 3s
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <StadiumHeatmap />
        </div>
      </main>
    </>
  );
}

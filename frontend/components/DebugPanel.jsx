'use client';

import { useState, useEffect, useRef } from 'react';
import { getDebugLogs, getSimStatus } from '@/services/api';

/**
 * Floating debug panel that shows intents, routes, crowd data, and logs.
 * Collapsible with a toggle button visible on all pages.
 */
export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('logs');
  const logsEndRef = useRef(null);

  // Fetch logs & status every 3 seconds while open
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const [logsRes, statusRes] = await Promise.all([
          getDebugLogs(20),
          getSimStatus(),
        ]);
        if (logsRes.success) setLogs(logsRes.logs || []);
        if (statusRes.success) setStatus(statusRes);
      } catch (e) {
        // silent fail
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <>
      {/* Toggle button */}
      <button
        id="debug-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-xl transition-all hover:scale-110"
        style={{
          background: isOpen
            ? 'linear-gradient(135deg, #ef4444, #f97316)'
            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: 'white',
          boxShadow: isOpen
            ? '0 4px 20px rgba(239, 68, 68, 0.4)'
            : '0 4px 20px rgba(99, 102, 241, 0.4)',
        }}
        title={isOpen ? 'Close Debug Panel' : 'Open Debug Panel'}
      >
        {isOpen ? '✕' : '🐛'}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-4 z-50 w-80 max-h-96 rounded-2xl overflow-hidden flex flex-col fade-in"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-sm">🐛</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Debug Panel</span>
            </div>
            {status && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                background: status.mode === 'match_day' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: status.mode === 'match_day' ? '#ef4444' : '#10b981',
              }}>
                {status.mode === 'match_day' ? '🔥 Match Day' : '✅ Normal'}
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
            {['logs', 'status', 'match'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2 text-xs font-medium capitalize transition-all"
                style={{
                  color: activeTab === tab ? 'var(--accent)' : 'var(--muted)',
                  borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3" style={{ maxHeight: '240px' }}>
            {activeTab === 'logs' && (
              <div className="space-y-1.5">
                {logs.length === 0 && (
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>No logs yet...</p>
                )}
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className="shrink-0 opacity-50" style={{ color: 'var(--muted)', fontFamily: 'var(--font-jetbrains, monospace)' }}>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span style={{ color: 'var(--foreground)', fontFamily: 'var(--font-jetbrains, monospace)' }}>
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}

            {activeTab === 'status' && status && (
              <div className="space-y-3">
                {[
                  { label: 'Mode', value: status.mode, icon: '⚙️' },
                  { label: 'Tick', value: `#${status.tick}`, icon: '🔄' },
                  { label: 'Avg Density', value: `${Math.round(status.averageDensity * 100)}%`, icon: '📊' },
                  { label: 'Hotspots', value: status.hotspots, icon: '🔥' },
                  { label: 'Match', value: status.matchStatus, icon: '🏏' },
                  { label: 'Score', value: status.matchScore, icon: '📋' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--surface)' }}>
                    <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                      {item.icon} {item.label}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-jetbrains, monospace)' }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'match' && status && (
              <div className="space-y-2">
                <div className="p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: 'var(--foreground)' }}>🏏 Live Score</div>
                  <div className="text-lg font-bold gradient-text">{status.matchScore}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Status: {status.matchStatus}</div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Match data updates every 10 seconds via Socket.io. Ask the voice assistant &quot;What&apos;s the score?&quot; for details.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

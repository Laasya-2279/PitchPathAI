'use client';

import useCrowdData from '@/hooks/useCrowdData';

/**
 * Compact crowd preview widget for the home dashboard.
 * Shows a mini oval stadium with color-coded blocks + summary stats.
 */
export default function CrowdPreview() {
  const { crowdData, loading, getDensityColor, isConnected } = useCrowdData();

  if (loading || !crowdData) {
    return (
      <div className="glass-card p-6 flex items-center justify-center" style={{ minHeight: 280 }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <span className="text-sm" style={{ color: 'var(--muted)' }}>Loading crowd data...</span>
        </div>
      </div>
    );
  }

  const seatingZones = crowdData.zones?.filter(z => z.type === 'seating') || [];
  const summary = crowdData.summary || {};

  return (
    <div className="glass-card p-6 fade-in" role="region" aria-labelledby="preview-heading">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 id="preview-heading" className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>Live Crowd Density</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            Narendra Modi Stadium · {isConnected ? 'Real-time' : 'Cached'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{
          background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
          color: isConnected ? '#10b981' : '#f59e0b',
        }} aria-live="polite">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: isConnected ? '#10b981' : '#f59e0b' }} aria-hidden="true" />
          {isConnected ? 'Connected' : 'Connecting'}
        </div>
      </div>

      {/* Mini Stadium Oval */}
      <div className="relative mx-auto" style={{ width: '100%', maxWidth: 320, aspectRatio: '1.15' }}>
        <svg viewBox="0 0 100 87" className="w-full h-full" role="img" aria-label="Visual representation of stadium crowd density">
          {/* Stadium outline */}
          <ellipse cx="50" cy="43.5" rx="46" ry="40" fill="none" stroke="var(--border)" strokeWidth="0.5" />
          {/* Field */}
          <ellipse cx="50" cy="43.5" rx="22" ry="16" fill="rgba(16, 185, 129, 0.1)" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="0.3" aria-hidden="true" />
          <text x="50" y="45" textAnchor="middle" fill="var(--muted)" fontSize="3.5" fontFamily="Inter" aria-hidden="true">PITCH</text>

          {/* Seating blocks around the oval */}
          {seatingZones.map((zone, i) => {
            const total = seatingZones.length;
            const angle = (2 * Math.PI * i) / total - Math.PI / 2;
            const rx = 35;
            const ry = 30;
            const cx = 50;
            const cy = 43.5;
            const x = cx + rx * Math.cos(angle);
            const y = cy + ry * Math.sin(angle);
            const color = getDensityColor(zone.density);
            const label = zone.name.replace('Block ', '');

            return (
              <g key={zone.id}>
                <title>{`${zone.name}: ${Math.round(zone.density * 100)}% crowded`}</title>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill={color}
                  opacity="0.8"
                  stroke={color}
                  strokeWidth="0.3"
                >
                  <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" repeatCount="indefinite" begin={`${i * 0.15}s`} />
                </circle>
                <text x={x} y={y + 1.2} textAnchor="middle" fill="white" fontSize="2.8" fontWeight="600" fontFamily="Inter" aria-hidden="true">
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mt-4" role="list">
        <div className="text-center p-2 rounded-xl" style={{ background: 'var(--surface)' }} role="listitem">
          <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
            {Math.round((summary.averageDensity || 0) * 100)}%
          </div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>Avg Density</div>
        </div>
        <div className="text-center p-2 rounded-xl" style={{ background: 'var(--surface)' }} role="listitem">
          <div className="text-lg font-bold" style={{ color: summary.hotspotCount > 2 ? '#ef4444' : 'var(--foreground)' }}>
            {summary.hotspotCount || 0}
          </div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>Hotspots</div>
        </div>
        <div className="text-center p-2 rounded-xl" style={{ background: 'var(--surface)' }} role="listitem">
          <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
            {((summary.totalCapacity || 0) / 1000).toFixed(0)}K
          </div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>Capacity</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4" aria-label="Crowd density legend">
        {[
          { label: 'Low', color: '#10b981' },
          { label: 'Moderate', color: '#f59e0b' },
          { label: 'High', color: '#f97316' },
          { label: 'Critical', color: '#ef4444' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} aria-hidden="true" />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

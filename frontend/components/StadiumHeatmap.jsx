'use client';

import { useState } from 'react';
import useCrowdData from '@/hooks/useCrowdData';

/**
 * Full interactive stadium heatmap with SVG layout.
 * Oval stadium with clickable zones, color-coded density, and detail panel.
 */
export default function StadiumHeatmap() {
  const { crowdData, loading, getDensityColor, getDensityStatus, isConnected } = useCrowdData();
  const [selectedZone, setSelectedZone] = useState(null);

  if (loading || !crowdData) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <span className="text-sm" style={{ color: 'var(--muted)' }}>Loading stadium data...</span>
        </div>
      </div>
    );
  }

  const zones = crowdData.zones || [];
  const seatingZones = zones.filter(z => z.type === 'seating');
  const gateZones = zones.filter(z => z.type === 'gate');
  const facilityZones = zones.filter(z => ['washroom', 'food', 'medical', 'vip'].includes(z.type));
  const summary = crowdData.summary || {};

  const facilityIcons = {
    washroom: '🚻',
    food: '🍔',
    medical: '🏥',
    vip: '⭐',
    gate: '🚪',
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Stadium SVG */}
      <div className="flex-1">
        <div className="relative mx-auto" style={{ width: '100%', maxWidth: 600 }}>
          <svg viewBox="0 0 200 174" className="w-full h-full">
            {/* Background oval */}
            <defs>
              <radialGradient id="fieldGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.15)" />
                <stop offset="100%" stopColor="rgba(16, 185, 129, 0.03)" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Stadium outline */}
            <ellipse cx="100" cy="87" rx="92" ry="80" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="4,2" />

            {/* Playing field */}
            <ellipse cx="100" cy="87" rx="40" ry="28" fill="url(#fieldGradient)" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="0.5" />
            <line x1="100" y1="59" x2="100" y2="115" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="0.3" />
            <circle cx="100" cy="87" r="8" fill="none" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="0.3" />
            <text x="100" y="89" textAnchor="middle" fill="var(--muted)" fontSize="6" fontFamily="Inter" fontWeight="500">
              🏏 PITCH
            </text>

            {/* Seating blocks */}
            {seatingZones.map((zone, i) => {
              const total = seatingZones.length;
              const angle = (2 * Math.PI * i) / total - Math.PI / 2;
              const rx = 70;
              const ry = 60;
              const x = 100 + rx * Math.cos(angle);
              const y = 87 + ry * Math.sin(angle);
              const color = getDensityColor(zone.density);
              const label = zone.name.replace('Block ', '');
              const isSelected = selectedZone?.id === zone.id;

              return (
                <g key={zone.id} onClick={() => setSelectedZone(zone)} style={{ cursor: 'pointer' }}>
                  {/* Glow effect for selected */}
                  {isSelected && (
                    <circle cx={x} cy={y} r="10" fill={color} opacity="0.2" filter="url(#glow)">
                      <animate attributeName="r" values="10;12;10" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    cx={x} cy={y} r="7.5"
                    fill={color}
                    opacity={isSelected ? 1 : 0.75}
                    stroke={isSelected ? 'white' : color}
                    strokeWidth={isSelected ? '1' : '0.3'}
                  >
                    <animate attributeName="opacity" values={`${isSelected ? 0.9 : 0.6};${isSelected ? 1 : 0.85};${isSelected ? 0.9 : 0.6}`} dur="3s" repeatCount="indefinite" begin={`${i * 0.1}s`} />
                  </circle>
                  <text x={x} y={y + 2} textAnchor="middle" fill="white" fontSize="5.5" fontWeight="700" fontFamily="Inter">
                    {label}
                  </text>
                  {/* Density percentage */}
                  <text x={x} y={y + 8} textAnchor="middle" fill={color} fontSize="3.5" fontFamily="Inter" fontWeight="500">
                    {Math.round(zone.density * 100)}%
                  </text>
                </g>
              );
            })}

            {/* Gates */}
            {gateZones.map((zone) => {
              const color = getDensityColor(zone.density);
              const isSelected = selectedZone?.id === zone.id;
              return (
                <g key={zone.id} onClick={() => setSelectedZone(zone)} style={{ cursor: 'pointer' }}>
                  <rect
                    x={zone.position.x * 2 - 8}
                    y={zone.position.y * 1.74 - 5}
                    width="16" height="10" rx="3"
                    fill={color} opacity={isSelected ? 1 : 0.7}
                    stroke={isSelected ? 'white' : 'none'} strokeWidth="0.5"
                  />
                  <text
                    x={zone.position.x * 2}
                    y={zone.position.y * 1.74 + 2}
                    textAnchor="middle" fill="white" fontSize="4" fontWeight="600" fontFamily="Inter"
                  >
                    {zone.name.replace(' (North)', '').replace(' (South)', '').replace(' (East)', '').replace(' (West)', '')}
                  </text>
                </g>
              );
            })}

            {/* Facilities */}
            {facilityZones.map((zone) => {
              const isSelected = selectedZone?.id === zone.id;
              return (
                <g key={zone.id} onClick={() => setSelectedZone(zone)} style={{ cursor: 'pointer' }}>
                  <circle
                    cx={zone.position.x * 2}
                    cy={zone.position.y * 1.74}
                    r="4"
                    fill="var(--surface)"
                    stroke={isSelected ? 'var(--accent)' : 'var(--border)'}
                    strokeWidth={isSelected ? '1' : '0.5'}
                  />
                  <text
                    x={zone.position.x * 2}
                    y={zone.position.y * 1.74 + 2}
                    textAnchor="middle" fontSize="5"
                  >
                    {facilityIcons[zone.type] || '📍'}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Side Panel */}
      <div className="lg:w-80 flex flex-col gap-4">
        {/* Summary Stats */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--foreground)' }}>Stadium Overview</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl" style={{ background: 'var(--surface)' }}>
              <div className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{Math.round((summary.averageDensity || 0) * 100)}%</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Average Load</div>
            </div>
            <div className="p-3 rounded-xl" style={{ background: 'var(--surface)' }}>
              <div className="text-xl font-bold" style={{ color: summary.hotspotCount > 3 ? '#ef4444' : '#f59e0b' }}>{summary.hotspotCount || 0}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Active Hotspots</div>
            </div>
          </div>
        </div>

        {/* Selected Zone Detail */}
        {selectedZone ? (
          <div className="glass-card p-4 slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{selectedZone.name}</h3>
              <button onClick={() => setSelectedZone(null)} className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--surface)', color: 'var(--muted)' }}>✕</button>
            </div>

            <div className="space-y-3">
              {/* Density Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--muted)' }}>Crowd Density</span>
                  <span className="font-semibold" style={{ color: getDensityColor(selectedZone.density) }}>
                    {Math.round(selectedZone.density * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${selectedZone.density * 100}%`,
                      background: getDensityColor(selectedZone.density),
                    }}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: getDensityColor(selectedZone.density) }} />
                <span className="text-sm font-medium capitalize" style={{ color: 'var(--foreground)' }}>
                  {getDensityStatus(selectedZone.density).replace('_', ' ')}
                </span>
              </div>

              {/* Queue time */}
              {selectedZone.queueTime && (
                <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'var(--surface)' }}>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>Est. Queue Time</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{selectedZone.queueTime} min</span>
                </div>
              )}

              {/* Zone type */}
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                <span>{facilityIcons[selectedZone.type] || '📍'}</span>
                <span className="capitalize">{selectedZone.type}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-4 text-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Click a zone on the map to see details</p>
          </div>
        )}

        {/* Hotspots List */}
        {summary.hotspots?.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="font-semibold text-sm mb-3" style={{ color: '#ef4444' }}>⚠ Active Hotspots</h3>
            <div className="space-y-2">
              {summary.hotspots.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                  <span className="text-sm" style={{ color: 'var(--foreground)' }}>{h.name}</span>
                  <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>{Math.round(h.density * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="glass-card p-4">
          <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--foreground)' }}>Legend</h3>
          <div className="space-y-1.5">
            {[
              { label: 'Low (< 30%)', color: '#10b981' },
              { label: 'Moderate (30-50%)', color: '#f59e0b' },
              { label: 'High (50-70%)', color: '#f97316' },
              { label: 'Critical (> 70%)', color: '#ef4444' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                <span className="text-xs" style={{ color: 'var(--muted)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

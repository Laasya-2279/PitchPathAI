'use client';

/**
 * Route display overlay showing step-by-step navigation instructions.
 * Used in the AR view and can be embedded anywhere.
 */
export default function RouteDisplay({ route, onClose, compact = false }) {
  if (!route) return null;

  const getDensityColor = (density) => {
    if (!density || density < 0.3) return '#10b981';
    if (density < 0.5) return '#f59e0b';
    if (density < 0.7) return '#f97316';
    return '#ef4444';
  };

  const getDirectionIcon = (direction) => {
    switch (direction) {
      case 'start': return '📍';
      case 'arrive': return '🏁';
      case 'to the right': return '➡️';
      case 'to the left': return '⬅️';
      case 'ahead': return '⬆️';
      default: return '➡️';
    }
  };

  return (
    <div className={`glass-card overflow-hidden slide-up ${compact ? 'p-3' : 'p-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            🧭
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Navigation Route</h3>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {route.estimatedTime} min · {route.distance} units
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
            style={{ background: 'var(--surface)', color: 'var(--muted)' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Warnings */}
      {route.warnings?.filter(w => w.density > 0.7).length > 0 && (
        <div className="mb-3 p-2.5 rounded-lg text-xs" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
          ⚠️ {route.warnings.filter(w => w.density > 0.7).map(w => w.message).join(' ')}
        </div>
      )}

      {/* Steps */}
      <div className={`space-y-1 ${compact ? 'max-h-40' : 'max-h-60'} overflow-y-auto`}>
        {route.steps?.map((step, i) => (
          <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg transition-colors" style={{ background: i === 0 || i === route.steps.length - 1 ? 'var(--surface)' : 'transparent' }}>
            {/* Step indicator */}
            <div className="flex flex-col items-center" style={{ minWidth: 24 }}>
              <span className="text-sm">{getDirectionIcon(step.direction)}</span>
              {i < route.steps.length - 1 && (
                <div className="w-0.5 h-4 mt-1 rounded-full" style={{ background: 'var(--border)' }} />
              )}
            </div>

            {/* Instruction */}
            <div className="flex-1">
              <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{step.instruction}</p>
              {step.density > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: getDensityColor(step.density) }} />
                  <span className="text-xs" style={{ color: getDensityColor(step.density) }}>
                    {Math.round(step.density * 100)}% crowd
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Path summary */}
      {route.pathNames && (
        <div className="mt-3 pt-3 flex flex-wrap gap-1" style={{ borderTop: '1px solid var(--border)' }}>
          {route.pathNames.map((name, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface)', color: 'var(--muted)' }}>
              {name.replace('Block ', '').replace('Gate ', 'G')}
              {i < route.pathNames.length - 1 && <span className="ml-1">→</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

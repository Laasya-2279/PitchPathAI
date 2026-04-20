'use client';

import Link from 'next/link';

/**
 * Quick action cards for the home dashboard.
 * Animated cards with gradient borders and hover effects.
 */
export default function QuickActions() {
  const actions = [
    {
      id: 'navigate',
      title: 'AR Navigation',
      description: 'Camera-based directional guidance to your seat',
      icon: '🧭',
      href: '/ar',
      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      glow: 'rgba(99, 102, 241, 0.3)',
    },
    {
      id: 'voice',
      title: 'Voice Assistant',
      description: 'Say "Take me to Block M" and follow the path',
      icon: '🎤',
      href: '/voice',
      gradient: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
      glow: 'rgba(139, 92, 246, 0.3)',
    },
    {
      id: 'heatmap',
      title: 'Crowd Heatmap',
      description: 'Live crowd density across all zones',
      icon: '🔥',
      href: '/heatmap',
      gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
      glow: 'rgba(245, 158, 11, 0.3)',
    },
    {
      id: 'facilities',
      title: 'Find Facilities',
      description: 'Nearest washroom, food court, or medical bay',
      icon: '🏥',
      href: '/voice',
      gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
      glow: 'rgba(16, 185, 129, 0.3)',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <Link
          key={action.id}
          href={action.href}
          id={`quick-action-${action.id}`}
          className="glass-card p-5 flex flex-col gap-3 group cursor-pointer fade-in"
          style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
          aria-labelledby={`title-${action.id}`}
          aria-describedby={`desc-${action.id}`}
        >
          {/* Icon with gradient background */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300"
            style={{ background: action.gradient }}
            aria-hidden="true"
          >
            {action.icon}
          </div>

          {/* Text */}
          <div>
            <h3 id={`title-${action.id}`} className="font-semibold text-base mb-1" style={{ color: 'var(--foreground)' }}>
              {action.title}
            </h3>
            <p id={`desc-${action.id}`} className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              {action.description}
            </p>
          </div>

          {/* Arrow indicator */}
          <div className="flex items-center gap-1 mt-auto text-xs font-medium transition-all duration-200 group-hover:gap-2" style={{ color: 'var(--accent)' }} aria-hidden="true">
            <span>Open</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      ))}
    </div>
  );
}

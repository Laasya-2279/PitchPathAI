'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

/**
 * Navigation bar with glassmorphism, active state, and theme toggle.
 */
export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard', icon: '🏠' },
    { href: '/ar', label: 'AR Nav', icon: '🧭' },
    { href: '/voice', label: 'Voice AI', icon: '🎤' },
    { href: '/heatmap', label: 'Heatmap', icon: '🔥' },
    { href: '/simulate', label: 'Simulate', icon: '🧪' },
    { href: '/demo', label: 'Demo', icon: '🎬' },
  ];

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 fade-in" style={{ borderBottom: '1px solid var(--glass-border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform">
              PP
            </div>
            <span className="font-bold text-lg hidden sm:block">
              <span className="gradient-text">PitchPath</span>{' '}
              <span style={{ color: 'var(--muted)' }}>AI</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: isActive ? 'var(--accent-glow)' : 'transparent',
                    color: isActive ? 'var(--accent-light)' : 'var(--muted)',
                  }}
                >
                  <span className="text-base">{link.icon}</span>
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Theme Toggle + Status */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}

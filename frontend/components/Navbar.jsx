'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

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

  const { logout, user } = useAuth();

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 fade-in" style={{ borderBottom: '1px solid var(--glass-border)' }} aria-label="Main Navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group" aria-label="PitchPath AI Home">
            <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform">
              PP
            </div>
            <span className="font-bold text-lg hidden sm:block">
              <span className="gradient-text">PitchPath</span>{' '}
              <span style={{ color: 'var(--muted)' }}>AI</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1" role="menubar">
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
                  role="menuitem"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="text-base" aria-hidden="true">{link.icon}</span>
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Profile + Theme */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-white/10">
                <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full border border-white/20" />
                <button 
                  onClick={logout}
                  className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted)] hover:text-white transition-colors"
                  aria-label="Logout"
                >
                  Logout
                </button>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}

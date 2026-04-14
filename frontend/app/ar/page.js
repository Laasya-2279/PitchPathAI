'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ARView from '@/components/ARView';
import RouteDisplay from '@/components/RouteDisplay';
import { getRoute } from '@/services/api';

/**
 * AR Navigation Page
 * Full-screen AR view with route overlay.
 * Users can select origin/destination or arrive from voice assistant.
 */
export default function ARPage() {
  const router = useRouter();
  const [route, setRoute] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showSetup, setShowSetup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('gate_1');
  const [to, setTo] = useState('block_M');

  const zones = [
    { id: 'gate_1', label: 'Gate 1 (North)' },
    { id: 'gate_2', label: 'Gate 2 (East)' },
    { id: 'gate_3', label: 'Gate 3 (South)' },
    { id: 'gate_4', label: 'Gate 4 (West)' },
    ...'ABCDEFGHIJKLMNOPQR'.split('').map(l => ({ id: `block_${l}`, label: `Block ${l}` })),
    { id: 'washroom_1', label: 'Washroom N1' },
    { id: 'washroom_2', label: 'Washroom E1' },
    { id: 'washroom_3', label: 'Washroom S1' },
    { id: 'washroom_4', label: 'Washroom W1' },
    { id: 'food_1', label: 'Food Court North' },
    { id: 'food_2', label: 'Food Court East' },
    { id: 'food_3', label: 'Food Court South' },
    { id: 'food_4', label: 'Food Court West' },
    { id: 'medical_1', label: 'Medical Bay 1' },
    { id: 'medical_2', label: 'Medical Bay 2' },
    { id: 'vip_lounge', label: 'VIP Lounge' },
  ];

  const startNavigation = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getRoute(from, to);
      if (result.success && result.route) {
        setRoute(result.route);
        setCurrentStep(0);
        setShowSetup(false);
      }
    } catch (err) {
      console.error('Route error:', err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const nextStep = () => {
    if (route && currentStep < route.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Setup screen
  if (showSetup) {
    return (
      <>
        <Navbar />
        <main className="flex-1 pt-20 pb-8 px-4 sm:px-6 max-w-2xl mx-auto w-full">
          <div className="fade-in">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                <span className="gradient-text">AR Navigation</span>
              </h1>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Set your origin and destination to start camera-guided navigation
              </p>
            </div>

            <div className="glass-card p-6 space-y-5">
              {/* From */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  📍 Your Location
                </label>
                <select
                  id="from-select"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: 'var(--surface)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.label}</option>
                  ))}
                </select>
              </div>

              {/* To */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  🏁 Destination
                </label>
                <select
                  id="to-select"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{
                    background: 'var(--surface)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.label}</option>
                  ))}
                </select>
              </div>

              {/* Start button */}
              <button
                id="start-navigation"
                onClick={startNavigation}
                disabled={loading || from === to}
                className="w-full py-4 rounded-xl text-white font-semibold text-base shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Calculating Route...
                  </span>
                ) : (
                  '🧭 Start AR Navigation'
                )}
              </button>

              {from === to && (
                <p className="text-xs text-center" style={{ color: '#f59e0b' }}>
                  Please select different origin and destination
                </p>
              )}
            </div>

            {/* Or use voice */}
            <div className="text-center mt-6">
              <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>or use voice navigation</p>
              <button
                onClick={() => router.push('/voice')}
                className="px-6 py-3 rounded-xl text-sm font-medium transition-all hover:scale-105"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--accent)',
                  border: '1px solid var(--border)',
                }}
              >
                🎤 Open Voice Assistant
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  // AR View with route
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <ARView
        route={route}
        currentStep={currentStep}
        onClose={() => setShowSetup(true)}
      />

      {/* Route panel at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
        <RouteDisplay route={route} compact onClose={() => setShowSetup(true)} />

        {/* Step navigation buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
            style={{ background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
          >
            ← Previous
          </button>
          <button
            onClick={nextStep}
            disabled={!route || currentStep >= route.steps.length - 1}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            Next Step →
          </button>
        </div>
      </div>
    </div>
  );
}

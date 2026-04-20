'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { getRoute, processVoice, setSimMode, getSimStatus } from '@/services/api';

/**
 * Demo Mode — Guided auto-play presentation for hackathon.
 * 5-step scripted flow with play/pause/reset controls.
 */

const DEMO_STEPS = [
  {
    id: 'intro',
    title: 'Welcome to PitchPath AI',
    subtitle: 'Smart Navigation for 132,000 Spectators',
    description: 'PitchPath AI transforms the Narendra Modi Stadium — the world\'s largest cricket stadium — into an intelligent, navigable digital twin with AR guidance, voice AI, and real-time crowd analytics.',
    icon: '🏟️',
    action: null,
    duration: 6000,
  },
  {
    id: 'voice',
    title: 'Voice AI Navigation',
    subtitle: 'User says: "Take me to Block M"',
    description: 'The voice assistant parses natural language, classifies intent as "navigation", identifies Block M as the destination, and triggers the routing engine.',
    icon: '🎤',
    action: 'voice_query',
    duration: 5000,
  },
  {
    id: 'routing',
    title: 'Crowd-Aware Routing',
    subtitle: 'Dijkstra\'s algorithm with crowd penalties',
    description: 'The routing engine calculates the optimal path from Gate 1 to Block M, applying crowd density penalties: weight = distance × (1 + density²). Crowded zones are automatically bypassed.',
    icon: '🧭',
    action: 'calculate_route',
    duration: 5000,
  },
  {
    id: 'congestion',
    title: 'Live Congestion Event',
    subtitle: 'Crowd surge detected on the route',
    description: 'A sudden surge hits Block A and Block B (90%+ density). PitchPath AI detects this in real-time via Socket.io updates and triggers an automatic reroute — finding an alternative path that avoids the congestion.',
    icon: '🚧',
    action: 'trigger_congestion',
    duration: 6000,
  },
  {
    id: 'reroute',
    title: 'Intelligent Rerouting',
    subtitle: 'New path avoids congested zones',
    description: 'The recalculated route avoids blocks with high density, ensuring the spectator reaches Block M safely and quickly. The AR arrows update in real-time to guide the new path.',
    icon: '⚡',
    action: 'reroute',
    duration: 5000,
  },
  {
    id: 'decision',
    title: 'Predictive Intelligence',
    subtitle: 'User asks: "Where is the best food right now?"',
    description: 'The Decision Engine predicts the optimal food stall by weighing walking distance against live queue times and crowd density. Delivering high-quality, grounded AI instructions with zero hallucination.',
    icon: '🧠',
    action: 'decision_query',
    duration: 8000,
  },
];

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(-1); // -1 = not started
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepData, setStepData] = useState({});
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const autoRef = useRef(null);

  const isStarted = currentStep >= 0;
  const isFinished = currentStep >= DEMO_STEPS.length;
  const activeStep = DEMO_STEPS[currentStep] || null;

  // Elapsed timer
  useEffect(() => {
    if (isPlaying && !isFinished) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, isFinished]);

  // Execute step actions
  const executeStep = useCallback(async (step) => {
    if (!step?.action) return;

    try {
      switch (step.action) {
        case 'voice_query': {
          const result = await processVoice('Take me to Block M', 'gate_1');
          setStepData(prev => ({ ...prev, voice: result }));
          break;
        }
        case 'calculate_route': {
          const route = await getRoute('gate_1', 'block_M');
          setStepData(prev => ({ ...prev, route: route.route }));
          break;
        }
        case 'trigger_congestion': {
          await setSimMode('match_day');
          const status = await getSimStatus();
          setStepData(prev => ({ ...prev, congestion: status }));
          break;
        }
        case 'reroute': {
          const reroute = await getRoute('gate_1', 'block_M');
          setStepData(prev => ({ ...prev, reroute: reroute.route }));
          await setSimMode('normal');
          break;
        }
        case 'decision_query': {
          const result = await processVoice('Which food stall is best?', 'gate_1');
          setStepData(prev => ({ ...prev, decision: result }));
          break;
        }
      }
    } catch (e) {
      console.error('Demo step error:', e);
    }
  }, []);

  // Auto-advance when playing
  useEffect(() => {
    if (!isPlaying || isFinished || !activeStep) return;

    executeStep(activeStep);

    autoRef.current = setTimeout(() => {
      setCurrentStep(s => s + 1);
    }, activeStep.duration);

    return () => clearTimeout(autoRef.current);
  }, [currentStep, isPlaying, isFinished, activeStep, executeStep]);

  const start = () => {
    setCurrentStep(0);
    setIsPlaying(true);
    setElapsed(0);
    setStepData({});
  };

  const togglePause = () => setIsPlaying(!isPlaying);

  const reset = () => {
    setCurrentStep(-1);
    setIsPlaying(false);
    setElapsed(0);
    setStepData({});
    clearTimeout(autoRef.current);
    setSimMode('normal').catch(() => {});
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20 pb-8 px-4 sm:px-6 max-w-4xl mx-auto w-full">
        <div className="fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              <span className="gradient-text">Demo Mode</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Guided presentation showcasing PitchPath AI capabilities
            </p>
          </div>

          {/* Not started — Intro card */}
          {!isStarted && (
            <div className="text-center py-16 fade-in">
              <div className="text-6xl mb-6 float">🏟️</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                PitchPath AI — Live Demo
              </h2>
              <p className="text-lg mb-1" style={{ color: 'var(--muted)' }}>
                132,000 Capacity Stadium Simulation
              </p>
              <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: 'var(--muted)' }}>
                Watch the system navigate, detect congestion, and reroute in real-time — all in under 30 seconds.
              </p>
              <button
                onClick={start}
                className="px-10 py-4 rounded-2xl text-white text-lg font-semibold shadow-xl hover:scale-105 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
                }}
              >
                ▶ Start Demo
              </button>
            </div>
          )}

          {/* Active demo */}
          {isStarted && !isFinished && activeStep && (
            <>
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                    Step {currentStep + 1} of {DEMO_STEPS.length}
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                    {formatTime(elapsed)}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--surface)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${((currentStep + 1) / DEMO_STEPS.length) * 100}%`,
                      background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)',
                    }}
                  />
                </div>

                {/* Step dots */}
                <div className="flex justify-between mt-3">
                  {DEMO_STEPS.map((step, i) => (
                    <div
                      key={step.id}
                      className="flex flex-col items-center gap-1"
                      style={{ opacity: i <= currentStep ? 1 : 0.3 }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all"
                        style={{
                          background: i === currentStep ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : i < currentStep ? 'rgba(16, 185, 129, 0.2)' : 'var(--surface)',
                          color: i === currentStep ? 'white' : i < currentStep ? '#10b981' : 'var(--muted)',
                        }}
                      >
                        {i < currentStep ? '✓' : step.icon}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main content card */}
              <div className="glass-card p-8 text-center fade-in" key={activeStep.id}>
                <div className="text-5xl mb-4">{activeStep.icon}</div>
                <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
                  {activeStep.title}
                </h2>
                <p className="text-sm font-medium mb-4" style={{ color: 'var(--accent)' }}>
                  {activeStep.subtitle}
                </p>
                <p className="text-sm leading-relaxed max-w-xl mx-auto" style={{ color: 'var(--muted)' }}>
                  {activeStep.description}
                </p>

                {/* Live data from step actions */}
                {activeStep.id === 'routing' && stepData.route && (
                  <div className="mt-4 p-4 rounded-xl text-left" style={{ background: 'var(--surface)' }}>
                    <div className="text-xs font-semibold mb-2" style={{ color: 'var(--accent)' }}>🧭 Calculated Route</div>
                    <div className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                      {stepData.route.pathNames?.join(' → ')}
                    </div>
                    <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                      <span>⏱ {stepData.route.estimatedTime} min</span>
                      <span>📏 {stepData.route.distance} units</span>
                      <span>⚠ {stepData.route.warnings?.length || 0} warnings</span>
                    </div>
                  </div>
                )}

                {activeStep.id === 'reroute' && stepData.reroute && (
                  <div className="mt-4 p-4 rounded-xl text-left" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                    <div className="text-xs font-semibold mb-2" style={{ color: '#10b981' }}>⚡ Re-Routed Path</div>
                    <div className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                      {stepData.reroute.pathNames?.join(' → ')}
                    </div>
                    <div className="flex gap-4 mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                      <span>⏱ {stepData.reroute.estimatedTime} min</span>
                      <span>📏 {stepData.reroute.distance} units</span>
                    </div>
                  </div>
                )}

                {activeStep.id === 'congestion' && stepData.congestion && (
                  <div className="mt-4 p-4 rounded-xl text-left" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                    <div className="text-xs font-semibold mb-2" style={{ color: '#ef4444' }}>🔥 Match Day Mode Active</div>
                    <div className="flex gap-4 text-xs" style={{ color: 'var(--muted)' }}>
                      <span>Avg Density: {Math.round(stepData.congestion.averageDensity * 100)}%</span>
                      <span>Hotspots: {stepData.congestion.hotspots}</span>
                    </div>
                  </div>
                )}
                {activeStep.id === 'decision' && stepData.decision && (
                  <div className="mt-4 p-4 rounded-xl text-left" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
                    <div className="text-xs font-semibold mb-2" style={{ color: '#6366f1' }}>🧠 AI Recommendation</div>
                    <div className="text-sm font-medium mb-3" style={{ color: 'var(--foreground)' }}>
                      {stepData.decision.response}
                    </div>
                    {stepData.decision.decisionOptions && (
                      <div className="grid grid-cols-2 gap-2">
                        {stepData.decision.decisionOptions.slice(0, 2).map((opt, idx) => (
                          <div key={idx} className="p-2 rounded" style={{ background: 'var(--surface)' }}>
                            <div className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{opt.facility.name} {idx === 0 && '🌟'}</div>
                            <div className="text-[10px]" style={{ color: 'var(--muted)' }}>Score: {opt.score.toFixed(2)}</div>
                            <div className="text-[10px]" style={{ color: 'var(--muted)' }}>Queue: {opt.metrics.queue}m </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <button onClick={reset} className="px-6 py-3 rounded-xl text-sm font-medium" style={{
                  background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)',
                }}>
                  ⏹ Reset
                </button>
                <button onClick={togglePause} className="px-8 py-3 rounded-xl text-white text-sm font-semibold shadow-lg" style={{
                  background: isPlaying ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                }}>
                  {isPlaying ? '⏸ Pause' : '▶ Resume'}
                </button>
              </div>
            </>
          )}

          {/* Finished */}
          {isFinished && (
            <div className="text-center py-16 fade-in">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                Demo Complete!
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
                PitchPath AI demonstrated AR navigation, voice AI, crowd detection, and intelligent rerouting in {formatTime(elapsed)}.
              </p>

              {/* Summary metrics */}
              <div className="flex flex-wrap justify-center gap-6 mb-8">
                {[
                  { value: '132K', label: 'Capacity', icon: '🏟️' },
                  { value: stepData.route?.estimatedTime || '—', label: 'Original ETA', icon: '⏱' },
                  { value: stepData.reroute?.estimatedTime || '—', label: 'Rerouted ETA', icon: '⚡' },
                  { value: formatTime(elapsed), label: 'Demo Time', icon: '🎬' },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <div className="text-2xl">{m.icon}</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{m.value}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{m.label}</div>
                  </div>
                ))}
              </div>

              <button onClick={reset} className="px-10 py-4 rounded-2xl text-white text-lg font-semibold shadow-xl hover:scale-105 transition-all" style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
              }}>
                🔄 Run Again
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

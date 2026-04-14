'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import SimModeToggle from '@/components/SimModeToggle';
import { getScenarios, runScenario, injectDensity, clearInjections, getSimStatus } from '@/services/api';

/**
 * Simulation Control Center
 * Mode toggle, scenario runner, and density injection panel.
 */
export default function SimulatePage() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [scenarioResult, setScenarioResult] = useState(null);
  const [runningScenario, setRunningScenario] = useState(false);
  const [simStatus, setSimStatus] = useState(null);
  const [injectZone, setInjectZone] = useState('block_A');
  const [injectValue, setInjectValue] = useState(0.8);
  const [injectMsg, setInjectMsg] = useState('');

  // Fetch scenarios on mount
  useEffect(() => {
    getScenarios().then(res => {
      if (res.success) setScenarios(res.scenarios);
    }).catch(() => {});

    // Poll status
    const interval = setInterval(() => {
      getSimStatus().then(res => {
        if (res.success) setSimStatus(res);
      }).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRunScenario = async (id) => {
    setRunningScenario(true);
    setSelectedScenario(id);
    setScenarioResult(null);
    try {
      const res = await runScenario(id);
      if (res.success) {
        setScenarioResult(res);
      }
    } catch (e) {
      setScenarioResult({ result: 'ERROR', summary: e.message });
    } finally {
      setRunningScenario(false);
    }
  };

  const handleInject = async () => {
    try {
      const res = await injectDensity(injectZone, injectValue);
      if (res.success) setInjectMsg(res.message);
      setTimeout(() => setInjectMsg(''), 3000);
    } catch (e) {
      setInjectMsg('Failed to inject');
    }
  };

  const handleClear = async () => {
    try {
      await clearInjections();
      setInjectMsg('All injections cleared');
      setTimeout(() => setInjectMsg(''), 3000);
    } catch (e) {
      setInjectMsg('Failed to clear');
    }
  };

  const zones = [
    ...'ABCDEFGHIJKLMNOPQR'.split('').map(l => ({ id: `block_${l}`, label: `Block ${l}` })),
    { id: 'gate_1', label: 'Gate 1' }, { id: 'gate_2', label: 'Gate 2' },
    { id: 'gate_3', label: 'Gate 3' }, { id: 'gate_4', label: 'Gate 4' },
  ];

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-20 pb-8 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="fade-in">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                <span className="gradient-text">Simulation Lab</span>
              </h1>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Test scenarios, toggle modes, and inject crowd densities
              </p>
            </div>
            {simStatus && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium" style={{
                background: simStatus.mode === 'match_day' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: simStatus.mode === 'match_day' ? '#ef4444' : '#10b981',
              }}>
                Tick #{simStatus.tick} · {Math.round(simStatus.averageDensity * 100)}% avg
              </div>
            )}
          </div>

          {/* Mode Toggle */}
          <section className="glass-card p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>⚙️ Simulation Mode</h2>
            <SimModeToggle currentMode={simStatus?.mode || 'normal'} onModeChange={() => {}} />
            <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
              Match Day mode increases base crowd density, adds frequent surges at gates, and increases queue times by 1.5×.
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scenario Runner */}
            <section className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>🧪 Scenario Tests</h2>
              <div className="space-y-3">
                {scenarios.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleRunScenario(s.id)}
                    disabled={runningScenario}
                    className="w-full text-left p-4 rounded-xl transition-all hover:scale-[1.01] disabled:opacity-50"
                    style={{
                      background: selectedScenario === s.id ? 'var(--accent-glow)' : 'var(--surface)',
                      border: selectedScenario === s.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{s.icon}</span>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{s.name}</div>
                          <div className="text-xs" style={{ color: 'var(--muted)' }}>{s.description}</div>
                        </div>
                      </div>
                      {runningScenario && selectedScenario === s.id ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: 'var(--accent)' }} />
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--accent)' }}>Run →</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Density Injection */}
            <section className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>💉 Density Injection</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Zone</label>
                  <select
                    value={injectZone}
                    onChange={(e) => setInjectZone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>
                    Density: {Math.round(injectValue * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={injectValue}
                    onChange={(e) => setInjectValue(parseFloat(e.target.value))}
                    className="w-full"
                    style={{ accentColor: '#6366f1' }}
                  />
                  <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--muted)' }}>
                    <span>🟢 Low</span>
                    <span>🟡 Mod</span>
                    <span>🟠 High</span>
                    <span>🔴 Critical</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={handleInject} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                    Inject
                  </button>
                  <button onClick={handleClear} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
                    Clear All
                  </button>
                </div>

                {injectMsg && (
                  <div className="text-xs text-center py-2 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    ✅ {injectMsg}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Scenario Result */}
          {scenarioResult && (
            <section className="glass-card p-6 mt-6 fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  📊 Result: {scenarioResult.name}
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  scenarioResult.result === 'PASS' ? '' : scenarioResult.result === 'FAIL' ? '' : ''
                }`} style={{
                  background: scenarioResult.result === 'PASS' ? 'rgba(16, 185, 129, 0.15)' : scenarioResult.result === 'FAIL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: scenarioResult.result === 'PASS' ? '#10b981' : scenarioResult.result === 'FAIL' ? '#ef4444' : '#f59e0b',
                }}>
                  {scenarioResult.result}
                </span>
              </div>

              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>{scenarioResult.summary}</p>

              {/* Steps */}
              {scenarioResult.steps && (
                <div className="space-y-2">
                  {scenarioResult.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{
                        background: step.success === false ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                        color: step.success === false ? '#ef4444' : 'var(--accent)',
                      }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{step.description}</div>
                        {step.path && (
                          <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                            Path: {step.path.join(' → ')}
                          </div>
                        )}
                        {step.time > 0 && (
                          <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                            ETA: {step.time} min · Distance: {step.distance} units
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Metrics */}
              {scenarioResult.metrics && (
                <div className="flex flex-wrap gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  {Object.entries(scenarioResult.metrics).map(([key, val]) => (
                    <div key={key} className="text-center">
                      <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>{typeof val === 'boolean' ? (val ? '✅' : '❌') : val}</div>
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}

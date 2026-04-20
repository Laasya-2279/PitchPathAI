'use client';

import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import useVoice from '@/hooks/useVoice';
import { processVoice } from '@/services/api';

/**
 * Voice chat interface with mic button, chat bubbles, intent badges, and waveform.
 * Sends transcripts to the backend for intent parsing.
 * v2: Shows detected intent type badge on AI messages.
 */

const INTENT_BADGES = {
  navigate: { label: 'Navigation', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' },
  query: { label: 'Crowd Query', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  live_match_info: { label: 'Match Info', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  live_match_query: { label: 'Match Info', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  stadium_info: { label: 'Stadium Info', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  decision_query: { label: 'Decision Engine', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.15)' },
  evaluate_decision: { label: 'Decision Engine', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.15)' },
  greeting: { label: 'Greeting', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)' },
  help: { label: 'Help', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)' },
  unknown: { label: 'Unknown', color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)' },
};

export default function VoiceChat({ onNavigate, currentLocation = 'gate_1' }) {
  const { isListening, isSpeaking, isSupported, transcript, startListening, stopListening, speak } = useVoice();
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "Hello! I'm PitchPath AI, your stadium navigation assistant. Tap the mic and tell me where you'd like to go, or ask about crowd levels!",
      timestamp: Date.now(),
      intent: 'greeting',
    },
  ]);
  const [processing, setProcessing] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle mic tap
  const handleMicPress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(handleTranscript);
    }
  };

  // Process final transcript
  const handleTranscript = async (finalText) => {
    if (!finalText.trim()) return;

    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      text: finalText,
      timestamp: Date.now(),
    }]);

    setProcessing(true);

    try {
      const result = await processVoice(finalText, currentLocation);

      // Add AI response with intent badge
      setMessages(prev => [...prev, {
        role: 'ai',
        text: result.response,
        timestamp: Date.now(),
        route: result.route || null,
        intent: result.intent,
        data: result.data || null,
      }]);

      // Speak the response
      await speak(result.response);

      // Dispatch event for Debug Panel synchronization
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('voice-intent-detected', { 
          detail: { 
            intent: result.intent, 
            source: result.source || 'Local / Fallback Engine',
            timestamp: Date.now()
          } 
        });
        window.dispatchEvent(event);
      }

      // If navigation intent with route, trigger navigation
      if (result.action === 'navigate' && result.route && onNavigate) {
        setTimeout(() => {
          onNavigate(result.route);
        }, 2000);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: "Sorry, I'm having trouble connecting. Please try again.",
        timestamp: Date.now(),
        intent: 'unknown',
      }]);
    } finally {
      setProcessing(false);
    }
  };

  // Handle text input fallback
  const [textInput, setTextInput] = useState('');
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim()) {
      handleTranscript(textInput.trim());
      setTextInput('');
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0" role="log" aria-label="Voice chat conversation">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" aria-live="polite">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} fade-in`}
          >
            <div
              className="max-w-xs sm:max-w-md rounded-2xl px-4 py-3"
              style={{
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'var(--surface)',
                color: msg.role === 'user' ? 'white' : 'var(--foreground)',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '16px',
              }}
              aria-label={`${msg.role === 'user' ? 'You' : 'PitchPath AI'} said: ${msg.text}`}
            >
              {msg.role === 'ai' && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold" aria-hidden="true">P</div>
                  <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>PitchPath AI</span>
                  {/* Intent badge (NEW) */}
                  {msg.intent && INTENT_BADGES[msg.intent] && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-medium ml-auto"
                      style={{
                        background: INTENT_BADGES[msg.intent].bg,
                        color: INTENT_BADGES[msg.intent].color,
                        fontSize: '10px',
                      }}
                      aria-label={`Intent: ${INTENT_BADGES[msg.intent].label}`}
                    >
                      {INTENT_BADGES[msg.intent].label}
                    </span>
                  )}
                </div>
              )}
              <p className="text-sm leading-relaxed">{msg.text}</p>

              {/* Route info if present */}
              {msg.route && (
                <div className="mt-2 p-2 rounded-lg text-xs" style={{
                  background: msg.role === 'user' ? 'rgba(255,255,255,0.15)' : 'var(--surface-hover)',
                }} aria-label="Navigation route detail">
                  <div className="flex items-center gap-1 mb-1 font-semibold">
                    <span aria-hidden="true">🧭</span> Route: {msg.route.pathNames?.join(' → ')}
                  </div>
                  <div className="flex gap-3">
                    <span>⏱ {msg.route.estimatedTime} min</span>
                    <span>📏 {msg.route.distance} units</span>
                  </div>
                </div>
              )}

              {/* Match data card (NEW) */}
              {(msg.intent === 'live_match_info' || msg.intent === 'live_match_query') && msg.data && (
                <div className="mt-2 p-2 rounded-lg text-xs" style={{ background: 'rgba(16, 185, 129, 0.1)' }} aria-label="Match score update">
                  <div className="flex items-center gap-1 mb-1 font-semibold" style={{ color: '#10b981' }}>
                    <span aria-hidden="true">🏏</span> Live Match
                  </div>
                  {msg.data.score && (
                    <div className="flex gap-3">
                      <span>{msg.data.teams?.team1}: {msg.data.score.team1?.runs}/{msg.data.score.team1?.wickets}</span>
                      {msg.data.score.team2?.runs > 0 && (
                        <span>{msg.data.teams?.team2}: {msg.data.score.team2?.runs}/{msg.data.score.team2?.wickets}</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <span className="block text-xs mt-1.5 opacity-50">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {processing && (
          <div className="flex justify-start fade-in" aria-label="Thinking...">
            <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--surface)' }}>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Live transcript */}
        {isListening && transcript && (
          <div className="flex justify-end fade-in">
            <div className="max-w-xs rounded-2xl px-4 py-3" style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px dashed var(--accent)' }} aria-live="polite">
              <p className="text-sm italic" style={{ color: 'var(--accent-light)' }}>{transcript}...</p>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom controls */}
      <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
        {/* Waveform when listening */}
        {isListening && (
          <div className="flex items-end justify-center gap-1 mb-4 h-10" aria-hidden="true">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full wave-bar"
                style={{
                  background: 'var(--accent)',
                  animationDelay: `${i * 0.05}s`,
                  height: `${8 + Math.random() * 24}px`,
                }}
              />
            ))}
          </div>
        )}

        {/* Mic button + text input */}
        <div className="flex items-center gap-3">
          {/* Text input fallback */}
          <form onSubmit={handleTextSubmit} className="flex-1">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={isSupported ? 'Type or tap mic to speak...' : 'Type your message...'}
              aria-label={isSupported ? 'Type message or use voice assistant' : 'Type message'}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'var(--surface)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
              }}
              disabled={isListening || processing}
            />
          </form>

          {/* Mic button */}
          {isSupported && (
            <button
              id="mic-button"
              onClick={handleMicPress}
              disabled={processing}
              aria-label={isListening ? 'Stop listening' : 'Start voice assistant'}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl shadow-lg transition-all duration-300 ${
                isListening ? 'mic-active' : 'hover:scale-110'
              } ${isSpeaking ? 'pulse-glow' : ''}`}
              style={{
                background: isListening
                  ? 'linear-gradient(135deg, #ef4444, #f97316)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: isListening
                  ? '0 0 20px rgba(239, 68, 68, 0.4)'
                  : '0 4px 16px rgba(99, 102, 241, 0.3)',
              }}
            >
              {isListening ? '⏹' : '🎤'}
            </button>
          )}
        </div>

        {/* Status text */}
        <div className="text-center mt-2" aria-live="polite">
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {isListening ? '🔴 Listening...' :
             isSpeaking ? '🔊 Speaking...' :
             processing ? '⏳ Processing...' :
             isSupported ? 'Tap the mic or type a message' : 'Type a message (speech not supported in this browser)'}
          </span>
        </div>
      </div>
    </div>
  );
}

VoiceChat.propTypes = {
  /** Callback fired when a navigation route is confirmed */
  onNavigate: PropTypes.func,
  /** Current zone ID of the user */
  currentLocation: PropTypes.string,
};

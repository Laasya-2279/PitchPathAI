'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook for Web Speech API — speech recognition and text-to-speech.
 * Works in Chrome/Edge. Provides listening state, transcript, and speak function.
 */
export default function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition && !!window.speechSynthesis);
  }, []);

  /**
   * Start listening for speech
   * @param {Function} onResult - Callback with final transcript
   */
  const startListening = useCallback((onResult) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported');
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      if (finalTranscript && onResult) {
        onResult(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  /**
   * Speak text using Google Cloud TTS (Primary) or Browser TTS (Fallback)
   * @param {string} text - Text to speak
   */
  const speak = useCallback(async (text) => {
    return new Promise(async (resolve) => {
      setIsSpeaking(true);
      
      try {
        // 1. Try Google Cloud TTS via Backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/voice/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        const data = await response.json();

        if (data.success && data.audioContent) {
          const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
          audio.onended = () => {
            setIsSpeaking(false);
            resolve();
          };
          audio.onerror = () => {
            throw new Error('Audio playback failed');
          };
          audio.play();
          return;
        }
      } catch (err) {
        console.warn('Cloud TTS failed, falling back to browser:', err);
      }

      // 2. Fallback to Browser SpeechSynthesis
      if (!window.speechSynthesis) {
        setIsSpeaking(false);
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  /**
   * Stop speaking
   */
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    // Also stop any HTML5 Audio if playing
    const audios = document.getElementsByTagName('audio');
    for (let i = 0; i < audios.length; i++) audios[i].pause();
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    isSupported,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
}

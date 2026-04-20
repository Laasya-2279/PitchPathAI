const express = require('express');
const router = express.Router();
const textToSpeech = require('@google-cloud/text-to-speech');
const speech = require('@google-cloud/speech');
const fs = require('fs');
const util = require('util');

// Initialize Google Cloud TTS client
// Assumes GOOGLE_APPLICATION_CREDENTIALS points to service-account.json
const { body, validationResult } = require('express-validator');

const ttsClient = new textToSpeech.TextToSpeechClient();
const sttClient = new speech.SpeechClient();

/**
 * Middleware to handle validation errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ status: 'error', errors: errors.array() });
  }
  next();
};

/**
 * POST /api/tts
 * Body: { text: string }
 * Returns base64 audio buffer
 */
router.post('/tts', [
  body('text').isString().trim().isLength({ min: 1, max: 1000 }).escape(),
  validate
], async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const request = {
      input: { text },
      voice: { languageCode: 'en-IN', name: 'en-IN-Wavenet-D', ssmlGender: 'FEMALE' },
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    
    // Send audio as base64
    res.json({ 
      success: true, 
      audioContent: response.audioContent.toString('base64') 
    });
  } catch (err) {
    console.error('Google TTS Error:', err);
    res.status(500).json({ error: 'Failed to synthesize speech', details: err.message });
  }
});

/**
 * POST /api/stt
 * Body: { audio: base64 string }
 */
router.post('/stt', [
  body('audio').isString().isLength({ min: 1 }),
  validate
], async (req, res) => {
  try {
    const { audio } = req.body;
    if (!audio) return res.status(400).json({ error: 'Audio data is required' });

    const request = {
      audio: { content: audio },
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en-IN',
      },
    };

    const [response] = await sttClient.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    res.json({ success: true, transcript: transcription });
  } catch (err) {
    console.error('Google STT Error:', err);
    res.status(500).json({ error: 'Failed to recognize speech', details: err.message });
  }
});

module.exports = router;

/**
 * PitchPath AI Centralized Logger
 * 
 * Provides consistent logging across the backend.
 * info: General operational messages (suppressed in tests)
 * error: Critical failures
 * debug: Detailed development info (only in Dev mode)
 */
const logger = {
  info: (msg, data) => 
    process.env.NODE_ENV !== 'test' && console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data || ''),
    
  error: (msg, err) => 
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err || ''),
    
  debug: (msg, data) => 
    process.env.NODE_ENV === 'development' && console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`, data || '')
};

module.exports = logger;

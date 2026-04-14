const mongoose = require('mongoose');

const crowdDataSchema = new mongoose.Schema({
  zone:          { type: String, required: true },
  density_level: { type: Number, min: 0, max: 1, required: true },
  queue_time:    { type: Number, default: null },
  status:        { type: String, enum: ['low', 'moderate', 'high', 'very_high'], default: 'low' },
  last_updated:  { type: Date, default: Date.now },
}, { timestamps: true });

// TTL index: auto-remove records older than 1 hour
crowdDataSchema.index({ last_updated: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model('CrowdData', crowdDataSchema);

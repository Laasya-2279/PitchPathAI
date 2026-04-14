const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  facility_id:    { type: String, required: true, unique: true },
  type:           { type: String, enum: ['food', 'washroom', 'gate', 'medical', 'vip'], required: true },
  name:           { type: String, required: true },
  location_block: { type: String },
  queue_time:     { type: Number, default: 0 },
  position:       { x: Number, y: Number },
  description:    { type: String, default: '' },
  is_open:        { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Facility', facilitySchema);

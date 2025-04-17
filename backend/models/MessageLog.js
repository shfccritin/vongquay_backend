const mongoose = require('mongoose');

const MessageLogSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true },
  message: { type: String },
  direction: { type: String, enum: ['user', 'cskh'], required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false } // ✅ Thêm
});

module.exports = mongoose.model('MessageLog', MessageLogSchema);

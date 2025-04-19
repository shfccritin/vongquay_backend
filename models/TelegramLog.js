const mongoose = require('mongoose');

const TelegramLogSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  username: { type: String },
  fullName: { type: String },
  code: { type: String, required: true },
  reward: { type: String, required: true },
  sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TelegramLog', TelegramLogSchema);

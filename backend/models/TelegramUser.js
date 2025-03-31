// Bước 1: Mô tả TelegramUser model
// models/TelegramUser.js
const mongoose = require('mongoose');

const TelegramUserSchema = new mongoose.Schema({
  username: String,
  chatId: String,
});

module.exports = mongoose.model('TelegramUser', TelegramUserSchema);

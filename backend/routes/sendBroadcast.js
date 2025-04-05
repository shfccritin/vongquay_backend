const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const TelegramLog = require('../models/TelegramLog'); 
const jwt = require("jsonwebtoken");
require('dotenv').config();
const router = express.Router();
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
};

router.post('/send-broadcast',auth, async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Nội dung tin nhắn không được bỏ trống' });
  }

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Nội dung tin nhắn không được bỏ trống' });
  }
  try {
    const users = await TelegramLog.find();
    let success = 0, failed = 0;

    for (const user of users) {
      try {
        await bot.sendMessage(user.telegramId, message, { parse_mode: 'Markdown' });
        success++;
      } catch (err) {
        console.error(`❌ Không gửi được cho ${user.telegramId}: ${err.message}`);
        failed++;
      }
    }

    res.status(200).json({ message: '📨 Đã gửi xong!', success, failed });
  } catch (err) {
    console.error('❌ Broadcast error:', err);
    res.status(500).json({ error: 'Lỗi khi gửi broadcast' });
  }
});

module.exports = router;

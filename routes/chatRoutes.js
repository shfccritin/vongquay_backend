const express = require('express');
const router = express.Router();
const TelegramLog = require('../models/TelegramLog');
const MessageLog = require('../models/MessageLog');

const jwt = require("jsonwebtoken");

// Middleware xác thực
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

// Lấy danh sách user Telegram đã nhắn bot
router.get('/users',auth, async (req, res) => {
  try {
    const users = await TelegramLog.find({}, '-__v'); // loại bỏ __v
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách user' });
  }
});

// Lấy lịch sử chat với một user cụ thể
router.get('/messages/:telegramId',auth, async (req, res) => {
  try {
    const { telegramId } = req.params;
    const messages = await MessageLog.find({ telegramId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy lịch sử chat' });
  }
});

router.post('/mark-read/:telegramId',auth, async (req, res) => {
    try {
      await MessageLog.updateMany(
        { telegramId: req.params.telegramId, direction: 'user', isRead: false },
        { $set: { isRead: true } }
      );
      res.json({ success: true });
    } catch (err) {
      console.error('❌ Lỗi mark-read:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  

module.exports = router;

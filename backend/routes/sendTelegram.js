const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const TelegramLog = require('../models/TelegramLog');

function verifyTelegramUser(user, botToken) {
  const { hash, ...data } = user;

  const dataCheckString = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('\n');

  const secret = crypto
    .createHash('sha256')
    .update(botToken)
    .digest();

  const hmac = crypto
    .createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex');

  return hmac === hash;
}

router.post("/send-telegram", async (req, res) => {
  const { user, code, reward } = req.body;
  console.log(user,code,reward);
  if (!user || !user.id || !code || !reward || !user.hash) {
    return res.status(400).json({ message: "Thiếu thông tin hợp lệ." });
  }

  const isVerified = verifyTelegramUser(user, process.env.TELEGRAM_BOT_TOKEN);
  console.log(1111)
  if (!isVerified) {
    return res.status(403).json({ message: "Xác thực Telegram không hợp lệ." });
  }
  console.log(222222)

  try {
    const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    await axios.post(TELEGRAM_API, {
      chat_id: user.id,
      text: `🎉 Bạn đã trúng phần thưởng: ${reward}\n🔑 Mã nhận quà: ${code}`,
    });
  console.log(33333)
      
    // Lưu log vào DB
    await TelegramLog.create({
      telegramId: user.id,
      username: user.username || '',
      code,
      reward,
      fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
    });
    console.log(44444)

    return res.json({ success: true });
  } catch (err) {
    console.error("Telegram API error:", err.response?.data || err.message);
    return res.status(500).json({ message: "Không thể gửi mã đến Telegram." });
  }
});

module.exports = router;

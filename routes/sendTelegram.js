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
  if (!user || !user.id || !code || !reward || !user.hash) {
    return res.status(400).json({ message: "Thiếu thông tin hợp lệ." });
  }

  const isVerified = verifyTelegramUser(user, process.env.TELEGRAM_BOT_TOKEN);
  if (!isVerified) {
    return res.status(403).json({ message: "Xác thực Telegram không hợp lệ." });
  }

  try {
    const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(TELEGRAM_API, {
      chat_id: user.id,
      text: `🎉 Bạn đã trúng phần thưởng: ${reward}\n🔑 Mã nhận quà: ${code}`,
    }, {
      family: 4  // 🔒 ép dùng IPv4, bỏ qua IPv6 gây lỗi
    });


    // Lưu log vào DB
    await TelegramLog.create({
      telegramId: user.id,
      username: user.username || '',
      code: code,
      reward: reward,
      fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Telegram API error:", err);
    return res.status(500).json({ message: "Không thể gửi mã đến Telegram." });
  }
});

module.exports = router;

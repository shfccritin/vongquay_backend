const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post("/send-telegram", async (req, res) => {
  const { telegramId, code, reward } = req.body;

  if (!telegramId || !code || !reward) {
    return res.status(400).json({ message: "Thiếu dữ liệu cần thiết." });
  }

  try {
    const TELEGRAM_API = `https://api.telegram.org/${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    await axios.post(TELEGRAM_API, {
      chat_id: telegramId,
      text: `🎉 Bạn đã trúng phần thưởng: ${reward}\n🔑 Mã nhận quà: ${code}`,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Telegram API error:", err.response?.data || err.message);
    return res.status(500).json({ message: "Không thể gửi mã đến Telegram." });
  }
});

module.exports = router;

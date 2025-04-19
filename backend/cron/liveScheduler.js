const cron = require('node-cron');
const axios = require('axios');
const LiveSchedule = require('../models/LiveSchedule');
const TelegramLog = require('../models/TelegramLog');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Escape MarkdownV2 cho Telegram
const escapeMarkdownV2 = (text) => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
};

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Lấy danh sách subscriber từ ManyChat
async function getManyChatSubscribers() {
  try {
    const res = await axios.get('https://api.manychat.com/fb/subscribers?limit=500', {
      headers: {
        Authorization: `Bearer ${process.env.MANYCHAT_API_KEY}`
      }
    });
    return res.data.data || [];
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách subscriber:", err.response?.data || err.message);
    return [];
  }
}

// Gửi từng subscriber nội dung động
async function sendManyChatToAll(fullText) {
  const subscribers = await getManyChatSubscribers();
  for (const user of subscribers) {
    try {
      await axios.post(
        'https://api.manychat.com/fb/sending/sendContent',
        {
          subscriber_id: user.id,
          messages: [
            {
              type: "text",
              text: fullText.trim()
            }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.MANYCHAT_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log("✅ Đã gửi ManyChat cho:", user.id);
      await delay(50); // Giới hạn 20 request/giây
    } catch (err) {
      console.error("❌ Lỗi gửi ManyChat cho", user.id, ":", err.response?.data || err.message);
    }
  }
}

// Cron chạy mỗi phút
cron.schedule('* * * * *', async () => {
  const now = new Date();
  console.log('🕒 Cron Tick:', now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }));

  const candidates = await LiveSchedule.find({ sent: false });

  for (const item of candidates) {
    const [h, m] = item.time.replace('h', ':').split(':').map(Number);
    const liveTime = new Date(item.date);
    liveTime.setHours(h - Math.floor(item.countdown / 60));
    liveTime.setMinutes(m - item.countdown % 60);
    liveTime.setSeconds(0);
    liveTime.setMilliseconds(0);

    const diff = now - liveTime;

    console.log(`⏱ BLV ${item.blv} | liveTime: ${liveTime.toLocaleString()} | Now: ${now.toLocaleString()}`);

    if (diff >= 0 && diff < 3 * 60 * 1000) {
      const plainText = `
🔥 HOT HOT HOT! PHIÊN LIVE *${item.game.toUpperCase()}* CỦA *BLV ${item.blv.toUpperCase()}* CHÍNH THỨC BẮT ĐẦU!

💥 Căng đét từng giây – Cháy quà từng phút – Gáy cực gắt cùng BLV ${item.blv.toUpperCase()}!
🎁 Tương tác càng nhiều – Quà càng khủng!

⏰ VÀO NGAY KẺO HẾT – KHÔNG XEM LÀ PHÍ CẢ ĐỜI!

📺 Link xem livestream:
🔗 ${item.link || 'https://www.facebook.com/f168tv.tv'}

🔹 Page chính thức (tích xanh):
👉 https://www.facebook.com/f168tv.net

🔹 Page PK Nổ Hũ:
👉 https://www.facebook.com/PKF168TV

🔹 Page PK Bắn Cá:
👉 https://www.facebook.com/PKBANCAF168TV

🔹 Channel Telegram Nổ Hũ:
👉 https://t.me/F168PK

🔹 Channel Telegram Bắn Cá:
👉 https://t.me/F168TVBANCA

📢 Tag bạn bè vào room – gào thét cùng ${item.blv.toUpperCase()} – săn quà quét sạch room ngay!
      `.trim();

      const escaped = escapeMarkdownV2(plainText);
      const users = await TelegramLog.find();
      let count = 0;

      for (const user of users) {
        try {
          await bot.sendMessage(user.telegramId, escaped, { parse_mode: 'MarkdownV2' });
          count++;
        } catch (err) {
          console.error(`❌ Gửi lỗi [${user.telegramId}]: ${err.message}`);
        }
      }

      await sendManyChatToAll(plainText);

      item.sent = true;
      await item.save();

      console.log(`✅ Đã gửi lịch ${item.blv} lúc ${item.time} (${count} Telegram + all ManyChat)`);
    }
  }
});

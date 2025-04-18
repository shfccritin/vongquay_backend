const cron = require('node-cron');
const LiveSchedule = require('../models/LiveSchedule');
const TelegramLog = require('../models/TelegramLog');
const TelegramBot = require('node-telegram-bot-api');

require('dotenv').config();
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Escape MarkdownV2
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

// Cron chạy mỗi phút
cron.schedule('* * * * *', async () => {
  const now = new Date();
  console.log('🕒 Cron Tick:', now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }));

  const candidates = await LiveSchedule.find({ sent: false });

  for (const item of candidates) {
    // Parse giờ phút từ chuỗi dạng "20h45"
    const [h, m] = item.time.replace('h', ':').split(':').map(Number);

    // Set giờ và phút theo múi giờ +07:00
    const liveTime = new Date(item.date);
    liveTime.setHours(h - item.countdown / 60); // hỗ trợ luôn countdown lớn hơn 60
    liveTime.setMinutes(m - item.countdown);
    liveTime.setSeconds(0);
    liveTime.setMilliseconds(0);

    // In debug thông tin
    console.log(`⏱ BLV ${item.blv} | liveTime: ${liveTime.toLocaleString()} | Now: ${now.toLocaleString()}`);

    const diff = now - liveTime;

    if (diff >= 0 && diff < 3 * 60 * 1000) {
      const message = `
🔥 *CHÁY PHÒNG!* PHIÊN LIVE *${item.game.toUpperCase()}* CỦA *BLV ${item.blv.toUpperCase()}* CHÍNH THỨC BẮT ĐẦU\\!*

💥 Căng đét từng giây – Cháy quà từng phút – Gáy cực gắt cùng *BLV ${item.blv.toUpperCase()}*\\!
🎁 Tương tác càng nhiều – Quà càng khủng\\!

⏰ *VÀO NGAY KẺO HẾT – KHÔNG XEM LÀ PHÍ CẢ ĐỜI\\!*

📺 *Link xem livestream:*
🔗 ${item.link || 'https://www.facebook.com/f168tv.tv'}

🔹 *Page chính thức \\(tích xanh\\):*
👉 https://www.facebook.com/f168tv.net

🔹 *Page PK Nổ Hũ:*
👉 https://www.facebook.com/PKF168TV

🔹 *Page PK Bắn Cá:*
👉 https://www.facebook.com/PKBANCAF168TV

🔹 *Channel Telegram Nổ Hũ:*
👉 https://t.me/F168PK

🔹 *Channel Telegram Bắn Cá:*
👉 https://t.me/F168TVBANCA

📢 Tag bạn bè vào room – gào thét cùng *${item.blv.toUpperCase()}* – săn quà quét sạch room ngay\\!
`;


      const escaped = escapeMarkdownV2(message.trim());
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

      item.sent = true;
      await item.save();
      console.log(`✅ Đã gửi thông báo cho lịch ${item.blv} lúc ${item.time} (${count} người nhận)`);
    }
  }
});

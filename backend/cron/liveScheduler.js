const cron = require('node-cron');
const axios = require('axios');
const LiveSchedule = require('../models/LiveSchedule');
const TelegramLog = require('../models/TelegramLog');
const ManychatUser = require('../models/ManychatUser');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sendManyChat(message) {
  const users = await ManychatUser.find();
  for (const user of users) {
    try {
      await axios.post(
        'https://api.manychat.com/fb/sending/sendContent',
        {
          subscriber_id: user.subscriber_id,
          data: {
            version: "v2",
            content: {
              messages: [
                {
                  type: "text",
                  text: message
                }
              ]
            }
          },
          message_tag: "ACCOUNT_UPDATE"
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.MANYCHAT_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ ManyChat gửi thành công: ${user.subscriber_id}`);
      await delay(50);
    } catch (err) {
      const detail = err.response?.data?.details?.messages?.[0]?.message || err.message;
      console.error(`❌ ManyChat lỗi: ${user.subscriber_id} —`, detail);
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
    liveTime.setMinutes(m - (item.countdown % 60));
    liveTime.setSeconds(0);
    liveTime.setMilliseconds(0);

    const diff = now - liveTime;

    // Sửa: chỉ gửi nếu đúng trong khoảng 1 phút
    if (diff >= 0 && diff < 60 * 1000) {
      console.log(`⏱ Gửi lịch BLV ${item.blv} | liveTime: ${liveTime.toLocaleString()} | Now: ${now.toLocaleString()}`);

      const message = `
🎉 *THÔNG BÁO ĐẶC BIỆT* 🎉
Chúng tôi xin thông báo về buổi livestream đặc biệt sắp tới tại *F168TV*. Đừng bỏ lỡ cơ hội tham gia vào một sự kiện cực kỳ hấp dẫn với những phần quà vô cùng giá trị\\! 💥🎁

💥 Căng đét từng giây – Cháy quà từng phút – Gáy cực gắt cùng *BLV ${item.blv.toUpperCase()}*!
🎁 Tương tác càng nhiều – Quà càng khủng\\!

⏰ *VÀO NGAY KẺO HẾT – KHÔNG XEM LÀ PHÍ CẢ ĐỜI\\!*

📺 *Link xem livestream:*
🔗 ${item.link || 'https://www.facebook.com/f168tv.tv'}

🔹 *Page chính thức \\(tích xanh\\):*
👉 https://www.facebook.com/f168tv.net

🔹 *Group Quán Quen F168TV:*
👉 https://www.facebook.com/groups/f168tv

🔹 *Page PK Nổ Hũ:*
👉 https://www.facebook.com/PKF168TV

🔹 *Page PK Bắn Cá:*
👉 https://www.facebook.com/PKBANCAF168TV

🔹 *Channel Telegram Nổ Hũ:*
👉 https://t.me/F168PK

🔹 *Channel Telegram Bắn Cá:*
👉 https://t.me/F168TVBANCA

🔹GROUP F168TV-KIẾM CƠM GẠO BCR
👉 https://t.me/F168TV_KiemComBCR

📢 Tag bạn bè vào room – gào thét cùng *${item.blv.toUpperCase()}* – săn quà quét sạch room ngay\\!
`.trim();

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

      console.log(`✅ Đã gửi Telegram cho ${count} người`);

      const plainText = message.replace(/\\!/g, '!');
      await sendManyChat(plainText);

      item.sent = true;
      await item.save();
      console.log(`✅ Đã hoàn tất gửi lịch ${item.blv} lúc ${item.time}`);
    }
  }
});

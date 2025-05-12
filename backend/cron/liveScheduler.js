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
🔥 *F168TV LIVESTREAM – QUẨY TỚI BẾN* 🔥

💥 Căng đét từng giây – Cháy quà từng phút – Gáy cực gắt cùng *BLV ${item.blv.toUpperCase()}*
🎁 Tương tác càng nhiều – Trúng quà càng đỉnh!🔥

⏰ *VÀO NGAY KẺO HẾT – VẮNG MẶT LÀ MẤT QUÀ* 🔥

📺 *Link xem livestream:*
🔗 [BẤM XEM LIVESTREAM](${item.link || 'https://www.facebook.com/100080292792390/videos/2084834398666290'})

🔹 *Page chính thức (tích xanh):* https://www.facebook.com/f168tv.net

🔹 *Group Quán Quen F168TV:* [Tham gia ngay](https://www.facebook.com/groups/f168tv)

🔹 *Channel Telegram F168TV:* https://t.me/trangchuf168tv

🔹 *GROUP F168TV-KIẾM CƠM GẠO BCR:* [Vào nhóm](https://t.me/F168TV_KiemComBCR)

🔹 *GROUP NỔ HŨ F168TV:* https://t.me/NOHUF168TV

📢 Tag bạn bè vào room – gào thét cùng *BLV ${item.blv.toUpperCase()}* nào #all  
TELE HỖ TRỢ 24/7: https://t.me/CSKHF168_TV
`.trim();


      const escaped = escapeMarkdownV2(message.trim());
      const users = await TelegramLog.find();
      let count = 0;

      for (const user of users) {
        try {
          await bot.sendPhoto(
            user.telegramId,
            'https://iili.io/38cvpa9.webp'
          );
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

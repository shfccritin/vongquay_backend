// services/telegramBot.js
const TelegramBot = require('node-telegram-bot-api');
const TelegramLog = require('../models/TelegramLog');

function escapeMarkdownV2(text) {
  return text
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
    .replace(/!/g, '\\!')
    .replace(/\\/g, '\\\\');
}

module.exports = function startTelegramBot(token) {
  const bot = new TelegramBot(token, { polling: true });

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const from = msg.from;
    const fullName = `${from.first_name || ''} ${from.last_name || ''}`.trim();

    try {
      const existing = await TelegramLog.findOne({ telegramId: from.id });
      if (!existing) {
        await TelegramLog.create({
          telegramId: from.id,
          username: from.username || '',
          fullName: fullName || '',
          code: 'N/A',
          reward: 'N/A',
        });
        console.log(`✅ Đã lưu user mới: ${from.username || from.id}`);
      } else {
        console.log(`ℹ️ User đã tồn tại: ${from.username || from.id}`);
      }
    } catch (err) {
      console.error('❌ Lỗi khi lưu user:', err);
    }

    const introMessage = `👋 Xin chào anh/chị! 
Em là  *BÉ BÁO TIN F168TV!* – trợ lý riêng của F168TV 🍱

🎯 *Nhiệm vụ của em:*
• Gửi thông báo sớm nhất mỗi khi có:
  - 📺 Livestream phát code
  - ⚔️ Minigame PK nhận quà
  - 🎡 Vòng quay mở mâm mới
  - 🏆 BXH fan được cập nhật

⏳ *Không cần tìm đâu xa* – em báo trước khi mọi thứ diễn ra!

📍 *Muốn không bỏ lỡ CODE – QUÀ – LIVE HOT*, theo dõi các kênh chính thức:

🔹 *Page chính thức (tích xanh)*  
👉 [F168TV](https://www.facebook.com/f168tv.net)

🔹 *Page PK Nổ Hũ*  
👉 [PKF168TV](https://www.facebook.com/PKF168TV)

🔹 *Page PK Bắn Cá*  
👉 [PK Bắn Cá F168TV](https://www.facebook.com/PKBANCAF168TV)

🔹 *Channel Nổ Hũ (Telegram)*  
👉 [F168PK](https://t.me/F168PK)

🔹 *Channel Bắn Cá (Telegram)*  
👉 [F168TV Bắn Cá](https://t.me/F168TVBANCA)`;

    const followUpMessage = `✅ *Đã theo dõi hết chưa ạ?*

📩 *Mỗi lần có mâm mới – em sẽ báo trước 15 phút để mình vào sớm, không lỡ vòng quay* 🎁

💌 *Thỉnh thoảng em cũng phát code riêng cho người theo bot – nhớ bật thông báo nha ạ!*`;

    try {
      await bot.sendMessage(chatId, escapeMarkdownV2(introMessage), {
        parse_mode: 'MarkdownV2',
      });
      await bot.sendMessage(chatId, escapeMarkdownV2(followUpMessage), {
        parse_mode: 'MarkdownV2',
      });
    } catch (err) {
      console.error('❌ Lỗi gửi tin nhắn:', err.message);
    }
  });

  console.log('🤖 Telegram bot started!');
};

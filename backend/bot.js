const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const introMessage = `👋 Xin chào anh/chị! 
Em là  BÉ BÁO TIN F168TV! – trợ lý riêng của F168TV 🍱

Nhiệm vụ của em:

Gửi thông báo sớm nhất mỗi khi có:

Livestream phát code

Minigame PK nhận quà

Vòng quay mở mâm mới

BXH fan được cập nhật 🎯

⏳ Không cần tìm đâu xa – em báo ngay trước khi mọi thứ diễn ra
📍Muốn không bỏ lỡ CODE – QUÀ – LIVE HOT → theo dõi các kênh chính dưới đây nha:

🔹 Page chính thức (tích xanh):
[🔗 Link Page F168TV]

🔹 Page PK Nổ Hũ:
[🔗 Link Page PK Slot]

🔹 Page PK Bắn Cá:
[🔗 Link Page PK Bắn Cá]

🔹 Channel Nổ Hũ:
[🔗 Channel Telegram Slot]

🔹 Channel Bắn Cá:
[🔗 Channel Telegram Bắn Cá]
`;

const followUpMessage = `✅ *Đã theo dõi hết chưa ạ?*

📩 *Mỗi lần có mâm mới – em sẽ báo trước 15 phút để mình vào sớm, không lỡ vòng quay* 🎁

💌 *Thỉnh thoảng em cũng phát code riêng cho người theo bot – nhớ bật thông báo nha ạ!*`;

    // Gửi tin 1 trước
    bot.sendMessage(chatId, introMessage, { parse_mode: 'Markdown' }).then(() => {
        // Sau khi tin 1 được gửi thành công, gửi tiếp tin 2
        bot.sendMessage(chatId, followUpMessage, { parse_mode: 'Markdown' });
    });
});

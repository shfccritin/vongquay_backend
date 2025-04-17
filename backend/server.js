// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const jwt = require('jsonwebtoken')
require('dotenv').config({ path: __dirname + '/.env' });
require('./cron/liveScheduler'); 

const MessageLog = require('./models/MessageLog');
const TelegramLog = require('./models/TelegramLog');

const app = express();
const PORT = process.env.PORT || 5000;
const codeRoutes = require("./routes/codeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminCodeRoutes = require("./routes/adminCodeRoutes");
const adminRewardRoutes = require("./routes/adminRewardRoutes");
const adminLogRoutes = require("./routes/adminLogRoutes");
const publicRoutes = require("./routes/publicRoutes");
const adminRewardCodeRoutes = require("./routes/adminRewardCodeRoutes")
const sendTelegram = require('./routes/sendTelegram')
const getCode = require('./routes/getCode')
const broadcastRoute = require('./routes/sendBroadcast');
const chatRoutes = require('./routes/chatRoutes');
const unreadRoutes = require('./routes/unreadRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');

app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// Routes
app.get("/", (req, res) => {
  res.send("🎯 Backend API is running!");
});

app.use("/api", codeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/codes", adminCodeRoutes);
app.use("/api/admin/rewards", adminRewardRoutes);
app.use("/api/admin/logs", adminLogRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/admin/reward-codes", adminRewardCodeRoutes);
app.use("/api", sendTelegram);
app.use("/api", getCode);
app.use("/api", broadcastRoute);
app.use('/api', chatRoutes);
app.use('/api', unreadRoutes);
app.use('/api', scheduleRoutes);


const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

server.listen(PORT, () => {
  console.log(`🚀 Server + Socket.IO running at http://localhost:${PORT}`);
});


function escapeMarkdownV2(text) {
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
}

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.on('polling_error', (err) => {
  console.error('❌ polling_error:', err.message);
});

// Xử lý lệnh /start
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
👉 [F168TV Bắn Cá](https://t.me/F168TVBANCA)

🔹 🔹🔹🔹🔹🔹🔹🔹🔹🔹
MỌI THẮC MẮC XIN LIÊN HỆ BỘ PHẬN CSKH:
👉 https://t.me/CSKHF168_TV`;

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


// Tự động trả lời tin nhắn từ người dùng
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Bỏ qua nếu là lệnh /start
  if (text && text.toLowerCase().startsWith('/start')) return;


  // ✅ Lưu log tin nhắn từ user
  await MessageLog.create({
    telegramId: msg.chat.id,
    message: msg.text,
    direction: 'user',
    isRead: false, 
  });
  
  // ✅ Gửi realtime cho tất cả client CSKH đang mở
  io.emit('receive-message', {
    telegramId: chatId,
    message: text,
    direction: 'user',
    timestamp: new Date(),
  });
});


console.log('🤖 Bot is running...');


io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Không có token.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    socket.user = decoded; 
    next();
  } catch (err) {
    console.error('❌ JWT không hợp lệ:', err.message);
    return next(new Error('Token không hợp lệ.'));
  }
});

io.on('connection', (socket) => {
  console.log('🟢 CSKH connected via socket:', socket.id);

  socket.on('send-message', async ({ telegramId, message }) => {
    try {
      // Gửi qua bot Telegram
      await bot.sendMessage(telegramId, message);

      // Lưu log tin nhắn gửi
      await MessageLog.create({
        telegramId,
        message,
        direction: 'cskh',
      });

      // Phát lại cho giao diện CSKH (realtime)
      io.emit('receive-message', {
        telegramId,
        message,
        direction: 'cskh',
        timestamp: new Date(),
      });

      console.log(`✅ Gửi thành công cho ${telegramId}`);
    } catch (err) {
      console.error('❌ Lỗi gửi từ CSKH qua bot:', err.message);
    }
  });

});


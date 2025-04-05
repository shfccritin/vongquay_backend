// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

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
app.use("/api/admin/reward-codes",adminRewardCodeRoutes);
app.use("/api",sendTelegram);
app.use("/api",getCode);
app.use("/api",broadcastRoute);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// routes/code.js

const express = require("express");
const router = express.Router();
const Code = require("../models/Code");

// API để lấy 1 code duy nhất chưa được lấy
router.get("/get-code", async (req, res) => {
  try {
    const code = await Code.findOneAndUpdate(
      { isget: false, used: false },      // Lọc cả isget và used
      { $set: { isget: true } },          // Đánh dấu là đã get
      { new: true }                       // Trả về document sau khi update
    );

    if (!code) {
      return res.status(404).json({ message: "Hết code hợp lệ (chưa get & chưa dùng)" });
    }

    res.json({ ma: code.code });
  } catch (err) {
    console.error("Lỗi khi lấy code:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;


module.exports = router;

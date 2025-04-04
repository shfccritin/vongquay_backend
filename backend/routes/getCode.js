// routes/code.js

const express = require("express");
const router = express.Router();
const Code = require("../models/Code");

// API để lấy 1 code duy nhất chưa được lấy
router.get("/get-code", async (req, res) => {
  try {
    const code = await Code.findOneAndUpdate(
      { isget: false },         // chỉ lấy những code chưa get
      { $set: { isget: true } }, // cập nhật thành đã get
      { new: true }              // trả về bản ghi sau khi update
    );

    if (!code) {
      return res.status(404).json({ message: "Hết code chưa được lấy" });
    }

    res.json({ ma: code.code });
  } catch (err) {
    console.error("Lỗi khi lấy code:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;

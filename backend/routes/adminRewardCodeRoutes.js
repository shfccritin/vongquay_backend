// routes/adminRewardCodeRoutes.js
const express = require("express");
const router = express.Router();
const RewardCode = require("../models/RewardCode");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const mongoose = require("mongoose");
const upload = multer({ dest: "uploads/" });

// Middleware xác thực token
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
};

// get code reward
router.get("/:rewardId", auth, async (req, res) => {
  const { rewardId } = req.params;
  const codes = await RewardCode.find({ rewardId }).sort({ _id: -1 }).select("code used -_id");
  res.json(codes);
});

// Nhận file txt hoặc excel
router.post("/import-file", auth, upload.single("file"), async (req, res) => {
  const rewardId = req.body.rewardId;
  if (!rewardId || !mongoose.Types.ObjectId.isValid(rewardId)) {
    return res.status(400).json({ message: "rewardId không hợp lệ." });
  }
  if (!req.file) return res.status(400).json({ message: "Không có file." });
  const path = req.file.path;
  let rawCodes = [];
  try {
    if (req.file.originalname.endsWith(".txt")) {
      const content = fs.readFileSync(path, "utf8");
      rawCodes = content.split("\n").map(c => c.trim());
    } else if (req.file.originalname.endsWith(".xlsx")) {
      const workbook = xlsx.readFile(path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(sheet);
      rawCodes = data.map(row => row.code?.toString().trim()).filter(Boolean);
    } else {
      return res.status(400).json({ message: "Chỉ hỗ trợ file .txt hoặc .xlsx" });
    }
    const inserted = [];
    const duplicated = [];
    for (const code of rawCodes) {
      if (!code || !/^[a-zA-Z0-9_-]{3,50}$/.test(code)) {
        duplicated.push(code + " (invalid)");
        continue;
      }
      const exists = await RewardCode.findOne({ code });
      if (exists) {
        duplicated.push(code);
        continue;
      }
      inserted.push({ rewardId, code });
    }
    if (inserted.length > 0) {
      await RewardCode.insertMany(inserted);
    }
    fs.unlinkSync(path); 
    return res.json({ success: true, imported: inserted.length, duplicated });
  } catch (err) {
    fs.unlinkSync(path);
    console.error(err);
    return res.status(500).json({ message: "Lỗi xử lý file." });
  }
});

// Thêm mã cho phần thưởng
router.post("/import", auth, async (req, res) => {
  const { rewardId, codes } = req.body;
  if (!rewardId || !mongoose.Types.ObjectId.isValid(rewardId)) {
    return res.status(400).json({ message: "rewardId không hợp lệ." });
  }
  if (!Array.isArray(codes) || codes.length === 0) {
    return res.status(400).json({ message: "Danh sách mã không hợp lệ." });
  }

  const inserted = [];
  const duplicated = [];

  for (let raw of codes) {
    const code = raw.trim();
    if (!code) continue;
    if (!/^[a-zA-Z0-9_-]{3,50}$/.test(code)) {
      duplicated.push(`${code} (ký tự không hợp lệ)`);
      continue;
    }
    const exists = await RewardCode.findOne({ code });
    if (exists) {
      duplicated.push(code);
      continue;
    }

    inserted.push({ rewardId, code });
  }

  // Nếu có mã mới thì lưu
  if (inserted.length > 0) {
    await RewardCode.insertMany(inserted);
  }

  return res.json({
    success: true,
    imported: inserted.length,
    duplicated,
  });
});

module.exports = router;

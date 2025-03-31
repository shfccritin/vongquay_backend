const express = require("express");
const router = express.Router();
const Code = require("../models/Code");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const xlsx = require("xlsx");
const path = require("path");
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

// Lấy danh sách mã
router.get("/", auth, async (req, res) => {
  const codes = await Code.find().sort({ used: 1, usedAt: -1 });
  res.json(codes);
});

// Thêm mã mới
router.post("/", auth, async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: "Thiếu mã" });
  }
  try {
    const exists = await Code.findOne({ code });
    if (exists) {
      return res.status(400).json({ message: "Mã đã tồn tại trong hệ thống" });
    }
    const newCode = new Code({ code });
    await newCode.save();
    res.json({ success: true, code: newCode });
  } catch (err) {
    console.error("Lỗi khi thêm mã:", err);
    res.status(500).json({ message: "Lỗi khi thêm mã" });
  }
});


// Xoá mã
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Code.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Không tìm thấy mã để xoá" });
    }
    res.json({ success: true, message: "Xoá mã thành công" });
  } catch (err) {
    console.error("Lỗi khi xoá mã:", err);
    res.status(500).json({ message: "Lỗi máy chủ khi xoá mã" });
  }
});


// Upload file Excel
router.post("/import", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Không tìm thấy file" });
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    const allCodes = data
      .map(row => row.code?.toString().trim())
      .filter(Boolean);
    if (allCodes.length === 0) {
      return res.status(400).json({ message: "Không có mã hợp lệ trong file" });
    }
    const existingCodes = await Code.find({ code: { $in: allCodes } }).distinct("code");
    const newCodes = allCodes.filter(code => !existingCodes.includes(code));
    const duplicates = allCodes.filter(code => existingCodes.includes(code));
    if (newCodes.length === 0) {
      return res.status(400).json({ message: "Tất cả mã trong file đều đã tồn tại" });
    }
    const insertDocs = newCodes.map(code => ({ code }));
    await Code.insertMany(insertDocs);
    res.json({
      success: true,
      imported: newCodes.length,
      duplicated: duplicates
    });
  } catch (err) {
    console.error("Lỗi khi import file:", err);
    res.status(500).json({ message: "Lỗi khi import file" });
  }
});



module.exports = router;

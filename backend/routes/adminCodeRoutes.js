const express = require("express");
const router = express.Router();
const Code = require("../models/Code");
const Reward = require("../models/Reward");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const xlsx = require("xlsx");
const upload = multer({ dest: "uploads/" });

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

router.get("/", auth, async (req, res) => {
  const codes = await Code.find()
    .sort({ used: 1, usedAt: -1 })
    .populate("rewardId", "label");
  res.json(codes);
});

router.post("/", auth, async (req, res) => {
  const { code, rewardId } = req.body;
  if (!code) {
    return res.status(400).json({ message: "Thiếu mã" });
  }

  const exists = await Code.findOne({ code });
  if (exists) {
    return res.status(400).json({ message: "Mã đã tồn tại trong hệ thống" });
  }

  let reward = null;
  if (rewardId) {
    reward = await Reward.findById(rewardId);
    if (!reward) {
      return res.status(400).json({ message: "Giải thưởng không tồn tại" });
    }
  }

  const newCode = new Code({ code, rewardId: reward?._id });
  await newCode.save();
  res.json({ success: true, code: newCode });
});


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

router.post("/import", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Không tìm thấy file" });
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const insert = [], duplicated = [];

    for (const row of data) {
      const code = row.code?.toString().trim();
      const rewardLabel = row.reward?.toString().trim();
      if (!code || !rewardLabel) continue;

      const exists = await Code.findOne({ code });
      if (exists) {
        duplicated.push(code);
        continue;
      }

      const reward = await Reward.findOne({ label: new RegExp(`^${rewardLabel}$`, "i") });
      if (!reward) {
        duplicated.push(`${code} (giải '${rewardLabel}' không tồn tại)`);
        continue;
      }

      insert.push({ code, rewardId: reward._id });
    }

    if (insert.length === 0)
      return res.status(400).json({ message: "Không có mã hợp lệ" });

    await Code.insertMany(insert);
    res.json({ success: true, imported: insert.length, duplicated });
  } catch (err) {
    console.error("Lỗi khi import file:", err);
    res.status(500).json({ message: "Lỗi khi import file" });
  }
});


module.exports = router;

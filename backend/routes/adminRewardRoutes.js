const express = require("express");
const router = express.Router();
const Reward = require("../models/Reward");
const jwt = require("jsonwebtoken");

// Middleware xác thực
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

// Lấy danh sách reward
router.get("/", auth, async (req, res) => {
  const rewards = await Reward.find();
  res.json(rewards);
});

// Thêm reward
router.post("/", auth, async (req, res) => {
  const { label, chance, image, isFake } = req.body;

  // Validate tên giải
  if (!label || typeof label !== "string" || label.trim() === "") {
    return res.status(400).json({ message: "Tên giải thưởng là bắt buộc." });
  }

  // Validate tỷ lệ
  if (
    chance === undefined ||
    chance === "" ||
    isNaN(chance) ||
    Number(chance) < 0 ||
    Number(chance) > 100
  ) {
    return res.status(400).json({ message: "Tỷ lệ phải là số từ 0 đến 100." });
  }

  // Validate isFake
  if (typeof isFake !== "boolean" && isFake !== "true" && isFake !== "false") {
    return res.status(400).json({ message: "Trường mồi (isFake) là bắt buộc." });
  }

  try {
    // Kiểm tra trùng tên
    const existing = await Reward.findOne({ label: new RegExp(`^${label.trim()}$`, "i") });
    if (existing) {
      return res.status(400).json({ message: "Tên giải thưởng đã tồn tại." });
    }

    const newReward = new Reward({
      label: label.trim(),
      chance: Number(chance),
      image: image?.trim() || "",
      isFake: isFake === true || isFake === "true"
    });

    await newReward.save();
    res.json(newReward);
  } catch (err) {
    console.error("Error creating reward:", err);
    res.status(500).json({ message: "Lỗi khi thêm giải." });
  }
});



// Sửa reward
router.put("/:id", auth, async (req, res) => {
  const { label, chance, image, isFake } = req.body;

  if (!label || label.trim() === "") {
    return res.status(400).json({ message: "Tên giải thưởng là bắt buộc." });
  }

  if (chance === undefined || isNaN(chance) || chance < 0 || chance > 100) {
    return res.status(400).json({ message: "Tỷ lệ phải là số từ 0 đến 100." });
  }

  try {
    // Kiểm tra trùng tên giải (ngoại trừ chính bản thân)
    const exists = await Reward.findOne({
      _id: { $ne: req.params.id },
      label: new RegExp(`^${label.trim()}$`, "i")
    });

    if (exists) {
      return res.status(400).json({ message: "Tên giải thưởng đã tồn tại." });
    }

    await Reward.findByIdAndUpdate(req.params.id, {
      label: label.trim(),
      chance: Number(chance),
      image: image || "",
      isFake: Boolean(isFake)
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Lỗi khi cập nhật reward:", err);
    res.status(500).json({ message: "Lỗi khi cập nhật giải thưởng." });
  }
});


// Xoá reward
router.delete("/:id", auth, async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) {
      return res.status(404).json({ message: "Không tìm thấy giải thưởng." });
    }
    await Reward.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Lỗi khi xoá reward:", err);
    res.status(500).json({ message: "Lỗi khi xoá giải thưởng." });
  }
});







module.exports = router;

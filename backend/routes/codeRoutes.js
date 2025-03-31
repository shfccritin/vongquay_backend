const express = require("express");
const router = express.Router();
const Code = require("../models/Code");
const Reward = require("../models/Reward");
const SpinLog = require("../models/SpinLog");
const RewardCode = require("../models/RewardCode");

// API kiểm tra mã
router.post("/check-code", async (req, res) => {
  const { code } = req.body;
  const found = await Code.findOne({ code });
  if (!found) return res.status(400).json({ success: false, message: "Mã không tồn tại" });
  if (found.used) return res.status(400).json({ success: false, message: "Mã đã được sử dụng" });
  return res.json({ success: true, message: "Mã hợp lệ" });
});


///API quay
router.post("/spin", async (req, res) => {
  const { code } = req.body;
  // Kiểm tra mã quay
  const codeEntry = await Code.findOne({ code });
  if (!codeEntry || codeEntry.used)
    return res.status(400).json({ success: false, message: "Mã không hợp lệ hoặc đã sử dụng" });
  // Lấy danh sách phần thưởng thật, có tỷ lệ
  const rewards = await Reward.find({ isFake: { $ne: true }, chance: { $gt: 0 } });
  if (!rewards.length)
    return res.status(500).json({ success: false, message: "Không có phần thưởng hợp lệ nào" });
  // Chọn phần thưởng theo tỷ lệ
  const totalChance = rewards.reduce((sum, r) => sum + r.chance, 0);
  let rand = Math.random() * totalChance;
  let selectedReward = null;
  for (const reward of rewards) {
    if (rand < reward.chance) {
      selectedReward = reward;
      break;
    }
    rand -= reward.chance;
  }

  if (!selectedReward) {
    return res.status(500).json({ success: false, message: "Không tìm được phần thưởng phù hợp." });
  }

  // Lấy mã đổi thưởng chưa dùng
  const rewardCode = await RewardCode.findOneAndUpdate(
    { rewardId: selectedReward._id, used: false },
    { used: true, usedAt: new Date() },
    { new: true }
  );

  if (!rewardCode) {
    return res.status(500).json({ success: false, message: "Phần thưởng đã hết mã đổi thưởng!" });
  }

  // Đánh dấu mã quay đã dùng
  codeEntry.used = true;
  codeEntry.usedAt = new Date();
  await codeEntry.save();

  // Ghi log quay
  await new SpinLog({
    code,
    reward: selectedReward.label,
    createdAt: new Date()
  }).save();

  // Trả kết quả về client
  return res.json({
    success: true,
    reward: {
      label: selectedReward.label,
      image: selectedReward.image,
      code: rewardCode.code
    }
  });
});


module.exports = router;

const express = require("express");
const router = express.Router();
const Code = require("../models/Code");
const Reward = require("../models/Reward");
const SpinLog = require("../models/SpinLog");
const RewardCode = require("../models/RewardCode");
const TELEGRAM_BOT_TOKEN = '7141621143:AAHEcXkdnxlQx45ELy_McUDo-XCwDKXm_oY';
const TELEGRAM_CHAT_ID = '-1002096251349';
const axios = require("axios");
// API kiểm tra mã
router.post("/check-code", async (req, res) => {
  const { code } = req.body;
  const found = await Code.findOne({ code });
  if (!found) return res.status(400).json({ success: false, message: "Mã không tồn tại" });
  if (found.used) return res.status(400).json({ success: false, message: `🎉 Mã dự thưởng này đã được sử dụng trước đó.\n
      👉 Phần thưởng của bạn: *${found.promoCode}*, Mã khuyến mãi: : *${found.reward}*` });
  return res.json({ success: true, message: "Mã hợp lệ" });
});


///API quay
router.post("/spin", async (req, res) => {
  const { code } = req.body;

  const codeEntry = await Code.findOne({ code });
  if (!codeEntry || codeEntry.used) {
    return res.status(400).json({ success: false, message: "Mã không hợp lệ hoặc đã sử dụng" });
  }

  if (codeEntry.promoCode && codeEntry.used) {
    return res.status(400).json({
      success: false,
      message: `🎉 Mã dự thưởng này đã được sử dụng trước đó.\n👉 Phần thưởng của bạn: *${codeEntry.reward}*\n🔑 Mã khuyến mãi: *${codeEntry.promoCode}*`
    });
  }

  let selectedReward = null;

  // ✅ Nếu mã có rewardId → chọn đúng giải đã gán
  if (codeEntry.rewardId) {
    selectedReward = await Reward.findById(codeEntry.rewardId);
    if (!selectedReward) {
      return res.status(400).json({ success: false, message: "Giải thưởng đã gán không còn tồn tại" });
    }
  } else {
    // ✅ Nếu không có rewardId → quay random như logic cũ
    const rewards = await Reward.find({ isFake: { $ne: true }, chance: { $gt: 0 } });
    if (!rewards.length) {
      return res.status(500).json({ success: false, message: "Không có phần thưởng hợp lệ nào" });
    }

    const totalChance = rewards.reduce((sum, r) => sum + r.chance, 0);
    let rand = Math.random() * totalChance;
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
  }

  // ✅ Lấy mã khuyến mãi chưa dùng
  const rewardCode = await RewardCode.findOneAndUpdate(
    { rewardId: selectedReward._id, used: false },
    { used: true, usedAt: new Date() },
    { new: true }
  );

  if (!rewardCode) {
    return res.status(500).json({ success: false, message: "Phần thưởng đã hết mã khuyến mãi!" });
  }

  // ✅ Đánh dấu mã đã dùng
  codeEntry.used = true;
  codeEntry.usedAt = new Date();
  codeEntry.promoCode = rewardCode.code;
  codeEntry.reward = selectedReward.label;
  await codeEntry.save();

  // ✅ Ghi log
  await new SpinLog({
    code,
    reward: selectedReward.label,
    createdAt: new Date()
  }).save();

   // ✅ Gửi Telegram
  const mask = (str) => str.length > 5 ? str.slice(0, -5) + '*****' : '*****';
  const telegramMessage = `
🎉 *Người chơi vừa trúng thưởng!*
- 🎁 Giải: *${selectedReward.label}*
- 🔑 Mã KM: \`${mask(rewardCode.code)}\`
- 🔤 Mã quay: \`${mask(code)}\`
`.trim();

  axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHAT_ID,
    text: telegramMessage,
    parse_mode: 'Markdown'
  }, {
    timeout: 5000,
    family: 4
  }).catch(err => {
    console.error('[Telegram Send Error]', err.message || err);
  });
  
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

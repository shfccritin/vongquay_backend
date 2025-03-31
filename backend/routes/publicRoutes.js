const express = require("express");
const router = express.Router();
const Reward = require("../models/Reward");

router.get("/rewards", async (req, res) => {
  try {
    const rewards = await Reward.find({});
    res.json(rewards);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy giải thưởng" });
  }
});

module.exports = router;

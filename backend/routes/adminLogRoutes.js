const express = require("express");
const router = express.Router();
const SpinLog = require("../models/SpinLog");
const jwt = require("jsonwebtoken");


// Lấy danh sách log kèm bộ lọc
router.get("/", async (req, res) => {
  const { code, reward, date } = req.query;
  const filter = {};
  if (code) filter.code = { $regex: code, $options: "i" };
  if (reward) filter.reward = { $regex: reward, $options: "i" };
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    filter.createdAt = { $gte: start, $lt: end };
  }
  const logs = await SpinLog.find(filter).sort({ createdAt: -1 });
  res.json(logs);
});

module.exports = router;

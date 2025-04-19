const express = require('express');
const router = express.Router();
const LiveSchedule = require('../models/LiveSchedule');
const jwt = require('jsonwebtoken')

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

// 📌 Lấy tất cả lịch
router.get('/schedules', auth, async (req, res) => {
  const schedules = await LiveSchedule.find().sort({ time: 1 });
  res.json(schedules);
});

// 📌 Thêm mới
router.post('/schedules', auth, async (req, res) => {
  const schedule = await LiveSchedule.create(req.body);
  res.json(schedule);
});

// 📌 Cập nhật
router.put('/schedules/:id', auth, async (req, res) => {
  const schedule = await LiveSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(schedule);
});

// 📌 Xoá
router.delete('/schedules/:id', auth, async (req, res) => {
  await LiveSchedule.findByIdAndDelete(req.params.id);
  res.json({ message: 'Đã xoá' });
});

module.exports = router;

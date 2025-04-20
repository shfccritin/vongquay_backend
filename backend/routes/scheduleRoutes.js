const express = require('express');
const router = express.Router();
const LiveSchedule = require('../models/LiveSchedule');
const jwt = require('jsonwebtoken');

// Middleware xác thực JWT
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: 'Thiếu token hoặc sai định dạng' });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

// 📌 Lấy tất cả lịch
router.get('/schedules', auth, async (req, res) => {
  try {
    const schedules = await LiveSchedule.find().sort({ time: 1 });
    res.json(schedules);
  } catch (err) {
    console.error('❌ Lỗi lấy lịch:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách lịch' });
  }
});

// 📌 Thêm mới
router.post('/schedules', auth, async (req, res) => {
  try {
    const { blv, time, date, game, link, countdown } = req.body;
    if (!blv || !time || !date) {
      return res.status(400).json({ message: 'Thiếu thông tin lịch' });
    }

    const schedule = await LiveSchedule.create({ blv, time, date, game, link, countdown });
    res.status(201).json(schedule);
  } catch (err) {
    console.error('❌ Lỗi thêm lịch:', err);
    res.status(500).json({ message: 'Lỗi server khi thêm lịch' });
  }
});

// 📌 Cập nhật
router.put('/schedules/:id', auth, async (req, res) => {
  try {
    const updated = await LiveSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy lịch cần cập nhật' });

    res.json(updated);
  } catch (err) {
    console.error('❌ Lỗi cập nhật lịch:', err);
    res.status(500).json({ message: 'Lỗi server khi cập nhật lịch' });
  }
});

// 📌 Xoá
router.delete('/schedules/:id', auth, async (req, res) => {
  try {
    const deleted = await LiveSchedule.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy lịch để xoá' });

    res.json({ message: '✅ Đã xoá thành công' });
  } catch (err) {
    console.error('❌ Lỗi xoá lịch:', err);
    res.status(500).json({ message: 'Lỗi server khi xoá lịch' });
  }
});

module.exports = router;

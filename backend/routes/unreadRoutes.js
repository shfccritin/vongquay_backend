const express = require('express');
const router = express.Router();
const MessageLog = require('../models/MessageLog');
const jwt = require('jsonwebtoken')
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ JWT verify failed:', err.message);
    return res.sendStatus(403);
  }
};
router.get('/unread-map',auth, async (req, res) => {
  try {
    const unreadCounts = await MessageLog.aggregate([
      { $match: { direction: 'user', isRead: false } },
      {
        $group: {
          _id: '$telegramId',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {};
    unreadCounts.forEach(item => {
      result[item._id] = item.count;
    });

    res.json(result);
  } catch (err) {
    console.error('❌ Lỗi unread-map:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

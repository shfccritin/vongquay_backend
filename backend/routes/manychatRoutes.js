const express = require('express');
const router = express.Router();
const ManychatUser = require('../models/ManychatUser');



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


// Validate: chỉ nhận chuỗi số (ID của ManyChat)
const isValidSubscriberId = (id) => /^[0-9]{5,}$/.test(id);

// POST /manychat/collect
router.post('/collect',auth, async (req, res) => {
  const { subscriber_id } = req.body;

  if (!subscriber_id || !isValidSubscriberId(subscriber_id)) {
    return res.status(400).json({ message: '❌ Invalid or missing subscriber_id' });
  }

  try {
    // Chỉ lưu subscriber_id nếu chưa có
    const existing = await ManychatUser.findOne({ subscriber_id });
    if (existing) {
      return res.status(200).json({ message: '☑️ User already exists — skipped' });
    }

    await ManychatUser.create({ subscriber_id });
    return res.status(200).json({ message: '✅ New subscriber saved' });
  } catch (err) {
    console.error('❌ Error saving subscriber:', err);
    return res.status(500).json({ message: '❌ Internal server error' });
  }
});

router.post('/batch',auth, async (req, res) => {
    const { ids } = req.body;
  
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: '❌ Dữ liệu không hợp lệ' });
    }
  
    let saved = 0;
    let skipped = 0;
    let failed = 0;
  
    for (const rawId of ids) {
      const subscriber_id = rawId?.toString().trim();
      if (!subscriber_id || !/^[0-9]{5,}$/.test(subscriber_id)) {
        failed++;
        continue;
      }
  
      try {
        const existing = await ManychatUser.findOne({ subscriber_id });
        if (existing) {
          skipped++;
        } else {
          await ManychatUser.create({ subscriber_id });
          saved++;
        }
      } catch (err) {
        failed++;
        console.error(`❌ Gửi lỗi ID ${subscriber_id}:`, err.message);
      }
    }
  
    return res.json({ saved, skipped, failed });
  });
  

module.exports = router;

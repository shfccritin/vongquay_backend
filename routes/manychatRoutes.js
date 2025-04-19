const express = require('express');
const router = express.Router();
const ManychatUser = require('../models/ManychatUser');

// Validate: chỉ nhận chuỗi số (vì ID ManyChat là số rất dài)
const isValidSubscriberId = (id) => /^[0-9]{5,}$/.test(id);

// POST /manychat/collect
router.post('/collect', async (req, res) => {
  const { subscriber_id, name, tag } = req.body;

  if (!subscriber_id || !isValidSubscriberId(subscriber_id)) {
    return res.status(400).json({ message: '❌ Invalid or missing subscriber_id' });
  }

  if (name && typeof name !== 'string') {
    return res.status(400).json({ message: '❌ Invalid name format' });
  }

  if (tag && typeof tag !== 'string') {
    return res.status(400).json({ message: '❌ Invalid tag format' });
  }

  try {
    await ManychatUser.findOneAndUpdate(
      { subscriber_id },
      { name, tag },
      { upsert: true, new: true }
    );

    return res.status(200).json({ message: '✅ Saved user successfully' });
  } catch (err) {
    console.error("❌ Error saving ManyChat user:", err);
    return res.status(500).json({ message: '❌ Internal server error' });
  }
});

module.exports = router;

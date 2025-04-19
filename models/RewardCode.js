// models/RewardCode.js
const mongoose = require('mongoose');

const RewardCodeSchema = new mongoose.Schema({
  rewardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reward',
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  used: {
    type: Boolean,
    default: false,
  },
  usedAt: Date
});

module.exports = mongoose.model('RewardCode', RewardCodeSchema);

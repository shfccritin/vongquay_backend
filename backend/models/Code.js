const mongoose = require("mongoose");

const codeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  used: { type: Boolean, default: false },
  usedAt: { type: Date, default: null },
  isget: { type: Boolean, default: false },
  promoCode: { type: String, default: '' },
  rewardId: { type: mongoose.Schema.Types.ObjectId, ref: "Reward", required: false, default: null }
});

module.exports = mongoose.model("Code", codeSchema);

const mongoose = require("mongoose");

const spinLogSchema = new mongoose.Schema({
  code: String,
  reward: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SpinLog", spinLogSchema);

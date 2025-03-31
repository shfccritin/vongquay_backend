const mongoose = require("mongoose");

const rewardSchema = new mongoose.Schema({
  label: String,
  chance: Number,
  image: String,
  isFake: Boolean,
});

module.exports = mongoose.model("Reward", rewardSchema);

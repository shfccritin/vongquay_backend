const mongoose = require("mongoose");

const codeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  used: { type: Boolean, default: false },
  usedAt: { type: Date, default: null },
});

module.exports = mongoose.model("Code", codeSchema);

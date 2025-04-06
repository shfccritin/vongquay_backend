const mongoose = require("mongoose");

const codeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  used: { type: Boolean, default: false },
  usedAt: { type: Date, default: null },
  isget: {type:Boolean,default:false},
  promoCode:{type:String,default:''}
});

module.exports = mongoose.model("Code", codeSchema);

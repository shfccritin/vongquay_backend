const mongoose = require('mongoose');

const LiveScheduleSchema = new mongoose.Schema({
  time: { type: String, required: true }, // ví dụ: "14h"
  blv: { type: String, required: true },  // ví dụ: "baoka"
  countdown: { type: Number, default: 10 }, // phút trước khi gửi
  game: { type: String, required: true }, // ví dụ: "nổ hũ"
  link: { type: String }, // link livestream nếu có
  note: { type: String }, // ghi chú thêm nếu cần
  date: { type: String, required: true }, // ví dụ: "2025-04-17"
  sent: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('LiveSchedule', LiveScheduleSchema);

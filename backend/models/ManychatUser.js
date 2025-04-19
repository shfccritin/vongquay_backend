const mongoose = require('mongoose');

const ManychatUserSchema = new mongoose.Schema({
  subscriber_id: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  tag: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ManychatUser', ManychatUserSchema);

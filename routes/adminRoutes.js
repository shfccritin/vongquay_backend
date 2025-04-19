const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const found = await User.findOne({ username });
    if (!found) return res.status(401).json({ message: "Sai tài khoản" });

    const match = await bcrypt.compare(password, found.password);
    if (!match) return res.status(401).json({ message: "Sai mật khẩu" });

  const token = jwt.sign({ id: found._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

  res.json({ token })
});




module.exports = router;

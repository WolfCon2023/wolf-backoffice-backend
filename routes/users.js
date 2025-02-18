const express = require("express");
const User = require("../models/User");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Get All Users (Protected)
router.get("/", verifyToken, async (req, res) => {
  try {
    console.log("🔍 Fetching users...");
    const users = await User.find().select("-password"); // Exclude password
    console.log("✅ Users fetched:", users);
    res.json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

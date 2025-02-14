const express = require("express");
const User = require("../models/User");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// GET all users (Protected)
router.get("/", verifyToken, async (req, res) => {
    try {
        const users = await User.find().select("-password"); // Exclude password from response
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;

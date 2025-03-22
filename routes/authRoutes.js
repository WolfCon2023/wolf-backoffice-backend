const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { loginUser, registerUser } = require("../controllers/authController");
const verifyToken = require('../middleware/authMiddleware');

// Login route
router.post('/login', loginUser);

// Register route (🔐 now protected with verifyToken)
router.post('/register', verifyToken, async (req, res) => {
  try {
    console.log("📝 Incoming registration request body:", req.body);
    console.log("🔑 Request headers:", {
      ...req.headers,
      authorization: req.headers.authorization ? '[REDACTED]' : undefined
    });

    if (req.headers['x-admin-creation'] === 'true') {
      console.log("👑 Admin creation request detected");
      if (!req.body.username || !req.body.firstName || !req.body.lastName) {
        return res.status(400).json({
          error: "Missing required fields for admin creation",
          details: {
            username: !req.body.username,
            firstName: !req.body.firstName,
            lastName: !req.body.lastName
          }
        });
      }
    }

    await registerUser(req, res);
  } catch (error) {
    console.error("❌ Registration error:", {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: "Failed to register user" });
  }
});

module.exports = router;

const express = require("express");
const { loginUser, registerUser } = require("../controllers/authController"); // ✅ Ensure path is correct

const router = express.Router();

// ✅ Register New User
router.post("/register", registerUser);

// ✅ Login User
router.post("/login", loginUser);

module.exports = router;

const express = require("express");
const User = require("../models/User");
const verifyToken = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");

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

// ✅ Get Single User (Protected)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Fetching user with ID:", id);
    
    const user = await User.findById(id).select("-password");
    if (!user) {
      console.log("❌ User not found:", id);
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log("✅ User fetched:", user);
    res.json(user);
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Create New User (Protected)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, contactNumber } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      contactNumber
    });

    await newUser.save();
    
    // Return user without password
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    console.log("✅ User created:", userResponse);
    res.status(201).json(userResponse);
  } catch (error) {
    console.error("❌ Error creating user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Update User (Protected)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔄 Updating user with ID:", id);

    // Check if the user exists
    const user = await User.findById(id);
    if (!user) {
      console.log("❌ User not found:", id);
      return res.status(404).json({ message: "User not found" });
    }

    // If password is being updated, hash it
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }

    // Update user fields
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select("-password"); // Exclude password from response

    console.log("✅ User updated successfully:", updatedUser);
    res.json(updatedUser);
  } catch (error) {
    console.error("❌ Error updating user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Delete User (Protected)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🗑️ Deleting user with ID:", id);

    const user = await User.findById(id);
    if (!user) {
      console.log("❌ User not found:", id);
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(id);
    console.log("✅ User deleted successfully");
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;

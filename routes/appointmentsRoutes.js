console.log("🔍 Appointments Routes Loaded");
const express = require("express");
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const User = require("../models/User"); // ✅ Ensure User model is imported

const router = express.Router();

// ✅ API to Create an Appointment (Auto-Populate Scheduled By)
router.post("/", async (req, res) => {
  try {
    console.log("Received Appointment Data:", req.body); // Debugging Log

    // Validate required fields
    const { title, date, scheduledByUserId } = req.body;
    if (!title || !date || !scheduledByUserId) {
      return res.status(400).json({ message: "Title, Date, and scheduledByUserId are required." });
    }

    // ✅ Fetch User Details
    const user = await User.findById(scheduledByUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Format `scheduledBy` field with User Info
    const scheduledBy = `${user.firstName} ${user.lastName} (${user.email})`;

    // ✅ Create new appointment
    const newAppointment = new Appointment({
      ...req.body,
      scheduledBy, // ✅ Store formatted user details
    });

    await newAppointment.save();
    res.status(201).json({ message: "Appointment created successfully", appointment: newAppointment });
  } catch (error) {
    console.error("❌ Error creating appointment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router; // ✅ Ensure this is correctly exported

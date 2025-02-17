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

// ✅ API to Fetch All Appointments with Pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const appointments = await Appointment.find()
      .sort({ date: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);

    const totalAppointments = await Appointment.countDocuments();
    const totalPages = Math.ceil(totalAppointments / limit);

    res.status(200).json({ appointments, totalPages });
  } catch (error) {
    console.error("❌ Error fetching appointments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ API to Fetch Historical Appointments Based on Date Range
router.get("/history", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required." });
    }

    const historicalAppointments = await Appointment.find({
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    }).sort({ date: -1 });

    res.status(200).json(historicalAppointments);
  } catch (error) {
    console.error("❌ Error fetching historical appointments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router; // ✅ Ensure this is correctly exported

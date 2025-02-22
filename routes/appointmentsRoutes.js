const express = require("express");
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// POST route to create a new appointment
router.post("/", verifyToken, async (req, res) => {
  try {
    const newAppointment = new Appointment(req.body);
    const savedAppointment = await newAppointment.save();
    console.log("✅ Appointment Created:", savedAppointment);
    res.status(201).json(savedAppointment);
  } catch (error) {
    console.error("❌ Error creating appointment:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET route to retrieve appointments within a date range (excluding those marked for deletion)
router.get("/", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      console.log("❌ Missing startDate or endDate");
      return res.status(400).json({ message: "Start date and end date are required." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.log(`❌ Invalid date format: startDate=${startDate}, endDate=${endDate}`);
      return res.status(400).json({ message: "Invalid date format provided." });
    }

    console.log(`🔍 Fetching appointments between ${start.toISOString()} and ${end.toISOString()}`);

    if (mongoose.connection.readyState !== 1) {
      console.error("❌ MongoDB is not connected!");
      return res.status(500).json({ message: "Database connection issue" });
    }

    const appointments = await Appointment.find({
      date: { $gte: start, $lte: end },
      toBeDeleted: { $ne: true }
    }).sort({ date: -1 });

    console.log("✅ Fetched appointments:", appointments);
    res.status(200).json(appointments);
  } catch (error) {
    console.error("❌ Error querying appointments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET route to fetch a single appointment by ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Fetching appointment with ID:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("❌ Invalid ObjectId format");
      return res.status(400).json({ message: "Invalid appointment ID format." });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      console.log("❌ Appointment Not Found:", id);
      return res.status(404).json({ message: "Appointment not found" });
    }

    console.log("✅ Appointment Found:", appointment);
    res.status(200).json(appointment);
  } catch (error) {
    console.error("❌ Error fetching appointment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;

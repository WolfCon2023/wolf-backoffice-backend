const express = require("express");
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Ensure `/history` is defined **before** `/:id` routes
router.get("/history", verifyToken, async (req, res) => {
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

    // ✅ Check if "history" is being mistaken for an ObjectId
    console.log("🔍 Params received:", req.params);
    console.log("🔍 Query received:", req.query);

    const historicalAppointments = await Appointment.find({
      date: { $gte: start, $lte: end },
    }).sort({ date: -1 });

    console.log("✅ Fetched appointments:", historicalAppointments);
    res.status(200).json(historicalAppointments);
  } catch (error) {
    console.error("❌ Error querying historical appointments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// ✅ Ensure this is BELOW `/history`, otherwise "history" is treated as an ID
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

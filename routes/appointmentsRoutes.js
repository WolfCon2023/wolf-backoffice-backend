const express = require("express");
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// NEW: GET route for historical appointments
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
    console.log(`🔍 Fetching historical appointments between ${start.toISOString()} and ${end.toISOString()}`);
    const appointments = await Appointment.find({
      date: { $gte: start, $lte: end },
      toBeDeleted: { $ne: true }
    }).sort({ date: -1 });
    console.log("✅ Fetched historical appointments:", appointments);
    res.status(200).json(appointments);
  } catch (error) {
    console.error("❌ Error querying historical appointments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Existing POST route to create an appointment
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

// Existing GET route for appointments (requires query parameters)
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

// GET route for a single appointment by ID
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

// PUT route to update an appointment by ID
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔄 Updating appointment with ID:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("❌ Invalid ObjectId format");
      return res.status(400).json({ message: "Invalid appointment ID format." });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedAppointment) {
      console.log("❌ Appointment Not Found:", id);
      return res.status(404).json({ message: "Appointment not found" });
    }

    console.log("✅ Appointment Updated:", updatedAppointment);
    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.error("❌ Error updating appointment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// NEW: DELETE route for an appointment by ID
// Instead of physically deleting the record, this route sets the "toBeDeleted" flag to true.
router.delete("/:id", verifyToken, async (req, res) => {
  console.log("DELETE route reached for appointment", req.params.id);
  try {
    const { id } = req.params;
    console.log("🔍 Marking appointment as deleted with ID:", id);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("❌ Invalid ObjectId format");
      return res.status(400).json({ message: "Invalid appointment ID format." });
    }
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      console.log("❌ Appointment Not Found:", id);
      return res.status(404).json({ message: "Appointment not found" });
    }
    appointment.toBeDeleted = true;
    await appointment.save();
    console.log("✅ Appointment marked as deleted:", appointment);
    res.status(200).json({ message: "Appointment marked as deleted" });
  } catch (error) {
    console.error("❌ Error marking appointment as deleted:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
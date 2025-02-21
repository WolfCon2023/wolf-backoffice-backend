const express = require("express");
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ API to Fetch All Appointments with Pagination
router.get("/", verifyToken, async (req, res) => {
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

// ✅ API to Fetch a Single Appointment by ID
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Fetching appointment with ID:", id);

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

// ✅ API to Create an Appointment
router.post("/", verifyToken, async (req, res) => {
  try {
    console.log("🔍 Received Appointment Data:", req.body); // Debugging Log

    // Validate required fields
    const { title, date, scheduledByUserId } = req.body;
    if (!title || !date || !scheduledByUserId) {
      return res.status(400).json({ message: "Title, Date, and scheduledByUserId are required." });
    }

    const newAppointment = new Appointment({ ...req.body });
    await newAppointment.save();
    res.status(201).json({ message: "Appointment created successfully", appointment: newAppointment });
  } catch (error) {
    console.error("❌ Error creating appointment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// ✅ API to Update an Appointment (Handles Soft Delete)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    console.log("🔍 Update Request Received for ID:", id, "Data:", updatedData);

    // ✅ Allow updating the `toBeDeleted` flag
    const updatedAppointment = await Appointment.findByIdAndUpdate(id, updatedData, { new: true });

    if (!updatedAppointment) {
      console.log("❌ Appointment Not Found:", id);
      return res.status(404).json({ message: "Appointment not found" });
    }

    console.log("✅ Appointment Updated Successfully:", updatedAppointment);
    res.json({ message: "Appointment updated successfully", appointment: updatedAppointment });
  } catch (error) {
    console.error("❌ Error updating appointment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;

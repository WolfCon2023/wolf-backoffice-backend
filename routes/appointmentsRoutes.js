console.log("🔍 Appointments Routes Loaded");
const express = require("express");
const Appointment = require("../models/Appointment"); // Ensure model is imported

const router = express.Router();

// ✅ API to Get All Appointments
router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find(); // Fetch all appointments
    res.status(200).json(appointments);
  } catch (error) {
    console.error("❌ Error fetching appointments:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ API to Create an Appointment
router.post("/", async (req, res) => {
  try {
    console.log("Received Appointment Data:", req.body); // Debugging Log

    // Validate required fields
    const { title, date, scheduledBy } = req.body;
    if (!title || !date || !scheduledBy) {
      return res.status(400).json({ message: "Title, Date, and Scheduled By are required." });
    }

    // Create new appointment
    const newAppointment = new Appointment(req.body);
    await newAppointment.save();
    res.status(201).json({ message: "Appointment created successfully", appointment: newAppointment });
  } catch (error) {
    console.error("❌ Error creating appointment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router; // ✅ Ensure this is correctly exported

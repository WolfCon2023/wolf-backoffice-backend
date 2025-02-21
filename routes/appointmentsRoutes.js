const express = require("express");
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

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

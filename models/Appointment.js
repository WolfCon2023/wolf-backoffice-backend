const mongoose = require("mongoose"); // ✅ Import mongoose

const AppointmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String },
    contactName: { type: String },
    contactPhone: { type: String },
    contactEmail: { type: String },
    scheduledBy: { type: String, required: true },
    notes: { type: String }
}, { collection: "appointments" }); // ✅ Explicitly set the collection name

module.exports = mongoose.model("Appointment", AppointmentSchema);
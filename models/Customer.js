const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    businessEmail: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    productLines: { type: String, required: true },
    notes: { type: String, default: "" },
    lastInteraction: { type: Date, default: Date.now },
    assignedRep: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    highValue: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
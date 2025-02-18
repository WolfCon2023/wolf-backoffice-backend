const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  employeeId: { type: String, unique: true, default: function() {
    return `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
  }},
  firstName: { type: String, required: true },  // ✅ New Field
  lastName: { type: String, required: true },   // ✅ New Field
  contactNumber: { type: String, required: false } // ✅ New Field (optional)
}, { timestamps: true });

// ✅ Hash password before saving to DB
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.error("Error hashing password:", error);
    next(error);
  }
});

// ✅ Method to Compare Passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
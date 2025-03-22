const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  employeeId: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (value) {
        return /^EMP-\d{4,}$/.test(value);
      },
      message: props => `${props.value} is not a valid employee ID. Format must be EMP-1234`
    },
    default: function () {
      const generatedId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      console.log("🔧 Generated employeeId:", generatedId);
      return generatedId;
    },
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  contactNumber: { type: String, required: false },
  department: {
    type: String,
    enum: ['Information Technology', 'Product', 'QA', 'Business', 'HR'],
    required: false,
    default: 'Information Technology',
  },
  title: { type: String, required: false, default: '' },
  role: {
    type: String,
    enum: ['Developer', 'Scrum Master', 'Product Owner', 'Business Analyst', 'QA Tester'],
    required: false,
    default: 'Developer',
  }
}, { timestamps: true });

// 🔐 Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    console.log("🔐 Hashing password for:", this.email);
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log("✅ Password hashed successfully for:", this.email);
    next();
  } catch (error) {
    console.error("🔥 Error hashing password:", {
      message: error.message,
      stack: error.stack
    });
    next(error);
  }
});

// 🔍 Compare entered password with hashed one
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);

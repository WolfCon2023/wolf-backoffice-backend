require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Import Models
require("./models/User");
require("./models/Appointment");

// Import Routes
const authRoutes = require("./routes/auth");
const verifyToken = require("./middleware/authMiddleware");
const customerRoutes = require("./routes/customers");
const userRoutes = require("./routes/users");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Set the port to use Railway’s assigned port (Default to 8080)
const port = process.env.PORT || 8080;

// ✅ Log MongoDB URI (without exposing the password)
console.log("🔍 MongoDB URI:", process.env.MONGO_URI.replace(/:\/\/.*@/, "://[HIDDEN]@"));

// ✅ Enable Mongoose `strictQuery` Mode (Avoid Future Deprecation Warnings)
mongoose.set("strictQuery", false);

// ✅ Connect to MongoDB with `authMechanism` Fix for Railway
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    authMechanism: "SCRAM-SHA-256", // ✅ Fix for authentication failure
    serverSelectionTimeoutMS: 5000, // ✅ Prevent long startup delays
  })
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Exit process if MongoDB fails to connect
  });

// Base Route ✅ Verify the Backend is Running
app.get("/", (req, res) => {
  res.send("🚀 Backend Server is running on port " + port);
});

// Authentication Routes
app.use("/api/auth", authRoutes);

// API Routes
app.use("/api/customers", customerRoutes);
app.use("/api/users", userRoutes);

// Protected Route Example
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({ message: `Welcome, ${req.user.username}! This is a protected route.` });
});

// Appointment Routes ✅ Fetching from MongoDB
app.get("/api/appointments", verifyToken, async (req, res) => {
  try {
    const appointments = await mongoose.model("Appointment").find();
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch appointments." });
  }
});

// Global Error Handling
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
});

app.get("/api/test", (req, res) => {
  res.json({ message: "✅ API is working!" });
});

// ✅ Start Express Server with Railway’s Assigned Port
app.listen(port, () => console.log(`🚀 Backend Server running on port ${port}`));

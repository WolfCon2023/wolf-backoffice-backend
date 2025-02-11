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

// Set the port for Express (use 3000 by default)
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // ✅ Prevents long startup delays
}).then(() => console.log("✅ MongoDB connected successfully!"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Base Route
app.get("/", (req, res) => {
    res.send("🚀 Backend Server is running on port " + port);
});

// Authentication Routes
app.use("/api/auth", authRoutes);

// API Routes
app.use("/api/customers", customerRoutes);
app.use("/api/users", userRoutes); // ✅ Added user routes

// Protected Route Example
app.get("/api/protected", verifyToken, (req, res) => {
    res.json({ message: `Welcome, ${req.user.username}! This is a protected route.` });
});

// Appointment Routes (Mock Example)
app.get("/api/appointments", verifyToken, (req, res) => {
    res.json([
        { title: "Doctor Visit", date: "2024-06-30" },
        { title: "Business Meeting", date: "2024-07-05" }
    ]);
});

// Customer Routes (Mock Example)
app.get("/api/customers", verifyToken, (req, res) => {
    res.json([
        { id: 1, first_name: "John", last_name: "Doe", email: "john@example.com" },
        { id: 2, first_name: "Jane", last_name: "Smith", email: "jane@example.com" }
    ]);
});

// Global Error Handling
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
});

// Start Express Server
app.listen(port, () => console.log(`🚀 Backend server running on port ${port}`));

require('dotenv').config(); 
const express = require('express'); 
const mongoose = require('mongoose'); 
const cors = require('cors'); 
const app = express(); 
app.use(cors()); 
app.use(express.json()); 
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }) 


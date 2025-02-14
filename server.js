require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Import Models
require("./models/User");
require("./models/Appointment");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/users");
const verifyToken = require("./middleware/authMiddleware");

const app = express();
app.use(cors());
app.use(express.json());

// Set the port dynamically
const port = process.env.PORT || 8080;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected successfully!"))
.catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", verifyToken, userRoutes); // Secure user routes

// Test API
app.get("/api/test", (req, res) => {
    res.json({ message: "API is working!" });
});

// Global Error Handling
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection:", reason);
});

// Start Server
app.listen(port, () => console.log(`Server running on port ${port}`));

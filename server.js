require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Set Mongoose strictQuery mode to prevent warnings
mongoose.set("strictQuery", false);

const app = express();
app.use(cors());
app.use(express.json());

// Load environment variables
const mongoURI = process.env.MONGO_URI;
const port = process.env.PORT || 8080;

if (!mongoURI) {
    console.error("❌ Error: MONGO_URI is not defined in the environment variables.");
    process.exit(1);
}

// Connect to MongoDB
mongoose
    .connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connected successfully!"))
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    });

// Import Models
require("./models/User");
require("./models/Appointment");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/users");
const verifyToken = require("./middleware/authMiddleware");

// ✅ Root Route (Fix for "Cannot GET /")
app.get("/", (req, res) => {
    res.send("<h1>Welcome to the Wolf Backoffice Suite API</h1><p>Visit <a href='/api/test'>/api/test</a> to check API status.</p>");
});

// ✅ Test API Route (Ensures API is running)
app.get("/api/test", (req, res) => {
    res.json({ message: "API is working!" });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", verifyToken, userRoutes);

// Start Server
app.listen(port, "0.0.0.0", () => console.log(`🚀 Server running on port ${port}`));
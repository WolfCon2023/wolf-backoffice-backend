require("dotenv").config();
console.log("🔍 Loaded JWT_SECRET:", process.env.JWT_SECRET ? "Exists" : "MISSING"); // Debugging log

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentsRoutes");
const userRoutes = require("./routes/users");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB
const mongoURI = process.env.MONGO_URI;
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// ✅ Register API Routes BEFORE Serving Frontend
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/users", userRoutes);

// ✅ Test API Route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// ✅ Serve React Frontend ONLY for non-API requests
const buildPath = path.join(__dirname, "build");

if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));

  app.get("*", (req, res) => {
    if (req.originalUrl.startsWith("/api")) {
      return res.status(404).json({ message: "API route not found" });
    }
    console.log(`✅ Serving frontend: ${buildPath}/index.html`);
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  console.warn("⚠️ Frontend build folder not found. Skipping frontend serving.");
}

// ✅ Start the backend server
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`🚀 Backend running on port ${port}`));

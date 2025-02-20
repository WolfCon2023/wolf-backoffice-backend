require("dotenv").config();
console.log("🔍 Loaded JWT_SECRET:", process.env.JWT_SECRET ? "Exists" : "MISSING"); // Debugging log

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentsRoutes");
const userRoutes = require("./routes/users"); // ✅ Ensure this is imported

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
  process.exit(1); // Exit if connection fails
});

// ✅ Register API Routes
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/users", userRoutes); // ✅ Ensure this is registered

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// ✅ Serve frontend
const buildPath = path.join(__dirname, "build");
app.use(express.static(buildPath));

app.get("*", (req, res) => {
  const indexPath = path.join(buildPath, "index.html");
  console.log(`✅ Serving frontend: ${indexPath}`);

  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("❌ Error serving index.html:", err.message);
      res.status(500).send("Error loading frontend.");
    }
  });
});

// ✅ Start the backend server
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`🚀 Backend running on port ${port}`));
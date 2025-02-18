require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentsRoutes");

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

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// ✅ Serve frontend
const buildPath = path.join(__dirname, "build");
app.use(express.static(buildPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"), (err) => {
    if (err) {
      res.status(500).send("Error loading frontend.");
    }
  });
});

// ✅ Start the server AFTER connecting to MongoDB
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`🚀 Backend running on port ${port}`));

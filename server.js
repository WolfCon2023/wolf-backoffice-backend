require("dotenv").config();
console.log("🔍 Loaded JWT_SECRET:", process.env.JWT_SECRET ? "Exists" : "MISSING");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentsRoutes");
const userRoutes = require("./routes/users");
const customerRoutes = require("./routes/customers");
const projectRoutes = require("./routes/projectRoutes");
const teamRoutes = require("./routes/teamRoutes");
const sprintRoutes = require("./routes/sprintRoutes");
const storyRoutes = require("./routes/storyRoutes");
const taskRoutes = require("./routes/taskRoutes");
const defectRoutes = require("./routes/defectRoutes");

const app = express();

// Request logging middleware (moved to top)
app.use((req, res, next) => {
  console.log(`📡 Incoming Request: ${req.method} ${req.originalUrl}`);
  next();
});

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

// ✅ PRIORITIZE API ROUTES - Ensures Express processes these before frontend routes
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/sprints", sprintRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/defects", defectRoutes);

console.log("✅ Registered Route: /api/projects");
console.log("✅ Registered Route: /api/teams");
console.log("✅ Registered Route: /api/sprints");
console.log("✅ Registered Route: /api/stories");
console.log("✅ Registered Route: /api/tasks");
console.log("✅ Registered Route: /api/defects");
console.log("✅ Registered Route: /api/appointments");
console.log("✅ Registered Route: /api/users");
console.log("✅ Registered Route: /api/customers");

// ✅ Test API Route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// ✅ Serve Frontend (Only if the request is NOT an API request)
const buildPath = path.join(__dirname, "build");
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));

  app.get(/^\/(?!api\/).*/, (req, res) => {
    console.log(`✅ Serving frontend for: ${req.originalUrl}`);
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else {
  console.warn("⚠️ Frontend build folder not found. Skipping frontend serving.");
}

// ✅ Handle unknown API routes explicitly (moved to the end)
app.all("/api/*", (req, res) => {
  console.error(`❌ API Route Not Found: ${req.originalUrl}`);
  res.status(404).json({ message: "API route not found" });
});

// Debugging: Show all available routes
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(`➡️ Registered API Route: ${middleware.route.path}`);
  } else if (middleware.name === "router") {
    middleware.handle.stack.forEach((subMiddleware) => {
      if (subMiddleware.route) {
        console.log(`➡️ Registered API Route: ${subMiddleware.route.path}`);
      }
    });
  }
});

// ✅ Start the backend server
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`🚀 Backend running on port ${port}`));

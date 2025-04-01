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
const featureRoutes = require("./routes/featureRoutes");

const app = express();

// Request logging middleware (moved to top)
app.use((req, res, next) => {
  console.log(`📡 Incoming Request: ${req.method} ${req.originalUrl}`);
  console.log(`🔍 Request Headers:`, req.headers);
  console.log(`🔑 Authorization:`, req.headers.authorization ? 'Present' : 'Missing');
  next();
});

// CORS Configuration
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://wolf-backoffice-suite-development.up.railway.app',
      'https://urban-bassoon-q74xggwgqp5pfxp7w-5000.app.github.dev',
      'http://localhost:3000',
      'http://localhost:5000'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());

// Debug middleware to log route matching
app.use((req, res, next) => {
  console.log(`🔍 Attempting to match route: ${req.method} ${req.originalUrl}`);
  next();
});

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
app.use("/api/features", featureRoutes);

console.log("✅ Registered Route: /api/projects");
console.log("✅ Registered Route: /api/teams");
console.log("✅ Registered Route: /api/sprints");
console.log("✅ Registered Route: /api/stories");
console.log("✅ Registered Route: /api/tasks");
console.log("✅ Registered Route: /api/defects");
console.log("✅ Registered Route: /api/features");

// ✅ Test API Route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// ✅ Handle unknown API routes explicitly
app.all("/api/*", (req, res) => {
  console.error(`❌ API Route Not Found: ${req.originalUrl}`);
  res.status(404).json({ message: "API route not found" });
});

// ✅ Log all available API routes to debug missing endpoints
console.log("✅ Available API Routes:");
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(`➡️ ${middleware.route.path}`);
  } else if (middleware.name === "router") {
    // Get the base path from the router's regexp
    const basePath = middleware.regexp.toString()
      .replace(/^\/\^\\\//, '')  // Remove leading /^\
      .replace(/\\\//, '/')      // Replace escaped slash with regular slash
      .replace(/\/\$/, '')       // Remove trailing /$
      .replace(/\\\?/, '?')      // Replace escaped question mark
      .replace(/\/i$/, '')       // Remove trailing /i
      .replace(/\\\/\?\(\?=\\\/\\|\$\)/, ''); // Remove optional slash pattern
    
    middleware.handle.stack.forEach((subMiddleware) => {
      if (subMiddleware.route) {
        const path = subMiddleware.route.path;
        console.log(`➡️ ${basePath}${path}`);
      }
    });
  }
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

// Debugging: Show all available routes
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(`➡️ Registered API Route: ${middleware.route.path}`);
  } else if (middleware.name === "router") {
    // Get the base path from the router's regexp
    const basePath = middleware.regexp.toString()
      .replace(/^\/\^\\\//, '')  // Remove leading /^\
      .replace(/\\\//, '/')      // Replace escaped slash with regular slash
      .replace(/\/\$/, '')       // Remove trailing /$
      .replace(/\\\?/, '?')      // Replace escaped question mark
      .replace(/\/i$/, '')       // Remove trailing /i
      .replace(/\\\/\?\(\?=\\\/\\|\$\)/, ''); // Remove optional slash pattern
    
    middleware.handle.stack.forEach((subMiddleware) => {
      if (subMiddleware.route) {
        const path = subMiddleware.route.path;
        console.log(`➡️ Registered API Route: ${basePath}${path}`);
      }
    });
  }
});

// ✅ Start the backend server
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`🚀 Backend running on port ${port}`));

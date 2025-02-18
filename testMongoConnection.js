require("dotenv").config();
const mongoose = require("mongoose");

const mongoURI = process.env.MONGO_URI || "mongodb://mongo:tEWgucrvGpnciEAbGlGCfKKDggcewdtH.proxy.rlwy.net:56486/test";

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ MongoDB Connection Successful!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });


const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  console.log(`🔍 ${req.method} Request to ${req.originalUrl}`);

  const authHeader = req.header("Authorization");
  console.log("🔍 Received Authorization Header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("❌ No Token Provided or Incorrect Format");
    return res.status(403).json({ message: "Access Denied. No Token Provided" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    console.log("❌ Extracted Token is Undefined");
    return res.status(403).json({ message: "Access Denied. No Valid Token Found" });
  }

  console.log("🔍 Extracted Token:", token);

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`✅ Token Verified for User: ${JSON.stringify(verified)}`);
    req.user = verified;
    next();
  } catch (err) {
    console.log("❌ Invalid or Expired Token:", err.message);
    res.status(401).json({ message: "Invalid or Expired Token", error: err.message });
  }
};

module.exports = verifyToken;

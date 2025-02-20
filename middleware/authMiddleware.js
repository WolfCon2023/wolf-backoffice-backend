const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("❌ No Token Provided");
    return res.status(403).json({ message: "Access Denied. No Token Provided" });
  }

  const token = authHeader.split(" ")[1];
  console.log("🔍 Received Token:", token);

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`✅ Token Verified for User: ${JSON.stringify(req.user)}`);
    req.user = verified;
    next();
  } catch (err) {
    console.log("❌ Invalid or Expired Token:", err.message);
    res.status(401).json({ message: "Invalid or Expired Token", error: err.message });
  }
};

module.exports = verifyToken;

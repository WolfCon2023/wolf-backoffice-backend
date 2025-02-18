const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("❌ No Token Provided");
    return res.status(403).json({ message: "Access Denied. No Token Provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    console.log(`✅ Token Verified: ${JSON.stringify(req.user)}`);
    next();
  } catch (err) {
    console.log("❌ Invalid or Expired Token");
    res.status(401).json({ message: "Invalid or Expired Token" });
  }
};

module.exports = verifyToken;
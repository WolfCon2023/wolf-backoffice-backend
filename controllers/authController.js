const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// ✅ Generate JWT Token with a 12-hour expiration
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
};

// ✅ User Registration
exports.registerUser = async (req, res) => {
  const {
    username,
    email,
    password,
    firstName,
    lastName,
    contactNumber,
    role,
    department,
    title,
    employeeId
  } = req.body;

  console.log("📥 Registration request received:", {
    username,
    email,
    firstName,
    lastName,
    contactNumber,
    role,
    department,
    title,
    employeeId
  });

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (req.headers['x-admin-creation'] === 'true') {
      if (!username || !firstName || !lastName) {
        return res.status(400).json({
          message: "Username, first name, and last name are required for admin user creation"
        });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("⚠️ Email already registered:", email);
      return res.status(400).json({ message: "Email already registered" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      console.log("⚠️ Username already taken:", username);
      return res.status(400).json({ message: "Username already taken" });
    }

    // 👷 Prepare user data
    const userData = {
      username,
      email,
      password, // Raw password (schema handles hashing)
      firstName,
      lastName,
      contactNumber,
      role: role || 'Developer',
      department: department || 'Information Technology',
      title: title || role || 'Developer'
    };

    if (employeeId) {
      userData.employeeId = employeeId;
    }

    console.log("🛠 Creating user with data:", {
      ...userData,
      password: "[REDACTED]"
    });

    const newUser = new User(userData);

    try {
      await newUser.save();
    } catch (saveError) {
      console.error("🛑 Mongoose Save Error - Full Dump:", JSON.stringify(saveError, Object.getOwnPropertyNames(saveError), 2));
      throw saveError;
    }

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is not defined in environment variables.");
      return res.status(500).json({ message: "Server misconfiguration: JWT secret is missing" });
    }

    const token = generateToken(newUser);

    const response = {
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        contactNumber: newUser.contactNumber,
        employeeId: newUser.employeeId,
        role: newUser.role,
        department: newUser.department,
        title: newUser.title
      }
    };

    console.log("✅ Registration successful:", response);
    res.status(201).json(response);

  } catch (error) {
    const validationErrors = error?.errors
      ? Object.fromEntries(
          Object.entries(error.errors).map(([key, val]) => [key, val.message])
        )
      : null;

    console.error("🚨 Registration Error:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      validationErrors,
      cause: error.cause || null,
      jwtSecretPresent: !!process.env.JWT_SECRET
    });

    res.status(500).json({
      message: "Server error",
      error: error.message,
      name: error.name,
      stack: error.stack,
      validationErrors
    });
  }
};

// ✅ User Login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error("🚨 Login Error:", {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: error.stack
    });
  }
};

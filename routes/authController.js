const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "2h" } // Token expires in 2 hours
    );
};

// User Login
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = generateToken(user);
        res.json({ token, user: { id: user._id, username: user.username, email: user.email } });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

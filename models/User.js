const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

console.log("Loading User model...");

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, { timestamps: true });

// Hash password before saving to DB
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    console.log(`Hashing password for user: ${this.username}`);
    try {
        this.password = await bcrypt.hash(this.password, 10);
        console.log("Password hashed successfully.");
        next();
    } catch (error) {
        console.error("Error hashing password:", error);
        next(error);
    }
});

module.exports = mongoose.model("User", UserSchema);
console.log("User model is ready.");

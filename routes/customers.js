const express = require("express");
const verifyToken = require("../middleware/authMiddleware"); // ✅ Protect routes with JWT
const router = express.Router();

// Mock Customers Data (Replace with MongoDB later)
const customers = [
    { id: 1, first_name: "John", last_name: "Doe", email: "john@example.com" },
    { id: 2, first_name: "Jane", last_name: "Smith", email: "jane@example.com" }
];

// ✅ GET all customers (Protected)
router.get("/", verifyToken, (req, res) => {
    res.json(customers);
});

// ✅ GET a single customer by ID (Protected)
router.get("/:id", verifyToken, (req, res) => {
    const customer = customers.find(c => c.id === parseInt(req.params.id));
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
});

// ✅ POST a new customer (Protected)
router.post("/", verifyToken, (req, res) => {
    const { first_name, last_name, email } = req.body;
    if (!first_name || !last_name || !email) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const newCustomer = {
        id: customers.length + 1,
        first_name,
        last_name,
        email
    };

    customers.push(newCustomer);
    res.status(201).json(newCustomer);
});

module.exports = router;

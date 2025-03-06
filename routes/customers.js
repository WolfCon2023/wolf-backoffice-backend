const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const Customer = require("../models/Customer");
const router = express.Router();

console.log("✅ Customers API Route Loaded");

// ✅ GET all customers (Protected)
router.get("/", verifyToken, async (req, res) => {
    try {
        console.log("📡 Fetching all customers...");
        const dbCustomers = await Customer.find();
        
        if (!dbCustomers.length) {
            console.log("⚠️ No customers found.");
            return res.status(404).json({ message: "No customers found" });
        }

        res.json(dbCustomers);
    } catch (error) {
        console.error("❌ Error fetching customers:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ✅ SEARCH customers by field and query (Protected)
router.get("/search", verifyToken, async (req, res) => {
    const { field, query } = req.query;

    if (!field || !query) {
        return res.status(400).json({ message: "Search field and query are required" });
    }

    try {
        console.log(`📡 Searching customers by ${field} with query: ${query}`);
        
        let searchQuery = {};
        
        // Handle different search fields
        switch (field) {
            case "firstName":
            case "lastName":
            case "businessEmail":
            case "phoneNumber":
            case "productLines":
                searchQuery[field] = { $regex: query, $options: "i" };
                break;
            case "highValue":
                searchQuery.highValue = query.toLowerCase() === "true";
                break;
            default:
                return res.status(400).json({ message: "Invalid search field" });
        }

        const searchResults = await Customer.find(searchQuery);

        if (!searchResults.length) {
            console.log("⚠️ No matching customers found.");
            return res.status(404).json({ message: "No customers found matching the search criteria" });
        }

        res.json(searchResults);
    } catch (error) {
        console.error("❌ Error searching customers:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ✅ GET a single customer by ID (Protected)
router.get("/:id", verifyToken, async (req, res) => {
    try {
        console.log(`📡 Fetching customer with ID: ${req.params.id}`);
        const customer = await Customer.findById(req.params.id);
        
        if (!customer) {
            console.log("⚠️ Customer not found.");
            return res.status(404).json({ message: "Customer not found" });
        }

        res.json(customer);
    } catch (error) {
        console.error("❌ Error fetching customer:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ✅ POST a new customer (Protected)
router.post("/", verifyToken, async (req, res) => {
    console.log("📡 Received POST request at /api/customers");
    console.log("📡 Request Body:", req.body);

    const { firstName, lastName, businessEmail, phoneNumber, productLines, highValue } = req.body;
    if (!firstName || !lastName || !businessEmail || !phoneNumber || !productLines) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        console.log("📡 Adding new customer:", req.body);

        const newCustomer = new Customer({
            firstName,
            lastName,
            businessEmail,
            phoneNumber,
            productLines,
            highValue: highValue || false
        });

        await newCustomer.save();
        console.log("✅ New customer added:", newCustomer);
        res.status(201).json(newCustomer);
    } catch (error) {
        console.error("❌ Error adding customer:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ✅ UPDATE a customer (Protected)
router.put("/:id", verifyToken, async (req, res) => {
    const { firstName, lastName, businessEmail, phoneNumber, productLines, highValue } = req.body;

    try {
        console.log(`📡 Updating customer ID: ${req.params.id}`);
        const updatedCustomer = await Customer.findByIdAndUpdate(
            req.params.id,
            { firstName, lastName, businessEmail, phoneNumber, productLines, highValue },
            { new: true, runValidators: true }
        );

        if (!updatedCustomer) {
            console.log("⚠️ Customer not found for update.");
            return res.status(404).json({ message: "Customer not found" });
        }

        console.log("✅ Customer updated:", updatedCustomer);
        res.json(updatedCustomer);
    } catch (error) {
        console.error("❌ Error updating customer:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ✅ DELETE a customer (Protected)
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        console.log(`📡 Deleting customer ID: ${req.params.id}`);
        const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);

        if (!deletedCustomer) {
            console.log("⚠️ Customer not found for deletion.");
            return res.status(404).json({ message: "Customer not found" });
        }

        console.log("✅ Customer deleted successfully.");
        res.json({ message: "Customer deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting customer:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
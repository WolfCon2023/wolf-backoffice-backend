const Customer = require("../models/Customer");

// ✅ GET all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().populate("assignedRep", "username email");
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ GET customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate("assignedRep", "username email");
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ CREATE new customer
exports.createCustomer = async (req, res) => {
  try {
    const { firstName, lastName, businessEmail, phoneNumber, productLines, notes, assignedRep } = req.body;

    if (!firstName || !lastName || !businessEmail || !phoneNumber || !productLines) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    const newCustomer = new Customer({
      firstName,
      lastName,
      businessEmail,
      phoneNumber,
      productLines,
      notes: notes || "", // Ensure notes are not undefined
      assignedRep: assignedRep || null, // Ensure assignedRep is handled properly
      lastInteraction: new Date(), // Ensure lastInteraction is tracked
    });

    await newCustomer.save();
    res.status(201).json({ message: "Customer added successfully", newCustomer });
  } catch (error) {
    console.error("❌ Error creating customer:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ UPDATE customer
exports.updateCustomer = async (req, res) => {
  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedCustomer) return res.status(404).json({ message: "Customer not found" });
    res.json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ DELETE customer
exports.deleteCustomer = async (req, res) => {
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
    if (!deletedCustomer) return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

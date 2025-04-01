const express = require('express');
const router = express.Router();
const featureController = require('../controllers/featureController');
const verifyToken = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(verifyToken);

// GET /api/features - Get all features
router.get('/', featureController.getAllFeatures);

// GET /api/features/:id - Get a single feature
router.get('/:id', featureController.getFeatureById);

// POST /api/features - Create a new feature
router.post('/', featureController.createFeature);

// PUT /api/features/:id - Update a feature
router.put('/:id', featureController.updateFeature);

// DELETE /api/features/:id - Delete a feature
router.delete('/:id', featureController.deleteFeature);

module.exports = router; 
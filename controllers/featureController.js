const Feature = require('../models/Feature');
const { handleError } = require('../utils/errorHandler');

// Get all features
exports.getAllFeatures = async (req, res) => {
  try {
    const features = await Feature.find();
    res.json(features);
  } catch (error) {
    handleError(res, error);
  }
};

// Get a single feature by ID
exports.getFeatureById = async (req, res) => {
  try {
    const feature = await Feature.findById(req.params.id);
    if (!feature) {
      return res.status(404).json({ message: 'Feature not found' });
    }
    res.json(feature);
  } catch (error) {
    handleError(res, error);
  }
};

// Create a new feature
exports.createFeature = async (req, res) => {
  try {
    const { name, description, status, priority } = req.body;

    const feature = new Feature({
      name,
      description,
      status: status || 'PLANNED',
      priority: priority || 'MEDIUM'
    });

    const savedFeature = await feature.save();
    res.status(201).json(savedFeature);
  } catch (error) {
    handleError(res, error);
  }
};

// Update a feature
exports.updateFeature = async (req, res) => {
  try {
    const { name, description, status, priority } = req.body;
    
    const feature = await Feature.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        status,
        priority,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!feature) {
      return res.status(404).json({ message: 'Feature not found' });
    }

    res.json(feature);
  } catch (error) {
    handleError(res, error);
  }
};

// Delete a feature
exports.deleteFeature = async (req, res) => {
  try {
    const feature = await Feature.findByIdAndDelete(req.params.id);
    
    if (!feature) {
      return res.status(404).json({ message: 'Feature not found' });
    }

    res.json({ message: 'Feature deleted successfully' });
  } catch (error) {
    handleError(res, error);
  }
}; 
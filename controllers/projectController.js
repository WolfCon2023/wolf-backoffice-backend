const Project = require('../models/Project');
const logger = require('../utils/logger');

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('team', 'name')
      .sort({ createdAt: -1 });
    logger.info(`Retrieved ${projects.length} projects`);
    res.json(projects);
  } catch (error) {
    logger.error('Error in getAllProjects:', error);
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

// Get a single project by ID
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('team', 'name');
    
    if (!project) {
      logger.warn(`Project not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Project not found' });
    }

    logger.info(`Retrieved project: ${project.name}`);
    res.json(project);
  } catch (error) {
    logger.error('Error in getProjectById:', error);
    res.status(500).json({ message: 'Error fetching project', error: error.message });
  }
};

// Create a new project
const createProject = async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    
    logger.info(`Created new project: ${project.name}`);
    res.status(201).json(project);
  } catch (error) {
    logger.error('Error in createProject:', error);
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

// Update a project
const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!project) {
      logger.warn(`Project not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Project not found' });
    }

    logger.info(`Updated project: ${project.name}`);
    res.json(project);
  } catch (error) {
    logger.error('Error in updateProject:', error);
    res.status(500).json({ message: 'Error updating project', error: error.message });
  }
};

// Delete a project
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      logger.warn(`Project not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Project not found' });
    }

    logger.info(`Deleted project: ${project.name}`);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    logger.error('Error in deleteProject:', error);
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
};

// Update project status
const updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      logger.warn(`Invalid status provided: ${status}`);
      return res.status(400).json({ 
        message: 'Invalid status',
        validStatuses
      });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!project) {
      logger.warn(`Project not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Project not found' });
    }

    logger.info(`Updated status of project ${project.name} to ${status}`);
    res.json(project);
  } catch (error) {
    logger.error('Error in updateProjectStatus:', error);
    res.status(500).json({ message: 'Error updating project status', error: error.message });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  updateProjectStatus
}; 
const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const taskController = require('../controllers/taskController');

const taskRouter = express.Router();

console.log("✅ Tasks API Route Loaded");

taskRouter.use(verifyToken);

taskRouter.get("/", taskController.getAllTasks);
taskRouter.get("/project/:projectId", taskController.getTasksByProject);
taskRouter.get("/sprint/:sprintId", taskController.getTasksBySprint);
taskRouter.get("/:id", taskController.getTaskById);
taskRouter.post("/", taskController.createTask);
taskRouter.put("/:id", taskController.updateTask);
taskRouter.delete("/:id", taskController.deleteTask);

module.exports = taskRouter;
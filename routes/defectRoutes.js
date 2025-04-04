const express = require('express');
const verifyToken = require('../middleware/authMiddleware');
const defectController = require('../controllers/defectController');

const defectRouter = express.Router();
console.log("✅ Defects API Route Loaded");

defectRouter.use(verifyToken);

defectRouter.get("/", defectController.getAllDefects);
defectRouter.get("/project/:projectId", defectController.getDefectsByProject);
defectRouter.get("/sprint/:sprintId", defectController.getDefectsBySprint);
defectRouter.get("/:id", defectController.getDefectById);
defectRouter.post("/", defectController.createDefect);
defectRouter.put("/:id", defectController.updateDefect);
defectRouter.delete("/:id", defectController.deleteDefect);

module.exports = defectRouter;

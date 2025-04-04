exports.getAllDefects = async (req, res) => {
  try {
    console.log('📋 Fetching all defects...');
    const defects = await Defect.find()
      .populate('projectId', 'name')
      .populate('sprint', 'name sprintNumber');
    console.log(`✅ Found ${defects.length} defects`);
    res.json(defects);
  } catch (error) {
    console.error('❌ Error fetching defects:', error);
    res.status(500).json({ message: 'Failed to fetch defects', error: error.message });
  }
};

exports.getDefectById = async (req, res) => {
  try {
    const defect = await Defect.findById(req.params.id)
      .populate('projectId', 'name')
      .populate('sprint', 'name sprintNumber');
    if (!defect) return res.status(404).json({ message: 'Defect not found' });
    res.json(defect);
  } catch (error) {
    console.error('❌ Error fetching defect:', error);
    res.status(500).json({ message: 'Failed to fetch defect', error: error.message });
  }
};

exports.createDefect = async (req, res) => {
  try {
    const nextDefectNumber = await getNextDefectNumber(req.body.projectId);
    const defect = new Defect({
      ...req.body,
      defectNumber: nextDefectNumber,
      key: `DEF-${nextDefectNumber}`
    });
    await defect.save();
    console.log('✅ Defect created:', defect.title);
    res.status(201).json(defect);
  } catch (error) {
    console.error('❌ Error creating defect:', error);
    res.status(500).json({ message: 'Failed to create defect', error: error.message });
  }
};

exports.updateDefect = async (req, res) => {
  try {
    const defect = await Defect.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    if (!defect) return res.status(404).json({ message: 'Defect not found' });
    console.log('✅ Defect updated:', defect.title);
    res.json(defect);
  } catch (error) {
    console.error('❌ Error updating defect:', error);
    res.status(500).json({ message: 'Failed to update defect', error: error.message });
  }
};

exports.deleteDefect = async (req, res) => {
  try {
    const defect = await Defect.findByIdAndDelete(req.params.id);
    if (!defect) return res.status(404).json({ message: 'Defect not found' });
    console.log('✅ Defect deleted:', defect.title);
    res.json({ message: 'Defect deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting defect:', error);
    res.status(500).json({ message: 'Failed to delete defect', error: error.message });
  }
};

exports.getDefectsByProject = async (req, res) => {
  try {
    const defects = await Defect.find({ projectId: req.params.projectId });
    res.json(defects);
  } catch (error) {
    console.error('❌ Error fetching defects by project:', error);
    res.status(500).json({ message: 'Failed to fetch defects by project', error: error.message });
  }
};

exports.getDefectsBySprint = async (req, res) => {
  try {
    const defects = await Defect.find({ sprint: req.params.sprintId });
    res.json(defects);
  } catch (error) {
    console.error('❌ Error fetching defects by sprint:', error);
    res.status(500).json({ message: 'Failed to fetch defects by sprint', error: error.message });
  }
};

async function getNextDefectNumber(projectId) {
  const highest = await Defect.findOne({ projectId }).sort({ defectNumber: -1 });
  return highest ? highest.defectNumber + 1 : 1;
}

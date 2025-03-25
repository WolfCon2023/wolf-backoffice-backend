const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'ON_HOLD'],
    default: 'ACTIVE'
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['Product Owner', 'Scrum Master', 'Team Lead', 'Developer', 'Designer', 'QA', 'Other'],
      default: 'Developer'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  capacity: {
    type: Number,
    min: 0,
    default: 0 // Story points per sprint
  },
  workingDays: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
    saturday: { type: Boolean, default: false },
    sunday: { type: Boolean, default: false }
  },
  metrics: {
    averageVelocity: { type: Number, default: 0 },
    sprintCompletionRate: { type: Number, default: 0 },
    averageCycleTime: { type: Number, default: 0 },
    memberUtilization: { type: Number, default: 0 }
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  toBeDeleted: { 
    type: Boolean, 
    default: false 
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: "teams"
});

// Simple indexes
teamSchema.index({ name: 1 });
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ projects: 1 });
teamSchema.index({ toBeDeleted: 1 });
teamSchema.index({ isDeleted: 1 });

// Simple validation pre-save hook
teamSchema.pre('save', function(next) {
  console.log(`🔍 Team pre-save for "${this.name}"`);
  
  // Ensure status is uppercase if provided
  if (this.isModified('status') && this.status) {
    this.status = this.status.toUpperCase();
    console.log(`✅ Status normalized to "${this.status}"`);
  }
  
  // Validate status is in allowed values
  if (this.isModified('status') && !['ACTIVE', 'INACTIVE', 'ON_HOLD'].includes(this.status)) {
    console.warn(`⚠️ Invalid status value: "${this.status}"`);
    return next(new Error(`Invalid status value: "${this.status}". Must be one of: ACTIVE, INACTIVE, ON_HOLD`));
  }
  
  next();
});

// Simplified middleware for findOneAndUpdate
teamSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  console.log('🔍 Team findOneAndUpdate pre-hook');
  
  // Normalize direct status updates
  if (update.status) {
    update.status = update.status.toUpperCase();
    console.log(`✅ Direct status normalized to "${update.status}"`);
  }
  
  // Normalize $set status updates
  if (update.$set && update.$set.status) {
    update.$set.status = update.$set.status.toUpperCase();
    console.log(`✅ $set status normalized to "${update.$set.status}"`);
  }
  
  // Add updatedAt if not present
  if (!update.$set) update.$set = {};
  if (!update.$set.updatedAt) update.$set.updatedAt = new Date();
  
  next();
});

// Post-save hook
teamSchema.post('save', function(doc) {
  console.log(`✅ Team saved: "${doc.name}", status="${doc.status}"`);
});

// Post-update hook
teamSchema.post('findOneAndUpdate', async function(result) {
  if (result) {
    console.log(`✅ Team updated: "${result.name}", status="${result.status}"`);
  } else {
    console.log('⚠️ No result document available after update');
    
    // Try to get the updated document
    const docId = this.getQuery()._id;
    if (docId) {
      const updatedDoc = await mongoose.model('Team').findById(docId);
      if (updatedDoc) {
        console.log(`✅ Retrieved team after update: "${updatedDoc.name}", status="${updatedDoc.status}"`);
      }
    }
  }
});

// Add this hook after the existing post-findOneAndUpdate hook:
// Directly debug the database to verify status updates
teamSchema.post('findOneAndUpdate', async function() {
  try {
    const query = this.getQuery();
    const id = query._id;
    
    if (id) {
      // Get direct database connection
      const db = mongoose.connection.db;
      const collection = db.collection('teams');
      const objectId = new mongoose.Types.ObjectId(id);
      
      // Directly check the document in MongoDB
      const teamInDb = await collection.findOne({ _id: objectId });
      
      if (teamInDb) {
        console.log(`🔍 DIRECT DB CHECK - Team after update:`, {
          id: teamInDb._id.toString(),
          name: teamInDb.name,
          status: teamInDb.status
        });
      }
    }
  } catch (error) {
    console.error('❌ Error in post-update DB verification:', error);
  }
});

module.exports = mongoose.model("Team", teamSchema); 
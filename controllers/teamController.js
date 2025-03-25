const mongoose = require("mongoose");
const Team = require("../models/Team");

// Get all teams
exports.getAllTeams = async (req, res) => {
  try {
    console.log("📡 Fetching all teams...");
    
    // Filter out deleted teams
    const teams = await Team.find({ 
      toBeDeleted: { $ne: true },
      isDeleted: { $ne: true } 
    });
    
    console.log(`✅ Found ${teams.length} active teams (excluding deleted)`);
    return res.json(teams);
  } catch (error) {
    console.error("❌ Error fetching teams:", error);
    res.status(500).json({ message: "Error fetching teams", error: error.message });
  }
};

// Get team by ID
exports.getTeamById = async (req, res) => {
  try {
    console.log(`📡 Fetching team ${req.params.id}...`);
    const team = await Team.findOne({ 
      _id: req.params.id, 
      toBeDeleted: { $ne: true },
      isDeleted: { $ne: true }
    })
      .populate("members.user", "name email")
      .populate("projects", "name key status");

    if (!team) {
      console.warn("⚠️ Team not found.");
      return res.status(404).json({ message: "Team not found" });
    }

    console.log("✅ Team found:", team.name);
    res.json(team);
  } catch (error) {
    console.error("❌ Error fetching team:", error);
    res.status(500).json({ message: "Error fetching team", error: error.message });
  }
};

// Create new team
exports.createTeam = async (req, res) => {
  try {
    console.log("📡 Creating new team:", req.body);

    if (!req.body.name) {
      console.warn("⚠️ Validation Error: Missing required field 'name'");
      return res.status(400).json({ message: "Team name is required" });
    }

    // Create a complete team object with all schema fields properly initialized
    const team = new Team({
      name: req.body.name,
      description: req.body.description || "",
      status: req.body.status || 'ACTIVE',
      members: req.body.members || [],
      projects: req.body.projects || [],
      capacity: req.body.capacity || 0,
      workingDays: {
        monday: req.body.workingDays?.monday !== undefined ? req.body.workingDays.monday : true,
        tuesday: req.body.workingDays?.tuesday !== undefined ? req.body.workingDays.tuesday : true,
        wednesday: req.body.workingDays?.wednesday !== undefined ? req.body.workingDays.wednesday : true,
        thursday: req.body.workingDays?.thursday !== undefined ? req.body.workingDays.thursday : true,
        friday: req.body.workingDays?.friday !== undefined ? req.body.workingDays.friday : true,
        saturday: req.body.workingDays?.saturday !== undefined ? req.body.workingDays.saturday : false,
        sunday: req.body.workingDays?.sunday !== undefined ? req.body.workingDays.sunday : false
      },
      metrics: {
        averageVelocity: req.body.metrics?.averageVelocity || 0,
        sprintCompletionRate: req.body.metrics?.sprintCompletionRate || 0,
        averageCycleTime: req.body.metrics?.averageCycleTime || 0,
        memberUtilization: req.body.metrics?.memberUtilization || 0
      },
      customFields: req.body.customFields || new Map(),
      toBeDeleted: false,
      isDeleted: false
    });
    
    await team.save();
    console.log("✅ Team created:", team.name);
    res.status(201).json(team);
  } catch (error) {
    console.error("❌ Error creating team:", error);
    res.status(500).json({ message: "Error creating team", error: error.message });
  }
};

// Update team
exports.updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log(`📡 Updating team ${id} with data:`, JSON.stringify(updateData, null, 2));

    if (!updateData.name) {
      return res.status(400).json({ message: "Team name is required" });
    }

    // Ensure status is uppercase if provided
    if (updateData.status) {
      updateData.status = updateData.status.toUpperCase();
      
      // Validate status value
      if (!['ACTIVE', 'INACTIVE', 'ON_HOLD'].includes(updateData.status)) {
        return res.status(400).json({
          message: `Invalid status value: "${updateData.status}". Must be one of: ACTIVE, INACTIVE, ON_HOLD`
        });
      }
    }

    // First check if the team exists
    const existingTeam = await Team.findById(id);
    if (!existingTeam) {
      console.warn("⚠️ Team not found");
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if status is being updated
    const isStatusChange = updateData.status && updateData.status !== existingTeam.status;
    
    if (isStatusChange) {
      console.log(`📝 Status change detected: "${existingTeam.status}" → "${updateData.status}"`);
      
      // Use direct MongoDB update for reliable status updates
      const db = mongoose.connection.db;
      const collection = db.collection('teams');
      const objectId = new mongoose.Types.ObjectId(id);
      
      // Add updatedAt to updateData
      updateData.updatedAt = new Date();
      
      // Perform direct update
      const updateResult = await collection.updateOne(
        { _id: objectId },
        { $set: updateData }
      );
      
      console.log(`📊 Direct MongoDB update result:`, updateResult);
      
      // Get the updated document using Mongoose
      const updatedTeam = await Team.findById(id);
      
      // Verify status was updated correctly
      if (updatedTeam.status !== updateData.status) {
        console.error(`⚠️ Status update verification failed. Expected "${updateData.status}", got "${updatedTeam.status}"`);
        
        // Try another direct update specifically for status
        await collection.updateOne(
          { _id: objectId },
          { $set: { status: updateData.status } }
        );
        
        // Get the final team state
        const finalTeam = await Team.findById(id);
        console.log(`📊 Final status after second update: "${finalTeam.status}"`);
        
        console.log(`✅ Team updated with status fix: ${finalTeam.name}`);
        return res.json(finalTeam);
      }
      
      console.log(`✅ Team updated successfully: ${updatedTeam.name}, status: ${updatedTeam.status}`);
      return res.json(updatedTeam);
    } else {
      // Regular update without status change - use Mongoose
      const updatedTeam = await Team.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      console.log(`✅ Team updated successfully: ${updatedTeam.name}, status: ${updatedTeam.status}`);
      return res.json(updatedTeam);
    }
  } catch (error) {
    console.error("❌ Error updating team:", error);
    res.status(500).json({ message: "Error updating team", error: error.message });
  }
};

// Delete team (soft delete)
exports.deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Soft deleting team ${id}`);
    
    const team = await Team.findByIdAndUpdate(
      id,
      { toBeDeleted: true, isDeleted: true, updatedAt: new Date() },
      { new: true }
    );
    
    if (!team) {
      console.warn("⚠️ Team not found");
      return res.status(404).json({ message: "Team not found" });
    }
    
    console.log(`✅ Team deleted: ${team.name}`);
    res.json({ 
      message: "Team deleted successfully",
      success: true
    });
  } catch (error) {
    console.error("❌ Error deleting team:", error);
    res.status(500).json({ message: "Error deleting team", error: error.message });
  }
};

// Update team status - completely rewritten to ensure it works
exports.updateTeamStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`📡 Updating team ${id} status to "${status}" - DIRECT MONGODB UPDATE`);
    
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }
    
    // Ensure status is uppercase
    const normalizedStatus = status.toUpperCase();
    
    // Validate status value
    if (!['ACTIVE', 'INACTIVE', 'ON_HOLD'].includes(normalizedStatus)) {
      return res.status(400).json({
        message: `Invalid status value: "${normalizedStatus}". Must be one of: ACTIVE, INACTIVE, ON_HOLD`
      });
    }
    
    // Check if team exists
    const team = await Team.findById(id);
    if (!team) {
      console.warn("⚠️ Team not found");
      return res.status(404).json({ message: "Team not found" });
    }

    // Get original status for verification
    const originalStatus = team.status;
    console.log(`📡 Current status is "${originalStatus}", updating to "${normalizedStatus}"`);

    // FIRST APPROACH: Direct MongoDB update
    const db = mongoose.connection.db;
    const collection = db.collection('teams');
    const objectId = new mongoose.Types.ObjectId(id);
    
    const updateResult = await collection.updateOne(
      { _id: objectId },
      { 
        $set: { 
          status: normalizedStatus,
          updatedAt: new Date() 
        } 
      }
    );
    
    console.log(`📊 Direct MongoDB update result:`, updateResult);
    
    // Verify the update worked by fetching the team directly from MongoDB
    const updatedTeamInDb = await collection.findOne({ _id: objectId });
    
    // Check if update succeeded
    if (updatedTeamInDb && updatedTeamInDb.status === normalizedStatus) {
      console.log(`✅ Status successfully updated to "${updatedTeamInDb.status}"`);
      
      // Convert MongoDB document to Mongoose document to ensure consistency
      const updatedTeam = await Team.findById(id);
      return res.json(updatedTeam);
    } else {
      console.error(`❌ Status update failed. Current status: "${updatedTeamInDb?.status}"`);
      
      // Try second approach with Mongoose
      console.log("🔄 Trying Mongoose approach as fallback...");
      team.status = normalizedStatus;
      team.markModified('status');
      await team.save();
      
      // Final verification
      const finalTeam = await Team.findById(id);
      console.log(`📊 Final status after save: "${finalTeam.status}"`);
      
      return res.json(finalTeam);
    }
  } catch (error) {
    console.error("❌ Error updating team status:", error);
    res.status(500).json({ message: "Error updating team status", error: error.message });
  }
};

// Get team members
exports.getTeamMembers = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📡 Fetching members for team ${id}`);
    
    const team = await Team.findById(id)
      .populate("members.user", "name email");
    
    if (!team) {
      console.warn("⚠️ Team not found");
      return res.status(404).json({ message: "Team not found" });
    }
    
    console.log(`✅ Found ${team.members.length} members for team ${team.name}`);
    res.json(team.members);
  } catch (error) {
    console.error("❌ Error fetching team members:", error);
    res.status(500).json({ message: "Error fetching team members", error: error.message });
  }
};

// Fix team status - completely bypasses Mongoose for more reliable status updates
exports.fixTeamStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, name } = req.body;
    
    console.log(`🔧 FIX-STATUS: Fixing team ${id} status to "${status}"`);
    
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }
    
    // Ensure status is uppercase
    const normalizedStatus = status.toUpperCase();
    
    // Validate status value
    if (!['ACTIVE', 'INACTIVE', 'ON_HOLD'].includes(normalizedStatus)) {
      return res.status(400).json({
        message: `Invalid status value: "${normalizedStatus}". Must be one of: ACTIVE, INACTIVE, ON_HOLD`
      });
    }
    
    // Get direct MongoDB connection
    const db = mongoose.connection.db;
    if (!db) {
      console.error('❌ No database connection available');
      return res.status(500).json({ message: "Database connection error" });
    }
    
    const collection = db.collection('teams');
    
    // Convert string ID to ObjectId
    const objectId = new mongoose.Types.ObjectId(id);
    
    console.log(`🔍 Finding team with ID ${objectId} in MongoDB...`);
    
    // First get the current team to check if status is already correct
    const currentTeam = await collection.findOne({ _id: objectId });
    
    if (!currentTeam) {
      console.error('❌ Team not found in MongoDB');
      return res.status(404).json({ message: "Team not found" });
    }
    
    console.log(`✅ Found team "${currentTeam.name}" with current status "${currentTeam.status}"`);
    
    // If status is already correct, return success
    if (currentTeam.status === normalizedStatus) {
      console.log(`ℹ️ Status is already "${normalizedStatus}", no update needed`);
      return res.json({ 
        success: true, 
        message: `Status already set to "${normalizedStatus}"`,
        team: currentTeam
      });
    }
    
    // Create update object - always include name to ensure it doesn't get lost
    const updateObj = { 
      status: normalizedStatus,
      updatedAt: new Date()
    };
    
    // If name is provided, update it too
    if (name) {
      updateObj.name = name;
    } else {
      // Ensure we keep the current name
      updateObj.name = currentTeam.name;
    }
    
    console.log(`📝 Updating team with data:`, updateObj);
    
    // APPROACH 1: Direct updateOne
    console.log(`🔨 APPROACH 1: Using updateOne...`);
    const updateResult = await collection.updateOne(
      { _id: objectId },
      { $set: updateObj }
    );
    
    console.log(`📊 Update result:`, updateResult);
    
    // Check if the update was acknowledged
    if (!updateResult.acknowledged) {
      console.error('❌ Update not acknowledged by MongoDB');
      // Continue to next approach
    } else {
      console.log(`✅ Update acknowledged, matched ${updateResult.matchedCount}, modified ${updateResult.modifiedCount}`);
    }
    
    // APPROACH 2: findOneAndUpdate
    console.log(`🔨 APPROACH 2: Using findOneAndUpdate...`);
    const findAndUpdateResult = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: updateObj },
      { returnDocument: 'after' }
    );
    
    console.log(`📊 findOneAndUpdate result available:`, !!findAndUpdateResult.value);
    
    // APPROACH 3: replaceOne
    console.log(`🔨 APPROACH 3: Using replaceOne with complete document...`);
    
    // Create a complete replacement document
    const replacementDoc = { ...currentTeam, ...updateObj };
    
    const replaceResult = await collection.replaceOne(
      { _id: objectId },
      replacementDoc
    );
    
    console.log(`📊 Replace result:`, replaceResult);
    
    // Verify the update by fetching the team directly
    console.log(`🔍 Verifying update by fetching team...`);
    const updatedTeam = await collection.findOne({ _id: objectId });
    
    if (!updatedTeam) {
      console.error('❌ Could not find team after update');
      return res.status(500).json({ message: "Error verifying team update" });
    }
    
    console.log(`📊 Team after update: status="${updatedTeam.status}", name="${updatedTeam.name}"`);
    
    // Check if status update was successful
    if (updatedTeam.status === normalizedStatus) {
      console.log(`✅ Status successfully updated to "${normalizedStatus}"`);
      
      // Final verification: re-fetch using Mongoose to ensure it shows the same status
      const mongooseTeam = await Team.findById(id);
      console.log(`📊 Mongoose verification: status="${mongooseTeam.status}"`);
      
      return res.json({ 
        success: true,
        message: `Team status updated to "${normalizedStatus}"`,
        team: updatedTeam
      });
    } else {
      console.error(`❌ Status update failed. Status is still "${updatedTeam.status}"`);
      
      // APPROACH 4: Last resort - update at the database level with raw command
      console.log(`🔨 APPROACH 4: Using database command...`);
      
      try {
        const command = {
          update: "teams",
          updates: [
            {
              q: { _id: objectId },
              u: { $set: updateObj },
              upsert: false,
              multi: false
            }
          ]
        };
        
        const commandResult = await db.command(command);
        console.log(`📊 Command result:`, commandResult);
        
        // Final check
        const finalTeam = await collection.findOne({ _id: objectId });
        console.log(`📊 Final check: status="${finalTeam.status}", name="${finalTeam.name}"`);
        
        if (finalTeam.status === normalizedStatus) {
          console.log(`✅ Status finally updated to "${normalizedStatus}" after last resort approach`);
          return res.json({ 
            success: true,
            message: `Team status updated to "${normalizedStatus}" (required fallback approach)`,
            team: finalTeam
          });
        } else {
          console.error(`❌ All approaches failed. Status is still "${finalTeam.status}"`);
          return res.status(500).json({ 
            message: "Failed to update team status despite multiple approaches",
            currentStatus: finalTeam.status,
            requestedStatus: normalizedStatus
          });
        }
      } catch (cmdError) {
        console.error('❌ Error executing command:', cmdError);
        return res.status(500).json({ 
          message: "Failed to update team status with database command",
          error: cmdError.message 
        });
      }
    }
  } catch (error) {
    console.error("❌ Error in fix-status:", error);
    res.status(500).json({ 
      message: "Error updating team status", 
      error: error.message 
    });
  }
}; 
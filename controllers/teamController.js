const mongoose = require("mongoose");
const Team = require("../models/Team");
const User = require("../models/User");

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
      .populate({
        path: "members.userId",
        select: "firstName lastName email username title department role"
      })
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
      .populate({
        path: "members.userId",
        select: "firstName lastName email username title department role"
      });
    
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

// Add team member
exports.addTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role = 'Team Member' } = req.body;

    console.log(`📡 Adding user ${userId} to team ${id} with role ${role}...`);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    if (!userId) {
      console.warn('⚠️ Missing userId in request body');
      return res.status(400).json({ message: "User ID is required" });
    }

    // Normalize role to match schema enum values
    const validRoles = ['Team Member', 'Scrum Master', 'Developer', 'Business Analyst', 'QA Tester', 'Product Owner'];
    if (!validRoles.includes(role)) {
      console.warn(`⚠️ Invalid role value: "${role}"`);
      return res.status(400).json({ 
        message: "Invalid role value", 
        validRoles: validRoles
      });
    }

    // First verify the user exists
    console.log('🔍 Verifying user exists...');
    let user;
    try {
      user = await User.findById(userId);
      console.log('User lookup result:', user ? {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        department: user.department,
        title: user.title
      } : 'User not found');
    } catch (error) {
      console.error('❌ Error finding user:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        keyPattern: error.keyPattern,
        keyValue: error.keyValue,
        stack: error.stack
      });
      return res.status(500).json({ 
        message: "Error finding user", 
        error: error.message,
        details: error.stack
      });
    }
    
    if (!user) {
      console.warn(`⚠️ User not found with ID: ${userId}`);
      return res.status(404).json({ message: "User not found" });
    }
    console.log(`✅ Found user: ${user.firstName} ${user.lastName}`);

    // Find the team
    console.log('🔍 Finding team...');
    let team;
    try {
      team = await Team.findOne({ 
        _id: id, 
        toBeDeleted: { $ne: true },
        isDeleted: { $ne: true }
      });
      console.log('Team lookup result:', team ? {
        id: team._id,
        name: team.name,
        memberCount: team.members.length,
        status: team.status
      } : 'Team not found');
    } catch (error) {
      console.error('❌ Error finding team:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        keyPattern: error.keyPattern,
        keyValue: error.keyValue,
        stack: error.stack
      });
      return res.status(500).json({ 
        message: "Error finding team", 
        error: error.message,
        details: error.stack
      });
    }

    if (!team) {
      console.warn(`⚠️ Team not found with ID: ${id}`);
      return res.status(404).json({ message: "Team not found" });
    }

    console.log(`✅ Found team: ${team.name}`);

    // Check if user is already a member
    console.log('🔍 Checking if user is already a member...');
    const isMember = team.members.some(member => member.userId.toString() === userId);
    if (isMember) {
      console.warn(`⚠️ User ${userId} is already a member of team ${team.name}`);
      return res.status(400).json({ message: "User is already a member of this team" });
    }

    // Map user's role to team role if needed
    let finalRole = role;
    if (role === 'Team Member') {
      console.log('ℹ️ Using user\'s existing role');
      finalRole = user.role;
    }

    // Add the new member with user reference
    console.log('📝 Adding new member to team...');
    try {
      const newMember = {
        userId: new mongoose.Types.ObjectId(userId),
        role: finalRole,
        joinedAt: new Date()
      };
      console.log('New member data:', newMember);

      // Use direct MongoDB update for more reliable member addition
      const db = mongoose.connection.db;
      const collection = db.collection('teams');
      const objectId = new mongoose.Types.ObjectId(id);

      // First verify the current state of the team
      const currentTeam = await collection.findOne({ _id: objectId });
      console.log('Current team state:', {
        id: currentTeam._id.toString(),
        name: currentTeam.name,
        memberCount: currentTeam.members.length
      });

      // Create a new members array with the new member
      const updatedMembers = [...currentTeam.members, newMember];
      console.log('Updated members array:', updatedMembers.map(m => ({
        userId: m.userId.toString(),
        role: m.role,
        joinedAt: m.joinedAt
      })));

      // Perform the update
      const updateResult = await collection.updateOne(
        { _id: objectId },
        { 
          $set: { 
            members: updatedMembers,
            updatedAt: new Date()
          }
        }
      );
      
      console.log('Update result:', updateResult);

      if (!updateResult.acknowledged) {
        throw new Error('Update not acknowledged by MongoDB');
      }

      console.log("✅ Team member added successfully");
    } catch (error) {
      console.error('❌ Error saving team with new member:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        keyPattern: error.keyPattern,
        keyValue: error.keyValue,
        stack: error.stack,
        team: {
          id: team._id,
          name: team.name,
          memberCount: team.members.length
        }
      });
      return res.status(500).json({ 
        message: "Error saving team with new member", 
        error: error.message,
        details: error.stack
      });
    }

    // Get the updated team with populated user data
    console.log('🔍 Fetching updated team with populated data...');
    let updatedTeam;
    try {
      updatedTeam = await Team.findById(id)
        .populate({
          path: "members.userId",
          select: "firstName lastName email username title department role"
        })
        .populate("projects", "name key status");
      console.log('✅ Team updated successfully');
      console.log('Updated team members:', updatedTeam.members.map(m => ({
        userId: m.userId._id,
        name: `${m.userId.firstName} ${m.userId.lastName}`,
        role: m.role,
        joinedAt: m.joinedAt
      })));
    } catch (error) {
      console.error('❌ Error fetching updated team:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        keyPattern: error.keyPattern,
        keyValue: error.keyValue,
        stack: error.stack
      });
      return res.status(500).json({ 
        message: "Error fetching updated team", 
        error: error.message,
        details: error.stack
      });
    }

    res.json(updatedTeam);
  } catch (error) {
    console.error("❌ Error adding team member:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      request: {
        params: req.params,
        body: req.body
      }
    });
    res.status(500).json({ 
      message: "Error adding team member", 
      error: error.message,
      details: error.stack
    });
  }
}; 
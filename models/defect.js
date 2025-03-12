const defectsSchema = {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["title", "description", "severity", "priority", "status", "reporter"],
        properties: {
          defectId: { bsonType: "string" },
          title: { bsonType: "string" },
          description: { bsonType: "string" },
          stepsToReproduce: { bsonType: "array", items: { bsonType: "string" } },
          expectedResult: { bsonType: "string" },
          actualResult: { bsonType: "string" },
          severity: { 
            enum: ["Critical", "High", "Medium", "Low"] 
          },
          priority: { 
            enum: ["P1 - Blocker", "P2 - Major", "P3 - Normal", "P4 - Low"] 
          },
          status: { 
            enum: ["New", "Confirmed", "In Progress", "In Review", "Fixed", "Closed", "Won't Fix"] 
          },
          bugType: { 
            enum: ["Functional", "UI/UX", "Performance", "Security", "Integration", "Regression"] 
          },
          assignedTo: { bsonType: "string" },
          reporter: { bsonType: "string" },
          dateReported: { bsonType: "date" },
          dateFixed: { bsonType: "date" },
          sprintId: { bsonType: "string" },
          environment: { 
            enum: ["Production", "Staging", "QA", "Development"] 
          },
          os: { bsonType: "string" },
          browser: { bsonType: "string" },
          deviceType: { 
            enum: ["Desktop", "Mobile", "Tablet"] 
          },
          errorLogs: { bsonType: "string" },
          attachments: { 
            bsonType: "array", 
            items: { 
              bsonType: "object",
              required: ["url", "name"],
              properties: {
                url: { bsonType: "string" },
                name: { bsonType: "string" },
                type: { bsonType: "string" }
              }
            }
          },
          testCases: { 
            bsonType: "array", 
            items: { bsonType: "string" }
          },
          linkedIssues: { 
            bsonType: "array", 
            items: { bsonType: "string" }
          },
          isRegression: { bsonType: "bool" },
          hasWorkaround: { bsonType: "bool" },
          workaroundDescription: { bsonType: "string" },
          rootCause: { bsonType: "string" },
          resolution: { 
            enum: ["Fixed", "Duplicate", "Won't Fix", "Cannot Reproduce"] 
          },
          codeReviewStatus: { 
            enum: ["Pending", "Approved", "Rejected"] 
          },
          pullRequestUrl: { bsonType: "string" },
          versionFound: { bsonType: "string" },
          versionFixed: { bsonType: "string" }
        }
      }
    }
  }
  
  module.exports = defectsSchema; 
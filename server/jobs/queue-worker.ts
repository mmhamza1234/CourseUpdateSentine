import Queue from "bull";
import { db } from "../db";
import { 
  changeEvents, 
  assets, 
  modules, 
  impacts, 
  tasks, 
  decisionRules, 
  slaConfig 
} from "@shared/schema";
import { classifyImpacts, generateTaskBundle } from "../services/openai";
import { eq } from "drizzle-orm";

// Initialize Redis queue
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const impactQueue = new Queue("impact classification", REDIS_URL);
const taskQueue = new Queue("task generation", REDIS_URL);
const notificationQueue = new Queue("notifications", REDIS_URL);

// Impact Classification Worker
impactQueue.process("classify-impacts", async (job) => {
  const { changeEventId } = job.data;
  
  try {
    console.log(`🧠 Classifying impacts for change event ${changeEventId}`);
    
    // Get change event details
    const [changeEvent] = await db
      .select()
      .from(changeEvents)
      .where(eq(changeEvents.id, changeEventId))
      .limit(1);

    if (!changeEvent) {
      throw new Error("Change event not found");
    }

    // Get all assets with module information
    const assetsList = await db
      .select({
        id: assets.id,
        moduleCode: modules.code,
        assetType: assets.assetType,
        toolDependency: assets.toolDependency,
        sensitivity: assets.sensitivity,
        triggerTags: assets.triggerTags,
      })
      .from(assets)
      .leftJoin(modules, eq(assets.moduleId, modules.id));

    // Get decision rules
    const rules = await db
      .select()
      .from(decisionRules)
      .where(eq(decisionRules.isActive, true));

    // Classify impacts using AI
    const changeSummary = {
      summary: changeEvent.summary || "",
      change_type: changeEvent.changeType as any,
      entities: changeEvent.entities,
      risks: changeEvent.risks,
      summary_ar: changeEvent.summaryAr || "",
    };

    const impactAssessments = await classifyImpacts(
      changeSummary,
      assetsList,
      rules
    );

    // Store impact assessments
    const createdImpacts = [];
    for (const assessment of impactAssessments) {
      const [impact] = await db
        .insert(impacts)
        .values({
          changeEventId,
          assetId: assessment.asset_id,
          predictedAction: assessment.predicted_action,
          severity: assessment.severity,
          confidence: assessment.confidence.toString(),
          reasons: assessment.reasons,
        })
        .returning();

      createdImpacts.push(impact);
    }

    console.log(`✅ Created ${createdImpacts.length} impact assessments`);

    // Queue task generation for approved impacts or auto-approve low-confidence ones
    for (const impact of createdImpacts) {
      if (parseFloat(impact.confidence) > 0.8 || impact.severity === "SEV1") {
        await taskQueue.add("generate-tasks", { impactId: impact.id });
      }
    }

    // Queue notifications for high-severity impacts
    const sev1Impacts = createdImpacts.filter(i => i.severity === "SEV1");
    if (sev1Impacts.length > 0) {
      await notificationQueue.add("sev1-alert", {
        changeEventId,
        impactIds: sev1Impacts.map(i => i.id),
      });
    }

    return { impactCount: createdImpacts.length };
  } catch (error) {
    console.error("❌ Impact classification failed:", error);
    throw error;
  }
});

// Task Generation Worker
taskQueue.process("generate-tasks", async (job) => {
  const { impactId } = job.data;
  
  try {
    console.log(`📋 Generating tasks for impact ${impactId}`);
    
    // Get impact details
    const [impact] = await db
      .select()
      .from(impacts)
      .where(eq(impacts.id, impactId))
      .limit(1);

    if (!impact) {
      throw new Error("Impact not found");
    }

    // Get SLA configuration
    const slaConfigs = await db.select().from(slaConfig);
    const slaMap = slaConfigs.reduce((acc, config) => {
      acc[config.severity] = config.patchWithinHours;
      return acc;
    }, {} as Record<string, number>);

    // Generate tasks using AI
    const taskBundle = await generateTaskBundle([{
      asset_id: impact.assetId,
      predicted_action: impact.predictedAction as any,
      severity: impact.severity as any,
      confidence: parseFloat(impact.confidence),
      reasons: impact.reasons,
    }], slaMap);

    // Store generated tasks
    const createdTasks = [];
    for (const taskData of taskBundle.tasks) {
      const [task] = await db
        .insert(tasks)
        .values({
          impactId,
          action: taskData.action,
          title: taskData.title,
          description: taskData.description,
          owner: taskData.owner,
          dueDate: new Date(taskData.due_date),
        })
        .returning();

      createdTasks.push(task);
    }

    console.log(`✅ Created ${createdTasks.length} tasks`);

    return { taskCount: createdTasks.length };
  } catch (error) {
    console.error("❌ Task generation failed:", error);
    throw error;
  }
});

// Notification Worker
notificationQueue.process("sev1-alert", async (job) => {
  const { changeEventId, impactIds } = job.data;
  
  try {
    console.log(`🚨 Sending SEV1 alert for change event ${changeEventId}`);
    
    // Get change event details
    const [changeEvent] = await db
      .select()
      .from(changeEvents)
      .where(eq(changeEvents.id, changeEventId))
      .limit(1);

    if (!changeEvent) {
      throw new Error("Change event not found");
    }

    // TODO: Send actual email notification
    console.log(`📧 SEV1 Alert: ${changeEvent.title} affects ${impactIds.length} assets`);
    
    return { notificationSent: true };
  } catch (error) {
    console.error("❌ Notification failed:", error);
    throw error;
  }
});

// Add job to queue
export async function queueImpactClassification(changeEventId: string) {
  await impactQueue.add("classify-impacts", { changeEventId });
}

export async function queueTaskGeneration(impactId: string) {
  await taskQueue.add("generate-tasks", { impactId });
}

export async function queueSev1Alert(changeEventId: string, impactIds: string[]) {
  await notificationQueue.add("sev1-alert", { changeEventId, impactIds });
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 Shutting down queue workers...");
  await impactQueue.close();
  await taskQueue.close();
  await notificationQueue.close();
});

console.log("🔄 Queue workers initialized");

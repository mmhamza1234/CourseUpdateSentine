import cron from "node-cron";
import { db } from "../db";
import { sources, vendors, changeEvents } from "@shared/schema";
import { MonitoringService } from "../services/monitoring";
import { summarizeChange } from "../services/openai";
import { eq, and } from "drizzle-orm";

const monitoringService = new MonitoringService();

// Daily monitoring job at 09:30 Africa/Cairo
export const dailyMonitoringJob = cron.schedule(
  "30 9 * * *",
  async () => {
    console.log("🔍 Starting daily monitoring job...");
    
    try {
      // Get all active sources
      const activeSources = await db
        .select({
          source: sources,
          vendor: vendors,
        })
        .from(sources)
        .leftJoin(vendors, eq(sources.vendorId, vendors.id))
        .where(and(eq(sources.isActive, true), eq(sources.bridgeToggle, true)));

      console.log(`📊 Monitoring ${activeSources.length} sources`);

      for (const { source, vendor } of activeSources) {
        try {
          await processSource(source, vendor);
        } catch (error) {
          console.error(`❌ Error processing source ${source.name}:`, error.message);
          // Continue with other sources
        }
      }

      console.log("✅ Daily monitoring job completed");
    } catch (error) {
      console.error("❌ Daily monitoring job failed:", error);
    }
  },
  {
    scheduled: false,
    timezone: "Africa/Cairo",
  }
);

// Weekly digest job at 09:00 Monday Africa/Cairo
export const weeklyDigestJob = cron.schedule(
  "0 9 * * 1",
  async () => {
    console.log("📧 Generating weekly digest...");
    
    try {
      // Get statistics for the past week
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const weeklyStats = await db
        .select()
        .from(changeEvents)
        .where(sql`created_at >= ${oneWeekAgo}`)
        .orderBy(changeEvents.createdAt);

      // TODO: Generate and send weekly digest email
      console.log(`📈 Weekly digest: ${weeklyStats.length} changes detected`);
      
    } catch (error) {
      console.error("❌ Weekly digest job failed:", error);
    }
  },
  {
    scheduled: false,
    timezone: "Africa/Cairo",
  }
);

async function processSource(source: any, vendor: any) {
  console.log(`🔄 Processing ${vendor.name} - ${source.name}`);
  
  // Check robots.txt compliance
  const isAllowed = await monitoringService.checkRobotsTxt(source.url);
  if (!isAllowed) {
    console.log(`🚫 Skipping ${source.name} - blocked by robots.txt`);
    return;
  }

  // Fetch content
  const fetchResults = await monitoringService.fetchSource({
    url: source.url,
    type: source.type,
    cssSelector: source.cssSelector,
  });

  console.log(`📄 Found ${fetchResults.length} items from ${source.name}`);

  // Get existing content hashes to check for duplicates
  const existingEvents = await db
    .select({ raw: changeEvents.raw })
    .from(changeEvents)
    .where(eq(changeEvents.sourceId, source.id));
  
  const existingHashes = existingEvents.map(event => 
    crypto.createHash('sha256').update(event.raw).digest('hex')
  );

  // Process new content
  for (const result of fetchResults) {
    if (monitoringService.isContentDuplicate(existingHashes, result.contentHash)) {
      continue; // Skip duplicates
    }

    try {
      // Summarize the change using AI
      const changeSummary = await summarizeChange(result.raw, vendor.name);
      
      // Store the change event
      const [newEvent] = await db
        .insert(changeEvents)
        .values({
          vendorId: vendor.id,
          sourceId: source.id,
          title: result.title,
          url: result.url,
          publishedAt: result.publishedAt,
          raw: result.raw,
          summary: changeSummary.summary,
          changeType: changeSummary.change_type,
          entities: changeSummary.entities,
          risks: changeSummary.risks,
          summaryAr: changeSummary.summary_ar,
        })
        .returning();

      console.log(`✨ New change event: ${newEvent.title}`);
      
      // Queue impact classification job
      await queueImpactClassification(newEvent.id);
      
    } catch (error) {
      console.error(`❌ Error processing change event:`, error.message);
    }
  }

  // Update last checked timestamp
  await db
    .update(sources)
    .set({ lastChecked: new Date() })
    .where(eq(sources.id, source.id));
}

async function queueImpactClassification(changeEventId: string) {
  // TODO: Add to BullMQ queue for background processing
  console.log(`📋 Queued impact classification for event ${changeEventId}`);
}

export function startMonitoringJobs() {
  console.log("🚀 Starting monitoring cron jobs...");
  dailyMonitoringJob.start();
  weeklyDigestJob.start();
  console.log("⏰ Monitoring jobs scheduled");
}

export function stopMonitoringJobs() {
  console.log("🛑 Stopping monitoring cron jobs...");
  dailyMonitoringJob.stop();
  weeklyDigestJob.stop();
}

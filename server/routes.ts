import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authService } from "./services/auth";
import { queueImpactClassification, queueTaskGeneration } from "./jobs/queue-worker";
import { startMonitoringJobs } from "./jobs/monitoring-cron";
import { MonitoringService } from "./services/monitoring";
import { insertVendorSchema, insertSourceSchema, insertModuleSchema, insertAssetSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication disabled for single-user tool
  const monitoringService = new MonitoringService();

  // Auth routes
  app.post("/api/auth/request-magic-link", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      await authService.sendMagicLink(email);
      res.json({ message: "Magic link sent to your email" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/auth/verify", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const user = await authService.verifyMagicLink(token as string);
      const jwt = authService.generateJWT(user);
      
      res.json({ user, token: jwt });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", async (req: any, res) => {
    res.json({ user: req.user });
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Vendors
  app.get("/api/vendors", async (req, res) => {
    try {
      const vendors = await storage.getVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/vendors", async (req, res) => {
    try {
      const validatedData = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(validatedData);
      res.status(201).json(vendor);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/vendors/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertVendorSchema.partial().parse(req.body);
      const vendor = await storage.updateVendor(id, validatedData);
      res.json(vendor);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/vendors/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteVendor(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Sources
  app.get("/api/sources", async (req, res) => {
    try {
      const sources = await storage.getSources();
      res.json(sources);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sources", async (req, res) => {
    try {
      const validatedData = insertSourceSchema.parse(req.body);
      const source = await storage.createSource(validatedData);
      res.status(201).json(source);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/sources/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertSourceSchema.partial().parse(req.body);
      const source = await storage.updateSource(id, validatedData);
      res.json(source);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Modules
  app.get("/api/modules", async (req, res) => {
    try {
      const modules = await storage.getModules();
      res.json(modules);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/modules", async (req, res) => {
    try {
      const validatedData = insertModuleSchema.parse(req.body);
      const module = await storage.createModule(validatedData);
      res.status(201).json(module);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Assets
  app.get("/api/assets", async (req, res) => {
    try {
      const assets = await storage.getAssets();
      res.json(assets);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/assets", async (req, res) => {
    try {
      const validatedData = insertAssetSchema.parse(req.body);
      const asset = await storage.createAsset(validatedData);
      res.status(201).json(asset);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Change Events
  app.get("/api/events", async (req, res) => {
    try {
      const { limit } = req.query;
      const events = await storage.getChangeEvents(limit ? parseInt(limit as string) : undefined);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Impacts
  app.get("/api/impacts", async (req, res) => {
    try {
      const impacts = await storage.getImpacts();
      res.json(impacts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/impacts/pending", async (req, res) => {
    try {
      const impacts = await storage.getPendingImpacts();
      res.json(impacts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/impacts/:id/approve", async (req: any, res) => {
    try {
      const { id } = req.params;
      const impact = await storage.approveImpact(id, req.user.id);
      
      // Queue task generation
      await queueTaskGeneration(id);
      
      res.json(impact);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/impacts/:id/reject", async (req: any, res) => {
    try {
      const { id } = req.params;
      const impact = await storage.rejectImpact(id, req.user.id);
      res.json(impact);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const { status, owner } = req.query;
      let tasks;
      
      if (status) {
        tasks = await storage.getTasksByStatus(status as string);
      } else if (owner) {
        tasks = await storage.getTasksByOwner(owner as string);
      } else {
        tasks = await storage.getTasks();
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const task = await storage.updateTask(id, req.body);
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  // Manual trigger for monitoring
  app.post("/api/monitoring/manual-run", async (req, res) => {
    try {
      // Get all active sources
      const sources = await storage.getSources();
      const activeSources = sources.filter((source: any) => source.isActive && source.bridgeToggle);
      
      if (activeSources.length === 0) {
        return res.json({ 
          message: "No active sources found to monitor",
          sourceCount: 0 
        });
      }

      // Trigger monitoring for each active source
      let processedSources = 0;
      let foundChanges = 0;
      
      for (const source of activeSources) {
        try {
          const results = await monitoringService.fetchSource({
            url: source.url,
            type: source.type,
            cssSelector: source.cssSelector
          });
          
          processedSources++;
          
          // Here you could store the results or trigger further processing
          if (results && results.length > 0) {
            foundChanges += results.length;
          }
          
        } catch (sourceError) {
          console.error(`Failed to monitor source ${source.name}:`, sourceError);
        }
      }
      
      res.json({ 
        message: "Manual monitoring completed",
        processedSources,
        foundChanges,
        totalActiveSources: activeSources.length
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Webhook for external systems
  app.post("/api/webhook/change-detected", async (req, res) => {
    try {
      const { changeEventId } = req.body;
      if (changeEventId) {
        await queueImpactClassification(changeEventId);
      }
      res.json({ message: "Webhook processed" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Start background jobs
  startMonitoringJobs();

  const httpServer = createServer(app);
  return httpServer;
}

import {
  users,
  vendors,
  sources,
  modules,
  assets,
  changeEvents,
  impacts,
  tasks,
  type User,
  type InsertUser,
  type Vendor,
  type InsertVendor,
  type Source,
  type InsertSource,
  type Module,
  type InsertModule,
  type Asset,
  type InsertAsset,
  type ChangeEvent,
  type Impact,
  type Task,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

// Complete storage interface
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;

  // Dashboard
  getDashboardStats(): Promise<{
    totalVendors: number;
    activeSources: number;
    recentEvents: number;
    pendingImpacts: number;
    openTasks: number;
  }>;

  // Vendors
  getVendors(): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor>;
  deleteVendor(id: string): Promise<void>;

  // Sources
  getSources(): Promise<Source[]>;
  createSource(source: InsertSource): Promise<Source>;
  updateSource(id: string, source: Partial<InsertSource>): Promise<Source>;

  // Modules
  getModules(): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;

  // Assets
  getAssets(): Promise<Asset[]>;
  createAsset(asset: InsertAsset): Promise<Asset>;

  // Change Events
  getChangeEvents(limit?: number): Promise<ChangeEvent[]>;

  // Impacts
  getImpacts(): Promise<Impact[]>;
  getPendingImpacts(): Promise<Impact[]>;
  approveImpact(id: string, userId: string): Promise<Impact>;
  rejectImpact(id: string, userId: string): Promise<Impact>;

  // Tasks
  getTasks(): Promise<Task[]>;
  getTasksByStatus(status: string): Promise<Task[]>;
  getTasksByOwner(owner: string): Promise<Task[]>;
  updateTask(id: string, task: Partial<Task>): Promise<Task>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Dashboard
  async getDashboardStats() {
    const [vendorCount] = await db.select({ count: sql<number>`count(*)` }).from(vendors);
    const [sourceCount] = await db.select({ count: sql<number>`count(*)` }).from(sources).where(eq(sources.isActive, true));
    const [eventCount] = await db.select({ count: sql<number>`count(*)` }).from(changeEvents).where(sql`created_at >= NOW() - INTERVAL '7 days'`);
    const [impactCount] = await db.select({ count: sql<number>`count(*)` }).from(impacts).where(eq(impacts.status, 'PENDING'));
    const [taskCount] = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, 'OPEN'));

    return {
      totalVendors: vendorCount.count,
      activeSources: sourceCount.count,
      recentEvents: eventCount.count,
      pendingImpacts: impactCount.count,
      openTasks: taskCount.count,
    };
  }

  // Vendors
  async getVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors).orderBy(vendors.name);
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [newVendor] = await db.insert(vendors).values({
      ...vendor,
      updatedAt: new Date(),
    }).returning();
    return newVendor;
  }

  async updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor> {
    const [updatedVendor] = await db
      .update(vendors)
      .set({
        ...vendor,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, id))
      .returning();
    return updatedVendor;
  }

  async deleteVendor(id: string): Promise<void> {
    await db.delete(vendors).where(eq(vendors.id, id));
  }

  // Sources
  async getSources(): Promise<Source[]> {
    return await db.select().from(sources).orderBy(sources.name);
  }

  async createSource(source: InsertSource): Promise<Source> {
    const [newSource] = await db.insert(sources).values({
      ...source,
      updatedAt: new Date(),
    }).returning();
    return newSource;
  }

  async updateSource(id: string, source: Partial<InsertSource>): Promise<Source> {
    const [updatedSource] = await db
      .update(sources)
      .set({
        ...source,
        updatedAt: new Date(),
      })
      .where(eq(sources.id, id))
      .returning();
    return updatedSource;
  }

  // Modules
  async getModules(): Promise<Module[]> {
    return await db.select().from(modules).orderBy(modules.code);
  }

  async createModule(module: InsertModule): Promise<Module> {
    const [newModule] = await db.insert(modules).values({
      ...module,
      updatedAt: new Date(),
    }).returning();
    return newModule;
  }

  // Assets
  async getAssets(): Promise<Asset[]> {
    return await db.select().from(assets).orderBy(assets.moduleId, assets.lessonCode);
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const [newAsset] = await db.insert(assets).values({
      ...asset,
      updatedAt: new Date(),
    }).returning();
    return newAsset;
  }

  // Change Events
  async getChangeEvents(limit?: number): Promise<ChangeEvent[]> {
    let query = db.select().from(changeEvents).orderBy(desc(changeEvents.publishedAt));
    if (limit) {
      query = query.limit(limit);
    }
    return await query;
  }

  // Impacts
  async getImpacts(): Promise<Impact[]> {
    return await db.select().from(impacts).orderBy(desc(impacts.createdAt));
  }

  async getPendingImpacts(): Promise<Impact[]> {
    return await db.select().from(impacts)
      .where(eq(impacts.status, 'PENDING'))
      .orderBy(desc(impacts.createdAt));
  }

  async approveImpact(id: string, userId: string): Promise<Impact> {
    const [updatedImpact] = await db
      .update(impacts)
      .set({
        status: 'APPROVED',
        decidedBy: userId,
        decidedAt: new Date(),
      })
      .where(eq(impacts.id, id))
      .returning();
    return updatedImpact;
  }

  async rejectImpact(id: string, userId: string): Promise<Impact> {
    const [updatedImpact] = await db
      .update(impacts)
      .set({
        status: 'REJECTED',
        decidedBy: userId,
        decidedAt: new Date(),
      })
      .where(eq(impacts.id, id))
      .returning();
    return updatedImpact;
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(eq(tasks.status, status))
      .orderBy(desc(tasks.createdAt));
  }

  async getTasksByOwner(owner: string): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(eq(tasks.owner, owner))
      .orderBy(desc(tasks.createdAt));
  }

  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set({
        ...task,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }
}

export const storage = new DatabaseStorage();
import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Vendors table
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  website: text("website"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sources table (RSS/HTML/API)
export const sources = pgTable("sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => vendors.id).notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(), // RSS|HTML|API
  cssSelector: text("css_selector"), // for HTML sources
  bridgeToggle: boolean("bridge_toggle").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastChecked: timestamp("last_checked"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Modules table (M1-M9)
export const modules = pgTable("modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // M1, M2, etc.
  title: text("title").notNull(),
  hours: integer("hours").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Assets table
export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").references(() => modules.id).notNull(),
  lessonCode: text("lesson_code").notNull(),
  assetType: text("asset_type").notNull(), // SLIDES|TOOL_CLIP|SCREEN_DEMO
  sensitivity: text("sensitivity").notNull(), // High|Medium|Low
  toolDependency: text("tool_dependency"),
  triggerTags: text("trigger_tags").array().default(sql`'{}'::text[]`).notNull(),
  link: text("link"),
  version: text("version").default("v1.0").notNull(),
  lastReviewed: timestamp("last_reviewed"),
  nextDue: timestamp("next_due"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Change Events table
export const changeEvents = pgTable("change_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => vendors.id).notNull(),
  sourceId: varchar("source_id").references(() => sources.id).notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  publishedAt: timestamp("published_at").notNull(),
  raw: text("raw").notNull(),
  summary: text("summary"),
  changeType: text("change_type"), // capability|ui|policy|pricing|api|deprecation
  entities: text("entities").array().default(sql`'{}'::text[]`).notNull(),
  risks: text("risks").array().default(sql`'{}'::text[]`).notNull(),
  summaryAr: text("summary_ar"), // Arabic summary
  embeddings: jsonb("embeddings"), // for similarity search
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Impacts table
export const impacts = pgTable("impacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  changeEventId: varchar("change_event_id").references(() => changeEvents.id).notNull(),
  assetId: varchar("asset_id").references(() => assets.id).notNull(),
  predictedAction: text("predicted_action").notNull(), // FACE_RESHOOT|SCREEN_REDO|SLIDES_EDIT|POLICY_NOTE
  severity: text("severity").notNull(), // SEV1|SEV2|SEV3
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
  reasons: text("reasons").array().default(sql`'{}'::text[]`).notNull(),
  status: text("status").default("PENDING").notNull(), // PENDING|APPROVED|REJECTED
  decidedBy: varchar("decided_by"),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  impactId: varchar("impact_id").references(() => impacts.id).notNull(),
  action: text("action").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  owner: text("owner").notNull(), // HAMADA|EMAN|EDITOR
  dueDate: timestamp("due_date").notNull(),
  status: text("status").default("OPEN").notNull(), // OPEN|IN_PROGRESS|BLOCKED|DONE
  evidenceUrl: text("evidence_url"),
  blockReason: text("block_reason"),
  progress: integer("progress").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Decision Rules table
export const decisionRules = pgTable("decision_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pattern: text("pattern").notNull(),
  action: text("action").notNull(),
  severity: text("severity").notNull(),
  modules: text("modules").array().default(sql`'{}'::text[]`).notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// SLA Configuration table
export const slaConfig = pgTable("sla_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  severity: text("severity").notNull().unique(),
  patchWithinHours: integer("patch_within_hours").notNull(),
  comms: text("comms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").default("USER").notNull(), // USER|ADMIN
  isActive: boolean("is_active").default(true).notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Magic Links table
export const magicLinks = pgTable("magic_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notification Log table
export const notificationLog = pgTable("notification_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // EMAIL|WEBHOOK
  recipient: text("recipient").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  status: text("status").default("PENDING").notNull(), // PENDING|SENT|FAILED
  sentAt: timestamp("sent_at"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Audit Log table
export const auditLog = pgTable("audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const vendorsRelations = relations(vendors, ({ many }) => ({
  sources: many(sources),
  changeEvents: many(changeEvents),
}));

export const sourcesRelations = relations(sources, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [sources.vendorId],
    references: [vendors.id],
  }),
  changeEvents: many(changeEvents),
}));

export const modulesRelations = relations(modules, ({ many }) => ({
  assets: many(assets),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  module: one(modules, {
    fields: [assets.moduleId],
    references: [modules.id],
  }),
  impacts: many(impacts),
}));

export const changeEventsRelations = relations(changeEvents, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [changeEvents.vendorId],
    references: [vendors.id],
  }),
  source: one(sources, {
    fields: [changeEvents.sourceId],
    references: [sources.id],
  }),
  impacts: many(impacts),
}));

export const impactsRelations = relations(impacts, ({ one, many }) => ({
  changeEvent: one(changeEvents, {
    fields: [impacts.changeEventId],
    references: [changeEvents.id],
  }),
  asset: one(assets, {
    fields: [impacts.assetId],
    references: [assets.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  impact: one(impacts, {
    fields: [tasks.impactId],
    references: [impacts.id],
  }),
}));

// Insert schemas
export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSourceSchema = createInsertSchema(sources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastChecked: true,
});

export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastReviewed: true,
  nextDue: true,
});

export const insertChangeEventSchema = createInsertSchema(changeEvents).omit({
  id: true,
  createdAt: true,
});

export const insertImpactSchema = createInsertSchema(impacts).omit({
  id: true,
  createdAt: true,
  decidedBy: true,
  decidedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const insertMagicLinkSchema = createInsertSchema(magicLinks).omit({
  id: true,
  createdAt: true,
});

// Select types
export type Vendor = typeof vendors.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type ChangeEvent = typeof changeEvents.$inferSelect;
export type Impact = typeof impacts.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type DecisionRule = typeof decisionRules.$inferSelect;
export type SlaConfig = typeof slaConfig.$inferSelect;
export type User = typeof users.$inferSelect;
export type MagicLink = typeof magicLinks.$inferSelect;
export type NotificationLog = typeof notificationLog.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;

// Insert types
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type InsertSource = z.infer<typeof insertSourceSchema>;
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type InsertChangeEvent = z.infer<typeof insertChangeEventSchema>;
export type InsertImpact = z.infer<typeof insertImpactSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertMagicLink = z.infer<typeof insertMagicLinkSchema>;

import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  durationHours: integer("duration_hours").notNull(),
  speedMbps: integer("speed_mbps").notNull(),
  dataLimitGB: integer("data_limit_gb"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const mikrotikRouters = pgTable("mikrotik_routers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  host: text("host").notNull(),
  port: integer("port").notNull().default(8728),
  username: text("username").notNull(),
  password: text("password").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastSeen: timestamp("last_seen"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const hotspotUsers = pgTable("hotspot_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  macAddress: text("mac_address").notNull().unique(),
  phoneNumber: text("phone_number"),
  planId: varchar("plan_id").references(() => subscriptionPlans.id),
  routerId: varchar("router_id").references(() => mikrotikRouters.id),
  username: text("username"),
  password: text("password"),
  isActive: boolean("is_active").notNull().default(false),
  expiresAt: timestamp("expires_at"),
  bytesUploaded: integer("bytes_uploaded").default(0),
  bytesDownloaded: integer("bytes_downloaded").default(0),
  sessionTime: integer("session_time").default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const mpesaTransactions = pgTable("mpesa_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  checkoutRequestId: text("checkout_request_id").unique(),
  merchantRequestId: text("merchant_request_id"),
  phoneNumber: text("phone_number").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  planId: varchar("plan_id").references(() => subscriptionPlans.id),
  userId: varchar("user_id").references(() => hotspotUsers.id),
  status: text("status").notNull().default("pending"), // pending, completed, failed, cancelled
  mpesaReceiptNumber: text("mpesa_receipt_number"),
  transactionDate: timestamp("transaction_date"),
  callbackData: jsonb("callback_data"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => hotspotUsers.id),
  routerId: varchar("router_id").references(() => mikrotikRouters.id),
  sessionId: text("session_id"),
  startTime: timestamp("start_time").notNull().default(sql`now()`),
  endTime: timestamp("end_time"),
  bytesUploaded: integer("bytes_uploaded").default(0),
  bytesDownloaded: integer("bytes_downloaded").default(0),
  isActive: boolean("is_active").notNull().default(true),
});

// Relations
export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  users: many(hotspotUsers),
  transactions: many(mpesaTransactions),
}));

export const mikrotikRoutersRelations = relations(mikrotikRouters, ({ many }) => ({
  users: many(hotspotUsers),
  sessions: many(userSessions),
}));

export const hotspotUsersRelations = relations(hotspotUsers, ({ one, many }) => ({
  plan: one(subscriptionPlans, {
    fields: [hotspotUsers.planId],
    references: [subscriptionPlans.id],
  }),
  router: one(mikrotikRouters, {
    fields: [hotspotUsers.routerId],
    references: [mikrotikRouters.id],
  }),
  transactions: many(mpesaTransactions),
  sessions: many(userSessions),
}));

export const mpesaTransactionsRelations = relations(mpesaTransactions, ({ one }) => ({
  plan: one(subscriptionPlans, {
    fields: [mpesaTransactions.planId],
    references: [subscriptionPlans.id],
  }),
  user: one(hotspotUsers, {
    fields: [mpesaTransactions.userId],
    references: [hotspotUsers.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(hotspotUsers, {
    fields: [userSessions.userId],
    references: [hotspotUsers.id],
  }),
  router: one(mikrotikRouters, {
    fields: [userSessions.routerId],
    references: [mikrotikRouters.id],
  }),
}));

// Insert schemas
export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMikrotikRouterSchema = createInsertSchema(mikrotikRouters).omit({
  id: true,
  lastSeen: true,
  createdAt: true,
});

export const insertHotspotUserSchema = createInsertSchema(hotspotUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMpesaTransactionSchema = createInsertSchema(mpesaTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
});

// Types
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type MikrotikRouter = typeof mikrotikRouters.$inferSelect;
export type InsertMikrotikRouter = z.infer<typeof insertMikrotikRouterSchema>;

export type HotspotUser = typeof hotspotUsers.$inferSelect;
export type InsertHotspotUser = z.infer<typeof insertHotspotUserSchema>;

export type MpesaTransaction = typeof mpesaTransactions.$inferSelect;
export type InsertMpesaTransaction = z.infer<typeof insertMpesaTransactionSchema>;

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;

// Additional validation schemas
export const mpesaPaymentSchema = z.object({
  phoneNumber: z.string().regex(/^254\d{9}$/, "Invalid Kenyan phone number format"),
  planId: z.string().min(1, "Plan ID is required"),
  macAddress: z.string().min(1, "MAC address is required"),
});

export const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type MpesaPaymentRequest = z.infer<typeof mpesaPaymentSchema>;
export type AdminLoginRequest = z.infer<typeof adminLoginSchema>;

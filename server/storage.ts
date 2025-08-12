import {
  admins,
  subscriptionPlans,
  mikrotikRouters,
  hotspotUsers,
  mpesaTransactions,
  userSessions,
  type Admin,
  type InsertAdmin,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type MikrotikRouter,
  type InsertMikrotikRouter,
  type HotspotUser,
  type InsertHotspotUser,
  type MpesaTransaction,
  type InsertMpesaTransaction,
  type UserSession,
  type InsertUserSession,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sum, gte } from "drizzle-orm";

export interface IStorage {
  // Admin operations
  getAdmin(id: string): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;

  // Subscription plan operations
  getAllPlans(): Promise<SubscriptionPlan[]>;
  getActivePlans(): Promise<SubscriptionPlan[]>;
  getPlan(id: string): Promise<SubscriptionPlan | undefined>;
  createPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updatePlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  deletePlan(id: string): Promise<boolean>;

  // MikroTik router operations
  getAllRouters(): Promise<MikrotikRouter[]>;
  getActiveRouters(): Promise<MikrotikRouter[]>;
  getRouter(id: string): Promise<MikrotikRouter | undefined>;
  createRouter(router: InsertMikrotikRouter): Promise<MikrotikRouter>;
  updateRouter(id: string, router: Partial<InsertMikrotikRouter>): Promise<MikrotikRouter | undefined>;
  updateRouterLastSeen(id: string): Promise<void>;

  // Hotspot user operations
  getAllUsers(): Promise<HotspotUser[]>;
  getActiveUsers(): Promise<HotspotUser[]>;
  getUser(id: string): Promise<HotspotUser | undefined>;
  getUserByMacAddress(macAddress: string): Promise<HotspotUser | undefined>;
  createUser(user: InsertHotspotUser): Promise<HotspotUser>;
  updateUser(id: string, user: Partial<InsertHotspotUser>): Promise<HotspotUser | undefined>;
  activateUser(id: string, expiresAt: Date): Promise<void>;
  deactivateUser(id: string): Promise<void>;

  // M-Pesa transaction operations
  getAllTransactions(): Promise<MpesaTransaction[]>;
  getRecentTransactions(limit?: number): Promise<MpesaTransaction[]>;
  getTransaction(id: string): Promise<MpesaTransaction | undefined>;
  getTransactionByCheckoutRequestId(checkoutRequestId: string): Promise<MpesaTransaction | undefined>;
  createTransaction(transaction: InsertMpesaTransaction): Promise<MpesaTransaction>;
  updateTransaction(id: string, transaction: Partial<InsertMpesaTransaction>): Promise<MpesaTransaction | undefined>;

  // User session operations
  createSession(session: InsertUserSession): Promise<UserSession>;
  getActiveSessionsByUser(userId: string): Promise<UserSession[]>;
  endSession(id: string): Promise<void>;

  // Statistics
  getDashboardStats(): Promise<{
    activeUsers: number;
    totalRevenue: string;
    connectedRouters: number;
    todaySales: string;
    todayTransactions: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Admin operations
  async getAdmin(id: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin || undefined;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    return admin || undefined;
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const [admin] = await db.insert(admins).values(insertAdmin).returning();
    return admin;
  }

  // Subscription plan operations
  async getAllPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.price);
  }

  async getActivePlans(): Promise<SubscriptionPlan[]> {
    return await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.price);
  }

  async getPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan || undefined;
  }

  async createPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db.insert(subscriptionPlans).values(plan).returning();
    return newPlan;
  }

  async updatePlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set({ ...plan, updatedAt: new Date() })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updatedPlan || undefined;
  }

  async deletePlan(id: string): Promise<boolean> {
    const result = await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // MikroTik router operations
  async getAllRouters(): Promise<MikrotikRouter[]> {
    return await db.select().from(mikrotikRouters).orderBy(mikrotikRouters.name);
  }

  async getActiveRouters(): Promise<MikrotikRouter[]> {
    return await db
      .select()
      .from(mikrotikRouters)
      .where(eq(mikrotikRouters.isActive, true))
      .orderBy(mikrotikRouters.name);
  }

  async getRouter(id: string): Promise<MikrotikRouter | undefined> {
    const [router] = await db.select().from(mikrotikRouters).where(eq(mikrotikRouters.id, id));
    return router || undefined;
  }

  async createRouter(router: InsertMikrotikRouter): Promise<MikrotikRouter> {
    const [newRouter] = await db.insert(mikrotikRouters).values(router).returning();
    return newRouter;
  }

  async updateRouter(id: string, router: Partial<InsertMikrotikRouter>): Promise<MikrotikRouter | undefined> {
    const [updatedRouter] = await db
      .update(mikrotikRouters)
      .set(router)
      .where(eq(mikrotikRouters.id, id))
      .returning();
    return updatedRouter || undefined;
  }

  async updateRouterLastSeen(id: string): Promise<void> {
    await db
      .update(mikrotikRouters)
      .set({ lastSeen: new Date() })
      .where(eq(mikrotikRouters.id, id));
  }

  // Hotspot user operations
  async getAllUsers(): Promise<HotspotUser[]> {
    return await db.select().from(hotspotUsers).orderBy(desc(hotspotUsers.createdAt));
  }

  async getActiveUsers(): Promise<HotspotUser[]> {
    return await db
      .select()
      .from(hotspotUsers)
      .where(and(
        eq(hotspotUsers.isActive, true),
        gte(hotspotUsers.expiresAt, new Date())
      ))
      .orderBy(desc(hotspotUsers.createdAt));
  }

  async getUser(id: string): Promise<HotspotUser | undefined> {
    const [user] = await db.select().from(hotspotUsers).where(eq(hotspotUsers.id, id));
    return user || undefined;
  }

  async getUserByMacAddress(macAddress: string): Promise<HotspotUser | undefined> {
    const [user] = await db.select().from(hotspotUsers).where(eq(hotspotUsers.macAddress, macAddress));
    return user || undefined;
  }

  async createUser(user: InsertHotspotUser): Promise<HotspotUser> {
    const [newUser] = await db.insert(hotspotUsers).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertHotspotUser>): Promise<HotspotUser | undefined> {
    const [updatedUser] = await db
      .update(hotspotUsers)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(hotspotUsers.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async activateUser(id: string, expiresAt: Date): Promise<void> {
    await db
      .update(hotspotUsers)
      .set({ 
        isActive: true, 
        expiresAt,
        updatedAt: new Date()
      })
      .where(eq(hotspotUsers.id, id));
  }

  async deactivateUser(id: string): Promise<void> {
    await db
      .update(hotspotUsers)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(hotspotUsers.id, id));
  }

  // M-Pesa transaction operations
  async getAllTransactions(): Promise<MpesaTransaction[]> {
    return await db.select().from(mpesaTransactions).orderBy(desc(mpesaTransactions.createdAt));
  }

  async getRecentTransactions(limit = 10): Promise<MpesaTransaction[]> {
    return await db
      .select()
      .from(mpesaTransactions)
      .orderBy(desc(mpesaTransactions.createdAt))
      .limit(limit);
  }

  async getTransaction(id: string): Promise<MpesaTransaction | undefined> {
    const [transaction] = await db.select().from(mpesaTransactions).where(eq(mpesaTransactions.id, id));
    return transaction || undefined;
  }

  async getTransactionByCheckoutRequestId(checkoutRequestId: string): Promise<MpesaTransaction | undefined> {
    const [transaction] = await db
      .select()
      .from(mpesaTransactions)
      .where(eq(mpesaTransactions.checkoutRequestId, checkoutRequestId));
    return transaction || undefined;
  }

  async createTransaction(transaction: InsertMpesaTransaction): Promise<MpesaTransaction> {
    const [newTransaction] = await db.insert(mpesaTransactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransaction(id: string, transaction: Partial<InsertMpesaTransaction>): Promise<MpesaTransaction | undefined> {
    const [updatedTransaction] = await db
      .update(mpesaTransactions)
      .set({ ...transaction, updatedAt: new Date() })
      .where(eq(mpesaTransactions.id, id))
      .returning();
    return updatedTransaction || undefined;
  }

  // User session operations
  async createSession(session: InsertUserSession): Promise<UserSession> {
    const [newSession] = await db.insert(userSessions).values(session).returning();
    return newSession;
  }

  async getActiveSessionsByUser(userId: string): Promise<UserSession[]> {
    return await db
      .select()
      .from(userSessions)
      .where(and(
        eq(userSessions.userId, userId),
        eq(userSessions.isActive, true)
      ));
  }

  async endSession(id: string): Promise<void> {
    await db
      .update(userSessions)
      .set({ 
        endTime: new Date(),
        isActive: false
      })
      .where(eq(userSessions.id, id));
  }

  // Statistics
  async getDashboardStats(): Promise<{
    activeUsers: number;
    totalRevenue: string;
    connectedRouters: number;
    todaySales: string;
    todayTransactions: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get active users count
    const [activeUsersResult] = await db
      .select({ count: count() })
      .from(hotspotUsers)
      .where(and(
        eq(hotspotUsers.isActive, true),
        gte(hotspotUsers.expiresAt, new Date())
      ));

    // Get total revenue
    const [totalRevenueResult] = await db
      .select({ total: sum(mpesaTransactions.amount) })
      .from(mpesaTransactions)
      .where(eq(mpesaTransactions.status, "completed"));

    // Get connected routers count
    const [routersResult] = await db
      .select({ count: count() })
      .from(mikrotikRouters)
      .where(eq(mikrotikRouters.isActive, true));

    // Get today's sales
    const [todaySalesResult] = await db
      .select({ 
        total: sum(mpesaTransactions.amount),
        count: count()
      })
      .from(mpesaTransactions)
      .where(and(
        eq(mpesaTransactions.status, "completed"),
        gte(mpesaTransactions.transactionDate, today)
      ));

    return {
      activeUsers: activeUsersResult.count,
      totalRevenue: totalRevenueResult.total || "0",
      connectedRouters: routersResult.count,
      todaySales: todaySalesResult.total || "0",
      todayTransactions: todaySalesResult.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();

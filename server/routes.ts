import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { mpesaService } from "./services/mpesa";
import { mikrotikService } from "./services/mikrotik";
import {
  mpesaPaymentSchema,
  adminLoginSchema,
  insertSubscriptionPlanSchema,
  insertMikrotikRouterSchema,
  type MpesaPaymentRequest,
  type AdminLoginRequest,
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Public routes - no authentication required

  // Get active subscription plans for captive portal
  app.get("/api/plans", async (req, res) => {
    try {
      const plans = await storage.getActivePlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Initiate M-Pesa payment
  app.post("/api/payment/initiate", async (req, res) => {
    try {
      const validatedData = mpesaPaymentSchema.parse(req.body);
      const { phoneNumber, planId, macAddress } = validatedData;

      // Get the subscription plan
      const plan = await storage.getPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }

      // Check if user already exists
      let user = await storage.getUserByMacAddress(macAddress);
      if (!user) {
        // Create new user
        user = await storage.createUser({
          macAddress,
          phoneNumber,
          planId,
          username: `user_${macAddress.replace(/:/g, "")}`,
          password: randomUUID().slice(0, 8),
        });
      }

      // Format phone number for M-Pesa
      const formattedPhone = mpesaService.formatPhoneNumber(phoneNumber);
      
      // Initiate STK push
      const stkResponse = await mpesaService.initiateStkPush(
        formattedPhone,
        parseFloat(plan.price),
        user.id
      );

      // Create transaction record
      const transaction = await storage.createTransaction({
        checkoutRequestId: stkResponse.CheckoutRequestID,
        merchantRequestId: stkResponse.MerchantRequestID,
        phoneNumber: formattedPhone,
        amount: plan.price,
        planId: plan.id,
        userId: user.id,
        status: "pending",
      });

      res.json({
        success: true,
        message: "STK push initiated successfully",
        checkoutRequestId: stkResponse.CheckoutRequestID,
        transactionId: transaction.id,
      });
    } catch (error) {
      console.error("Payment initiation error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Payment initiation failed" 
      });
    }
  });

  // M-Pesa callback endpoint
  app.post("/api/payment/callback", async (req, res) => {
    try {
      const callbackData = req.body;
      const { stkCallback } = callbackData.Body;
      
      // Find transaction by checkout request ID
      const transaction = await storage.getTransactionByCheckoutRequestId(
        stkCallback.CheckoutRequestID
      );

      if (!transaction) {
        console.error("Transaction not found for callback:", stkCallback.CheckoutRequestID);
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Parse callback data
      const paymentResult = mpesaService.parseCallbackData(callbackData);

      if (paymentResult.success) {
        // Update transaction status
        await storage.updateTransaction(transaction.id, {
          status: "completed",
          mpesaReceiptNumber: paymentResult.mpesaReceiptNumber,
          transactionDate: paymentResult.transactionDate,
          callbackData: callbackData,
        });

        // Get plan details to calculate expiry
        const plan = await storage.getPlan(transaction.planId!);
        if (plan && transaction.userId) {
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + plan.durationHours);

          // Activate user
          await storage.activateUser(transaction.userId, expiresAt);

          // Create hotspot user on MikroTik router
          const user = await storage.getUser(transaction.userId);
          if (user && user.routerId) {
            await mikrotikService.createHotspotUser(user.routerId, {
              username: user.username!,
              password: user.password!,
              profile: `profile_${plan.speedMbps}M`,
              macAddress: user.macAddress,
            });

            await mikrotikService.enableHotspotUser(user.routerId, user.username!);
          }
        }
      } else {
        // Update transaction status to failed
        await storage.updateTransaction(transaction.id, {
          status: "failed",
          callbackData: callbackData,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Callback processing error:", error);
      res.status(500).json({ message: "Callback processing failed" });
    }
  });

  // Check payment status
  app.get("/api/payment/status/:transactionId", async (req, res) => {
    try {
      const { transactionId } = req.params;
      const transaction = await storage.getTransaction(transactionId);

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.json({
        status: transaction.status,
        amount: transaction.amount,
        phoneNumber: transaction.phoneNumber,
        createdAt: transaction.createdAt,
      });
    } catch (error) {
      console.error("Error checking payment status:", error);
      res.status(500).json({ message: "Failed to check payment status" });
    }
  });

  // Admin authentication
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = adminLoginSchema.parse(req.body);
      
      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In a real app, you'd set up proper session management here
      res.json({
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(400).json({ message: "Login failed" });
    }
  });

  // Protected admin routes (in a real app, add authentication middleware)

  // Dashboard statistics
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Subscription plans management
  app.get("/api/admin/plans", async (req, res) => {
    try {
      const plans = await storage.getAllPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  app.post("/api/admin/plans", async (req, res) => {
    try {
      const planData = insertSubscriptionPlanSchema.parse(req.body);
      const plan = await storage.createPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating plan:", error);
      res.status(400).json({ message: "Failed to create plan" });
    }
  });

  app.put("/api/admin/plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const planData = insertSubscriptionPlanSchema.partial().parse(req.body);
      const plan = await storage.updatePlan(id, planData);
      
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      
      res.json(plan);
    } catch (error) {
      console.error("Error updating plan:", error);
      res.status(400).json({ message: "Failed to update plan" });
    }
  });

  app.delete("/api/admin/plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deletePlan(id);
      
      if (!success) {
        return res.status(404).json({ message: "Plan not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting plan:", error);
      res.status(500).json({ message: "Failed to delete plan" });
    }
  });

  // Users management
  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/active", async (req, res) => {
    try {
      const users = await storage.getActiveUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching active users:", error);
      res.status(500).json({ message: "Failed to fetch active users" });
    }
  });

  // Transactions management
  app.get("/api/admin/transactions", async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/admin/transactions/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const transactions = await storage.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      res.status(500).json({ message: "Failed to fetch recent transactions" });
    }
  });

  // MikroTik routers management
  app.get("/api/admin/routers", async (req, res) => {
    try {
      const routers = await storage.getAllRouters();
      res.json(routers);
    } catch (error) {
      console.error("Error fetching routers:", error);
      res.status(500).json({ message: "Failed to fetch routers" });
    }
  });

  app.post("/api/admin/routers", async (req, res) => {
    try {
      const routerData = insertMikrotikRouterSchema.parse(req.body);
      const router = await storage.createRouter(routerData);
      
      // Test connection to the router
      const connectionTest = await mikrotikService.testConnection(router);
      if (connectionTest) {
        await mikrotikService.connectToRouter(router);
        await storage.updateRouterLastSeen(router.id);
      }
      
      res.status(201).json({ ...router, connectionTest });
    } catch (error) {
      console.error("Error creating router:", error);
      res.status(400).json({ message: "Failed to create router" });
    }
  });

  app.put("/api/admin/routers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const routerData = insertMikrotikRouterSchema.partial().parse(req.body);
      const router = await storage.updateRouter(id, routerData);
      
      if (!router) {
        return res.status(404).json({ message: "Router not found" });
      }
      
      res.json(router);
    } catch (error) {
      console.error("Error updating router:", error);
      res.status(400).json({ message: "Failed to update router" });
    }
  });

  // Test router connection
  app.post("/api/admin/routers/:id/test", async (req, res) => {
    try {
      const { id } = req.params;
      const router = await storage.getRouter(id);
      
      if (!router) {
        return res.status(404).json({ message: "Router not found" });
      }
      
      const connectionTest = await mikrotikService.testConnection(router);
      
      if (connectionTest) {
        await storage.updateRouterLastSeen(router.id);
      }
      
      res.json({ success: connectionTest });
    } catch (error) {
      console.error("Error testing router connection:", error);
      res.status(500).json({ message: "Failed to test router connection" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

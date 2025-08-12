import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AdminSidebar from "@/components/admin-sidebar";
import StatsCards from "@/components/stats-cards";
import PlansManagement from "@/components/plans-management";
import RecentPayments from "@/components/recent-payments";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();

  // Check if admin is logged in
  useEffect(() => {
    const admin = sessionStorage.getItem("admin");
    if (!admin) {
      setLocation("/admin");
    }
  }, [setLocation]);

  const { data: stats, isLoading: statsLoading } = useQuery<{
    activeUsers: number;
    totalRevenue: string;
    connectedRouters: number;
    todaySales: string;
    todayTransactions: number;
  }>({
    queryKey: ['/api/admin/stats'],
  });

  const admin = JSON.parse(sessionStorage.getItem("admin") || "{}");

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar admin={admin} />
      
      {/* Main Content */}
      <main className="ml-72 p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900" data-testid="text-dashboard-title">
                Dashboard Overview
              </h1>
              <p className="text-slate-600">
                Monitor your hotspot performance and manage subscriptions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button className="bg-primary text-white hover:bg-primary/90" data-testid="button-new-plan">
                <Plus className="mr-2 w-4 h-4" />
                New Plan
              </Button>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <StatsCards stats={stats} isLoading={statsLoading} />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          {/* Subscription Plans Management */}
          <div className="lg:col-span-2">
            <PlansManagement />
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="space-y-6">
            <RecentPayments />
            
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <Button 
                    className="w-full justify-center bg-primary/10 text-primary hover:bg-primary/20"
                    data-testid="button-create-new-plan"
                  >
                    <Plus className="mr-2 w-4 h-4" />
                    Create New Plan
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-center"
                    data-testid="button-export-report"
                  >
                    Export Report
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-center"
                    data-testid="button-sync-routers"
                  >
                    Sync Routers
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

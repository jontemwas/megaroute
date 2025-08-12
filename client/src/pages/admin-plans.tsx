import { useEffect } from "react";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/admin-sidebar";
import PlansManagement from "@/components/plans-management";

export default function AdminPlans() {
  const [, setLocation] = useLocation();

  // Check if admin is logged in
  useEffect(() => {
    const admin = sessionStorage.getItem("admin");
    if (!admin) {
      setLocation("/admin");
    }
  }, [setLocation]);

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
              <h1 className="text-2xl font-bold text-slate-900" data-testid="text-plans-title">
                Subscription Plans
              </h1>
              <p className="text-slate-600">
                Manage pricing and features for your internet packages
              </p>
            </div>
          </div>
        </header>

        {/* Plans Management */}
        <PlansManagement />
      </main>
    </div>
  );
}
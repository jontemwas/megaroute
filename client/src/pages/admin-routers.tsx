import { useEffect } from "react";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Router, Plus, Wifi, Globe, Signal } from "lucide-react";

export default function AdminRouters() {
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
              <h1 className="text-2xl font-bold text-slate-900" data-testid="text-routers-title">
                MikroTik Routers
              </h1>
              <p className="text-slate-600">
                Manage and monitor your RouterOS devices
              </p>
            </div>
            <Button className="bg-primary text-white hover:bg-primary/90" data-testid="button-add-router">
              <Plus className="mr-2 w-4 h-4" />
              Add Router
            </Button>
          </div>
        </header>

        {/* Router Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Router className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Routers</p>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Signal className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Online</p>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Wifi className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Active Hotspots</p>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Globe className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Bandwidth</p>
                  <p className="text-2xl font-bold text-slate-900">0 Mbps</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Routers List */}
        <Card>
          <CardHeader>
            <CardTitle>Configured Routers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Router className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-900">No routers configured</h3>
              <p className="mt-1 text-sm text-slate-500">
                Add your first MikroTik router to start managing hotspot users
              </p>
              <Button className="mt-4" data-testid="button-add-first-router">
                <Plus className="mr-2 w-4 h-4" />
                Add Your First Router
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
import { useEffect } from "react";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Settings, Save, User, Wifi, CreditCard } from "lucide-react";

export default function AdminSettings() {
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
              <h1 className="text-2xl font-bold text-slate-900" data-testid="text-settings-title">
                System Settings
              </h1>
              <p className="text-slate-600">
                Configure your hotspot system preferences
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6">
          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="admin-name">Admin Name</Label>
                  <Input
                    id="admin-name"
                    defaultValue={admin.name || "Admin User"}
                    data-testid="input-admin-name"
                  />
                </div>
                <div>
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    defaultValue={admin.email || "admin@hotspot.com"}
                    data-testid="input-admin-email"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="admin-username">Username</Label>
                <Input
                  id="admin-username"
                  defaultValue={admin.username || "admin"}
                  data-testid="input-admin-username"
                />
              </div>
            </CardContent>
          </Card>

          {/* Hotspot Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wifi className="mr-2 h-5 w-5" />
                Hotspot Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    placeholder="Your ISP Company"
                    data-testid="input-company-name"
                  />
                </div>
                <div>
                  <Label htmlFor="support-phone">Support Phone</Label>
                  <Input
                    id="support-phone"
                    placeholder="+254 700 000 000"
                    data-testid="input-support-phone"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="welcome-message">Welcome Message</Label>
                <Textarea
                  id="welcome-message"
                  placeholder="Welcome to our free WiFi! Please select a plan to continue."
                  data-testid="textarea-welcome-message"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="auto-logout" />
                <Label htmlFor="auto-logout">Automatic user logout after session expires</Label>
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                M-Pesa Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    placeholder="Your Business Name"
                    data-testid="input-business-name"
                  />
                </div>
                <div>
                  <Label htmlFor="short-code">Business Short Code</Label>
                  <Input
                    id="short-code"
                    placeholder="174379"
                    data-testid="input-short-code"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="test-mode" />
                <Label htmlFor="test-mode">Enable test mode (sandbox environment)</Label>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> M-Pesa credentials are configured via environment variables for security.
                  Contact your system administrator to update payment settings.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button className="bg-primary text-white hover:bg-primary/90" data-testid="button-save-settings">
              <Save className="mr-2 w-4 h-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
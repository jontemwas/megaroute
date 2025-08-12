import { useEffect } from "react";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, BarChart3, Calendar } from "lucide-react";

export default function AdminReports() {
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
              <h1 className="text-2xl font-bold text-slate-900" data-testid="text-reports-title">
                Reports & Analytics
              </h1>
              <p className="text-slate-600">
                Generate detailed reports for business insights
              </p>
            </div>
          </div>
        </header>

        {/* Report Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-blue-600" />
                Revenue Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Daily, weekly, and monthly revenue analysis with M-Pesa transaction details
              </p>
              <Button variant="outline" className="w-full" data-testid="button-revenue-report">
                <Download className="mr-2 w-4 h-4" />
                Generate Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-green-600" />
                Usage Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                User behavior, peak usage times, and bandwidth consumption patterns
              </p>
              <Button variant="outline" className="w-full" data-testid="button-usage-report">
                <Download className="mr-2 w-4 h-4" />
                Generate Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-purple-600" />
                Customer Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                User registration trends, subscription preferences, and retention metrics
              </p>
              <Button variant="outline" className="w-full" data-testid="button-customer-report">
                <Download className="mr-2 w-4 h-4" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-slate-900">No reports generated yet</h3>
              <p className="mt-1 text-sm text-slate-500">
                Generate your first report to see analytics and insights
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
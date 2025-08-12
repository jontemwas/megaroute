import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, Check, Zap, Shield, Headset } from "lucide-react";
import PaymentModal from "@/components/payment-modal";
import PaymentProcessing from "@/components/payment-processing";
import type { SubscriptionPlan } from "@shared/schema";

export default function CaptivePortal() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Get MAC address (in real implementation, this would come from the router)
  const [macAddress] = useState(() => {
    // Generate a mock MAC address for demo purposes
    return Array.from({ length: 6 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(':');
  });

  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/plans'],
  });

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentInitiated = (transactionId: string) => {
    setTransactionId(transactionId);
    setShowPaymentModal(false);
    setShowProcessingModal(true);
  };

  const handlePaymentComplete = () => {
    setShowProcessingModal(false);
    setSelectedPlan(null);
    setTransactionId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-captive flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin-slow w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-captive">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Wifi className="text-white text-lg" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">HotSpot Connect</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span>Connected to Free WiFi</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Welcome to Premium Internet
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Choose a subscription plan to enjoy high-speed internet access. Pay securely with M-Pesa and get instant activation.
          </p>
        </div>

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans?.map((plan, index) => (
            <Card 
              key={plan.id} 
              className={`hover:shadow-lg transition-shadow ${
                index === 1 ? 'border-2 border-primary relative' : ''
              }`}
              data-testid={`plan-card-${plan.id}`}
            >
              {index === 1 && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-white">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-semibold text-slate-900 mb-2">
                  {plan.name}
                </CardTitle>
                <div className="text-3xl font-bold text-primary mb-1" data-testid={`plan-price-${plan.id}`}>
                  KES {plan.price}
                </div>
                <p className="text-slate-500" data-testid={`plan-duration-${plan.id}`}>
                  {plan.durationHours >= 24 
                    ? `${Math.floor(plan.durationHours / 24)} Day${Math.floor(plan.durationHours / 24) > 1 ? 's' : ''}`
                    : `${plan.durationHours} Hours`
                  }
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center text-slate-600">
                    <Check className="text-success mr-3 w-4 h-4" />
                    <span>{plan.speedMbps} Mbps Speed</span>
                  </li>
                  <li className="flex items-center text-slate-600">
                    <Check className="text-success mr-3 w-4 h-4" />
                    <span>
                      {plan.dataLimitGB 
                        ? `${plan.dataLimitGB}GB Data Limit` 
                        : 'Unlimited Data'
                      }
                    </span>
                  </li>
                  <li className="flex items-center text-slate-600">
                    <Check className="text-success mr-3 w-4 h-4" />
                    <span>Email Support</span>
                  </li>
                </ul>
                <Button 
                  className="w-full bg-primary text-white hover:bg-primary/90 transition-colors"
                  onClick={() => handleSelectPlan(plan)}
                  data-testid={`button-select-plan-${plan.id}`}
                >
                  Select Plan
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <Card className="p-8">
          <h3 className="text-2xl font-semibold text-center text-slate-900 mb-8">
            Why Choose Our Service?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-info/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="text-info text-2xl" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Instant Activation</h4>
              <p className="text-slate-600 text-sm">
                Get connected immediately after payment confirmation
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-success text-2xl" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Secure Payments</h4>
              <p className="text-slate-600 text-sm">
                Safe and secure M-Pesa payment integration
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Headset className="text-warning text-2xl" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">24/7 Support</h4>
              <p className="text-slate-600 text-sm">
                Round-the-clock technical support available
              </p>
            </div>
          </div>
        </Card>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-slate-600">
          <p>&copy; 2024 HotSpot Connect. All rights reserved. | Powered by MikroTik</p>
        </div>
      </footer>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          macAddress={macAddress}
          onClose={() => setShowPaymentModal(false)}
          onPaymentInitiated={handlePaymentInitiated}
        />
      )}

      {/* Payment Processing Modal */}
      {showProcessingModal && transactionId && (
        <PaymentProcessing
          transactionId={transactionId}
          onComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}

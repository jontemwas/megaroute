import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentProcessingProps {
  transactionId: string;
  onComplete: () => void;
}

export default function PaymentProcessing({ transactionId, onComplete }: PaymentProcessingProps) {
  const [timeoutReached, setTimeoutReached] = useState(false);
  const { toast } = useToast();

  const { data: paymentStatus, isLoading } = useQuery({
    queryKey: ['/api/payment/status', transactionId],
    refetchInterval: (data) => {
      // Stop polling if payment is completed or failed
      if ((data as any)?.status === 'completed' || (data as any)?.status === 'failed' || timeoutReached) {
        return false;
      }
      return 3000; // Poll every 3 seconds
    },
    enabled: !!transactionId,
  });

  // Set timeout for payment processing (2 minutes)
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutReached(true);
    }, 120000); // 2 minutes

    return () => clearTimeout(timer);
  }, []);

  // Handle payment completion
  useEffect(() => {
    if ((paymentStatus as any)?.status === 'completed') {
      toast({
        title: "Payment Successful!",
        description: "Your internet access has been activated.",
      });
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else if ((paymentStatus as any)?.status === 'failed') {
      toast({
        title: "Payment Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
      setTimeout(() => {
        onComplete();
      }, 3000);
    }
  }, [(paymentStatus as any)?.status, toast, onComplete]);

  const getStatusIcon = () => {
    if ((paymentStatus as any)?.status === 'completed') {
      return <CheckCircle className="text-success text-2xl" />;
    } else if ((paymentStatus as any)?.status === 'failed') {
      return <XCircle className="text-destructive text-2xl" />;
    } else {
      return <Loader2 className="text-warning text-2xl animate-spin" />;
    }
  };

  const getStatusMessage = () => {
    if ((paymentStatus as any)?.status === 'completed') {
      return {
        title: "Payment Successful!",
        description: "Your internet access has been activated.",
        color: "text-success",
      };
    } else if ((paymentStatus as any)?.status === 'failed') {
      return {
        title: "Payment Failed",
        description: "Please try again or contact support.",
        color: "text-destructive",
      };
    } else if (timeoutReached) {
      return {
        title: "Payment Timeout",
        description: "Please check your payment status or try again.",
        color: "text-warning",
      };
    } else {
      return {
        title: "Processing Payment...",
        description: "Please check your phone and enter your M-Pesa PIN",
        color: "text-warning",
      };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
            {getStatusIcon()}
          </div>
          
          <h3 className={`text-xl font-semibold mb-2 ${statusMessage.color}`} data-testid="text-payment-status-title">
            {statusMessage.title}
          </h3>
          
          <p className="text-slate-600 mb-4" data-testid="text-payment-status-description">
            {statusMessage.description}
          </p>

          {(paymentStatus as any)?.status === 'pending' && !timeoutReached && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
              <p className="text-sm text-warning">
                <strong>Step 1:</strong> Check your phone for M-Pesa prompt<br />
                <strong>Step 2:</strong> Enter your M-Pesa PIN<br />
                <strong>Step 3:</strong> Wait for confirmation
              </p>
            </div>
          )}

          {((paymentStatus as any)?.status === 'failed' || timeoutReached) && (
            <Button
              onClick={onComplete}
              className="mt-4"
              data-testid="button-close-payment-processing"
            >
              Close
            </Button>
          )}

          {(paymentStatus as any)?.status === 'completed' && (
            <div className="text-sm text-slate-600 mt-4">
              <p>Redirecting to internet access...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

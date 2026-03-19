import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IndianRupee, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const RAZORPAY_KEY_ID = "rzp_live_SRNbTwyEmzQSvO";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (
      options: Record<string, unknown>,
    ) => {
      open: () => void;
      on: (event: string, cb: (resp: any) => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface CashfreePaymentModalProps {
  open: boolean;
  amountINR: number;
  taskTitle: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function CashfreePaymentModal({
  open,
  amountINR,
  taskTitle,
  onSuccess,
  onClose,
}: CashfreePaymentModalProps) {
  const [loading, setLoading] = useState(false);
  // hide our dialog once razorpay sheet is open so it doesn't block touches
  const [dialogVisible, setDialogVisible] = useState(true);

  const handlePay = async () => {
    setLoading(true);
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      toast.error(
        "Failed to load payment gateway. Please check your connection.",
      );
      setLoading(false);
      return;
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: Math.round(amountINR * 100),
      currency: "INR",
      name: "Task Turtle",
      description: `Escrow: ${taskTitle}`,
      theme: { color: "#22c55e" },
      handler: (response: Record<string, string>) => {
        console.log("Razorpay payment success", response);
        toast.success(
          `₹${amountINR} escrowed successfully! Posting your task…`,
        );
        setLoading(false);
        setDialogVisible(true);
        onSuccess();
        onClose();
      },
      modal: {
        // keep backdrop transparent so our dialog area doesn't layer
        backdropclose: false,
        ondismiss: () => {
          setLoading(false);
          setDialogVisible(true);
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: Record<string, unknown>) => {
        console.error("Razorpay payment failed", response);
        toast.error("Payment failed. Please try again.");
        setLoading(false);
        setDialogVisible(true);
      });
      // Hide our dialog BEFORE opening Razorpay so it doesn't block touches
      setDialogVisible(false);
      rzp.open();
    } catch {
      toast.error("Failed to open payment. Please try again.");
      setLoading(false);
      setDialogVisible(true);
    }
  };

  // When our dialog is hidden (razorpay open), render nothing so overlay is gone
  if (!dialogVisible) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !loading && onClose()}>
      <DialogContent
        data-ocid="cashfree.payment.dialog"
        className="bg-card border-border rounded-3xl max-w-sm p-0 overflow-hidden shadow-2xl"
      >
        <div className="bg-gradient-to-br from-blue-500/15 via-transparent to-transparent px-6 pt-6 pb-4 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-xl text-foreground">
              Pay to Post Task
            </DialogTitle>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 rounded-full px-2 py-0.5 font-semibold">
                <ShieldCheck className="w-3 h-3" /> Secured by Razorpay
              </span>
              <span>• Escrow Protected</span>
            </p>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Task summary */}
          <div className="bg-secondary/50 rounded-2xl p-4 space-y-2 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Task
            </p>
            <p className="font-semibold text-foreground truncate">
              {taskTitle}
            </p>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-sm text-muted-foreground">
                Amount (escrow)
              </span>
              <span className="font-display font-black text-2xl text-green-vivid flex items-center gap-1">
                <IndianRupee className="w-5 h-5" />
                {amountINR}
              </span>
            </div>
          </div>

          {/* Escrow notice */}
          <div className="text-xs text-muted-foreground bg-blue-500/8 rounded-xl px-3 py-3 border border-blue-500/20 leading-relaxed">
            💰 Your payment is held in{" "}
            <strong className="text-foreground">escrow</strong>. It is only
            released to the tasker after you verify delivery with an OTP. You
            are protected if the task is not completed.
          </div>

          {/* Pay button */}
          <Button
            data-ocid="cashfree.payment.pay_button"
            onClick={handlePay}
            disabled={loading}
            size="lg"
            className="w-full font-bold rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all h-12"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Opening Payment…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Pay ₹{amountINR} (Escrow)
              </span>
            )}
          </Button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3.5 h-3.5 text-green-vivid shrink-0" />
            <span>256-bit SSL encryption • UPI, Cards, Net Banking</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

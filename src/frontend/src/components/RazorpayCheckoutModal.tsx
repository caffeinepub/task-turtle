import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CreditCard, Lock, Smartphone, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface RazorpayCheckoutModalProps {
  open: boolean;
  onClose: () => void;
}

const QUICK_AMOUNTS = [100, 200, 500, 1000];
const RAZORPAY_KEY_ID = "rzp_live_SRNbTwyEmzQSvO";

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

export default function RazorpayCheckoutModal({
  open,
  onClose,
}: RazorpayCheckoutModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(true);

  const finalAmount =
    selectedAmount ?? (customAmount ? Number(customAmount) : 0);

  const handlePay = async () => {
    if (!finalAmount || finalAmount < 1) {
      toast.error("Please select or enter an amount");
      return;
    }
    setLoading(true);
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      toast.error("Failed to load Razorpay. Please check your connection.");
      setLoading(false);
      return;
    }
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: finalAmount * 100,
      currency: "INR",
      name: "Task Turtle",
      description: "Wallet Top-up",
      prefill: { contact: "", email: "" },
      theme: { color: "#22c55e" },
      handler: () => {
        toast.success(`₹${finalAmount} added to wallet successfully!`);
        setDialogVisible(true);
        onClose();
        setLoading(false);
      },
      modal: {
        backdropclose: false,
        ondismiss: () => {
          setLoading(false);
          setDialogVisible(true);
        },
      },
    };
    try {
      const rzp = new window.Razorpay(options);
      // Hide our dialog before opening Razorpay so overlay doesn't block touches
      setDialogVisible(false);
      rzp.open();
    } catch {
      toast.error("Failed to open Razorpay checkout");
      setLoading(false);
      setDialogVisible(true);
    }
  };

  if (!dialogVisible) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-ocid="wallet.razorpay.dialog"
        className="bg-card border-border rounded-3xl max-w-sm p-0 overflow-hidden shadow-2xl"
      >
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-green-vivid/20 via-transparent to-transparent px-6 pt-6 pb-4 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-xl text-foreground">
              Add Money to Wallet
            </DialogTitle>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1 bg-[#3395FF]/10 text-[#3395FF] rounded-full px-2 py-0.5 font-semibold">
                <Zap className="w-3 h-3" /> Powered by Razorpay
              </span>
              <span className="text-muted-foreground">
                • UPI, Cards, Net Banking
              </span>
            </p>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Quick amounts */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Quick Select
            </p>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  data-ocid={
                    `wallet.razorpay.quick_amount.${QUICK_AMOUNTS.indexOf(amt) + 1}` as `wallet.razorpay.quick_amount.${1 | 2 | 3 | 4}`
                  }
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount("");
                  }}
                  className={`rounded-xl py-2.5 text-sm font-bold transition-all border ${
                    selectedAmount === amt
                      ? "bg-green-vivid text-black border-green-vivid shadow-green-sm"
                      : "bg-secondary text-foreground border-border hover:border-green-vivid/50 hover:bg-secondary/80"
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Custom Amount
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                ₹
              </span>
              <Input
                data-ocid="wallet.razorpay.custom_amount.input"
                type="number"
                placeholder="Enter amount"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                min="1"
                className="pl-7 bg-secondary border-border focus:border-green-vivid/50 rounded-xl h-11"
              />
            </div>
          </div>

          {/* Pay button */}
          <Button
            data-ocid="wallet.razorpay.pay_button"
            onClick={handlePay}
            disabled={loading || !finalAmount}
            size="lg"
            className="w-full font-bold rounded-2xl bg-[#3395FF] hover:bg-[#2980e8] text-white shadow-lg transition-all h-12"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Opening Razorpay…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Pay ₹{finalAmount || "—"} with Razorpay
              </span>
            )}
          </Button>

          {/* UPI icons hint */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-xl px-3 py-2.5">
            <Lock className="w-3.5 h-3.5 text-green-vivid shrink-0" />
            <span>Payments secured by Razorpay.</span>
            <span className="flex items-center gap-1 ml-auto shrink-0">
              <Smartphone className="w-3.5 h-3.5" /> UPI
            </span>
            <span>•</span>
            <CreditCard className="w-3.5 h-3.5" />
            <span>Cards</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

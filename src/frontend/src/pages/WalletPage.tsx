import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Info,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { TaskStatus } from "../backend.d";
import RazorpayCheckoutModal from "../components/RazorpayCheckoutModal";
import { useEarningsHistory, useWalletBalance } from "../hooks/useQueries";
import { formatINR, formatTimestamp } from "../utils/format";

export default function WalletPage() {
  const { data: balance = 0n, isLoading: balanceLoading } = useWalletBalance();
  const { data: earnings = [], isLoading: earningsLoading } =
    useEarningsHistory();
  const [showRazorpay, setShowRazorpay] = useState(false);

  // Calculate total earned (with 5% fee deducted)
  const totalEarned = earnings.reduce((sum, task) => {
    if (task.status === TaskStatus.completed) {
      const gross = task.amount + (task.tip ?? 0n);
      const fee = (gross * 5n) / 100n;
      return sum + gross - fee;
    }
    return sum;
  }, 0n);

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display font-black text-3xl sm:text-4xl">
            Your <span className="text-green-gradient">Wallet</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Earnings and payment history
          </p>
        </motion.div>

        {/* Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden glass-card rounded-3xl p-8 border-green-gradient shadow-green-md"
        >
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-48 h-48 bg-green-vivid opacity-5 blur-3xl rounded-full" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-green-surface rounded-2xl flex items-center justify-center shadow-green-sm">
                <Wallet className="w-6 h-6 text-green-vivid" />
              </div>
              <p className="text-muted-foreground font-medium">
                Current Balance
              </p>
            </div>

            {balanceLoading ? (
              <Skeleton className="h-12 w-40 bg-secondary mt-2" />
            ) : (
              <p
                className="font-display font-black text-5xl text-green-vivid mt-2 animate-pulse-green"
                style={{ animation: "none" }}
              >
                {formatINR(balance)}
              </p>
            )}

            <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  Total Earned (all time)
                </p>
                <p className="font-bold text-lg text-foreground mt-0.5">
                  {earningsLoading ? "—" : formatINR(totalEarned)}
                </p>
              </div>
              <Button
                size="lg"
                data-ocid="wallet.add_funds_button"
                onClick={() => setShowRazorpay(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-green-sm hover:shadow-green-md transition-all rounded-2xl"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Add Funds
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Platform fee transparency */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-start gap-3 glass-card rounded-2xl p-4 border-border bg-secondary/30"
        >
          <Info className="w-4 h-4 text-green-vivid flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">
              Task Turtle keeps 5% as platform fee.
            </span>{" "}
            You receive the remaining 95% of the task amount + tip directly in
            your wallet after OTP verification.
          </p>
        </motion.div>

        {/* Earnings history */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-vivid" />
            <h2 className="font-display font-bold text-xl">Earnings History</h2>
          </div>

          {earningsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-2xl bg-secondary" />
              ))}
            </div>
          ) : earnings.length === 0 ? (
            <div
              data-ocid="wallet.earnings.empty_state"
              className="glass-card rounded-2xl p-10 text-center border-border"
            >
              <div className="text-4xl mb-3">💰</div>
              <h3 className="font-semibold mb-1">No earnings yet</h3>
              <p className="text-muted-foreground text-sm">
                Complete tasks as a tasker to see your earnings here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {earnings.map((task, i) => {
                const gross = task.amount + (task.tip ?? 0n);
                const fee = (gross * 5n) / 100n;
                const earned = gross - fee;

                return (
                  <motion.div
                    key={String(task.id)}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card rounded-2xl p-4 border-border flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 bg-green-surface rounded-xl flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-4.5 h-4.5 text-green-vivid" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTimestamp(task.completedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-green-vivid">
                        +{formatINR(earned)}
                      </p>
                      <Badge className="text-xs bg-green-surface text-green-vivid border-0 mt-0.5">
                        Completed
                      </Badge>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
      <RazorpayCheckoutModal
        open={showRazorpay}
        onClose={() => setShowRazorpay(false)}
      />
    </>
  );
}

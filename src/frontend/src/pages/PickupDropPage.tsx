import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  MapPin,
  Package,
  Phone,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Truck,
  User,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { PickupDropActiveTask, PickupDropTask } from "../backend.d";
import {
  useAcceptPickupDropTask,
  useAvailablePickupDropTasks,
  useCreatePickupDropTask,
  useMarkPickupDropDelivered,
  useMarkPickupDropInProgress,
  useMyActivePickupDropTasks,
  useMyPostedPickupDropTasks,
  useVerifyPickupDropOtp,
} from "../hooks/usePickupDropQueries";
import { formatINR, formatTimestamp, inrToPaise } from "../utils/format";

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

function calcNetEarning(taskerFee: bigint, boostFee: bigint): bigint {
  const total = taskerFee + boostFee;
  const platformCut = (total * 15n) / 100n;
  return total - platformCut;
}

function getPdStatusLabel(status: PickupDropTask["status"]): string {
  const k = status.__kind__;
  if (k === "open") return "Open";
  if (k === "accepted") return "Accepted";
  if (k === "inProgress") return "In Progress";
  if (k === "delivered") return "Delivered";
  if (k === "completed") return "Completed";
  if (k === "failed") return "Failed";
  if (k === "cancelled") return "Cancelled";
  return "Unknown";
}

function PdStatusBadge({ status }: { status: PickupDropTask["status"] }) {
  const k = status.__kind__;
  const label = getPdStatusLabel(status);
  const cls =
    k === "open"
      ? "bg-blue-500/15 text-blue-400 border-blue-400/30"
      : k === "accepted"
        ? "bg-orange-400/15 text-orange-400 border-orange-400/30"
        : k === "inProgress"
          ? "bg-amber-400/15 text-amber-400 border-amber-400/30"
          : k === "delivered"
            ? "bg-purple-400/15 text-purple-400 border-purple-400/30"
            : k === "completed"
              ? "bg-green-surface text-green-vivid border-green-vivid/30"
              : k === "failed"
                ? "bg-red-500/15 text-red-400 border-red-400/30"
                : "bg-secondary text-muted-foreground border-border";
  return (
    <Badge
      className={`text-xs font-semibold border rounded-full px-2.5 py-0.5 ${cls}`}
    >
      {label}
    </Badge>
  );
}

// ─── Post Pickup-Drop Form ────────────────────────────────────────────────────

function PostPickupDropForm({ onSuccess }: { onSuccess: () => void }) {
  const [pickupOwnerName, setPickupOwnerName] = useState("");
  const [pickupContact, setPickupContact] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropOwnerName, setDropOwnerName] = useState("");
  const [dropContact, setDropContact] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const [productWorthStr, setProductWorthStr] = useState("");
  const [taskerFeeStr, setTaskerFeeStr] = useState("");
  const [boostFeeStr, setBoostFeeStr] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(true);

  const createTask = useCreatePickupDropTask();

  const productWorth = Number.parseFloat(productWorthStr) || 0;
  const taskerFee = Number.parseFloat(taskerFeeStr) || 0;
  const boostFee = Number.parseFloat(boostFeeStr) || 0;
  const totalCharged = taskerFee + boostFee;

  const isValid =
    pickupOwnerName.trim() &&
    pickupContact.trim() &&
    pickupLocation.trim() &&
    dropOwnerName.trim() &&
    dropContact.trim() &&
    dropLocation.trim() &&
    productWorthStr &&
    taskerFeeStr;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    if (totalCharged < 1) {
      return;
    }

    setPaymentLoading(true);
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      setPaymentLoading(false);
      return;
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: Math.round(totalCharged * 100),
      currency: "INR",
      name: "Task Turtle",
      description: `Pickup-Drop Task: ${pickupLocation} → ${dropLocation}`,
      theme: { color: "#3b82f6" },
      handler: async () => {
        setShowDialog(true);
        setPaymentLoading(false);
        try {
          await createTask.mutateAsync({
            pickupOwnerName: pickupOwnerName.trim(),
            pickupContact: pickupContact.trim(),
            pickupLocation: pickupLocation.trim(),
            dropOwnerName: dropOwnerName.trim(),
            dropContact: dropContact.trim(),
            dropLocation: dropLocation.trim(),
            productWorth: inrToPaise(productWorth),
            taskerFee: inrToPaise(taskerFee),
            boostFee: inrToPaise(boostFee),
          });
          // Reset form
          setPickupOwnerName("");
          setPickupContact("");
          setPickupLocation("");
          setDropOwnerName("");
          setDropContact("");
          setDropLocation("");
          setProductWorthStr("");
          setTaskerFeeStr("");
          setBoostFeeStr("");
          onSuccess();
        } catch {
          // error shown by mutation
        }
      },
      modal: {
        backdropclose: false,
        ondismiss: () => {
          setPaymentLoading(false);
          setShowDialog(true);
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      setShowDialog(false);
      rzp.open();
    } catch {
      setPaymentLoading(false);
      setShowDialog(true);
    }
  };

  if (!showDialog && paymentLoading) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pickup Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-blue-400/20">
          <div className="w-6 h-6 bg-blue-500/15 rounded-lg flex items-center justify-center">
            <Package className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <h3 className="font-semibold text-sm text-blue-400 uppercase tracking-wide">
            Pickup Details
          </h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pickup-owner" className="text-sm font-semibold">
              <User className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
              Pickup Owner Name *
            </Label>
            <Input
              id="pickup-owner"
              data-ocid="pickup_drop.pickup_owner_input"
              placeholder="e.g., Rahul Sharma"
              value={pickupOwnerName}
              onChange={(e) => setPickupOwnerName(e.target.value)}
              required
              className="bg-secondary border-border focus:border-blue-400/50 rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pickup-contact" className="text-sm font-semibold">
              <Phone className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
              Pickup Contact *
            </Label>
            <Input
              id="pickup-contact"
              data-ocid="pickup_drop.pickup_contact_input"
              type="tel"
              placeholder="+91 98765 43210"
              value={pickupContact}
              onChange={(e) => setPickupContact(e.target.value)}
              required
              className="bg-secondary border-border focus:border-blue-400/50 rounded-xl h-11"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pickup-loc" className="text-sm font-semibold">
            <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
            Pickup Location *
          </Label>
          <Input
            id="pickup-loc"
            data-ocid="pickup_drop.pickup_location_input"
            placeholder="e.g., Shop 12, Sector 18, Noida"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            required
            className="bg-secondary border-border focus:border-blue-400/50 rounded-xl h-11"
          />
        </div>
      </div>

      {/* Drop Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-blue-400/20">
          <div className="w-6 h-6 bg-blue-500/15 rounded-lg flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <h3 className="font-semibold text-sm text-blue-400 uppercase tracking-wide">
            Drop Details
          </h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="drop-owner" className="text-sm font-semibold">
              <User className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
              Drop Owner Name *
            </Label>
            <Input
              id="drop-owner"
              data-ocid="pickup_drop.drop_owner_input"
              placeholder="e.g., Priya Singh"
              value={dropOwnerName}
              onChange={(e) => setDropOwnerName(e.target.value)}
              required
              className="bg-secondary border-border focus:border-blue-400/50 rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="drop-contact" className="text-sm font-semibold">
              <Phone className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
              Drop Contact *
            </Label>
            <Input
              id="drop-contact"
              data-ocid="pickup_drop.drop_contact_input"
              type="tel"
              placeholder="+91 87654 32109"
              value={dropContact}
              onChange={(e) => setDropContact(e.target.value)}
              required
              className="bg-secondary border-border focus:border-blue-400/50 rounded-xl h-11"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="drop-loc" className="text-sm font-semibold">
            <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
            Drop Location *
          </Label>
          <Input
            id="drop-loc"
            data-ocid="pickup_drop.drop_location_input"
            placeholder="e.g., B-42, Vasant Kunj, Delhi"
            value={dropLocation}
            onChange={(e) => setDropLocation(e.target.value)}
            required
            className="bg-secondary border-border focus:border-blue-400/50 rounded-xl h-11"
          />
        </div>
      </div>

      {/* Task Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-amber-400/20">
          <div className="w-6 h-6 bg-amber-400/15 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <h3 className="font-semibold text-sm text-amber-400 uppercase tracking-wide">
            Task & Payment Details
          </h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-worth" className="text-sm font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5 text-amber-400" />
            <span className="text-amber-400">
              Security Deposit / Product Worth
            </span>{" "}
            *
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
              ₹
            </span>
            <Input
              id="product-worth"
              data-ocid="pickup_drop.product_worth_input"
              type="number"
              placeholder="e.g., 5000"
              value={productWorthStr}
              onChange={(e) => setProductWorthStr(e.target.value)}
              min="1"
              required
              className="pl-7 bg-amber-400/5 border-amber-400/30 focus:border-amber-400/60 rounded-xl h-11 text-amber-400 font-semibold"
            />
          </div>
          <p className="text-xs text-amber-400/70">
            Tasker pays this as a security deposit when accepting. Refunded
            after successful delivery.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tasker-fee" className="text-sm font-semibold">
              Tasker Fee (₹) *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                ₹
              </span>
              <Input
                id="tasker-fee"
                data-ocid="pickup_drop.tasker_fee_input"
                type="number"
                placeholder="e.g., 150"
                value={taskerFeeStr}
                onChange={(e) => setTaskerFeeStr(e.target.value)}
                min="1"
                required
                className="pl-7 bg-secondary border-border focus:border-blue-400/50 rounded-xl h-11"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="boost-fee" className="text-sm font-semibold">
              Boost Fee (₹){" "}
              <span className="text-muted-foreground font-normal">
                — optional
              </span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                ₹
              </span>
              <Input
                id="boost-fee"
                data-ocid="pickup_drop.boost_fee_input"
                type="number"
                placeholder="e.g., 20"
                value={boostFeeStr}
                onChange={(e) => setBoostFeeStr(e.target.value)}
                min="0"
                className="pl-7 bg-secondary border-border focus:border-blue-400/50 rounded-xl h-11"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      {taskerFeeStr && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/8 border border-blue-400/25 rounded-xl p-4 space-y-2"
        >
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-3">
            Payment Summary
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tasker Fee</span>
            <span className="font-medium">₹{taskerFee.toFixed(2)}</span>
          </div>
          {boostFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Boost Fee</span>
              <span className="font-medium">₹{boostFee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-blue-400 border-t border-blue-400/20 pt-2">
            <span>You Pay</span>
            <span>₹{totalCharged.toFixed(2)}</span>
          </div>
        </motion.div>
      )}

      <Button
        type="submit"
        size="lg"
        data-ocid="pickup_drop.post_task_submit_button"
        disabled={!isValid || paymentLoading || createTask.isPending}
        className="w-full font-bold py-6 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white shadow-[0_4px_20px_oklch(0.6_0.2_240/0.3)] transition-all"
      >
        {paymentLoading || createTask.isPending ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <PlusCircle className="w-5 h-5 mr-2" />
            Pay ₹{totalCharged > 0 ? totalCharged.toFixed(0) : "—"} & Post Task
          </>
        )}
      </Button>
    </form>
  );
}

// ─── Available Pickup-Drop Task Card ─────────────────────────────────────────

function AvailablePdTaskCard({
  task,
  index,
}: { task: PickupDropTask; index: number }) {
  const acceptTask = useAcceptPickupDropTask();
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [rzpDialogVisible, setRzpDialogVisible] = useState(true);

  const productWorthRupees = Number(task.productWorth) / 100;
  const netEarning = calcNetEarning(task.taskerFee, task.boostFee);

  const handleConfirmAccept = async () => {
    if (productWorthRupees < 1) {
      // Free task — accept directly
      setShowAcceptDialog(false);
      await acceptTask.mutateAsync(task.id);
      return;
    }
    setPaymentLoading(true);
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      setPaymentLoading(false);
      return;
    }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: Math.round(productWorthRupees * 100),
      currency: "INR",
      name: "Task Turtle",
      description: "Security Deposit for Pickup-Drop Task",
      theme: { color: "#f59e0b" },
      handler: async () => {
        setRzpDialogVisible(true);
        setPaymentLoading(false);
        setShowAcceptDialog(false);
        await acceptTask.mutateAsync(task.id);
      },
      modal: {
        backdropclose: false,
        ondismiss: () => {
          setPaymentLoading(false);
          setRzpDialogVisible(true);
        },
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      setRzpDialogVisible(false);
      rzp.open();
    } catch {
      setPaymentLoading(false);
      setRzpDialogVisible(true);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        data-ocid={`pickup_drop.task_item.${index + 1}`}
        className="glass-card rounded-2xl p-5 border-border hover:border-blue-400/30 hover:shadow-[0_0_20px_oklch(0.6_0.2_240/0.1)] transition-all duration-300 space-y-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500/15 text-blue-400 border-blue-400/30 text-xs font-semibold">
              🔵 Pickup-Drop
            </Badge>
          </div>
          <PdStatusBadge status={task.status} />
        </div>

        {/* Security Deposit Highlight */}
        <div className="bg-amber-400/8 border border-amber-400/25 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-400 font-semibold">
              Security Deposit
            </span>
          </div>
          <span className="font-display font-black text-lg text-amber-400">
            {formatINR(task.productWorth)}
          </span>
        </div>

        {/* Earning */}
        <div className="text-center py-1">
          <p className="font-display font-black text-2xl text-green-vivid">
            Earn {formatINR(netEarning)} on completion
          </p>
        </div>

        {/* Route */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <div className="flex-shrink-0 w-5 h-5 bg-blue-500/15 rounded-full flex items-center justify-center mt-0.5">
              <Package className="w-3 h-3 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p className="text-foreground font-medium truncate">
                {task.pickupLocation}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <div className="flex-shrink-0 w-5 h-5 bg-green-surface rounded-full flex items-center justify-center mt-0.5">
              <MapPin className="w-3 h-3 text-green-vivid" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Drop</p>
              <p className="text-foreground font-medium truncate">
                {task.dropLocation}
              </p>
            </div>
          </div>
        </div>

        <Button
          size="sm"
          data-ocid={`pickup_drop.accept_button.${index + 1}`}
          onClick={() => setShowAcceptDialog(true)}
          disabled={acceptTask.isPending}
          className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl py-5 shadow-[0_4px_20px_oklch(0.6_0.2_240/0.2)] transition-all"
        >
          {acceptTask.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Accept Task
            </>
          )}
        </Button>
      </motion.div>

      {/* Security Deposit Payment Dialog */}
      {rzpDialogVisible && (
        <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
          <DialogContent
            data-ocid="pickup_drop.accept_deposit_dialog"
            className="bg-card border-border rounded-3xl max-w-sm"
          >
            <DialogHeader>
              <DialogTitle className="font-display font-bold text-xl">
                Pay Security Deposit to Accept
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="bg-amber-400/8 border border-amber-400/25 rounded-xl p-4 text-center">
                <ShieldCheck className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-1">
                  Security Deposit Amount
                </p>
                <p className="font-display font-black text-3xl text-amber-400">
                  {formatINR(task.productWorth)}
                </p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-vivid flex-shrink-0" />
                  <span>Deposit held securely until delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-vivid flex-shrink-0" />
                  <span>Refunded after successful OTP verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-vivid flex-shrink-0" />
                  <span>
                    You also earn {formatINR(netEarning)} on completion
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                data-ocid="pickup_drop.accept_deposit.cancel_button"
                onClick={() => setShowAcceptDialog(false)}
                className="flex-1 rounded-xl border-border"
              >
                Cancel
              </Button>
              <Button
                data-ocid="pickup_drop.accept_deposit.confirm_button"
                onClick={handleConfirmAccept}
                disabled={paymentLoading || acceptTask.isPending}
                className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold"
              >
                {paymentLoading || acceptTask.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  `Pay ${formatINR(task.productWorth)}`
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

// ─── My Active Pickup-Drop Task Card ─────────────────────────────────────────

function ActivePdTaskCard({
  taskTuple,
  index,
}: { taskTuple: [PickupDropTask, PickupDropActiveTask]; index: number }) {
  const [task, activeTask] = taskTuple;
  const markInProgress = useMarkPickupDropInProgress();
  const markDelivered = useMarkPickupDropDelivered();
  const verifyOtp = useVerifyPickupDropOtp();
  const [otpInput, setOtpInput] = useState("");

  const netEarning = calcNetEarning(task.taskerFee, task.boostFee);
  const statusKind = activeTask.status.__kind__;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      data-ocid={`pickup_drop.active_task.${index + 1}`}
      className="glass-card rounded-2xl p-5 border-border hover:border-blue-400/20 transition-all space-y-4"
    >
      <div className="flex items-center justify-between">
        <Badge className="bg-blue-500/15 text-blue-400 border-blue-400/30 text-xs font-semibold">
          🔵 Pickup-Drop
        </Badge>
        <PdStatusBadge status={activeTask.status} />
      </div>

      {/* Earning highlight */}
      <div className="bg-green-surface/20 border border-green-vivid/15 rounded-xl p-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          Your Earning
        </span>
        <span className="font-display font-black text-xl text-green-vivid">
          {formatINR(netEarning)}
        </span>
      </div>

      {/* Security Deposit */}
      <div className="bg-amber-400/8 border border-amber-400/20 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-amber-400 font-semibold">
            Security Deposit (you paid)
          </span>
        </div>
        <span className="font-bold text-amber-400">
          {formatINR(task.productWorth)}
        </span>
      </div>

      {/* Pickup Details */}
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-secondary/60 rounded-xl p-3">
          <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
            <Package className="w-3 h-3 text-blue-400" /> Pickup
          </p>
          <p className="text-sm font-semibold text-foreground">
            {task.pickupOwnerName}
          </p>
          <a
            href={`tel:${task.pickupContact}`}
            className="text-xs text-blue-400 font-medium hover:underline"
          >
            {task.pickupContact}
          </a>
          <p className="text-xs text-muted-foreground mt-1">
            {task.pickupLocation}
          </p>
        </div>
        <div className="bg-secondary/60 rounded-xl p-3">
          <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-green-vivid" /> Drop
          </p>
          <p className="text-sm font-semibold text-foreground">
            {task.dropOwnerName}
          </p>
          <a
            href={`tel:${task.dropContact}`}
            className="text-xs text-blue-400 font-medium hover:underline"
          >
            {task.dropContact}
          </a>
          <p className="text-xs text-muted-foreground mt-1">
            {task.dropLocation}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      {statusKind === "accepted" && (
        <Button
          size="sm"
          data-ocid={`pickup_drop.active_task.in_progress_button.${index + 1}`}
          onClick={() => markInProgress.mutate(task.id)}
          disabled={markInProgress.isPending}
          className="w-full bg-orange-400/15 text-orange-400 hover:bg-orange-400/25 border border-orange-400/30 font-semibold rounded-xl"
        >
          {markInProgress.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Package className="w-4 h-4 mr-2" />
              Mark Picked Up & In Progress
            </>
          )}
        </Button>
      )}

      {statusKind === "inProgress" && (
        <Button
          size="sm"
          data-ocid={`pickup_drop.active_task.delivered_button.${index + 1}`}
          onClick={() => markDelivered.mutate(task.id)}
          disabled={markDelivered.isPending}
          className="w-full bg-purple-400/15 text-purple-400 hover:bg-purple-400/25 border border-purple-400/30 font-semibold rounded-xl"
        >
          {markDelivered.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Truck className="w-4 h-4 mr-2" />
              Mark as Delivered
            </>
          )}
        </Button>
      )}

      {statusKind === "delivered" && (
        <div className="space-y-3 bg-green-surface/20 rounded-xl p-4 border border-green-vivid/15">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-green-vivid" />
            <p className="text-sm font-semibold text-green-vivid">
              Enter Delivery OTP to Complete
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Ask the drop owner for their 6-digit OTP to confirm delivery and
            release your deposit + earnings.
          </p>
          <div className="flex gap-2">
            <Input
              data-ocid={`pickup_drop.active_task.otp_input.${index + 1}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="6-digit OTP"
              value={otpInput}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtpInput(val);
              }}
              maxLength={6}
              className="bg-background border-border focus:border-green-vivid/50 rounded-xl h-11 font-mono text-center tracking-[0.3em] text-xl"
            />
            <Button
              data-ocid={`pickup_drop.active_task.verify_otp_button.${index + 1}`}
              onClick={() => {
                if (otpInput.length !== 6) return;
                const parsed = Number.parseInt(otpInput, 10);
                if (!Number.isNaN(parsed)) {
                  verifyOtp.mutate({ taskId: task.id, otp: BigInt(parsed) });
                  setOtpInput("");
                }
              }}
              disabled={verifyOtp.isPending || otpInput.length !== 6}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-green-sm rounded-xl px-5 flex-shrink-0"
            >
              {verifyOtp.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Verify"
              )}
            </Button>
          </div>
        </div>
      )}

      {task.createdAt && (
        <p className="text-xs text-muted-foreground">
          Posted: {formatTimestamp(task.createdAt)}
        </p>
      )}
    </motion.div>
  );
}

// ─── Posted Task Card (customer view) ────────────────────────────────────────

function PostedPdTaskCard({
  task,
  index,
}: { task: PickupDropTask; index: number }) {
  const netEarning = calcNetEarning(task.taskerFee, task.boostFee);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      data-ocid={`pickup_drop.posted_task.${index + 1}`}
      className="glass-card rounded-2xl p-5 border-border space-y-3"
    >
      <div className="flex items-center justify-between">
        <Badge className="bg-blue-500/15 text-blue-400 border-blue-400/30 text-xs font-semibold">
          🔵 Pickup-Drop
        </Badge>
        <PdStatusBadge status={task.status} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Pickup</p>
          <p className="text-sm font-semibold truncate">
            {task.pickupLocation}
          </p>
        </div>
        <div className="bg-secondary/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Drop</p>
          <p className="text-sm font-semibold truncate">{task.dropLocation}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Security Deposit</p>
          <p className="font-bold text-amber-400">
            {formatINR(task.productWorth)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Tasker Earns</p>
          <p className="font-bold text-green-vivid">{formatINR(netEarning)}</p>
        </div>
      </div>
      {task.createdAt && (
        <p className="text-xs text-muted-foreground">
          Posted: {formatTimestamp(task.createdAt)}
        </p>
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PickupDropPage() {
  const [activeTab, setActiveTab] = useState("find-tasks");

  const {
    data: availableTasks = [],
    isLoading: loadingAvailable,
    refetch: refetchAvailable,
  } = useAvailablePickupDropTasks();

  const { data: postedTasks = [], isLoading: loadingPosted } =
    useMyPostedPickupDropTasks();

  const {
    data: activeTasks = [],
    isLoading: loadingActive,
    refetch: refetchActive,
  } = useMyActivePickupDropTasks();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-blue-500/15 rounded-2xl flex items-center justify-center">
            <Truck className="w-5 h-5 text-blue-400" />
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl">
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Pickup-Drop
            </span>
          </h1>
        </div>
        <p className="text-muted-foreground pl-1">
          Secure parcel delivery with deposit-based protection
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-secondary rounded-2xl p-1.5 mb-6 h-auto">
          <TabsTrigger
            value="find-tasks"
            data-ocid="pickup_drop.find_tasks_tab"
            className="flex-1 rounded-xl py-3 font-semibold data-[state=active]:bg-background data-[state=active]:text-blue-400 data-[state=active]:shadow-[0_2px_8px_oklch(0.6_0.2_240/0.2)] transition-all"
          >
            <Zap className="w-4 h-4 mr-2 inline" />
            Find Tasks
            {availableTasks.length > 0 && (
              <Badge className="ml-2 bg-blue-500/15 text-blue-400 border-0 text-xs px-1.5">
                {availableTasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="post-task"
            data-ocid="pickup_drop.post_task_tab"
            className="flex-1 rounded-xl py-3 font-semibold data-[state=active]:bg-background data-[state=active]:text-blue-400 data-[state=active]:shadow-[0_2px_8px_oklch(0.6_0.2_240/0.2)] transition-all"
          >
            <PlusCircle className="w-4 h-4 mr-2 inline" />
            Post Task
          </TabsTrigger>
          <TabsTrigger
            value="my-tasks"
            data-ocid="pickup_drop.my_tasks_tab"
            className="flex-1 rounded-xl py-3 font-semibold data-[state=active]:bg-background data-[state=active]:text-blue-400 data-[state=active]:shadow-[0_2px_8px_oklch(0.6_0.2_240/0.2)] transition-all"
          >
            <Package className="w-4 h-4 mr-2 inline" />
            My Tasks
          </TabsTrigger>
        </TabsList>

        {/* Find Tasks Tab */}
        <TabsContent value="find-tasks">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">
              Available Pickup-Drop Tasks
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchAvailable()}
              className="text-muted-foreground hover:text-blue-400 gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>

          {loadingAvailable ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-52 rounded-2xl bg-secondary" />
              ))}
            </div>
          ) : availableTasks.length === 0 ? (
            <div
              data-ocid="pickup_drop.find_tasks.empty_state"
              className="glass-card rounded-2xl p-12 text-center border-border"
            >
              <div className="w-16 h-16 bg-blue-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                No pickup-drop tasks available
              </h3>
              <p className="text-muted-foreground text-sm mb-5">
                No tasks are posted yet. Check back soon or post one yourself.
              </p>
              <Button
                onClick={() => setActiveTab("post-task")}
                className="bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl shadow-[0_4px_20px_oklch(0.6_0.2_240/0.2)]"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Post a Task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {availableTasks.map((task, i) => (
                  <AvailablePdTaskCard
                    key={String(task.id)}
                    task={task}
                    index={i}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* Post Task Tab */}
        <TabsContent value="post-task">
          <Card className="bg-card border-border rounded-3xl shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display font-bold text-xl">
                Post a Pickup-Drop Task
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Tasker pays a security deposit equal to product worth before
                accepting
              </p>
            </CardHeader>
            <CardContent>
              <PostPickupDropForm onSuccess={() => setActiveTab("my-tasks")} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Tasks Tab */}
        <TabsContent value="my-tasks">
          {/* My Active Tasks (as tasker) */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400" />
                My Active Tasks{" "}
                <span className="text-muted-foreground font-normal text-sm">
                  (as Tasker)
                </span>
                {activeTasks.length > 0 && (
                  <Badge className="bg-blue-500/15 text-blue-400 border-0 text-xs">
                    {activeTasks.length}
                  </Badge>
                )}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchActive()}
                className="text-muted-foreground hover:text-blue-400 gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>

            {loadingActive ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-2xl bg-secondary" />
                ))}
              </div>
            ) : activeTasks.length === 0 ? (
              <div
                data-ocid="pickup_drop.active_tasks.empty_state"
                className="glass-card rounded-2xl p-8 text-center border-border"
              >
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No active pickup-drop tasks. Accept one from Find Tasks.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTasks.map((taskTuple, i) => (
                  <ActivePdTaskCard
                    key={String(taskTuple[0].id)}
                    taskTuple={taskTuple}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>

          {/* My Posted Tasks (as customer) */}
          <div>
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <PlusCircle className="w-4 h-4 text-blue-400" />
              My Posted Tasks{" "}
              <span className="text-muted-foreground font-normal text-sm">
                (as Customer)
              </span>
              {postedTasks.length > 0 && (
                <Badge className="bg-blue-500/15 text-blue-400 border-0 text-xs">
                  {postedTasks.length}
                </Badge>
              )}
            </h2>

            {loadingPosted ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-2xl bg-secondary" />
                ))}
              </div>
            ) : postedTasks.length === 0 ? (
              <div
                data-ocid="pickup_drop.posted_tasks.empty_state"
                className="glass-card rounded-2xl p-8 text-center border-border"
              >
                <Package className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  No pickup-drop tasks posted yet.
                </p>
                <Button
                  size="sm"
                  onClick={() => setActiveTab("post-task")}
                  className="bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Post First Task
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {postedTasks.map((task, i) => (
                  <PostedPdTaskCard
                    key={String(task.id)}
                    task={task}
                    index={i}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

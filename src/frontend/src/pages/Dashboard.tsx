import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  IndianRupee,
  KeyRound,
  Loader2,
  LogIn,
  MapPin,
  Package,
  Phone,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Store,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { TaskStatus } from "../backend.d";
import type { Task } from "../backend.d";
import CashfreePaymentModal from "../components/CashfreePaymentModal";
import CategorySelector from "../components/CategorySelector";
import { StarRating } from "../components/StarRating";
import { TaskProgressTimeline } from "../components/TaskProgressTimeline";
import { TaskStatusBadge } from "../components/TaskStatusBadge";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAvailablePickupDropTasks } from "../hooks/usePickupDropQueries";
import { useMyPostedPickupDropTasks } from "../hooks/usePickupDropQueries";
import {
  useAcceptTask,
  useAvailableTasks,
  useCancelTask,
  useCreateTask,
  useMyPostedTasks,
  useRateTask,
} from "../hooks/useQueries";
import { formatINR, formatTimestamp, inrToPaise } from "../utils/format";
import { getTaskEmoji } from "../utils/taskImage";

function parseStoreLocation(raw: string): {
  store: string;
  contact: string | null;
} {
  const parts = raw.split("|||CONTACT:");
  return { store: parts[0], contact: parts[1] ?? null };
}

interface PendingTask {
  title: string;
  description: string;
  amount: bigint;
  tip: bigint | null;
  customerLocation: string;
  storeLocation: string;
}

function PostTaskForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [storeLocation, setStoreLocation] = useState("");
  const [amountINR, setAmountINR] = useState("");
  const [taskerFeeINR, setTaskerFeeINR] = useState("");
  const [boostINR, setBoostINR] = useState(0);
  const [contactNumber, setContactNumber] = useState("");
  const [_showCashfree, _setShowCashfree] = useState(false);
  const [_pendingTask, setPendingTask] = useState<PendingTask | null>(null);

  const createTask = useCreateTask();
  const { identity, login, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const { isFetching: isActorFetching } = useActor();
  const navigate = useNavigate();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const isConnecting = isInitializing || isActorFetching;
  const isConnectionFailed = false;

  const getPlatformFee = (amount: number): number => {
    if (amount <= 99) return 4;
    if (amount <= 299) return 7;
    return 10;
  };

  const amountNum = Number.parseFloat(amountINR) || 0;
  const taskerFeeNum = Number.parseFloat(taskerFeeINR) || 0;
  const platformFee = getPlatformFee(amountNum);
  const totalINR = amountNum + taskerFeeNum + boostINR + platformFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      login();
      return;
    }

    if (
      !title ||
      !description ||
      !customerLocation ||
      !storeLocation ||
      !amountINR
    )
      return;

    if (taskerFeeNum < 10) return; // Minimum tasker fee check

    const encodedStoreLocation = contactNumber.trim()
      ? `${storeLocation}|||CONTACT:${contactNumber.trim()}`
      : storeLocation;

    const taskData: PendingTask = {
      title,
      description,
      amount: inrToPaise(amountNum),
      tip: taskerFeeNum > 0 ? inrToPaise(taskerFeeNum) : null,
      customerLocation,
      storeLocation: encodedStoreLocation,
    };

    // Load Razorpay script dynamically
    const loadRazorpay = () =>
      new Promise<boolean>((resolve) => {
        if ((window as any).Razorpay) {
          resolve(true);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

    const loaded = await loadRazorpay();
    if (!loaded) return;

    const totalPaise = Math.round(totalINR * 100);
    const options = {
      key: "rzp_live_SRNbTwyEmzQSvO",
      amount: totalPaise,
      currency: "INR",
      name: "Task Turtle",
      description: `Post Task: ${title}`,
      handler: async () => {
        await createTask.mutateAsync(taskData);
        setTitle("");
        setDescription("");
        setCustomerLocation("");
        setStoreLocation("");
        setAmountINR("");
        setTaskerFeeINR("");
        setBoostINR(0);
        setContactNumber("");
        setPendingTask(null);
        onSuccess();
      },
      prefill: {},
      theme: { color: "#22c55e" },
      modal: {
        ondismiss: () => {
          setPendingTask(null);
        },
      },
    };
    setPendingTask(taskData);
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {isConnecting && !isConnectionFailed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            data-ocid="dashboard.connecting_card"
            className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4"
          >
            <Loader2 className="w-5 h-5 text-blue-400 flex-shrink-0 animate-spin" />
            <p className="text-sm font-semibold text-blue-300">
              Connecting to backend…
            </p>
          </motion.div>
        )}

        {isConnectionFailed && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            data-ocid="dashboard.connection_failed_card"
            className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-4"
          >
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-300">
                Connection to backend failed
              </p>
              <p className="text-xs text-red-300/70 mt-0.5">
                Could not reach the canister. Click Refresh to try again.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              data-ocid="dashboard.connection_failed.retry_button"
              onClick={() => window.location.reload()}
              className="flex-shrink-0 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl text-xs px-3 py-2 h-auto"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </motion.div>
        )}

        {!isConnecting && !isConnectionFailed && !isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            data-ocid="dashboard.login_warning_card"
            className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4"
          >
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-300">
                Login required to post tasks
              </p>
              <p className="text-xs text-amber-300/70 mt-0.5">
                You must be logged in to post a task and lock funds in escrow.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              data-ocid="dashboard.login_warning.login_button"
              onClick={() => navigate({ to: "/login" })}
              className="flex-shrink-0 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs px-3 py-2 h-auto"
            >
              <LogIn className="w-3.5 h-3.5 mr-1.5" />
              Login
            </Button>
          </motion.div>
        )}

        <div className="space-y-2">
          <Label
            htmlFor="task-title"
            className="text-sm font-semibold text-foreground"
          >
            Task Title *
          </Label>
          <Input
            id="task-title"
            data-ocid="dashboard.task_title_input"
            placeholder="e.g., Buy 1kg bananas from D-Mart"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="bg-secondary border-border focus:border-green-vivid/50 focus:ring-green-vivid/20 rounded-xl h-12"
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="task-desc"
            className="text-sm font-semibold text-foreground"
          >
            Description *
          </Label>
          <Textarea
            id="task-desc"
            data-ocid="dashboard.task_description_textarea"
            placeholder="Describe the task in detail — brand, quantity, any special instructions…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className="bg-secondary border-border focus:border-green-vivid/50 focus:ring-green-vivid/20 rounded-xl resize-none"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="store-loc"
              className="text-sm font-semibold text-foreground"
            >
              <Store className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
              Store / Pickup Location *
            </Label>
            <Input
              id="store-loc"
              placeholder="e.g., D-Mart, Sector 18, Noida"
              value={storeLocation}
              onChange={(e) => setStoreLocation(e.target.value)}
              required
              className="bg-secondary border-border focus:border-green-vivid/50 rounded-xl h-12"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="customer-loc"
              className="text-sm font-semibold text-foreground"
            >
              <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
              Your Delivery Location *
            </Label>
            <Input
              id="customer-loc"
              placeholder="e.g., Block B, Sector 62, Noida"
              value={customerLocation}
              onChange={(e) => setCustomerLocation(e.target.value)}
              required
              className="bg-secondary border-border focus:border-green-vivid/50 rounded-xl h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="contact-number"
            className="text-sm font-semibold text-foreground"
          >
            <Phone className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
            Contact Number{" "}
            <span className="text-muted-foreground font-normal">
              — optional
            </span>
          </Label>
          <Input
            id="contact-number"
            data-ocid="dashboard.contact_number_input"
            type="tel"
            placeholder="e.g., +91 98765 43210"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            className="bg-secondary border-border focus:border-green-vivid/50 focus:ring-green-vivid/20 rounded-xl h-12"
          />
          <p className="text-xs text-muted-foreground">
            Tasker can call you during delivery to coordinate the drop-off
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="amount"
              className="text-sm font-semibold text-foreground"
            >
              <IndianRupee className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
              Amount (₹) *
            </Label>
            <Input
              id="amount"
              data-ocid="dashboard.task_amount_input"
              type="number"
              placeholder="e.g., 249"
              value={amountINR}
              onChange={(e) => setAmountINR(e.target.value)}
              min="1"
              step="0.01"
              required
              className="bg-secondary border-border focus:border-green-vivid/50 rounded-xl h-12"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="tasker-fee"
              className="text-sm font-semibold text-foreground"
            >
              <IndianRupee className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
              Tasker Fee (₹) *{" "}
              <span className="text-muted-foreground font-normal text-xs">
                — min ₹10
              </span>
            </Label>
            <Input
              id="tasker-fee"
              data-ocid="dashboard.tasker_fee_input"
              type="number"
              placeholder="e.g., 20 (min ₹10)"
              value={taskerFeeINR}
              onChange={(e) => setTaskerFeeINR(e.target.value)}
              min="10"
              step="1"
              className="bg-secondary border-border focus:border-green-vivid/50 rounded-xl h-12"
            />
            {taskerFeeINR && Number.parseFloat(taskerFeeINR) < 10 && (
              <p className="text-xs text-red-400 font-medium">
                ⚠️ Minimum tasker fee is ₹10
              </p>
            )}
          </div>
        </div>

        {/* Boost selector */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">
            <Zap className="w-3.5 h-3.5 inline mr-1.5 text-yellow-400" />
            Boost (₹){" "}
            <span className="text-muted-foreground font-normal text-xs">
              — optional, attracts taskers faster
            </span>
          </Label>
          <div className="flex gap-2">
            {([0, 10, 20] as const).map((v) => (
              <button
                key={v}
                type="button"
                data-ocid={`dashboard.boost_${v}_toggle`}
                onClick={() => setBoostINR(v)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                  boostINR === v
                    ? "bg-yellow-400/15 text-yellow-400 border-yellow-400/40 shadow-[0_2px_8px_oklch(0.85_0.18_85/0.2)]"
                    : "bg-secondary text-muted-foreground border-border hover:border-yellow-400/30"
                }`}
              >
                {v === 0 ? "No Boost" : `₹${v}`}
              </button>
            ))}
          </div>
        </div>

        {amountINR && (
          <div className="bg-secondary/50 rounded-xl p-4 text-sm space-y-1 border border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              Payment Breakdown
            </p>
            <div className="flex justify-between text-muted-foreground">
              <span>Amount (Product)</span>
              <span className="text-foreground font-medium">
                {formatINR(inrToPaise(amountNum))}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tasker Fee</span>
              <span className="text-foreground font-medium">
                {taskerFeeNum > 0 ? (
                  formatINR(inrToPaise(taskerFeeNum))
                ) : (
                  <span className="text-xs italic">not set</span>
                )}
              </span>
            </div>
            {boostINR > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Boost</span>
                <span className="text-yellow-400 font-medium">₹{boostINR}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground border-t border-border pt-1">
              <span>Platform Fee</span>
              <span className="text-foreground font-medium">
                ₹{platformFee}
              </span>
            </div>
            <div className="flex justify-between font-bold text-green-vivid border-t border-border pt-1 text-base">
              <span>Total Payable</span>
              <span>{formatINR(inrToPaise(totalINR))}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/40 rounded-xl px-3 py-2.5 border border-border/50">
          <span>💰</span>
          <span>
            Task amount held in{" "}
            <span className="text-foreground font-semibold">escrow</span> •
            Released to tasker after OTP verification •{" "}
            <span className="text-foreground font-medium">
              Secured by Razorpay
            </span>
          </span>
        </div>

        <Button
          type="submit"
          size="lg"
          data-ocid="dashboard.task_submit_button"
          disabled={
            createTask.isPending ||
            isLoggingIn ||
            isConnecting ||
            (!!taskerFeeINR && Number.parseFloat(taskerFeeINR) < 10)
          }
          className={`w-full font-bold py-6 transition-all rounded-2xl ${
            isConnecting
              ? "bg-secondary text-muted-foreground cursor-wait"
              : !isAuthenticated
                ? "bg-amber-500 hover:bg-amber-400 text-black shadow-none"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-green-sm hover:shadow-green-md"
          }`}
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Connecting…
            </>
          ) : isLoggingIn ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Logging in…
            </>
          ) : createTask.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Posting Task…
            </>
          ) : !isAuthenticated ? (
            <>
              <LogIn className="w-5 h-5 mr-2" />
              Login to Post Task
            </>
          ) : (
            <>
              <PlusCircle className="w-5 h-5 mr-2" />
              {amountINR
                ? `Pay ${formatINR(inrToPaise(totalINR))} & Post Task`
                : "Pay & Post Task"}
            </>
          )}
        </Button>
      </form>

      {/* Razorpay handles payment — no inline modal needed */}
    </>
  );
}

function TaskCard({
  task,
  index,
}: { task: import("../backend.d").Task; index: number }) {
  const cancelTask = useCancelTask();
  const rateTask = useRateTask();
  const [selectedRating, setSelectedRating] = useState(0);
  const isDelivered = task.status === TaskStatus.delivered;
  const isCompleted = task.status === TaskStatus.completed;
  const parsed = parseStoreLocation(task.storeLocation);

  const hasRated = task.customerRating != null && task.customerRating > 0n;

  const handleRate = async (stars: number) => {
    setSelectedRating(stars);
    await rateTask.mutateAsync({ taskId: task.id, stars: BigInt(stars) });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      data-ocid={`dashboard.task_item.${index + 1}`}
      className="glass-card rounded-2xl p-5 border-border hover:border-green-vivid/20 transition-all duration-300 space-y-4"
    >
      <div className="flex items-start gap-3 mb-1">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
          {getTaskEmoji(task.title, task.description)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground truncate">
              {task.title}
            </h3>
            <TaskStatusBadge status={task.status} />
          </div>
          <p className="text-muted-foreground text-sm mt-0.5 line-clamp-2">
            {task.description}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Store className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{parsed.store}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{task.customerLocation}</span>
        </div>
        {parsed.contact && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="w-3.5 h-3.5 flex-shrink-0 text-green-vivid" />
            <span className="text-foreground font-medium">
              Your Contact: {parsed.contact}
            </span>
          </div>
        )}
      </div>

      {/* Payment Summary */}
      <div className="bg-secondary/40 rounded-xl p-3 space-y-1 text-sm border border-border">
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
          Payment Summary
        </p>
        <div className="flex justify-between text-muted-foreground">
          <span>Product Amount</span>
          <span className="text-foreground font-medium">
            {formatINR(task.amount)}
          </span>
        </div>
        {task.tip != null && task.tip > 0n && (
          <div className="flex justify-between text-muted-foreground">
            <span>Tasker Fee</span>
            <span className="text-foreground font-medium">
              {formatINR(task.tip)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground border-t border-border pt-1">
          <span>Platform Fee</span>
          <span className="text-foreground font-medium">
            {Number(task.amount) / 100 <= 99
              ? "₹4"
              : Number(task.amount) / 100 <= 299
                ? "₹7"
                : "₹10"}
          </span>
        </div>
        <div className="flex justify-between font-bold text-green-vivid border-t border-border pt-1">
          <span>Total Paid</span>
          <span>
            {formatINR(
              task.amount +
                (task.tip ?? 0n) +
                (task.amount <= 9900n
                  ? 400n
                  : task.amount <= 29900n
                    ? 700n
                    : 1000n),
            )}
          </span>
        </div>
      </div>

      {isDelivered && (
        <div className="bg-purple-400/10 border border-purple-400/30 rounded-xl p-4 text-center space-y-2">
          <div className="flex items-center gap-2 justify-center">
            <KeyRound className="w-4 h-4 text-purple-400" />
            <p className="text-sm font-semibold text-purple-400">
              Tasker is here! Share this OTP
            </p>
          </div>
          <div
            className="otp-display !text-purple-400 !text-shadow-none"
            style={{
              color: "oklch(0.70 0.18 300)",
              textShadow: "0 0 20px oklch(0.70 0.18 300 / 0.5)",
            }}
          >
            {String(task.otpCode).padStart(6, "0")}
          </div>
          <p className="text-xs text-purple-400/70 leading-relaxed">
            Read this code out loud to the tasker.
            <br />
            They will enter it to confirm delivery and release payment.
          </p>
        </div>
      )}

      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-400/8 border border-yellow-400/25 rounded-xl p-4 space-y-2"
        >
          {hasRated ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Your rating:
              </span>
              <StarRating
                value={Number(task.customerRating)}
                readonly
                size="sm"
              />
              <span className="text-sm text-muted-foreground">
                {Number(task.customerRating)}/5
              </span>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground">
                Rate your Tasker
              </p>
              <p className="text-xs text-muted-foreground">
                How was your experience? Your feedback helps the community.
              </p>
              <div className="flex items-center gap-3">
                <StarRating
                  value={selectedRating}
                  onChange={handleRate}
                  size="md"
                />
                {rateTask.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </>
          )}
        </motion.div>
      )}

      <TaskProgressTimeline task={task} />

      {task.status === TaskStatus.posted && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => cancelTask.mutate(task.id)}
          disabled={cancelTask.isPending}
          className="border-red-400/30 text-red-400 hover:bg-red-400/10 hover:border-red-400/50 rounded-xl"
        >
          {cancelTask.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <X className="w-4 h-4 mr-1.5" />
              Cancel Task
            </>
          )}
        </Button>
      )}
    </motion.div>
  );
}

function FindTaskCard({ task, index }: { task: Task; index: number }) {
  const acceptTask = useAcceptTask();
  const navigate = useNavigate();
  const parsed = parseStoreLocation(task.storeLocation);
  const handleAccept = () => {
    acceptTask.mutate(task.id, {
      onSuccess: () => {
        navigate({ to: "/tasker" });
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      data-ocid={`dashboard.find_task_item.${index + 1}`}
      className="glass-card rounded-2xl p-5 border-border hover:border-green-vivid/25 hover:shadow-green-sm transition-all duration-300 space-y-4"
    >
      {/* Emoji image + title */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-3xl flex-shrink-0">
          {getTaskEmoji(task.title, task.description)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{task.title}</h3>
          <p className="text-muted-foreground text-sm mt-0.5 line-clamp-2">
            {task.description}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-muted-foreground">Buy Item</p>
          <p className="font-bold text-foreground">{formatINR(task.amount)}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Store className="w-3.5 h-3.5 text-green-vivid flex-shrink-0" />
          <span className="truncate font-medium text-foreground">
            {parsed.store}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span className="truncate">{task.customerLocation}</span>
        </div>
        {parsed.contact && (
          <a
            href={`tel:${parsed.contact}`}
            data-ocid={`dashboard.find_task.call_button.${index + 1}`}
            className="inline-flex items-center gap-1.5 bg-green-surface text-green-vivid text-xs font-semibold px-3 py-1.5 rounded-full border border-green-vivid/30 hover:bg-green-vivid hover:text-black transition-all duration-200 mt-0.5"
          >
            <Phone className="w-3 h-3" />
            Call Customer: {parsed.contact}
          </a>
        )}
      </div>

      {/* Earning display */}
      <div className="bg-green-surface/20 border border-green-vivid/20 rounded-xl p-3">
        <p className="text-xs text-muted-foreground mb-0.5">Your Earning</p>
        {task.tip && task.tip > 0n ? (
          <p className="font-display font-black text-xl text-green-vivid">
            Earn {formatINR(task.tip)}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">No fee set</p>
        )}
      </div>

      {task.createdAt && (
        <p className="text-xs text-muted-foreground">
          Posted {formatTimestamp(task.createdAt)}
        </p>
      )}

      <Button
        size="sm"
        data-ocid={`dashboard.find_task.accept_button.${index + 1}`}
        onClick={handleAccept}
        disabled={acceptTask.isPending}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-green-sm rounded-xl py-5"
      >
        {acceptTask.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Accept &amp; Earn
          </>
        )}
      </Button>
    </motion.div>
  );
}

// ─── Mini Pickup-Drop Task Card (for Find Tasks tab preview) ─────────────────────

function MiniPickupDropCard({
  task,
  index,
}: {
  task: import("../backend.d").PickupDropTask;
  index: number;
}) {
  const navigate = useNavigate();
  const totalEarning = task.taskerFee + task.boostFee;
  const platformCut = (totalEarning * 15n) / 100n;
  const netEarning = totalEarning - platformCut;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      data-ocid={`dashboard.pd_task_item.${index + 1}`}
      className="glass-card rounded-2xl p-4 border-border hover:border-blue-400/30 transition-all space-y-3"
    >
      <div className="flex items-center justify-between">
        <Badge className="bg-blue-500/15 text-blue-400 border-blue-400/30 text-xs font-semibold">
          🔵 Pickup-Drop
        </Badge>
        <span className="font-display font-black text-lg text-green-vivid">
          Earn {formatINR(netEarning)}
        </span>
      </div>
      <div className="bg-amber-400/8 border border-amber-400/20 rounded-lg p-2 flex items-center justify-between">
        <span className="text-xs text-amber-400 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Security Deposit
        </span>
        <span className="text-sm font-bold text-amber-400">
          {formatINR(task.productWorth)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-secondary/50 rounded-lg p-2">
          <p className="text-muted-foreground">Pickup</p>
          <p className="font-medium truncate">{task.pickupLocation}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2">
          <p className="text-muted-foreground">Drop</p>
          <p className="font-medium truncate">{task.dropLocation}</p>
        </div>
      </div>
      <Button
        size="sm"
        onClick={() => navigate({ to: "/pickup-drop" })}
        className="w-full bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl text-xs"
      >
        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
        Accept in Pickup-Drop
      </Button>
    </motion.div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("my-tasks");
  const [showCategorySelector, setShowCategorySelector] = useState(true);
  const [findTaskCategory, setFindTaskCategory] = useState<
    "daily" | "pickup-drop"
  >("daily");
  const {
    data: tasks = [],
    isLoading,
    refetch,
  } = useMyPostedTasks({ refetchInterval: 15000 });
  const {
    data: availableTasks = [],
    isLoading: loadingAvailable,
    refetch: refetchAvailable,
  } = useAvailableTasks();
  const { data: pdTasks = [], isLoading: loadingPdTasks } =
    useAvailablePickupDropTasks();
  const { data: myPostedPdTasks = [] } = useMyPostedPickupDropTasks();
  const navigate = useNavigate();

  const switchToMyTasks = () => setActiveTab("my-tasks");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display font-black text-3xl sm:text-4xl">
          Customer <span className="text-green-gradient">Dashboard</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Post tasks and track their progress
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-secondary rounded-2xl p-1.5 mb-6 h-auto">
          <TabsTrigger
            value="my-tasks"
            data-ocid="dashboard.my_tasks_tab"
            className="flex-1 rounded-xl py-3 font-semibold data-[state=active]:bg-background data-[state=active]:text-green-vivid data-[state=active]:shadow-green-sm transition-all"
          >
            <ClipboardList className="w-4 h-4 mr-2 inline" />
            My Tasks
            {tasks.length > 0 && (
              <Badge className="ml-2 bg-green-surface text-green-vivid border-0 text-xs px-1.5">
                {tasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="post-task"
            data-ocid="dashboard.post_task_tab"
            className="flex-1 rounded-xl py-3 font-semibold data-[state=active]:bg-background data-[state=active]:text-green-vivid data-[state=active]:shadow-green-sm transition-all"
          >
            <PlusCircle className="w-4 h-4 mr-2 inline" />
            Post Task
          </TabsTrigger>
          <TabsTrigger
            value="find-tasks"
            data-ocid="dashboard.find_tasks_tab"
            className="flex-1 rounded-xl py-3 font-semibold data-[state=active]:bg-background data-[state=active]:text-green-vivid data-[state=active]:shadow-green-sm transition-all"
          >
            <Zap className="w-4 h-4 mr-2 inline" />
            Find Tasks
            {availableTasks.length > 0 && (
              <Badge className="ml-2 bg-green-surface text-green-vivid border-0 text-xs px-1.5">
                {availableTasks.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-tasks">
          {/* Daily Tasks */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">🟢 My Daily Tasks</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-muted-foreground hover:text-green-vivid gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-36 rounded-2xl bg-secondary" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div
              data-ocid="dashboard.task_item.empty_state"
              className="glass-card rounded-2xl p-12 text-center border-border"
            >
              <div className="text-5xl mb-4">📋</div>
              <h3 className="font-semibold text-lg mb-2">No daily tasks yet</h3>
              <p className="text-muted-foreground text-sm mb-5">
                Post your first task and get it done by a nearby tasker
              </p>
              <Button
                onClick={() => setActiveTab("post-task")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl shadow-green-sm"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Post a Task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task, i) => (
                <TaskCard key={String(task.id)} task={task} index={i} />
              ))}
            </div>
          )}

          {/* My Pickup-Drop Tasks */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                🔵 My Pickup-Drop Tasks
                {myPostedPdTasks.length > 0 && (
                  <Badge className="bg-blue-500/15 text-blue-400 border-0 text-xs">
                    {myPostedPdTasks.length}
                  </Badge>
                )}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: "/pickup-drop" })}
                className="text-muted-foreground hover:text-blue-400 gap-1 text-xs"
              >
                View All
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
            {myPostedPdTasks.length === 0 ? (
              <div
                data-ocid="dashboard.pd_task.empty_state"
                className="glass-card rounded-2xl p-8 text-center border-border"
              >
                <Truck className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No pickup-drop tasks posted yet.{" "}
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/pickup-drop" })}
                    className="text-blue-400 hover:underline font-semibold"
                  >
                    Post one
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myPostedPdTasks.slice(0, 3).map((task, i) => (
                  <div
                    key={String(task.id)}
                    data-ocid={`dashboard.pd_task_item.${i + 1}`}
                    className="glass-card rounded-xl p-4 border-border flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-blue-500/15 text-blue-400 border-blue-400/30 text-xs">
                          Pickup-Drop
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {task.pickupLocation} → {task.dropLocation}
                      </p>
                    </div>
                    <span className="font-bold text-amber-400 text-sm ml-3">
                      {formatINR(task.productWorth)}
                    </span>
                  </div>
                ))}
                {myPostedPdTasks.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate({ to: "/pickup-drop" })}
                    className="w-full text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl"
                  >
                    View all {myPostedPdTasks.length} tasks
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="post-task">
          {showCategorySelector ? (
            <CategorySelector
              onSelectDaily={() => setShowCategorySelector(false)}
              onSelectPickupDrop={() => navigate({ to: "/pickup-drop" })}
            />
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                data-ocid="dashboard.post_task.back_button"
                onClick={() => setShowCategorySelector(true)}
                className="mb-4 text-muted-foreground hover:text-foreground gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Card className="bg-card border-border rounded-3xl shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display font-bold text-xl">
                    Post a New Daily Task
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Pay via Cashfree escrow — funds released only after OTP
                    verification
                  </p>
                </CardHeader>
                <CardContent>
                  <PostTaskForm
                    onSuccess={() => {
                      switchToMyTasks();
                      setShowCategorySelector(true);
                    }}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="find-tasks">
          {/* Category sub-tabs */}
          <div className="flex gap-2 mb-5">
            <button
              type="button"
              data-ocid="dashboard.find_tasks.daily_tab"
              onClick={() => setFindTaskCategory("daily")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                findTaskCategory === "daily"
                  ? "bg-green-surface text-green-vivid border-green-vivid/30 shadow-green-sm"
                  : "bg-secondary text-muted-foreground border-border hover:border-green-vivid/20"
              }`}
            >
              🟢 Daily Tasks
              {availableTasks.length > 0 && (
                <Badge className="bg-green-vivid/20 text-green-vivid border-0 text-xs px-1.5">
                  {availableTasks.length}
                </Badge>
              )}
            </button>
            <button
              type="button"
              data-ocid="dashboard.find_tasks.pickup_drop_tab"
              onClick={() => setFindTaskCategory("pickup-drop")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                findTaskCategory === "pickup-drop"
                  ? "bg-blue-500/15 text-blue-400 border-blue-400/30 shadow-[0_2px_8px_oklch(0.6_0.2_240/0.15)]"
                  : "bg-secondary text-muted-foreground border-border hover:border-blue-400/20"
              }`}
            >
              🔵 Pickup-Drop
              {pdTasks.length > 0 && (
                <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs px-1.5">
                  {pdTasks.length}
                </Badge>
              )}
            </button>
          </div>

          {findTaskCategory === "daily" ? (
            <>
              <div className="flex items-start gap-3 bg-green-surface/30 border border-green-vivid/20 rounded-2xl p-4 mb-6">
                <Zap className="w-5 h-5 text-green-vivid flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Earn money by completing tasks near you
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Accept tasks posted by others. Manage accepted tasks in{" "}
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/tasker" })}
                      className="text-green-vivid hover:underline font-semibold inline-flex items-center gap-0.5"
                    >
                      Tasker Hub
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Available Daily Tasks</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchAvailable()}
                  className="text-muted-foreground hover:text-green-vivid gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </Button>
              </div>
              {loadingAvailable ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-48 rounded-2xl bg-secondary"
                    />
                  ))}
                </div>
              ) : availableTasks.length === 0 ? (
                <div
                  data-ocid="dashboard.find_tasks.empty_state"
                  className="glass-card rounded-2xl p-12 text-center border-border"
                >
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="font-semibold text-lg mb-2">
                    No daily tasks available
                  </h3>
                  <p className="text-muted-foreground text-sm mb-5">
                    No tasks are posted right now. Check back soon.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchAvailable()}
                    className="border-border hover:border-green-vivid/40 hover:text-green-vivid rounded-xl gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh now
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableTasks.map((task, i) => (
                    <FindTaskCard key={String(task.id)} task={task} index={i} />
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Pickup-Drop tasks */
            <>
              <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-400/20 rounded-2xl p-4 mb-6">
                <Truck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Secure deposit-based delivery tasks
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pay security deposit to accept. Earn after OTP-verified
                    delivery.{" "}
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/pickup-drop" })}
                      className="text-blue-400 hover:underline font-semibold inline-flex items-center gap-0.5"
                    >
                      Pickup-Drop Hub
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </p>
                </div>
              </div>
              {loadingPdTasks ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-52 rounded-2xl bg-secondary"
                    />
                  ))}
                </div>
              ) : pdTasks.length === 0 ? (
                <div
                  data-ocid="dashboard.find_pd_tasks.empty_state"
                  className="glass-card rounded-2xl p-12 text-center border-border"
                >
                  <Truck className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">
                    No pickup-drop tasks
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    No pickup-drop tasks available right now.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pdTasks.map((task, i) => (
                    <MiniPickupDropCard
                      key={String(task.id)}
                      task={task}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

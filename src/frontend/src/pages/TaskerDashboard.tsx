import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  CheckCircle2,
  IndianRupee,
  KeyRound,
  Loader2,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  ShieldCheck,
  Star,
  Store,
  Trophy,
  Truck,
  Wallet,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { TaskStatus } from "../backend.d";
import type { PickupDropActiveTask, PickupDropTask, Task } from "../backend.d";
import { StarRating } from "../components/StarRating";
import { TaskStatusBadge } from "../components/TaskStatusBadge";
import { useNewTaskDetector } from "../hooks/useNewTaskDetector";
import {
  useMarkPickupDropDelivered,
  useMarkPickupDropInProgress,
  useMyActivePickupDropTasks,
  useVerifyPickupDropOtp,
} from "../hooks/usePickupDropQueries";
import {
  useAcceptTask,
  useAvailableTasks,
  useEarningsHistory,
  useMarkDelivered,
  useMarkInProgress,
  useMyAcceptedTasks,
  useProfile,
  useRateTask,
  useUpdateProfile,
  useVerifyOtp,
  useWalletBalance,
} from "../hooks/useQueries";
import { formatINR, formatTimestamp } from "../utils/format";

function parseStoreLocation(raw: string): {
  store: string;
  contact: string | null;
} {
  const parts = raw.split("|||CONTACT:");
  return { store: parts[0], contact: parts[1] ?? null };
}

function EarningsCard() {
  const { data: balance = 0n } = useWalletBalance();

  return (
    <div className="glass-card rounded-2xl p-5 border-green-gradient shadow-green-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-green-surface rounded-xl flex items-center justify-center">
          <Wallet className="w-5 h-5 text-green-vivid" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Earnings Wallet
          </p>
          <p className="font-display font-black text-2xl text-green-vivid">
            {formatINR(balance)}
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Payments released after OTP verification
      </p>
    </div>
  );
}

function AvailabilityToggle() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const handleToggle = async (checked: boolean) => {
    if (!profile) return;
    await updateProfile.mutateAsync({
      name: profile.name,
      phone: profile.phone ?? null,
      location: profile.location,
      isAvailableAsTasker: checked,
    });
  };

  return (
    <div className="glass-card rounded-2xl p-5 border-border flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${profile?.isAvailableAsTasker ? "bg-green-surface" : "bg-secondary"}`}
        >
          <Zap
            className={`w-5 h-5 transition-colors ${profile?.isAvailableAsTasker ? "text-green-vivid" : "text-muted-foreground"}`}
          />
        </div>
        <div>
          <p className="font-semibold text-sm">
            {profile?.isAvailableAsTasker
              ? "You're Available"
              : "You're Offline"}
          </p>
          <p className="text-xs text-muted-foreground">
            {profile?.isAvailableAsTasker
              ? "Nearby tasks will be shown to you"
              : "Toggle on to start accepting tasks"}
          </p>
        </div>
      </div>
      <Switch
        checked={profile?.isAvailableAsTasker ?? false}
        onCheckedChange={handleToggle}
        disabled={updateProfile.isPending}
        data-ocid="profile.availability_switch"
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}

function AvailableTaskCard({ task, index }: { task: Task; index: number }) {
  const acceptTask = useAcceptTask();
  const parsed = parseStoreLocation(task.storeLocation);

  const total = task.amount + (task.tip ?? 0n);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass-card rounded-2xl p-5 border-border hover:border-green-vivid/25 hover:shadow-green-sm transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{task.title}</h3>
          <p className="text-muted-foreground text-sm mt-0.5 line-clamp-2">
            {task.description}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-display font-black text-xl text-green-vivid">
            {formatINR(total)}
          </p>
          {task.tip && task.tip > 0n && (
            <p className="text-xs text-muted-foreground">
              incl. {formatINR(task.tip)} tip
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
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
            className="inline-flex items-center gap-1.5 bg-green-surface text-green-vivid text-xs font-semibold px-3 py-1.5 rounded-full border border-green-vivid/30 hover:bg-green-vivid hover:text-black transition-all duration-200"
          >
            <Phone className="w-3 h-3" />
            Call Customer: {parsed.contact}
          </a>
        )}
      </div>

      <Button
        size="sm"
        data-ocid="tasker.accept_button"
        onClick={() => acceptTask.mutate(task.id)}
        disabled={acceptTask.isPending}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-green-sm rounded-xl"
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
  );
}

function ActiveTaskCard({ task, index }: { task: Task; index: number }) {
  const markInProgress = useMarkInProgress();
  const markDelivered = useMarkDelivered();
  const verifyOtp = useVerifyOtp();
  const rateTask = useRateTask();
  const [otpInput, setOtpInput] = useState("");
  const [selectedRating, setSelectedRating] = useState(0);
  const parsed = parseStoreLocation(task.storeLocation);

  const total = task.amount + (task.tip ?? 0n);

  const handleVerify = async () => {
    if (otpInput.length !== 6) return;
    const parsedOtp = Number.parseInt(otpInput, 10);
    if (Number.isNaN(parsedOtp)) return;
    await verifyOtp.mutateAsync({ taskId: task.id, otp: BigInt(parsedOtp) });
    setOtpInput("");
  };

  const handleRate = async (stars: number) => {
    setSelectedRating(stars);
    await rateTask.mutateAsync({ taskId: task.id, stars: BigInt(stars) });
  };

  const hasRated = task.taskerRating != null && task.taskerRating > 0n;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass-card rounded-2xl p-5 space-y-4 border-border hover:border-green-vivid/20 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{task.title}</h3>
          <p className="text-muted-foreground text-sm mt-0.5 line-clamp-2">
            {task.description}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <TaskStatusBadge status={task.status} />
          <p className="font-bold text-green-vivid text-sm">
            {formatINR(total)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-secondary/60 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Store className="w-3 h-3 text-green-vivid" />
            <p className="text-xs text-muted-foreground font-medium">Pickup</p>
          </div>
          <p className="text-xs text-foreground font-semibold truncate">
            {parsed.store}
          </p>
        </div>
        <div className="bg-secondary/60 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="w-3 h-3 text-blue-400" />
            <p className="text-xs text-muted-foreground font-medium">
              Deliver To
            </p>
          </div>
          <p className="text-xs text-foreground font-semibold truncate">
            {task.customerLocation}
          </p>
        </div>
      </div>

      {/* Customer contact — shown during active delivery */}
      {parsed.contact && (
        <div className="flex items-center gap-3 bg-green-surface/20 border border-green-vivid/20 rounded-xl p-3">
          <div className="w-8 h-8 bg-green-surface rounded-lg flex items-center justify-center flex-shrink-0">
            <Phone className="w-4 h-4 text-green-vivid" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">
              Customer Contact
            </p>
            <a
              href={`tel:${parsed.contact}`}
              data-ocid="tasker.active_task.call_button"
              className="text-sm font-bold text-green-vivid hover:underline"
            >
              {parsed.contact}
            </a>
          </div>
          <a
            href={`tel:${parsed.contact}`}
            className="flex-shrink-0 bg-green-vivid text-black text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-green-vivid/90 transition-colors"
          >
            Call
          </a>
        </div>
      )}

      {/* Action buttons by status */}
      {task.status === TaskStatus.accepted && (
        <Button
          size="sm"
          data-ocid="tasker.in_progress_button"
          onClick={() => markInProgress.mutate(task.id)}
          disabled={markInProgress.isPending}
          className="w-full bg-orange-400/15 text-orange-400 hover:bg-orange-400/25 border border-orange-400/30 font-semibold rounded-xl"
        >
          {markInProgress.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Package className="w-4 h-4 mr-2" />
              Mark In Progress
            </>
          )}
        </Button>
      )}

      {task.status === TaskStatus.inProgress && (
        <Button
          size="sm"
          data-ocid="tasker.delivered_button"
          onClick={() => markDelivered.mutate(task.id)}
          disabled={markDelivered.isPending}
          className="w-full bg-purple-400/15 text-purple-400 hover:bg-purple-400/25 border border-purple-400/30 font-semibold rounded-xl"
        >
          {markDelivered.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark as Delivered
            </>
          )}
        </Button>
      )}

      {task.status === TaskStatus.delivered && (
        <div className="space-y-3 bg-green-surface/30 rounded-xl p-4 border border-green-vivid/20">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-green-vivid" />
            <p className="text-sm font-semibold text-green-vivid">
              Enter Customer OTP to Complete
            </p>
          </div>
          {/* Step-by-step instruction */}
          <div className="bg-background/60 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-green-surface text-green-vivid font-bold text-[10px] flex items-center justify-center mt-0.5">
                1
              </span>
              <span>Tell the customer you have arrived with their items</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-green-surface text-green-vivid font-bold text-[10px] flex items-center justify-center mt-0.5">
                2
              </span>
              <span>
                Ask them to open their Task Turtle app →{" "}
                <strong className="text-foreground">My Tasks</strong> and share
                the 6-digit OTP shown there
              </span>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-green-surface text-green-vivid font-bold text-[10px] flex items-center justify-center mt-0.5">
                3
              </span>
              <span>
                Type the OTP below and tap{" "}
                <strong className="text-foreground">Verify</strong> — payment
                will be released instantly
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              data-ocid="tasker.verify_otp_input"
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
              data-ocid="tasker.verify_otp_button"
              onClick={handleVerify}
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
          {verifyOtp.isError && (
            <p
              data-ocid="tasker.verify_otp_error"
              className="text-xs text-red-400 flex items-center gap-1.5"
            >
              <span>⚠</span> Wrong OTP — ask the customer to re-check their app
              and share the correct code
            </p>
          )}
        </div>
      )}

      {/* Rating — shown after task is completed */}
      {task.status === TaskStatus.completed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-400/8 border border-yellow-400/25 rounded-xl p-4 space-y-2"
        >
          {hasRated ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Customer rated:
              </span>
              <StarRating
                value={Number(task.taskerRating)}
                readonly
                size="sm"
              />
              <span className="text-sm text-muted-foreground">
                {Number(task.taskerRating)}/5
              </span>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground">
                Rate the Customer
              </p>
              <p className="text-xs text-muted-foreground">
                How was working with this customer?
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

      {task.acceptedAt && task.status !== TaskStatus.completed && (
        <p className="text-xs text-muted-foreground">
          Accepted: {formatTimestamp(task.acceptedAt)}
        </p>
      )}
    </motion.div>
  );
}

function CompletedTaskCard({ task, index }: { task: Task; index: number }) {
  const rateTask = useRateTask();
  const [selectedRating, setSelectedRating] = useState(0);
  const total = task.amount + (task.tip ?? 0n);
  const hasCustomerRating = task.taskerRating != null && task.taskerRating > 0n;

  const handleRate = async (stars: number) => {
    setSelectedRating(stars);
    await rateTask.mutateAsync({ taskId: task.id, stars: BigInt(stars) });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      data-ocid={`tasker.completed_task.${index + 1}`}
      className="glass-card rounded-2xl p-4 border-border space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">
            {task.title}
          </h3>
          {task.completedAt && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Completed: {formatTimestamp(task.completedAt)}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-green-vivid text-sm">
            +{formatINR(total)}
          </p>
          <p className="text-[10px] text-muted-foreground">earned</p>
        </div>
      </div>

      {/* Rating received from customer */}
      {hasCustomerRating ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Customer rated:</span>
          <StarRating value={Number(task.taskerRating)} readonly size="sm" />
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">
            Rate the customer:
          </p>
          <div className="flex items-center gap-2">
            <StarRating
              value={selectedRating}
              onChange={handleRate}
              size="sm"
            />
            {rateTask.isPending && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Pickup-Drop Active Task Card ────────────────────────────────────────────

function PdActiveCard({
  taskTuple,
  index,
}: { taskTuple: [PickupDropTask, PickupDropActiveTask]; index: number }) {
  const [task, activeTask] = taskTuple;
  const markInProgress = useMarkPickupDropInProgress();
  const markDelivered = useMarkPickupDropDelivered();
  const verifyOtp = useVerifyPickupDropOtp();
  const [otpInput, setOtpInput] = useState("");

  const totalEarning = task.taskerFee + task.boostFee;
  const platformCut = (totalEarning * 15n) / 100n;
  const netEarning = totalEarning - platformCut;
  const statusKind = activeTask.status.__kind__;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      data-ocid={`tasker.pd_active_task.${index + 1}`}
      className="glass-card rounded-2xl p-5 border-blue-400/20 hover:border-blue-400/30 transition-all space-y-4"
    >
      <div className="flex items-center justify-between">
        <Badge className="bg-blue-500/15 text-blue-400 border-blue-400/30 text-xs font-semibold">
          🔵 Pickup-Drop
        </Badge>
        <Badge
          className={`text-xs font-semibold border ${
            statusKind === "accepted"
              ? "bg-orange-400/15 text-orange-400 border-orange-400/30"
              : statusKind === "inProgress"
                ? "bg-amber-400/15 text-amber-400 border-amber-400/30"
                : statusKind === "delivered"
                  ? "bg-purple-400/15 text-purple-400 border-purple-400/30"
                  : "bg-green-surface text-green-vivid border-green-vivid/30"
          }`}
        >
          {statusKind === "accepted"
            ? "Accepted"
            : statusKind === "inProgress"
              ? "In Progress"
              : statusKind === "delivered"
                ? "Delivered"
                : "Completed"}
        </Badge>
      </div>

      {/* Earning & Deposit */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-surface/15 border border-green-vivid/15 rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Your Earning</p>
          <p className="font-display font-black text-lg text-green-vivid">
            {formatINR(netEarning)}
          </p>
        </div>
        <div className="bg-amber-400/8 border border-amber-400/20 rounded-xl p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-400" /> Deposit
          </p>
          <p className="font-bold text-amber-400">
            {formatINR(task.productWorth)}
          </p>
        </div>
      </div>

      {/* Route */}
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-secondary/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1">
            <Package className="w-3 h-3 text-blue-400" /> Pickup
          </p>
          <p className="text-sm font-semibold">{task.pickupOwnerName}</p>
          <a
            href={`tel:${task.pickupContact}`}
            className="text-xs text-blue-400 hover:underline"
          >
            {task.pickupContact}
          </a>
          <p className="text-xs text-muted-foreground mt-0.5">
            {task.pickupLocation}
          </p>
        </div>
        <div className="bg-secondary/50 rounded-xl p-3">
          <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-green-vivid" /> Drop
          </p>
          <p className="text-sm font-semibold">{task.dropOwnerName}</p>
          <a
            href={`tel:${task.dropContact}`}
            className="text-xs text-blue-400 hover:underline"
          >
            {task.dropContact}
          </a>
          <p className="text-xs text-muted-foreground mt-0.5">
            {task.dropLocation}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      {statusKind === "accepted" && (
        <Button
          size="sm"
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
          <div className="flex gap-2">
            <Input
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
    </motion.div>
  );
}

export default function TaskerDashboard() {
  const { data: profile } = useProfile();
  const {
    data: availableTasks = [],
    isLoading: loadingAvailable,
    refetch: refetchAvailable,
  } = useAvailableTasks();
  const {
    data: activeTasks = [],
    isLoading: loadingActive,
    refetch: refetchActive,
  } = useMyAcceptedTasks();
  const { data: completedTasks = [], isLoading: loadingCompleted } =
    useEarningsHistory();
  const {
    data: pdActiveTasks = [],
    isLoading: loadingPdActive,
    refetch: refetchPdActive,
  } = useMyActivePickupDropTasks();

  // Rapido-style sound notification when new tasks arrive
  useNewTaskDetector(availableTasks, profile?.isAvailableAsTasker ?? false);

  const refetchAll = () => {
    refetchAvailable();
    refetchActive();
    refetchPdActive();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="font-display font-black text-3xl sm:text-4xl">
            Tasker <span className="text-green-gradient">Hub</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Accept tasks and earn money nearby
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refetchAll}
          className="text-muted-foreground hover:text-green-vivid gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </motion.div>

      {/* Top row: availability + earnings */}
      <div className="grid sm:grid-cols-2 gap-4">
        <AvailabilityToggle />
        <EarningsCard />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Available tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl">
              Available Tasks
              {availableTasks.length > 0 && (
                <Badge className="ml-2 bg-green-surface text-green-vivid border-0 text-xs">
                  {availableTasks.length}
                </Badge>
              )}
            </h2>
          </div>

          {loadingAvailable ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-40 rounded-2xl bg-secondary" />
              ))}
            </div>
          ) : availableTasks.length === 0 ? (
            <div
              data-ocid="tasker.available_tasks.empty_state"
              className="glass-card rounded-2xl p-10 text-center border-border"
            >
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-semibold mb-1">No tasks nearby</h3>
              <p className="text-muted-foreground text-sm">
                Check back in a moment — tasks update every 15 seconds
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {availableTasks.map((task, i) => (
                  <AvailableTaskCard
                    key={String(task.id)}
                    task={task}
                    index={i}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Active tasks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl">
              My Active Tasks
              {activeTasks.length > 0 && (
                <Badge className="ml-2 bg-orange-400/15 text-orange-400 border-0 text-xs">
                  {activeTasks.length}
                </Badge>
              )}
            </h2>
          </div>

          {loadingActive ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-48 rounded-2xl bg-secondary" />
              ))}
            </div>
          ) : activeTasks.length === 0 ? (
            <div
              data-ocid="tasker.active_tasks.empty_state"
              className="glass-card rounded-2xl p-10 text-center border-border"
            >
              <div className="text-4xl mb-3">📦</div>
              <h3 className="font-semibold mb-1">No active tasks</h3>
              <p className="text-muted-foreground text-sm">
                Accept a task from the left to start earning
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {activeTasks.map((task, i) => (
                  <ActiveTaskCard key={String(task.id)} task={task} index={i} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Completed Tasks */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-yellow-400/15 rounded-xl flex items-center justify-center">
            <Trophy className="w-4 h-4 text-yellow-400" />
          </div>
          <h2 className="font-display font-bold text-xl">
            Completed Tasks
            {completedTasks.length > 0 && (
              <Badge className="ml-2 bg-yellow-400/15 text-yellow-400 border-0 text-xs">
                {completedTasks.length}
              </Badge>
            )}
          </h2>
        </div>

        {loadingCompleted ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl bg-secondary" />
            ))}
          </div>
        ) : completedTasks.length === 0 ? (
          <div
            data-ocid="tasker.completed_tasks.empty_state"
            className="glass-card rounded-2xl p-10 text-center border-border"
          >
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="font-semibold mb-1">No completed tasks yet</h3>
            <p className="text-muted-foreground text-sm">
              Your earning history will appear here once you complete tasks
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {completedTasks.map((task, i) => (
                <CompletedTaskCard
                  key={String(task.id)}
                  task={task}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ─── Pickup-Drop Active Tasks ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/15 rounded-xl flex items-center justify-center">
              <Truck className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="font-display font-bold text-xl">
              My Pickup-Drop Tasks
              {pdActiveTasks.length > 0 && (
                <Badge className="ml-2 bg-blue-500/15 text-blue-400 border-0 text-xs">
                  {pdActiveTasks.length}
                </Badge>
              )}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchPdActive()}
            className="text-muted-foreground hover:text-blue-400 gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>

        {loadingPdActive ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-56 rounded-2xl bg-secondary" />
            ))}
          </div>
        ) : pdActiveTasks.length === 0 ? (
          <div
            data-ocid="tasker.pd_active_tasks.empty_state"
            className="glass-card rounded-2xl p-10 text-center border-border"
          >
            <Truck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No active pickup-drop tasks</h3>
            <p className="text-muted-foreground text-sm">
              Accept a pickup-drop task from Find Tasks to see it here
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {pdActiveTasks.map((taskTuple, i) => (
                <PdActiveCard
                  key={String(taskTuple[0].id)}
                  taskTuple={taskTuple}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

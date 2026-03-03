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
  RefreshCw,
  Store,
  Wallet,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { TaskStatus } from "../backend.d";
import type { Task } from "../backend.d";
import { TaskStatusBadge } from "../components/TaskStatusBadge";
import {
  useAcceptTask,
  useAvailableTasks,
  useMarkDelivered,
  useMarkInProgress,
  useMyAcceptedTasks,
  useProfile,
  useUpdateProfile,
  useVerifyOtp,
  useWalletBalance,
} from "../hooks/useQueries";
import { formatINR, formatTimestamp } from "../utils/format";

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
            {task.storeLocation}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span className="truncate">{task.customerLocation}</span>
        </div>
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
  const [otpInput, setOtpInput] = useState("");

  const total = task.amount + (task.tip ?? 0n);

  const handleVerify = async () => {
    if (!otpInput) return;
    await verifyOtp.mutateAsync({ taskId: task.id, otp: BigInt(otpInput) });
    setOtpInput("");
  };

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
            {task.storeLocation}
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
              Verify OTP to complete
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Ask the customer to share their 6-digit OTP
          </p>
          <div className="flex gap-2">
            <Input
              data-ocid="tasker.verify_otp_input"
              type="number"
              placeholder="Enter 6-digit OTP"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              maxLength={6}
              className="bg-background border-border focus:border-green-vivid/50 rounded-xl h-11 font-mono text-center tracking-widest text-lg"
            />
            <Button
              data-ocid="tasker.verify_otp_button"
              onClick={handleVerify}
              disabled={verifyOtp.isPending || otpInput.length < 4}
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

      {task.acceptedAt && (
        <p className="text-xs text-muted-foreground">
          Accepted: {formatTimestamp(task.acceptedAt)}
        </p>
      )}
    </motion.div>
  );
}

export default function TaskerDashboard() {
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

  const refetchAll = () => {
    refetchAvailable();
    refetchActive();
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
    </div>
  );
}

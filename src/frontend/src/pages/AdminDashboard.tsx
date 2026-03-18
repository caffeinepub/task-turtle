import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  Loader2,
  Lock,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Star,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { PublicUserProfile, Task } from "../backend.d";
import { TaskStatus } from "../backend.d";
import { TaskStatusBadge } from "../components/TaskStatusBadge";
import {
  useAdminAllTasks,
  useAdminAllUsers,
  useAdminBlockUser,
  useAdminCancelTask,
  useIsAdmin,
  usePlatformStats,
} from "../hooks/useQueries";
import { formatINR, formatTimestamp } from "../utils/format";

type AdminTab = "overview" | "tasks" | "taskers" | "users";

function parseContact(raw: string): { store: string; contact: string | null } {
  const parts = raw.split("|||CONTACT:");
  return { store: parts[0], contact: parts[1] ?? null };
}

function truncatePrincipal(p: string): string {
  if (p.length <= 12) return p;
  return `${p.slice(0, 6)}…${p.slice(-4)}`;
}

function StarRating({ rating }: { rating: bigint }) {
  const stars = Number(rating);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3 h-3 ${
            s <= stars
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">
        {stars > 0 ? `${stars}.0` : "—"}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 border-border">
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className="font-display font-black text-3xl text-foreground">
        {value}
      </p>
    </div>
  );
}

function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  isPending,
  variant,
  ocid,
}: {
  label: React.ReactNode;
  confirmLabel: React.ReactNode;
  onConfirm: () => void;
  isPending: boolean;
  variant: "cancel" | "block";
  ocid: string;
}) {
  const [armed, setArmed] = useState(false);

  const handle = () => {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 3000);
      return;
    }
    onConfirm();
    setArmed(false);
  };

  const isCancel = variant === "cancel";
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handle}
      disabled={isPending}
      data-ocid={ocid}
      className={`h-7 px-2.5 text-xs font-semibold rounded-lg transition-all ${
        armed
          ? "border-red-400 bg-red-400/15 text-red-400 hover:bg-red-400/25"
          : isCancel
            ? "border-orange-400/40 text-orange-400 hover:bg-orange-400/10 hover:border-orange-400/60"
            : "border-red-400/30 text-red-400/70 hover:bg-red-400/10 hover:border-red-400/50 hover:text-red-400"
      }`}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : armed ? (
        confirmLabel
      ) : (
        label
      )}
    </Button>
  );
}

// ─── All Tasks Tab ────────────────────────────────────────────────────────────

const STATUS_FILTERS: Array<{ label: string; value: TaskStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Posted", value: TaskStatus.posted },
  { label: "Accepted", value: TaskStatus.accepted },
  { label: "In Progress", value: TaskStatus.inProgress },
  { label: "Delivered", value: TaskStatus.delivered },
  { label: "Completed", value: TaskStatus.completed },
  { label: "Cancelled", value: TaskStatus.cancelled },
];

function AllTasksTab({
  tasks,
  users,
  isLoading,
}: {
  tasks: Task[];
  users: PublicUserProfile[];
  isLoading: boolean;
}) {
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const cancelTask = useAdminCancelTask();
  const blockUser = useAdminBlockUser();

  const profileMap = new Map<string, PublicUserProfile>();
  for (const u of users) {
    profileMap.set(u.id.toString(), u);
  }

  const filtered =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2" data-ocid="admin.tasks.tab">
        {STATUS_FILTERS.map((f) => (
          <button
            type="button"
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === f.value
                ? "bg-green-surface text-green-vivid border border-green-vivid/40"
                : "bg-secondary/60 text-muted-foreground border border-border hover:text-foreground"
            }`}
          >
            {f.label}
            {f.value !== "all" && (
              <span className="ml-1.5 opacity-60">
                {tasks.filter((t) => t.status === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl bg-secondary" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="glass-card rounded-2xl p-12 text-center border-border"
          data-ocid="admin.tasks.empty_state"
        >
          <div className="text-5xl mb-4">📋</div>
          <h3 className="font-semibold text-lg mb-2">No tasks found</h3>
          <p className="text-muted-foreground text-sm">
            No tasks match the selected filter.
          </p>
        </div>
      ) : (
        <div
          className="glass-card rounded-2xl border-border overflow-hidden"
          data-ocid="admin.tasks.table"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  {[
                    "ID",
                    "Task",
                    "Customer",
                    "Tasker",
                    "Amount",
                    "Status",
                    "OTP",
                    "Timestamps",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((task, i) => {
                  const customer = profileMap.get(task.customerId.toString());
                  const tasker = task.taskerId
                    ? profileMap.get(task.taskerId.toString())
                    : undefined;
                  const { contact } = parseContact(task.storeLocation);

                  return (
                    <motion.tr
                      key={String(task.id)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-border hover:bg-secondary/30 transition-colors"
                      data-ocid={`admin.tasks.row.${i + 1}`}
                    >
                      {/* ID */}
                      <td className="px-3 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                        #{String(task.id)}
                      </td>

                      {/* Task */}
                      <td className="px-3 py-3">
                        <p className="text-sm font-semibold text-foreground truncate max-w-[140px]">
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-muted-foreground/60" />
                          <span className="text-xs text-muted-foreground/60 truncate max-w-[120px]">
                            {task.customerLocation}
                          </span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-3 py-3">
                        <p className="text-sm font-medium text-foreground">
                          {customer?.name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {truncatePrincipal(task.customerId.toString())}
                        </p>
                        {contact && (
                          <a
                            href={`tel:${contact}`}
                            className="inline-flex items-center gap-0.5 text-xs text-green-vivid hover:underline mt-0.5"
                          >
                            <Phone className="w-2.5 h-2.5" />
                            {contact}
                          </a>
                        )}
                      </td>

                      {/* Tasker */}
                      <td className="px-3 py-3">
                        {task.taskerId ? (
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {tasker?.name ?? "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {truncatePrincipal(task.taskerId.toString())}
                            </p>
                            {tasker?.phone && (
                              <a
                                href={`tel:${tasker.phone}`}
                                className="inline-flex items-center gap-0.5 text-xs text-blue-400 hover:underline mt-0.5"
                              >
                                <Phone className="w-2.5 h-2.5" />
                                {tasker.phone}
                              </a>
                            )}
                            {tasker?.location && (
                              <div className="flex items-center gap-0.5 mt-0.5">
                                <MapPin className="w-2.5 h-2.5 text-muted-foreground/60" />
                                <span className="text-xs text-muted-foreground/70 truncate max-w-[100px]">
                                  {tasker.location}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <p className="text-sm font-bold text-green-vivid">
                          {formatINR(task.amount)}
                        </p>
                        {task.tip != null && task.tip > 0n && (
                          <p className="text-xs text-muted-foreground">
                            +{formatINR(task.tip)} tip
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <TaskStatusBadge status={task.status} />
                      </td>

                      {/* OTP */}
                      <td className="px-3 py-3">
                        <div className="space-y-1">
                          <p className="text-xs font-mono font-bold text-foreground">
                            {String(task.otpCode)}
                          </p>
                          {task.otpVerified ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-vivid font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-red-400 font-semibold">
                              <X className="w-3 h-3" />
                              Not Verified
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Timestamps */}
                      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p>Posted: {formatTimestamp(task.createdAt)}</p>
                          {task.acceptedAt && (
                            <p>Accepted: {formatTimestamp(task.acceptedAt)}</p>
                          )}
                          {task.completedAt && (
                            <p>
                              Completed: {formatTimestamp(task.completedAt)}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <ConfirmButton
                            label={
                              <>
                                <X className="w-3 h-3 mr-1" />
                                Cancel
                              </>
                            }
                            confirmLabel={
                              <>
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Sure?
                              </>
                            }
                            onConfirm={() => cancelTask.mutate(task.id)}
                            isPending={cancelTask.isPending}
                            variant="cancel"
                            ocid="admin.tasks.cancel_button"
                          />
                          <ConfirmButton
                            label={
                              <>
                                <UserX className="w-3 h-3 mr-1" />
                                Block
                              </>
                            }
                            confirmLabel={
                              <>
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Sure?
                              </>
                            }
                            onConfirm={() => blockUser.mutate(task.customerId)}
                            isPending={blockUser.isPending}
                            variant="block"
                            ocid="admin.tasks.delete_button"
                          />
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Taskers Tab ──────────────────────────────────────────────────────────────

function TaskersTab({
  users,
  tasks,
  isLoading,
}: {
  users: PublicUserProfile[];
  tasks: Task[];
  isLoading: boolean;
}) {
  const blockUser = useAdminBlockUser();
  const taskers = users.filter((u) => u.isAvailableAsTasker);

  const activeStatuses = new Set<TaskStatus>([
    TaskStatus.accepted,
    TaskStatus.inProgress,
    TaskStatus.delivered,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <UserCheck className="w-4 h-4 text-green-vivid" />
        <span className="text-sm text-muted-foreground">
          {taskers.length} registered tasker{taskers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : taskers.length === 0 ? (
        <div
          className="glass-card rounded-2xl p-12 text-center border-border"
          data-ocid="admin.taskers.empty_state"
        >
          <div className="text-5xl mb-4">🧑‍💼</div>
          <h3 className="font-semibold text-lg mb-2">No taskers registered</h3>
          <p className="text-muted-foreground text-sm">
            No users have enabled tasker mode yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {taskers.map((tasker, i) => {
            const activeTask = tasks.find(
              (t) =>
                t.taskerId?.toString() === tasker.id.toString() &&
                activeStatuses.has(t.status),
            );

            return (
              <motion.div
                key={tasker.id.toString()}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                data-ocid={`admin.taskers.card.${i + 1}`}
                className="glass-card rounded-2xl p-5 border-border space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">
                      {tasker.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {truncatePrincipal(tasker.id.toString())}
                    </p>
                  </div>
                  <Badge className="bg-green-surface text-green-vivid border-0 text-xs">
                    Tasker
                  </Badge>
                </div>

                {/* Details */}
                <div className="space-y-1.5">
                  {tasker.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3 text-green-vivid flex-shrink-0" />
                      <a
                        href={`tel:${tasker.phone}`}
                        className="text-green-vivid hover:underline font-medium"
                      >
                        {tasker.phone}
                      </a>
                    </div>
                  )}
                  {tasker.location && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 text-blue-400 flex-shrink-0" />
                      <span className="truncate">{tasker.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <IndianRupee className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                    <span>Wallet: {formatINR(tasker.walletBalance)}</span>
                  </div>
                  <StarRating rating={tasker.rating} />
                </div>

                {/* Active task */}
                <div
                  className={`rounded-xl p-3 text-xs ${
                    activeTask
                      ? "bg-green-surface/50 border border-green-vivid/20"
                      : "bg-secondary/50 border border-border"
                  }`}
                >
                  {activeTask ? (
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">
                        Task #{String(activeTask.id)} — {activeTask.title}
                      </p>
                      <TaskStatusBadge status={activeTask.status} />
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No active task</p>
                  )}
                </div>

                {/* Block */}
                <ConfirmButton
                  label={
                    <>
                      <UserX className="w-3 h-3 mr-1" />
                      Block Tasker
                    </>
                  }
                  confirmLabel={
                    <>
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Confirm Block?
                    </>
                  }
                  onConfirm={() => blockUser.mutate(tasker.id)}
                  isPending={blockUser.isPending}
                  variant="block"
                  ocid={`admin.taskers.delete_button.${i + 1}`}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── All Users Tab ────────────────────────────────────────────────────────────

function AllUsersTab({
  users,
  isLoading,
}: {
  users: PublicUserProfile[];
  isLoading: boolean;
}) {
  const blockUser = useAdminBlockUser();

  return (
    <div>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl bg-secondary" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div
          className="glass-card rounded-2xl p-12 text-center border-border"
          data-ocid="admin.users.empty_state"
        >
          <div className="text-5xl mb-4">👤</div>
          <h3 className="font-semibold text-lg mb-2">No users yet</h3>
          <p className="text-muted-foreground text-sm">
            No users have registered on the platform.
          </p>
        </div>
      ) : (
        <div
          className="glass-card rounded-2xl border-border overflow-hidden"
          data-ocid="admin.users.table"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  {[
                    "Name",
                    "Phone",
                    "Location",
                    "Rating",
                    "Wallet",
                    "Role",
                    "Principal",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <motion.tr
                    key={user.id.toString()}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-border hover:bg-secondary/30 transition-colors"
                    data-ocid={`admin.users.row.${i + 1}`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">
                        {user.name}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {user.phone ? (
                        <a
                          href={`tel:${user.phone}`}
                          className="inline-flex items-center gap-1 text-xs text-green-vivid hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          {user.phone}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {user.location ? (
                          <>
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate max-w-[120px]">
                              {user.location}
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StarRating rating={user.rating} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold text-green-vivid">
                        {formatINR(user.walletBalance)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.isAvailableAsTasker ? (
                        <Badge className="bg-green-surface text-green-vivid border-0 text-xs">
                          Tasker
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          User
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground font-mono">
                        {truncatePrincipal(user.id.toString())}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ConfirmButton
                        label={
                          <>
                            <UserX className="w-3 h-3 mr-1" />
                            Block
                          </>
                        }
                        confirmLabel={
                          <>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Sure?
                          </>
                        }
                        onConfirm={() => blockUser.mutate(user.id)}
                        isPending={blockUser.isPending}
                        variant="block"
                        ocid={`admin.users.delete_button.${i + 1}`}
                      />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  stats,
  tasks,
  users,
  loadingStats,
}: {
  stats:
    | { totalTasks: bigint; completedTasks: bigint; totalFees: bigint }
    | null
    | undefined;
  tasks: Task[];
  users: PublicUserProfile[];
  loadingStats: boolean;
}) {
  const activeTasks = tasks.filter(
    (t) =>
      t.status === TaskStatus.accepted ||
      t.status === TaskStatus.inProgress ||
      t.status === TaskStatus.delivered,
  );
  const activeTaskers = users.filter(
    (u) =>
      u.isAvailableAsTasker &&
      tasks.some(
        (t) =>
          t.taskerId?.toString() === u.id.toString() &&
          (t.status === TaskStatus.accepted ||
            t.status === TaskStatus.inProgress ||
            t.status === TaskStatus.delivered),
      ),
  );

  return (
    <div className="space-y-6">
      {/* Platform stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {loadingStats ? (
          [1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-secondary" />
          ))
        ) : (
          <>
            <StatCard
              label="Total Tasks"
              value={stats ? String(stats.totalTasks) : "0"}
              icon={ClipboardList}
              color="bg-blue-400/15 text-blue-400"
            />
            <StatCard
              label="Completed Tasks"
              value={stats ? String(stats.completedTasks) : "0"}
              icon={CheckCircle2}
              color="bg-green-surface text-green-vivid"
            />
            <StatCard
              label="Fees Collected"
              value={stats ? formatINR(stats.totalFees) : "₹0"}
              icon={IndianRupee}
              color="bg-yellow-400/15 text-yellow-400"
            />
          </>
        )}
      </div>

      {/* Live counters */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5 border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full bg-green-vivid animate-pulse" />
            <p className="text-sm font-semibold text-foreground">
              Active Tasks Right Now
            </p>
          </div>
          <p className="font-display font-black text-4xl text-green-vivid">
            {activeTasks.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Accepted / In Progress / Delivered
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5 border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
            <p className="text-sm font-semibold text-foreground">
              Active Taskers
            </p>
          </div>
          <p className="font-display font-black text-4xl text-blue-400">
            {activeTaskers.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Currently on a task
          </p>
        </div>
      </div>

      {/* Quick breakdown */}
      <div className="glass-card rounded-2xl p-5 border-border">
        <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">
          Task Status Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Posted",
              status: TaskStatus.posted,
              color: "text-blue-400",
            },
            {
              label: "Accepted",
              status: TaskStatus.accepted,
              color: "text-orange-400",
            },
            {
              label: "In Progress",
              status: TaskStatus.inProgress,
              color: "text-yellow-400",
            },
            {
              label: "Delivered",
              status: TaskStatus.delivered,
              color: "text-purple-400",
            },
            {
              label: "Completed",
              status: TaskStatus.completed,
              color: "text-green-vivid",
            },
            {
              label: "Cancelled",
              status: TaskStatus.cancelled,
              color: "text-red-400",
            },
          ].map((s) => (
            <div
              key={s.status}
              className="bg-secondary/50 rounded-xl p-3 text-center"
            >
              <p className={`text-2xl font-black ${s.color}`}>
                {tasks.filter((t) => t.status === s.status).length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Registered users & taskers */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5 border-border">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Total Registered Users</p>
          </div>
          <p className="font-display font-black text-3xl">{users.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-5 border-border">
          <div className="flex items-center gap-3 mb-2">
            <UserCheck className="w-4 h-4 text-green-vivid" />
            <p className="text-sm font-semibold">Total Taskers</p>
          </div>
          <p className="font-display font-black text-3xl text-green-vivid">
            {users.filter((u) => u.isAvailableAsTasker).length}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const isAdminMode = localStorage.getItem("loginMode") === "admin";
  const { data: stats, isLoading: loadingStats } = usePlatformStats();
  const {
    data: tasks = [],
    isLoading: loadingTasks,
    refetch: refetchTasks,
  } = useAdminAllTasks();
  const {
    data: users = [],
    isLoading: loadingUsers,
    refetch: refetchUsers,
  } = useAdminAllUsers();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  const handleRefresh = () => {
    refetchTasks();
    refetchUsers();
  };

  if (checkingAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl bg-secondary" />
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin && !isAdminMode) {
    return (
      <div
        className="max-w-md mx-auto px-4 py-20 text-center"
        data-ocid="admin.panel"
      >
        <div className="glass-card rounded-3xl p-10 border-border">
          <div className="w-16 h-16 bg-red-400/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="font-display font-black text-2xl mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground text-sm">
            This page is only accessible to platform admins.
          </p>
        </div>
      </div>
    );
  }

  const tabs: Array<{
    id: AdminTab;
    label: string;
    icon: React.ElementType;
    count?: number;
  }> = [
    { id: "overview", label: "Overview", icon: ShieldCheck },
    {
      id: "tasks",
      label: "All Tasks",
      icon: ClipboardList,
      count: tasks.length,
    },
    {
      id: "taskers",
      label: "Taskers",
      icon: UserCheck,
      count: users.filter((u) => u.isAvailableAsTasker).length,
    },
    { id: "users", label: "All Users", icon: Users, count: users.length },
  ];

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6"
      data-ocid="admin.panel"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <ShieldCheck className="w-7 h-7 text-green-vivid" />
            <h1 className="font-display font-black text-3xl sm:text-4xl">
              Admin <span className="text-green-gradient">Dashboard</span>
            </h1>
          </div>
          <p className="text-muted-foreground">
            Full platform control — tasks, taskers, and users
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          data-ocid="admin.refresh_button"
          onClick={handleRefresh}
          className="text-muted-foreground hover:text-green-vivid gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              data-ocid={`admin.${tab.id}.tab`}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                isActive
                  ? "border-green-vivid text-green-vivid"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-green-surface text-green-vivid"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "overview" && (
          <OverviewTab
            stats={stats}
            tasks={tasks}
            users={users}
            loadingStats={loadingStats}
          />
        )}
        {activeTab === "tasks" && (
          <AllTasksTab
            tasks={tasks}
            users={users}
            isLoading={loadingTasks || loadingUsers}
          />
        )}
        {activeTab === "taskers" && (
          <TaskersTab users={users} tasks={tasks} isLoading={loadingUsers} />
        )}
        {activeTab === "users" && (
          <AllUsersTab users={users} isLoading={loadingUsers} />
        )}
      </motion.div>
    </div>
  );
}

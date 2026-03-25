import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  BanknoteIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Copy,
  CreditCard,
  IndianRupee,
  Loader2,
  Lock,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  PaymentLog,
  PayoutMethod,
  PayoutRecord,
  PublicUserProfile,
  Task,
} from "../backend.d";
import { TaskStatus } from "../backend.d";
import { TaskStatusBadge } from "../components/TaskStatusBadge";
import {
  useAdminAllTasks,
  useAdminAllUsers,
  useAdminBlockUser,
  useAdminCancelTask,
  useAdminMarkPayoutPaid,
  useAdminPaymentLogs,
  useAdminPayoutRecords,
  useIsAdmin,
  usePlatformStats,
} from "../hooks/useQueries";
import { formatINR, formatTimestamp } from "../utils/format";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminTab =
  | "overview"
  | "tasks"
  | "users"
  | "taskers"
  | "payments"
  | "payouts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncatePrincipal(p: string): string {
  if (p.length <= 14) return p;
  return `${p.slice(0, 6)}…${p.slice(-4)}`;
}

function getUserName(
  principalId: string,
  profiles: PublicUserProfile[],
): string {
  const p = profiles.find((u) => u.id.toString() === principalId);
  return p?.name || truncatePrincipal(principalId);
}

// ─── UI primitives ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 border-border">
      <div className="flex items-center gap-3 mb-3">
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
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function StarRating({ rating }: { rating: bigint }) {
  const stars = Number(rating);
  return (
    <div className="flex items-center gap-0.5">
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

const PLACEHOLDER_CELLS_7 = ["c1", "c2", "c3", "c4", "c5", "c6", "c7"];
const PLACEHOLDER_CELLS_8 = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8"];
const PLACEHOLDER_CELLS_9 = [
  "c1",
  "c2",
  "c3",
  "c4",
  "c5",
  "c6",
  "c7",
  "c8",
  "c9",
];
const PLACEHOLDER_ROWS = ["r1", "r2", "r3", "r4", "r5"];

function LoadingRows({ variant }: { variant: "7col" | "8col" | "9col" }) {
  const cells =
    variant === "7col"
      ? PLACEHOLDER_CELLS_7
      : variant === "8col"
        ? PLACEHOLDER_CELLS_8
        : PLACEHOLDER_CELLS_9;
  return (
    <>
      {PLACEHOLDER_ROWS.map((row) => (
        <TableRow key={row}>
          {cells.map((col) => (
            <TableCell key={`${row}-${col}`}>
              <div className="h-4 bg-secondary rounded animate-pulse" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function EmptyState({
  icon,
  title,
  description,
  ocid,
}: {
  icon: string;
  title: string;
  description: string;
  ocid: string;
}) {
  return (
    <div className="py-16 text-center" data-ocid={ocid}>
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="font-semibold text-base mb-1">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <span className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={page === 1}
          data-ocid="admin.pagination_prev"
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={page === totalPages}
          data-ocid="admin.pagination_next"
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({
  stats,
  tasks,
  users,
  loadingStats,
}: {
  stats:
    | {
        totalTasks: bigint;
        completedTasks: bigint;
        totalFees: bigint;
        totalUsers?: bigint;
        activeTasks?: bigint;
      }
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

  const recentTasks = [...tasks]
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingStats ? (
          ["s1", "s2", "s3", "s4"].map((k) => (
            <div
              key={k}
              className="glass-card rounded-2xl p-5 border-border h-28 animate-pulse"
            />
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
              label="Completed"
              value={stats ? String(stats.completedTasks) : "0"}
              icon={CheckCircle2}
              color="bg-green-surface text-green-vivid"
            />
            <StatCard
              label="Total Users"
              value={
                stats?.totalUsers !== undefined
                  ? String(stats.totalUsers)
                  : String(users.length)
              }
              icon={Users}
              color="bg-purple-400/15 text-purple-400"
            />
            <StatCard
              label="Platform Fees"
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
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-vivid animate-pulse" />
            <p className="text-sm font-semibold">Active Tasks Now</p>
          </div>
          <p className="font-display font-black text-4xl text-green-vivid">
            {stats?.activeTasks !== undefined
              ? Number(stats.activeTasks)
              : activeTasks.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Accepted / In Progress / Delivered
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5 border-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
            <p className="text-sm font-semibold">Registered Taskers</p>
          </div>
          <p className="font-display font-black text-4xl text-blue-400">
            {users.filter((u) => u.isAvailableAsTasker).length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Available as tasker
          </p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="glass-card rounded-2xl p-5 border-border">
        <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-4">
          Task Status Breakdown
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {(
            [
              {
                label: "Posted",
                status: TaskStatus.posted,
                color: "text-yellow-400",
              },
              {
                label: "Accepted",
                status: TaskStatus.accepted,
                color: "text-blue-400",
              },
              {
                label: "In Progress",
                status: TaskStatus.inProgress,
                color: "text-orange-400",
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
            ] as const
          ).map((s) => (
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

      {/* Recent activity */}
      <div className="glass-card rounded-2xl border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">Recent Activity</h3>
          <p className="text-xs text-muted-foreground">Last 5 tasks</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                <TableHead className="text-xs">Task</TableHead>
                <TableHead className="text-xs">Posted By</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTasks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8 text-sm"
                  >
                    No tasks yet
                  </TableCell>
                </TableRow>
              ) : (
                recentTasks.map((task) => (
                  <TableRow
                    key={String(task.id)}
                    className="hover:bg-secondary/20"
                  >
                    <TableCell>
                      <p className="font-medium text-sm truncate max-w-[140px]">
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        #{String(task.id)}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {getUserName(task.customerId.toString(), users)}
                    </TableCell>
                    <TableCell className="text-sm font-bold text-green-vivid">
                      {formatINR(task.amount)}
                    </TableCell>
                    <TableCell>
                      <TaskStatusBadge status={task.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(task.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ─── Task Detail Dialog ──────────────────────────────────────────────────────

function TaskDetailDialog({
  task,
  profiles,
  open,
  onClose,
}: {
  task: Task | null;
  profiles: PublicUserProfile[];
  open: boolean;
  onClose: () => void;
}) {
  if (!task) return null;

  const customer = profiles.find(
    (u) => u.id.toString() === task.customerId.toString(),
  );
  const tasker = task.taskerId
    ? profiles.find((u) => u.id.toString() === task.taskerId!.toString())
    : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-lg bg-surface-2 border-border text-foreground"
        data-ocid="admin.tasks.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between gap-3">
            <span className="font-display font-black text-xl">
              {task.title}
            </span>
            <span className="text-xs text-muted-foreground font-mono font-normal mt-1">
              #{String(task.id)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {/* Status + OTP */}
          <div className="flex flex-wrap gap-2 items-center">
            <TaskStatusBadge status={task.status} />
            {task.otpVerified ? (
              <Badge className="bg-green-surface text-green-vivid border-green-vivid/30 text-xs border">
                <CheckCircle2 className="w-3 h-3 mr-1" /> OTP Verified
              </Badge>
            ) : (
              <Badge className="bg-red-500/15 text-red-400 border-red-400/30 text-xs border">
                <X className="w-3 h-3 mr-1" /> OTP Pending
              </Badge>
            )}
          </div>

          {/* Description */}
          <div className="bg-secondary/40 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm">{task.description}</p>
          </div>

          {/* Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Amount</p>
              <p className="text-lg font-black text-green-vivid">
                {formatINR(task.amount)}
              </p>
            </div>
            {task.tip != null && task.tip > 0n && (
              <div className="bg-secondary/40 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Tip</p>
                <p className="text-lg font-black text-yellow-400">
                  {formatINR(task.tip)}
                </p>
              </div>
            )}
          </div>

          {/* Customer */}
          <div className="bg-secondary/40 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-2">
              Posted By (Customer)
            </p>
            <p className="font-semibold">{customer?.name ?? "Unknown"}</p>
            {customer?.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="flex items-center gap-1 text-xs text-green-vivid mt-1"
              >
                <Phone className="w-3 h-3" /> {customer.phone}
              </a>
            )}
            {customer?.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="w-3 h-3" /> {customer.location}
              </div>
            )}
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {task.customerLocation}
            </p>
          </div>

          {/* Tasker */}
          {task.taskerId && (
            <div className="bg-secondary/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-2">
                Accepted By (Tasker)
              </p>
              <p className="font-semibold">{tasker?.name ?? "Unknown"}</p>
              {tasker?.phone && (
                <a
                  href={`tel:${tasker.phone}`}
                  className="flex items-center gap-1 text-xs text-blue-400 mt-1"
                >
                  <Phone className="w-3 h-3" /> {tasker.phone}
                </a>
              )}
              {tasker?.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" /> {tasker.location}
                </div>
              )}
            </div>
          )}

          {/* OTP */}
          <div className="bg-secondary/40 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">OTP Code</p>
            <p className="font-mono font-black text-2xl tracking-widest">
              {String(task.otpCode)}
            </p>
          </div>

          {/* Timeline */}
          <div className="bg-secondary/40 rounded-xl p-3 space-y-2">
            <p className="text-xs text-muted-foreground mb-2">Timeline</p>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
              <span className="text-muted-foreground">Created:</span>
              <span>{formatTimestamp(task.createdAt)}</span>
            </div>
            {task.acceptedAt != null && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                <span className="text-muted-foreground">Accepted:</span>
                <span>{formatTimestamp(task.acceptedAt)}</span>
              </div>
            )}
            {task.completedAt != null && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-vivid flex-shrink-0" />
                <span className="text-muted-foreground">Completed:</span>
                <span>{formatTimestamp(task.completedAt)}</span>
              </div>
            )}
          </div>

          {/* Payment flow */}
          <div className="bg-green-surface/40 border border-green-vivid/20 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-2">
              Payment Breakdown
            </p>
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="text-muted-foreground">Customer Paid</p>
                <p className="font-bold text-green-vivid">
                  {formatINR(task.amount)}
                </p>
              </div>
              <div className="text-muted-foreground">→</div>
              <div>
                <p className="text-muted-foreground">Platform (5%)</p>
                <p className="font-bold text-yellow-400">
                  {formatINR(BigInt(Math.round(Number(task.amount) * 0.05)))}
                </p>
              </div>
              <div className="text-muted-foreground">→</div>
              <div>
                <p className="text-muted-foreground">Tasker (95%)</p>
                <p className="font-bold text-blue-400">
                  {formatINR(BigInt(Math.round(Number(task.amount) * 0.95)))}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="admin.tasks.dialog.close_button"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab: All Tasks ───────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

function AllTasksTab({
  tasks,
  users,
  isLoading,
}: {
  tasks: Task[];
  users: PublicUserProfile[];
  isLoading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [cancelTarget, setCancelTarget] = useState<bigint | null>(null);
  const cancelTask = useAdminCancelTask();

  const profileMap = useMemo(() => {
    const m = new Map<string, PublicUserProfile>();
    for (const u of users) m.set(u.id.toString(), u);
    return m;
  }, [users]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          getUserName(t.customerId.toString(), users).toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
  }, [tasks, statusFilter, search, users]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filter/search changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional page reset on filter change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleCancel = (taskId: bigint) => {
    cancelTask.mutate(taskId, {
      onSuccess: () => setCancelTarget(null),
      onError: () => setCancelTarget(null),
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, description, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50 border-border"
            data-ocid="admin.tasks.search_input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            className="w-full sm:w-44 bg-secondary/50 border-border"
            data-ocid="admin.tasks.select"
          >
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-surface-2 border-border">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value={TaskStatus.posted}>Posted</SelectItem>
            <SelectItem value={TaskStatus.accepted}>Accepted</SelectItem>
            <SelectItem value={TaskStatus.inProgress}>In Progress</SelectItem>
            <SelectItem value={TaskStatus.delivered}>Delivered</SelectItem>
            <SelectItem value={TaskStatus.completed}>Completed</SelectItem>
            <SelectItem value={TaskStatus.cancelled}>Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} tasks found
      </p>

      {/* Table */}
      <div
        className="glass-card rounded-2xl border-border overflow-hidden"
        data-ocid="admin.tasks.table"
      >
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                <TableHead className="text-xs w-20">Task ID</TableHead>
                <TableHead className="text-xs">Title</TableHead>
                <TableHead className="text-xs max-w-[180px]">
                  Description
                </TableHead>
                <TableHead className="text-xs">Posted By</TableHead>
                <TableHead className="text-xs">Price</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs whitespace-nowrap">
                  Created Date
                </TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <LoadingRows variant="9col" />
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <EmptyState
                      icon="📋"
                      title="No tasks found"
                      description="No tasks match your search or filter."
                      ocid="admin.tasks.empty_state"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((task, i) => {
                  const customer = profileMap.get(task.customerId.toString());
                  const isCancelable =
                    task.status !== TaskStatus.cancelled &&
                    task.status !== TaskStatus.completed;

                  return (
                    <motion.tr
                      key={String(task.id)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.015 }}
                      className="border-b border-border hover:bg-secondary/20 transition-colors"
                      data-ocid={`admin.tasks.row.${(page - 1) * PAGE_SIZE + i + 1}`}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{String(task.id)}
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-sm truncate max-w-[140px]">
                          {task.title}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {task.description.slice(0, 40)}
                          {task.description.length > 40 ? "…" : ""}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">
                          {customer?.name ?? "Unknown"}
                        </p>
                        {customer?.phone && (
                          <a
                            href={`tel:${customer.phone}`}
                            className="flex items-center gap-1 text-xs text-green-vivid mt-0.5"
                          >
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-green-vivid text-sm">
                          {formatINR(task.amount)}
                        </span>
                        {task.tip != null && task.tip > 0n && (
                          <p className="text-xs text-muted-foreground">
                            +{formatINR(task.tip)} tip
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <TaskStatusBadge status={task.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(task.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTask(task)}
                            data-ocid="admin.tasks.secondary_button"
                            className="h-7 px-2.5 text-xs border-border hover:border-blue-400/50 hover:text-blue-400"
                          >
                            View
                          </Button>
                          {isCancelable &&
                            (cancelTarget === task.id ? (
                              <Button
                                size="sm"
                                onClick={() => handleCancel(task.id)}
                                disabled={cancelTask.isPending}
                                data-ocid="admin.tasks.confirm_button"
                                className="h-7 px-2.5 text-xs bg-red-500 hover:bg-red-600 text-white"
                              >
                                {cancelTask.isPending ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  "Sure?"
                                )}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCancelTarget(task.id)}
                                data-ocid="admin.tasks.delete_button"
                                className="h-7 px-2.5 text-xs border-red-400/30 text-red-400 hover:bg-red-400/10 hover:border-red-400/60"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                            ))}
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      </div>

      <TaskDetailDialog
        task={selectedTask}
        profiles={users}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}

// ─── User Profile Dialog ─────────────────────────────────────────────────────

function UserProfileDialog({
  user,
  tasks,
  open,
  onClose,
}: {
  user: PublicUserProfile | null;
  tasks: Task[];
  open: boolean;
  onClose: () => void;
}) {
  if (!user) return null;
  const uid = user.id.toString();
  const userTasks = tasks.filter((t) => t.customerId.toString() === uid);
  const amountSpent = userTasks
    .filter((t) => t.status === TaskStatus.completed)
    .reduce((sum, t) => sum + t.amount, 0n);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-lg bg-surface-2 border-border text-foreground"
        data-ocid="admin.users.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display font-black text-xl">
            {user.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Phone</p>
              {user.phone ? (
                <a
                  href={`tel:${user.phone}`}
                  className="text-sm text-green-vivid font-medium"
                >
                  {user.phone}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>
            <div className="bg-secondary/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">
                Wallet Balance
              </p>
              <p className="text-sm font-bold text-green-vivid">
                {formatINR(user.walletBalance)}
              </p>
            </div>
            <div className="bg-secondary/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Tasks Posted</p>
              <p className="text-sm font-bold">{userTasks.length}</p>
            </div>
            <div className="bg-secondary/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Amount Spent</p>
              <p className="text-sm font-bold text-yellow-400">
                {formatINR(amountSpent)}
              </p>
            </div>
          </div>
          {user.location && (
            <div className="bg-secondary/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Location</p>
              <p className="text-sm">{user.location}</p>
            </div>
          )}
          <div className="bg-secondary/40 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Rating</p>
            <StarRating rating={user.rating} />
          </div>
          {userTasks.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Task History
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {userTasks.slice(0, 10).map((t) => (
                  <div
                    key={String(t.id)}
                    className="flex items-center justify-between bg-secondary/30 rounded-xl p-2.5"
                  >
                    <div>
                      <p className="text-xs font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        #{String(t.id)} · {formatTimestamp(t.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <TaskStatusBadge status={t.status} />
                      <span className="text-xs font-bold text-green-vivid">
                        {formatINR(t.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="admin.users.dialog.close_button"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab: Users ───────────────────────────────────────────────────────────────

function UsersTab({
  users,
  tasks,
  isLoading,
}: {
  users: PublicUserProfile[];
  tasks: Task[];
  isLoading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<PublicUserProfile | null>(
    null,
  );
  const blockUser = useAdminBlockUser();

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.phone ?? "").toLowerCase().includes(q),
    );
  }, [users, search]);

  const getTaskCount = (uid: string) =>
    tasks.filter((t) => t.customerId.toString() === uid).length;
  const getAmountSpent = (uid: string) =>
    tasks
      .filter(
        (t) =>
          t.customerId.toString() === uid && t.status === TaskStatus.completed,
      )
      .reduce((sum, t) => sum + t.amount, 0n);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary/50 border-border"
          data-ocid="admin.users.search_input"
        />
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} users</p>

      <div
        className="glass-card rounded-2xl border-border overflow-hidden"
        data-ocid="admin.users.table"
      >
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Phone</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs">Tasks Posted</TableHead>
                <TableHead className="text-xs">Amount Spent</TableHead>
                <TableHead className="text-xs">Wallet Balance</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <LoadingRows variant="7col" />
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState
                      icon="👤"
                      title="No users found"
                      description="No users match your search."
                      ocid="admin.users.empty_state"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user, i) => (
                  <motion.tr
                    key={user.id.toString()}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.015 }}
                    className="border-b border-border hover:bg-secondary/20 transition-colors"
                    data-ocid={`admin.users.row.${i + 1}`}
                  >
                    <TableCell>
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {truncatePrincipal(user.id.toString())}
                      </p>
                    </TableCell>
                    <TableCell>
                      {user.phone ? (
                        <a
                          href={`tel:${user.phone}`}
                          className="flex items-center gap-1 text-xs text-green-vivid"
                        >
                          <Phone className="w-3 h-3" /> {user.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.location ? (
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">
                            {user.location}
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {getTaskCount(user.id.toString())}
                    </TableCell>
                    <TableCell className="text-sm font-bold text-yellow-400">
                      {formatINR(getAmountSpent(user.id.toString()))}
                    </TableCell>
                    <TableCell className="text-sm font-bold text-green-vivid">
                      {formatINR(user.walletBalance)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(user)}
                          data-ocid="admin.users.secondary_button"
                          className="h-7 px-2.5 text-xs border-border hover:border-blue-400/50 hover:text-blue-400"
                        >
                          View Profile
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => blockUser.mutate(user.id)}
                          disabled={blockUser.isPending}
                          data-ocid={`admin.users.delete_button.${i + 1}`}
                          className="h-7 px-2.5 text-xs border-red-400/30 text-red-400 hover:bg-red-400/10"
                        >
                          <UserX className="w-3 h-3 mr-1" />
                          Block
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <UserProfileDialog
        user={selectedUser}
        tasks={tasks}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}

// ─── Tasker Profile Dialog ───────────────────────────────────────────────────

function TaskerProfileDialog({
  user,
  tasks,
  open,
  onClose,
}: {
  user: PublicUserProfile | null;
  tasks: Task[];
  open: boolean;
  onClose: () => void;
}) {
  if (!user) return null;
  const uid = user.id.toString();
  const taskerTasks = tasks.filter((t) => t.taskerId?.toString() === uid);
  const completedTasks = taskerTasks.filter(
    (t) => t.status === TaskStatus.completed,
  );
  const activeTasks = taskerTasks.filter(
    (t) =>
      t.status === TaskStatus.accepted ||
      t.status === TaskStatus.inProgress ||
      t.status === TaskStatus.delivered,
  );
  const totalEarnings = completedTasks.reduce(
    (sum, t) => sum + BigInt(Math.round(Number(t.amount) * 0.95)),
    0n,
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-lg bg-surface-2 border-border text-foreground"
        data-ocid="admin.taskers.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display font-black text-xl">
            {user.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Phone</p>
              {user.phone ? (
                <a
                  href={`tel:${user.phone}`}
                  className="text-sm text-green-vivid font-medium"
                >
                  {user.phone}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>
            <div className="bg-secondary/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Location</p>
              <p className="text-sm">{user.location || "—"}</p>
            </div>
            <div className="bg-secondary/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">
                Completed Tasks
              </p>
              <p className="text-2xl font-black text-green-vivid">
                {completedTasks.length}
              </p>
            </div>
            <div className="bg-secondary/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Active Tasks</p>
              <p className="text-2xl font-black text-blue-400">
                {activeTasks.length}
              </p>
            </div>
            <div className="bg-secondary/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">
                Total Earnings
              </p>
              <p className="text-sm font-bold text-yellow-400">
                {formatINR(totalEarnings)}
              </p>
            </div>
            <div className="bg-secondary/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Rating</p>
              <StarRating rating={user.rating} />
            </div>
          </div>
          {taskerTasks.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                All Tasks
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {taskerTasks.slice(0, 10).map((t) => (
                  <div
                    key={String(t.id)}
                    className="flex items-center justify-between bg-secondary/30 rounded-xl p-2.5"
                  >
                    <div>
                      <p className="text-xs font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        #{String(t.id)} · {formatTimestamp(t.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <TaskStatusBadge status={t.status} />
                      <span className="text-xs font-bold text-green-vivid">
                        {formatINR(t.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="admin.taskers.dialog.close_button"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab: Taskers ─────────────────────────────────────────────────────────────

function TaskersTab({
  users,
  tasks,
  isLoading,
}: {
  users: PublicUserProfile[];
  tasks: Task[];
  isLoading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selectedTasker, setSelectedTasker] =
    useState<PublicUserProfile | null>(null);
  const blockUser = useAdminBlockUser();

  const taskers = useMemo(
    () => users.filter((u) => u.isAvailableAsTasker),
    [users],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return taskers;
    const q = search.toLowerCase();
    return taskers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.phone ?? "").toLowerCase().includes(q),
    );
  }, [taskers, search]);

  const getCompletedCount = (uid: string) =>
    tasks.filter(
      (t) =>
        t.taskerId?.toString() === uid && t.status === TaskStatus.completed,
    ).length;

  const getActiveCount = (uid: string) =>
    tasks.filter(
      (t) =>
        t.taskerId?.toString() === uid &&
        (t.status === TaskStatus.accepted ||
          t.status === TaskStatus.inProgress ||
          t.status === TaskStatus.delivered),
    ).length;

  const getTotalEarnings = (uid: string) =>
    tasks
      .filter(
        (t) =>
          t.taskerId?.toString() === uid && t.status === TaskStatus.completed,
      )
      .reduce(
        (sum, t) => sum + BigInt(Math.round(Number(t.amount) * 0.95)),
        0n,
      );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search taskers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary/50 border-border"
          data-ocid="admin.taskers.search_input"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} taskers registered
      </p>

      <div
        className="glass-card rounded-2xl border-border overflow-hidden"
        data-ocid="admin.taskers.table"
      >
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Phone</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs">Completed</TableHead>
                <TableHead className="text-xs">Active</TableHead>
                <TableHead className="text-xs">Total Earnings</TableHead>
                <TableHead className="text-xs">Pending Payout</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <LoadingRows variant="9col" />
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <EmptyState
                      icon="🧑‍💼"
                      title="No taskers yet"
                      description="No users have enabled tasker mode."
                      ocid="admin.taskers.empty_state"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user, i) => {
                  const uid = user.id.toString();
                  const completedCount = getCompletedCount(uid);
                  const activeCount = getActiveCount(uid);
                  const earnings = getTotalEarnings(uid);

                  return (
                    <motion.tr
                      key={uid}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.015 }}
                      className="border-b border-border hover:bg-secondary/20 transition-colors"
                      data-ocid={`admin.taskers.row.${i + 1}`}
                    >
                      <TableCell>
                        <p className="font-semibold text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {truncatePrincipal(uid)}
                        </p>
                      </TableCell>
                      <TableCell>
                        {user.phone ? (
                          <a
                            href={`tel:${user.phone}`}
                            className="flex items-center gap-1 text-xs text-green-vivid"
                          >
                            <Phone className="w-3 h-3" /> {user.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {user.location || "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-bold text-green-vivid">
                          {completedCount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-sm font-bold ${
                            activeCount > 0
                              ? "text-blue-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {activeCount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-bold text-yellow-400">
                          {formatINR(earnings)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">—</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTasker(user)}
                            data-ocid="admin.taskers.secondary_button"
                            className="h-7 px-2.5 text-xs border-border hover:border-blue-400/50 hover:text-blue-400"
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => blockUser.mutate(user.id)}
                            disabled={blockUser.isPending}
                            data-ocid={`admin.taskers.delete_button.${i + 1}`}
                            className="h-7 px-2.5 text-xs border-red-400/30 text-red-400 hover:bg-red-400/10"
                          >
                            <UserX className="w-3 h-3 mr-1" />
                            Block
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <TaskerProfileDialog
        user={selectedTasker}
        tasks={tasks}
        open={!!selectedTasker}
        onClose={() => setSelectedTasker(null)}
      />
    </div>
  );
}

// ─── Tab: Payments ───────────────────────────────────────────────────────────

function getPaymentStatusInfo(status: { __kind__: string }): {
  label: string;
  cls: string;
} {
  if (status.__kind__ === "success")
    return {
      label: "Success",
      cls: "bg-green-surface text-green-vivid border-green-vivid/30",
    };
  if (status.__kind__ === "failed")
    return {
      label: "Failed",
      cls: "bg-red-500/15 text-red-400 border-red-400/30",
    };
  return {
    label: "Pending",
    cls: "bg-yellow-500/15 text-yellow-400 border-yellow-400/30",
  };
}

function PaymentsTab({
  users: _users,
}: {
  tasks: Task[];
  users: PublicUserProfile[];
  isLoading: boolean;
}) {
  const { data: paymentLogs = [], isLoading } = useAdminPaymentLogs();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let list = [...paymentLogs].sort((a, b) => Number(b.date) - Number(a.date));
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status.__kind__ === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => String(r.taskId).includes(q));
    }
    return list;
  }, [paymentLogs, statusFilter, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by task ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50 border-border"
            data-ocid="admin.payments.search_input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            className="w-full sm:w-40 bg-secondary/50 border-border"
            data-ocid="admin.payments.select"
          >
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent className="bg-surface-2 border-border">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div
        className="glass-card rounded-2xl border-border overflow-hidden"
        data-ocid="admin.payments.table"
      >
        <div className="overflow-x-auto">
          <Table className="min-w-[850px]">
            <TableHeader>
              <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                <TableHead className="text-xs">Payment ID</TableHead>
                <TableHead className="text-xs">Task ID</TableHead>
                <TableHead className="text-xs">User Paid</TableHead>
                <TableHead className="text-xs">Tasker Earnings</TableHead>
                <TableHead className="text-xs">Platform Fee</TableHead>
                <TableHead className="text-xs">Payment Status</TableHead>
                <TableHead className="text-xs">Payment Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <LoadingRows variant="7col" />
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState
                      icon="💳"
                      title="No payment data"
                      description="Payment logs will appear here as tasks get paid and processed."
                      ocid="admin.payments.empty_state"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row: PaymentLog, i: number) => {
                  const payStatus = getPaymentStatusInfo(row.status);
                  return (
                    <motion.tr
                      key={String(row.id)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.015 }}
                      className="border-b border-border hover:bg-secondary/20 transition-colors"
                      data-ocid={`admin.payments.row.${i + 1}`}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{String(row.id)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{String(row.taskId)}
                      </TableCell>
                      <TableCell className="font-bold text-sm text-green-vivid">
                        {formatINR(row.userPaid)}
                      </TableCell>
                      <TableCell className="font-bold text-sm text-blue-400">
                        {formatINR(row.taskerEarnings)}
                      </TableCell>
                      <TableCell className="font-bold text-sm text-yellow-400">
                        {formatINR(row.platformFee)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${payStatus.cls} text-xs border px-2 py-0.5 font-semibold`}
                        >
                          {payStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(row.date)}
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Payouts (Manual) ───────────────────────────────────────────────────

function PayoutsTab({
  users,
}: {
  tasks: Task[];
  users: PublicUserProfile[];
  isLoading: boolean;
}) {
  const { data: payouts = [], isLoading } = useAdminPayoutRecords();
  const markPaid = useAdminMarkPayoutPaid();
  const [markPaidTarget, setMarkPaidTarget] = useState<bigint | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"upi" | "cash">("upi");

  const pendingTotal = payouts
    .filter((p: PayoutRecord) => p.status.__kind__ === "pending")
    .reduce((sum: bigint, p: PayoutRecord) => sum + p.amount, 0n);
  const paidTotal = payouts
    .filter((p: PayoutRecord) => p.status.__kind__ === "paid")
    .reduce((sum: bigint, p: PayoutRecord) => sum + p.amount, 0n);

  const handleMarkPaid = (taskId: bigint) => {
    const method: PayoutMethod = { __kind__: selectedMethod };
    markPaid.mutate({ taskId, method });
    setMarkPaidTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 border-border">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-xl font-black text-orange-400">
            {formatINR(pendingTotal)}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4 border-border">
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="text-xl font-black text-green-vivid">
            {formatINR(paidTotal)}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4 border-border">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-xl font-black">
            {formatINR(pendingTotal + paidTotal)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {payouts.length} payout records
        </p>
      </div>

      <div
        className="glass-card rounded-2xl border-border overflow-hidden"
        data-ocid="admin.payouts.table"
      >
        <div className="overflow-x-auto">
          <Table className="min-w-[750px]">
            <TableHeader>
              <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                <TableHead className="text-xs">Task ID</TableHead>
                <TableHead className="text-xs">Tasker</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Method</TableHead>
                <TableHead className="text-xs">Created</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <LoadingRows variant="7col" />
              ) : payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState
                      icon="💸"
                      title="No payout records"
                      description="Payout records appear here when tasks are completed and tasker payments are pending."
                      ocid="admin.payouts.empty_state"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                payouts.map((payout: PayoutRecord, i: number) => (
                  <motion.tr
                    key={String(payout.taskId)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.015 }}
                    className="border-b border-border hover:bg-secondary/20 transition-colors"
                    data-ocid={`admin.payouts.row.${i + 1}`}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{String(payout.taskId)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">
                        {getUserName(payout.taskerId.toString(), users)}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {truncatePrincipal(payout.taskerId.toString())}
                      </p>
                    </TableCell>
                    <TableCell className="font-bold text-sm text-green-vivid">
                      {formatINR(payout.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          payout.status.__kind__ === "paid"
                            ? "bg-green-surface text-green-vivid border-green-vivid/30 text-xs border px-2 py-0.5"
                            : "bg-orange-500/15 text-orange-400 border-orange-400/30 text-xs border px-2 py-0.5"
                        }
                      >
                        {payout.status.__kind__ === "paid" ? "Paid" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {payout.method
                        ? payout.method.__kind__.toUpperCase()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(payout.createdDate)}
                    </TableCell>
                    <TableCell>
                      {payout.status.__kind__ === "pending" ? (
                        markPaidTarget === payout.taskId ? (
                          <div className="flex items-center gap-2">
                            <Select
                              value={selectedMethod}
                              onValueChange={(v) =>
                                setSelectedMethod(v as "upi" | "cash")
                              }
                            >
                              <SelectTrigger
                                className="h-7 w-20 text-xs bg-secondary/50 border-border"
                                data-ocid="admin.payouts.select"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-surface-2 border-border">
                                <SelectItem value="upi">UPI</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-green-vivid hover:bg-green-vivid/90 text-white px-2"
                              onClick={() => handleMarkPaid(payout.taskId)}
                              disabled={markPaid.isPending}
                              data-ocid={`admin.payouts.confirm_button.${i + 1}`}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-muted-foreground px-2"
                              onClick={() => setMarkPaidTarget(null)}
                              data-ocid="admin.payouts.cancel_button"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-green-vivid/30 text-green-vivid hover:bg-green-surface px-2"
                            onClick={() => setMarkPaidTarget(payout.taskId)}
                            data-ocid={`admin.payouts.primary_button.${i + 1}`}
                          >
                            Mark Paid
                          </Button>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {payout.paidDate
                            ? formatTimestamp(payout.paidDate)
                            : "—"}
                        </span>
                      )}
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

const TABS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: ClipboardList },
  { id: "tasks", label: "All Tasks", icon: ClipboardList },
  { id: "users", label: "Users", icon: Users },
  { id: "taskers", label: "Taskers", icon: UserCheck },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "payouts", label: "Payouts", icon: BanknoteIcon },
];

export default function AdminDashboard() {
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const isAdminMode = localStorage.getItem("loginMode") === "admin";
  const {
    data: stats,
    isLoading: loadingStats,
    refetch: refetchStats,
  } = usePlatformStats();
  const {
    data: tasks = [],
    isLoading: loadingTasks,
    isError: tasksError,
    refetch: refetchTasks,
  } = useAdminAllTasks();
  const {
    data: users = [],
    isLoading: loadingUsers,
    isError: usersError,
    refetch: refetchUsers,
  } = useAdminAllUsers();
  const { refetch: refetchPayments } = useAdminPaymentLogs();
  const { refetch: refetchPayouts } = useAdminPayoutRecords();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchTasks();
      refetchUsers();
      refetchStats();
      refetchPayments();
      refetchPayouts();
    }, 5000);
    return () => clearInterval(interval);
  }, [
    refetchTasks,
    refetchUsers,
    refetchStats,
    refetchPayments,
    refetchPayouts,
  ]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchTasks(),
      refetchUsers(),
      refetchStats(),
      refetchPayments(),
      refetchPayouts(),
    ]);
    setIsRefreshing(false);
  };

  const tabCounts: Partial<Record<AdminTab, number>> = {
    tasks: tasks.length,
    users: users.length,
    taskers: users.filter((u) => u.isAvailableAsTasker).length,
  };

  if (checkingAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="h-10 w-48 bg-secondary rounded-xl animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {["a", "b", "c", "d"].map((k) => (
            <div
              key={k}
              className="h-28 bg-secondary rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdminMode && isAdmin === false) {
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
            This page is only accessible to platform admins. Please login using
            the admin option.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6"
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
            <ShieldCheck className="w-6 h-6 text-green-vivid" />
            <h1 className="font-display font-black text-2xl sm:text-3xl">
              Admin <span className="text-green-gradient">Control Panel</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Full operational control — tasks, users, payments &amp; payouts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-surface border border-green-vivid/30">
            <span className="w-2 h-2 rounded-full bg-green-vivid animate-pulse" />
            <span className="text-xs font-semibold text-green-vivid">Live</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            data-ocid="admin.secondary_button"
            className="text-muted-foreground hover:text-green-vivid gap-2 flex-shrink-0"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </motion.div>

      {/* Error banners */}
      {(tasksError || usersError) && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/15 border border-red-400/30 text-red-400 text-sm"
          data-ocid="admin.error_state"
        >
          <span className="text-base">⚠️</span>
          <span>Failed to load data from backend. Please refresh.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = tabCounts[tab.id];
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-ocid={`admin.${tab.id}.tab`}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? "border-green-vivid text-green-vivid"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {count !== undefined && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-green-surface text-green-vivid"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
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
        {activeTab === "users" && (
          <UsersTab users={users} tasks={tasks} isLoading={loadingUsers} />
        )}
        {activeTab === "taskers" && (
          <TaskersTab users={users} tasks={tasks} isLoading={loadingUsers} />
        )}
        {activeTab === "payments" && (
          <PaymentsTab tasks={tasks} users={users} isLoading={loadingTasks} />
        )}
        {activeTab === "payouts" && (
          <PayoutsTab tasks={tasks} users={users} isLoading={loadingTasks} />
        )}
      </motion.div>
    </div>
  );
}

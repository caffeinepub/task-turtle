import { Badge } from "@/components/ui/badge";
import { TaskStatus } from "../backend.d";

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  [TaskStatus.posted]: {
    label: "Posted",
    className: "bg-yellow-400/15 text-yellow-400 border-yellow-400/30",
  },
  [TaskStatus.accepted]: {
    label: "Accepted",
    className: "bg-blue-400/15 text-blue-400 border-blue-400/30",
  },
  [TaskStatus.inProgress]: {
    label: "In Progress",
    className: "bg-orange-400/15 text-orange-400 border-orange-400/30",
  },
  [TaskStatus.delivered]: {
    label: "Delivered",
    className: "bg-purple-400/15 text-purple-400 border-purple-400/30",
  },
  [TaskStatus.completed]: {
    label: "Completed",
    className: "bg-green-surface text-green-vivid border-green-vivid/30",
  },
  [TaskStatus.cancelled]: {
    label: "Cancelled",
    className: "bg-red-500/15 text-red-400 border-red-400/30",
  },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <Badge
      className={`${config.className} text-xs font-semibold border px-2 py-0.5`}
    >
      {config.label}
    </Badge>
  );
}

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { TaskStatus } from "../backend.d";
import type { Task } from "../backend.d";
import { formatTimestamp } from "../utils/format";

interface StatusEvent {
  status: TaskStatus;
  emoji: string;
  message: string;
  timestamp?: bigint;
  reached: boolean;
}

const STATUS_SEQUENCE: TaskStatus[] = [
  TaskStatus.posted,
  TaskStatus.accepted,
  TaskStatus.inProgress,
  TaskStatus.delivered,
  TaskStatus.completed,
];

function buildEvents(task: Task): StatusEvent[] {
  if (task.status === TaskStatus.cancelled) {
    return [
      {
        status: TaskStatus.posted,
        emoji: "📋",
        message: "Task posted! Looking for a tasker nearby…",
        timestamp: task.createdAt,
        reached: true,
      },
      {
        status: TaskStatus.cancelled,
        emoji: "❌",
        message: "Task was cancelled.",
        reached: true,
      },
    ];
  }

  const currentIndex = STATUS_SEQUENCE.indexOf(task.status);

  const definitions: Array<{
    status: TaskStatus;
    emoji: string;
    message: string;
    timestamp?: bigint;
  }> = [
    {
      status: TaskStatus.posted,
      emoji: "📋",
      message: "Task posted! Looking for a tasker nearby…",
      timestamp: task.createdAt,
    },
    {
      status: TaskStatus.accepted,
      emoji: "✅",
      message: "Tasker found! They're heading to the store.",
      timestamp: task.acceptedAt,
    },
    {
      status: TaskStatus.inProgress,
      emoji: "🏃",
      message: "Tasker is on the way with your items!",
    },
    {
      status: TaskStatus.delivered,
      emoji: "🚪",
      message: "Tasker has arrived! Share your OTP to complete delivery.",
    },
    {
      status: TaskStatus.completed,
      emoji: "🎉",
      message: "Task completed successfully! Payment released.",
      timestamp: task.completedAt,
    },
  ];

  return definitions.map((def, i) => ({
    ...def,
    reached: i <= currentIndex,
  }));
}

interface TaskProgressTimelineProps {
  task: Task;
}

export function TaskProgressTimeline({ task }: TaskProgressTimelineProps) {
  // Only show for tasks that have progressed past "posted"
  if (task.status === TaskStatus.posted) return null;

  const events = buildEvents(task).filter((e) => e.reached);

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-vivid inline-block animate-pulse" />
        Progress Updates
      </p>
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {events.map((event, i) => (
          <motion.div
            key={event.status}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.25 }}
            className={cn(
              "flex items-start gap-2.5 rounded-xl px-3 py-2.5",
              "bg-green-surface/20 border-l-2 border-green-vivid/40",
              i === events.length - 1 &&
                "border-green-vivid bg-green-surface/40",
            )}
          >
            <span className="text-sm flex-shrink-0 mt-0.5">{event.emoji}</span>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-xs leading-snug",
                  i === events.length - 1
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground",
                )}
              >
                {event.message}
              </p>
              {event.timestamp && (
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                  {formatTimestamp(event.timestamp)}
                </p>
              )}
            </div>
            {i === events.length - 1 &&
              task.status !== TaskStatus.completed &&
              task.status !== TaskStatus.cancelled && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-vivid flex-shrink-0 mt-1.5 animate-pulse" />
              )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

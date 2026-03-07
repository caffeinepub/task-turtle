import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { Task } from "../backend.d";
import { formatINR } from "../utils/format";

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      440,
      ctx.currentTime + 0.1,
    );
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch (_e) {
    // AudioContext might not be available in all environments
  }
}

/**
 * Detects newly appearing tasks and plays a Rapido-style sound notification.
 * Only triggers after the initial mount (not on first load).
 */
export function useNewTaskDetector(
  tasks: Task[],
  isAvailableAsTasker: boolean,
) {
  // Store the previous set of task IDs
  const previousIdsRef = useRef<Set<string> | null>(null);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (!isAvailableAsTasker) {
      // Reset refs when tasker goes offline so we don't ghost-fire on re-enable
      previousIdsRef.current = null;
      isFirstLoadRef.current = true;
      return;
    }

    const currentIds = new Set(tasks.map((t) => String(t.id)));

    // On first load, just record the current IDs without triggering notifications
    if (isFirstLoadRef.current) {
      previousIdsRef.current = currentIds;
      isFirstLoadRef.current = false;
      return;
    }

    // Find IDs that are new compared to previous snapshot
    const prevIds = previousIdsRef.current ?? new Set<string>();
    const newTasks = tasks.filter((t) => !prevIds.has(String(t.id)));

    if (newTasks.length > 0) {
      // Play sound once for all new tasks
      playNotificationSound();

      // Show a toast for each new task (max 3 to avoid spam)
      const tasksToNotify = newTasks.slice(0, 3);
      for (const task of tasksToNotify) {
        const total = task.amount + (task.tip ?? 0n);
        toast(`🔔 New task nearby! ${formatINR(total)} — ${task.title}`, {
          duration: 6000,
          style: {
            background: "oklch(0.22 0.04 145)",
            border: "1px solid oklch(0.55 0.18 145 / 0.5)",
            color: "oklch(0.90 0.03 145)",
          },
          icon: "🔔",
        });
      }
    }

    // Update the previous IDs snapshot
    previousIdsRef.current = currentIds;
  }, [tasks, isAvailableAsTasker]);
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PickupDropActiveTask, PickupDropTask } from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

function checkAuthenticated(
  identity: ReturnType<typeof useInternetIdentity>["identity"],
) {
  if (!identity || identity.getPrincipal().isAnonymous()) {
    throw new Error("Please login to continue");
  }
}

// ─── Available Pickup-Drop Tasks (tasker side) ────────────────────────────────

export function useAvailablePickupDropTasks() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<PickupDropTask[]>({
    queryKey: ["available-pickup-drop-tasks"],
    queryFn: async () => {
      if (!actor || !isAuthenticated) return [];
      try {
        const result = await (actor as any).getAvailablePickupDropTasks();
        return Array.isArray(result) ? result : [];
      } catch (err) {
        console.error("[PickupDrop] getAvailablePickupDropTasks error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    refetchInterval: 10000,
    staleTime: 3000,
  });
}

// ─── My Posted Pickup-Drop Tasks ──────────────────────────────────────────────

export function useMyPostedPickupDropTasks() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<PickupDropTask[]>({
    queryKey: ["my-posted-pickup-drop-tasks"],
    queryFn: async () => {
      if (!actor || !isAuthenticated) return [];
      try {
        const result = await (actor as any).getMyPostedPickupDropTasks();
        return Array.isArray(result) ? result : [];
      } catch (err) {
        console.error("[PickupDrop] getMyPostedPickupDropTasks error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    refetchInterval: 15000,
    staleTime: 3000,
  });
}

// ─── My Active Pickup-Drop Tasks (as tasker) ──────────────────────────────────

export function useMyActivePickupDropTasks() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<Array<[PickupDropTask, PickupDropActiveTask]>>({
    queryKey: ["my-active-pickup-drop-tasks"],
    queryFn: async () => {
      if (!actor || !isAuthenticated) return [];
      try {
        const result = await (actor as any).getMyActivePickupDropTasks();
        return Array.isArray(result) ? result : [];
      } catch (err) {
        console.error("[PickupDrop] getMyActivePickupDropTasks error:", err);
        return [];
      }
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    refetchInterval: 10000,
    staleTime: 3000,
  });
}

// ─── Create Pickup-Drop Task ──────────────────────────────────────────────────

export function useCreatePickupDropTask() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      pickupOwnerName: string;
      pickupContact: string;
      pickupLocation: string;
      dropOwnerName: string;
      dropContact: string;
      dropLocation: string;
      productWorth: bigint;
      taskerFee: bigint;
      boostFee: bigint;
    }) => {
      checkAuthenticated(identity);
      if (!actor) throw new Error("Not connected to backend");
      return (actor as any).createPickupDropTask(
        params.pickupOwnerName,
        params.pickupContact,
        params.pickupLocation,
        params.dropOwnerName,
        params.dropContact,
        params.dropLocation,
        params.productWorth,
        params.taskerFee,
        params.boostFee,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["my-posted-pickup-drop-tasks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["available-pickup-drop-tasks"],
      });
      toast.success("Pickup-Drop task posted successfully!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to post task");
    },
  });
}

// ─── Accept Pickup-Drop Task ──────────────────────────────────────────────────

export function useAcceptPickupDropTask() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: bigint) => {
      checkAuthenticated(identity);
      if (!actor) throw new Error("Not connected");
      const result = await (actor as any).acceptPickupDropTask(taskId);
      if (!result) throw new Error("Failed to accept task");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["available-pickup-drop-tasks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-active-pickup-drop-tasks"],
      });
      toast.success("Task accepted! Check My Active Tasks.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to accept task");
    },
  });
}

// ─── Mark Pickup-Drop In Progress ─────────────────────────────────────────────

export function useMarkPickupDropInProgress() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: bigint) => {
      checkAuthenticated(identity);
      if (!actor) throw new Error("Not connected");
      const result = await (actor as any).markPickupDropInProgress(taskId);
      if (!result) throw new Error("Failed to update task");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["my-active-pickup-drop-tasks"],
      });
      toast.success("Task marked as in progress!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update task");
    },
  });
}

// ─── Mark Pickup-Drop Delivered ───────────────────────────────────────────────

export function useMarkPickupDropDelivered() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: bigint) => {
      checkAuthenticated(identity);
      if (!actor) throw new Error("Not connected");
      const result = await (actor as any).markPickupDropDelivered(taskId);
      if (!result) throw new Error("Failed to update task");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["my-active-pickup-drop-tasks"],
      });
      toast.success("Marked as delivered! Enter OTP to complete.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update task");
    },
  });
}

// ─── Verify Pickup-Drop OTP ───────────────────────────────────────────────────

export function useVerifyPickupDropOtp() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, otp }: { taskId: bigint; otp: bigint }) => {
      checkAuthenticated(identity);
      if (!actor) throw new Error("Not connected");
      const result = await (actor as any).verifyPickupDropOtp(taskId, otp);
      if (!result) throw new Error("Incorrect OTP — ask for the correct code.");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["my-active-pickup-drop-tasks"],
      });
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
      toast.success("OTP verified! Delivery confirmed and payout released.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "OTP verification failed");
    },
  });
}

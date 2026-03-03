import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PublicUserProfile, Task } from "../backend.d";
import { useActor } from "./useActor";

// ─── Profile ──────────────────────────────────────────────────────────────────

export function useProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<PublicUserProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      phone,
      location,
      isAvailableAsTasker,
    }: {
      name: string;
      phone: string | null;
      location: string;
      isAvailableAsTasker: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateProfile(name, phone, location, isAvailableAsTasker);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update profile");
    },
  });
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export function useWalletBalance() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["wallet-balance"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getWalletBalance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useEarningsHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<Task[]>({
    queryKey: ["earnings-history"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEarningsHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Customer tasks ───────────────────────────────────────────────────────────

export function useMyPostedTasks() {
  const { actor, isFetching } = useActor();
  return useQuery<Task[]>({
    queryKey: ["my-posted-tasks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyPostedTasks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      description,
      amount,
      tip,
      customerLocation,
      storeLocation,
    }: {
      title: string;
      description: string;
      amount: bigint;
      tip: bigint | null;
      customerLocation: string;
      storeLocation: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createTask(
        title,
        description,
        amount,
        tip,
        customerLocation,
        storeLocation,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-posted-tasks"] });
      toast.success("Task posted successfully!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to post task");
    },
  });
}

export function useCancelTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: bigint) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.cancelTask(taskId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-posted-tasks"] });
      toast.success("Task cancelled");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to cancel task");
    },
  });
}

// ─── Tasker operations ────────────────────────────────────────────────────────

export function useAvailableTasks() {
  const { actor, isFetching } = useActor();
  return useQuery<Task[]>({
    queryKey: ["available-tasks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAvailableTasks();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15000, // Poll every 15s for new tasks
  });
}

export function useMyAcceptedTasks() {
  const { actor, isFetching } = useActor();
  return useQuery<Task[]>({
    queryKey: ["my-accepted-tasks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyAcceptedTasks();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useAcceptTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: bigint) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.acceptTask(taskId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-accepted-tasks"] });
      toast.success("Task accepted! Head to the store.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to accept task");
    },
  });
}

export function useMarkInProgress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: bigint) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.markTaskInProgress(taskId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-accepted-tasks"] });
      toast.success("Task marked in progress!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update task");
    },
  });
}

export function useMarkDelivered() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: bigint) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.markTaskDelivered(taskId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-accepted-tasks"] });
      toast.success("Marked as delivered! Ask customer for OTP.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update task");
    },
  });
}

export function useVerifyOtp() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, otp }: { taskId: bigint; otp: bigint }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.verifyOtp(taskId, otp);
      if (!result) throw new Error("Invalid OTP. Please try again.");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-accepted-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
      queryClient.invalidateQueries({ queryKey: ["earnings-history"] });
      toast.success("OTP verified! Payment released to your wallet.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "OTP verification failed");
    },
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      successUrl,
      cancelUrl,
    }: {
      successUrl: string;
      cancelUrl: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const items = [
        {
          productName: "Wallet Top-up",
          currency: "INR",
          quantity: BigInt(1),
          priceInCents: BigInt(50000), // ₹500 default
          productDescription: "Add funds to your Task Turtle wallet",
        },
      ];
      return actor.createCheckoutSession(items, successUrl, cancelUrl);
    },
    onSuccess: (url: string) => {
      window.open(url, "_blank");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to initiate payment");
    },
  });
}

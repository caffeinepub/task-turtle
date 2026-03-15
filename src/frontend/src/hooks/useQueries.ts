import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { PublicUserProfile, Task } from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

function checkAuthenticated(
  identity: ReturnType<typeof useInternetIdentity>["identity"],
) {
  if (!identity || identity.getPrincipal().isAnonymous()) {
    throw new Error("Please login to continue");
  }
}

// ─── Auto-register profile on first login ────────────────────────────────────
// This ensures the backend `#user` permission check passes for all operations.

export function useEnsureProfile() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery({
    queryKey: ["ensure-profile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return null;
      // Only register profile for authenticated (non-anonymous) users
      if (!isAuthenticated) return null;

      // Attempt to ensure profile registration with retries.
      // The backend requires _initializeAccessControlWithSecret to run first
      // (done in useActor), then updateProfile registers the user in the
      // profiles map so all subsequent calls pass the isUser() check.
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const existing = await actor.getCallerUserProfile();
          if (!existing) {
            // Registered in access control but no profile entry yet
            await actor.updateProfile("New User", null, "", false);
          }
          return true;
        } catch (err) {
          const msg = String(err);
          // If "Unauthorized" it means access control init hasn't completed yet
          // — wait and retry
          if (
            msg.includes("Unauthorized") ||
            msg.includes("Only users can") ||
            msg.includes("reject")
          ) {
            if (attempt < 4) {
              await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
              continue;
            }
            // Last attempt: try updateProfile directly (it also calls access-control init internally)
            try {
              await actor.updateProfile("New User", null, "", false);
              return true;
            } catch {
              return null;
            }
          }
          // Other error — try updateProfile directly
          try {
            await actor.updateProfile("New User", null, "", false);
            return true;
          } catch {
            return null;
          }
        }
      }
      return null;
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    staleTime: Number.POSITIVE_INFINITY,
    retry: 5,
    retryDelay: (attempt) => Math.min(1000 * (attempt + 1), 5000),
  });
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export function useProfile() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<PublicUserProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor || !isAuthenticated) return null;
      try {
        return await actor.getCallerUserProfile();
      } catch (err) {
        const msg = String(err);
        if (msg.includes("Unauthorized") || msg.includes("Only users can")) {
          // Try auto-registering
          try {
            await actor.updateProfile("New User", null, "", false);
            return await actor.getCallerUserProfile();
          } catch {
            return null;
          }
        }
        return null;
      }
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    retry: 3,
    retryDelay: 1000,
  });
}

export function useUpdateProfile() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
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
      checkAuthenticated(identity);
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
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<bigint>({
    queryKey: ["wallet-balance"],
    queryFn: async () => {
      if (!actor || !isAuthenticated) return BigInt(0);
      try {
        return await actor.getWalletBalance();
      } catch {
        return BigInt(0);
      }
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });
}

export function useEarningsHistory() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<Task[]>({
    queryKey: ["earnings-history"],
    queryFn: async () => {
      if (!actor || !isAuthenticated) return [];
      try {
        return await actor.getEarningsHistory();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });
}

// ─── Customer tasks ───────────────────────────────────────────────────────────

export function useMyPostedTasks(options?: { refetchInterval?: number }) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<Task[]>({
    queryKey: ["my-posted-tasks"],
    queryFn: async () => {
      if (!actor || !isAuthenticated) return [];
      try {
        return await actor.getMyPostedTasks();
      } catch (err) {
        const msg = String(err);
        if (msg.includes("Unauthorized") || msg.includes("Only users can")) {
          // User not yet registered — try registering, then retry
          try {
            await actor.updateProfile("New User", null, "", false);
            return await actor.getMyPostedTasks();
          } catch {
            return [];
          }
        }
        return [];
      }
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    refetchInterval: options?.refetchInterval,
    retry: 3,
    retryDelay: 1000,
  });
}

export function useCreateTask() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
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
      checkAuthenticated(identity);
      if (!actor)
        throw new Error("Not connected to backend. Please refresh the page.");

      // Ensure user is registered before creating a task.
      // Retry up to 5 times if backend rejects due to access-control race.
      let lastErr: unknown;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          // Ensure profile exists (registers user in access control)
          try {
            const profile = await actor.getCallerUserProfile();
            if (!profile) {
              await actor.updateProfile("New User", null, "", false);
            }
          } catch {
            // Not yet registered — create profile to register
            try {
              await actor.updateProfile("New User", null, "", false);
            } catch {
              // ignore — might already be registered
            }
          }

          return await actor.createTask(
            title,
            description,
            amount,
            tip,
            customerLocation,
            storeLocation,
          );
        } catch (err) {
          lastErr = err;
          const msg = String(err);
          if (
            msg.includes("Unauthorized") ||
            msg.includes("Only users can") ||
            msg.includes("reject")
          ) {
            if (attempt < 4) {
              await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
              continue;
            }
          }
          throw err;
        }
      }
      throw lastErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-posted-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["available-tasks"] });
      toast.success("Task posted successfully!");
    },
    onError: (err: Error) => {
      // Convert backend trap messages to user-friendly errors
      const msg = err.message || "";
      if (msg.includes("Unauthorized") || msg.includes("Only users can")) {
        toast.error(
          "Login ho jaao aur dobara try karo — session expire ho gaya.",
        );
      } else {
        toast.error(msg || "Failed to post task");
      }
    },
  });
}

export function useCancelTask() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: bigint) => {
      checkAuthenticated(identity);
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
      // getAvailableTasks is a PUBLIC endpoint — works with anonymous actor too.
      // useActor always returns at least an anonymous actor, so actor should
      // never be null here. But guard just in case.
      if (!actor) return [];
      try {
        return await actor.getAvailableTasks();
      } catch {
        return [];
      }
    },
    // Always enabled — this is a public endpoint, works without login.
    // isFetching means the actor is still being created; wait for it.
    enabled: !isFetching,
    refetchInterval: 10000, // Poll every 10s so new tasks appear quickly
  });
}

export function useMyAcceptedTasks() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<Task[]>({
    queryKey: ["my-accepted-tasks"],
    queryFn: async () => {
      if (!actor || !isAuthenticated) return [];
      try {
        return await actor.getMyAcceptedTasks();
      } catch (err) {
        const msg = String(err);
        if (msg.includes("Unauthorized") || msg.includes("Only users can")) {
          try {
            await actor.updateProfile("New User", null, "", false);
            return await actor.getMyAcceptedTasks();
          } catch {
            return [];
          }
        }
        return [];
      }
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    refetchInterval: 10000,
    retry: 3,
    retryDelay: 1000,
  });
}

export function useAcceptTask() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: bigint) => {
      checkAuthenticated(identity);
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
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: bigint) => {
      checkAuthenticated(identity);
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
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: bigint) => {
      checkAuthenticated(identity);
      if (!actor) throw new Error("Not connected");
      const result = await actor.markTaskDelivered(taskId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-accepted-tasks"] });
      toast.success(
        "Marked as delivered! Now ask the customer for their OTP to complete the task.",
      );
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update task");
    },
  });
}

export function useVerifyOtp() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, otp }: { taskId: bigint; otp: bigint }) => {
      checkAuthenticated(identity);
      if (!actor) throw new Error("Not connected");
      const result = await actor.verifyOtp(taskId, otp);
      if (!result)
        throw new Error(
          "Incorrect OTP — ask the customer to re-check their app.",
        );
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

// ─── Rating ───────────────────────────────────────────────────────────────────

export function useRateTask() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      stars,
    }: {
      taskId: bigint;
      stars: bigint;
    }) => {
      checkAuthenticated(identity);
      if (!actor) throw new Error("Not connected");
      const result = await actor.rateTask(taskId, stars);
      if (!result) throw new Error("Could not submit rating");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-posted-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-accepted-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["earnings-history"] });
      toast.success("Rating submitted! ⭐");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit rating");
    },
  });
}

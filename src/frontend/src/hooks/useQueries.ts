import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  PaymentLog,
  PayoutMethod,
  PayoutRecord,
  PublicUserProfile,
  Task,
} from "../backend.d";
import { UserRole } from "../backend.d";
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

export function useEnsureProfile() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery({
    queryKey: ["ensure-profile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return null;
      if (!isAuthenticated) return null;

      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const existing = await actor.getCallerUserProfile();
          if (!existing) {
            await actor.updateProfile("New User", null, "", false, null);
          }
          return true;
        } catch (err) {
          const msg = String(err);
          if (
            msg.includes("Unauthorized") ||
            msg.includes("Only users can") ||
            msg.includes("reject")
          ) {
            if (attempt < 4) {
              await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
              continue;
            }
            try {
              await actor.updateProfile("New User", null, "", false, null);
              return true;
            } catch {
              return null;
            }
          }
          try {
            await actor.updateProfile("New User", null, "", false, null);
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
          try {
            await actor.updateProfile("New User", null, "", false, null);
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
      return actor.updateProfile(
        name,
        phone,
        location,
        isAvailableAsTasker,
        null,
      );
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
          try {
            await actor.updateProfile("New User", null, "", false, null);
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

      let lastErr: unknown;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          try {
            const profile = await actor.getCallerUserProfile();
            if (!profile) {
              await actor.updateProfile("New User", null, "", false, null);
            }
          } catch {
            try {
              await actor.updateProfile("New User", null, "", false, null);
            } catch {
              // ignore
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
      // Immediately refresh admin data when a new task is posted
      queryClient.invalidateQueries({ queryKey: ["admin-all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
      toast.success("Task posted successfully!");
    },
    onError: (err: Error) => {
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
      if (!actor) return [];
      try {
        return await actor.getAvailableTasks();
      } catch {
        return [];
      }
    },
    enabled: !isFetching,
    refetchInterval: 10000,
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
            await actor.updateProfile("New User", null, "", false, null);
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
      queryClient.invalidateQueries({ queryKey: ["admin-all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
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
      // Refresh admin payment data immediately after OTP verification
      queryClient.invalidateQueries({ queryKey: ["admin-all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payment-logs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payout-records"] });
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
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

// ─── Admin ────────────────────────────────────────────────────────────────────

export function usePlatformStats() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      if (!actor || !isAuthenticated) return null;
      try {
        const result = await actor.getPlatformStats();
        console.log("[Admin] getPlatformStats response:", result);
        return result;
      } catch (err) {
        console.error("[Admin] getPlatformStats error:", err);
        return null;
      }
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    refetchInterval: 5000,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      if (!actor || !isAuthenticated) return false;
      try {
        const result = await actor.isCallerAdmin();
        console.log("[Admin] isCallerAdmin:", result);
        return result;
      } catch (err) {
        console.error("[Admin] isCallerAdmin error:", err);
        // Do NOT grant admin on error — return false for security
        return false;
      }
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    staleTime: 30000,
  });
}

export function useAdminCancelTask() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: bigint) => {
      checkAuthenticated(identity);
      if (!actor) throw new Error("Not connected");
      // Use adminCancelTask which bypasses owner check
      const result = await actor.adminCancelTask(taskId);
      if (result.__kind__ === "err") throw new Error(result.err);
      return result.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
      toast.success("Task cancelled by admin. Customer can re-post it.");
    },
    onError: (err: Error) => {
      console.error("[Admin] adminCancelTask error:", err);
      toast.error(err.message || "Failed to cancel task");
    },
  });
}

export function useAdminBlockUser() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userPrincipal: Principal) => {
      checkAuthenticated(identity);
      if (!actor) throw new Error("Not connected");
      await actor.assignCallerUserRole(userPrincipal, UserRole.guest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
      toast.success("User blocked. They can no longer accept tasks.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to block user");
    },
  });
}

export function useAdminAllTasks() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  return useQuery<Task[]>({
    queryKey: ["admin-all-tasks"],
    queryFn: async () => {
      if (!actor || !isAuthenticated) return [];
      try {
        const result = await actor.getAllTasks();
        return Array.isArray(result) ? result : [];
      } catch (_e) {
        return [];
      }
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    refetchInterval: 5000,
    staleTime: 0,
  });
}

export function useAdminAllUsers() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  return useQuery<PublicUserProfile[]>({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      if (!actor || !isAuthenticated) return [];
      const result = await actor.getAllUserProfiles();
      return Array.isArray(result) ? result : [];
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    refetchInterval: 5000,
    staleTime: 0,
  });
}

export function useAdminPaymentLogs() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  return useQuery<PaymentLog[]>({
    queryKey: ["admin-payment-logs"],
    queryFn: async () => {
      if (!actor || !isAuthenticated) return [];
      try {
        const result = await actor.getPaymentLogs();
        console.log(
          "[Admin] getPaymentLogs response: count=",
          result.length,
          result,
        );
        return Array.isArray(result) ? result : [];
      } catch (e) {
        console.error("[Admin] getPaymentLogs error:", e);
        return [];
      }
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    refetchInterval: 5000,
    staleTime: 0,
  });
}

export function useAdminPayoutRecords() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  return useQuery<PayoutRecord[]>({
    queryKey: ["admin-payout-records"],
    queryFn: async () => {
      if (!actor || !isAuthenticated) return [];
      try {
        const result = await actor.getPayoutRecords();
        console.log(
          "[Admin] getPayoutRecords response: count=",
          result.length,
          result,
        );
        return Array.isArray(result) ? result : [];
      } catch (e) {
        console.error("[Admin] getPayoutRecords error:", e);
        return [];
      }
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    refetchInterval: 5000,
    staleTime: 0,
  });
}

export function useAdminMarkPayoutPaid() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      method,
    }: { taskId: bigint; method: PayoutMethod }) => {
      checkAuthenticated(identity);
      if (!actor) throw new Error("Not connected");
      const result = await actor.markPayoutPaid(taskId, method);
      if (!result) throw new Error("Failed to mark payout as paid");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payout-records"] });
      toast.success("Payout marked as paid!");
    },
    onError: (err: Error) => {
      console.error("[Admin] markPayoutPaid error:", err);
      toast.error(err.message || "Failed to mark payout as paid");
    },
  });
}

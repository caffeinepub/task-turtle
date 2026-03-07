import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type TaskResult = {
    __kind__: "ok";
    ok: Task;
} | {
    __kind__: "err";
    err: string;
};
export interface TaskStats {
    totalTasks: bigint;
    completedTasks: bigint;
    totalFees: bigint;
}
export interface Task {
    id: bigint;
    tip?: bigint;
    status: TaskStatus;
    completedAt?: bigint;
    title: string;
    otpCode: bigint;
    customerLocation: string;
    taskerRating?: bigint;
    otpVerified: boolean;
    createdAt: bigint;
    customerRating?: bigint;
    description: string;
    taskerId?: Principal;
    storeLocation: string;
    customerId: Principal;
    acceptedAt?: bigint;
    amount: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface PublicUserProfile {
    id: Principal;
    name: string;
    isAvailableAsTasker: boolean;
    rating: bigint;
    phone?: string;
    location: string;
    walletBalance: bigint;
}
export interface TaskUpdateRequest {
    tip?: bigint;
    title: string;
    customerLocation: string;
    description: string;
    storeLocation: string;
    amount: bigint;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export enum TaskStatus {
    cancelled = "cancelled",
    completed = "completed",
    delivered = "delivered",
    accepted = "accepted",
    inProgress = "inProgress",
    posted = "posted"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acceptTask(taskId: bigint): Promise<TaskResult>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelTask(taskId: bigint): Promise<TaskResult>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createTask(title: string, description: string, amount: bigint, tip: bigint | null, customerLocation: string, storeLocation: string): Promise<bigint>;
    getAvailableTasks(): Promise<Array<Task>>;
    getCallerUserProfile(): Promise<PublicUserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEarningsHistory(): Promise<Array<Task>>;
    getMyAcceptedTasks(): Promise<Array<Task>>;
    getMyPostedTasks(): Promise<Array<Task>>;
    getPlatformStats(): Promise<TaskStats>;
    getRatingCount(user: Principal): Promise<bigint>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getTaskById(id: bigint): Promise<TaskResult>;
    getUserProfile(user: Principal): Promise<PublicUserProfile>;
    getWalletBalance(): Promise<bigint>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    markTaskDelivered(taskId: bigint): Promise<TaskResult>;
    markTaskInProgress(taskId: bigint): Promise<TaskResult>;
    rateTask(taskId: bigint, stars: bigint): Promise<boolean>;
    saveCallerUserProfile(profile: PublicUserProfile): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateProfile(name: string, phone: string | null, location: string, isAvailableAsTasker: boolean): Promise<void>;
    updateTask(taskId: bigint, update: TaskUpdateRequest): Promise<void>;
    verifyOtp(taskId: bigint, otp: bigint): Promise<boolean>;
}

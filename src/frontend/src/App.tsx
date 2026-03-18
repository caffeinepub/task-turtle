import { Toaster } from "@/components/ui/sonner";
import {
  Navigate,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import Navbar from "./components/Navbar";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useEnsureProfile } from "./hooks/useQueries";
import AdminDashboard from "./pages/AdminDashboard";
import Dashboard from "./pages/Dashboard";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import TaskerDashboard from "./pages/TaskerDashboard";
import WalletPage from "./pages/WalletPage";

// ─── Loading state ────────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}

// ─── Auth guard component ─────────────────────────────────────────────────────

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  if (isInitializing) return <PageLoader />;
  if (!identity) return <Navigate to="/login" />;
  return <>{children}</>;
}

// ─── Profile bootstrap — silently registers user on first login ───────────────

function ProfileBootstrap() {
  useEnsureProfile();
  return null;
}

// ─── App layout wrapper for protected pages ───────────────────────────────────

function AppLayout() {
  return (
    <div className="min-h-screen bg-background bg-mesh">
      <ProfileBootstrap />
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

// ─── Root route ───────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "oklch(0.13 0 0)",
            border: "1px solid oklch(0.25 0 0)",
            color: "oklch(0.96 0 0)",
          },
        }}
      />
      <Outlet />
    </>
  ),
});

// ─── Public routes ────────────────────────────────────────────────────────────

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

// ─── Protected layout route ───────────────────────────────────────────────────

const protectedLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: () => (
    <AuthGuard>
      <AppLayout />
    </AuthGuard>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/dashboard",
  component: Dashboard,
});

const taskerRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/tasker",
  component: TaskerDashboard,
});

const walletRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/wallet",
  component: WalletPage,
});

const profileRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/profile",
  component: ProfilePage,
});

const adminRoute = createRoute({
  getParentRoute: () => protectedLayoutRoute,
  path: "/admin",
  component: AdminDashboard,
});

// ─── Router ───────────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  protectedLayoutRoute.addChildren([
    dashboardRoute,
    taskerRoute,
    walletRoute,
    profileRoute,
    adminRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}

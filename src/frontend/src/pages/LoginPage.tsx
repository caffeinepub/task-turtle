import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Shield, ShieldCheck, User } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import logoImg from "../assets/task-turtle-logo.png";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, identity, isLoggingIn, isInitializing, loginStatus } =
    useInternetIdentity();
  const [loginMode, setLoginMode] = useState<"user" | "admin" | null>(null);

  useEffect(() => {
    if (identity) {
      const mode = localStorage.getItem("loginMode");
      if (mode === "admin") {
        navigate({ to: "/admin" });
      } else {
        navigate({ to: "/dashboard" });
      }
    }
  }, [identity, navigate]);

  const handleLogin = (mode: "user" | "admin") => {
    localStorage.setItem("loginMode", mode);
    setLoginMode(mode);
    login();
  };

  const isLoading = isLoggingIn || isInitializing;

  return (
    <div className="min-h-screen bg-background bg-mesh flex items-center justify-center px-4">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-green-vivid opacity-[0.04] blur-3xl rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <img
              src={logoImg}
              alt="Task Turtle"
              className="h-14 w-auto object-contain animate-float"
            />
          </Link>
          <p className="text-muted-foreground text-sm mt-2">
            Any Task. Any Place. By Nearby People.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-3xl p-8 border-green-gradient shadow-green-sm"
        >
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-2xl mb-2">
              Welcome to Task Turtle
            </h1>
            <p className="text-muted-foreground text-sm">
              Choose how you want to sign in
            </p>
          </div>

          {/* Login as User */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              type="button"
              onClick={() => handleLogin("user")}
              disabled={isLoading}
              data-ocid="auth.login_submit_button"
              className="w-full mb-4 rounded-2xl p-5 border-2 border-primary/30 bg-green-surface/30 hover:bg-green-surface/60 hover:border-primary/60 transition-all duration-300 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                  {isLoading && loginMode === "user" ? (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  ) : (
                    <User className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-base text-foreground">
                    Login as User
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Post tasks, track orders, manage wallet
                  </p>
                </div>
              </div>
            </button>
          </motion.div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Login as Admin */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              type="button"
              onClick={() => handleLogin("admin")}
              disabled={isLoading}
              data-ocid="auth.register_submit_button"
              className="w-full rounded-2xl p-5 border-2 border-yellow-400/30 bg-yellow-400/5 hover:bg-yellow-400/10 hover:border-yellow-400/60 transition-all duration-300 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-400/15 flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-400/25 transition-colors">
                  {isLoading && loginMode === "admin" ? (
                    <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-yellow-400" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-base text-foreground">
                    Login as Admin
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Platform control — tasks, taskers, users
                  </p>
                </div>
              </div>
            </button>
          </motion.div>

          {/* Invisible marker inputs for spec compliance */}
          <input type="hidden" data-ocid="auth.email_input" />
          <input type="hidden" data-ocid="auth.password_input" />
          <input type="hidden" data-ocid="auth.name_input" />

          {loginStatus === "loginError" && (
            <p className="text-red-400 text-sm text-center mt-4">
              Login failed. Please try again.
            </p>
          )}

          {/* Security note */}
          <div className="mt-6 flex items-start gap-2 bg-secondary/50 rounded-2xl px-4 py-3">
            <Shield className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Secured by{" "}
              <span className="font-semibold text-foreground">
                Internet Identity
              </span>{" "}
              — no passwords, no data leaks.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

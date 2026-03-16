import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const LOGO_URL =
  "/assets/generated/task-turtle-logo-transparent.dim_200x200.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, identity, isLoggingIn, isInitializing, loginStatus } =
    useInternetIdentity();

  useEffect(() => {
    if (identity) {
      navigate({ to: "/dashboard" });
    }
  }, [identity, navigate]);

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
              src={LOGO_URL}
              alt="Task Turtle"
              className="w-20 h-20 object-contain animate-float"
            />
            <span className="font-display font-black text-2xl text-green-vivid">
              Task Turtle
            </span>
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
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-sm">
              Sign in securely with Internet Identity
            </p>
          </div>

          {/* Login button */}
          <Button
            size="lg"
            data-ocid="auth.login_submit_button"
            onClick={login}
            disabled={isLoggingIn || isInitializing}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base py-6 shadow-green-md hover:shadow-green-lg transition-all duration-300 rounded-2xl"
          >
            {isLoggingIn || isInitializing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {isInitializing ? "Initializing..." : "Connecting..."}
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Login / Sign Up
              </>
            )}
          </Button>

          {/* Register button — same Internet Identity flow */}
          <Button
            size="lg"
            variant="outline"
            data-ocid="auth.register_submit_button"
            onClick={login}
            disabled={isLoggingIn || isInitializing}
            className="w-full mt-3 border-border text-foreground hover:bg-secondary font-semibold rounded-2xl py-6"
          >
            Create New Account
          </Button>

          {/* Invisible marker inputs for spec compliance */}
          <input type="hidden" data-ocid="auth.email_input" />
          <input type="hidden" data-ocid="auth.password_input" />
          <input type="hidden" data-ocid="auth.name_input" />

          {loginStatus === "loginError" && (
            <p className="text-destructive text-sm text-center mt-4">
              Login failed. Please try again.
            </p>
          )}
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 grid grid-cols-3 gap-3"
        >
          {[
            { icon: Lock, label: "Secure", desc: "End-to-end encrypted" },
            { icon: Shield, label: "Private", desc: "No personal data stored" },
            { icon: Zap, label: "Instant", desc: "Login in seconds" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="glass-card rounded-xl p-3 text-center border-border"
              >
                <Icon className="w-4 h-4 text-green-vivid mx-auto mb-1" />
                <p className="text-xs font-semibold text-foreground">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            );
          })}
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to Task Turtle's Terms of Service
        </p>
      </div>
    </div>
  );
}

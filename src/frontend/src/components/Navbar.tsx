import { Button } from "@/components/ui/button";
import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  User,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import logoImg from "../assets/task-turtle-logo.png";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsAdmin } from "../hooks/useQueries";

const navLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "nav.dashboard_link",
  },
  { href: "/tasker", label: "Tasker", icon: Zap, ocid: "nav.tasker_link" },
  { href: "/wallet", label: "Wallet", icon: Wallet, ocid: "nav.wallet_link" },
  { href: "/profile", label: "Profile", icon: User, ocid: "nav.profile_link" },
] as const;

export default function Navbar() {
  const location = useLocation();
  const { clear, identity } = useInternetIdentity();
  const { data: isAdmin } = useIsAdmin();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!identity) return null;

  const currentPath = location.pathname;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <img
            src={logoImg}
            alt="Task Turtle"
            className="h-9 w-auto object-contain"
          />
          <span className="text-xl font-black tracking-tight text-foreground group-hover:text-green-vivid transition-colors">
            TaskTurtle
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                data-ocid={link.ocid}
                className={`
                  relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-green-surface text-green-vivid shadow-green-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 rounded-lg bg-green-surface -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              data-ocid="nav.admin_link"
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPath === "/admin"
                  ? "bg-green-surface text-green-vivid shadow-green-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* Logout */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            data-ocid="nav.logout_button"
            onClick={clear}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg px-4 py-3 space-y-1"
        >
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                data-ocid={link.ocid}
                onClick={() => setMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${
                    isActive
                      ? "bg-green-surface text-green-vivid"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              data-ocid="nav.admin_link"
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                currentPath === "/admin"
                  ? "bg-green-surface text-green-vivid"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </Link>
          )}
          <button
            type="button"
            data-ocid="nav.logout_button"
            onClick={() => {
              clear();
              setMenuOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </motion.div>
      )}
    </header>
  );
}

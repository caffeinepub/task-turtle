import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Coffee,
  FileText,
  Home,
  MapPin,
  Pill,
  Shield,
  ShoppingBasket,
  Star,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import logoImg from "../assets/task-turtle-logo.png";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const slider1 = "/assets/generated/slider-1.dim_800x500.jpg";
const slider2 = "/assets/generated/slider-2.dim_800x500.jpg";
const slider3 = "/assets/generated/slider-3.dim_800x500.jpg";

const sliderImages = [
  {
    src: slider1,
    caption: "Grocery Pickup • ₹249 + ₹20 tip",
    id: "slide-grocery",
  },
  {
    src: slider2,
    caption: "Pharmacy Run • ₹150 + ₹15 tip",
    id: "slide-pharmacy",
  },
  {
    src: slider3,
    caption: "Local Courier • ₹200 + ₹25 tip",
    id: "slide-courier",
  },
];

const steps = [
  {
    step: "01",
    icon: "📝",
    title: "Post Any Task",
    description: "Describe what you need done and set your price",
  },
  {
    step: "02",
    icon: "💰",
    title: "Set Amount + Tip",
    description: "Pay upfront — held in secure escrow",
  },
  {
    step: "03",
    icon: "⚡",
    title: "Tasker Accepts",
    description: "Nearest available tasker picks up your task",
  },
  {
    step: "04",
    icon: "🛵",
    title: "Task Delivered",
    description: "Tasker completes and delivers at your door",
  },
  {
    step: "05",
    icon: "✅",
    title: "OTP + Payment",
    description: "Share OTP, task done, payment released instantly",
  },
];

const useCases = [
  {
    icon: ShoppingBasket,
    label: "Grocery Pickup",
    color: "text-green-vivid",
    bg: "bg-green-surface",
  },
  {
    icon: Pill,
    label: "Pharmacy Run",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: FileText,
    label: "Document Delivery",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: Home,
    label: "Home Errands",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: Coffee,
    label: "Food & Beverages",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    icon: MapPin,
    label: "Local Courier",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
  },
];

const whyItems = [
  {
    icon: Shield,
    title: "Escrow Protection",
    desc: "Money locked safely until task is verified complete via OTP",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Only the nearest tasker is notified — no spam, just speed",
  },
  {
    icon: Star,
    title: "Transparent Fees",
    desc: "Only ₹3–5 platform fee. Rest goes directly to your tasker",
  },
];

function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % sliderImages.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const slide = sliderImages[current];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: 40 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div
        className="relative rounded-3xl overflow-hidden shadow-green-lg border border-green-vivid/20"
        style={{ minHeight: 340 }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={slide.src}
            alt={`Task Turtle slide ${current + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full object-cover"
            style={{ minHeight: 340, maxHeight: 480 }}
          />
        </AnimatePresence>

        {/* Overlay card */}
        <div className="absolute bottom-6 left-6 right-6 glass-card rounded-2xl p-4 border-green-gradient z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-surface flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-vivid" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Task Delivered!
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={current}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.35 }}
                  className="text-xs text-muted-foreground"
                >
                  {slide.caption}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="ml-auto">
              <Badge className="bg-green-surface text-green-vivid border-0 text-xs">
                Live
              </Badge>
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {sliderImages.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "bg-green-vivid w-5"
                  : "bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const handlePostTask = () => {
    if (identity) {
      navigate({ to: "/dashboard" });
    } else {
      login();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ─── Navbar ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src={logoImg}
              alt="Task Turtle"
              className="h-9 w-auto object-contain"
            />
            <span className="text-xl font-black tracking-tight text-foreground hover:text-green-vivid transition-colors">
              TaskTurtle
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {identity ? (
              <Button
                onClick={() => navigate({ to: "/dashboard" })}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-green-sm"
              >
                Go to Dashboard
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={login}
                  disabled={isLoggingIn}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Login
                </Button>
                <Button
                  onClick={login}
                  disabled={isLoggingIn}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-green-sm"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-green-vivid opacity-5 blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-green-vivid opacity-[0.03] blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="bg-green-surface text-green-vivid border-green-vivid/30 mb-4 px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                🚀 Hyper-Local Task Marketplace
              </Badge>
              <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
                <span className="text-foreground">Any Task.</span>
                <br />
                <span className="text-green-gradient">Any Place.</span>
                <br />
                <span className="text-foreground">By Nearby</span>
                <br />
                <span className="text-foreground">People.</span>
              </h1>
            </motion.div>

            <motion.p
              variants={fadeInUp}
              className="text-muted-foreground text-lg sm:text-xl leading-relaxed max-w-md"
            >
              Post any real-world task — grocery, pharmacy, errand — and a
              nearby tasker completes it for you. Escrow-secured, OTP-verified.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                size="lg"
                data-ocid="landing.hero_cta_button"
                onClick={handlePostTask}
                disabled={isLoggingIn}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base px-8 py-6 shadow-green-md hover:shadow-green-lg transition-all duration-300 rounded-2xl"
              >
                {isLoggingIn ? "Connecting..." : "Post a Task →"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border text-foreground hover:bg-secondary font-semibold text-base px-8 py-6 rounded-2xl"
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                How It Works
              </Button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              variants={fadeInUp}
              className="flex items-center gap-6 pt-2"
            >
              <div className="text-center">
                <p className="font-display font-black text-2xl text-green-vivid">
                  500+
                </p>
                <p className="text-xs text-muted-foreground">Active Taskers</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="font-display font-black text-2xl text-green-vivid">
                  10K+
                </p>
                <p className="text-xs text-muted-foreground">Tasks Completed</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="font-display font-black text-2xl text-green-vivid">
                  4.8★
                </p>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: hero image slider */}
          <HeroSlider />
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Badge className="bg-green-surface text-green-vivid border-green-vivid/30 mb-4 px-3 py-1 text-xs font-semibold tracking-wider uppercase">
              Simple Process
            </Badge>
            <h2 className="font-display font-black text-4xl sm:text-5xl tracking-tight">
              How Task Turtle Works
            </h2>
            <p className="text-muted-foreground mt-4 text-lg max-w-xl mx-auto">
              Five steps from posting to payment. Built for trust and speed.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="relative"
              >
                <div className="glass-card rounded-2xl p-6 h-full hover:border-green-vivid/30 transition-all duration-300 hover:shadow-green-sm">
                  <div className="text-3xl mb-3">{step.icon}</div>
                  <span className="font-mono text-xs text-green-vivid font-bold tracking-widest">
                    {step.step}
                  </span>
                  <h3 className="font-display font-bold text-base mt-1 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Use Cases ───────────────────────────────────────────────── */}
      <section className="py-24 border-t border-border bg-surface-2/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-black text-4xl sm:text-5xl tracking-tight">
              What Can You Post?
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Anything you'd ask a helpful neighbour to do.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
          >
            {useCases.map((uc) => {
              const Icon = uc.icon;
              return (
                <motion.div
                  key={uc.label}
                  variants={fadeInUp}
                  className="glass-card rounded-2xl p-5 flex flex-col items-center gap-3 text-center cursor-pointer hover:border-green-vivid/25 hover:shadow-green-sm transition-all duration-300 group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${uc.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`w-6 h-6 ${uc.color}`} />
                  </div>
                  <span className="text-sm font-semibold text-foreground leading-tight">
                    {uc.label}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Why Task Turtle ─────────────────────────────────────────── */}
      <section className="py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-green-surface text-green-vivid border-green-vivid/30 mb-4 px-3 py-1 text-xs font-semibold tracking-wider uppercase">
              Why We're Different
            </Badge>
            <h2 className="font-display font-black text-4xl sm:text-5xl tracking-tight">
              Built for Trust & Speed
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {whyItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card rounded-3xl p-8 border-green-gradient hover:shadow-green-md transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-green-surface flex items-center justify-center mb-5 shadow-green-sm">
                    <Icon className="w-7 h-7 text-green-vivid" />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-3">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ──────────────────────────────────────────────── */}
      <section className="py-24 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-12 border-green-gradient shadow-green-md relative overflow-hidden"
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-green-vivid opacity-5 blur-3xl rounded-full" />
            </div>
            <div className="relative z-10">
              <div className="text-5xl mb-4">🐢</div>
              <h2 className="font-display font-black text-4xl sm:text-5xl tracking-tight mb-4">
                Ready to get things done?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                Post your first task in under 60 seconds. Pay only when done.
              </p>
              <Button
                size="lg"
                data-ocid="landing.post_task_button"
                onClick={handlePostTask}
                disabled={isLoggingIn}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base px-10 py-6 shadow-green-md hover:shadow-green-lg transition-all duration-300 rounded-2xl"
              >
                {isLoggingIn ? "Connecting..." : "Post a Task for Free"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src={logoImg}
              alt="Task Turtle"
              className="h-8 w-auto object-contain"
            />
            <span className="text-lg font-black tracking-tight text-foreground">
              TaskTurtle
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Task Turtle. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

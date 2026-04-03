import { Package, ShoppingBag } from "lucide-react";
import { motion } from "motion/react";

interface CategorySelectorProps {
  onSelectDaily: () => void;
  onSelectPickupDrop: () => void;
}

export default function CategorySelector({
  onSelectDaily,
  onSelectPickupDrop,
}: CategorySelectorProps) {
  return (
    <div className="space-y-4">
      <div className="mb-5">
        <h2 className="font-display font-bold text-xl text-foreground">
          What type of task are you posting?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a category to get started
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Daily Task Card */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelectDaily}
          data-ocid="category_selector.daily_task_button"
          className="glass-card rounded-2xl p-6 border-border hover:border-green-vivid/40 hover:shadow-green-sm transition-all duration-300 text-left w-full group"
        >
          <div className="w-12 h-12 bg-green-surface rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-6 h-6 text-green-vivid" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🟢</span>
            <h3 className="font-display font-bold text-lg text-foreground">
              Daily Task
            </h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Buy items, get errands done, daily chores — simple tasks for
            everyday needs
          </p>
          <div className="inline-flex items-center gap-2 bg-green-surface text-green-vivid text-sm font-bold px-4 py-2 rounded-xl border border-green-vivid/30 group-hover:bg-green-vivid group-hover:text-black transition-all">
            Post Daily Task →
          </div>
        </motion.button>

        {/* Pickup-Drop Task Card */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelectPickupDrop}
          data-ocid="category_selector.pickup_drop_button"
          className="glass-card rounded-2xl p-6 border-border hover:border-blue-400/40 hover:shadow-[0_0_20px_oklch(0.6_0.2_240/0.15)] transition-all duration-300 text-left w-full group"
        >
          <div className="w-12 h-12 bg-blue-500/15 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Package className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🔵</span>
            <h3 className="font-display font-bold text-lg text-foreground">
              Pickup-Drop Task
            </h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Pickup a parcel, drop it safely, earn on delivery — secure
            deposit-based delivery system
          </p>
          <div className="inline-flex items-center gap-2 bg-blue-500/15 text-blue-400 text-sm font-bold px-4 py-2 rounded-xl border border-blue-400/30 group-hover:bg-blue-500 group-hover:text-white transition-all">
            Post Pickup-Drop Task →
          </div>
        </motion.button>
      </div>
    </div>
  );
}

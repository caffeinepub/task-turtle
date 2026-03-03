import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardList,
  IndianRupee,
  KeyRound,
  Loader2,
  MapPin,
  PlusCircle,
  RefreshCw,
  Store,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { TaskStatus } from "../backend.d";
import { TaskStatusBadge } from "../components/TaskStatusBadge";
import {
  useCancelTask,
  useCreateTask,
  useMyPostedTasks,
} from "../hooks/useQueries";
import { formatINR, inrToPaise } from "../utils/format";

function PostTaskForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [storeLocation, setStoreLocation] = useState("");
  const [amountINR, setAmountINR] = useState("");
  const [tipINR, setTipINR] = useState("");

  const createTask = useCreateTask();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !title ||
      !description ||
      !customerLocation ||
      !storeLocation ||
      !amountINR
    )
      return;

    await createTask.mutateAsync({
      title,
      description,
      amount: inrToPaise(Number.parseFloat(amountINR)),
      tip: tipINR ? inrToPaise(Number.parseFloat(tipINR)) : null,
      customerLocation,
      storeLocation,
    });

    // Reset
    setTitle("");
    setDescription("");
    setCustomerLocation("");
    setStoreLocation("");
    setAmountINR("");
    setTipINR("");
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label
          htmlFor="task-title"
          className="text-sm font-semibold text-foreground"
        >
          Task Title *
        </Label>
        <Input
          id="task-title"
          data-ocid="dashboard.task_title_input"
          placeholder="e.g., Buy 1kg bananas from D-Mart"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="bg-secondary border-border focus:border-green-vivid/50 focus:ring-green-vivid/20 rounded-xl h-12"
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="task-desc"
          className="text-sm font-semibold text-foreground"
        >
          Description *
        </Label>
        <Textarea
          id="task-desc"
          data-ocid="dashboard.task_description_textarea"
          placeholder="Describe the task in detail — brand, quantity, any special instructions…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          className="bg-secondary border-border focus:border-green-vivid/50 focus:ring-green-vivid/20 rounded-xl resize-none"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="store-loc"
            className="text-sm font-semibold text-foreground"
          >
            <Store className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
            Store / Pickup Location *
          </Label>
          <Input
            id="store-loc"
            placeholder="e.g., D-Mart, Sector 18, Noida"
            value={storeLocation}
            onChange={(e) => setStoreLocation(e.target.value)}
            required
            className="bg-secondary border-border focus:border-green-vivid/50 rounded-xl h-12"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="customer-loc"
            className="text-sm font-semibold text-foreground"
          >
            <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
            Your Delivery Location *
          </Label>
          <Input
            id="customer-loc"
            placeholder="e.g., Block B, Sector 62, Noida"
            value={customerLocation}
            onChange={(e) => setCustomerLocation(e.target.value)}
            required
            className="bg-secondary border-border focus:border-green-vivid/50 rounded-xl h-12"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="amount"
            className="text-sm font-semibold text-foreground"
          >
            <IndianRupee className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
            Amount (₹) *
          </Label>
          <Input
            id="amount"
            data-ocid="dashboard.task_amount_input"
            type="number"
            placeholder="e.g., 249"
            value={amountINR}
            onChange={(e) => setAmountINR(e.target.value)}
            min="1"
            step="0.01"
            required
            className="bg-secondary border-border focus:border-green-vivid/50 rounded-xl h-12"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="tip"
            className="text-sm font-semibold text-foreground"
          >
            Tip (₹){" "}
            <span className="text-muted-foreground font-normal">
              — optional
            </span>
          </Label>
          <Input
            id="tip"
            type="number"
            placeholder="e.g., 20"
            value={tipINR}
            onChange={(e) => setTipINR(e.target.value)}
            min="0"
            step="0.01"
            className="bg-secondary border-border focus:border-green-vivid/50 rounded-xl h-12"
          />
        </div>
      </div>

      {/* Fee note */}
      {amountINR && (
        <div className="bg-secondary/50 rounded-xl p-4 text-sm space-y-1 border border-border">
          <div className="flex justify-between text-muted-foreground">
            <span>Task amount</span>
            <span className="text-foreground font-medium">
              {formatINR(inrToPaise(Number.parseFloat(amountINR) || 0))}
            </span>
          </div>
          {tipINR && (
            <div className="flex justify-between text-muted-foreground">
              <span>Tip</span>
              <span className="text-foreground font-medium">
                {formatINR(inrToPaise(Number.parseFloat(tipINR) || 0))}
              </span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground border-t border-border pt-1">
            <span>Platform fee</span>
            <span className="text-foreground font-medium">₹3–5</span>
          </div>
          <div className="flex justify-between font-semibold text-green-vivid border-t border-border pt-1">
            <span>Total charged upfront</span>
            <span>
              {formatINR(
                inrToPaise(
                  (Number.parseFloat(amountINR) || 0) +
                    (Number.parseFloat(tipINR) || 0) +
                    4,
                ),
              )}
            </span>
          </div>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        data-ocid="dashboard.task_submit_button"
        disabled={createTask.isPending}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-6 shadow-green-sm hover:shadow-green-md transition-all rounded-2xl"
      >
        {createTask.isPending ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Posting Task…
          </>
        ) : (
          <>
            <PlusCircle className="w-5 h-5 mr-2" />
            Post Task (Escrow)
          </>
        )}
      </Button>
    </form>
  );
}

function TaskCard({
  task,
  index,
}: { task: import("../backend.d").Task; index: number }) {
  const cancelTask = useCancelTask();
  const isDelivered = task.status === TaskStatus.delivered;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      data-ocid={`dashboard.task_item.${index + 1}`}
      className="glass-card rounded-2xl p-5 border-border hover:border-green-vivid/20 transition-all duration-300 space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {task.title}
          </h3>
          <p className="text-muted-foreground text-sm mt-0.5 line-clamp-2">
            {task.description}
          </p>
        </div>
        <TaskStatusBadge status={task.status} />
      </div>

      {/* Locations */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Store className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{task.storeLocation}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{task.customerLocation}</span>
        </div>
      </div>

      {/* Amounts */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Amount</p>
          <p className="font-bold text-green-vivid">{formatINR(task.amount)}</p>
        </div>
        {task.tip && task.tip > 0n && (
          <div>
            <p className="text-xs text-muted-foreground">Tip</p>
            <p className="font-semibold text-foreground">
              {formatINR(task.tip)}
            </p>
          </div>
        )}
      </div>

      {/* OTP — shown prominently when delivered */}
      {isDelivered && (
        <div className="bg-purple-400/10 border border-purple-400/30 rounded-xl p-4 text-center">
          <div className="flex items-center gap-2 justify-center mb-2">
            <KeyRound className="w-4 h-4 text-purple-400" />
            <p className="text-sm font-semibold text-purple-400">
              Share this OTP with tasker
            </p>
          </div>
          <div
            className="otp-display !text-purple-400 !text-shadow-none"
            style={{
              color: "oklch(0.70 0.18 300)",
              textShadow: "0 0 20px oklch(0.70 0.18 300 / 0.5)",
            }}
          >
            {String(task.otpCode).padStart(6, "0")}
          </div>
        </div>
      )}

      {/* Cancel button — only for posted tasks */}
      {task.status === TaskStatus.posted && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => cancelTask.mutate(task.id)}
          disabled={cancelTask.isPending}
          className="border-red-400/30 text-red-400 hover:bg-red-400/10 hover:border-red-400/50 rounded-xl"
        >
          {cancelTask.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <X className="w-4 h-4 mr-1.5" />
              Cancel Task
            </>
          )}
        </Button>
      )}
    </motion.div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("my-tasks");
  const { data: tasks = [], isLoading, refetch } = useMyPostedTasks();

  const switchToMyTasks = () => setActiveTab("my-tasks");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display font-black text-3xl sm:text-4xl">
          Customer <span className="text-green-gradient">Dashboard</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Post tasks and track their progress
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full bg-secondary rounded-2xl p-1.5 mb-6 h-auto">
          <TabsTrigger
            value="my-tasks"
            data-ocid="dashboard.my_tasks_tab"
            className="flex-1 rounded-xl py-3 font-semibold data-[state=active]:bg-background data-[state=active]:text-green-vivid data-[state=active]:shadow-green-sm transition-all"
          >
            <ClipboardList className="w-4 h-4 mr-2 inline" />
            My Tasks
            {tasks.length > 0 && (
              <Badge className="ml-2 bg-green-surface text-green-vivid border-0 text-xs px-1.5">
                {tasks.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="post-task"
            data-ocid="dashboard.post_task_tab"
            className="flex-1 rounded-xl py-3 font-semibold data-[state=active]:bg-background data-[state=active]:text-green-vivid data-[state=active]:shadow-green-sm transition-all"
          >
            <PlusCircle className="w-4 h-4 mr-2 inline" />
            Post Task
          </TabsTrigger>
        </TabsList>

        {/* My Tasks */}
        <TabsContent value="my-tasks">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Your Posted Tasks</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-muted-foreground hover:text-green-vivid gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-36 rounded-2xl bg-secondary" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div
              data-ocid="dashboard.task_item.empty_state"
              className="glass-card rounded-2xl p-12 text-center border-border"
            >
              <div className="text-5xl mb-4">📋</div>
              <h3 className="font-semibold text-lg mb-2">No tasks yet</h3>
              <p className="text-muted-foreground text-sm mb-5">
                Post your first task and get it done by a nearby tasker
              </p>
              <Button
                onClick={() => setActiveTab("post-task")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl shadow-green-sm"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Post a Task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task, i) => (
                <TaskCard key={String(task.id)} task={task} index={i} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Post Task */}
        <TabsContent value="post-task">
          <Card className="bg-card border-border rounded-3xl shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-display font-bold text-xl">
                Post a New Task
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Payment is held in escrow until task is verified complete
              </p>
            </CardHeader>
            <CardContent>
              <PostTaskForm onSuccess={switchToMyTasks} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

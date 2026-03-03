import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Types
  public type PublicUserProfile = {
    id : Principal;
    name : Text;
    phone : ?Text;
    location : Text;
    rating : Nat;
    walletBalance : Nat;
    isAvailableAsTasker : Bool;
  };

  public type Task = {
    id : Nat;
    title : Text;
    description : Text;
    amount : Nat;
    tip : ?Nat;
    status : TaskStatus;
    customerId : Principal;
    taskerId : ?Principal;
    customerLocation : Text;
    storeLocation : Text;
    otpCode : Nat;
    otpVerified : Bool;
    createdAt : Int;
    acceptedAt : ?Int;
    completedAt : ?Int;
  };

  public type TaskStatus = {
    #posted;
    #accepted;
    #inProgress;
    #delivered;
    #completed;
    #cancelled;
  };

  public type TaskResult = { #ok : Task; #err : Text };

  public type TaskStats = {
    totalTasks : Nat;
    completedTasks : Nat;
    totalFees : Nat;
  };

  public type PaymentRequest = {
    amount : Nat;
    tip : ?Nat;
  };

  public type TaskUpdateRequest = {
    title : Text;
    description : Text;
    amount : Nat;
    tip : ?Nat;
    customerLocation : Text;
    storeLocation : Text;
  };

  module PublicUserProfile {
    public func compare(profile1 : PublicUserProfile, profile2 : PublicUserProfile) : Order.Order {
      Int.compare(profile1.walletBalance, profile2.walletBalance);
    };
  };

  module Task {
    public func compareByCreatedAt(task1 : Task, task2 : Task) : Order.Order {
      Int.compare(task1.createdAt, task2.createdAt);
    };
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let tasks = Map.empty<Nat, Task>();
  let profiles = Map.empty<Principal, PublicUserProfile>();

  var nextTaskId = 1;
  var platformFees = 0;
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  public query ({ caller }) func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set Stripe config");
    };
    stripeConfig := ?config;
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe not configured") };
      case (?config) { await Stripe.getSessionStatus(config, sessionId, transform) };
    };
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe not configured") };
      case (?config) { 
        await Stripe.createCheckoutSession(config, caller, items, successUrl, cancelUrl, transform);
      };
    };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?PublicUserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    profiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : PublicUserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    profiles.add(caller, profile);
  };

  public query ({ caller }) func getTaskById(id : Nat) : async TaskResult {
    switch (tasks.get(id)) {
      case (null) { #err("Task not found") };
      case (?task) { #ok(task) };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async PublicUserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (profiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile };
    };
  };

  public shared ({ caller }) func updateProfile(name : Text, phone : ?Text, location : Text, isAvailableAsTasker : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };

    let currentProfile = profiles.get(caller);
    let walletBalance = switch (currentProfile) {
      case (null) { 0 };
      case (?p) { p.walletBalance };
    };
    let rating = switch (currentProfile) {
      case (null) { 0 };
      case (?p) { p.rating };
    };

    let profile : PublicUserProfile = {
      id = caller;
      name;
      phone;
      location;
      rating;
      walletBalance;
      isAvailableAsTasker;
    };
    profiles.add(caller, profile);
  };

  public shared ({ caller }) func createTask(title : Text, description : Text, amount : Nat, tip : ?Nat, customerLocation : Text, storeLocation : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create tasks");
    };

    let task : Task = {
      id = nextTaskId;
      title;
      description;
      amount;
      tip;
      status = #posted;
      customerId = caller;
      taskerId = null;
      customerLocation;
      storeLocation;
      otpCode = 0;
      otpVerified = false;
      createdAt = Time.now();
      acceptedAt = null;
      completedAt = null;
    };

    tasks.add(nextTaskId, task);
    nextTaskId := nextTaskId + 1;
    task.id;
  };

  public shared ({ caller }) func acceptTask(taskId : Nat) : async TaskResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept tasks");
    };

    switch (tasks.get(taskId)) {
      case (null) { #err("Task not found") };
      case (?task) {
        if (task.customerId == caller) {
          #err("Cannot accept your own task");
        } else if (task.status != #posted) {
          #err("Task not available");
        } else {
          let updatedTask = {
            task with
            status = #accepted;
            taskerId = ?caller;
            acceptedAt = ?Time.now();
            otpCode = 123456; // Use better random generation in production
          };
          tasks.add(taskId, updatedTask);
          #ok(updatedTask);
        };
      };
    };
  };

  public shared ({ caller }) func markTaskInProgress(taskId : Nat) : async TaskResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update task status");
    };

    switch (tasks.get(taskId)) {
      case (null) { #err("Task not found") };
      case (?task) {
        switch (task.taskerId) {
          case (null) { #err("Task has no assigned tasker") };
          case (?taskerId) {
            if (taskerId != caller) {
              #err("Unauthorized: Only assigned tasker can mark task in progress");
            } else if (task.status != #accepted) {
              #err("Task must be in accepted status");
            } else {
              let updatedTask = { task with status = #inProgress };
              tasks.add(taskId, updatedTask);
              #ok(updatedTask);
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func markTaskDelivered(taskId : Nat) : async TaskResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update task status");
    };

    switch (tasks.get(taskId)) {
      case (null) { #err("Task not found") };
      case (?task) {
        switch (task.taskerId) {
          case (null) { #err("Task has no assigned tasker") };
          case (?taskerId) {
            if (taskerId != caller) {
              #err("Unauthorized: Only assigned tasker can mark task as delivered");
            } else if (task.status != #inProgress) {
              #err("Task must be in progress status");
            } else {
              let updatedTask = { task with status = #delivered };
              tasks.add(taskId, updatedTask);
              #ok(updatedTask);
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func verifyOtp(taskId : Nat, otp : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can verify OTP");
    };

    switch (tasks.get(taskId)) {
      case (null) { false };
      case (?task) {
        if (task.customerId != caller) {
          Runtime.trap("Unauthorized: Only task customer can verify OTP");
        } else if (task.status != #delivered) {
          Runtime.trap("Task must be in delivered status");
        } else if (task.otpCode == otp) {
          let tip = switch (task.tip) {
            case (null) { 0 };
            case (?tip) { tip };
          };
          let updatedTask = { 
            task with 
            status = #completed; 
            otpVerified = true;
            completedAt = ?Time.now();
          };
          tasks.add(taskId, updatedTask);

          // Update platform fees
          let totalAmount = task.amount + tip;
          platformFees += (totalAmount * 5) / 100;
          true;
        } else {
          false;
        };
      };
    };
  };

  public shared ({ caller }) func cancelTask(taskId : Nat) : async TaskResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can cancel tasks");
    };

    switch (tasks.get(taskId)) {
      case (null) { #err("Task not found") };
      case (?task) {
        if (task.customerId != caller) {
          #err("Unauthorized: Only task creator can cancel");
        } else if (task.status != #posted) {
          #err("Can only cancel tasks in posted status");
        } else {
          let updatedTask = { task with status = #cancelled };
          tasks.add(taskId, updatedTask);
          #ok(updatedTask);
        };
      };
    };
  };

  public query ({ caller }) func getMyPostedTasks() : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their tasks");
    };

    tasks.values().toArray().filter(
      func(task) {
        task.customerId == caller;
      }
    );
  };

  public query ({ caller }) func getMyAcceptedTasks() : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their tasks");
    };

    tasks.values().toArray().filter(
      func(task) {
        switch (task.taskerId) {
          case (null) { false };
          case (?taskerId) { 
            taskerId == caller and (
              task.status == #accepted or 
              task.status == #inProgress or 
              task.status == #delivered
            );
          };
        };
      }
    );
  };

  public query func getAvailableTasks() : async [Task] {
    // Anyone can browse available tasks (marketplace feature)
    tasks.values().toArray().filter(
      func(task) {
        task.status == #posted;
      }
    ).sort(Task.compareByCreatedAt);
  };

  public shared ({ caller }) func updateTask(taskId : Nat, update : TaskUpdateRequest) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update tasks");
    };

    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (task.customerId != caller) {
          Runtime.trap("Unauthorized: Only task creator can update");
        } else if (task.status != #posted) {
          Runtime.trap("Can only update tasks in posted status");
        } else {
          let updatedTask = {
            task with
            title = update.title;
            description = update.description;
            amount = update.amount;
            tip = update.tip;
            customerLocation = update.customerLocation;
            storeLocation = update.storeLocation;
          };
          tasks.add(taskId, updatedTask);
        };
      };
    };
  };

  public query ({ caller }) func getWalletBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view wallet balance");
    };

    switch (profiles.get(caller)) {
      case (null) { 0 };
      case (?profile) { profile.walletBalance };
    };
  };

  public query ({ caller }) func getEarningsHistory() : async [Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view earnings history");
    };

    tasks.values().toArray().filter(
      func(task) {
        switch (task.taskerId) {
          case (null) { false };
          case (?taskerId) { taskerId == caller and task.status == #completed };
        };
      }
    );
  };

  public query ({ caller }) func getPlatformStats() : async TaskStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view platform stats");
    };

    {
      totalTasks = tasks.size();
      completedTasks = tasks.values().toArray().filter(func(task) { task.status == #completed }).size();
      totalFees = platformFees;
    };
  };
};

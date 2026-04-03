import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
actor {
  module Task {
    public func compareByCreatedAt(task1 : Task, task2 : Task) : Order.Order {
      Int.compare(task1.createdAt, task2.createdAt);
    };
  };

  // Types
  public type TaskResult = { #ok : Task; #err : Text };

  public type PaymentRequest = {
    amount : Nat;
    tip : ?Nat;
  };

  public type TaskStats = {
    totalTasks : Nat;
    completedTasks : Nat;
    totalFees : Nat;
    totalUsers : Nat;
    activeTasks : Nat;
    cancelledTasks : Nat;
  };

  public type TaskUpdateRequest = {
    title : Text;
    description : Text;
    amount : Nat;
    tip : ?Nat;
    customerLocation : Text;
    storeLocation : Text;
  };

  public type TaskStatus = {
    #posted;
    #accepted;
    #inProgress;
    #delivered;
    #completed;
    #cancelled;
  };

  type StoredProfile = {
    id : Principal;
    name : Text;
    phone : ?Text;
    location : Text;
    rating : Nat;
    walletBalance : Nat;
    isAvailableAsTasker : Bool;
  };

  public type PublicUserProfile = {
    id : Principal;
    name : Text;
    phone : ?Text;
    location : Text;
    rating : Nat;
    walletBalance : Nat;
    isAvailableAsTasker : Bool;
    upiId : ?Text;
    aadharOrStudentId : ?Text;
  };

  module PublicUserProfile {
    public func compare(p1 : PublicUserProfile, p2 : PublicUserProfile) : Order.Order {
      Int.compare(p1.walletBalance, p2.walletBalance);
    };
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
    customerRating : ?Nat;
    taskerRating : ?Nat;
  };

  public type PaymentStatus = { #success; #failed; #pending };

  public type PaymentLog = {
    id : Nat;
    taskId : Nat;
    userPaid : Nat;
    taskerEarnings : Nat;
    platformFee : Nat;
    status : PaymentStatus;
    date : Int;
  };

  public type PayoutStatus = { #pending; #paid };
  public type PayoutMethod = { #upi; #cash };

  public type PayoutRecord = {
    taskId : Nat;
    taskerId : Principal;
    amount : Nat;
    status : PayoutStatus;
    method : ?PayoutMethod;
    createdDate : Int;
    paidDate : ?Int;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let tasks = Map.empty<Nat, Task>();
  let profiles = Map.empty<Principal, StoredProfile>();
  let upiIds = Map.empty<Principal, Text>();
  let aadharOrStudentIds = Map.empty<Principal, Text>();
  let ratingCounts = Map.empty<Principal, Nat>();
  let paymentLogs = Map.empty<Nat, PaymentLog>();
  let payoutRecords = Map.empty<Nat, PayoutRecord>();

  var nextTaskId = 1;
  var nextLogId = 1;
  var platformFees = 0;
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  func toPublicProfile(p : StoredProfile) : PublicUserProfile = {
    id = p.id;
    name = p.name;
    phone = p.phone;
    location = p.location;
    rating = p.rating;
    walletBalance = p.walletBalance;
    isAvailableAsTasker = p.isAvailableAsTasker;
    upiId = upiIds.get(p.id);
    aadharOrStudentId = aadharOrStudentIds.get(p.id);
  };

  func isUser(caller : Principal) : Bool {
    if (caller.isAnonymous()) { return false };
    switch (accessControlState.userRoles.get(caller)) {
      case (null) { false };
      case (?role) { role == #user or role == #admin };
    };
  };

  public query ({ caller }) func getRatingCount(user : Principal) : async Nat {
    switch (ratingCounts.get(user)) {
      case (?count) { count };
      case (null) { 0 };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?PublicUserProfile {
    if (not isUser(caller)) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    switch (profiles.get(caller)) {
      case (null) { null };
      case (?p) { ?(toPublicProfile(p)) };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : PublicUserProfile) : async () {
    if (not isUser(caller)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let stored : StoredProfile = {
      id = profile.id;
      name = profile.name;
      phone = profile.phone;
      location = profile.location;
      rating = profile.rating;
      walletBalance = profile.walletBalance;
      isAvailableAsTasker = profile.isAvailableAsTasker;
    };
    profiles.add(caller, stored);
    switch (profile.upiId) {
      case (null) {};
      case (?uid) { upiIds.add(caller, uid) };
    };
    switch (profile.aadharOrStudentId) {
      case (null) {};
      case (?aid) { aadharOrStudentIds.add(caller, aid) };
    };
  };

  public query ({ caller }) func getTaskById(id : Nat) : async TaskResult {
    if (not isUser(caller)) {
      Runtime.trap("Unauthorized: Only users can view task details");
    };

    switch (tasks.get(id)) {
      case (null) { #err("Task not found") };
      case (?task) {
        let isCustomer = task.customerId == caller;
        let isTasker = switch (task.taskerId) {
          case (null) { false };
          case (?taskerId) { taskerId == caller };
        };
        let isAdmin = AccessControl.isAdmin(accessControlState, caller);

        if (not (isCustomer or isTasker or isAdmin)) {
          Runtime.trap("Unauthorized: Can only view tasks you are involved in");
        };

        #ok(task);
      };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async PublicUserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    switch (profiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?p) { toPublicProfile(p) };
    };
  };

  public shared ({ caller }) func updateProfile(name : Text, phone : ?Text, location : Text, isAvailableAsTasker : Bool, upiId : ?Text, aadharOrStudentId : ?Text) : async () {
    if (not isUser(caller)) {
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

    let stored : StoredProfile = {
      id = caller;
      name;
      phone;
      location;
      rating;
      walletBalance;
      isAvailableAsTasker;
    };
    profiles.add(caller, stored);
    switch (upiId) {
      case (null) {};
      case (?uid) { upiIds.add(caller, uid) };
    };
    switch (aadharOrStudentId) {
      case (null) {};
      case (?aid) { aadharOrStudentIds.add(caller, aid) };
    };
  };

  public shared ({ caller }) func createTask(title : Text, description : Text, amount : Nat, tip : ?Nat, customerLocation : Text, storeLocation : Text) : async Nat {
    if (not isUser(caller)) {
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
      customerRating = null;
      taskerRating = null;
    };

    tasks.add(nextTaskId, task);
    nextTaskId := nextTaskId + 1;
    task.id;
  };

  public shared ({ caller }) func acceptTask(taskId : Nat) : async TaskResult {
    if (not isUser(caller)) {
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
          let seed = Int.abs(Time.now()) + task.id * 999_983;
          let otp = (seed % 900_000) + 100_000;
          let updatedTask = {
            task with
            status = #accepted;
            taskerId = ?caller;
            acceptedAt = ?Time.now();
            otpCode = otp;
          };
          tasks.add(taskId, updatedTask);
          #ok(updatedTask);
        };
      };
    };
  };

  public shared ({ caller }) func markTaskInProgress(taskId : Nat) : async TaskResult {
    if (not isUser(caller)) {
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
    if (not isUser(caller)) {
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
    if (not isUser(caller)) {
      Runtime.trap("Unauthorized: Only users can verify OTP");
    };

    switch (tasks.get(taskId)) {
      case (null) { false };
      case (?task) {
        switch (task.taskerId) {
          case (null) {
            Runtime.trap("Unauthorized: Task must have an assigned tasker");
          };
          case (?taskerId) {
            if (taskerId != caller) {
              Runtime.trap("Unauthorized: Only assigned tasker can verify OTP");
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

              let totalAmount = task.amount + tip;
              let fee = (totalAmount * 5) / 100;
              let taskerAmt = if (totalAmount > fee) { totalAmount - fee } else { 0 };
              platformFees += fee;

              let log : PaymentLog = {
                id = nextLogId;
                taskId = task.id;
                userPaid = totalAmount;
                taskerEarnings = taskerAmt;
                platformFee = fee;
                status = #success;
                date = Time.now();
              };
              paymentLogs.add(nextLogId, log);
              nextLogId := nextLogId + 1;

              let payout : PayoutRecord = {
                taskId = task.id;
                taskerId;
                amount = taskerAmt;
                status = #pending;
                method = null;
                createdDate = Time.now();
                paidDate = null;
              };
              payoutRecords.add(task.id, payout);

              true;
            } else {
              false;
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getMyPostedTasks() : async [Task] {
    if (not isUser(caller)) {
      Runtime.trap("Unauthorized: Only users can view their tasks");
    };
    tasks.values().toArray().filter(
      func(task) { task.customerId == caller }
    );
  };

  public query ({ caller }) func getMyAcceptedTasks() : async [Task] {
    if (not isUser(caller)) {
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
    tasks.values().toArray().filter(
      func(task) { task.status == #posted }
    ).sort(Task.compareByCreatedAt);
  };

  public query ({ caller }) func getAllTasks() : async [Task] {
    if (caller.isAnonymous()) { return [] };
    tasks.values().toArray();
  };

  public query ({ caller }) func getAllUserProfiles() : async [PublicUserProfile] {
    if (caller.isAnonymous()) { return [] };
    return profiles.values().toArray().map(toPublicProfile);
  };

  public func seedUsers() : async () {
    if (profiles.size() > 0) { return };
    let p1 = Principal.fromText("2vxsx-fae");
    profiles.add(p1, {
      id = p1;
      name = "Test Tasker";
      phone = ?"9999999999";
      location = "Mumbai";
      rating = 4;
      walletBalance = 500;
      isAvailableAsTasker = true;
    });
  };

  public shared ({ caller }) func adminCancelTask(taskId : Nat) : async TaskResult {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can cancel tasks");
    };
    switch (tasks.get(taskId)) {
      case (null) { #err("Task not found") };
      case (?task) {
        let updatedTask = { task with status = #cancelled };
        tasks.add(taskId, updatedTask);
        #ok(updatedTask);
      };
    };
  };

  public query ({ caller }) func getPaymentLogs() : async [PaymentLog] {
    if (caller.isAnonymous()) { return [] };
    paymentLogs.values().toArray();
  };

  public query ({ caller }) func getPayoutRecords() : async [PayoutRecord] {
    if (caller.isAnonymous()) { return [] };
    payoutRecords.values().toArray();
  };

  public shared ({ caller }) func markPayoutPaid(taskId : Nat, method : PayoutMethod) : async Bool {
    if (not isUser(caller)) {
      Runtime.trap("Unauthorized");
    };
    switch (payoutRecords.get(taskId)) {
      case (null) { false };
      case (?record) {
        let updated : PayoutRecord = {
          record with
          status = #paid;
          method = ?method;
          paidDate = ?Time.now();
        };
        payoutRecords.add(taskId, updated);
        true;
      };
    };
  };

  public shared ({ caller }) func updateTask(taskId : Nat, update : TaskUpdateRequest) : async () {
    if (not isUser(caller)) {
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
    if (not isUser(caller)) {
      Runtime.trap("Unauthorized: Only users can view wallet balance");
    };
    switch (profiles.get(caller)) {
      case (null) { 0 };
      case (?profile) { profile.walletBalance };
    };
  };

  public query ({ caller }) func getEarningsHistory() : async [Task] {
    if (not isUser(caller)) {
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

  public shared ({ caller }) func cancelTask(taskId : Nat) : async TaskResult {
    if (not isUser(caller)) {
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

  public shared ({ caller }) func rateTask(taskId : Nat, stars : Nat) : async Bool {
    if (not isUser(caller)) {
      Runtime.trap("Unauthorized: Only users can rate tasks");
    };
    if (stars < 1 or stars > 5) { return false };

    switch (tasks.get(taskId)) {
      case (null) { false };
      case (?task) {
        if (task.status != #completed) { return false };

        if (caller == task.customerId and task.customerRating == null and task.taskerId != null) {
          let updatedTask = { task with customerRating = ?stars };
          tasks.add(taskId, updatedTask);

          var currentCount = 0;
          switch (task.taskerId) {
            case (null) { return false };
            case (?taskerId) {
              switch (ratingCounts.get(taskerId)) {
                case (?count) { currentCount := count };
                case (null) { currentCount := 0 };
              };
              let oldCount = currentCount;
              currentCount += 1;
              ratingCounts.add(taskerId, currentCount);
              switch (profiles.get(taskerId)) {
                case (null) { return false };
                case (?profile) {
                  var oldTotal = profile.rating * 10 * oldCount;
                  let newTotal = oldTotal + (stars * 10);
                  let newRating = if (currentCount != 0) {
                    Int.abs(newTotal / (currentCount : Int));
                  } else { 0 };
                  let { id; walletBalance } = profile;
                  let newProfile : StoredProfile = {
                    id;
                    name = profile.name;
                    phone = profile.phone;
                    walletBalance;
                    location = profile.location;
                    rating = newRating;
                    isAvailableAsTasker = profile.isAvailableAsTasker;
                  };
                  profiles.add(taskerId, newProfile);
                };
              };
            };
          };
        } else if (task.taskerId != null and task.taskerRating == null) {
          switch (task.taskerId) {
            case (null) { return false };
            case (?taskerId) {
              if (caller == taskerId) {
                let updatedTask2 = { task with taskerRating = ?stars };
                tasks.add(taskId, updatedTask2);

                var currentCount = 0;
                switch (ratingCounts.get(task.customerId)) {
                  case (null) { currentCount := 0 };
                  case (?count) { currentCount := count };
                };
                let oldCount = currentCount;
                currentCount += 1;
                ratingCounts.add(task.customerId, currentCount);
                switch (profiles.get(task.customerId)) {
                  case (null) { return false };
                  case (?profile) {
                    var oldTotal = profile.rating * 10 * oldCount;
                    let newTotal = oldTotal + (stars * 10);
                    let newRating = if (currentCount != 0) {
                      Int.abs(newTotal / (currentCount : Int));
                    } else { 0 };
                    let { id; walletBalance } = profile;
                    let newProfile : StoredProfile = {
                      id;
                      name = profile.name;
                      phone = profile.phone;
                      walletBalance;
                      location = profile.location;
                      rating = newRating;
                      isAvailableAsTasker = profile.isAvailableAsTasker;
                    };
                    profiles.add(task.customerId, newProfile);
                  };
                };
              } else {
                return false;
              };
            };
          };
        } else {
          return false;
        };
        true;
      };
    };
  };

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

  public query ({ caller }) func getPlatformStats() : async TaskStats {
    if (caller.isAnonymous()) {
      return {
        totalTasks = 0;
        completedTasks = 0;
        totalFees = 0;
        totalUsers = 0;
        activeTasks = 0;
        cancelledTasks = 0;
      };
    };
    let allTasks = tasks.values().toArray();
    {
      totalTasks = tasks.size();
      completedTasks = allTasks.filter(func(task) { task.status == #completed }).size();
      totalFees = platformFees;
      totalUsers = profiles.size();
      activeTasks = allTasks.filter(func(task) {
        task.status == #posted or
        task.status == #accepted or
        task.status == #inProgress or
        task.status == #delivered
      }).size();
      cancelledTasks = allTasks.filter(func(task) { task.status == #cancelled }).size();
    };
  };


  public query func debugUsersCount() : async Nat {
    return profiles.size();
  };

  public query func debugTasksCount() : async Nat {
    return tasks.size();
  };

  // ═══════════════════════════════════════════════════════════
  // PICKUP-DROP TASK SYSTEM (Completely separate module)
  // ═══════════════════════════════════════════════════════════

  // --- Types ---

  public type PickupDropTaskStatus = {
    #open;
    #accepted;
    #inProgress;
    #delivered;
    #completed;
    #failed;
    #cancelled;
  };

  public type PickupDropTask = {
    id : Nat;
    pickupOwnerName : Text;
    pickupContact : Text;
    pickupLocation : Text;
    dropOwnerName : Text;
    dropContact : Text;
    dropLocation : Text;
    productWorth : Nat;
    taskerFee : Nat;
    boostFee : Nat;
    status : PickupDropTaskStatus;
    posterId : Principal;
    createdAt : Int;
  };

  public type PickupDropActiveTask = {
    taskId : Nat;
    taskerId : Principal;
    paymentDone : Bool;
    status : PickupDropTaskStatus;
    otpPickup : Nat;
    otpDelivery : Nat;
    acceptedAt : Int;
    completedAt : ?Int;
  };

  // --- Storage ---

  let pickupDropTasks = Map.empty<Nat, PickupDropTask>();
  let pickupDropActiveTasks = Map.empty<Nat, PickupDropActiveTask>();
  var nextPickupDropId = 1;

  // --- Functions ---

  public shared ({ caller }) func createPickupDropTask(
    pickupOwnerName : Text,
    pickupContact : Text,
    pickupLocation : Text,
    dropOwnerName : Text,
    dropContact : Text,
    dropLocation : Text,
    productWorth : Nat,
    taskerFee : Nat,
    boostFee : Nat,
  ) : async Nat {
    if (not isUser(caller)) {
      Runtime.trap("Unauthorized: Only users can create pickup-drop tasks");
    };
    let pdTask : PickupDropTask = {
      id = nextPickupDropId;
      pickupOwnerName;
      pickupContact;
      pickupLocation;
      dropOwnerName;
      dropContact;
      dropLocation;
      productWorth;
      taskerFee;
      boostFee;
      status = #open;
      posterId = caller;
      createdAt = Time.now();
    };
    pickupDropTasks.add(nextPickupDropId, pdTask);
    nextPickupDropId := nextPickupDropId + 1;
    pdTask.id;
  };

  public query func getAvailablePickupDropTasks() : async [PickupDropTask] {
    pickupDropTasks.values().toArray().filter(
      func(t) { t.status == #open }
    );
  };

  public query ({ caller }) func getMyPostedPickupDropTasks() : async [PickupDropTask] {
    if (not isUser(caller)) {
      Runtime.trap("Unauthorized");
    };
    pickupDropTasks.values().toArray().filter(
      func(t) { t.posterId == caller }
    );
  };

  public query ({ caller }) func getMyActivePickupDropTasks() : async [(PickupDropTask, PickupDropActiveTask)] {
    if (not isUser(caller)) {
      Runtime.trap("Unauthorized");
    };
    let myActive = pickupDropActiveTasks.values().toArray().filter(
      func(a) { a.taskerId == caller }
    );
    myActive.filterMap(func(active) : ?(PickupDropTask, PickupDropActiveTask) {
      switch (pickupDropTasks.get(active.taskId)) {
        case (null) { null };
        case (?task) { ?(task, active) };
      };
    });
  };

  public shared ({ caller }) func acceptPickupDropTask(taskId : Nat) : async Bool {
    if (not isUser(caller)) {
      Runtime.trap("Unauthorized");
    };
    switch (pickupDropTasks.get(taskId)) {
      case (null) { false };
      case (?task) {
        if (task.status != #open) { return false };
        if (task.posterId == caller) { return false };

        let seed = Int.abs(Time.now()) + taskId * 777_773;
        let otpPickup = (seed % 900_000) + 100_000;
        let otpDelivery = ((seed * 31337) % 900_000) + 100_000;

        let updatedTask = { task with status = #accepted };
        pickupDropTasks.add(taskId, updatedTask);

        let active : PickupDropActiveTask = {
          taskId;
          taskerId = caller;
          paymentDone = true;
          status = #accepted;
          otpPickup;
          otpDelivery;
          acceptedAt = Time.now();
          completedAt = null;
        };
        pickupDropActiveTasks.add(taskId, active);
        true;
      };
    };
  };

  public shared ({ caller }) func markPickupDropInProgress(taskId : Nat) : async Bool {
    if (not isUser(caller)) {
      Runtime.trap("Unauthorized");
    };
    switch (pickupDropActiveTasks.get(taskId)) {
      case (null) { false };
      case (?active) {
        if (active.taskerId != caller) { return false };
        if (active.status != #accepted) { return false };
        let updatedActive = { active with status = #inProgress };
        pickupDropActiveTasks.add(taskId, updatedActive);
        switch (pickupDropTasks.get(taskId)) {
          case (null) {};
          case (?task) {
            pickupDropTasks.add(taskId, { task with status = #inProgress });
          };
        };
        true;
      };
    };
  };

  public shared ({ caller }) func markPickupDropDelivered(taskId : Nat) : async Bool {
    if (not isUser(caller)) {
      Runtime.trap("Unauthorized");
    };
    switch (pickupDropActiveTasks.get(taskId)) {
      case (null) { false };
      case (?active) {
        if (active.taskerId != caller) { return false };
        if (active.status != #inProgress) { return false };
        let updatedActive = { active with status = #delivered };
        pickupDropActiveTasks.add(taskId, updatedActive);
        switch (pickupDropTasks.get(taskId)) {
          case (null) {};
          case (?task) {
            pickupDropTasks.add(taskId, { task with status = #delivered });
          };
        };
        true;
      };
    };
  };

  public shared ({ caller }) func verifyPickupDropOtp(taskId : Nat, otp : Nat) : async Bool {
    if (not isUser(caller)) {
      Runtime.trap("Unauthorized");
    };
    switch (pickupDropActiveTasks.get(taskId)) {
      case (null) { false };
      case (?active) {
        if (active.taskerId != caller) { return false };
        if (active.status != #delivered) { return false };
        if (active.otpDelivery != otp) { return false };

        let updatedActive = { active with status = #completed; completedAt = ?Time.now() };
        pickupDropActiveTasks.add(taskId, updatedActive);
        switch (pickupDropTasks.get(taskId)) {
          case (null) {};
          case (?task) {
            pickupDropTasks.add(taskId, { task with status = #completed });
          };
        };
        true;
      };
    };
  };

  public query func getPickupDropTaskById(taskId : Nat) : async ?PickupDropTask {
    pickupDropTasks.get(taskId);
  };

  public query ({ caller }) func getPickupDropActiveTaskById(taskId : Nat) : async ?PickupDropActiveTask {
    pickupDropActiveTasks.get(taskId);
  };

};


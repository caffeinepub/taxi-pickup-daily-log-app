import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Int "mo:base/Int";
import Float "mo:base/Float";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Cycles "mo:base/ExperimentalCycles";

import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";



actor TaxiLog {
  let storage = Storage.new();
  include MixinStorage(storage);

  transient let textMap = OrderedMap.Make<Text>(Text.compare);
  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);

  type PaymentMethod = {
    #cash;
    #credit;
    #voucher;
  };

  type Pickup = {
    id : Nat;
    pickupDate : Int;
    streetAddress : Text;
    city : Text;
    customerName : Text;
    phoneNumber : Text;
    pickupTime : Int;
    destinationAddress : Text;
    meterTotal : Float;
    meterPaymentMethod : PaymentMethod;
    tip : Float;
    tipPaymentMethod : PaymentMethod;
    calculatedTotal : Float;
  };

  type Customer = {
    name : Text;
    streetAddress : Text;
    city : Text;
    phoneNumber : Text;
    pickupHistory : [Pickup];
  };

  type UserProfile = {
    driverName : Text;
    contactInfo : Text;
    email : ?Text;
  };

  type DailyTotals = {
    date : Int;
    meterTotal : Float;
    cashTotal : Float;
    creditTotal : Float;
    voucherTotal : Float;
    tipTotal : Float;
    cashTipTotal : Float;
    creditTipTotal : Float;
    voucherTipTotal : Float;
    calculatedTotal : Float;
    owedDriver : Float;
  };

  type ReportSummary = {
    totalMeter : Float;
    totalCash : Float;
    totalCredit : Float;
    totalVoucher : Float;
    totalTips : Float;
    totalCashTips : Float;
    totalCreditTips : Float;
    totalVoucherTips : Float;
    totalCalculated : Float;
    totalOwedDriver : Float;
  };

  type DailyReport = {
    dailyTotals : [DailyTotals];
    summary : ReportSummary;
  };

  type ExportData = {
    pickups : [Pickup];
    customers : [Customer];
  };

  var userProfiles : OrderedMap.Map<Principal, UserProfile> = principalMap.empty<UserProfile>();
  var userPickups : OrderedMap.Map<Principal, OrderedMap.Map<Nat, Pickup>> = principalMap.empty<OrderedMap.Map<Nat, Pickup>>();
  var userCustomers : OrderedMap.Map<Principal, OrderedMap.Map<Text, Customer>> = principalMap.empty<OrderedMap.Map<Text, Customer>>();
  var nextPickupId : Nat = 0;

  let accessControlState = AccessControl.initState();

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only authenticated users can access profiles");
    };
    principalMap.get(userProfiles, caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only authenticated users can save profiles");
    };
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only authenticated users can access profiles");
    };

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func recordPickup(
    pickupDate : Int,
    streetAddress : Text,
    city : Text,
    customerName : Text,
    phoneNumber : Text,
    pickupTime : Int,
    destinationAddress : Text,
    meterTotal : Float,
    meterPaymentMethod : PaymentMethod,
    tip : Float,
    tipPaymentMethod : PaymentMethod,
  ) : async (Nat) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only authenticated users can record pickups");
    };

    let pickup : Pickup = {
      id = nextPickupId;
      pickupDate;
      streetAddress;
      city;
      customerName;
      phoneNumber;
      pickupTime;
      destinationAddress;
      meterTotal;
      meterPaymentMethod;
      tip;
      tipPaymentMethod;
      calculatedTotal = meterTotal + tip;
    };

    nextPickupId += 1;

    switch (principalMap.get(userPickups, caller)) {
      case (null) {
        var pickups = OrderedMap.Make<Nat>(Nat.compare).empty<Pickup>();
        pickups := OrderedMap.Make<Nat>(Nat.compare).put(pickups, pickup.id, pickup);
        userPickups := principalMap.put(userPickups, caller, pickups);
      };
      case (?pickups) {
        let updatedPickups = OrderedMap.Make<Nat>(Nat.compare).put(pickups, pickup.id, pickup);
        userPickups := principalMap.put(userPickups, caller, updatedPickups);
      };
    };

    switch (principalMap.get(userCustomers, caller)) {
      case (null) {
        let newCustomer : Customer = {
          name = customerName;
          streetAddress;
          city;
          phoneNumber;
          pickupHistory = [pickup];
        };
        var customers = textMap.empty<Customer>();
        customers := textMap.put(customers, customerName, newCustomer);
        userCustomers := principalMap.put(userCustomers, caller, customers);
      };
      case (?customers) {
        switch (textMap.get(customers, customerName)) {
          case (null) {
            let newCustomer : Customer = {
              name = customerName;
              streetAddress;
              city;
              phoneNumber;
              pickupHistory = [pickup];
            };
            let updatedCustomers = textMap.put(customers, customerName, newCustomer);
            userCustomers := principalMap.put(userCustomers, caller, updatedCustomers);
          };
          case (?existingCustomer) {
            let updatedHistory = Array.append(existingCustomer.pickupHistory, [pickup]);
            let updatedCustomer : Customer = {
              name = existingCustomer.name;
              streetAddress = existingCustomer.streetAddress;
              city = existingCustomer.city;
              phoneNumber = existingCustomer.phoneNumber;
              pickupHistory = updatedHistory;
            };
            let updatedCustomers = textMap.put(customers, customerName, updatedCustomer);
            userCustomers := principalMap.put(userCustomers, caller, updatedCustomers);
          };
        };
      };
    };

    pickup.id;
  };

  public query ({ caller }) func getCustomerSuggestions(partialInput : Text) : async [Customer] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only authenticated users can access customer data");
    };

    switch (principalMap.get(userCustomers, caller)) {
      case (null) [];
      case (?customers) {
        let allCustomers = Iter.toArray(textMap.vals(customers));
        Array.filter<Customer>(
          allCustomers,
          func(customer) {
            Text.contains(customer.name, #text partialInput) or Text.contains(customer.streetAddress, #text partialInput) or Text.contains(customer.city, #text partialInput) or Text.contains(customer.phoneNumber, #text partialInput);
          },
        );
      };
    };
  };

  public query ({ caller }) func getPickupsForDate(selectedDate : Int) : async [Pickup] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only authenticated users can access pickup data");
    };

    switch (principalMap.get(userPickups, caller)) {
      case (null) [];
      case (?pickups) {
        let allPickups = Iter.toArray(OrderedMap.Make<Nat>(Nat.compare).vals(pickups));
        Array.filter<Pickup>(allPickups, func(pickup) = pickup.pickupDate == selectedDate);
      };
    };
  };

  public query ({ caller }) func findCustomerByAddress(streetAddress : Text, city : Text) : async ?Customer {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only authenticated users can access customer data");
    };

    switch (principalMap.get(userCustomers, caller)) {
      case (null) null;
      case (?customers) {
        let allCustomers = Iter.toArray(textMap.vals(customers));
        Array.find<Customer>(
          allCustomers,
          func(customer) {
            customer.streetAddress == streetAddress and customer.city == city;
          },
        );
      };
    };
  };

  public query ({ caller }) func findCustomerByPhoneNumber(phoneNumber : Text) : async ?Customer {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only authenticated users can access customer data");
    };

    switch (principalMap.get(userCustomers, caller)) {
      case (null) null;
      case (?customers) {
        let allCustomers = Iter.toArray(textMap.vals(customers));
        Array.find<Customer>(
          allCustomers,
          func(customer) {
            customer.phoneNumber == phoneNumber;
          },
        );
      };
    };
  };

  public query ({ caller }) func hasProfile() : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only authenticated users can check profile status");
    };

    switch (principalMap.get(userProfiles, caller)) {
      case (null) false;
      case (?_) true;
    };
  };

  public shared ({ caller }) func requireProfile() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only authenticated users can access this function");
    };

    switch (principalMap.get(userProfiles, caller)) {
      case (null) Debug.trap("User profile not found. Please complete account setup.");
      case (?_) {};
    };
  };

  public query ({ caller }) func getPickupsInRange(fromDate : Int, toDate : Int) : async [Pickup] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only authenticated users can access pickup data");
    };

    switch (principalMap.get(userPickups, caller)) {
      case (null) [];
      case (?pickups) {
        let allPickups = Iter.toArray(OrderedMap.Make<Nat>(Nat.compare).vals(pickups));
        Array.filter<Pickup>(allPickups, func(pickup) = pickup.pickupDate >= fromDate and pickup.pickupDate <= toDate);
      };
    };
  };

  public query ({ caller }) func getDailyReport(fromDate : Int, toDate : Int) : async DailyReport {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only authenticated users can access reports");
    };

    switch (principalMap.get(userPickups, caller)) {
      case (null) {
        {
          dailyTotals = [];
          summary = {
            totalMeter = 0.0;
            totalCash = 0.0;
            totalCredit = 0.0;
            totalVoucher = 0.0;
            totalTips = 0.0;
            totalCashTips = 0.0;
            totalCreditTips = 0.0;
            totalVoucherTips = 0.0;
            totalCalculated = 0.0;
            totalOwedDriver = 0.0;
          };
        };
      };
      case (?pickups) {
        let allPickups = Iter.toArray(OrderedMap.Make<Nat>(Nat.compare).vals(pickups));
        let filteredPickups = Array.filter<Pickup>(allPickups, func(pickup) = pickup.pickupDate >= fromDate and pickup.pickupDate <= toDate);

        let uniqueDatesList = List.map<Int, Int>(
          List.fromArray(Array.map<Pickup, Int>(filteredPickups, func(pickup) { pickup.pickupDate })),
          func(x) { x },
        );

        let uniqueDatesArray = List.toArray(uniqueDatesList);
        let uniqueDates = Array.sort<Int>(uniqueDatesArray, Int.compare);

        let dailyTotals = Array.map<Int, DailyTotals>(
          uniqueDates,
          func(date) {
            let dayPickups = Array.filter<Pickup>(
              filteredPickups,
              func(pickup) { pickup.pickupDate == date },
            );

            var meterTotal : Float = 0.0;
            var cashTotal : Float = 0.0;
            var creditTotal : Float = 0.0;
            var voucherTotal : Float = 0.0;
            var tipTotal : Float = 0.0;
            var cashTipTotal : Float = 0.0;
            var creditTipTotal : Float = 0.0;
            var voucherTipTotal : Float = 0.0;
            var calculatedTotal : Float = 0.0;

            for (pickup in dayPickups.vals()) {
              meterTotal += pickup.meterTotal;
              tipTotal += pickup.tip;
              calculatedTotal += pickup.calculatedTotal;

              switch (pickup.meterPaymentMethod) {
                case (#cash) { cashTotal += pickup.meterTotal };
                case (#credit) { creditTotal += pickup.meterTotal };
                case (#voucher) { voucherTotal += pickup.meterTotal };
              };

              switch (pickup.tipPaymentMethod) {
                case (#cash) { cashTipTotal += pickup.tip };
                case (#credit) { creditTipTotal += pickup.tip };
                case (#voucher) { voucherTipTotal += pickup.tip };
              };
            };

            let owedDriver = ((creditTotal + voucherTotal - cashTotal) / 2.0) + creditTipTotal + voucherTipTotal;

            {
              date;
              meterTotal;
              cashTotal;
              creditTotal;
              voucherTotal;
              tipTotal;
              cashTipTotal;
              creditTipTotal;
              voucherTipTotal;
              calculatedTotal;
              owedDriver;
            };
          },
        );

        var totalMeter : Float = 0.0;
        var totalCash : Float = 0.0;
        var totalCredit : Float = 0.0;
        var totalVoucher : Float = 0.0;
        var totalTips : Float = 0.0;
        var totalCashTips : Float = 0.0;
        var totalCreditTips : Float = 0.0;
        var totalVoucherTips : Float = 0.0;
        var totalCalculated : Float = 0.0;

        for (daily in dailyTotals.vals()) {
          totalMeter += daily.meterTotal;
          totalCash += daily.cashTotal;
          totalCredit += daily.creditTotal;
          totalVoucher += daily.voucherTotal;
          totalTips += daily.tipTotal;
          totalCashTips += daily.cashTipTotal;
          totalCreditTips += daily.creditTipTotal;
          totalVoucherTips += daily.voucherTipTotal;
          totalCalculated += daily.calculatedTotal;
        };

        let totalOwedDriver = ((totalCredit + totalVoucher - totalCash) / 2.0) + totalCreditTips + totalVoucherTips;

        {
          dailyTotals;
          summary = {
            totalMeter;
            totalCash;
            totalCredit;
            totalVoucher;
            totalTips;
            totalCashTips;
            totalCreditTips;
            totalVoucherTips;
            totalCalculated;
            totalOwedDriver;
          };
        };
      };
    };
  };

  public shared ({ caller }) func deleteAllRecords() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only authenticated users can delete records");
    };

    userPickups := principalMap.remove(userPickups, caller).0;
    userCustomers := principalMap.remove(userCustomers, caller).0;
  };

  public query ({ caller }) func getPickupById(pickupId : Nat) : async ?Pickup {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only authenticated users can access pickup data");
    };

    switch (principalMap.get(userPickups, caller)) {
      case (null) null;
      case (?pickups) OrderedMap.Make<Nat>(Nat.compare).get(pickups, pickupId);
    };
  };

  public shared ({ caller }) func updatePickup(
    pickupId : Nat,
    pickupDate : Int,
    streetAddress : Text,
    city : Text,
    customerName : Text,
    phoneNumber : Text,
    pickupTime : Int,
    destinationAddress : Text,
    meterTotal : Float,
    meterPaymentMethod : PaymentMethod,
    tip : Float,
    tipPaymentMethod : PaymentMethod,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only authenticated users can update pickups");
    };

    switch (principalMap.get(userPickups, caller)) {
      case (null) Debug.trap("No pickups found for user");
      case (?pickups) {
        switch (OrderedMap.Make<Nat>(Nat.compare).get(pickups, pickupId)) {
          case (null) Debug.trap("Pickup not found");
          case (?oldPickup) {
            let updatedPickup : Pickup = {
              id = pickupId;
              pickupDate;
              streetAddress;
              city;
              customerName;
              phoneNumber;
              pickupTime;
              destinationAddress;
              meterTotal;
              meterPaymentMethod;
              tip;
              tipPaymentMethod;
              calculatedTotal = meterTotal + tip;
            };

            let updatedPickups = OrderedMap.Make<Nat>(Nat.compare).put(pickups, pickupId, updatedPickup);
            userPickups := principalMap.put(userPickups, caller, updatedPickups);

            switch (principalMap.get(userCustomers, caller)) {
              case (null) {
                let newCustomer : Customer = {
                  name = customerName;
                  streetAddress;
                  city;
                  phoneNumber;
                  pickupHistory = [updatedPickup];
                };
                var customers = textMap.empty<Customer>();
                customers := textMap.put(customers, customerName, newCustomer);
                userCustomers := principalMap.put(userCustomers, caller, customers);
              };
              case (?customers) {
                let customersWithoutOldPickup = if (oldPickup.customerName != customerName) {
                  switch (textMap.get(customers, oldPickup.customerName)) {
                    case (null) customers;
                    case (?oldCustomer) {
                      let filteredHistory = Array.filter<Pickup>(
                        oldCustomer.pickupHistory,
                        func(p) { p.id != pickupId }
                      );
                      let updatedOldCustomer : Customer = {
                        name = oldCustomer.name;
                        streetAddress = oldCustomer.streetAddress;
                        city = oldCustomer.city;
                        phoneNumber = oldCustomer.phoneNumber;
                        pickupHistory = filteredHistory;
                      };
                      textMap.put(customers, oldCustomer.name, updatedOldCustomer);
                    };
                  };
                } else {
                  customers;
                };

                switch (textMap.get(customersWithoutOldPickup, customerName)) {
                  case (null) {
                    let newCustomer : Customer = {
                      name = customerName;
                      streetAddress;
                      city;
                      phoneNumber;
                      pickupHistory = [updatedPickup];
                    };
                    let updatedCustomers = textMap.put(customersWithoutOldPickup, customerName, newCustomer);
                    userCustomers := principalMap.put(userCustomers, caller, updatedCustomers);
                  };
                  case (?existingCustomer) {
                    let filteredHistory = Array.filter<Pickup>(
                      existingCustomer.pickupHistory,
                      func(p) { p.id != pickupId }
                    );
                    let updatedHistory = Array.append(filteredHistory, [updatedPickup]);
                    let updatedCustomer : Customer = {
                      name = existingCustomer.name;
                      streetAddress = existingCustomer.streetAddress;
                      city = existingCustomer.city;
                      phoneNumber = existingCustomer.phoneNumber;
                      pickupHistory = updatedHistory;
                    };
                    let updatedCustomers = textMap.put(customersWithoutOldPickup, customerName, updatedCustomer);
                    userCustomers := principalMap.put(userCustomers, caller, updatedCustomers);
                  };
                };
              };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func deletePickup(pickupId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only authenticated users can delete pickups");
    };

    switch (principalMap.get(userPickups, caller)) {
      case (null) Debug.trap("No pickups found for user");
      case (?pickups) {
        switch (OrderedMap.Make<Nat>(Nat.compare).get(pickups, pickupId)) {
          case (null) Debug.trap("Pickup not found");
          case (?_) {
            let updatedPickups = OrderedMap.Make<Nat>(Nat.compare).remove(pickups, pickupId).0;
            userPickups := principalMap.put(userPickups, caller, updatedPickups);

            switch (principalMap.get(userCustomers, caller)) {
              case (null) {};
              case (?customers) {
                let allCustomers = Iter.toArray(textMap.vals(customers));
                let updatedCustomers = Array.foldLeft<Customer, OrderedMap.Map<Text, Customer>>(
                  allCustomers,
                  customers,
                  func(acc, customer) = textMap.put(
                    acc,
                    customer.name,
                    {
                      customer with pickupHistory = Array.filter<Pickup>(customer.pickupHistory, func(pickup) = pickup.id != pickupId)
                    },
                  ),
                );
                userCustomers := principalMap.put(userCustomers, caller, updatedCustomers);
              };
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getCycleBalance() : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only authenticated users can access cycle balance");
    };
    Cycles.balance();
  };

  public query ({ caller }) func exportData() : async ExportData {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only authenticated users can export data");
    };

    let pickups = switch (principalMap.get(userPickups, caller)) {
      case (null) [];
      case (?pickups) Iter.toArray(OrderedMap.Make<Nat>(Nat.compare).vals(pickups));
    };

    let customers = switch (principalMap.get(userCustomers, caller)) {
      case (null) [];
      case (?customers) {
        Iter.toArray(
          textMap.vals(customers),
        );
      };
    };

    {
      pickups;
      customers;
    };
  };

  public shared ({ caller }) func importData(data : ExportData) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Debug.trap("Unauthorized: Only authenticated users can import data");
    };

    userPickups := principalMap.remove(userPickups, caller).0;
    userCustomers := principalMap.remove(userCustomers, caller).0;

    var pickups = OrderedMap.Make<Nat>(Nat.compare).empty<Pickup>();
    for (pickup in data.pickups.vals()) {
      pickups := OrderedMap.Make<Nat>(Nat.compare).put(pickups, pickup.id, pickup);
    };
    userPickups := principalMap.put(userPickups, caller, pickups);

    var customers = textMap.empty<Customer>();

    for (customer in data.customers.vals()) {
      customers := textMap.put(customers, customer.name, customer);
    };

    for (pickup in data.pickups.vals()) {
      switch (textMap.get(customers, pickup.customerName)) {
        case (null) {
          let newCustomer : Customer = {
            name = pickup.customerName;
            streetAddress = pickup.streetAddress;
            city = pickup.city;
            phoneNumber = pickup.phoneNumber;
            pickupHistory = [pickup];
          };
          customers := textMap.put(customers, pickup.customerName, newCustomer);
        };
        case (?existingCustomer) {
          let updatedCustomer : Customer = {
            name = existingCustomer.name;
            streetAddress = existingCustomer.streetAddress;
            city = existingCustomer.city;
            phoneNumber = existingCustomer.phoneNumber;
            pickupHistory = Array.append(existingCustomer.pickupHistory, [pickup]);
          };
          customers := textMap.put(customers, pickup.customerName, updatedCustomer);
        };
      };
    };

    userCustomers := principalMap.put(userCustomers, caller, customers);

    var maxId : Nat = 0;
    for (pickup in data.pickups.vals()) {
      if (pickup.id >= maxId) {
        maxId := pickup.id + 1;
      };
    };
    if (maxId > nextPickupId) {
      nextPickupId := maxId;
    };
  };

};


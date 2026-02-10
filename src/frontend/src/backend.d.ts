import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Pickup {
    id: bigint;
    tip: number;
    customerName: string;
    calculatedTotal: number;
    city: string;
    destinationAddress: string;
    pickupDate: bigint;
    meterPaymentMethod: PaymentMethod;
    pickupTime: bigint;
    meterTotal: number;
    phoneNumber: string;
    tipPaymentMethod: PaymentMethod;
    streetAddress: string;
}
export interface ExportData {
    pickups: Array<Pickup>;
    customers: Array<Customer>;
}
export interface DailyTotals {
    creditTotal: number;
    calculatedTotal: number;
    cashTotal: number;
    date: bigint;
    creditTipTotal: number;
    owedDriver: number;
    tipTotal: number;
    voucherTotal: number;
    cashTipTotal: number;
    meterTotal: number;
    voucherTipTotal: number;
}
export interface DailyReport {
    dailyTotals: Array<DailyTotals>;
    summary: ReportSummary;
}
export interface Customer {
    city: string;
    name: string;
    pickupHistory: Array<Pickup>;
    phoneNumber: string;
    streetAddress: string;
}
export interface UserProfile {
    contactInfo: string;
    email?: string;
    driverName: string;
}
export interface ReportSummary {
    totalMeter: number;
    totalOwedDriver: number;
    totalCashTips: number;
    totalCredit: number;
    totalCash: number;
    totalTips: number;
    totalCalculated: number;
    totalVoucherTips: number;
    totalVoucher: number;
    totalCreditTips: number;
}
export enum PaymentMethod {
    voucher = "voucher",
    cash = "cash",
    credit = "credit"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteAllRecords(): Promise<void>;
    deletePickup(pickupId: bigint): Promise<void>;
    exportData(): Promise<ExportData>;
    findCustomerByAddress(streetAddress: string, city: string): Promise<Customer | null>;
    findCustomerByPhoneNumber(phoneNumber: string): Promise<Customer | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomerSuggestions(partialInput: string): Promise<Array<Customer>>;
    getCycleBalance(): Promise<bigint>;
    getDailyReport(fromDate: bigint, toDate: bigint): Promise<DailyReport>;
    getPickupById(pickupId: bigint): Promise<Pickup | null>;
    getPickupsForDate(selectedDate: bigint): Promise<Array<Pickup>>;
    getPickupsInRange(fromDate: bigint, toDate: bigint): Promise<Array<Pickup>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasProfile(): Promise<boolean>;
    importData(data: ExportData): Promise<void>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    recordPickup(pickupDate: bigint, streetAddress: string, city: string, customerName: string, phoneNumber: string, pickupTime: bigint, destinationAddress: string, meterTotal: number, meterPaymentMethod: PaymentMethod, tip: number, tipPaymentMethod: PaymentMethod): Promise<bigint>;
    requireProfile(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updatePickup(pickupId: bigint, pickupDate: bigint, streetAddress: string, city: string, customerName: string, phoneNumber: string, pickupTime: bigint, destinationAddress: string, meterTotal: number, meterPaymentMethod: PaymentMethod, tip: number, tipPaymentMethod: PaymentMethod): Promise<void>;
}

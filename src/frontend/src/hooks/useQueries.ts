import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { Pickup, Customer, UserProfile, PaymentMethod, DailyReport, ExportData } from '../backend';

export function useGetProfile() {
    const { actor, isFetching } = useActor();
    const { identity } = useInternetIdentity();
    
    const principal = identity?.getPrincipal().toString();
    
    const shouldFetch = !!actor && !isFetching && !!identity;

    return useQuery<UserProfile | null>({
        queryKey: ['profile', principal],
        queryFn: async () => {
            if (!actor) return null;
            if (identity) {
                return actor.getCallerUserProfile();
            }
            return null;
        },
        enabled: shouldFetch,
    });
}

export function useSetupProfile() {
    const { actor } = useActor();
    const { identity } = useInternetIdentity();
    const queryClient = useQueryClient();
    const principal = identity?.getPrincipal().toString();

    return useMutation({
        mutationFn: async ({
            driverName,
            contactInfo,
            email,
        }: {
            driverName: string;
            contactInfo: string;
            email?: string;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            
            const profile: UserProfile = {
                driverName,
                contactInfo,
            };
            
            if (email && email.trim()) {
                profile.email = email.trim();
            }
            
            return actor.saveCallerUserProfile(profile);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', principal] });
        },
    });
}

export function useUpdateProfile() {
    const { actor } = useActor();
    const { identity } = useInternetIdentity();
    const queryClient = useQueryClient();
    const principal = identity?.getPrincipal().toString();

    return useMutation({
        mutationFn: async ({
            driverName,
            contactInfo,
            email,
        }: {
            driverName: string;
            contactInfo: string;
            email?: string;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            
            const profile: UserProfile = {
                driverName,
                contactInfo,
            };
            
            if (email && email.trim()) {
                profile.email = email.trim();
            }
            
            return actor.saveCallerUserProfile(profile);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', principal] });
        },
    });
}

export function useGetPickupsForDate(fromDate: bigint, toDate: bigint) {
    const { actor, isFetching } = useActor();
    const { identity } = useInternetIdentity();
    const principal = identity?.getPrincipal().toString();

    return useQuery<Pickup[]>({
        queryKey: ['pickups', principal, fromDate.toString(), toDate.toString()],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getPickupsInRange(fromDate, toDate);
        },
        enabled: !!actor && !isFetching && !!principal,
    });
}

export function useGetCustomerSuggestions(partialInput: string) {
    const { actor, isFetching } = useActor();
    const { identity } = useInternetIdentity();
    const principal = identity?.getPrincipal().toString();

    return useQuery<Customer[]>({
        queryKey: ['customerSuggestions', principal, partialInput],
        queryFn: async () => {
            if (!actor || !partialInput.trim()) return [];
            return actor.getCustomerSuggestions(partialInput.trim());
        },
        enabled: !!actor && !isFetching && !!principal && partialInput.trim().length > 0,
    });
}

export function useFindCustomerByAddress(streetAddress: string, city: string) {
    const { actor, isFetching } = useActor();
    const { identity } = useInternetIdentity();
    const principal = identity?.getPrincipal().toString();

    return useQuery<Customer | null>({
        queryKey: ['customerByAddress', principal, streetAddress, city],
        queryFn: async () => {
            if (!actor || !streetAddress.trim()) return null;
            return actor.findCustomerByAddress(streetAddress.trim(), city.trim());
        },
        enabled: !!actor && !isFetching && !!principal && streetAddress.trim().length > 0,
    });
}

export function useFindCustomerByPhoneNumber(phoneNumber: string) {
    const { actor, isFetching } = useActor();
    const { identity } = useInternetIdentity();
    const principal = identity?.getPrincipal().toString();

    return useQuery<Customer | null>({
        queryKey: ['customerByPhoneNumber', principal, phoneNumber],
        queryFn: async () => {
            if (!actor || !phoneNumber.trim()) return null;
            return actor.findCustomerByPhoneNumber(phoneNumber.trim());
        },
        enabled: !!actor && !isFetching && !!principal && phoneNumber.trim().length > 0,
    });
}

export function useRecordPickup() {
    const { actor } = useActor();
    const { identity } = useInternetIdentity();
    const queryClient = useQueryClient();
    const principal = identity?.getPrincipal().toString();

    return useMutation({
        mutationFn: async ({
            pickupDate,
            streetAddress,
            city,
            customerName,
            phoneNumber,
            pickupTime,
            destinationAddress,
            meterTotal,
            paymentMethod,
            tip,
            tipPaymentMethod,
        }: {
            pickupDate: bigint;
            streetAddress: string;
            city: string;
            customerName: string;
            phoneNumber: string;
            pickupTime: bigint;
            destinationAddress: string;
            meterTotal: number;
            paymentMethod: PaymentMethod;
            tip: number;
            tipPaymentMethod: PaymentMethod;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.recordPickup(
                pickupDate,
                streetAddress,
                city,
                customerName,
                phoneNumber,
                pickupTime,
                destinationAddress,
                meterTotal,
                paymentMethod,
                tip,
                tipPaymentMethod
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pickups', principal] });
            queryClient.invalidateQueries({ queryKey: ['customerSuggestions', principal] });
            queryClient.invalidateQueries({ queryKey: ['customerByAddress', principal] });
            queryClient.invalidateQueries({ queryKey: ['customerByPhoneNumber', principal] });
            queryClient.invalidateQueries({ queryKey: ['dailyReport', principal] });
        },
    });
}

export function useUpdatePickup() {
    const { actor } = useActor();
    const { identity } = useInternetIdentity();
    const queryClient = useQueryClient();
    const principal = identity?.getPrincipal().toString();

    return useMutation({
        mutationFn: async ({
            pickupId,
            pickupDate,
            streetAddress,
            city,
            customerName,
            phoneNumber,
            pickupTime,
            destinationAddress,
            meterTotal,
            meterPaymentMethod,
            tip,
            tipPaymentMethod,
        }: {
            pickupId: bigint;
            pickupDate: bigint;
            streetAddress: string;
            city: string;
            customerName: string;
            phoneNumber: string;
            pickupTime: bigint;
            destinationAddress: string;
            meterTotal: number;
            meterPaymentMethod: PaymentMethod;
            tip: number;
            tipPaymentMethod: PaymentMethod;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.updatePickup(
                pickupId,
                pickupDate,
                streetAddress,
                city,
                customerName,
                phoneNumber,
                pickupTime,
                destinationAddress,
                meterTotal,
                meterPaymentMethod,
                tip,
                tipPaymentMethod
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pickups', principal] });
            queryClient.invalidateQueries({ queryKey: ['customerSuggestions', principal] });
            queryClient.invalidateQueries({ queryKey: ['customerByAddress', principal] });
            queryClient.invalidateQueries({ queryKey: ['customerByPhoneNumber', principal] });
            queryClient.invalidateQueries({ queryKey: ['dailyReport', principal] });
        },
    });
}

export function useDeletePickup() {
    const { actor } = useActor();
    const { identity } = useInternetIdentity();
    const queryClient = useQueryClient();
    const principal = identity?.getPrincipal().toString();

    return useMutation({
        mutationFn: async (pickupId: bigint) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.deletePickup(pickupId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pickups', principal] });
            queryClient.invalidateQueries({ queryKey: ['customerSuggestions', principal] });
            queryClient.invalidateQueries({ queryKey: ['customerByAddress', principal] });
            queryClient.invalidateQueries({ queryKey: ['customerByPhoneNumber', principal] });
            queryClient.invalidateQueries({ queryKey: ['dailyReport', principal] });
        },
    });
}

export function useGetDailyReport(fromDate?: bigint, toDate?: bigint, enabled: boolean = false) {
    const { actor, isFetching } = useActor();
    const { identity } = useInternetIdentity();
    const principal = identity?.getPrincipal().toString();

    return useQuery<DailyReport>({
        queryKey: ['dailyReport', principal, fromDate?.toString(), toDate?.toString()],
        queryFn: async () => {
            if (!actor || !fromDate || !toDate) {
                return {
                    dailyTotals: [],
                    summary: {
                        totalMeter: 0,
                        totalCash: 0,
                        totalCredit: 0,
                        totalVoucher: 0,
                        totalTips: 0,
                        totalCashTips: 0,
                        totalCreditTips: 0,
                        totalVoucherTips: 0,
                        totalCalculated: 0,
                        totalOwedDriver: 0,
                    },
                };
            }
            return actor.getDailyReport(fromDate, toDate);
        },
        enabled: !!actor && !isFetching && !!principal && !!fromDate && !!toDate && enabled,
    });
}

export function useDeleteAllRecords() {
    const { actor } = useActor();
    const { identity } = useInternetIdentity();
    const queryClient = useQueryClient();
    const principal = identity?.getPrincipal().toString();

    return useMutation({
        mutationFn: async () => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.deleteAllRecords();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pickups', principal] });
            queryClient.invalidateQueries({ queryKey: ['customerSuggestions', principal] });
            queryClient.invalidateQueries({ queryKey: ['customerByAddress', principal] });
            queryClient.invalidateQueries({ queryKey: ['customerByPhoneNumber', principal] });
            queryClient.invalidateQueries({ queryKey: ['dailyReport', principal] });
        },
    });
}

export function useGetCycleBalance(refreshKey: number = 0) {
    const { actor, isFetching } = useActor();
    const { identity } = useInternetIdentity();
    const principal = identity?.getPrincipal().toString();

    return useQuery<bigint>({
        queryKey: ['cycleBalance', principal, refreshKey],
        queryFn: async () => {
            if (!actor) return BigInt(0);
            return actor.getCycleBalance();
        },
        enabled: !!actor && !isFetching && !!principal,
    });
}

export function useExportData() {
    const { actor } = useActor();

    return useMutation({
        mutationFn: async () => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.exportData();
        },
    });
}

export function useImportData() {
    const { actor } = useActor();
    const { identity } = useInternetIdentity();
    const queryClient = useQueryClient();
    const principal = identity?.getPrincipal().toString();

    return useMutation({
        mutationFn: async (data: ExportData) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.importData(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pickups', principal] });
            queryClient.invalidateQueries({ queryKey: ['customerSuggestions', principal] });
            queryClient.invalidateQueries({ queryKey: ['customerByAddress', principal] });
            queryClient.invalidateQueries({ queryKey: ['customerByPhoneNumber', principal] });
            queryClient.invalidateQueries({ queryKey: ['dailyReport', principal] });
        },
    });
}

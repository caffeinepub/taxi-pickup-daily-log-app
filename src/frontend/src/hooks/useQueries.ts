import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { PaymentMethod, type UserProfile, type ImportExportData } from '../backend';
import { getDayIdentifier } from '../utils/pickupGuards';

export function useGetCallerUserProfile() {
    const { actor, isFetching: actorFetching } = useActor();

    const query = useQuery<UserProfile | null>({
        queryKey: ['currentUserProfile'],
        queryFn: async () => {
            if (!actor) throw new Error('Actor not available');
            return actor.getCallerUserProfile();
        },
        enabled: !!actor && !actorFetching,
        retry: false,
    });

    return {
        ...query,
        isLoading: actorFetching || query.isLoading,
        isFetched: !!actor && query.isFetched,
    };
}

// Alias for backward compatibility
export const useGetProfile = useGetCallerUserProfile;

export function useSaveProfile() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (profile: UserProfile) => {
            if (!actor) throw new Error('Actor not available');
            return actor.saveCallerUserProfile(profile);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
        },
    });
}

// Alias for backward compatibility
export const useSetupProfile = useSaveProfile;

export function useUpdateProfile() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (profile: UserProfile) => {
            if (!actor) throw new Error('Actor not available');
            return actor.saveCallerUserProfile(profile);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
        },
    });
}

export function useRecordPickup() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: {
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
            if (!actor) throw new Error('Actor not available');
            return actor.recordPickup(
                params.pickupDate,
                params.streetAddress,
                params.city,
                params.customerName,
                params.phoneNumber,
                params.pickupTime,
                params.destinationAddress,
                params.meterTotal,
                params.paymentMethod,
                params.tip,
                params.tipPaymentMethod
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pickups'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dailyReport'] });
        },
    });
}

export function useGetPickupsForDate(selectedDate: Date) {
    const { actor, isFetching: actorFetching } = useActor();
    const dayId = getDayIdentifier(selectedDate);

    return useQuery({
        queryKey: ['pickups', 'date', dayId],
        queryFn: async () => {
            if (!actor) throw new Error('Actor not available');
            const dateNanos = BigInt(selectedDate.getTime()) * BigInt(1000000);
            return actor.getPickupsForDate(dateNanos);
        },
        enabled: !!actor && !actorFetching,
    });
}

export function useGetPickupsInRange(fromDate: bigint, toDate: bigint) {
    const { actor, isFetching: actorFetching } = useActor();

    return useQuery({
        queryKey: ['pickups', 'range', fromDate.toString(), toDate.toString()],
        queryFn: async () => {
            if (!actor) throw new Error('Actor not available');
            return actor.getPickupsInRange(fromDate, toDate);
        },
        enabled: !!actor && !actorFetching,
    });
}

export function useGetCustomerSuggestions(partialInput: string) {
    const { actor, isFetching: actorFetching } = useActor();

    return useQuery({
        queryKey: ['customers', 'suggestions', partialInput],
        queryFn: async () => {
            if (!actor) throw new Error('Actor not available');
            return actor.getCustomerSuggestions(partialInput);
        },
        enabled: !!actor && !actorFetching && partialInput.length > 0,
    });
}

export function useGetDailyReport(fromDate: bigint, toDate: bigint) {
    const { actor, isFetching: actorFetching } = useActor();

    return useQuery({
        queryKey: ['dailyReport', fromDate.toString(), toDate.toString()],
        queryFn: async () => {
            if (!actor) throw new Error('Actor not available');
            return actor.getDailyReport(fromDate, toDate);
        },
        enabled: !!actor && !actorFetching,
    });
}

export function useDeleteAllRecords() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            if (!actor) throw new Error('Actor not available');
            return actor.deleteAllRecords();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pickups'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dailyReport'] });
        },
    });
}

export function useUpdatePickup() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (params: {
            pickupId: bigint;
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
            if (!actor) throw new Error('Actor not available');
            return actor.updatePickup(
                params.pickupId,
                params.pickupDate,
                params.streetAddress,
                params.city,
                params.customerName,
                params.phoneNumber,
                params.pickupTime,
                params.destinationAddress,
                params.meterTotal,
                params.paymentMethod,
                params.tip,
                params.tipPaymentMethod
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pickups'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dailyReport'] });
        },
    });
}

export function useDeletePickup() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (pickupId: bigint) => {
            if (!actor) throw new Error('Actor not available');
            return actor.deletePickup(pickupId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pickups'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dailyReport'] });
        },
    });
}

export function useGetCycleBalance() {
    const { actor, isFetching: actorFetching } = useActor();

    return useQuery({
        queryKey: ['cycleBalance'],
        queryFn: async () => {
            if (!actor) throw new Error('Actor not available');
            return actor.getCycleBalance();
        },
        enabled: !!actor && !actorFetching,
    });
}

export function useExportData() {
    const { actor, isFetching: actorFetching } = useActor();

    return useQuery({
        queryKey: ['exportData'],
        queryFn: async () => {
            if (!actor) throw new Error('Actor not available');
            return actor.exportData();
        },
        enabled: false,
    });
}

export function useImportData() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: ImportExportData) => {
            if (!actor) throw new Error('Actor not available');
            return actor.importData(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pickups'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['dailyReport'] });
            queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
        },
    });
}

import type { ImportExportData, Pickup } from '../backend';
import { PaymentMethod } from '../backend';
import { getPacificDayGrouping } from './pickupGuards';
import { computePickupTotal } from './totals';

/**
 * Legacy import format where the entire file is just an array of pickups
 */
type LegacyPickupsArray = Array<any>;

/**
 * Legacy payment method representations
 */
type LegacyPaymentMethod = string | { [key: string]: null };

/**
 * Normalize legacy import data into the current ImportExportData format
 */
export function normalizeImportData(rawData: any): ImportExportData {
    // Handle case where entire file is just an array of pickups
    let pickupsArray: Array<any>;
    let customersArray: Array<any> = [];
    let nextPickupId: bigint | undefined;

    if (Array.isArray(rawData)) {
        // Legacy format: entire file is pickups array
        pickupsArray = rawData;
    } else if (rawData && typeof rawData === 'object') {
        // Modern format: object with pickups, customers, nextPickupId
        pickupsArray = rawData.pickups || [];
        customersArray = rawData.customers || [];
        nextPickupId = rawData.nextPickupId;
    } else {
        throw new Error('Invalid import file format. Expected JSON object or array.');
    }

    if (!Array.isArray(pickupsArray) || pickupsArray.length === 0) {
        throw new Error('No pickup records found in the import file.');
    }

    // Normalize each pickup
    const normalizedPickups: Pickup[] = pickupsArray.map((pickup, index) => {
        try {
            return normalizePickup(pickup);
        } catch (error) {
            throw new Error(`Invalid pickup at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // Normalize customers (with safe defaults)
    const normalizedCustomers = Array.isArray(customersArray) 
        ? customersArray.map(normalizeCustomer)
        : [];

    // Reconstruct nextPickupId if missing
    if (nextPickupId === undefined || nextPickupId === null) {
        const maxId = normalizedPickups.reduce(
            (max, p) => {
                const pickupId = typeof p.id === 'bigint' ? Number(p.id) : Number(p.id);
                return pickupId > max ? pickupId : max;
            },
            0
        );
        nextPickupId = BigInt(maxId + 1);
    } else if (typeof nextPickupId === 'string') {
        nextPickupId = BigInt(nextPickupId);
    } else if (typeof nextPickupId === 'number') {
        nextPickupId = BigInt(nextPickupId);
    }

    return {
        pickups: normalizedPickups,
        customers: normalizedCustomers,
        nextPickupId,
    };
}

/**
 * Normalize a single pickup record
 */
function normalizePickup(pickup: any): Pickup {
    if (!pickup || typeof pickup !== 'object') {
        throw new Error('Pickup must be an object');
    }

    // Normalize id (string -> bigint)
    const id = normalizeNat(pickup.id, 'id');

    // Normalize pickupTime (string -> bigint)
    const pickupTime = normalizeNat(pickup.pickupTime, 'pickupTime');

    // Recompute pickupDate from pickupTime using Pacific day grouping
    const pickupDate = getPacificDayGrouping(pickupTime);

    // Normalize payment methods
    const meterPaymentMethod = normalizePaymentMethod(pickup.meterPaymentMethod, 'meterPaymentMethod');
    
    // Tip payment method is optional; default to meter payment method if missing
    const tipPaymentMethod = pickup.tipPaymentMethod !== undefined && pickup.tipPaymentMethod !== null
        ? normalizePaymentMethod(pickup.tipPaymentMethod, 'tipPaymentMethod')
        : meterPaymentMethod;

    // Normalize numeric fields
    const meterTotal = normalizeFloat(pickup.meterTotal, 'meterTotal');
    
    // Tip is optional; default to 0 if missing
    const tip = pickup.tip !== undefined && pickup.tip !== null
        ? normalizeFloat(pickup.tip, 'tip')
        : 0;

    // Recompute calculatedTotal from canonical fields
    const calculatedTotal = computePickupTotal(meterTotal, tip);

    // Normalize text fields with safe defaults
    const streetAddress = normalizeText(pickup.streetAddress, '');
    const city = normalizeText(pickup.city, '');
    const customerName = normalizeText(pickup.customerName, '');
    const phoneNumber = normalizeText(pickup.phoneNumber, '');
    const destinationAddress = normalizeText(pickup.destinationAddress, '');

    return {
        id,
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
        calculatedTotal,
    };
}

/**
 * Normalize a customer record
 */
function normalizeCustomer(customer: any): any {
    if (!customer || typeof customer !== 'object') {
        return {
            name: '',
            streetAddress: '',
            city: '',
            phoneNumber: '',
            pickupHistory: [],
        };
    }

    return {
        name: normalizeText(customer.name, ''),
        streetAddress: normalizeText(customer.streetAddress, ''),
        city: normalizeText(customer.city, ''),
        phoneNumber: normalizeText(customer.phoneNumber, ''),
        pickupHistory: Array.isArray(customer.pickupHistory)
            ? customer.pickupHistory.map((p: any) => {
                try {
                    return normalizePickup(p);
                } catch {
                    return null;
                }
            }).filter((p: any) => p !== null)
            : [],
    };
}

/**
 * Normalize a nat (natural number) field from string/number to bigint
 */
function normalizeNat(value: any, fieldName: string): bigint {
    if (typeof value === 'bigint') {
        return value;
    }
    if (typeof value === 'string') {
        try {
            return BigInt(value);
        } catch {
            throw new Error(`Invalid ${fieldName}: "${value}" is not a valid number`);
        }
    }
    if (typeof value === 'number') {
        if (!Number.isInteger(value) || value < 0) {
            throw new Error(`Invalid ${fieldName}: ${value} must be a non-negative integer`);
        }
        return BigInt(Math.floor(value));
    }
    throw new Error(`Missing or invalid ${fieldName}`);
}

/**
 * Normalize a float field
 */
function normalizeFloat(value: any, fieldName: string): number {
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (isNaN(parsed)) {
            throw new Error(`Invalid ${fieldName}: "${value}" is not a valid number`);
        }
        return parsed;
    }
    throw new Error(`Missing or invalid ${fieldName}`);
}

/**
 * Normalize a text field
 */
function normalizeText(value: any, defaultValue: string): string {
    if (typeof value === 'string') {
        return value;
    }
    if (value === null || value === undefined) {
        return defaultValue;
    }
    return String(value);
}

/**
 * Normalize payment method from legacy formats to current PaymentMethod enum
 */
function normalizePaymentMethod(value: LegacyPaymentMethod, fieldName: string): PaymentMethod {
    // Handle string format (e.g., "cash", "credit", "voucher")
    if (typeof value === 'string') {
        const normalized = value.toLowerCase().trim();
        if (normalized === 'cash') return PaymentMethod.cash;
        if (normalized === 'credit') return PaymentMethod.credit;
        if (normalized === 'voucher') return PaymentMethod.voucher;
        throw new Error(`Invalid ${fieldName}: "${value}" is not a valid payment method (cash, credit, or voucher)`);
    }

    // Handle variant-like object format (e.g., { cash: null })
    if (value && typeof value === 'object') {
        const keys = Object.keys(value);
        if (keys.length === 1) {
            const key = keys[0].toLowerCase().trim();
            if (key === 'cash') return PaymentMethod.cash;
            if (key === 'credit') return PaymentMethod.credit;
            if (key === 'voucher') return PaymentMethod.voucher;
        }
        throw new Error(`Invalid ${fieldName}: unrecognized payment method format`);
    }

    throw new Error(`Missing or invalid ${fieldName}`);
}

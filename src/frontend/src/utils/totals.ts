import type { Pickup } from '../backend';

/**
 * Compute the total for a single pickup (meter + tip)
 */
export function computePickupTotal(meterTotal: number, tip: number): number {
    return meterTotal + tip;
}

/**
 * Compute daily totals from a list of pickups
 */
export function computeDailyTotals(pickups: Pickup[]) {
    let cashMeter = 0;
    let creditMeter = 0;
    let voucherMeter = 0;
    let cashTips = 0;
    let creditTips = 0;
    let voucherTips = 0;

    for (const pickup of pickups) {
        // Meter totals by payment method
        if (pickup.meterPaymentMethod === 'cash') {
            cashMeter += pickup.meterTotal;
        } else if (pickup.meterPaymentMethod === 'credit') {
            creditMeter += pickup.meterTotal;
        } else if (pickup.meterPaymentMethod === 'voucher') {
            voucherMeter += pickup.meterTotal;
        }

        // Tip totals by payment method
        if (pickup.tipPaymentMethod === 'cash') {
            cashTips += pickup.tip;
        } else if (pickup.tipPaymentMethod === 'credit') {
            creditTips += pickup.tip;
        } else if (pickup.tipPaymentMethod === 'voucher') {
            voucherTips += pickup.tip;
        }
    }

    const totalMeter = cashMeter + creditMeter + voucherMeter;
    const totalTips = cashTips + creditTips + voucherTips;
    const grandTotal = totalMeter + totalTips;

    // Canonical owed driver formula: ((creditMeter + voucherMeter - cashMeter) / 2) + creditTips + voucherTips
    const owedDriver = ((creditMeter + voucherMeter - cashMeter) / 2) + creditTips + voucherTips;

    return {
        cashMeter,
        creditMeter,
        voucherMeter,
        totalMeter,
        cashTips,
        creditTips,
        voucherTips,
        totalTips,
        grandTotal,
        owedDriver,
    };
}

/**
 * Compute owed driver amount from meter and tip totals
 * Formula: ((creditMeter + voucherMeter - cashMeter) / 2) + creditTips + voucherTips
 */
export function computeOwedDriver(
    cashMeter: number,
    creditMeter: number,
    voucherMeter: number,
    creditTips: number,
    voucherTips: number
): number {
    return ((creditMeter + voucherMeter - cashMeter) / 2) + creditTips + voucherTips;
}

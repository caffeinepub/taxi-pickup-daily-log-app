import { computeOwedDriver } from './totals';

/**
 * Calculate the amount owed to the driver using the canonical formula:
 * ((creditMeter + voucherMeter - cashMeter) / 2) + creditTips + voucherTips
 * 
 * @deprecated Use computeOwedDriver from utils/totals.ts instead for consistency
 */
export function calculateOwedDriver(
    cashMeter: number,
    creditMeter: number,
    voucherMeter: number,
    cashTips: number,
    creditTips: number,
    voucherTips: number
): number {
    // Delegate to canonical implementation
    return computeOwedDriver(cashMeter, creditMeter, voucherMeter, creditTips, voucherTips);
}

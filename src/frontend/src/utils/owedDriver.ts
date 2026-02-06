/**
 * Calculate the amount owed to the driver based on payment method totals.
 * 
 * Formula: ((creditMeter + voucherMeter - cashMeter) / 2) + creditTips + voucherTips
 * 
 * This represents:
 * - Half of the net meter difference (credit + voucher - cash)
 * - Plus all credit tips (driver keeps these)
 * - Plus all voucher tips (driver keeps these)
 */
export function calculateOwedDriver(
  cashMeter: number,
  creditMeter: number,
  voucherMeter: number,
  cashTips: number,
  creditTips: number,
  voucherTips: number
): number {
  return ((creditMeter + voucherMeter - cashMeter) / 2) + creditTips + voucherTips;
}

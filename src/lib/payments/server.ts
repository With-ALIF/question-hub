import "server-only";

import type { PaymentNumbers } from "./config";

const DEFAULT_NUMBER = "01328571768";

/**
 * Receiving numbers live on the server (not in NEXT_PUBLIC_* vars) so they can
 * be rotated without exposing anything else. Passed down to the dialog as props.
 */
export function getPaymentNumbers(): PaymentNumbers {
  return {
    bkash: process.env["BKASH_NUMBER"]?.trim() || DEFAULT_NUMBER,
    nagad: process.env["NAGAD_NUMBER"]?.trim() || DEFAULT_NUMBER,
  };
}

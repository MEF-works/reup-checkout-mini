/**
 * BTCPay Server integration: create invoice via your backend (backend calls BTCPay on your VM),
 * then poll invoice status until Settled or Expired.
 */

import type { BtcPayInvoice } from '../types';

const POLL_INTERVAL_MS = 5000;

export type CreateBtcPayInvoiceParams = {
  orderId: string;
  amount: string;
  currency?: string;
};

/**
 * Create a BTCPay invoice via your backend. Backend should POST to BTCPay Greenfield API
 * (POST /api/v1/stores/{storeId}/invoices) and return normalized invoice for the checkout UI.
 */
export async function createBtcPayInvoice(
  createInvoiceUrl: string,
  params: CreateBtcPayInvoiceParams
): Promise<BtcPayInvoice> {
  const res = await fetch(createInvoiceUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency ?? 'USD',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Create invoice failed: ${res.status}`);
  }
  const data = await res.json();
  if (!data?.invoiceId || !data?.paymentAddress || data?.amount == null || !data?.cryptoCode) {
    throw new Error('Invalid invoice response: missing invoiceId, paymentAddress, amount, or cryptoCode');
  }
  return data as BtcPayInvoice;
}

export type BtcPayStatus = 'New' | 'Processing' | 'Settled' | 'Expired';

export type StartBtcPayPollOptions = {
  statusUrl: string;
  invoiceId: string;
  onPaid: () => void;
  onPoll?: (attempt: number) => void;
};

/**
 * Polls invoice status every 5s. statusUrl can be "https://your-backend.com/invoice/status?invoiceId="
 * (we append invoiceId) or "https://your-backend.com/invoice/status/:invoiceId" (we replace :invoiceId).
 * Calls onPaid when status is Settled. Returns cleanup function.
 */
export function startBtcPayPoll(options: StartBtcPayPollOptions): () => void {
  const { statusUrl, invoiceId, onPaid, onPoll } = options;
  let attempt = 0;

  const url = statusUrl.includes(':invoiceId')
    ? statusUrl.replace(':invoiceId', encodeURIComponent(invoiceId))
    : `${statusUrl}${statusUrl.includes('?') ? '&' : '?'}invoiceId=${encodeURIComponent(invoiceId)}`;

  const poll = async () => {
    attempt += 1;
    onPoll?.(attempt);
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const status = (data?.status as string) ?? '';
      if (status === 'Settled') {
        onPaid();
      }
    } catch {
      // next poll will retry
    }
  };

  poll();
  const intervalId = setInterval(poll, POLL_INTERVAL_MS);
  return () => clearInterval(intervalId);
}

/**
 * Polls for P2P payment verification. In production, poll your backend;
 * backend is notified by the email bot when the P2P receipt is parsed.
 */

const POLL_INTERVAL_MS = 5000;

export type VerificationPollOptions = {
  orderId: string;
  /** Backend URL to poll, e.g. GET /api/orders/:orderId/verification. If not set, demo mode: verify after 2 polls. */
  verificationUrl?: string;
  onVerified: () => void;
  onPoll?: (attempt: number) => void;
};

/**
 * Starts polling every 5 seconds. Calls onVerified when the backend returns verified.
 * Returns a cleanup function to clear the interval.
 */
export function startVerificationPoll(options: VerificationPollOptions): () => void {
  const { orderId, verificationUrl, onVerified, onPoll } = options;
  let attempt = 0;

  const poll = async () => {
    attempt += 1;
    onPoll?.(attempt);

    if (verificationUrl) {
      try {
        const url = verificationUrl.replace(':orderId', encodeURIComponent(orderId));
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.verified === true) {
          onVerified();
        }
      } catch {
        // Network error; next poll will retry
      }
      return;
    }

    // Demo: verify after 2 polls (~10 seconds)
    if (attempt >= 2) {
      onVerified();
    }
  };

  poll();
  const intervalId = setInterval(poll, POLL_INTERVAL_MS);

  return () => clearInterval(intervalId);
}

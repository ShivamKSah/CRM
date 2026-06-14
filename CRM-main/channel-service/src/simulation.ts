export interface SimulationPayload {
  communication_id: string;
  customer_id: string;
  channel: string;
  message: string;
}

export interface SimulationDependencies {
  crmBackendUrl: string;
  fetchFn?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}

const RECEIPT_BACKOFF_MS = [1000, 2000, 4000] as const;
const MAX_RECEIPT_RETRIES = RECEIPT_BACKOFF_MS.length;

function defaultSleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomBetween(minMs: number, maxMs: number, random: () => number): number {
  return minMs + random() * (maxMs - minMs);
}

/**
 * POST a status receipt to the CRM backend with retry and exponential backoff.
 * Failures are logged and swallowed so the delivery pipeline can continue.
 */
export async function sendReceipt(
  communicationId: string,
  status: string,
  deps: SimulationDependencies
): Promise<void> {
  const fetchFn = deps.fetchFn ?? fetch;
  const sleep = deps.sleep ?? defaultSleep;
  const url = `${deps.crmBackendUrl}/api/receipts`;
  const body = JSON.stringify({
    communication_id: communicationId,
    status,
    timestamp: new Date().toISOString(),
  });

  for (let attempt = 0; attempt <= MAX_RECEIPT_RETRIES; attempt++) {
    try {
      const response = await fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (response.ok) {
        console.log(`[CHANNEL] Receipt delivered: ${communicationId} status=${status}`);
        return;
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      if (attempt < MAX_RECEIPT_RETRIES) {
        await sleep(RECEIPT_BACKOFF_MS[attempt]);
        continue;
      }

      console.error(
        `[CHANNEL] Failed to deliver receipt for ${communicationId} status=${status} after 3 retries`
      );
    }
  }
}

/**
 * Simulates the full message delivery lifecycle for one communication.
 *
 * Step 1 — **sent**: wait 500–1500 ms, then POST `sent`.
 * Step 2 — **delivered** or **failed** (mutually exclusive):
 *   - 85% → wait 1–3 s after sent, POST `delivered`
 *   - 15% → wait 500 ms–2 s after sent, POST `failed`, then stop
 * Step 3 — **opened**: 60% of delivered messages; wait 2–8 s after delivered, POST `opened`
 * Step 4 — **read**: 70% of opened messages; wait 1–4 s after opened, POST `read`
 * Step 5 — **clicked**: 20% of read messages; wait 500 ms–3 s after read, POST `clicked`
 *
 * Each step POSTs to `{crmBackendUrl}/api/receipts`. Failed callbacks are retried up to
 * three times (1 s / 2 s / 4 s backoff) but never block subsequent simulation steps.
 */
export async function simulateDelivery(
  payload: SimulationPayload,
  deps: SimulationDependencies
): Promise<void> {
  const { communication_id } = payload;
  const sleep = deps.sleep ?? defaultSleep;
  const random = deps.random ?? Math.random;

  // Step 1: sent
  await sleep(randomBetween(500, 1500, random));
  await sendReceipt(communication_id, 'sent', deps);

  // Step 2: delivered or failed
  if (random() < 0.15) {
    await sleep(randomBetween(500, 2000, random));
    await sendReceipt(communication_id, 'failed', deps);
    return;
  }

  await sleep(randomBetween(1000, 3000, random));
  await sendReceipt(communication_id, 'delivered', deps);

  // Step 3: opened (60% of delivered)
  if (random() >= 0.6) {
    return;
  }

  await sleep(randomBetween(2000, 8000, random));
  await sendReceipt(communication_id, 'opened', deps);

  // Step 4: read (70% of opened)
  if (random() >= 0.7) {
    return;
  }

  await sleep(randomBetween(1000, 4000, random));
  await sendReceipt(communication_id, 'read', deps);

  // Step 5: clicked (20% of read)
  if (random() >= 0.2) {
    return;
  }

  await sleep(randomBetween(500, 3000, random));
  await sendReceipt(communication_id, 'clicked', deps);
}

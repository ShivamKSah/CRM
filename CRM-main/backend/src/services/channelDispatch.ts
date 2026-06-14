const DISPATCH_BATCH_SIZE = 25;
const DISPATCH_BATCH_DELAY_MS = 200;

export interface ChannelDispatchPayload {
  communication_id: string;
  customer_id: string;
  channel: string;
  message: string;
}

/**
 * Send communications to the channel service in batches without blocking the caller.
 */
export function dispatchToChannelService(
  payloads: ChannelDispatchPayload[],
  channelServiceUrl: string
): void {
  if (payloads.length === 0) {
    return;
  }

  void (async () => {
    for (let i = 0; i < payloads.length; i += DISPATCH_BATCH_SIZE) {
      const batch = payloads.slice(i, i + DISPATCH_BATCH_SIZE);

      await Promise.all(
        batch.map(payload =>
          fetch(`${channelServiceUrl}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }).catch(err => {
            console.error(
              `[CHANNEL] Dispatch failed for ${payload.communication_id}:`,
              err
            );
          })
        )
      );

      if (i + DISPATCH_BATCH_SIZE < payloads.length) {
        await new Promise(resolve => setTimeout(resolve, DISPATCH_BATCH_DELAY_MS));
      }
    }
  })();
}

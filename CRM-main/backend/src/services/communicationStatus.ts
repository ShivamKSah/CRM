const PIPELINE = ['queued', 'sent', 'delivered', 'opened', 'read', 'clicked'] as const;

export type CommunicationStatus =
  | (typeof PIPELINE)[number]
  | 'failed';

export type ReceiptStatus = Exclude<CommunicationStatus, 'queued'>;

function pipelineIndex(status: string): number {
  return PIPELINE.indexOf(status as (typeof PIPELINE)[number]);
}

/**
 * Returns true if the communication may advance from `current` to `incoming`.
 * Pipeline: queued → sent → delivered → opened → read → clicked.
 * `failed` is only valid when current status is `sent`.
 */
export function canAdvanceStatus(current: string, incoming: ReceiptStatus): boolean {
  if (current === incoming) {
    return false;
  }

  if (current === 'failed' || current === 'clicked') {
    return false;
  }

  if (incoming === 'failed') {
    return current === 'sent';
  }

  if (current === 'failed') {
    return false;
  }

  const currentIdx = pipelineIndex(current);
  const incomingIdx = pipelineIndex(incoming);

  if (currentIdx === -1 || incomingIdx === -1) {
    return false;
  }

  return incomingIdx > currentIdx;
}

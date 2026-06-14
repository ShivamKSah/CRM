import {
  simulateDelivery,
  type SimulationDependencies,
  type SimulationPayload,
} from './simulation.js';

const VOLUME_WINDOW_MS = 10_000;
const HIGH_VOLUME_THRESHOLD = 50;
const BATCH_SIZE = 20;
const BATCH_INTERVAL_MS = 500;

/**
 * In-memory queue that runs simulations immediately under normal load and
 * throttles to batches of 20 (500 ms apart) when more than 50 messages
 * arrive within a rolling 10-second window.
 */
export class DeliveryQueue {
  private readonly arrivalTimestamps: number[] = [];
  private readonly pending: SimulationPayload[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly deps: SimulationDependencies) {}

  enqueue(payload: SimulationPayload): void {
    this.recordArrival();

    if (this.isHighVolume()) {
      this.pending.push(payload);
      this.ensureProcessor();
      return;
    }

    void this.runSimulation(payload);
  }

  /** Number of payloads waiting for batched processing (for tests). */
  getPendingCount(): number {
    return this.pending.length;
  }

  /** Arrival count in the current rolling window (for tests). */
  getArrivalCount(): number {
    this.pruneArrivals(Date.now());
    return this.arrivalTimestamps.length;
  }

  destroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.pending.length = 0;
    this.arrivalTimestamps.length = 0;
  }

  private recordArrival(): void {
    this.arrivalTimestamps.push(Date.now());
    this.pruneArrivals(Date.now());
  }

  private pruneArrivals(now: number): void {
    const cutoff = now - VOLUME_WINDOW_MS;
    while (this.arrivalTimestamps.length > 0 && this.arrivalTimestamps[0] < cutoff) {
      this.arrivalTimestamps.shift();
    }
  }

  private isHighVolume(): boolean {
    return this.arrivalTimestamps.length > HIGH_VOLUME_THRESHOLD;
  }

  private ensureProcessor(): void {
    if (this.intervalId !== null) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.processBatch();
    }, BATCH_INTERVAL_MS);
  }

  private processBatch(): void {
    if (this.pending.length === 0) {
      if (this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      return;
    }

    const batch = this.pending.splice(0, BATCH_SIZE);
    for (const payload of batch) {
      void this.runSimulation(payload);
    }
  }

  private runSimulation(payload: SimulationPayload): void {
    void simulateDelivery(payload, this.deps).catch(err => {
      console.error(`[CHANNEL] Simulation error for ${payload.communication_id}:`, err);
    });
  }
}

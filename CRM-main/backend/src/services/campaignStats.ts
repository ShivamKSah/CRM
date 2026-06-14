import { supabase } from '../supabase.js';

const DEBOUNCE_MS = 500;

const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

function safeRate(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, numerator / denominator));
}

/**
 * Recompute funnel counts and rates for a campaign from current communication statuses.
 * Counts are cumulative (e.g. `delivered` includes messages currently at opened/read/clicked).
 */
export async function recalculateCampaignStats(campaignId: string): Promise<void> {
  const { data: comms, error } = await supabase
    .from('communications')
    .select('status')
    .eq('campaign_id', campaignId);

  if (error) {
    console.error(`[STATS] Failed to load communications for campaign ${campaignId}:`, error.message);
    return;
  }

  if (!comms) {
    return;
  }

  let totalSent = 0;
  let delivered = 0;
  let failed = 0;
  let opened = 0;
  let read = 0;
  let clicked = 0;

  for (const comm of comms) {
    const status = comm.status;

    if (status !== 'queued') {
      totalSent++;
    }
    if (status === 'failed') {
      failed++;
    }
    if (status === 'delivered' || status === 'opened' || status === 'read' || status === 'clicked') {
      delivered++;
    }
    if (status === 'opened' || status === 'read' || status === 'clicked') {
      opened++;
    }
    if (status === 'read' || status === 'clicked') {
      read++;
    }
    if (status === 'clicked') {
      clicked++;
    }
  }

  const deliveryRate = safeRate(delivered, totalSent);
  const openRate = safeRate(opened, delivered);
  const clickRate = safeRate(clicked, opened);

  const statsPayload = {
    campaign_id: campaignId,
    total_sent: totalSent,
    delivered,
    failed,
    opened,
    read,
    clicked,
    delivery_rate: deliveryRate,
    open_rate: openRate,
    click_rate: clickRate,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from('campaign_stats')
    .upsert(statsPayload, { onConflict: 'campaign_id' });

  if (updateError) {
    console.error(`[STATS] Failed to update campaign_stats for ${campaignId}:`, updateError.message);
  }

  // Mark campaign completed if all communications have reached a terminal status
  const allTerminal = comms.every(c =>
    ['delivered', 'failed', 'opened', 'read', 'clicked'].includes(c.status)
  );

  if (allTerminal && comms.length > 0) {
    const { error: completeError } = await supabase
      .from('campaigns')
      .update({ status: 'completed' })
      .eq('id', campaignId)
      .eq('status', 'running');

    if (completeError) {
      console.error(`[STATS] Failed to mark campaign ${campaignId} as completed:`, completeError.message);
    } else {
      console.log(`[STATS] Campaign ${campaignId} marked as completed`);
    }
  }
}

/**
 * Debounce stats recalculation per campaign — multiple calls within 500 ms coalesce into one run.
 */
export function scheduleRecalculateCampaignStats(campaignId: string): void {
  const existing = debounceTimers.get(campaignId);
  if (existing) {
    clearTimeout(existing);
  }

  debounceTimers.set(
    campaignId,
    setTimeout(() => {
      debounceTimers.delete(campaignId);
      void recalculateCampaignStats(campaignId).catch(err => {
        console.error(`[STATS] Recalculation error for campaign ${campaignId}:`, err);
      });
    }, DEBOUNCE_MS)
  );
}

/** Clear pending debounce timers (for tests). */
export function clearStatsDebounceTimers(): void {
  for (const timer of debounceTimers.values()) {
    clearTimeout(timer);
  }
  debounceTimers.clear();
}

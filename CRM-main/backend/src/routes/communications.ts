import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../supabase.js';
import { canAdvanceStatus, type ReceiptStatus } from '../services/communicationStatus.js';
import { handleRouteError } from '../utils/routeError.js';
import { scheduleRecalculateCampaignStats } from '../services/campaignStats.js';

const router = Router();

const receiptSchema = z.object({
  communication_id: z.string().uuid({ message: 'communication_id must be a valid UUID' }),
  status: z.enum(['sent', 'delivered', 'failed', 'opened', 'read', 'clicked']),
  timestamp: z.string().datetime({ message: 'timestamp must be a valid ISO 8601 datetime string' }),
});

router.post('/', async (req, res) => {
  try {
    const parsed = receiptSchema.safeParse(req.body);

    if (!parsed.success) {
      const message = parsed.error.errors.map(e => e.message).join('; ');
      return res.status(400).json({ error: message });
    }

    const { communication_id, status, timestamp } = parsed.data;

    const { data: comm, error: fetchError } = await supabase
      .from('communications')
      .select('id, status, campaign_id')
      .eq('id', communication_id)
      .single();

    if (fetchError || !comm) {
      return res.status(404).json({ error: 'Communication not found' });
    }

    if (!canAdvanceStatus(comm.status, status as ReceiptStatus)) {
      return res.json({
        success: true,
        communication_id,
        status: comm.status,
        ignored: true,
      });
    }

    const updatePayload: Record<string, string> = {
      status,
      updated_at: timestamp,
    };

    if (status === 'sent') {
      updatePayload.sent_at = timestamp;
    }

    const { error: updateError } = await supabase
      .from('communications')
      .update(updatePayload)
      .eq('id', communication_id);

    if (updateError) {
      console.error('Update communication error:', updateError);
      return res.status(500).json({ error: 'Failed to update communication' });
    }

    scheduleRecalculateCampaignStats(comm.campaign_id);

    res.json({ success: true, communication_id, status });
  } catch (err) {
    handleRouteError(res, err, 'Failed to process receipt');
  }
});

export default router;

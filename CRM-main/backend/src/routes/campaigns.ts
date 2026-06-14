import { Router } from 'express';
import { supabase } from '../supabase.js';
import { getMatchingCustomers } from '../services/customerMatching.js';
import { genAI, GEMINI_MODEL } from '../gemini.js';
import {
  MESSAGE_GENERATOR_SYSTEM,
  buildMessageGeneratorUserPrompt,
  normalizeGeneratedMessage,
} from '../prompts/messageGenerator.js';
import { dispatchToChannelService } from '../services/channelDispatch.js';
import { scheduleRecalculateCampaignStats } from '../services/campaignStats.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { name, segment_id, channel, message_template, scheduled_at } = req.body;

    if (!name || !segment_id || !channel || !message_template) {
      return res.status(400).json({ error: 'name, segment_id, channel, and message_template required' });
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        name,
        segment_id,
        channel,
        message_template,
        status: 'draft',
        scheduled_at: scheduled_at || null
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Create initial stats record
    await supabase.from('campaign_stats').insert({ campaign_id: data.id });

    res.json(data);
  } catch (err) {
    console.error('Create campaign error:', err);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const { data, error, count } = await supabase
      .from('campaigns')
      .select('*, segments(name), campaign_stats(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ campaigns: data, total: count });
  } catch (err) {
    console.error('List campaigns error:', err);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('campaigns')
      .select('*, segments(*), campaign_stats(*)')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(data);
  } catch (err) {
    console.error('Get campaign error:', err);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

router.post('/:id/launch', async (req, res) => {
  try {
    const { id } = req.params;

    // Get campaign with segment
    const { data: campaign, error: campError } = await supabase
      .from('campaigns')
      .select('*, segments(filter_rules)')
      .eq('id', id)
      .single();

    if (campError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'draft') {
      return res.status(400).json({ error: 'Campaign already launched' });
    }

    // Get customers in segment
    const customers = await getMatchingCustomers(campaign.segments.filter_rules);

    if (customers.length === 0) {
      return res.status(400).json({ error: 'No customers match this segment' });
    }

    const communicationRows = customers.map(customer => ({
      campaign_id: id,
      customer_id: customer.id,
      channel: campaign.channel,
      message: campaign.message_template
        .replace(/{name}/g, customer.name)
        .replace(/{city}/g, customer.city || ''),
      status: 'queued',
    }));

    const { data: insertedComms, error: insertError } = await supabase
      .from('communications')
      .insert(communicationRows)
      .select('id, customer_id, channel, message');

    if (insertError) {
      console.error('Bulk insert communications error:', insertError);
      return res.status(500).json({ error: 'Failed to create communication records' });
    }

    await supabase.from('campaigns').update({ status: 'running' }).eq('id', id);

    scheduleRecalculateCampaignStats(id);

    const channelServiceUrl = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3001';
    dispatchToChannelService(
      (insertedComms ?? []).map(comm => ({
        communication_id: comm.id,
        customer_id: comm.customer_id,
        channel: comm.channel,
        message: comm.message,
      })),
      channelServiceUrl
    );

    res.json({
      message: 'Campaign launched',
      total_recipients: insertedComms?.length ?? customers.length,
    });
  } catch (err) {
    console.error('Launch campaign error:', err);
    res.status(500).json({ error: 'Failed to launch campaign' });
  }
});

router.post('/:id/generate-message', async (req, res) => {
  try {
    const { id } = req.params;
    const { goal, channel, brand_name, segment_description } = req.body;

    if (!goal) {
      return res.status(400).json({ error: 'Goal description required' });
    }

    const resolvedChannel = channel || 'sms';

    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: MESSAGE_GENERATOR_SYSTEM,
    });

    const result = await model.generateContent(
      buildMessageGeneratorUserPrompt({
        goal,
        channel: resolvedChannel,
        brand_name,
        segment_description,
      })
    );
    const rawText = result.response.text();
    const message = normalizeGeneratedMessage(rawText, resolvedChannel);

    await supabase
      .from('campaigns')
      .update({ ai_generated_message: true })
      .eq('id', id);

    res.json({
      message,
      channel: resolvedChannel,
      ai_generated: true,
    });
  } catch (err) {
    console.error('Generate message error:', err);
    res.status(500).json({ error: 'Failed to generate message' });
  }
});

router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: stats, error } = await supabase
      .from('campaign_stats')
      .select('*')
      .eq('campaign_id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Stats not found' });
    }

    // Also get communications breakdown
    const { data: communications } = await supabase
      .from('communications')
      .select('status, channel')
      .eq('campaign_id', id);

    const breakdown = {
      queued: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      opened: 0,
      read: 0,
      clicked: 0
    };

    communications?.forEach(c => {
      breakdown[c.status as keyof typeof breakdown]++;
    });

    res.json({ ...stats, breakdown });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/:id/communications', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('communications')
      .select('id, campaign_id, customer_id, channel, message, status, sent_at, updated_at, customers(name, email)', {
        count: 'exact',
      })
      .eq('campaign_id', id)
      .order('updated_at', { ascending: false });

    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query.range(
      Number(offset),
      Number(offset) + Number(limit) - 1
    );

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ communications: data ?? [], total: count ?? 0 });
  } catch (err) {
    console.error('Get communications error:', err);
    res.status(500).json({ error: 'Failed to fetch communications' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete communications first
    await supabase.from('communications').delete().eq('campaign_id', id);
    await supabase.from('campaign_stats').delete().eq('campaign_id', id);
    await supabase.from('campaigns').delete().eq('id', id);

    res.json({ success: true });
  } catch (err) {
    console.error('Delete campaign error:', err);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

export default router;

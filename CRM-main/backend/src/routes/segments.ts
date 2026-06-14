import { Router } from 'express';
import { supabase } from '../supabase.js';
import { genAI, GEMINI_MODEL } from '../gemini.js';
import { parseJsonFromText } from '../utils/aiResponse.js';
import {
  SEGMENT_AI_SUGGEST_SYSTEM,
  extractFilterRules,
} from '../prompts/segmentAiSuggest.js';
import {
  countMatchingCustomers,
  getMatchingCustomers,
} from '../services/customerMatching.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { name, description, filter_rules } = req.body;

    if (!name || !filter_rules) {
      return res.status(400).json({ error: 'Name and filter_rules required' });
    }

    // Calculate customer count based on filter rules
    const customerCount = await countMatchingCustomers(filter_rules);

    const { data, error } = await supabase
      .from('segments')
      .insert({
        name,
        description: description || null,
        filter_rules,
        customer_count: customerCount,
        created_by: 'manual'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error('Create segment error:', err);
    res.status(500).json({ error: 'Failed to create segment' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const { data, error, count } = await supabase
      .from('segments')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ segments: data, total: count });
  } catch (err) {
    console.error('List segments error:', err);
    res.status(500).json({ error: 'Failed to fetch segments' });
  }
});

router.post('/ai-suggest', async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Description required' });
    }

    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: SEGMENT_AI_SUGGEST_SYSTEM,
    });

    const result = await model.generateContent(description);
    const rawText = result.response.text();

    const parsed = parseJsonFromText(rawText);
    const filterRules = extractFilterRules(parsed);
    const segmentName =
      typeof parsed.segment_name === 'string' ? parsed.segment_name : undefined;
    const segmentDescription =
      typeof parsed.segment_description === 'string' ? parsed.segment_description : undefined;

    const previewCount = await countMatchingCustomers(filterRules);

    res.json({
      filter_rules: filterRules,
      segment_name: segmentName,
      segment_description: segmentDescription,
      preview_count: previewCount,
    });
  } catch (err) {
    console.error('AI suggest error:', err);
    res.status(500).json({ error: 'Failed to generate segment suggestion' });
  }
});

router.get('/:id/customers', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: segment, error: segError } = await supabase
      .from('segments')
      .select('filter_rules')
      .eq('id', id)
      .single();

    if (segError || !segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    const customers = await getMatchingCustomers(segment.filter_rules);
    res.json({ customers });
  } catch (err) {
    console.error('Get segment customers error:', err);
    res.status(500).json({ error: 'Failed to fetch segment customers' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('segments').delete().eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete segment error:', err);
    res.status(500).json({ error: 'Failed to delete segment' });
  }
});

export { countMatchingCustomers, getMatchingCustomers } from '../services/customerMatching.js';

export default router;

export const SEGMENT_AI_SUGGEST_SYSTEM = `You are a CRM segmentation expert for a D2C brand in India. 
Given a marketer's intent in plain English, extract structured filter rules.
Return ONLY a JSON object with these optional fields:
{
  "min_spend": number,        // minimum total lifetime spend in INR
  "max_spend": number,
  "min_orders": number,       // minimum number of orders placed
  "max_orders": number,
  "last_order_before_days": number,  // churned: last order was more than N days ago
  "last_order_after_days": number,   // recent: last order was within N days
  "cities": string[],         // ["Mumbai", "Delhi", etc]
  "tags": string[],
  "segment_name": string,     // suggested name for this segment
  "segment_description": string  // one line description
}
Return only valid JSON. No explanation, no markdown, no backticks.`;

export const FILTER_RULE_KEYS = [
  'min_spend',
  'max_spend',
  'min_orders',
  'max_orders',
  'last_order_before_days',
  'last_order_after_days',
  'cities',
  'tags',
] as const;

export function extractFilterRules(parsed: Record<string, unknown>): Record<string, unknown> {
  const filterRules: Record<string, unknown> = {};

  for (const key of FILTER_RULE_KEYS) {
    if (parsed[key] !== undefined) {
      filterRules[key] = parsed[key];
    }
  }

  return filterRules;
}

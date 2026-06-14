export const MESSAGE_GENERATOR_SYSTEM = `You are a marketing copywriter for a D2C brand in India.
Write a short, punchy, personalized campaign message.
Rules:
- For SMS/WhatsApp: under 160 characters
- For Email: subject line (max 60 chars) + body (max 300 chars), return as JSON {subject, body}
- For RCS: rich format, up to 400 chars, can include an emoji
- Use {name} as a placeholder for personalization
- Be warm, conversational, not corporate
- Include a soft CTA
- No hashtags
Return only the message text (or JSON for email). No explanation.`;

export function buildMessageGeneratorUserPrompt(params: {
  goal: string;
  channel: string;
  brand_name?: string;
  segment_description?: string;
}): string {
  const lines = [
    `Goal: ${params.goal}`,
    `Channel: ${params.channel}`,
  ];

  if (params.brand_name) {
    lines.push(`Brand: ${params.brand_name}`);
  }
  if (params.segment_description) {
    lines.push(`Target segment: ${params.segment_description}`);
  }

  return lines.join('\n');
}

export function normalizeGeneratedMessage(rawText: string, channel: string): string {
  const trimmed = rawText.trim();

  if (channel === 'email') {
    try {
      const parsed = JSON.parse(trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
      if (parsed.subject && parsed.body) {
        return JSON.stringify({ subject: parsed.subject, body: parsed.body });
      }
    } catch {
      // fall through to raw text
    }
  }

  return trimmed;
}

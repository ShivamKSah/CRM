export interface ChatAction {
  type: string;
  segment_name?: string;
  segment_description?: string;
  channel?: string;
  message?: string;
  filter_rules?: Record<string, unknown>;
}

const ACTION_TAG_REGEX = /<action\s+([^>]+)\/>/g;

function parseJsonAttribute(attrString: string, key: string): Record<string, unknown> | undefined {
  const prefix = `${key}=`;
  const keyIndex = attrString.indexOf(prefix);
  if (keyIndex === -1) {
    return undefined;
  }

  const start = keyIndex + prefix.length;
  if (attrString[start] !== '{') {
    return undefined;
  }

  let depth = 0;
  for (let i = start; i < attrString.length; i++) {
    if (attrString[i] === '{') {
      depth++;
    }
    if (attrString[i] === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(attrString.slice(start, i + 1)) as Record<string, unknown>;
        } catch {
          return undefined;
        }
      }
    }
  }

  return undefined;
}

function parseStringAttribute(attrString: string, key: string): string | undefined {
  const regex = new RegExp(`${key}="([^"]*)"`);
  const match = attrString.match(regex);
  return match ? match[1] : undefined;
}

function parseActionAttributes(attrString: string): ChatAction {
  const action: ChatAction = { type: parseStringAttribute(attrString, 'type') ?? '' };

  action.segment_name = parseStringAttribute(attrString, 'segment_name');
  action.segment_description = parseStringAttribute(attrString, 'segment_description');
  action.channel = parseStringAttribute(attrString, 'channel');
  action.message = parseStringAttribute(attrString, 'message');
  action.filter_rules = parseJsonAttribute(attrString, 'filter_rules');

  return action;
}

export function parseChatActions(text: string): { reply: string; actions: ChatAction[] } {
  const actions: ChatAction[] = [];

  for (const match of text.matchAll(ACTION_TAG_REGEX)) {
    const parsed = parseActionAttributes(match[1]);
    if (parsed.type) {
      actions.push(parsed);
    }
  }

  const reply = text.replace(ACTION_TAG_REGEX, '').trim();

  return { reply, actions };
}

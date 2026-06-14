import { Router } from 'express';
import { genAI, GEMINI_MODEL } from '../gemini.js';
import { fetchChatContext } from '../services/chatContext.js';
import { parseChatActions } from '../services/chatActions.js';
import { handleRouteError } from '../utils/routeError.js';
import { buildChatAssistantSystem } from '../prompts/chatAssistant.js';

const router = Router();

interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

router.post('/', async (req, res) => {
  try {
    const { message, conversation_history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message required' });
    }

    const history: ConversationTurn[] = Array.isArray(conversation_history)
      ? conversation_history.filter(
          (turn): turn is ConversationTurn =>
            turn &&
            typeof turn === 'object' &&
            (turn.role === 'user' || turn.role === 'assistant') &&
            typeof turn.content === 'string'
        )
      : [];

    const context = await fetchChatContext();

    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: buildChatAssistantSystem(context),
    });

    const chat = model.startChat({
      history: history.map(turn => ({
        role: turn.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: turn.content }],
      })),
    });

    const result = await chat.sendMessage(message);
    const rawReply = result.response.text();

    const { reply, actions } = parseChatActions(rawReply);

    res.json({ reply, actions });
  } catch (err) {
    handleRouteError(res, err, 'Failed to process chat message');
  }
});

export default router;

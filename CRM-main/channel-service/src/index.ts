import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { DeliveryQueue } from './deliveryQueue.js';

export { simulateDelivery, sendReceipt } from './simulation.js';
export type { SimulationPayload, SimulationDependencies } from './simulation.js';
export { DeliveryQueue } from './deliveryQueue.js';

const app = express();

app.use(cors());
app.use(express.json());

const deliveryQueue = new DeliveryQueue({ crmBackendUrl: env.crmBackendUrl });

app.post('/send', (req, res) => {
  try {
    const { communication_id, customer_id, channel, message } = req.body;

    if (!communication_id || !customer_id || !channel || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`[CHANNEL] Received send request: ${communication_id}`);

    res.json({ status: 'accepted', communication_id });

    deliveryQueue.enqueue({ communication_id, customer_id, channel, message });
  } catch (err) {
    console.error('[CHANNEL] Send handler error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

const PORT = env.port;
app.listen(PORT, () => {
  console.log(`Channel service running on port ${PORT}`);
});

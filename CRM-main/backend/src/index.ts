import express from 'express';
import cors from 'cors';
import { validateBackendEnv } from './config/env.js';
import customerRoutes from './routes/customers.js';
import orderRoutes from './routes/orders.js';
import segmentRoutes from './routes/segments.js';
import campaignRoutes from './routes/campaigns.js';
import communicationRoutes from './routes/communications.js';
import chatRoutes from './routes/chat.js';
import seedRoutes from './routes/seed.js';

try {
  validateBackendEnv();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.path} → ${res.statusCode} in ${duration}ms`);
  });
  next();
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/segments', segmentRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/receipts', communicationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/seed', seedRoutes);

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Aura backend running on port ${PORT}`);
});

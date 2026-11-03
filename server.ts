import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import apiRoutes from './server/routes.js';
import { db } from './server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // JSON and URL-encoded body parsers
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Mount API endpoints
  app.use('/api', apiRoutes);

  // Global error handler (also catches body-parser failures raised before
  // the router): always answer API errors as JSON, never crash the process.
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[NexLeaf] Unhandled error:', err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(500).json({ error: 'Internal server error' });
  });

  // Seed catalog data (careers, projects, courses, demo account) into
  // empty tables. The seeder logs and swallows its own failures, so a
  // seeding problem never prevents the server from starting.
  await db.seedCatalogData();

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'NexLeaf API',
      category: 'AI-Powered Career Navigation Platform',
      timestamp: new Date().toISOString()
    });
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development: mount Vite middlewares
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NexLeaf] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[NexLeaf] Failed to start server:', err);
  process.exit(1);
});

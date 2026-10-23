import { Router } from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Match My Jobs REST API',
    version: '1.0.0',
    phase: 1,
  });
});

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);

export default router;

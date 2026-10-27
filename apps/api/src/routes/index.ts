import { Router } from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';
import adminRoutes from './admin.routes.js';
import companyRoutes from './company.routes.js';
import candidateRoutes from './candidate.routes.js';
import resumeRoutes from './resume.routes.js';
import jobRoutes from './job.routes.js';
import matchRoutes from './match.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Match My Jobs REST API',
    version: '2.0.0',
    rbac: 'enabled',
    phase2: 'enabled',
  });
});

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);
router.use('/company', companyRoutes);
router.use('/candidate', candidateRoutes);
router.use('/resume', resumeRoutes);
router.use('/jobs', jobRoutes);
router.use('/match', matchRoutes);

export default router;

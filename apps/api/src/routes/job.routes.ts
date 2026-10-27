import { Router } from 'express';
import { JobController } from '../controllers/job.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { requireCompanyRole, requireOrgMembership } from '../middleware/rbac.middleware.js';

const router = Router();

// Public routes
router.get('/', JobController.listJobs);
router.get('/:id', JobController.getJobById);

// Protected company routes (Recruiter, Company Owner, Platform Admin)
router.post('/', authenticateJwt, requireCompanyRole, requireOrgMembership, JobController.createJob);
router.put('/:id', authenticateJwt, requireCompanyRole, requireOrgMembership, JobController.updateJob);
router.delete('/:id', authenticateJwt, requireCompanyRole, requireOrgMembership, JobController.deleteJob);

export default router;

import { Router } from 'express';
import { CandidateController } from '../controllers/candidate.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { requireCandidateRole } from '../middleware/rbac.middleware.js';

const router = Router();

// Publicly browse active jobs
router.get('/jobs', CandidateController.browseJobs);

// Protected candidate routes
router.use(authenticateJwt, requireCandidateRole);

router.post('/apply', CandidateController.applyJob);
router.get('/applications', CandidateController.getMyApplications);
router.post('/saved-jobs/toggle', CandidateController.toggleSaveJob);
router.get('/saved-jobs', CandidateController.getSavedJobs);
router.get('/interviews', CandidateController.getMyInterviews);

export default router;

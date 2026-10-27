import { Router } from 'express';
import { MatchController } from '../controllers/match.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { requireCandidateRole, requireCompanyRole } from '../middleware/rbac.middleware.js';

const router = Router();

// Candidate Match endpoints
router.post('/jobs', authenticateJwt, requireCandidateRole, MatchController.matchJobs);
router.get('/jobs', authenticateJwt, requireCandidateRole, MatchController.getMyJobMatches);

// Company / Recruiter Match endpoints
router.post('/candidates', authenticateJwt, requireCompanyRole, MatchController.matchCandidates);
router.get('/candidates/:jobId', authenticateJwt, requireCompanyRole, MatchController.getCandidatesForJob);

export default router;

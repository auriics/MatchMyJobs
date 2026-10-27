import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import {
  requireCompanyRole,
  requireRecruiterRole,
  requireHiringManagerRole,
  requireAdsManagerRole,
  requireCompanyOwnerRole,
  requireOrgMembership,
} from '../middleware/rbac.middleware.js';

import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, SVG, WEBP) are allowed for company logo'));
    }
  },
});

const router = Router();

// Base middleware for all company endpoints: authenticated + authorized company role + valid org
router.use(authenticateJwt, requireCompanyRole, requireOrgMembership);

// ==========================================
// COMPANY PROFILE ROUTES
// ==========================================
router.get('/profile', CompanyController.getCompanyProfile);
router.put('/profile', upload.single('logo'), CompanyController.updateCompanyProfile);

// ==========================================
// RECRUITER ROUTES
// ==========================================
router.get('/jobs', requireRecruiterRole, CompanyController.getJobs);
router.post('/jobs', requireRecruiterRole, CompanyController.createJob);
router.put('/jobs/:id', requireRecruiterRole, CompanyController.updateJob);
router.get('/applications', requireRecruiterRole, CompanyController.getApplications);
router.patch('/applications/:id/stage', requireRecruiterRole, CompanyController.updateApplicationStage);
router.post('/interviews', requireRecruiterRole, CompanyController.scheduleInterview);
router.get('/recruiter/stats', requireRecruiterRole, CompanyController.getRecruiterStats);

// ==========================================
// HIRING MANAGER ROUTES
// ==========================================
router.get('/hiring/assigned-jobs', requireHiringManagerRole, CompanyController.getAssignedJobs);
router.get('/hiring/shortlisted', requireHiringManagerRole, CompanyController.getShortlistedCandidates);
router.post('/hiring/evaluation', requireHiringManagerRole, CompanyController.submitEvaluation);
router.post('/hiring/decision', requireHiringManagerRole, CompanyController.submitHiringDecision);
router.get('/hiring/stats', requireHiringManagerRole, CompanyController.getHiringManagerStats);

// ==========================================
// ADS MANAGER ROUTES
// ==========================================
router.get('/ads/campaigns', requireAdsManagerRole, CompanyController.getCampaigns);
router.post('/ads/campaigns', requireAdsManagerRole, CompanyController.createCampaign);
router.patch('/ads/campaigns/:id/status', requireAdsManagerRole, CompanyController.updateCampaignStatus);
router.get('/ads/analytics', requireAdsManagerRole, CompanyController.getAdsAnalytics);

// ==========================================
// TEAM & INVITATION ROUTES (Company Owner & Super Admin)
// ==========================================
router.get('/team', requireCompanyRole, CompanyController.getMembers);
router.post('/team/invite', requireCompanyOwnerRole, CompanyController.inviteMember);
router.delete('/team/:id', requireCompanyOwnerRole, CompanyController.removeMember);

export default router;

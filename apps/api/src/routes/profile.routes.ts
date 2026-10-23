import { Router } from 'express';
import multer from 'multer';
import { ProfileController } from '../controllers/profile.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import {
  createCandidateProfileSchema,
  updateCandidateProfileSchema,
  createCompanyProfileSchema,
  updateCompanyProfileSchema,
} from '../schemas/profile.schema.js';

// Configure Multer for in-memory handling before streaming to S3/disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP, GIF) are allowed for avatars.'));
    }
  },
});

const router = Router();

// Candidate Profile Routes
router.post(
  '/candidate',
  authenticateJwt,
  validateBody(createCandidateProfileSchema),
  ProfileController.createCandidate
);

router.put(
  '/candidate',
  authenticateJwt,
  validateBody(updateCandidateProfileSchema),
  ProfileController.updateCandidate
);

router.get(
  '/candidate/:id',
  authenticateJwt,
  ProfileController.getCandidateById
);

// Company Profile Routes
router.post(
  '/company',
  authenticateJwt,
  validateBody(createCompanyProfileSchema),
  ProfileController.createCompany
);

router.put(
  '/company',
  authenticateJwt,
  validateBody(updateCompanyProfileSchema),
  ProfileController.updateCompany
);

router.get(
  '/company/:id',
  authenticateJwt,
  ProfileController.getCompanyById
);

// Avatar Upload
router.post(
  '/avatar',
  authenticateJwt,
  upload.single('avatar'),
  ProfileController.uploadAvatar
);

// Current User's full profile
router.get(
  '/me',
  authenticateJwt,
  ProfileController.getMyProfile
);

export default router;

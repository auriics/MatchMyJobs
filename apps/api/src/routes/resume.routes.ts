import { Router } from 'express';
import multer from 'multer';
import { ResumeController } from '../controllers/resume.controller.js';
import { authenticateJwt } from '../middleware/auth.middleware.js';
import { requireCandidateRole } from '../middleware/rbac.middleware.js';

// Configure Multer for PDF/DOCX file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMime = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'application/octet-stream',
    ];
    const allowedExt = ['.pdf', '.docx', '.doc', '.txt'];
    const hasValidExt = allowedExt.some((ext) =>
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (allowedMime.includes(file.mimetype) || hasValidExt) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Invalid file type. Only PDF and DOCX resume documents are accepted.'
        )
      );
    }
  },
});

const router = Router();

// Candidate auth required for resume management
router.use(authenticateJwt, requireCandidateRole);

router.post('/upload', upload.single('file'), ResumeController.uploadResume);
router.post('/parse', upload.single('file'), ResumeController.parseResume);
router.get('/', ResumeController.getResumes);

export default router;

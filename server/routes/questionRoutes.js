const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
  archiveQuestion,
  restoreQuestion,
  bulkArchiveQuestions,
  bulkRestoreQuestions,
  bulkUploadQuestions,
} = require('../controllers/questionController');
const { verifyJWT } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

// Multer temporary file storage for CSV upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `upload_${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only .csv files are supported.'));
    }
  },
});

router.use(verifyJWT, requireRole('ADMIN', 'TEACHER'));

router.get('/', getQuestions);
router.get('/:id', getQuestionById);
router.post('/', createQuestion);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);
router.post('/:id/duplicate', duplicateQuestion);
router.patch('/:id/archive', archiveQuestion);
router.patch('/:id/restore', restoreQuestion);
router.post('/bulk-archive', bulkArchiveQuestions);
router.post('/bulk-restore', bulkRestoreQuestions);
router.post('/bulk-upload', upload.single('file'), bulkUploadQuestions);

module.exports = router;

const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const recordController            = require('../controllers/recordController');
const { authenticate, authorize } = require('../middleware/auth');
const { pagination }              = require('../middleware/pagination');
const upload                      = require('../middleware/upload');
const validate                    = require('../middleware/validate');

router.use(authenticate);

// Medical records
router.get('/',       pagination(), recordController.getAllRecords);
router.get('/:id',                  recordController.getRecordById);

router.post(
  '/',
  authorize('doctor'),
  [body('diagnosis').notEmpty().withMessage('Diagnosis is required.'),
   body('patient_id').isUUID().withMessage('Valid patient_id is required.')],
  validate,
  recordController.createRecord
);

router.put('/:id',    authorize('admin', 'doctor'), recordController.updateRecord);
router.delete('/:id', authorize('admin'),           recordController.deleteRecord);

// Attachments
router.post('/:id/attachments',
  authorize('doctor', 'admin'),
  upload.single('file'),
  recordController.uploadAttachment
);
router.delete('/attachments/:attachmentId',
  authorize('doctor', 'admin'),
  recordController.deleteAttachment
);

// Prescriptions
router.post('/:id/prescriptions',
  authorize('doctor'),
  [body('items').isArray({ min: 1 }).withMessage('At least one prescription item is required.')],
  validate,
  recordController.createPrescription
);
router.get('/prescriptions/patient/:patientId', recordController.getPatientPrescriptions);
router.get('/prescription/:id',                 recordController.getPrescriptionById);

module.exports = router;

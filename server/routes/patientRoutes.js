const express  = require('express');
const router   = express.Router();
const patientController = require('../controllers/patientController');
const { authenticate, authorize } = require('../middleware/auth');
const { pagination }              = require('../middleware/pagination');

// All patient routes require authentication
router.use(authenticate);

router.get('/',        authorize('admin', 'doctor'), pagination(), patientController.getAllPatients);
router.get('/me',      authorize('patient'),                       patientController.getMyProfile);
router.get('/:id',     authorize('admin', 'doctor', 'patient'),   patientController.getPatientById);
router.get('/:id/summary', authorize('admin', 'doctor', 'patient'), patientController.getPatientSummary);
router.put('/:id',     authorize('admin', 'patient'),              patientController.updatePatient);
router.delete('/:id',  authorize('admin'),                         patientController.deletePatient);

module.exports = router;

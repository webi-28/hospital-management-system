const express  = require('express');
const router   = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticate, authorize } = require('../middleware/auth');
const { pagination }              = require('../middleware/pagination');

// Public routes
router.get('/',                   pagination(),  doctorController.getAllDoctors);
router.get('/specializations',                   doctorController.getSpecializations);
router.get('/departments',                        doctorController.getDepartments);
router.get('/:id',                               doctorController.getDoctorById);
router.get('/:id/slots',                         doctorController.getAvailableSlots);

// Doctor-only routes
router.get('/me/schedule',        authenticate, authorize('doctor'), doctorController.getMySchedule);
router.post('/me/schedule',       authenticate, authorize('doctor'), doctorController.upsertSchedule);

// Admin or doctor self-update
router.put('/:id',                authenticate, authorize('admin', 'doctor'), doctorController.updateDoctor);

// Admin only
router.delete('/:id',             authenticate, authorize('admin'), doctorController.deleteDoctor);

module.exports = router;

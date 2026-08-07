const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const appointmentController       = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');
const { pagination }              = require('../middleware/pagination');
const validate                    = require('../middleware/validate');

router.use(authenticate);

router.get('/',        pagination(), appointmentController.getAllAppointments);
router.get('/today',   authorize('doctor'), appointmentController.getTodayAppointments);
router.get('/:id',     appointmentController.getAppointmentById);

router.post(
  '/',
  authorize('admin', 'patient'),
  [
    body('doctor_id').isUUID().withMessage('Valid doctor_id is required.'),
    body('appointment_date').isDate().withMessage('Valid date is required.'),
    body('appointment_time').matches(/^\d{2}:\d{2}$/).withMessage('Time must be HH:MM format.'),
  ],
  validate,
  appointmentController.createAppointment
);

router.put(
  '/:id/status',
  [body('status').notEmpty().withMessage('Status is required.')],
  validate,
  appointmentController.updateStatus
);

router.put('/:id',     authorize('admin'), appointmentController.updateAppointment);
router.delete('/:id',  authorize('admin'), appointmentController.deleteAppointment);

module.exports = router;

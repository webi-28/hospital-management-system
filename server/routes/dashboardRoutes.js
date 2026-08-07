const express  = require('express');
const router   = express.Router();
const dashboardController         = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/admin',   authenticate, authorize('admin'),   dashboardController.getAdminDashboard);
router.get('/doctor',  authenticate, authorize('doctor'),  dashboardController.getDoctorDashboard);
router.get('/patient', authenticate, authorize('patient'), dashboardController.getPatientDashboard);

module.exports = router;

const express  = require('express');
const router   = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate }       = require('../middleware/auth');
const { pagination }         = require('../middleware/pagination');

router.use(authenticate);

router.get('/',              pagination(), notificationController.getNotifications);
router.put('/read-all',                    notificationController.markAllRead);
router.put('/:id/read',                    notificationController.markRead);
router.delete('/:id',                      notificationController.deleteNotification);

module.exports = router;

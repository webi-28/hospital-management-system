const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const billingController           = require('../controllers/billingController');
const { authenticate, authorize } = require('../middleware/auth');
const { pagination }              = require('../middleware/pagination');
const validate                    = require('../middleware/validate');

router.use(authenticate);

router.get('/',        pagination(), billingController.getAllBills);
router.get('/stats',   authorize('admin'), billingController.getRevenueStats);
router.get('/:id',     billingController.getBillById);

router.post(
  '/',
  authorize('admin'),
  [body('patient_id').isUUID().withMessage('Valid patient_id is required.')],
  validate,
  billingController.createBill
);

router.put('/:id',    authorize('admin'), billingController.updateBill);

router.post(
  '/:id/pay',
  authorize('admin'),
  [
    body('amount').isFloat({ gt: 0 }).withMessage('Valid payment amount is required.'),
    body('payment_method')
      .isIn(['cash','card','online','insurance'])
      .withMessage('Valid payment method is required.'),
  ],
  validate,
  billingController.recordPayment
);

router.delete('/:id', authorize('admin'), billingController.deleteBill);

module.exports = router;

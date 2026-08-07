const BillingModel     = require('../models/billingModel');
const PatientModel     = require('../models/patientModel');
const NotificationModel = require('../models/notificationModel');
const UserModel        = require('../models/userModel');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { buildPaginationMeta }    = require('../middleware/pagination');

// ── GET /api/billing ──────────────────────────────────────────────────────────
exports.getAllBills = asyncHandler(async (req, res) => {
  const { payment_status, from_date, to_date } = req.query;
  const { page, limit, offset } = req.pagination;

  let patientId = req.query.patient_id;
  if (req.user.role === 'patient') {
    const p = await PatientModel.findByUserId(req.user.id);
    if (!p) throw new AppError('Patient profile not found.', 404);
    patientId = p.id;
  }

  const { rows, total } = await BillingModel.findAll({
    patientId, paymentStatus: payment_status,
    fromDate: from_date, toDate: to_date,
    limit, offset,
  });

  res.json({
    success: true,
    data: rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

// ── GET /api/billing/stats ────────────────────────────────────────────────────
exports.getRevenueStats = asyncHandler(async (_req, res) => {
  const stats = await BillingModel.getRevenueStats();
  res.json({ success: true, data: stats });
});

// ── GET /api/billing/:id ──────────────────────────────────────────────────────
exports.getBillById = asyncHandler(async (req, res) => {
  const bill = await BillingModel.findById(req.params.id);
  if (!bill) throw new AppError('Bill not found.', 404);

  // Patients can only see their own bills
  if (req.user.role === 'patient') {
    const p = await PatientModel.findByUserId(req.user.id);
    if (!p || p.id !== bill.patient_id) throw new AppError('Not authorized.', 403);
  }

  res.json({ success: true, data: bill });
});

// ── POST /api/billing ─────────────────────────────────────────────────────────
exports.createBill = asyncHandler(async (req, res) => {
  const bill_number = await BillingModel.generateBillNumber();

  const bill = await BillingModel.create({ ...req.body, bill_number });

  // Notify patient
  const patient = await PatientModel.findById(bill.patient_id);
  if (patient) {
    const pUser = await UserModel.findById(patient.user_id);
    if (pUser) {
      await NotificationModel.create({
        user_id: pUser.id,
        title:   'New Bill Generated',
        message: `Bill #${bill_number} of amount $${bill.total_amount} has been generated.`,
        type:    'billing',
      });
    }
  }

  res.status(201).json({ success: true, message: 'Bill created.', data: bill });
});

// ── PUT /api/billing/:id ──────────────────────────────────────────────────────
exports.updateBill = asyncHandler(async (req, res) => {
  const bill = await BillingModel.findById(req.params.id);
  if (!bill) throw new AppError('Bill not found.', 404);
  if (bill.payment_status === 'paid') throw new AppError('Cannot modify a paid bill.', 400);

  const updated = await BillingModel.update(req.params.id, req.body);
  res.json({ success: true, message: 'Bill updated.', data: updated });
});

// ── POST /api/billing/:id/pay ─────────────────────────────────────────────────
exports.recordPayment = asyncHandler(async (req, res) => {
  const { amount, payment_method } = req.body;
  if (!amount || amount <= 0) throw new AppError('Valid payment amount is required.', 400);

  const bill = await BillingModel.findById(req.params.id);
  if (!bill) throw new AppError('Bill not found.', 404);
  if (bill.payment_status === 'paid') throw new AppError('Bill is already fully paid.', 400);

  const remaining = parseFloat(bill.total_amount) - parseFloat(bill.paid_amount);
  if (parseFloat(amount) > remaining) {
    throw new AppError(`Amount exceeds outstanding balance of $${remaining.toFixed(2)}.`, 400);
  }

  const updated = await BillingModel.recordPayment(req.params.id, amount, payment_method);

  // Notify patient
  const patient = await PatientModel.findById(bill.patient_id);
  if (patient) {
    const pUser = await UserModel.findById(patient.user_id);
    if (pUser) {
      await NotificationModel.create({
        user_id: pUser.id,
        title:   'Payment Received',
        message: `Payment of $${amount} received for Bill #${bill.bill_number}.`,
        type:    'billing',
      });
    }
  }

  res.json({ success: true, message: 'Payment recorded.', data: updated });
});

// ── DELETE /api/billing/:id  (admin only) ─────────────────────────────────────
exports.deleteBill = asyncHandler(async (req, res) => {
  const bill = await BillingModel.findById(req.params.id);
  if (!bill) throw new AppError('Bill not found.', 404);
  if (bill.payment_status === 'paid') throw new AppError('Cannot delete a paid bill.', 400);

  await BillingModel.delete(req.params.id);
  res.json({ success: true, message: 'Bill deleted.' });
});

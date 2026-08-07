const RecordModel      = require('../models/recordModel');
const DoctorModel      = require('../models/doctorModel');
const PatientModel     = require('../models/patientModel');
const NotificationModel = require('../models/notificationModel');
const cloudinary       = require('../config/cloudinary');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { buildPaginationMeta }    = require('../middleware/pagination');

// ── GET /api/records ──────────────────────────────────────────────────────────
exports.getAllRecords = asyncHandler(async (req, res) => {
  const { from_date, to_date } = req.query;
  const { page, limit, offset } = req.pagination;

  let patientId = req.query.patient_id;
  let doctorId  = req.query.doctor_id;

  if (req.user.role === 'patient') {
    const p = await PatientModel.findByUserId(req.user.id);
    if (!p) throw new AppError('Patient profile not found.', 404);
    patientId = p.id;
  }
  if (req.user.role === 'doctor') {
    const d = await DoctorModel.findByUserId(req.user.id);
    if (!d) throw new AppError('Doctor profile not found.', 404);
    doctorId = d.id;
  }

  const { rows, total } = await RecordModel.findAll({
    patientId, doctorId, fromDate: from_date, toDate: to_date, limit, offset,
  });

  res.json({
    success: true,
    data: rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

// ── GET /api/records/:id ──────────────────────────────────────────────────────
exports.getRecordById = asyncHandler(async (req, res) => {
  const record = await RecordModel.findById(req.params.id);
  if (!record) throw new AppError('Medical record not found.', 404);

  const attachments = await RecordModel.getAttachments(req.params.id);
  res.json({ success: true, data: { ...record, attachments } });
});

// ── POST /api/records ─────────────────────────────────────────────────────────
exports.createRecord = asyncHandler(async (req, res) => {
  const doctor = await DoctorModel.findByUserId(req.user.id);
  if (!doctor) throw new AppError('Doctor profile not found.', 404);

  const record = await RecordModel.create({
    ...req.body,
    doctor_id: doctor.id,
  });

  // Notify patient
  const patient = await PatientModel.findById(record.patient_id);
  if (patient) {
    const UserModel = require('../models/userModel');
    const pUser = await UserModel.findById(patient.user_id);
    if (pUser) {
      await NotificationModel.create({
        user_id: pUser.id,
        title:   'New Medical Record',
        message: `A new medical record has been added by your doctor.`,
        type:    'info',
      });
    }
  }

  res.status(201).json({ success: true, message: 'Medical record created.', data: record });
});

// ── PUT /api/records/:id ──────────────────────────────────────────────────────
exports.updateRecord = asyncHandler(async (req, res) => {
  const record = await RecordModel.findById(req.params.id);
  if (!record) throw new AppError('Medical record not found.', 404);

  if (req.user.role === 'doctor') {
    const doctor = await DoctorModel.findByUserId(req.user.id);
    if (!doctor || doctor.id !== record.doctor_id) throw new AppError('Not authorized.', 403);
  }

  const updated = await RecordModel.update(req.params.id, req.body);
  res.json({ success: true, message: 'Record updated.', data: updated });
});

// ── DELETE /api/records/:id ───────────────────────────────────────────────────
exports.deleteRecord = asyncHandler(async (req, res) => {
  const deleted = await RecordModel.delete(req.params.id);
  if (!deleted) throw new AppError('Medical record not found.', 404);
  res.json({ success: true, message: 'Record deleted.' });
});

// ── POST /api/records/:id/attachments ─────────────────────────────────────────
exports.uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded.', 400);

  const record = await RecordModel.findById(req.params.id);
  if (!record) throw new AppError('Medical record not found.', 404);

  const isCloudinary = !!process.env.CLOUDINARY_CLOUD_NAME;
  const file_url  = isCloudinary ? req.file.path : `/uploads/${req.file.filename}`;
  const public_id = isCloudinary ? req.file.filename : null;

  const attachment = await RecordModel.addAttachment({
    medical_record_id: req.params.id,
    patient_id:        record.patient_id,
    file_name:         req.file.originalname,
    file_url,
    file_type:         req.body.file_type || 'other',
    file_size:         req.file.size,
    public_id,
  });

  res.status(201).json({ success: true, message: 'File uploaded.', data: attachment });
});

// ── DELETE /api/records/attachments/:attachmentId ─────────────────────────────
exports.deleteAttachment = asyncHandler(async (req, res) => {
  const attachment = await RecordModel.deleteAttachment(req.params.attachmentId);
  if (!attachment) throw new AppError('Attachment not found.', 404);

  // Remove from Cloudinary if applicable
  if (attachment.public_id && process.env.CLOUDINARY_CLOUD_NAME) {
    await cloudinary.uploader.destroy(attachment.public_id, { resource_type: 'auto' });
  }

  res.json({ success: true, message: 'Attachment deleted.' });
});

// ── Prescriptions ─────────────────────────────────────────────────────────────

// POST /api/records/:id/prescriptions
exports.createPrescription = asyncHandler(async (req, res) => {
  const doctor = await DoctorModel.findByUserId(req.user.id);
  if (!doctor) throw new AppError('Doctor profile not found.', 404);

  const record = await RecordModel.findById(req.params.id);
  if (!record) throw new AppError('Medical record not found.', 404);

  const prescription = await RecordModel.createPrescription({
    medical_record_id: req.params.id,
    patient_id:        record.patient_id,
    doctor_id:         doctor.id,
    valid_until:       req.body.valid_until,
    notes:             req.body.notes,
    items:             req.body.items || [],
  });

  // Notify patient
  const patient = await PatientModel.findById(record.patient_id);
  if (patient) {
    const UserModel = require('../models/userModel');
    const pUser = await UserModel.findById(patient.user_id);
    if (pUser) {
      await NotificationModel.create({
        user_id: pUser.id,
        title:   'New Prescription',
        message: `Dr. ${req.user.full_name} has issued a new prescription for you.`,
        type:    'prescription',
      });
    }
  }

  res.status(201).json({ success: true, message: 'Prescription created.', data: prescription });
});

// GET /api/records/prescriptions/:patientId
exports.getPatientPrescriptions = asyncHandler(async (req, res) => {
  const prescriptions = await RecordModel.getPrescriptions(req.params.patientId);
  res.json({ success: true, data: prescriptions });
});

// GET /api/records/prescription/:id
exports.getPrescriptionById = asyncHandler(async (req, res) => {
  const prescription = await RecordModel.getPrescriptionById(req.params.id);
  if (!prescription) throw new AppError('Prescription not found.', 404);
  res.json({ success: true, data: prescription });
});

const PatientModel = require('../models/patientModel');
const UserModel    = require('../models/userModel');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { buildPaginationMeta }    = require('../middleware/pagination');

// ── GET /api/patients ─────────────────────────────────────────────────────────
exports.getAllPatients = asyncHandler(async (req, res) => {
  const { search, gender, blood_group } = req.query;
  const { page, limit, offset } = req.pagination;

  const { rows, total } = await PatientModel.findAll({
    search, gender, bloodGroup: blood_group, limit, offset,
  });

  res.json({
    success: true,
    data: rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

// ── GET /api/patients/:id ─────────────────────────────────────────────────────
exports.getPatientById = asyncHandler(async (req, res) => {
  const patient = await PatientModel.findById(req.params.id);
  if (!patient) throw new AppError('Patient not found.', 404);

  // Patients can only see themselves; admins/doctors see all
  if (req.user.role === 'patient') {
    const self = await PatientModel.findByUserId(req.user.id);
    if (!self || self.id !== patient.id) throw new AppError('Not authorized.', 403);
  }

  res.json({ success: true, data: patient });
});

// ── GET /api/patients/me ──────────────────────────────────────────────────────
exports.getMyProfile = asyncHandler(async (req, res) => {
  const patient = await PatientModel.findByUserId(req.user.id);
  if (!patient) throw new AppError('Patient profile not found.', 404);
  res.json({ success: true, data: patient });
});

// ── GET /api/patients/:id/summary ────────────────────────────────────────────
exports.getPatientSummary = asyncHandler(async (req, res) => {
  const patient = await PatientModel.findById(req.params.id);
  if (!patient) throw new AppError('Patient not found.', 404);

  const summary = await PatientModel.getSummary(req.params.id);
  res.json({ success: true, data: { patient, summary } });
});

// ── PUT /api/patients/:id ─────────────────────────────────────────────────────
exports.updatePatient = asyncHandler(async (req, res) => {
  const patient = await PatientModel.findById(req.params.id);
  if (!patient) throw new AppError('Patient not found.', 404);

  // Patients can only update their own profile
  if (req.user.role === 'patient' && patient.user_id !== req.user.id) {
    throw new AppError('Not authorized.', 403);
  }

  const updated = await PatientModel.update(req.params.id, req.body);

  // Sync common user fields
  const { full_name, phone, avatar_url } = req.body;
  if (full_name || phone || avatar_url) {
    await UserModel.update(patient.user_id, { full_name, phone, avatar_url });
  }

  res.json({ success: true, message: 'Patient updated.', data: updated });
});

// ── DELETE /api/patients/:id  (admin only) ────────────────────────────────────
exports.deletePatient = asyncHandler(async (req, res) => {
  const patient = await PatientModel.findById(req.params.id);
  if (!patient) throw new AppError('Patient not found.', 404);
  await UserModel.update(patient.user_id, { is_active: false });
  res.json({ success: true, message: 'Patient deactivated.' });
});

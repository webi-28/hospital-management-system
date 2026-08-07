const DoctorModel  = require('../models/doctorModel');
const UserModel    = require('../models/userModel');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { buildPaginationMeta }    = require('../middleware/pagination');

// ── GET /api/doctors ──────────────────────────────────────────────────────────
exports.getAllDoctors = asyncHandler(async (req, res) => {
  const { search, specialization, department_id } = req.query;
  const { page, limit, offset } = req.pagination;

  const { rows, total } = await DoctorModel.findAll({
    search, specialization, departmentId: department_id, limit, offset,
  });

  res.json({
    success: true,
    data: rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

// ── GET /api/doctors/specializations ─────────────────────────────────────────
exports.getSpecializations = asyncHandler(async (_req, res) => {
  const list = await DoctorModel.getSpecializations();
  res.json({ success: true, data: list });
});

// ── GET /api/doctors/departments ──────────────────────────────────────────────
exports.getDepartments = asyncHandler(async (_req, res) => {
  const list = await DoctorModel.getDepartments();
  res.json({ success: true, data: list });
});

// ── GET /api/doctors/:id ──────────────────────────────────────────────────────
exports.getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await DoctorModel.findById(req.params.id);
  if (!doctor) throw new AppError('Doctor not found.', 404);
  res.json({ success: true, data: doctor });
});

// ── GET /api/doctors/:id/slots ────────────────────────────────────────────────
exports.getAvailableSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date) throw new AppError('Date is required.', 400);

  const doctor = await DoctorModel.findById(req.params.id);
  if (!doctor) throw new AppError('Doctor not found.', 404);

  // Check doctor works on this day
  const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  const worksDays = doctor.available_days || [];
  if (worksDays.length > 0 && !worksDays.includes(dayName)) {
    return res.json({ success: true, data: { slots: [], message: 'Doctor not available on this day.' } });
  }

  const AppointmentModel = require('../models/appointmentModel');
  const booked = await AppointmentModel.getBookedSlots(req.params.id, date);

  // Generate 30-min slots between available_from and available_to
  const from  = doctor.available_from || '09:00';
  const to    = doctor.available_to   || '17:00';
  const slots = generateSlots(from, to, 30);
  const available = slots.filter((s) => !booked.includes(s));

  res.json({ success: true, data: { slots: available, booked } });
});

// ── GET /api/doctors/me/schedule ──────────────────────────────────────────────
exports.getMySchedule = asyncHandler(async (req, res) => {
  const doctor = await DoctorModel.findByUserId(req.user.id);
  if (!doctor) throw new AppError('Doctor profile not found.', 404);

  const { from_date, to_date } = req.query;
  const from = from_date || new Date().toISOString().slice(0, 10);
  const to   = to_date   || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const schedules = await DoctorModel.getSchedules(doctor.id, from, to);
  res.json({ success: true, data: schedules });
});

// ── POST /api/doctors/me/schedule ─────────────────────────────────────────────
exports.upsertSchedule = asyncHandler(async (req, res) => {
  const doctor = await DoctorModel.findByUserId(req.user.id);
  if (!doctor) throw new AppError('Doctor profile not found.', 404);

  const schedule = await DoctorModel.upsertSchedule({ doctor_id: doctor.id, ...req.body });
  res.json({ success: true, data: schedule });
});

// ── PUT /api/doctors/:id  (admin or self) ─────────────────────────────────────
exports.updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await DoctorModel.findById(req.params.id);
  if (!doctor) throw new AppError('Doctor not found.', 404);

  // Non-admin can only update their own profile
  if (req.user.role !== 'admin' && doctor.user_id !== req.user.id) {
    throw new AppError('Not authorized.', 403);
  }

  const updated = await DoctorModel.update(req.params.id, req.body);

  // Sync name / phone / avatar back to users table
  const { full_name, phone, avatar_url } = req.body;
  if (full_name || phone || avatar_url) {
    await UserModel.update(doctor.user_id, { full_name, phone, avatar_url });
  }

  res.json({ success: true, message: 'Doctor updated.', data: updated });
});

// ── DELETE /api/doctors/:id  (admin only) ─────────────────────────────────────
exports.deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await DoctorModel.findById(req.params.id);
  if (!doctor) throw new AppError('Doctor not found.', 404);
  await DoctorModel.delete(req.params.id);
  await UserModel.update(doctor.user_id, { is_active: false });
  res.json({ success: true, message: 'Doctor deactivated.' });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateSlots(from, to, intervalMinutes) {
  const slots = [];
  let [h, m] = from.split(':').map(Number);
  const [endH, endM] = to.split(':').map(Number);

  while (h * 60 + m < endH * 60 + endM) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += intervalMinutes;
    if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
  }
  return slots;
}

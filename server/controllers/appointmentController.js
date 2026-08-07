const AppointmentModel = require('../models/appointmentModel');
const PatientModel     = require('../models/patientModel');
const DoctorModel      = require('../models/doctorModel');
const NotificationModel = require('../models/notificationModel');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { buildPaginationMeta }    = require('../middleware/pagination');

// ── GET /api/appointments ─────────────────────────────────────────────────────
exports.getAllAppointments = asyncHandler(async (req, res) => {
  const { status, from_date, to_date, patient_id, doctor_id } = req.query;
  const { page, limit, offset } = req.pagination;

  // Scope by role
  let pId = patient_id;
  let dId = doctor_id;

  if (req.user.role === 'patient') {
    const patient = await PatientModel.findByUserId(req.user.id);
    if (!patient) throw new AppError('Patient profile not found.', 404);
    pId = patient.id;
  }
  if (req.user.role === 'doctor') {
    const doctor = await DoctorModel.findByUserId(req.user.id);
    if (!doctor) throw new AppError('Doctor profile not found.', 404);
    dId = doctor.id;
  }

  const { rows, total } = await AppointmentModel.findAll({
    patientId: pId, doctorId: dId, status,
    fromDate: from_date, toDate: to_date,
    limit, offset,
  });

  res.json({
    success: true,
    data: rows,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

// ── GET /api/appointments/today (doctor) ──────────────────────────────────────
exports.getTodayAppointments = asyncHandler(async (req, res) => {
  const doctor = await DoctorModel.findByUserId(req.user.id);
  if (!doctor) throw new AppError('Doctor profile not found.', 404);

  const appointments = await AppointmentModel.getTodayForDoctor(doctor.id);
  res.json({ success: true, data: appointments });
});

// ── GET /api/appointments/:id ─────────────────────────────────────────────────
exports.getAppointmentById = asyncHandler(async (req, res) => {
  const appt = await AppointmentModel.findById(req.params.id);
  if (!appt) throw new AppError('Appointment not found.', 404);
  res.json({ success: true, data: appt });
});

// ── POST /api/appointments ────────────────────────────────────────────────────
exports.createAppointment = asyncHandler(async (req, res) => {
  const { doctor_id, appointment_date, appointment_time, type, reason, duration_minutes } = req.body;

  // Resolve patient_id
  let patient_id = req.body.patient_id;
  if (req.user.role === 'patient') {
    const patient = await PatientModel.findByUserId(req.user.id);
    if (!patient) throw new AppError('Patient profile not found.', 404);
    patient_id = patient.id;
  }

  if (!patient_id) throw new AppError('patient_id is required.', 400);

  // Verify doctor exists
  const doctor = await DoctorModel.findById(doctor_id);
  if (!doctor) throw new AppError('Doctor not found.', 404);

  // Check slot availability
  const taken = await AppointmentModel.isSlotTaken(doctor_id, appointment_date, appointment_time);
  if (taken) throw new AppError('This time slot is already booked. Please choose another.', 409);

  const appointment = await AppointmentModel.create({
    patient_id, doctor_id, appointment_date, appointment_time,
    duration_minutes, type, reason,
  });

  // Notify doctor
  await NotificationModel.create({
    user_id: doctor.user_id,
    title:   'New Appointment',
    message: `You have a new appointment on ${appointment_date} at ${appointment_time}.`,
    type:    'appointment',
  });

  res.status(201).json({ success: true, message: 'Appointment booked.', data: appointment });
});

// ── PUT /api/appointments/:id/status ─────────────────────────────────────────
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, notes, cancellation_reason } = req.body;
  const appt = await AppointmentModel.findById(req.params.id);
  if (!appt) throw new AppError('Appointment not found.', 404);

  // Role-based permission
  const allowed = {
    admin:   ['confirmed','cancelled','completed','no_show','pending'],
    doctor:  ['confirmed','completed','no_show'],
    patient: ['cancelled'],
  };
  if (!allowed[req.user.role]?.includes(status)) {
    throw new AppError(`Your role cannot set status to "${status}".`, 403);
  }

  const updated = await AppointmentModel.updateStatus(
    req.params.id, status, notes, cancellation_reason
  );

  // Notify patient on status change
  const PatModel = require('../models/patientModel');
  const patient  = await PatModel.findById(appt.patient_id);
  if (patient) {
    const UserModel = require('../models/userModel');
    const pUser = await UserModel.findById(patient.user_id);
    if (pUser) {
      await NotificationModel.create({
        user_id: pUser.id,
        title:   'Appointment Update',
        message: `Your appointment on ${appt.appointment_date} has been ${status}.`,
        type:    'appointment',
      });
    }
  }

  res.json({ success: true, message: `Appointment ${status}.`, data: updated });
});

// ── PUT /api/appointments/:id ─────────────────────────────────────────────────
exports.updateAppointment = asyncHandler(async (req, res) => {
  const appt = await AppointmentModel.findById(req.params.id);
  if (!appt) throw new AppError('Appointment not found.', 404);

  // If rescheduling, check slot
  if (req.body.appointment_date || req.body.appointment_time) {
    const newDate = req.body.appointment_date || appt.appointment_date;
    const newTime = req.body.appointment_time || appt.appointment_time;
    const taken = await AppointmentModel.isSlotTaken(
      appt.doctor_id, newDate, newTime, req.params.id
    );
    if (taken) throw new AppError('This time slot is already booked.', 409);
  }

  const updated = await AppointmentModel.update(req.params.id, req.body);
  res.json({ success: true, message: 'Appointment updated.', data: updated });
});

// ── DELETE /api/appointments/:id  (admin only) ────────────────────────────────
exports.deleteAppointment = asyncHandler(async (req, res) => {
  const deleted = await AppointmentModel.delete(req.params.id);
  if (!deleted) throw new AppError('Appointment not found.', 404);
  res.json({ success: true, message: 'Appointment deleted.' });
});

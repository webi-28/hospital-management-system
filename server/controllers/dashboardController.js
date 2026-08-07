const { query }        = require('../config/db');
const AppointmentModel = require('../models/appointmentModel');
const BillingModel     = require('../models/billingModel');
const PatientModel     = require('../models/patientModel');
const DoctorModel      = require('../models/doctorModel');
const { asyncHandler } = require('../middleware/errorHandler');

// ── GET /api/dashboard/admin ──────────────────────────────────────────────────
exports.getAdminDashboard = asyncHandler(async (_req, res) => {
  const [
    apptStats,
    revenueStats,
    totalPatients,
    totalDoctors,
    recentAppointments,
    monthlyRevenue,
    topDoctors,
  ] = await Promise.all([
    AppointmentModel.getStats(),
    BillingModel.getRevenueStats(),
    query('SELECT COUNT(*) FROM patients'),
    query('SELECT COUNT(*) FROM doctors'),
    query(`
      SELECT a.id, a.appointment_date, a.appointment_time, a.status, a.type,
             up.full_name AS patient_name, ud.full_name AS doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id JOIN users up ON p.user_id = up.id
      JOIN doctors  d ON a.doctor_id  = d.id JOIN users ud ON d.user_id = ud.id
      ORDER BY a.created_at DESC LIMIT 10`),
    query(`
      SELECT TO_CHAR(bill_date,'Mon YYYY') AS month,
             date_trunc('month', bill_date) AS sort_date,
             COALESCE(SUM(total_amount),0) AS revenue
      FROM bills
      WHERE bill_date >= NOW() - INTERVAL '6 months'
      GROUP BY month, sort_date ORDER BY sort_date`),
    query(`
      SELECT ud.full_name, d.specialization,
             COUNT(a.id) AS total_appointments,
             AVG(d.rating) AS avg_rating
      FROM doctors d
      JOIN users ud ON d.user_id = ud.id
      LEFT JOIN appointments a ON a.doctor_id = d.id
      GROUP BY d.id, ud.full_name, d.specialization
      ORDER BY total_appointments DESC LIMIT 5`),
  ]);

  res.json({
    success: true,
    data: {
      appointments:       apptStats,
      revenue:            revenueStats,
      total_patients:     parseInt(totalPatients.rows[0].count, 10),
      total_doctors:      parseInt(totalDoctors.rows[0].count, 10),
      recent_appointments: recentAppointments.rows,
      monthly_revenue:    monthlyRevenue.rows,
      top_doctors:        topDoctors.rows,
    },
  });
});

// ── GET /api/dashboard/doctor ─────────────────────────────────────────────────
exports.getDoctorDashboard = asyncHandler(async (req, res) => {
  const doctor = await DoctorModel.findByUserId(req.user.id);
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
  }

  const [todayAppts, stats, recentPatients, upcomingAppts] = await Promise.all([
    AppointmentModel.getTodayForDoctor(doctor.id),
    query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status='completed') AS completed,
        COUNT(*) FILTER (WHERE status='cancelled') AS cancelled,
        COUNT(*) FILTER (WHERE appointment_date = CURRENT_DATE) AS today
      FROM appointments WHERE doctor_id = $1`, [doctor.id]),
    query(`
      SELECT DISTINCT ON (p.id) p.id, up.full_name, p.gender, p.blood_group, p.date_of_birth,
             a.appointment_date AS last_visit
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users up ON p.user_id = up.id
      WHERE a.doctor_id = $1 AND a.status = 'completed'
      ORDER BY p.id, a.appointment_date DESC LIMIT 10`, [doctor.id]),
    query(`
      SELECT a.id, a.appointment_date, a.appointment_time, a.type, a.reason,
             up.full_name AS patient_name, p.gender
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id JOIN users up ON p.user_id = up.id
      WHERE a.doctor_id = $1 AND a.appointment_date > CURRENT_DATE
      AND a.status IN ('pending','confirmed')
      ORDER BY a.appointment_date, a.appointment_time LIMIT 10`, [doctor.id]),
  ]);

  res.json({
    success: true,
    data: {
      doctor,
      today_appointments:    todayAppts,
      stats:                 stats.rows[0],
      recent_patients:       recentPatients.rows,
      upcoming_appointments: upcomingAppts.rows,
    },
  });
});

// ── GET /api/dashboard/patient ────────────────────────────────────────────────
exports.getPatientDashboard = asyncHandler(async (req, res) => {
  const patient = await PatientModel.findByUserId(req.user.id);
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient profile not found.' });
  }

  const summary = await PatientModel.getSummary(patient.id);

  const [upcomingAppts, recentRecords, recentBills] = await Promise.all([
    query(`
      SELECT a.id, a.appointment_date, a.appointment_time, a.status, a.type,
             ud.full_name AS doctor_name, d.specialization, ud.avatar_url AS doctor_avatar
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id JOIN users ud ON d.user_id = ud.id
      WHERE a.patient_id = $1 AND a.appointment_date >= CURRENT_DATE
      AND a.status IN ('pending','confirmed')
      ORDER BY a.appointment_date, a.appointment_time LIMIT 5`, [patient.id]),
    query(`
      SELECT mr.id, mr.record_date, mr.diagnosis, ud.full_name AS doctor_name, d.specialization
      FROM medical_records mr
      JOIN doctors d ON mr.doctor_id = d.id JOIN users ud ON d.user_id = ud.id
      WHERE mr.patient_id = $1 ORDER BY mr.record_date DESC LIMIT 5`, [patient.id]),
    query(`
      SELECT id, bill_number, bill_date, total_amount, payment_status
      FROM bills WHERE patient_id = $1
      ORDER BY bill_date DESC LIMIT 5`, [patient.id]),
  ]);

  res.json({
    success: true,
    data: {
      patient,
      summary,
      upcoming_appointments: upcomingAppts.rows,
      recent_records:        recentRecords.rows,
      recent_bills:          recentBills.rows,
    },
  });
});

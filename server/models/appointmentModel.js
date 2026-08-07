const { query, getClient } = require('../config/db');

const AppointmentModel = {
  findById: async (id) => {
    const result = await query(
      `SELECT a.*,
              up.full_name AS patient_name, up.email AS patient_email, up.phone AS patient_phone,
              ud.full_name AS doctor_name,
              d.specialization, d.consultation_fee,
              dep.name AS department_name
       FROM appointments a
       JOIN patients p  ON a.patient_id = p.id
       JOIN users up    ON p.user_id    = up.id
       JOIN doctors d   ON a.doctor_id  = d.id
       JOIN users ud    ON d.user_id    = ud.id
       LEFT JOIN departments dep ON d.department_id = dep.id
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  findAll: async ({ patientId, doctorId, status, fromDate, toDate, limit, offset }) => {
    let sql = `
      SELECT a.id, a.appointment_date, a.appointment_time, a.duration_minutes,
             a.status, a.type, a.reason, a.notes, a.created_at,
             up.full_name AS patient_name, up.phone AS patient_phone,
             ud.full_name AS doctor_name, ud.avatar_url AS doctor_avatar,
             d.specialization, d.consultation_fee,
             dep.name AS department_name
      FROM appointments a
      JOIN patients p  ON a.patient_id = p.id
      JOIN users up    ON p.user_id    = up.id
      JOIN doctors d   ON a.doctor_id  = d.id
      JOIN users ud    ON d.user_id    = ud.id
      LEFT JOIN departments dep ON d.department_id = dep.id
      WHERE 1=1`;
    const params = [];

    if (patientId) {
      params.push(patientId);
      sql += ` AND a.patient_id = $${params.length}`;
    }
    if (doctorId) {
      params.push(doctorId);
      sql += ` AND a.doctor_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND a.status = $${params.length}`;
    }
    if (fromDate) {
      params.push(fromDate);
      sql += ` AND a.appointment_date >= $${params.length}`;
    }
    if (toDate) {
      params.push(toDate);
      sql += ` AND a.appointment_date <= $${params.length}`;
    }

    const countResult = await query(`SELECT COUNT(*) FROM (${sql}) sub`, params);

    params.push(limit, offset);
    sql += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const rows = await query(sql, params);
    return { rows: rows.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  // Check if a slot is already booked
  isSlotTaken: async (doctorId, date, time, excludeId = null) => {
    let sql = `SELECT id FROM appointments
               WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3
               AND status NOT IN ('cancelled','no_show')`;
    const params = [doctorId, date, time];
    if (excludeId) {
      params.push(excludeId);
      sql += ` AND id != $${params.length}`;
    }
    const result = await query(sql, params);
    return result.rows.length > 0;
  },

  // Get booked slots for a doctor on a specific date
  getBookedSlots: async (doctorId, date) => {
    const result = await query(
      `SELECT appointment_time FROM appointments
       WHERE doctor_id = $1 AND appointment_date = $2
       AND status NOT IN ('cancelled','no_show')
       ORDER BY appointment_time`,
      [doctorId, date]
    );
    return result.rows.map((r) => r.appointment_time);
  },

  // Today's appointments for a doctor
  getTodayForDoctor: async (doctorId) => {
    const result = await query(
      `SELECT a.id, a.appointment_time, a.status, a.type, a.reason,
              up.full_name AS patient_name, up.phone AS patient_phone,
              p.date_of_birth, p.gender, p.blood_group
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN users up   ON p.user_id    = up.id
       WHERE a.doctor_id = $1 AND a.appointment_date = CURRENT_DATE
       AND a.status NOT IN ('cancelled')
       ORDER BY a.appointment_time`,
      [doctorId]
    );
    return result.rows;
  },

  create: async ({ patient_id, doctor_id, appointment_date, appointment_time,
                   duration_minutes, type, reason }) => {
    const result = await query(
      `INSERT INTO appointments
         (patient_id, doctor_id, appointment_date, appointment_time,
          duration_minutes, type, reason, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')
       RETURNING *`,
      [patient_id, doctor_id, appointment_date, appointment_time,
       duration_minutes || 30, type || 'consultation', reason || null]
    );
    return result.rows[0];
  },

  updateStatus: async (id, status, notes = null, cancellation_reason = null) => {
    const result = await query(
      `UPDATE appointments SET status = $1, notes = COALESCE($2, notes),
       cancellation_reason = COALESCE($3, cancellation_reason)
       WHERE id = $4 RETURNING *`,
      [status, notes, cancellation_reason, id]
    );
    return result.rows[0] || null;
  },

  update: async (id, fields) => {
    const allowed = ['appointment_date', 'appointment_time', 'duration_minutes',
                     'status', 'type', 'reason', 'notes', 'cancellation_reason'];
    const sets = [];
    const params = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        params.push(fields[key]);
        sets.push(`${key} = $${params.length}`);
      }
    }
    if (sets.length === 0) return null;

    params.push(id);
    const result = await query(
      `UPDATE appointments SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return result.rows[0] || null;
  },

  delete: async (id) => {
    const result = await query(
      `DELETE FROM appointments WHERE id = $1 RETURNING id`, [id]
    );
    return result.rows[0] || null;
  },

  // Stats for dashboard
  getStats: async () => {
    const result = await query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status='pending')   AS pending,
         COUNT(*) FILTER (WHERE status='confirmed') AS confirmed,
         COUNT(*) FILTER (WHERE status='completed') AS completed,
         COUNT(*) FILTER (WHERE status='cancelled') AS cancelled,
         COUNT(*) FILTER (WHERE appointment_date = CURRENT_DATE) AS today
       FROM appointments`
    );
    return result.rows[0];
  },
};

module.exports = AppointmentModel;

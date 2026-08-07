const { query } = require('../config/db');

const DoctorModel = {
  // ── Find ──────────────────────────────────────────────────────────────────

  findById: async (id) => {
    const result = await query(
      `SELECT d.*, u.full_name, u.email, u.phone, u.avatar_url, u.is_active,
              dep.name AS department_name
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN departments dep ON d.department_id = dep.id
       WHERE d.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  findByUserId: async (userId) => {
    const result = await query(
      `SELECT d.*, u.full_name, u.email, u.phone, u.avatar_url,
              dep.name AS department_name
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN departments dep ON d.department_id = dep.id
       WHERE d.user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  },

  findAll: async ({ search, specialization, departmentId, limit, offset }) => {
    let sql = `
      SELECT d.id, d.specialization, d.experience_years, d.consultation_fee,
             d.available_days, d.available_from, d.available_to, d.rating,
             d.qualification, d.bio, d.department_id,
             u.full_name, u.email, u.phone, u.avatar_url, u.is_active,
             dep.name AS department_name
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN departments dep ON d.department_id = dep.id
      WHERE u.is_active = TRUE`;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (u.full_name ILIKE $${params.length} OR d.specialization ILIKE $${params.length})`;
    }
    if (specialization) {
      params.push(`%${specialization}%`);
      sql += ` AND d.specialization ILIKE $${params.length}`;
    }
    if (departmentId) {
      params.push(departmentId);
      sql += ` AND d.department_id = $${params.length}`;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM (${sql}) sub`, params
    );

    params.push(limit, offset);
    sql += ` ORDER BY u.full_name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const rows = await query(sql, params);
    return { rows: rows.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  // ── Create / Update ───────────────────────────────────────────────────────

  create: async ({
    user_id, department_id, specialization, qualification,
    experience_years, consultation_fee, bio, license_number,
    available_days, available_from, available_to, max_appointments_per_day,
  }) => {
    const result = await query(
      `INSERT INTO doctors
         (user_id, department_id, specialization, qualification, experience_years,
          consultation_fee, bio, license_number, available_days,
          available_from, available_to, max_appointments_per_day)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        user_id, department_id || null, specialization, qualification || null,
        experience_years || 0, consultation_fee || 0, bio || null,
        license_number || null, available_days || [],
        available_from || null, available_to || null,
        max_appointments_per_day || 20,
      ]
    );
    return result.rows[0];
  },

  update: async (id, fields) => {
    const allowed = [
      'department_id', 'specialization', 'qualification', 'experience_years',
      'consultation_fee', 'bio', 'license_number', 'available_days',
      'available_from', 'available_to', 'max_appointments_per_day',
    ];
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
      `UPDATE doctors SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return result.rows[0] || null;
  },

  delete: async (id) => {
    const result = await query(
      `DELETE FROM doctors WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows[0] || null;
  },

  // ── Schedules ─────────────────────────────────────────────────────────────

  getSchedules: async (doctorId, fromDate, toDate) => {
    const result = await query(
      `SELECT * FROM doctor_schedules
       WHERE doctor_id = $1 AND schedule_date BETWEEN $2 AND $3
       ORDER BY schedule_date, start_time`,
      [doctorId, fromDate, toDate]
    );
    return result.rows;
  },

  upsertSchedule: async ({ doctor_id, schedule_date, start_time, end_time, is_available, reason }) => {
    const result = await query(
      `INSERT INTO doctor_schedules (doctor_id, schedule_date, start_time, end_time, is_available, reason)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (doctor_id, schedule_date, start_time)
       DO UPDATE SET end_time = EXCLUDED.end_time,
                     is_available = EXCLUDED.is_available,
                     reason = EXCLUDED.reason
       RETURNING *`,
      [doctor_id, schedule_date, start_time, end_time, is_available ?? true, reason || null]
    );
    return result.rows[0];
  },

  getDepartments: async () => {
    const result = await query(`SELECT * FROM departments ORDER BY name`);
    return result.rows;
  },

  getSpecializations: async () => {
    const result = await query(
      `SELECT DISTINCT specialization FROM doctors ORDER BY specialization`
    );
    return result.rows.map((r) => r.specialization);
  },
};

module.exports = DoctorModel;

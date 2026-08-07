const { query } = require('../config/db');

const PatientModel = {
  findById: async (id) => {
    const result = await query(
      `SELECT p.*, u.full_name, u.email, u.phone, u.avatar_url, u.is_active
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  findByUserId: async (userId) => {
    const result = await query(
      `SELECT p.*, u.full_name, u.email, u.phone, u.avatar_url
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  },

  findAll: async ({ search, gender, bloodGroup, limit, offset }) => {
    let sql = `
      SELECT p.id, p.date_of_birth, p.gender, p.blood_group, p.address,
             p.allergies, p.chronic_diseases, p.insurance_provider,
             p.insurance_number, p.created_at,
             u.full_name, u.email, u.phone, u.avatar_url, u.is_active
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1`;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length})`;
    }
    if (gender) {
      params.push(gender);
      sql += ` AND p.gender = $${params.length}`;
    }
    if (bloodGroup) {
      params.push(bloodGroup);
      sql += ` AND p.blood_group = $${params.length}`;
    }

    const countResult = await query(`SELECT COUNT(*) FROM (${sql}) sub`, params);

    params.push(limit, offset);
    sql += ` ORDER BY u.full_name ASC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const rows = await query(sql, params);
    return { rows: rows.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  create: async ({
    user_id, date_of_birth, gender, blood_group, address,
    emergency_contact_name, emergency_contact_phone,
    allergies, chronic_diseases, insurance_provider, insurance_number,
  }) => {
    const result = await query(
      `INSERT INTO patients
         (user_id, date_of_birth, gender, blood_group, address,
          emergency_contact_name, emergency_contact_phone,
          allergies, chronic_diseases, insurance_provider, insurance_number)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        user_id, date_of_birth || null, gender || null, blood_group || null,
        address || null, emergency_contact_name || null,
        emergency_contact_phone || null, allergies || [],
        chronic_diseases || [], insurance_provider || null, insurance_number || null,
      ]
    );
    return result.rows[0];
  },

  update: async (id, fields) => {
    const allowed = [
      'date_of_birth', 'gender', 'blood_group', 'address',
      'emergency_contact_name', 'emergency_contact_phone',
      'allergies', 'chronic_diseases', 'insurance_provider', 'insurance_number',
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
      `UPDATE patients SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return result.rows[0] || null;
  },

  // Summary stats for a patient
  getSummary: async (patientId) => {
    const [appts, records, bills] = await Promise.all([
      query(
        `SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status='completed') AS completed,
                COUNT(*) FILTER (WHERE status='pending' OR status='confirmed') AS upcoming
         FROM appointments WHERE patient_id = $1`,
        [patientId]
      ),
      query(
        `SELECT COUNT(*) AS total FROM medical_records WHERE patient_id = $1`,
        [patientId]
      ),
      query(
        `SELECT COUNT(*) AS total,
                COALESCE(SUM(total_amount),0) AS total_spent,
                COUNT(*) FILTER (WHERE payment_status='unpaid') AS unpaid_count
         FROM bills WHERE patient_id = $1`,
        [patientId]
      ),
    ]);
    return {
      appointments: appts.rows[0],
      records:      records.rows[0],
      billing:      bills.rows[0],
    };
  },
};

module.exports = PatientModel;

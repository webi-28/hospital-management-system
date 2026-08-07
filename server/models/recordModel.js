const { query } = require('../config/db');

const RecordModel = {
  // ── Medical Records ───────────────────────────────────────────────────────

  findById: async (id) => {
    const result = await query(
      `SELECT mr.*,
              up.full_name AS patient_name,
              ud.full_name AS doctor_name, d.specialization
       FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.id
       JOIN users up   ON p.user_id     = up.id
       JOIN doctors d  ON mr.doctor_id  = d.id
       JOIN users ud   ON d.user_id     = ud.id
       WHERE mr.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  findAll: async ({ patientId, doctorId, fromDate, toDate, limit, offset }) => {
    let sql = `
      SELECT mr.id, mr.record_date, mr.diagnosis, mr.symptoms,
             mr.treatment_plan, mr.follow_up_date, mr.created_at,
             up.full_name AS patient_name,
             ud.full_name AS doctor_name, d.specialization
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      JOIN users up   ON p.user_id     = up.id
      JOIN doctors d  ON mr.doctor_id  = d.id
      JOIN users ud   ON d.user_id     = ud.id
      WHERE 1=1`;
    const params = [];

    if (patientId) { params.push(patientId); sql += ` AND mr.patient_id = $${params.length}`; }
    if (doctorId)  { params.push(doctorId);  sql += ` AND mr.doctor_id  = $${params.length}`; }
    if (fromDate)  { params.push(fromDate);  sql += ` AND mr.record_date >= $${params.length}`; }
    if (toDate)    { params.push(toDate);    sql += ` AND mr.record_date <= $${params.length}`; }

    const countResult = await query(`SELECT COUNT(*) FROM (${sql}) sub`, params);

    params.push(limit, offset);
    sql += ` ORDER BY mr.record_date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const rows = await query(sql, params);
    return { rows: rows.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  create: async ({ patient_id, doctor_id, appointment_id, record_date,
                   diagnosis, symptoms, treatment_plan, notes, follow_up_date }) => {
    const result = await query(
      `INSERT INTO medical_records
         (patient_id, doctor_id, appointment_id, record_date,
          diagnosis, symptoms, treatment_plan, notes, follow_up_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [patient_id, doctor_id, appointment_id || null, record_date || new Date(),
       diagnosis, symptoms || null, treatment_plan || null, notes || null, follow_up_date || null]
    );
    return result.rows[0];
  },

  update: async (id, fields) => {
    const allowed = ['diagnosis', 'symptoms', 'treatment_plan', 'notes', 'follow_up_date'];
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
      `UPDATE medical_records SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return result.rows[0] || null;
  },

  delete: async (id) => {
    const result = await query(`DELETE FROM medical_records WHERE id=$1 RETURNING id`, [id]);
    return result.rows[0] || null;
  },

  // ── Prescriptions ─────────────────────────────────────────────────────────

  createPrescription: async ({ medical_record_id, patient_id, doctor_id, valid_until, notes, items }) => {
    const client = await require('../config/db').getClient();
    try {
      await client.query('BEGIN');

      const presResult = await client.query(
        `INSERT INTO prescriptions (medical_record_id, patient_id, doctor_id, valid_until, notes)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [medical_record_id, patient_id, doctor_id, valid_until || null, notes || null]
      );
      const prescription = presResult.rows[0];

      if (items && items.length > 0) {
        for (const item of items) {
          await client.query(
            `INSERT INTO prescription_items
               (prescription_id, medicine_name, dosage, frequency, duration, instructions, quantity)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [prescription.id, item.medicine_name, item.dosage || null, item.frequency || null,
             item.duration || null, item.instructions || null, item.quantity || 1]
          );
        }
      }

      await client.query('COMMIT');
      return prescription;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  getPrescriptions: async (patientId) => {
    const result = await query(
      `SELECT pr.*, ud.full_name AS doctor_name, d.specialization,
              json_agg(pi ORDER BY pi.id) AS items
       FROM prescriptions pr
       JOIN doctors d  ON pr.doctor_id = d.id
       JOIN users ud   ON d.user_id    = ud.id
       LEFT JOIN prescription_items pi ON pi.prescription_id = pr.id
       WHERE pr.patient_id = $1
       GROUP BY pr.id, ud.full_name, d.specialization
       ORDER BY pr.prescribed_date DESC`,
      [patientId]
    );
    return result.rows;
  },

  getPrescriptionById: async (id) => {
    const result = await query(
      `SELECT pr.*, ud.full_name AS doctor_name, d.specialization,
              up.full_name AS patient_name,
              json_agg(pi ORDER BY pi.id) AS items
       FROM prescriptions pr
       JOIN doctors d  ON pr.doctor_id  = d.id
       JOIN users ud   ON d.user_id     = ud.id
       JOIN patients p ON pr.patient_id = p.id
       JOIN users up   ON p.user_id     = up.id
       LEFT JOIN prescription_items pi ON pi.prescription_id = pr.id
       WHERE pr.id = $1
       GROUP BY pr.id, ud.full_name, d.specialization, up.full_name`,
      [id]
    );
    return result.rows[0] || null;
  },

  // ── Attachments ───────────────────────────────────────────────────────────

  addAttachment: async ({ medical_record_id, patient_id, file_name, file_url,
                          file_type, file_size, public_id }) => {
    const result = await query(
      `INSERT INTO medical_attachments
         (medical_record_id, patient_id, file_name, file_url, file_type, file_size, public_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [medical_record_id, patient_id, file_name, file_url,
       file_type || 'other', file_size || null, public_id || null]
    );
    return result.rows[0];
  },

  getAttachments: async (medicalRecordId) => {
    const result = await query(
      `SELECT * FROM medical_attachments WHERE medical_record_id = $1 ORDER BY uploaded_at DESC`,
      [medicalRecordId]
    );
    return result.rows;
  },

  deleteAttachment: async (id) => {
    const result = await query(
      `DELETE FROM medical_attachments WHERE id = $1 RETURNING *`, [id]
    );
    return result.rows[0] || null;
  },
};

module.exports = RecordModel;

const { query } = require('../config/db');

const BillingModel = {
  // Generate a unique bill number like BILL-20260806-0001
  generateBillNumber: async () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const result = await query(
      `SELECT COUNT(*) FROM bills WHERE bill_date = CURRENT_DATE`
    );
    const seq = (parseInt(result.rows[0].count, 10) + 1).toString().padStart(4, '0');
    return `BILL-${today}-${seq}`;
  },

  findById: async (id) => {
    const result = await query(
      `SELECT b.*,
              up.full_name AS patient_name, up.email AS patient_email,
              up.phone AS patient_phone
       FROM bills b
       JOIN patients p ON b.patient_id = p.id
       JOIN users up   ON p.user_id    = up.id
       WHERE b.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  findAll: async ({ patientId, paymentStatus, fromDate, toDate, limit, offset }) => {
    let sql = `
      SELECT b.id, b.bill_number, b.bill_date, b.due_date, b.total_amount,
             b.paid_amount, b.payment_status, b.payment_method,
             b.consultation_fee, b.medicine_charges, b.lab_charges,
             b.other_charges, b.discount, b.tax, b.created_at,
             up.full_name AS patient_name, up.phone AS patient_phone
      FROM bills b
      JOIN patients p ON b.patient_id = p.id
      JOIN users up   ON p.user_id    = up.id
      WHERE 1=1`;
    const params = [];

    if (patientId)     { params.push(patientId);     sql += ` AND b.patient_id = $${params.length}`; }
    if (paymentStatus) { params.push(paymentStatus); sql += ` AND b.payment_status = $${params.length}`; }
    if (fromDate)      { params.push(fromDate);      sql += ` AND b.bill_date >= $${params.length}`; }
    if (toDate)        { params.push(toDate);         sql += ` AND b.bill_date <= $${params.length}`; }

    const countResult = await query(`SELECT COUNT(*) FROM (${sql}) sub`, params);

    params.push(limit, offset);
    sql += ` ORDER BY b.bill_date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const rows = await query(sql, params);
    return { rows: rows.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  create: async ({
    patient_id, appointment_id, bill_number, bill_date, due_date,
    consultation_fee, medicine_charges, lab_charges, other_charges, discount, tax, notes,
  }) => {
    const result = await query(
      `INSERT INTO bills
         (patient_id, appointment_id, bill_number, bill_date, due_date,
          consultation_fee, medicine_charges, lab_charges, other_charges, discount, tax, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        patient_id, appointment_id || null, bill_number,
        bill_date || new Date(), due_date || null,
        consultation_fee || 0, medicine_charges || 0, lab_charges || 0,
        other_charges || 0, discount || 0, tax || 0, notes || null,
      ]
    );
    return result.rows[0];
  },

  update: async (id, fields) => {
    const allowed = [
      'consultation_fee', 'medicine_charges', 'lab_charges', 'other_charges',
      'discount', 'tax', 'paid_amount', 'payment_status', 'payment_method',
      'due_date', 'notes',
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
      `UPDATE bills SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return result.rows[0] || null;
  },

  // Record a payment
  recordPayment: async (id, amount, method) => {
    const result = await query(
      `UPDATE bills
       SET paid_amount = paid_amount + $1,
           payment_method = $2,
           payment_status = CASE
             WHEN paid_amount + $1 >= total_amount THEN 'paid'
             WHEN paid_amount + $1 > 0             THEN 'partial'
             ELSE 'unpaid'
           END
       WHERE id = $3
       RETURNING *`,
      [amount, method, id]
    );
    return result.rows[0] || null;
  },

  delete: async (id) => {
    const result = await query(`DELETE FROM bills WHERE id=$1 RETURNING id`, [id]);
    return result.rows[0] || null;
  },

  // Revenue stats for admin dashboard
  getRevenueStats: async () => {
    const result = await query(
      `SELECT
         COALESCE(SUM(total_amount), 0)                      AS total_billed,
         COALESCE(SUM(paid_amount), 0)                       AS total_collected,
         COALESCE(SUM(total_amount - paid_amount), 0)        AS total_outstanding,
         COALESCE(SUM(total_amount)
           FILTER (WHERE bill_date >= date_trunc('month', NOW())), 0) AS this_month,
         COUNT(*)                                             AS total_bills,
         COUNT(*) FILTER (WHERE payment_status = 'unpaid')   AS unpaid_count,
         COUNT(*) FILTER (WHERE payment_status = 'paid')     AS paid_count
       FROM bills`
    );
    return result.rows[0];
  },
};

module.exports = BillingModel;

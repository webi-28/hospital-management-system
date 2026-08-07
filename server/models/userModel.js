const { query } = require('../config/db');

const UserModel = {
  // ── Find ──────────────────────────────────────────────────────────────────

  findById: async (id) => {
    const result = await query(
      `SELECT id, full_name, email, role, phone, avatar_url, is_active, is_verified, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  findByEmail: async (email) => {
    const result = await query(
      `SELECT * FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );
    return result.rows[0] || null;
  },

  findAll: async ({ role, search, limit, offset }) => {
    let sql = `SELECT id, full_name, email, role, phone, avatar_url, is_active, is_verified, created_at
               FROM users WHERE 1=1`;
    const params = [];

    if (role) {
      params.push(role);
      sql += ` AND role = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (full_name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    // count before pagination
    const countResult = await query(
      `SELECT COUNT(*) FROM (${sql}) sub`, params
    );

    params.push(limit, offset);
    sql += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const rows = await query(sql, params);
    return { rows: rows.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  // ── Create ────────────────────────────────────────────────────────────────

  create: async ({ full_name, email, password_hash, role, phone }) => {
    const result = await query(
      `INSERT INTO users (full_name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, role, phone, is_active, is_verified, created_at`,
      [full_name, email.toLowerCase().trim(), password_hash, role, phone || null]
    );
    return result.rows[0];
  },

  // ── Update ────────────────────────────────────────────────────────────────

  update: async (id, fields) => {
    const allowed = ['full_name', 'phone', 'avatar_url', 'is_active', 'is_verified'];
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
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${params.length}
       RETURNING id, full_name, email, role, phone, avatar_url, is_active, is_verified, updated_at`,
      params
    );
    return result.rows[0] || null;
  },

  updatePassword: async (id, password_hash) => {
    const result = await query(
      `UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id`,
      [password_hash, id]
    );
    return result.rows[0] || null;
  },

  delete: async (id) => {
    const result = await query(
      `DELETE FROM users WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows[0] || null;
  },
};

module.exports = UserModel;

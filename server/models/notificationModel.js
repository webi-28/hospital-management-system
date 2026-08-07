const { query } = require('../config/db');

const NotificationModel = {
  create: async ({ user_id, title, message, type = 'info' }) => {
    const result = await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, title, message, type]
    );
    return result.rows[0];
  },

  // Bulk create for multiple users
  createBulk: async (notifications) => {
    if (!notifications.length) return [];
    const values = [];
    const params = [];
    notifications.forEach(({ user_id, title, message, type = 'info' }, i) => {
      const base = i * 4;
      values.push(`($${base + 1},$${base + 2},$${base + 3},$${base + 4})`);
      params.push(user_id, title, message, type);
    });
    const result = await query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES ${values.join(',')} RETURNING *`,
      params
    );
    return result.rows;
  },

  findByUser: async (userId, { unreadOnly = false, limit = 20, offset = 0 } = {}) => {
    let sql = `SELECT * FROM notifications WHERE user_id = $1`;
    const params = [userId];

    if (unreadOnly) sql += ` AND is_read = FALSE`;

    const countResult = await query(`SELECT COUNT(*) FROM (${sql}) sub`, params);

    params.push(limit, offset);
    sql += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const rows = await query(sql, params);
    return { rows: rows.rows, total: parseInt(countResult.rows[0].count, 10) };
  },

  markRead: async (id, userId) => {
    const result = await query(
      `UPDATE notifications SET is_read = TRUE
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );
    return result.rows[0] || null;
  },

  markAllRead: async (userId) => {
    const result = await query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 RETURNING id`,
      [userId]
    );
    return result.rows.length;
  },

  delete: async (id, userId) => {
    const result = await query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    return result.rows[0] || null;
  },

  getUnreadCount: async (userId) => {
    const result = await query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  },
};

module.exports = NotificationModel;

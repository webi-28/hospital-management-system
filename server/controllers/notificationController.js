const NotificationModel = require('../models/notificationModel');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { buildPaginationMeta }    = require('../middleware/pagination');

// GET /api/notifications
exports.getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, offset } = req.pagination;
  const unreadOnly = req.query.unread === 'true';

  const { rows, total } = await NotificationModel.findByUser(
    req.user.id, { unreadOnly, limit, offset }
  );

  const unreadCount = await NotificationModel.getUnreadCount(req.user.id);

  res.json({
    success: true,
    data: rows,
    unread_count: unreadCount,
    pagination: buildPaginationMeta(total, page, limit),
  });
});

// PUT /api/notifications/:id/read
exports.markRead = asyncHandler(async (req, res) => {
  const notification = await NotificationModel.markRead(req.params.id, req.user.id);
  if (!notification) throw new AppError('Notification not found.', 404);
  res.json({ success: true, data: notification });
});

// PUT /api/notifications/read-all
exports.markAllRead = asyncHandler(async (req, res) => {
  const count = await NotificationModel.markAllRead(req.user.id);
  res.json({ success: true, message: `${count} notifications marked as read.` });
});

// DELETE /api/notifications/:id
exports.deleteNotification = asyncHandler(async (req, res) => {
  const deleted = await NotificationModel.delete(req.params.id, req.user.id);
  if (!deleted) throw new AppError('Notification not found.', 404);
  res.json({ success: true, message: 'Notification deleted.' });
});

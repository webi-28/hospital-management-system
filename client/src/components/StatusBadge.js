import React from 'react';

const StatusBadge = ({ status }) => {
  const map = {
    // Appointments
    pending:   'badge-warning',
    confirmed: 'badge-info',
    completed: 'badge-success',
    cancelled: 'badge-danger',
    no_show:   'badge-secondary',
    // Billing
    unpaid:    'badge-danger',
    partial:   'badge-warning',
    paid:      'badge-success',
    refunded:  'badge-secondary',
    // Prescriptions
    active:    'badge-success',
    expired:   'badge-secondary',
    // Generic
    active_u:  'badge-success',
    inactive:  'badge-danger',
  };

  const cls = map[status] || 'badge-secondary';

  return (
    <span className={`badge ${cls}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

export default StatusBadge;

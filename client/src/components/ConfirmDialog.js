import React from 'react';
import Modal from './Modal';

/**
 * Reusable confirmation dialog.
 * Props: isOpen, onClose, onConfirm, title, message, confirmLabel, danger
 */
const ConfirmDialog = ({
  isOpen, onClose, onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="confirm-message">{message}</p>
    <div className="confirm-actions">
      <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
        Cancel
      </button>
      <button
        className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
        onClick={onConfirm}
        disabled={loading}
      >
        {loading ? 'Processing...' : confirmLabel}
      </button>
    </div>
  </Modal>
);

export default ConfirmDialog;

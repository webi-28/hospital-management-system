import React, { useEffect, useState, useCallback } from 'react';
import { FiEdit2, FiTrash2, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import appointmentService from '../../services/appointmentService';

const STATUSES = ['pending','confirmed','completed','cancelled','no_show'];

const ManageAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [pagination,   setPagination]   = useState(null);
  const [page,         setPage]         = useState(1);
  const [status,       setStatus]       = useState('');
  const [fromDate,     setFromDate]     = useState('');
  const [toDate,       setToDate]       = useState('');
  const [loading,      setLoading]      = useState(true);
  const [statusModal,  setStatusModal]  = useState(null); // {id, current}
  const [newStatus,    setNewStatus]    = useState('');
  const [deleteId,     setDeleteId]     = useState(null);
  const [saving,       setSaving]       = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await appointmentService.getAll({
        status, from_date: fromDate, to_date: toDate, page, limit: 10,
      });
      setAppointments(data.data);
      setPagination(data.pagination);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [status, fromDate, toDate, page]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const openStatusModal = (a) => {
    setStatusModal(a);
    setNewStatus(a.status);
  };

  const handleStatusUpdate = async () => {
    setSaving(true);
    try {
      await appointmentService.updateStatus(statusModal.id, { status: newStatus });
      toast.success('Status updated.');
      setStatusModal(null);
      fetchAppointments();
    } catch {
      toast.error('Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await appointmentService.delete(deleteId);
      toast.success('Appointment deleted.');
      setDeleteId(null);
      fetchAppointments();
    } catch {
      toast.error('Delete failed.');
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Appointments</h1>
          <p className="page-subtitle">{pagination?.total || 0} appointments total</p>
        </div>
      </div>

      <Card>
        <div className="table-toolbar flex-wrap">
          <select className="form-control filter-select" value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" className="form-control filter-select" value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
          <input type="date" className="form-control filter-select" value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th><th>Doctor</th><th>Date & Time</th>
                  <th>Type</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr><td colSpan={6} className="empty-row">No appointments found.</td></tr>
                ) : appointments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.patient_name}</td>
                    <td>
                      <div>
                        <strong>{a.doctor_name}</strong>
                        <small>{a.specialization}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <FiCalendar size={12} /> {new Date(a.appointment_date).toLocaleDateString()}
                        <small> {a.appointment_time?.slice(0,5)}</small>
                      </div>
                    </td>
                    <td className="capitalize">{a.type?.replace('_',' ')}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon" title="Change status"
                          onClick={() => openStatusModal(a)}>
                          <FiEdit2 size={15} />
                        </button>
                        <button className="btn-icon btn-icon-danger" title="Delete"
                          onClick={() => setDeleteId(a.id)}>
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>

      {/* Status modal */}
      <Modal isOpen={!!statusModal} onClose={() => setStatusModal(null)}
        title="Update Appointment Status" size="sm">
        <div className="form-group">
          <label>New Status</label>
          <select className="form-control" value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setStatusModal(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleStatusUpdate} disabled={saving}>
            {saving ? 'Saving…' : 'Update'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} danger
        title="Delete Appointment"
        message="This will permanently delete the appointment."
        confirmLabel="Delete" />
    </Layout>
  );
};

export default ManageAppointments;

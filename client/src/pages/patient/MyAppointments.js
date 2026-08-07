import React, { useEffect, useState, useCallback } from 'react';
import { FiCalendar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import appointmentService from '../../services/appointmentService';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [pagination,   setPagination]   = useState(null);
  const [page,         setPage]         = useState(1);
  const [status,       setStatus]       = useState('');
  const [loading,      setLoading]      = useState(true);
  const [cancelId,     setCancelId]     = useState(null);
  const [cancelling,   setCancelling]   = useState(false);
  const navigate = useNavigate();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await appointmentService.getAll({ status, page, limit: 10 });
      setAppointments(data.data);
      setPagination(data.pagination);
    } catch {} finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await appointmentService.updateStatus(cancelId, {
        status: 'cancelled',
        cancellation_reason: 'Cancelled by patient',
      });
      toast.success('Appointment cancelled.');
      setCancelId(null);
      fetch();
    } catch { toast.error('Cancellation failed.'); }
    finally { setCancelling(false); }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">My Appointments</h1>
        <button className="btn btn-primary" onClick={() => navigate('/patient/book')}>
          + Book New
        </button>
      </div>

      <Card>
        <div className="table-toolbar">
          <select className="form-control filter-select" value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {['pending','confirmed','completed','cancelled'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Doctor</th><th>Date & Time</th><th>Type</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr><td colSpan={5} className="empty-row">No appointments found.</td></tr>
                ) : appointments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div>
                        <strong>{a.doctor_name}</strong>
                        <small>{a.specialization}</small>
                      </div>
                    </td>
                    <td>
                      <div><FiCalendar size={12} /> {new Date(a.appointment_date).toLocaleDateString()}</div>
                      <small>{a.appointment_time?.slice(0,5)}</small>
                    </td>
                    <td className="capitalize">{a.type?.replace('_',' ')}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>
                      {['pending','confirmed'].includes(a.status) && (
                        <button className="btn btn-sm btn-danger"
                          onClick={() => setCancelId(a.id)}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>

      <ConfirmDialog isOpen={!!cancelId} onClose={() => setCancelId(null)}
        onConfirm={handleCancel} loading={cancelling} danger
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment?"
        confirmLabel="Yes, Cancel" />
    </Layout>
  );
};

export default MyAppointments;

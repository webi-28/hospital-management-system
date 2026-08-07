import React, { useEffect, useState, useCallback } from 'react';
import { FiCalendar, FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import appointmentService from '../../services/appointmentService';
import recordService from '../../services/recordService';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [pagination,   setPagination]   = useState(null);
  const [page,         setPage]         = useState(1);
  const [status,       setStatus]       = useState('');
  const [fromDate,     setFromDate]     = useState('');
  const [loading,      setLoading]      = useState(true);
  const [recordModal,  setRecordModal]  = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [recordForm,   setRecordForm]   = useState({
    diagnosis:'', symptoms:'', treatment_plan:'', notes:'', follow_up_date:'',
  });
  const navigate = useNavigate();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await appointmentService.getAll({
        status, from_date: fromDate, page, limit: 10,
      });
      setAppointments(data.data);
      setPagination(data.pagination);
    } catch {} finally { setLoading(false); }
  }, [status, fromDate, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await appointmentService.updateStatus(id, { status: newStatus });
      toast.success(`Appointment ${newStatus}.`);
      fetch();
    } catch { toast.error('Update failed.'); }
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await recordService.create({
        ...recordForm,
        patient_id:     recordModal.patient_id,
        appointment_id: recordModal.id,
      });
      toast.success('Medical record created.');
      setRecordModal(null);
      // Offer to write a prescription immediately
      if (window.confirm('Record saved. Add a prescription now?')) {
        navigate(`/doctor/prescriptions/new/${data.data.id}`);
      }
    } catch { toast.error('Failed to create record.'); }
    finally { setSaving(false); }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">My Appointments</h1>
      </div>

      <Card>
        <div className="table-toolbar flex-wrap">
          <select className="form-control filter-select" value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {['pending','confirmed','completed','cancelled'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input type="date" className="form-control filter-select" value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th><th>Date & Time</th><th>Type</th>
                  <th>Reason</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr><td colSpan={6} className="empty-row">No appointments found.</td></tr>
                ) : appointments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.patient_name}</strong>
                      <small>{a.patient_phone}</small>
                    </td>
                    <td>
                      <div><FiCalendar size={12}/> {new Date(a.appointment_date).toLocaleDateString()}</div>
                      <small>{a.appointment_time?.slice(0,5)}</small>
                    </td>
                    <td className="capitalize">{a.type?.replace('_',' ')}</td>
                    <td>{a.reason || '–'}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>
                      <div className="action-btns">
                        {a.status === 'pending' && (
                          <button className="btn btn-sm btn-success"
                            onClick={() => handleStatusChange(a.id, 'confirmed')}>Confirm</button>
                        )}
                        {a.status === 'confirmed' && (
                          <>
                            <button className="btn btn-sm btn-primary"
                              onClick={() => handleStatusChange(a.id, 'completed')}>Complete</button>
                            <button className="btn btn-sm btn-secondary"
                              onClick={() => { setRecordModal(a); setRecordForm({ diagnosis:'', symptoms:'', treatment_plan:'', notes:'', follow_up_date:'' }); }}>
                              <FiFileText size={13}/> Add Record
                            </button>
                          </>
                        )}
                        {a.status === 'completed' && (
                          <button className="btn btn-sm btn-secondary"
                            onClick={() => { setRecordModal(a); setRecordForm({ diagnosis:'', symptoms:'', treatment_plan:'', notes:'', follow_up_date:'' }); }}>
                            <FiFileText size={13}/> Add Record
                          </button>
                        )}
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

      {/* Create Medical Record Modal */}
      <Modal isOpen={!!recordModal} onClose={() => setRecordModal(null)}
        title={`Add Record – ${recordModal?.patient_name}`} size="lg">
        <form onSubmit={handleCreateRecord}>
          <div className="form-group">
            <label>Diagnosis *</label>
            <textarea className="form-control" rows={2} required
              value={recordForm.diagnosis}
              onChange={(e) => setRecordForm((p) => ({ ...p, diagnosis: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Symptoms</label>
            <textarea className="form-control" rows={2}
              value={recordForm.symptoms}
              onChange={(e) => setRecordForm((p) => ({ ...p, symptoms: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Treatment Plan</label>
            <textarea className="form-control" rows={2}
              value={recordForm.treatment_plan}
              onChange={(e) => setRecordForm((p) => ({ ...p, treatment_plan: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-control" rows={2}
              value={recordForm.notes}
              onChange={(e) => setRecordForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Follow-up Date</label>
            <input type="date" className="form-control" value={recordForm.follow_up_date}
              onChange={(e) => setRecordForm((p) => ({ ...p, follow_up_date: e.target.value }))} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setRecordModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Create Record'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default DoctorAppointments;

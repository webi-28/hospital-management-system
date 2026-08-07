import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiUpload, FiFileText, FiTrash2, FiEye } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import recordService from '../services/recordService';
import patientService from '../services/patientService';

const MedicalRecords = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records,    setRecords]    = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [viewRecord, setViewRecord] = useState(null);
  const [addOpen,    setAddOpen]    = useState(false);
  const [deleteId,   setDeleteId]   = useState(null);
  const [patients,   setPatients]   = useState([]);
  const [saving,     setSaving]     = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const [form, setForm] = useState({
    patient_id:'', diagnosis:'', symptoms:'', treatment_plan:'', notes:'', follow_up_date:'',
  });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await recordService.getAll({ page, limit: 10 });
      setRecords(data.data);
      setPagination(data.pagination);
    } catch {} finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (user?.role === 'doctor') {
      patientService.getAll({ limit: 100 })
        .then(({ data }) => setPatients(data.data || []))
        .catch(() => {});
    }
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await recordService.create(form);
      toast.success('Record created.');
      setAddOpen(false);
      fetch();
      // Navigate to write prescription
      if (window.confirm('Would you like to add a prescription for this record?')) {
        navigate(`/doctor/prescriptions/new/${data.data.id}`);
      }
    } catch { toast.error('Failed to create record.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await recordService.delete(deleteId);
      toast.success('Record deleted.');
      setDeleteId(null);
      fetch();
    } catch { toast.error('Delete failed.'); }
  };

  const handleUpload = async (recordId) => {
    if (!uploadFile) { toast.error('Select a file first.'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', uploadFile);
    fd.append('file_type', 'lab_report');
    try {
      await recordService.uploadAttachment(recordId, fd);
      toast.success('File uploaded.');
      setUploadFile(null);
      // Refresh view
      const { data } = await recordService.getById(recordId);
      setViewRecord(data.data);
    } catch { toast.error('Upload failed.'); }
    finally { setUploading(false); }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Medical Records</h1>
        {user?.role === 'doctor' && (
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
            <FiPlus /> New Record
          </button>
        )}
      </div>

      <Card>
        {loading ? <LoadingSpinner /> : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Patient</th><th>Doctor</th><th>Diagnosis</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={5} className="empty-row">No records found.</td></tr>
                ) : records.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.record_date).toLocaleDateString()}</td>
                    <td>{r.patient_name}</td>
                    <td>{r.doctor_name}</td>
                    <td>{r.diagnosis}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon" title="View"
                          onClick={async () => {
                            const { data } = await recordService.getById(r.id);
                            setViewRecord(data.data);
                          }}>
                          <FiEye size={15} />
                        </button>
                        {user?.role === 'doctor' && (
                          <>
                            <button className="btn-icon" title="Add Prescription"
                              onClick={() => navigate(`/doctor/prescriptions/new/${r.id}`)}>
                              <FiFileText size={15} />
                            </button>
                            <button className="btn-icon btn-icon-danger" title="Delete"
                              onClick={() => setDeleteId(r.id)}>
                              <FiTrash2 size={15} />
                            </button>
                          </>
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

      {/* View Record Modal */}
      <Modal isOpen={!!viewRecord} onClose={() => setViewRecord(null)}
        title="Medical Record Details" size="lg">
        {viewRecord && (
          <div>
            <div className="record-detail-grid">
              {[
                ['Date',          new Date(viewRecord.record_date).toLocaleDateString()],
                ['Patient',       viewRecord.patient_name],
                ['Doctor',        viewRecord.doctor_name],
                ['Specialization',viewRecord.specialization],
                ['Diagnosis',     viewRecord.diagnosis],
                ['Symptoms',      viewRecord.symptoms || '–'],
                ['Treatment',     viewRecord.treatment_plan || '–'],
                ['Notes',         viewRecord.notes || '–'],
                ['Follow-up',     viewRecord.follow_up_date
                  ? new Date(viewRecord.follow_up_date).toLocaleDateString() : '–'],
              ].map(([k, v]) => (
                <div key={k} className="detail-item">
                  <span>{k}</span><strong>{v}</strong>
                </div>
              ))}
            </div>

            {/* Attachments */}
            <div className="attachments-section mt-4">
              <div className="section-divider">
                <h5>Attachments ({(viewRecord.attachments || []).length})</h5>
                {user?.role === 'doctor' && (
                  <div className="upload-inline">
                    <input type="file" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                      onChange={(e) => setUploadFile(e.target.files[0])} />
                    <button className="btn btn-sm btn-secondary"
                      onClick={() => handleUpload(viewRecord.id)} disabled={uploading}>
                      {uploading ? 'Uploading…' : <><FiUpload size={13}/> Upload</>}
                    </button>
                  </div>
                )}
              </div>
              {(viewRecord.attachments || []).length === 0 ? (
                <p className="text-muted">No attachments.</p>
              ) : (
                <div className="attachments-list">
                  {viewRecord.attachments.map((a) => (
                    <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer"
                      className="attachment-chip">
                      <FiFileText size={13} /> {a.file_name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create Record Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="New Medical Record" size="lg">
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Patient *</label>
            <select className="form-control" required value={form.patient_id}
              onChange={(e) => setForm((p) => ({ ...p, patient_id: e.target.value }))}>
              <option value="">Select patient…</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Diagnosis *</label>
            <textarea className="form-control" rows={2} required value={form.diagnosis}
              onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Symptoms</label>
              <textarea className="form-control" rows={2} value={form.symptoms}
                onChange={(e) => setForm((p) => ({ ...p, symptoms: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Treatment Plan</label>
              <textarea className="form-control" rows={2} value={form.treatment_plan}
                onChange={(e) => setForm((p) => ({ ...p, treatment_plan: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Notes</label>
              <textarea className="form-control" rows={2} value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Follow-up Date</label>
              <input type="date" className="form-control" value={form.follow_up_date}
                onChange={(e) => setForm((p) => ({ ...p, follow_up_date: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Create Record'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} danger title="Delete Record"
        message="This will permanently delete this medical record and all attachments."
        confirmLabel="Delete" />
    </Layout>
  );
};

export default MedicalRecords;

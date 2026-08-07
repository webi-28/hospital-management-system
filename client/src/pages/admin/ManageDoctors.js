import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import doctorService from '../../services/doctorService';
import api from '../../services/api';
import useDebounce from '../../hooks/useDebounce';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const emptyForm = {
  full_name:'', email:'', password:'', phone:'',
  specialization:'', qualification:'', experience_years:'',
  consultation_fee:'', department_id:'', bio:'', license_number:'',
  available_days:[], available_from:'09:00', available_to:'17:00',
};

const ManageDoctors = () => {
  const [doctors,    setDoctors]    = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [loading,    setLoading]    = useState(true);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editDoc,    setEditDoc]    = useState(null);
  const [form,       setForm]       = useState(emptyForm);
  const [saving,     setSaving]     = useState(false);
  const [deleteId,   setDeleteId]   = useState(null);
  const [departments, setDepts]     = useState([]);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await doctorService.getAll({ search: debouncedSearch, page, limit: 10 });
      setDoctors(data.data);
      setPagination(data.pagination);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  useEffect(() => {
    doctorService.getDepartments()
      .then(({ data }) => setDepts(data.data || []))
      .catch(() => {});
  }, []);

  const openAdd = () => {
    setEditDoc(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (doc) => {
    setEditDoc(doc);
    setForm({
      full_name: doc.full_name, phone: doc.phone || '',
      specialization: doc.specialization, qualification: doc.qualification || '',
      experience_years: doc.experience_years, consultation_fee: doc.consultation_fee,
      department_id: doc.department_id || '', bio: doc.bio || '',
      license_number: doc.license_number || '',
      available_days: doc.available_days || [],
      available_from: doc.available_from || '09:00',
      available_to:   doc.available_to   || '17:00',
    });
    setModalOpen(true);
  };

  const handleDayToggle = (day) => {
    setForm((p) => ({
      ...p,
      available_days: p.available_days.includes(day)
        ? p.available_days.filter((d) => d !== day)
        : [...p.available_days, day],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editDoc) {
        await doctorService.update(editDoc.id, form);
        toast.success('Doctor updated.');
      } else {
        await api.post('/auth/register', { ...form, role: 'doctor' });
        toast.success('Doctor added.');
      }
      setModalOpen(false);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await doctorService.delete(deleteId);
      toast.success('Doctor deactivated.');
      setDeleteId(null);
      fetchDoctors();
    } catch {
      toast.error('Delete failed.');
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Doctors</h1>
          <p className="page-subtitle">{pagination?.total || 0} doctors registered</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <FiPlus /> Add Doctor
        </button>
      </div>

      <Card>
        <div className="table-toolbar">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by name or specialization…" />
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Doctor</th><th>Specialization</th><th>Department</th>
                  <th>Experience</th><th>Fee</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.length === 0 ? (
                  <tr><td colSpan={7} className="empty-row">No doctors found.</td></tr>
                ) : doctors.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div className="table-avatar-cell">
                        <div className="avatar-sm">{d.full_name?.[0]}</div>
                        <div>
                          <strong>{d.full_name}</strong>
                          <small>{d.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>{d.specialization}</td>
                    <td>{d.department_name || '–'}</td>
                    <td>{d.experience_years} yrs</td>
                    <td>${d.consultation_fee}</td>
                    <td>
                      <span className={`badge ${d.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {d.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon" title="Edit" onClick={() => openEdit(d)}>
                          <FiEdit2 size={15} />
                        </button>
                        <button className="btn-icon btn-icon-danger" title="Deactivate"
                          onClick={() => setDeleteId(d.id)}>
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

      {/* Add / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editDoc ? 'Edit Doctor' : 'Add New Doctor'} size="lg">
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input className="form-control" required value={form.full_name}
                onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="form-control" value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>

          {!editDoc && (
            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input type="email" className="form-control" required value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input type="password" className="form-control" required value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Specialization *</label>
              <input className="form-control" required value={form.specialization}
                onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Department</label>
              <select className="form-control" value={form.department_id}
                onChange={(e) => setForm((p) => ({ ...p, department_id: e.target.value }))}>
                <option value="">Select…</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Qualification</label>
              <input className="form-control" value={form.qualification}
                onChange={(e) => setForm((p) => ({ ...p, qualification: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>License No.</label>
              <input className="form-control" value={form.license_number}
                onChange={(e) => setForm((p) => ({ ...p, license_number: e.target.value }))} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Experience (years)</label>
              <input type="number" min={0} className="form-control" value={form.experience_years}
                onChange={(e) => setForm((p) => ({ ...p, experience_years: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Consultation Fee ($)</label>
              <input type="number" min={0} step="0.01" className="form-control" value={form.consultation_fee}
                onChange={(e) => setForm((p) => ({ ...p, consultation_fee: e.target.value }))} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Available From</label>
              <input type="time" className="form-control" value={form.available_from}
                onChange={(e) => setForm((p) => ({ ...p, available_from: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Available To</label>
              <input type="time" className="form-control" value={form.available_to}
                onChange={(e) => setForm((p) => ({ ...p, available_to: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label>Available Days</label>
            <div className="day-selector">
              {DAYS.map((d) => (
                <button key={d} type="button"
                  className={`day-btn ${form.available_days.includes(d) ? 'active' : ''}`}
                  onClick={() => handleDayToggle(d)}>
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea className="form-control" rows={2} value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary"
              onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editDoc ? 'Update' : 'Add Doctor'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} danger
        title="Deactivate Doctor"
        message="This will deactivate the doctor's account. They won't be able to log in."
        confirmLabel="Deactivate" />
    </Layout>
  );
};

export default ManageDoctors;

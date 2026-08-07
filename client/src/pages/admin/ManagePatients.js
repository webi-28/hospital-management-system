import React, { useEffect, useState, useCallback } from 'react';
import { FiEye, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import patientService from '../../services/patientService';
import useDebounce from '../../hooks/useDebounce';
import { differenceInYears, parseISO } from 'date-fns';

const ManagePatients = () => {
  const [patients,   setPatients]   = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [gender,     setGender]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [deleteId,   setDeleteId]   = useState(null);
  const navigate = useNavigate();

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await patientService.getAll({ search: debouncedSearch, gender, page, limit: 10 });
      setPatients(data.data);
      setPagination(data.pagination);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, gender, page]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleDelete = async () => {
    try {
      await patientService.delete(deleteId);
      toast.success('Patient deactivated.');
      setDeleteId(null);
      fetchPatients();
    } catch {
      toast.error('Failed to deactivate patient.');
    }
  };

  const calcAge = (dob) => {
    try { return differenceInYears(new Date(), parseISO(dob)); }
    catch { return '–'; }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Patients</h1>
          <p className="page-subtitle">{pagination?.total || 0} patients registered</p>
        </div>
      </div>

      <Card>
        <div className="table-toolbar">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search by name, email or phone…" />
          <select className="form-control filter-select" value={gender}
            onChange={(e) => { setGender(e.target.value); setPage(1); }}>
            <option value="">All genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Patient</th><th>Age</th><th>Gender</th>
                  <th>Blood Group</th><th>Phone</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr><td colSpan={7} className="empty-row">No patients found.</td></tr>
                ) : patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="table-avatar-cell">
                        <div className="avatar-sm">{p.full_name?.[0]}</div>
                        <div>
                          <strong>{p.full_name}</strong>
                          <small>{p.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>{p.date_of_birth ? calcAge(p.date_of_birth) : '–'}</td>
                    <td className="capitalize">{p.gender || '–'}</td>
                    <td>{p.blood_group || '–'}</td>
                    <td>{p.phone || '–'}</td>
                    <td>
                      <span className={`badge ${p.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon" title="View"
                          onClick={() => navigate(`/admin/patients`)}>
                          <FiEye size={15} />
                        </button>
                        <button className="btn-icon btn-icon-danger" title="Deactivate"
                          onClick={() => setDeleteId(p.id)}>
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

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={handleDelete} danger
        title="Deactivate Patient"
        message="This will deactivate the patient account."
        confirmLabel="Deactivate" />
    </Layout>
  );
};

export default ManagePatients;

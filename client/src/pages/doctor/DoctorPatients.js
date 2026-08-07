import React, { useEffect, useState, useCallback } from 'react';
import { FiEye } from 'react-icons/fi';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import patientService from '../../services/patientService';
import recordService from '../../services/recordService';
import useDebounce from '../../hooks/useDebounce';
import { differenceInYears, parseISO } from 'date-fns';

const DoctorPatients = () => {
  const [patients,   setPatients]   = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [loading,    setLoading]    = useState(true);
  const [viewModal,  setViewModal]  = useState(null);
  const [records,    setRecords]    = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await patientService.getAll({ search: debouncedSearch, page, limit: 10 });
      setPatients(data.data);
      setPagination(data.pagination);
    } catch {} finally { setLoading(false); }
  }, [debouncedSearch, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const openPatient = async (p) => {
    setViewModal(p);
    setRecLoading(true);
    try {
      const { data } = await recordService.getAll({ patient_id: p.id, limit: 5 });
      setRecords(data.data || []);
    } catch {} finally { setRecLoading(false); }
  };

  const age = (dob) => {
    try { return differenceInYears(new Date(), parseISO(dob)); }
    catch { return '–'; }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">My Patients</h1>
      </div>

      <Card>
        <div className="table-toolbar">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search patients…" />
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Patient</th><th>Age</th><th>Gender</th><th>Blood Group</th><th>Phone</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr><td colSpan={6} className="empty-row">No patients found.</td></tr>
                ) : patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="table-avatar-cell">
                        <div className="avatar-sm">{p.full_name?.[0]}</div>
                        <strong>{p.full_name}</strong>
                      </div>
                    </td>
                    <td>{p.date_of_birth ? age(p.date_of_birth) : '–'}</td>
                    <td className="capitalize">{p.gender || '–'}</td>
                    <td>{p.blood_group || '–'}</td>
                    <td>{p.phone || '–'}</td>
                    <td>
                      <button className="btn-icon" title="View history" onClick={() => openPatient(p)}>
                        <FiEye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>

      {/* Patient detail modal */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)}
        title={`Patient – ${viewModal?.full_name}`} size="lg">
        {viewModal && (
          <div>
            <div className="patient-detail-grid">
              {[
                ['Email', viewModal.email],
                ['Phone', viewModal.phone || '–'],
                ['Gender', viewModal.gender || '–'],
                ['Blood Group', viewModal.blood_group || '–'],
                ['Address', viewModal.address || '–'],
                ['Allergies', (viewModal.allergies || []).join(', ') || '–'],
                ['Chronic Diseases', (viewModal.chronic_diseases || []).join(', ') || '–'],
                ['Insurance', viewModal.insurance_provider || '–'],
              ].map(([k, v]) => (
                <div key={k} className="detail-item">
                  <span className="detail-label">{k}</span>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>

            <h4 className="section-title">Recent Medical Records</h4>
            {recLoading ? <LoadingSpinner /> : records.length === 0 ? (
              <p className="text-muted">No records found.</p>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr><th>Date</th><th>Diagnosis</th><th>Doctor</th></tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id}>
                        <td>{new Date(r.record_date).toLocaleDateString()}</td>
                        <td>{r.diagnosis}</td>
                        <td>{r.doctor_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default DoctorPatients;

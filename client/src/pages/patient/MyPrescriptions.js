import React, { useEffect, useState } from 'react';
import { FiBook, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import recordService from '../../services/recordService';
import patientService from '../../services/patientService';

const MyPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [expanded,      setExpanded]      = useState(null);

  useEffect(() => {
    patientService.getMe()
      .then(({ data }) => recordService.getPatientPrescriptions(data.data.id))
      .then(({ data }) => setPrescriptions(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">My Prescriptions</h1>
        <p className="page-subtitle">All prescriptions issued by your doctors</p>
      </div>

      <Card>
        {loading ? <LoadingSpinner /> : prescriptions.length === 0 ? (
          <div className="empty-state">
            <FiBook size={40} />
            <p>No prescriptions yet.</p>
          </div>
        ) : prescriptions.map((p) => (
          <div key={p.id} className="prescription-item">
            <div className="prescription-header" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
              <div className="prescription-header-left">
                <div className="rx-badge">Rx</div>
                <div>
                  <strong>Dr. {p.doctor_name}</strong>
                  <span>{p.specialization}</span>
                  <small>
                    Prescribed: {new Date(p.prescribed_date).toLocaleDateString()}
                    {p.valid_until && ` · Valid until: ${new Date(p.valid_until).toLocaleDateString()}`}
                  </small>
                </div>
              </div>
              <div className="prescription-header-right">
                <StatusBadge status={p.status} />
                <button className="btn-icon">
                  {expanded === p.id ? <FiChevronUp /> : <FiChevronDown />}
                </button>
              </div>
            </div>

            {expanded === p.id && (
              <div className="prescription-body">
                {p.notes && <p className="prescription-notes">{p.notes}</p>}
                <div className="medicine-table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>#</th><th>Medicine</th><th>Dosage</th>
                        <th>Frequency</th><th>Duration</th><th>Qty</th><th>Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(p.items || []).filter(Boolean).map((item, i) => (
                        <tr key={item?.id || i}>
                          <td>{i + 1}</td>
                          <td><strong>{item?.medicine_name}</strong></td>
                          <td>{item?.dosage || '–'}</td>
                          <td>{item?.frequency || '–'}</td>
                          <td>{item?.duration || '–'}</td>
                          <td>{item?.quantity || 1}</td>
                          <td>{item?.instructions || '–'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </Card>
    </Layout>
  );
};

export default MyPrescriptions;

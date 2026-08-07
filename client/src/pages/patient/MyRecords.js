import React, { useEffect, useState, useCallback } from 'react';
import { FiFileText, FiDownload, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import recordService from '../../services/recordService';

const MyRecords = () => {
  const [records,    setRecords]    = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [expanded,   setExpanded]   = useState(null);
  const [attachments,setAttachments]= useState({});

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await recordService.getAll({ page, limit: 10 });
      setRecords(data.data);
      setPagination(data.pagination);
    } catch {} finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleExpand = async (record) => {
    if (expanded === record.id) { setExpanded(null); return; }
    setExpanded(record.id);
    if (!attachments[record.id]) {
      try {
        const { data } = await recordService.getById(record.id);
        setAttachments((p) => ({ ...p, [record.id]: data.data.attachments || [] }));
      } catch {}
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">My Medical Records</h1>
        <p className="page-subtitle">Your complete health history</p>
      </div>

      <Card>
        {loading ? <LoadingSpinner /> : records.length === 0 ? (
          <div className="empty-state">
            <FiFileText size={40} />
            <p>No medical records yet.</p>
          </div>
        ) : (
          <div className="records-list">
            {records.map((r) => (
              <div key={r.id} className="record-item">
                <div className="record-header" onClick={() => toggleExpand(r)}>
                  <div className="record-header-left">
                    <div className="record-date-badge">
                      <strong>{new Date(r.record_date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</strong>
                      <small>{new Date(r.record_date).getFullYear()}</small>
                    </div>
                    <div className="record-summary">
                      <h4>{r.diagnosis}</h4>
                      <span>Dr. {r.doctor_name} · {r.specialization}</span>
                    </div>
                  </div>
                  <button className="btn-icon">
                    {expanded === r.id ? <FiChevronUp /> : <FiChevronDown />}
                  </button>
                </div>

                {expanded === r.id && (
                  <div className="record-body">
                    <div className="record-detail-grid">
                      {r.symptoms && (
                        <div className="detail-item">
                          <span>Symptoms</span>
                          <strong>{r.symptoms}</strong>
                        </div>
                      )}
                      {r.treatment_plan && (
                        <div className="detail-item">
                          <span>Treatment Plan</span>
                          <strong>{r.treatment_plan}</strong>
                        </div>
                      )}
                      {r.notes && (
                        <div className="detail-item">
                          <span>Notes</span>
                          <strong>{r.notes}</strong>
                        </div>
                      )}
                      {r.follow_up_date && (
                        <div className="detail-item">
                          <span>Follow-up</span>
                          <strong>{new Date(r.follow_up_date).toLocaleDateString()}</strong>
                        </div>
                      )}
                    </div>

                    {/* Attachments */}
                    {attachments[r.id]?.length > 0 && (
                      <div className="attachments-section">
                        <h5>Attachments</h5>
                        <div className="attachments-list">
                          {attachments[r.id].map((att) => (
                            <a key={att.id} href={att.file_url} target="_blank" rel="noreferrer"
                              className="attachment-chip">
                              <FiDownload size={13} />
                              <span>{att.file_name}</span>
                              <small>{att.file_type}</small>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>
    </Layout>
  );
};

export default MyRecords;

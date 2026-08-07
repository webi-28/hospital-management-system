import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import recordService from '../../services/recordService';

const emptyItem = { medicine_name:'', dosage:'', frequency:'', duration:'', instructions:'', quantity:1 };

const WritePrescription = () => {
  const { recordId } = useParams();
  const navigate     = useNavigate();
  const [record,  setRecord]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [form, setForm] = useState({
    valid_until: '', notes: '', items: [{ ...emptyItem }],
  });

  useEffect(() => {
    recordService.getById(recordId)
      .then(({ data }) => setRecord(data.data))
      .catch(() => toast.error('Record not found.'))
      .finally(() => setLoading(false));
  }, [recordId]);

  const addItem = () =>
    setForm((p) => ({ ...p, items: [...p.items, { ...emptyItem }] }));

  const removeItem = (i) =>
    setForm((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const updateItem = (i, field, val) =>
    setForm((p) => {
      const items = [...p.items];
      items[i] = { ...items[i], [field]: val };
      return { ...p, items };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.items.some((it) => !it.medicine_name.trim())) {
      toast.error('All medicine names are required.');
      return;
    }
    setSaving(true);
    try {
      await recordService.createPrescription(recordId, form);
      toast.success('Prescription created successfully.');
      navigate('/doctor/appointments');
    } catch { toast.error('Failed to create prescription.'); }
    finally { setSaving(false); }
  };

  if (loading) return <Layout><LoadingSpinner fullScreen /></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Write Prescription</h1>
          {record && <p className="page-subtitle">Patient: {record.patient_name} · {new Date(record.record_date).toLocaleDateString()}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card title="Diagnosis Summary">
          {record && (
            <div className="record-summary">
              <div className="detail-item"><span>Diagnosis</span><strong>{record.diagnosis}</strong></div>
              {record.symptoms && <div className="detail-item"><span>Symptoms</span><strong>{record.symptoms}</strong></div>}
              {record.treatment_plan && <div className="detail-item"><span>Treatment</span><strong>{record.treatment_plan}</strong></div>}
            </div>
          )}
        </Card>

        <Card title="Prescription Details" className="mt-4">
          <div className="form-row">
            <div className="form-group">
              <label>Valid Until</label>
              <input type="date" className="form-control"
                value={form.valid_until}
                onChange={(e) => setForm((p) => ({ ...p, valid_until: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input type="text" className="form-control"
                value={form.notes} placeholder="General notes…"
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>

          <div className="section-divider">
            <h4>Medicines</h4>
            <button type="button" className="btn btn-sm btn-secondary" onClick={addItem}>
              <FiPlus /> Add Medicine
            </button>
          </div>

          {form.items.map((item, i) => (
            <div key={i} className="medicine-row">
              <div className="medicine-row-header">
                <span>Medicine {i + 1}</span>
                {form.items.length > 1 && (
                  <button type="button" className="btn-icon btn-icon-danger" onClick={() => removeItem(i)}>
                    <FiTrash2 size={14} />
                  </button>
                )}
              </div>
              <div className="form-grid-5">
                <div className="form-group">
                  <label>Name *</label>
                  <input className="form-control" required value={item.medicine_name}
                    onChange={(e) => updateItem(i, 'medicine_name', e.target.value)}
                    placeholder="Aspirin 100mg" />
                </div>
                <div className="form-group">
                  <label>Dosage</label>
                  <input className="form-control" value={item.dosage}
                    onChange={(e) => updateItem(i, 'dosage', e.target.value)}
                    placeholder="1 tablet" />
                </div>
                <div className="form-group">
                  <label>Frequency</label>
                  <input className="form-control" value={item.frequency}
                    onChange={(e) => updateItem(i, 'frequency', e.target.value)}
                    placeholder="Twice daily" />
                </div>
                <div className="form-group">
                  <label>Duration</label>
                  <input className="form-control" value={item.duration}
                    onChange={(e) => updateItem(i, 'duration', e.target.value)}
                    placeholder="7 days" />
                </div>
                <div className="form-group">
                  <label>Qty</label>
                  <input type="number" min={1} className="form-control" value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Special Instructions</label>
                <input className="form-control" value={item.instructions}
                  onChange={(e) => updateItem(i, 'instructions', e.target.value)}
                  placeholder="Take after meals" />
              </div>
            </div>
          ))}
        </Card>

        <div className="form-actions mt-4">
          <button type="button" className="btn btn-secondary"
            onClick={() => navigate('/doctor/appointments')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : <><FiSave /> Save Prescription</>}
          </button>
        </div>
      </form>
    </Layout>
  );
};

export default WritePrescription;

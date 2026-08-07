import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import billingService from '../../services/billingService';
import patientService from '../../services/patientService';

const AdminBilling = () => {
  const [bills,       setBills]       = useState([]);
  const [pagination,  setPagination]  = useState(null);
  const [page,        setPage]        = useState(1);
  const [payStatus,   setPayStatus]   = useState('');
  const [loading,     setLoading]     = useState(true);
  const [createOpen,  setCreateOpen]  = useState(false);
  const [payOpen,     setPayOpen]     = useState(null);
  const [patients,    setPatients]    = useState([]);
  const [saving,      setSaving]      = useState(false);

  const [billForm, setBillForm] = useState({
    patient_id:'', consultation_fee:'', medicine_charges:'',
    lab_charges:'', other_charges:'', discount:'', tax:'', notes:'',
  });
  const [payForm, setPayForm] = useState({ amount:'', payment_method:'cash' });

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await billingService.getAll({ payment_status: payStatus, page, limit: 10 });
      setBills(data.data);
      setPagination(data.pagination);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [payStatus, page]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  useEffect(() => {
    patientService.getAll({ limit: 100 })
      .then(({ data }) => setPatients(data.data || []))
      .catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await billingService.create(billForm);
      toast.success('Bill created.');
      setCreateOpen(false);
      setBillForm({ patient_id:'', consultation_fee:'', medicine_charges:'',
        lab_charges:'', other_charges:'', discount:'', tax:'', notes:'' });
      fetchBills();
    } catch {
      toast.error('Failed to create bill.');
    } finally {
      setSaving(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await billingService.recordPayment(payOpen.id, payForm);
      toast.success('Payment recorded.');
      setPayOpen(null);
      setPayForm({ amount:'', payment_method:'cash' });
      fetchBills();
    } catch {
      toast.error('Payment failed.');
    } finally {
      setSaving(false);
    }
  };

  const f = (v) => Number(v || 0).toFixed(2);

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing</h1>
          <p className="page-subtitle">Manage patient bills and payments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <FiPlus /> Create Bill
        </button>
      </div>

      <Card>
        <div className="table-toolbar">
          <select className="form-control filter-select" value={payStatus}
            onChange={(e) => { setPayStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Bill #</th><th>Patient</th><th>Date</th>
                  <th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr><td colSpan={8} className="empty-row">No bills found.</td></tr>
                ) : bills.map((b) => (
                  <tr key={b.id}>
                    <td><code>{b.bill_number}</code></td>
                    <td>{b.patient_name}</td>
                    <td>{new Date(b.bill_date).toLocaleDateString()}</td>
                    <td>${f(b.total_amount)}</td>
                    <td>${f(b.paid_amount)}</td>
                    <td>${f(parseFloat(b.total_amount) - parseFloat(b.paid_amount))}</td>
                    <td><StatusBadge status={b.payment_status} /></td>
                    <td>
                      {b.payment_status !== 'paid' && (
                        <button className="btn btn-sm btn-success"
                          onClick={() => { setPayOpen(b); setPayForm({ amount:'', payment_method:'cash' }); }}>
                          <FiDollarSign size={13} /> Pay
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

      {/* Create Bill Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create New Bill" size="md">
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Patient *</label>
            <select className="form-control" required value={billForm.patient_id}
              onChange={(e) => setBillForm((p) => ({ ...p, patient_id: e.target.value }))}>
              <option value="">Select patient…</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div className="form-row">
            {[['consultation_fee','Consultation Fee'],['medicine_charges','Medicine'],
              ['lab_charges','Lab Charges'],['other_charges','Other']].map(([k,l]) => (
              <div className="form-group" key={k}>
                <label>{l} ($)</label>
                <input type="number" min={0} step="0.01" className="form-control"
                  value={billForm[k]}
                  onChange={(e) => setBillForm((p) => ({ ...p, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Discount ($)</label>
              <input type="number" min={0} step="0.01" className="form-control"
                value={billForm.discount}
                onChange={(e) => setBillForm((p) => ({ ...p, discount: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Tax ($)</label>
              <input type="number" min={0} step="0.01" className="form-control"
                value={billForm.tax}
                onChange={(e) => setBillForm((p) => ({ ...p, tax: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-control" rows={2} value={billForm.notes}
              onChange={(e) => setBillForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create Bill'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={!!payOpen} onClose={() => setPayOpen(null)} title="Record Payment" size="sm">
        {payOpen && (
          <form onSubmit={handlePayment}>
            <div className="bill-summary">
              <div><span>Total</span><strong>${f(payOpen.total_amount)}</strong></div>
              <div><span>Paid</span><strong>${f(payOpen.paid_amount)}</strong></div>
              <div className="balance-row">
                <span>Balance</span>
                <strong>${f(parseFloat(payOpen.total_amount) - parseFloat(payOpen.paid_amount))}</strong>
              </div>
            </div>
            <div className="form-group">
              <label>Payment Amount *</label>
              <input type="number" min={0.01} step="0.01" className="form-control" required
                value={payForm.amount}
                onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Payment Method *</label>
              <select className="form-control" value={payForm.payment_method}
                onChange={(e) => setPayForm((p) => ({ ...p, payment_method: e.target.value }))}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="online">Online</option>
                <option value="insurance">Insurance</option>
              </select>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setPayOpen(null)}>Cancel</button>
              <button type="submit" className="btn btn-success" disabled={saving}>
                {saving ? 'Processing…' : 'Record Payment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </Layout>
  );
};

export default AdminBilling;

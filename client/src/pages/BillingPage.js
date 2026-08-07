import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import billingService from '../services/billingService';

const BillingPage = () => {
  const { id } = useParams();
  const [bill,    setBill]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    billingService.getById(id)
      .then(({ data }) => setBill(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><LoadingSpinner fullScreen /></Layout>;
  if (!bill)   return <Layout><div className="empty-state">Bill not found.</div></Layout>;

  const f = (v) => Number(v || 0).toFixed(2);

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Bill Details</h1>
        <StatusBadge status={bill.payment_status} />
      </div>

      <Card title={`Bill #${bill.bill_number}`}>
        <div className="bill-detail-grid">
          <div className="detail-item"><span>Patient</span><strong>{bill.patient_name}</strong></div>
          <div className="detail-item"><span>Bill Date</span><strong>{new Date(bill.bill_date).toLocaleDateString()}</strong></div>
          {bill.due_date && <div className="detail-item"><span>Due Date</span><strong>{new Date(bill.due_date).toLocaleDateString()}</strong></div>}
          {bill.payment_method && <div className="detail-item"><span>Payment Method</span><strong className="capitalize">{bill.payment_method}</strong></div>}
        </div>

        <div className="bill-breakdown mt-4">
          {[
            ['Consultation Fee', bill.consultation_fee],
            ['Medicine Charges', bill.medicine_charges],
            ['Lab Charges',      bill.lab_charges],
            ['Other Charges',    bill.other_charges],
          ].map(([label, val]) => parseFloat(val) > 0 && (
            <div key={label} className="bill-line">
              <span>{label}</span><span>${f(val)}</span>
            </div>
          ))}
          {parseFloat(bill.discount) > 0 && (
            <div className="bill-line discount">
              <span>Discount</span><span>– ${f(bill.discount)}</span>
            </div>
          )}
          {parseFloat(bill.tax) > 0 && (
            <div className="bill-line">
              <span>Tax</span><span>${f(bill.tax)}</span>
            </div>
          )}
          <div className="bill-line total"><span>Total</span><strong>${f(bill.total_amount)}</strong></div>
          <div className="bill-line paid"><span>Paid</span><strong>${f(bill.paid_amount)}</strong></div>
          <div className="bill-line balance">
            <span>Balance Due</span>
            <strong>${f(parseFloat(bill.total_amount) - parseFloat(bill.paid_amount))}</strong>
          </div>
        </div>

        {bill.notes && <p className="bill-notes mt-4"><strong>Notes:</strong> {bill.notes}</p>}
      </Card>
    </Layout>
  );
};

export default BillingPage;

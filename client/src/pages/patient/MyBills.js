import React, { useEffect, useState, useCallback } from 'react';
import { FiDollarSign, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import billingService from '../../services/billingService';

const MyBills = () => {
  const [bills,      setBills]      = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page,       setPage]       = useState(1);
  const [payStatus,  setPayStatus]  = useState('');
  const [loading,    setLoading]    = useState(true);
  const [expanded,   setExpanded]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await billingService.getAll({ payment_status: payStatus, page, limit: 10 });
      setBills(data.data);
      setPagination(data.pagination);
    } catch {} finally { setLoading(false); }
  }, [payStatus, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const f = (v) => Number(v || 0).toFixed(2);

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">My Bills</h1>
        <p className="page-subtitle">Payment history and outstanding balances</p>
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

        {loading ? <LoadingSpinner /> : bills.length === 0 ? (
          <div className="empty-state">
            <FiDollarSign size={40} />
            <p>No bills found.</p>
          </div>
        ) : (
          <div className="bills-list">
            {bills.map((b) => (
              <div key={b.id} className="bill-item">
                <div className="bill-header" onClick={() => setExpanded(expanded === b.id ? null : b.id)}>
                  <div className="bill-header-left">
                    <code className="bill-number">{b.bill_number}</code>
                    <div>
                      <strong>${f(b.total_amount)}</strong>
                      <small>{new Date(b.bill_date).toLocaleDateString()}</small>
                    </div>
                  </div>
                  <div className="bill-header-right">
                    <StatusBadge status={b.payment_status} />
                    <button className="btn-icon">
                      {expanded === b.id ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  </div>
                </div>

                {expanded === b.id && (
                  <div className="bill-body">
                    <div className="bill-breakdown">
                      {[
                        ['Consultation Fee', b.consultation_fee],
                        ['Medicine Charges', b.medicine_charges],
                        ['Lab Charges',      b.lab_charges],
                        ['Other Charges',    b.other_charges],
                      ].map(([label, val]) => parseFloat(val) > 0 && (
                        <div key={label} className="bill-line">
                          <span>{label}</span><span>${f(val)}</span>
                        </div>
                      ))}
                      {parseFloat(b.discount) > 0 && (
                        <div className="bill-line discount">
                          <span>Discount</span><span>– ${f(b.discount)}</span>
                        </div>
                      )}
                      {parseFloat(b.tax) > 0 && (
                        <div className="bill-line">
                          <span>Tax</span><span>${f(b.tax)}</span>
                        </div>
                      )}
                      <div className="bill-line total">
                        <span>Total</span><strong>${f(b.total_amount)}</strong>
                      </div>
                      <div className="bill-line paid">
                        <span>Paid</span><strong>${f(b.paid_amount)}</strong>
                      </div>
                      {parseFloat(b.total_amount) - parseFloat(b.paid_amount) > 0 && (
                        <div className="bill-line balance">
                          <span>Balance Due</span>
                          <strong>${f(parseFloat(b.total_amount) - parseFloat(b.paid_amount))}</strong>
                        </div>
                      )}
                    </div>
                    {b.payment_method && (
                      <p className="payment-method-tag">
                        Paid via: <strong>{b.payment_method}</strong>
                      </p>
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

export default MyBills;

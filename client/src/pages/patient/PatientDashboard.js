import React, { useEffect, useState } from 'react';
import { FiCalendar, FiFileText, FiDollarSign, FiActivity } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import dashboardService from '../../services/dashboardService';

const PatientDashboard = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardService.getPatient()
      .then(({ data: res }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><LoadingSpinner fullScreen message="Loading…" /></Layout>;

  const summary = data?.summary || {};
  const appts   = summary.appointments || {};
  const billing = summary.billing      || {};

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {data?.patient?.full_name} 👋</h1>
          <p className="page-subtitle">Your health at a glance</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/patient/book')}>
          + Book Appointment
        </button>
      </div>

      <div className="stats-grid">
        <StatCard icon={<FiCalendar />}  label="Upcoming Appointments"
          value={appts.upcoming || 0} color="blue" />
        <StatCard icon={<FiActivity />}  label="Total Visits"
          value={appts.completed || 0} color="green" />
        <StatCard icon={<FiFileText />}  label="Medical Records"
          value={summary.records?.total || 0} color="orange" />
        <StatCard icon={<FiDollarSign />}label="Pending Bills"
          value={billing.unpaid_count || 0} color="red" />
      </div>

      <div className="dashboard-grid">
        {/* Upcoming appointments */}
        <Card title="Upcoming Appointments"
          action={<button className="btn btn-sm btn-secondary"
            onClick={() => navigate('/patient/appointments')}>View all</button>}>
          {(data?.upcoming_appointments || []).length === 0 ? (
            <div className="empty-state">
              <FiCalendar size={32} />
              <p>No upcoming appointments.</p>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/patient/book')}>
                Book now
              </button>
            </div>
          ) : data.upcoming_appointments.map((a) => (
            <div key={a.id} className="appointment-row">
              <div className="appt-doctor-avatar">
                {a.doctor_avatar
                  ? <img src={a.doctor_avatar} alt="" />
                  : <div className="avatar-sm">{a.doctor_name?.[0]}</div>
                }
              </div>
              <div className="appt-info">
                <strong>{a.doctor_name}</strong>
                <span>{a.specialization}</span>
                <small>
                  <FiCalendar size={11} /> {new Date(a.appointment_date).toLocaleDateString()} at {a.appointment_time?.slice(0,5)}
                </small>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </Card>

        {/* Recent records */}
        <Card title="Recent Medical Records"
          action={<button className="btn btn-sm btn-secondary"
            onClick={() => navigate('/patient/records')}>View all</button>}>
          {(data?.recent_records || []).length === 0 ? (
            <div className="empty-state">
              <FiFileText size={32} />
              <p>No medical records yet.</p>
            </div>
          ) : data.recent_records.map((r) => (
            <div key={r.id} className="record-row">
              <div className="record-date">
                {new Date(r.record_date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
              </div>
              <div className="record-info">
                <strong>{r.diagnosis}</strong>
                <span>Dr. {r.doctor_name} · {r.specialization}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Recent bills */}
      <Card title="Recent Bills"
        action={<button className="btn btn-sm btn-secondary"
          onClick={() => navigate('/patient/bills')}>View all</button>}>
        {(data?.recent_bills || []).length === 0 ? (
          <p className="text-muted">No bills.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Bill #</th><th>Date</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.recent_bills.map((b) => (
                  <tr key={b.id}>
                    <td><code>{b.bill_number}</code></td>
                    <td>{new Date(b.bill_date).toLocaleDateString()}</td>
                    <td>${Number(b.total_amount).toFixed(2)}</td>
                    <td><StatusBadge status={b.payment_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Layout>
  );
};

export default PatientDashboard;

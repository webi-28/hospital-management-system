import React, { useEffect, useState } from 'react';
import { FiUsers, FiUserCheck, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import dashboardService from '../../services/dashboardService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminDashboard = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getAdmin()
      .then(({ data: res }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><LoadingSpinner fullScreen message="Loading dashboard..." /></Layout>;

  const appts   = data?.appointments   || {};
  const revenue = data?.revenue        || {};

  const revenueChartData = {
    labels: data?.monthly_revenue?.map((r) => r.month) || [],
    datasets: [{
      label: 'Revenue ($)',
      data: data?.monthly_revenue?.map((r) => parseFloat(r.revenue)) || [],
      backgroundColor: 'rgba(26,115,232,0.7)',
      borderRadius: 6,
    }],
  };

  const apptDonutData = {
    labels: ['Pending','Confirmed','Completed','Cancelled'],
    datasets: [{
      data: [appts.pending, appts.confirmed, appts.completed, appts.cancelled].map(Number),
      backgroundColor: ['#f59e0b','#3b82f6','#10b981','#ef4444'],
      borderWidth: 0,
    }],
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Hospital overview at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        <StatCard icon={<FiUsers />}     label="Total Patients"  value={data?.total_patients  || 0} color="blue" />
        <StatCard icon={<FiUserCheck />} label="Total Doctors"   value={data?.total_doctors   || 0} color="green" />
        <StatCard icon={<FiCalendar />}  label="Today's Appts"   value={appts.today           || 0} color="orange" />
        <StatCard icon={<FiDollarSign />}label="Revenue (Total)"
          value={`$${Number(revenue.total_collected || 0).toLocaleString()}`} color="purple" />
      </div>

      <div className="dashboard-grid">
        {/* Revenue chart */}
        <Card title="Monthly Revenue" className="chart-card">
          <Bar data={revenueChartData} options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } },
          }} />
        </Card>

        {/* Appointment status donut */}
        <Card title="Appointment Status">
          <Doughnut data={apptDonutData} options={{
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            cutout: '65%',
          }} />
          <div className="donut-center-label">
            <strong>{appts.total || 0}</strong>
            <span>Total</span>
          </div>
        </Card>
      </div>

      <div className="dashboard-grid">
        {/* Recent appointments */}
        <Card title="Recent Appointments">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {(data?.recent_appointments || []).map((a) => (
                  <tr key={a.id}>
                    <td>{a.patient_name}</td>
                    <td>{a.doctor_name}</td>
                    <td>{new Date(a.appointment_date).toLocaleDateString()}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top doctors */}
        <Card title="Top Doctors">
          {(data?.top_doctors || []).map((d, i) => (
            <div key={i} className="top-doctor-row">
              <div className="top-rank">{i + 1}</div>
              <div className="top-info">
                <strong>{d.full_name}</strong>
                <span>{d.specialization}</span>
              </div>
              <div className="top-stat">
                <FiCalendar size={14} /> {d.total_appointments}
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Revenue summary */}
      <Card title="Revenue Summary">
        <div className="revenue-grid">
          {[
            { label: 'Total Billed',     value: revenue.total_billed,     color: 'blue' },
            { label: 'Collected',        value: revenue.total_collected,   color: 'green' },
            { label: 'Outstanding',      value: revenue.total_outstanding, color: 'red' },
            { label: 'This Month',       value: revenue.this_month,        color: 'orange' },
          ].map((r) => (
            <div key={r.label} className={`revenue-item rev-${r.color}`}>
              <span>{r.label}</span>
              <strong>${Number(r.value || 0).toLocaleString()}</strong>
            </div>
          ))}
        </div>
      </Card>
    </Layout>
  );
};

export default AdminDashboard;

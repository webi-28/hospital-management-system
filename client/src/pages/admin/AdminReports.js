import React, { useEffect, useState } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, LineElement,
  PointElement, Title, Tooltip, Legend, ArcElement, Filler,
} from 'chart.js';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import dashboardService from '../../services/dashboardService';
import billingService from '../../services/billingService';
import { FiCalendar, FiUsers, FiDollarSign } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, LineElement,
  PointElement, Title, Tooltip, Legend, ArcElement, Filler);

const AdminReports = () => {
  const [dash,    setDash]    = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardService.getAdmin(),
      billingService.getStats(),
    ])
      .then(([dashRes, revRes]) => {
        setDash(dashRes.data.data);
        setRevenue(revRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><LoadingSpinner fullScreen message="Loading reports…" /></Layout>;

  const monthlyRevChart = {
    labels: dash?.monthly_revenue?.map((r) => r.month) || [],
    datasets: [{
      label: 'Revenue ($)',
      data: dash?.monthly_revenue?.map((r) => parseFloat(r.revenue)) || [],
      borderColor: '#1a73e8',
      backgroundColor: 'rgba(26,115,232,0.1)',
      tension: 0.4, fill: true,
    }],
  };

  const appts = dash?.appointments || {};
  const apptStatusChart = {
    labels: ['Pending','Confirmed','Completed','Cancelled','No Show'],
    datasets: [{
      data: [appts.pending, appts.confirmed, appts.completed, appts.cancelled, appts.no_show || 0].map(Number),
      backgroundColor: ['#f59e0b','#3b82f6','#10b981','#ef4444','#6b7280'],
      borderWidth: 0,
    }],
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Reports & Analytics</h1>
        <p className="page-subtitle">Hospital performance metrics</p>
      </div>

      <div className="stats-grid">
        <StatCard icon={<FiUsers />}     label="Total Patients"  value={dash?.total_patients || 0}  color="blue" />
        <StatCard icon={<FiUsers />}     label="Total Doctors"   value={dash?.total_doctors  || 0}  color="green" />
        <StatCard icon={<FiCalendar />}  label="Total Appts"     value={appts.total          || 0}  color="orange" />
        <StatCard icon={<FiDollarSign />}label="Total Revenue"
          value={`$${Number(revenue?.total_billed || 0).toLocaleString()}`} color="purple" />
      </div>

      <div className="dashboard-grid">
        <Card title="Revenue Trend (6 months)" className="chart-card-wide">
          <Line data={monthlyRevChart} options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } },
          }} />
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card title="Appointment Status Distribution">
          <Doughnut data={apptStatusChart} options={{
            responsive: true,
            plugins: { legend: { position: 'right' } },
            cutout: '60%',
          }} />
        </Card>

        <Card title="Top Performing Doctors">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>#</th><th>Doctor</th><th>Specialization</th><th>Appointments</th></tr>
              </thead>
              <tbody>
                {(dash?.top_doctors || []).map((d, i) => (
                  <tr key={i}>
                    <td><span className="rank-badge">{i+1}</span></td>
                    <td>{d.full_name}</td>
                    <td>{d.specialization}</td>
                    <td><strong>{d.total_appointments}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card title="Billing Summary">
        <div className="revenue-grid">
          {[
            { label:'Total Billed',    value: revenue?.total_billed,    color:'blue' },
            { label:'Collected',       value: revenue?.total_collected, color:'green' },
            { label:'Outstanding',     value: revenue?.total_outstanding, color:'red' },
            { label:'Unpaid Bills',    value: revenue?.unpaid_count + ' bills', color:'orange', raw:true },
          ].map((r) => (
            <div key={r.label} className={`revenue-item rev-${r.color}`}>
              <span>{r.label}</span>
              <strong>{r.raw ? r.value : `$${Number(r.value||0).toLocaleString()}`}</strong>
            </div>
          ))}
        </div>
      </Card>
    </Layout>
  );
};

export default AdminReports;

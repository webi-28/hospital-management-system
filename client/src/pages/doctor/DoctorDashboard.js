import React, { useEffect, useState } from 'react';
import { FiCalendar, FiUsers, FiCheckCircle, FiClock } from 'react-icons/fi';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import dashboardService from '../../services/dashboardService';
import appointmentService from '../../services/appointmentService';
import toast from 'react-hot-toast';

const DoctorDashboard = () => {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [updating,  setUpdating]  = useState(null);

  useEffect(() => {
    dashboardService.getDoctor()
      .then(({ data: res }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id, status) => {
    setUpdating(id);
    try {
      await appointmentService.updateStatus(id, { status });
      toast.success(`Appointment ${status}.`);
      // Refresh
      const { data: res } = await dashboardService.getDoctor();
      setData(res.data);
    } catch {
      toast.error('Update failed.');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <Layout><LoadingSpinner fullScreen message="Loading…" /></Layout>;

  const stats = data?.stats || {};

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {data?.doctor?.full_name} 👋</h1>
          <p className="page-subtitle">{data?.doctor?.specialization}</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={<FiCalendar />}     label="Today's Appointments" value={stats.today || 0}     color="blue" />
        <StatCard icon={<FiCheckCircle />}  label="Completed"            value={stats.completed || 0} color="green" />
        <StatCard icon={<FiClock />}        label="Total Appointments"   value={stats.total || 0}     color="orange" />
        <StatCard icon={<FiUsers />}        label="Unique Patients"
          value={(data?.recent_patients || []).length} color="purple" />
      </div>

      <div className="dashboard-grid">
        {/* Today's schedule */}
        <Card title="Today's Schedule" action={
          <span className="badge badge-info">{(data?.today_appointments || []).length} appointments</span>
        }>
          {(data?.today_appointments || []).length === 0 ? (
            <div className="empty-state">
              <FiCalendar size={32} />
              <p>No appointments today.</p>
            </div>
          ) : (data.today_appointments.map((a) => (
            <div key={a.id} className="appointment-row">
              <div className="appt-time">{a.appointment_time?.slice(0,5)}</div>
              <div className="appt-info">
                <strong>{a.patient_name}</strong>
                <span>{a.gender} · {a.blood_group}</span>
                {a.reason && <small className="appt-reason">{a.reason}</small>}
              </div>
              <div className="appt-actions">
                <StatusBadge status={a.status} />
                {a.status === 'pending' && (
                  <button className="btn btn-sm btn-success"
                    disabled={updating === a.id}
                    onClick={() => handleStatusChange(a.id, 'confirmed')}>
                    Confirm
                  </button>
                )}
                {a.status === 'confirmed' && (
                  <button className="btn btn-sm btn-primary"
                    disabled={updating === a.id}
                    onClick={() => handleStatusChange(a.id, 'completed')}>
                    Complete
                  </button>
                )}
              </div>
            </div>
          )))}
        </Card>

        {/* Upcoming appointments */}
        <Card title="Upcoming Appointments">
          {(data?.upcoming_appointments || []).length === 0 ? (
            <div className="empty-state">
              <FiClock size={32} />
              <p>No upcoming appointments.</p>
            </div>
          ) : (data.upcoming_appointments.map((a) => (
            <div key={a.id} className="appointment-row compact">
              <div className="appt-date">
                {new Date(a.appointment_date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
              </div>
              <div className="appt-info">
                <strong>{a.patient_name}</strong>
                <span>{a.type?.replace('_',' ')}</span>
              </div>
              <StatusBadge status={a.status} />
            </div>
          )))}
        </Card>
      </div>

      {/* Recent patients */}
      <Card title="Recent Patients">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Gender</th><th>Blood Group</th><th>Last Visit</th></tr>
            </thead>
            <tbody>
              {(data?.recent_patients || []).length === 0 ? (
                <tr><td colSpan={4} className="empty-row">No recent patients.</td></tr>
              ) : data.recent_patients.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.full_name}</strong></td>
                  <td className="capitalize">{p.gender || '–'}</td>
                  <td>{p.blood_group || '–'}</td>
                  <td>{p.last_visit ? new Date(p.last_visit).toLocaleDateString() : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  );
};

export default DoctorDashboard;

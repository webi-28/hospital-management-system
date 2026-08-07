import React, { useEffect, useState, useCallback } from 'react';
import { FiSave, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import doctorService from '../../services/doctorService';
import { format, addDays, startOfWeek } from 'date-fns';

const DoctorSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [form, setForm] = useState({
    schedule_date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00', end_time: '17:00',
    is_available: true, reason: '',
  });

  const today  = format(new Date(), 'yyyy-MM-dd');
  const future = format(addDays(new Date(), 30), 'yyyy-MM-dd');

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await doctorService.getMySchedule({ from_date: today, to_date: future });
      setSchedules(data.data || []);
    } catch {} finally { setLoading(false); }
  }, [today, future]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await doctorService.upsertSchedule(form);
      toast.success('Schedule saved.');
      await fetchSchedule();
    } catch { toast.error('Save failed.'); }
    finally { setSaving(false); }
  };

  // Generate week view
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">My Schedule</h1>
        <p className="page-subtitle">Manage your availability and working hours</p>
      </div>

      <div className="dashboard-grid">
        {/* Add / block slot form */}
        <Card title="Set Availability">
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Date</label>
              <input type="date" className="form-control" required
                value={form.schedule_date}
                min={today}
                onChange={(e) => setForm((p) => ({ ...p, schedule_date: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Time</label>
                <input type="time" className="form-control"
                  value={form.start_time}
                  onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input type="time" className="form-control"
                  value={form.end_time}
                  onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="toggle-label">
                <span>Available on this day?</span>
                <input type="checkbox" className="toggle-input"
                  checked={form.is_available}
                  onChange={(e) => setForm((p) => ({ ...p, is_available: e.target.checked }))} />
                <span className="toggle-switch" />
              </label>
            </div>

            {!form.is_available && (
              <div className="form-group">
                <label>Reason (optional)</label>
                <input type="text" className="form-control" placeholder="e.g. Holiday, Conference"
                  value={form.reason}
                  onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} />
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
              {saving ? 'Saving…' : <><FiSave /> Save Schedule</>}
            </button>
          </form>
        </Card>

        {/* Week view */}
        <Card title="This Week">
          <div className="week-grid">
            {weekDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const sched   = schedules.find((s) => s.schedule_date?.slice(0,10) === dateStr);
              return (
                <div key={dateStr} className={`week-day ${sched ? (sched.is_available ? 'available' : 'blocked') : ''}`}>
                  <div className="week-day-name">{format(day, 'EEE')}</div>
                  <div className="week-day-num">{format(day, 'd')}</div>
                  {sched && (
                    <div className="week-day-info">
                      {sched.is_available
                        ? <span className="badge badge-success">{sched.start_time?.slice(0,5)}–{sched.end_time?.slice(0,5)}</span>
                        : <span className="badge badge-danger">Off</span>
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Full schedule list */}
      <Card title="Upcoming Schedule (30 days)">
        {loading ? <LoadingSpinner /> : schedules.length === 0 ? (
          <div className="empty-state">
            <FiCalendar size={32} />
            <p>No schedule entries. Use the form above to set your availability.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Day</th><th>Start</th><th>End</th><th>Status</th><th>Reason</th></tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id}>
                    <td>{new Date(s.schedule_date).toLocaleDateString()}</td>
                    <td>{new Date(s.schedule_date).toLocaleDateString('en-US',{weekday:'long'})}</td>
                    <td>{s.start_time?.slice(0,5)}</td>
                    <td>{s.end_time?.slice(0,5)}</td>
                    <td>
                      <span className={`badge ${s.is_available ? 'badge-success' : 'badge-danger'}`}>
                        {s.is_available ? 'Available' : 'Blocked'}
                      </span>
                    </td>
                    <td>{s.reason || '–'}</td>
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

export default DoctorSchedule;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiCalendar, FiClock, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import doctorService from '../../services/doctorService';
import appointmentService from '../../services/appointmentService';
import { format, addDays } from 'date-fns';

const STEPS = ['Choose Doctor', 'Pick Date & Time', 'Confirm'];

const BookAppointment = () => {
  const navigate = useNavigate();
  const [step,           setStep]           = useState(0);
  const [doctors,        setDoctors]        = useState([]);
  const [specializations,setSpecs]          = useState([]);
  const [departments,    setDepts]          = useState([]);
  const [specFilter,     setSpecFilter]     = useState('');
  const [deptFilter,     setDeptFilter]     = useState('');
  const [search,         setSearch]         = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate,   setSelectedDate]   = useState(format(addDays(new Date(),1),'yyyy-MM-dd'));
  const [slots,          setSlots]          = useState([]);
  const [selectedSlot,   setSelectedSlot]   = useState('');
  const [reason,         setReason]         = useState('');
  const [apptType,       setApptType]       = useState('consultation');
  const [loading,        setLoading]        = useState(false);
  const [slotsLoading,   setSlotsLoading]   = useState(false);
  const [booking,        setBooking]        = useState(false);

  // Load doctors
  useEffect(() => {
    setLoading(true);
    Promise.all([
      doctorService.getAll({ search, specialization: specFilter, department_id: deptFilter, limit: 20 }),
      doctorService.getSpecializations(),
      doctorService.getDepartments(),
    ])
      .then(([d, s, dep]) => {
        setDoctors(d.data.data || []);
        setSpecs(s.data.data   || []);
        setDepts(dep.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, specFilter, deptFilter]);

  // Load slots when doctor/date changes
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;
    setSlotsLoading(true);
    doctorService.getSlots(selectedDoctor.id, selectedDate)
      .then(({ data }) => {
        setSlots(data.data.slots || []);
        setSelectedSlot('');
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDoctor, selectedDate]);

  const handleBooking = async () => {
    if (!selectedSlot) { toast.error('Please select a time slot.'); return; }
    setBooking(true);
    try {
      await appointmentService.create({
        doctor_id:        selectedDoctor.id,
        appointment_date: selectedDate,
        appointment_time: selectedSlot,
        type:             apptType,
        reason,
      });
      toast.success('Appointment booked successfully!');
      navigate('/patient/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed.');
    } finally { setBooking(false); }
  };

  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Book Appointment</h1>
        <p className="page-subtitle">Find a doctor and schedule your visit</p>
      </div>

      {/* Step indicator */}
      <div className="step-indicator">
        {STEPS.map((s, i) => (
          <div key={s} className={`step-item ${i === step ? 'active' : i < step ? 'done' : ''}`}>
            <div className="step-circle">
              {i < step ? <FiCheckCircle /> : i + 1}
            </div>
            <span>{s}</span>
          </div>
        ))}
      </div>

      {/* STEP 0 – Choose Doctor */}
      {step === 0 && (
        <Card title="Find a Doctor">
          <div className="book-filters">
            <div className="search-bar">
              <FiSearch className="search-icon" size={16} />
              <input type="text" className="search-input" placeholder="Search by name…"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="form-control filter-select" value={specFilter}
              onChange={(e) => setSpecFilter(e.target.value)}>
              <option value="">All Specializations</option>
              {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="form-control filter-select" value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {loading ? <LoadingSpinner /> : (
            <div className="doctor-grid">
              {doctors.length === 0 ? (
                <p className="text-muted">No doctors found.</p>
              ) : doctors.map((d) => (
                <div
                  key={d.id}
                  className={`doctor-card ${selectedDoctor?.id === d.id ? 'selected' : ''}`}
                  onClick={() => setSelectedDoctor(d)}
                >
                  <div className="doctor-card-avatar">
                    {d.avatar_url
                      ? <img src={d.avatar_url} alt={d.full_name} />
                      : <div className="avatar-lg">{d.full_name?.[0]}</div>
                    }
                  </div>
                  <div className="doctor-card-info">
                    <h4>{d.full_name}</h4>
                    <span className="specialization">{d.specialization}</span>
                    <span className="department">{d.department_name}</span>
                    <div className="doctor-card-meta">
                      <span>⭐ {d.rating || '–'}</span>
                      <span>{d.experience_years} yrs exp.</span>
                      <span className="fee">${d.consultation_fee}</span>
                    </div>
                    {d.available_days?.length > 0 && (
                      <div className="avail-days">
                        {d.available_days.map((day) => (
                          <span key={day} className="day-chip">{day.slice(0,3)}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedDoctor?.id === d.id && (
                    <div className="selected-check"><FiCheckCircle /></div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="step-nav">
            <span />
            <button className="btn btn-primary" disabled={!selectedDoctor}
              onClick={() => setStep(1)}>
              Next →
            </button>
          </div>
        </Card>
      )}

      {/* STEP 1 – Pick Date & Time */}
      {step === 1 && selectedDoctor && (
        <Card title={`Book with ${selectedDoctor.full_name}`}>
          <div className="selected-doctor-banner">
            <div className="avatar-md">{selectedDoctor.full_name?.[0]}</div>
            <div>
              <strong>{selectedDoctor.full_name}</strong>
              <span>{selectedDoctor.specialization} · ${selectedDoctor.consultation_fee}</span>
            </div>
          </div>

          <div className="form-row mt-4">
            <div className="form-group">
              <label><FiCalendar /> Appointment Date</label>
              <input type="date" className="form-control" min={tomorrow}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Appointment Type</label>
              <select className="form-control" value={apptType}
                onChange={(e) => setApptType(e.target.value)}>
                <option value="consultation">Consultation</option>
                <option value="follow_up">Follow-up</option>
                <option value="check_up">Check-up</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label><FiClock /> Available Time Slots</label>
            {slotsLoading ? <LoadingSpinner size={24} /> : slots.length === 0 ? (
              <p className="text-muted">No slots available on this date.</p>
            ) : (
              <div className="slots-grid">
                {slots.map((slot) => (
                  <button key={slot} type="button"
                    className={`slot-btn ${selectedSlot === slot ? 'active' : ''}`}
                    onClick={() => setSelectedSlot(slot)}>
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Reason for Visit (optional)</label>
            <textarea className="form-control" rows={2} value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe your symptoms or reason…" />
          </div>

          <div className="step-nav">
            <button className="btn btn-secondary" onClick={() => setStep(0)}>← Back</button>
            <button className="btn btn-primary" disabled={!selectedSlot}
              onClick={() => setStep(2)}>
              Next →
            </button>
          </div>
        </Card>
      )}

      {/* STEP 2 – Confirm */}
      {step === 2 && selectedDoctor && (
        <Card title="Confirm Appointment">
          <div className="confirm-summary">
            <div className="confirm-row">
              <span>Doctor</span>
              <strong>{selectedDoctor.full_name}</strong>
            </div>
            <div className="confirm-row">
              <span>Specialization</span>
              <strong>{selectedDoctor.specialization}</strong>
            </div>
            <div className="confirm-row">
              <span>Date</span>
              <strong>{new Date(selectedDate).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</strong>
            </div>
            <div className="confirm-row">
              <span>Time</span>
              <strong>{selectedSlot}</strong>
            </div>
            <div className="confirm-row">
              <span>Type</span>
              <strong className="capitalize">{apptType.replace('_',' ')}</strong>
            </div>
            <div className="confirm-row">
              <span>Consultation Fee</span>
              <strong className="fee">${selectedDoctor.consultation_fee}</strong>
            </div>
            {reason && (
              <div className="confirm-row">
                <span>Reason</span>
                <strong>{reason}</strong>
              </div>
            )}
          </div>

          <div className="step-nav mt-4">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" onClick={handleBooking} disabled={booking}>
              {booking ? 'Booking…' : '✓ Confirm Booking'}
            </button>
          </div>
        </Card>
      )}
    </Layout>
  );
};

export default BookAppointment;

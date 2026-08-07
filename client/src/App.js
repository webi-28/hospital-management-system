import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const Login          = lazy(() => import('./pages/auth/Login'));
const Register       = lazy(() => import('./pages/auth/Register'));

// Admin
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageDoctors     = lazy(() => import('./pages/admin/ManageDoctors'));
const ManagePatients    = lazy(() => import('./pages/admin/ManagePatients'));
const ManageAppointments = lazy(() => import('./pages/admin/ManageAppointments'));
const AdminBilling      = lazy(() => import('./pages/admin/AdminBilling'));
const AdminReports      = lazy(() => import('./pages/admin/AdminReports'));

// Doctor
const DoctorDashboard   = lazy(() => import('./pages/doctor/DoctorDashboard'));
const DoctorAppointments = lazy(() => import('./pages/doctor/DoctorAppointments'));
const DoctorPatients    = lazy(() => import('./pages/doctor/DoctorPatients'));
const DoctorSchedule    = lazy(() => import('./pages/doctor/DoctorSchedule'));
const WritePrescription = lazy(() => import('./pages/doctor/WritePrescription'));

// Patient
const PatientDashboard  = lazy(() => import('./pages/patient/PatientDashboard'));
const BookAppointment   = lazy(() => import('./pages/patient/BookAppointment'));
const MyAppointments    = lazy(() => import('./pages/patient/MyAppointments'));
const MyRecords         = lazy(() => import('./pages/patient/MyRecords'));
const MyBills           = lazy(() => import('./pages/patient/MyBills'));
const MyPrescriptions   = lazy(() => import('./pages/patient/MyPrescriptions'));

// Shared
const MedicalRecords    = lazy(() => import('./pages/MedicalRecords'));
const BillingPage       = lazy(() => import('./pages/BillingPage'));
const Profile           = lazy(() => import('./pages/Profile'));
const NotFound          = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { borderRadius: '8px', fontFamily: 'Inter, sans-serif' },
            }}
          />
          <Suspense fallback={<LoadingSpinner fullScreen />}>
            <Routes>
              {/* Public */}
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/"         element={<Navigate to="/login" replace />} />

              {/* Admin */}
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="/admin"               element={<AdminDashboard />} />
                <Route path="/admin/doctors"        element={<ManageDoctors />} />
                <Route path="/admin/patients"       element={<ManagePatients />} />
                <Route path="/admin/appointments"   element={<ManageAppointments />} />
                <Route path="/admin/billing"        element={<AdminBilling />} />
                <Route path="/admin/reports"        element={<AdminReports />} />
              </Route>

              {/* Doctor */}
              <Route element={<ProtectedRoute roles={['doctor']} />}>
                <Route path="/doctor"                 element={<DoctorDashboard />} />
                <Route path="/doctor/appointments"    element={<DoctorAppointments />} />
                <Route path="/doctor/patients"        element={<DoctorPatients />} />
                <Route path="/doctor/schedule"        element={<DoctorSchedule />} />
                <Route path="/doctor/prescriptions/new/:recordId" element={<WritePrescription />} />
                <Route path="/doctor/records"         element={<MedicalRecords />} />
              </Route>

              {/* Patient */}
              <Route element={<ProtectedRoute roles={['patient']} />}>
                <Route path="/patient"               element={<PatientDashboard />} />
                <Route path="/patient/book"          element={<BookAppointment />} />
                <Route path="/patient/appointments"  element={<MyAppointments />} />
                <Route path="/patient/records"       element={<MyRecords />} />
                <Route path="/patient/bills"         element={<MyBills />} />
                <Route path="/patient/prescriptions" element={<MyPrescriptions />} />
              </Route>

              {/* Shared (any authenticated role) */}
              <Route element={<ProtectedRoute roles={['admin','doctor','patient']} />}>
                <Route path="/records/:id" element={<MedicalRecords />} />
                <Route path="/billing/:id" element={<BillingPage />} />
                <Route path="/profile"     element={<Profile />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

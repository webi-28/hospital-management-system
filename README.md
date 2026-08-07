# 🏥 Hospital Management System

A comprehensive full-stack Hospital Management System built with **React**, **Node.js / Express**, and **PostgreSQL**.

---

## ✨ Features

| Module | Description |
|--------|-------------|
| **Authentication** | JWT-based login & registration with bcrypt hashing |
| **Role-Based Access** | Admin, Doctor, Patient – each with their own dashboard |
| **Doctor Management** | Add/edit doctors, set specialization, fee, availability |
| **Patient Management** | Full patient profiles with medical history |
| **Appointment Booking** | 3-step booking wizard with real-time slot availability |
| **Medical Records** | Diagnosis, treatment, lab report uploads (Cloudinary/local) |
| **Prescriptions** | Doctor writes prescriptions with itemized medicines |
| **Billing** | Generate bills, record payments, view balance |
| **Notifications** | In-app notifications for appointments, billing, prescriptions |
| **Reports & Analytics** | Revenue charts, appointment stats, top doctors |
| **Dark Mode** | Full dark/light theme toggle |
| **Responsive Design** | Mobile-first layout works on all screen sizes |

---

## 🛠 Tech Stack

**Frontend:** React 18, React Router v6, Chart.js, React Hot Toast, React Icons, Axios  
**Backend:** Node.js, Express.js, express-validator, multer  
**Database:** PostgreSQL (pg / node-postgres)  
**Auth:** JWT, bcryptjs  
**File Storage:** Cloudinary (optional) or local disk  
**Security:** helmet, express-rate-limit, CORS

---

## 📂 Project Structure

```
hospital-management/
├── client/                  # React frontend
│   ├── public/
│   └── src/
│       ├── assets/css/      # Global CSS (variables, dark mode, responsive)
│       ├── components/      # Reusable UI components
│       ├── context/         # AuthContext, ThemeContext
│       ├── pages/
│       │   ├── admin/       # AdminDashboard, ManageDoctors, ManagePatients …
│       │   ├── doctor/      # DoctorDashboard, DoctorAppointments …
│       │   ├── patient/     # PatientDashboard, BookAppointment …
│       │   └── auth/        # Login, Register
│       └── services/        # Axios API service wrappers
│
├── server/                  # Express backend
│   ├── config/              # db.js (PostgreSQL pool), cloudinary.js
│   ├── controllers/         # Business logic per domain
│   ├── middleware/          # auth.js, validate.js, errorHandler.js, upload.js
│   ├── migrations/          # 001_initial_schema.sql + migrate.js runner
│   ├── models/              # SQL query helpers
│   ├── routes/              # Express routers
│   └── server.js            # Entry point
│
└── package.json             # Root scripts to run both
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 14
- npm ≥ 9

---

### 1. Clone & install dependencies

```bash
git clone <your-repo-url>
cd hospital-management

# Install server + client dependencies
npm run install:all
```

---

### 2. Configure environment variables

**Server:**
```bash
cd server
cp .env.example .env
```
Edit `server/.env` and fill in:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — your PostgreSQL details
- `JWT_SECRET` — a long random string (min 32 chars)
- `CLOUDINARY_*` — optional, leave blank to use local file storage

**Client:**
```bash
cd client
cp .env.example .env
```
Only needed if deploying frontend separately (the CRA proxy handles dev automatically).

---

### 3. Create the PostgreSQL database

```sql
-- Run in psql or any PostgreSQL client
CREATE DATABASE hospital_management;
```

---

### 4. Run database migrations

```bash
npm run migrate
# then seed the admin password
node seed-admin.js
```

This creates all tables, indexes, triggers, departments, and sets the admin password.
After running, login with: `admin@hospital.com` / `Admin@123`

---

### 5. Start development servers

**Terminal 1 – Backend:**
```bash
npm run dev:server
# Server running on http://localhost:5000
```

**Terminal 2 – Frontend:**
```bash
npm run dev:client
# App running on http://localhost:3000
```

---

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | Admin@123 |

Register new Doctor/Patient accounts from the `/register` page.

---

## 📡 API Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Create account | Public |
| POST | `/api/auth/login` | Login | Public |
| GET  | `/api/auth/me` | Current user | Auth |
| GET  | `/api/doctors` | List doctors | Public |
| GET  | `/api/doctors/:id/slots` | Available time slots | Public |
| GET  | `/api/patients` | List patients | Admin, Doctor |
| GET  | `/api/appointments` | List appointments | Auth (scoped by role) |
| POST | `/api/appointments` | Book appointment | Admin, Patient |
| PUT  | `/api/appointments/:id/status` | Update status | Auth (role limits) |
| GET  | `/api/records` | Medical records | Auth (scoped) |
| POST | `/api/records` | Create record | Doctor |
| POST | `/api/records/:id/prescriptions` | Write prescription | Doctor |
| POST | `/api/records/:id/attachments` | Upload lab report | Doctor, Admin |
| GET  | `/api/billing` | Bills list | Auth (scoped) |
| POST | `/api/billing` | Create bill | Admin |
| POST | `/api/billing/:id/pay` | Record payment | Admin |
| GET  | `/api/dashboard/admin` | Admin dashboard data | Admin |
| GET  | `/api/dashboard/doctor` | Doctor dashboard data | Doctor |
| GET  | `/api/dashboard/patient` | Patient dashboard data | Patient |
| GET  | `/api/notifications` | User notifications | Auth |
| PUT  | `/api/notifications/read-all` | Mark all read | Auth |

---

## 🗃 Database Schema

**Tables:** `users`, `departments`, `doctors`, `patients`, `appointments`, `medical_records`, `prescriptions`, `prescription_items`, `medical_attachments`, `bills`, `notifications`, `doctor_schedules`

Key design decisions:
- UUID primary keys throughout
- Generated `total_amount` column on `bills` (auto-computed from fee fields)
- Unique constraint on `(doctor_id, appointment_date, appointment_time)` prevents double-booking
- `updated_at` trigger auto-updates timestamps
- Row-level scoping enforced in controllers (not just middleware)

---

## 🌗 Dark Mode

Click the moon/sun icon in the top navbar. Theme preference is persisted in `localStorage`.

---

## 📱 Responsive Design

Breakpoints:
- **≥ 1025px** — Full sidebar + multi-column grids
- **768–1024px** — Collapsed grid, sidebar still present
- **≤ 768px** — Mobile layout, sidebar slides in as drawer
- **≤ 480px** — Single-column everything

---

## 🚢 Deployment

**Frontend → Vercel**
1. Connect your GitHub repo to Vercel
2. Set root to `client/`
3. Add env var: `REACT_APP_API_URL=https://your-backend.onrender.com/api`

**Backend → Render / Railway**
1. Set root to `server/`
2. Start command: `node server.js`
3. Add all env vars from `.env.example`
4. Provision a PostgreSQL database and run migrations

---

## 📋 Challenges Addressed

1. Role-based authentication with JWT
2. Appointment conflict prevention (unique DB constraint + controller check)
3. Secure patient record access (row-level scoping per role)
4. Dynamic scheduling system with available slot generation
5. Downloadable lab reports (Cloudinary or local)
6. Itemized bill calculation with discount/tax
7. Search, filtering, and pagination on all list views
8. Optimized PostgreSQL queries with proper indexes
9. Pagination on patient records, appointments, bills
10. Production-ready error handling and rate limiting

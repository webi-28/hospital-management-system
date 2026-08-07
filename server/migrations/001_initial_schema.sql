-- ============================================================
-- Hospital Management System - Initial Database Schema
-- PostgreSQL
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS TABLE (shared auth for all roles)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('admin', 'doctor', 'patient')),
  phone         VARCHAR(20),
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DEPARTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCTORS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS doctors (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id     UUID REFERENCES departments(id) ON DELETE SET NULL,
  specialization    VARCHAR(150) NOT NULL,
  qualification     VARCHAR(255),
  experience_years  INTEGER DEFAULT 0,
  consultation_fee  NUMERIC(10,2) DEFAULT 0.00,
  bio               TEXT,
  license_number    VARCHAR(100) UNIQUE,
  available_days    TEXT[],        -- e.g. ARRAY['Monday','Wednesday','Friday']
  available_from    TIME,
  available_to      TIME,
  max_appointments_per_day INTEGER DEFAULT 20,
  rating            NUMERIC(3,2) DEFAULT 0.00,
  total_reviews     INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PATIENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth    DATE,
  gender           VARCHAR(10) CHECK (gender IN ('male','female','other')),
  blood_group      VARCHAR(5),
  address          TEXT,
  emergency_contact_name  VARCHAR(150),
  emergency_contact_phone VARCHAR(20),
  allergies        TEXT[],
  chronic_diseases TEXT[],
  insurance_provider      VARCHAR(150),
  insurance_number        VARCHAR(100),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPOINTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status          VARCHAR(20) DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','cancelled','completed','no_show')),
  type            VARCHAR(30) DEFAULT 'consultation'
                  CHECK (type IN ('consultation','follow_up','emergency','check_up')),
  reason          TEXT,
  notes           TEXT,
  cancellation_reason TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent double-booking same doctor at same slot
  UNIQUE (doctor_id, appointment_date, appointment_time)
);

-- ============================================================
-- MEDICAL RECORDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS medical_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  record_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  diagnosis       TEXT NOT NULL,
  symptoms        TEXT,
  treatment_plan  TEXT,
  notes           TEXT,
  follow_up_date  DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRESCRIPTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS prescriptions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id        UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  prescribed_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until      DATE,
  status           VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRESCRIPTION ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS prescription_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id   UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_name     VARCHAR(200) NOT NULL,
  dosage            VARCHAR(100),
  frequency         VARCHAR(100),
  duration          VARCHAR(100),
  instructions      TEXT,
  quantity          INTEGER DEFAULT 1
);

-- ============================================================
-- LAB REPORTS / ATTACHMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS medical_attachments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  file_name         VARCHAR(255) NOT NULL,
  file_url          TEXT NOT NULL,
  file_type         VARCHAR(50),    -- e.g. 'lab_report', 'xray', 'scan', 'other'
  file_size         INTEGER,
  public_id         TEXT,           -- Cloudinary public_id for deletion
  uploaded_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BILLING TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS bills (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES appointments(id) ON DELETE SET NULL,
  bill_number       VARCHAR(50) UNIQUE NOT NULL,
  bill_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date          DATE,
  consultation_fee  NUMERIC(10,2) DEFAULT 0.00,
  medicine_charges  NUMERIC(10,2) DEFAULT 0.00,
  lab_charges       NUMERIC(10,2) DEFAULT 0.00,
  other_charges     NUMERIC(10,2) DEFAULT 0.00,
  discount          NUMERIC(10,2) DEFAULT 0.00,
  tax               NUMERIC(10,2) DEFAULT 0.00,
  total_amount      NUMERIC(10,2) GENERATED ALWAYS AS
                    (consultation_fee + medicine_charges + lab_charges + other_charges - discount + tax)
                    STORED,
  paid_amount       NUMERIC(10,2) DEFAULT 0.00,
  payment_status    VARCHAR(20) DEFAULT 'unpaid'
                    CHECK (payment_status IN ('unpaid','partial','paid','refunded')),
  payment_method    VARCHAR(30) CHECK (payment_method IN ('cash','card','online','insurance',NULL)),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  type        VARCHAR(30) DEFAULT 'info'
              CHECK (type IN ('info','appointment','prescription','billing','alert')),
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCTOR SCHEDULES TABLE (overrides / blocked slots)
-- ============================================================
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id   UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  reason      VARCHAR(255),         -- e.g. 'holiday', 'conference'
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (doctor_id, schedule_date, start_time)
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date    ON appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient        ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status         ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient     ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor      ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient       ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_bills_patient               ON bills(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread   ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_users_email                 ON users(email);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization      ON doctors(specialization);

-- ============================================================
-- UPDATED_AT trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','doctors','patients','appointments','medical_records','bills']
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t, t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- SEED: Default admin user
-- Password: Admin@123  (hash generated at migration time via seed-admin.js)
-- Run `node seed-admin.js` after migration to set the correct password hash.
-- ============================================================
-- Placeholder row inserted here; seed-admin.js sets the real bcrypt hash.
INSERT INTO users (full_name, email, password_hash, role, is_active, is_verified)
VALUES (
  'System Administrator',
  'admin@hospital.com',
  'PLACEHOLDER_RUN_SEED_ADMIN',
  'admin',
  TRUE,
  TRUE
) ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- SEED: Sample departments
-- ============================================================
INSERT INTO departments (name, description) VALUES
  ('Cardiology',       'Heart and cardiovascular system'),
  ('Neurology',        'Brain, spinal cord and nervous system'),
  ('Orthopedics',      'Bones, joints and musculoskeletal system'),
  ('Pediatrics',       'Medical care for infants and children'),
  ('Dermatology',      'Skin, hair and nails'),
  ('Gynecology',       'Female reproductive health'),
  ('Ophthalmology',    'Eyes and vision'),
  ('ENT',              'Ear, nose and throat'),
  ('Gastroenterology', 'Digestive system'),
  ('General Medicine', 'Primary care and general health')
ON CONFLICT (name) DO NOTHING;

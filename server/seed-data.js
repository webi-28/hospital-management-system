/**
 * HMS – Comprehensive Sample Data Seeder
 * Run:  node seed-data.js
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'hospital_management',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🌱 Seeding sample data...\n');

    // ── 1. Hash passwords ──────────────────────────────────────
    const doctorHash  = await bcrypt.hash('Doctor@123', 12);
    const patientHash = await bcrypt.hash('Patient@123', 12);

    // ── 2. Get department IDs ──────────────────────────────────
    const deptRes = await client.query('SELECT id, name FROM departments ORDER BY name');
    const dept = {};
    deptRes.rows.forEach(r => { dept[r.name] = r.id; });
    console.log(`  ✓ Found ${deptRes.rows.length} departments`);

    // ── 3. Insert Doctor Users ─────────────────────────────────
    const doctorUsers = [
      { full_name: 'Dr. Aisha Sharma',   email: 'aisha.sharma@hospital.com',   phone: '+1-555-0101' },
      { full_name: 'Dr. James Okafor',   email: 'james.okafor@hospital.com',   phone: '+1-555-0102' },
      { full_name: 'Dr. Priya Patel',    email: 'priya.patel@hospital.com',    phone: '+1-555-0103' },
      { full_name: 'Dr. Carlos Rivera',  email: 'carlos.rivera@hospital.com',  phone: '+1-555-0104' },
      { full_name: 'Dr. Linda Chen',     email: 'linda.chen@hospital.com',     phone: '+1-555-0105' },
      { full_name: 'Dr. Michael Brown',  email: 'michael.brown@hospital.com',  phone: '+1-555-0106' },
      { full_name: 'Dr. Fatima Al-Said', email: 'fatima.alsaid@hospital.com',  phone: '+1-555-0107' },
      { full_name: 'Dr. David Kim',      email: 'david.kim@hospital.com',      phone: '+1-555-0108' },
    ];

    const doctorUserIds = [];
    for (const u of doctorUsers) {
      const res = await client.query(
        `INSERT INTO users (full_name, email, password_hash, role, phone, is_active, is_verified)
         VALUES ($1,$2,$3,'doctor',$4,TRUE,TRUE)
         ON CONFLICT (email) DO UPDATE SET full_name=EXCLUDED.full_name
         RETURNING id`,
        [u.full_name, u.email, doctorHash, u.phone]
      );
      doctorUserIds.push(res.rows[0].id);
    }
    console.log(`  ✓ ${doctorUsers.length} doctor users created`);

    // ── 4. Insert Doctor Profiles ──────────────────────────────
    const doctorProfiles = [
      { idx:0, spec:'Cardiologist',      dept:'Cardiology',       exp:15, fee:800, qual:'MBBS, MD Cardiology',    days:['Monday','Wednesday','Friday'],    from:'09:00', to:'17:00', lic:'LIC-001', bio:'Specialist in heart and cardiovascular diseases with 15 years of experience.' },
      { idx:1, spec:'Neurologist',       dept:'Neurology',        exp:12, fee:750, qual:'MBBS, MD Neurology',     days:['Tuesday','Thursday','Saturday'],  from:'10:00', to:'18:00', lic:'LIC-002', bio:'Expert in brain and nervous system disorders.' },
      { idx:2, spec:'Pediatrician',      dept:'Pediatrics',       exp:10, fee:600, qual:'MBBS, MD Pediatrics',    days:['Monday','Tuesday','Wednesday'],   from:'08:00', to:'16:00', lic:'LIC-003', bio:'Dedicated to children\'s health from infancy to adolescence.' },
      { idx:3, spec:'Orthopedic Surgeon',dept:'Orthopedics',      exp:18, fee:900, qual:'MBBS, MS Orthopedics',   days:['Monday','Wednesday','Thursday'],  from:'09:00', to:'17:00', lic:'LIC-004', bio:'Specialist in bone, joint and muscle disorders.' },
      { idx:4, spec:'Dermatologist',     dept:'Dermatology',      exp:8,  fee:500, qual:'MBBS, MD Dermatology',   days:['Tuesday','Thursday','Friday'],    from:'10:00', to:'18:00', lic:'LIC-005', bio:'Expert in skin, hair and nail conditions.' },
      { idx:5, spec:'Gynecologist',      dept:'Gynecology',       exp:14, fee:700, qual:'MBBS, MD Gynecology',    days:['Monday','Wednesday','Friday'],    from:'09:00', to:'17:00', lic:'LIC-006', bio:'Specialist in women\'s reproductive health.' },
      { idx:6, spec:'Gastroenterologist',dept:'Gastroenterology', exp:11, fee:680, qual:'MBBS, MD Gastroenterology', days:['Tuesday','Thursday'],         from:'11:00', to:'19:00', lic:'LIC-007', bio:'Expert in digestive system disorders.' },
      { idx:7, spec:'Ophthalmologist',   dept:'Ophthalmology',    exp:9,  fee:550, qual:'MBBS, MS Ophthalmology', days:['Monday','Tuesday','Friday'],     from:'09:00', to:'15:00', lic:'LIC-008', bio:'Specialist in eye and vision care.' },
    ];

    const doctorIds = [];
    for (const d of doctorProfiles) {
      const res = await client.query(
        `INSERT INTO doctors
           (user_id,department_id,specialization,qualification,experience_years,consultation_fee,
            bio,license_number,available_days,available_from,available_to,rating,total_reviews)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (user_id) DO UPDATE SET specialization=EXCLUDED.specialization
         RETURNING id`,
        [doctorUserIds[d.idx], dept[d.dept]||null, d.spec, d.qual, d.exp, d.fee,
         d.bio, d.lic, d.days, d.from, d.to,
         (3.5 + Math.random()).toFixed(1), Math.floor(Math.random()*200)+50]
      );
      doctorIds.push(res.rows[0].id);
    }
    console.log(`  ✓ ${doctorProfiles.length} doctor profiles created`);

    // ── 5. Insert Patient Users ────────────────────────────────
    const patientUsers = [
      { full_name:'John Mitchell',    email:'john.mitchell@email.com',    phone:'+1-555-1001' },
      { full_name:'Sarah Johnson',    email:'sarah.johnson@email.com',    phone:'+1-555-1002' },
      { full_name:'Robert Williams',  email:'robert.williams@email.com',  phone:'+1-555-1003' },
      { full_name:'Emily Davis',      email:'emily.davis@email.com',      phone:'+1-555-1004' },
      { full_name:'Michael Wilson',   email:'michael.wilson@email.com',   phone:'+1-555-1005' },
      { full_name:'Jessica Taylor',   email:'jessica.taylor@email.com',   phone:'+1-555-1006' },
      { full_name:'David Anderson',   email:'david.anderson@email.com',   phone:'+1-555-1007' },
      { full_name:'Ashley Thomas',    email:'ashley.thomas@email.com',    phone:'+1-555-1008' },
      { full_name:'James Martinez',   email:'james.martinez@email.com',   phone:'+1-555-1009' },
      { full_name:'Amanda Jackson',   email:'amanda.jackson@email.com',   phone:'+1-555-1010' },
      { full_name:'Christopher White',email:'chris.white@email.com',      phone:'+1-555-1011' },
      { full_name:'Megan Harris',     email:'megan.harris@email.com',     phone:'+1-555-1012' },
    ];

    const patientUserIds = [];
    for (const u of patientUsers) {
      const res = await client.query(
        `INSERT INTO users (full_name,email,password_hash,role,phone,is_active,is_verified)
         VALUES ($1,$2,$3,'patient',$4,TRUE,TRUE)
         ON CONFLICT (email) DO UPDATE SET full_name=EXCLUDED.full_name
         RETURNING id`,
        [u.full_name, u.email, patientHash, u.phone]
      );
      patientUserIds.push(res.rows[0].id);
    }
    console.log(`  ✓ ${patientUsers.length} patient users created`);

    // ── 6. Insert Patient Profiles ─────────────────────────────
    const patientProfiles = [
      { idx:0,  dob:'1985-03-15', gender:'male',   bg:'O+',  addr:'123 Oak St, NY',       ecn:'Mary Mitchell',    ecp:'+1-555-2001', allergies:['Penicillin'],            chronic:['Hypertension'],          ins:'BlueCross',  insn:'BC-100123' },
      { idx:1,  dob:'1990-07-22', gender:'female', bg:'A+',  addr:'456 Pine Ave, LA',     ecn:'Tom Johnson',      ecp:'+1-555-2002', allergies:['Aspirin'],              chronic:['Diabetes Type 2'],       ins:'Aetna',      insn:'AE-200456' },
      { idx:2,  dob:'1978-11-08', gender:'male',   bg:'B+',  addr:'789 Elm Rd, Chicago',  ecn:'Sue Williams',     ecp:'+1-555-2003', allergies:[],                        chronic:['Asthma'],                ins:'UnitedHealth',insn:'UH-300789' },
      { idx:3,  dob:'1995-01-30', gender:'female', bg:'AB+', addr:'321 Maple Dr, Houston',ecn:'Paul Davis',       ecp:'+1-555-2004', allergies:['Sulfa'],                 chronic:[],                        ins:'Cigna',      insn:'CI-400321' },
      { idx:4,  dob:'1982-06-14', gender:'male',   bg:'O-',  addr:'654 Cedar Ln, Phoenix',ecn:'Ann Wilson',       ecp:'+1-555-2005', allergies:['Latex'],                 chronic:['Arthritis'],             ins:'BlueCross',  insn:'BC-500654' },
      { idx:5,  dob:'1993-09-25', gender:'female', bg:'A-',  addr:'987 Birch Blvd, PA',   ecn:'Mike Taylor',      ecp:'+1-555-2006', allergies:[],                        chronic:[],                        ins:'Aetna',      insn:'AE-600987' },
      { idx:6,  dob:'1970-12-03', gender:'male',   bg:'B-',  addr:'147 Walnut St, TX',    ecn:'Liz Anderson',     ecp:'+1-555-2007', allergies:['Codeine'],               chronic:['High Cholesterol'],      ins:'Medicare',   insn:'MC-700147' },
      { idx:7,  dob:'1988-04-18', gender:'female', bg:'O+',  addr:'258 Spruce Ave, FL',   ecn:'Jake Thomas',      ecp:'+1-555-2008', allergies:['Peanuts'],               chronic:[],                        ins:'UnitedHealth',insn:'UH-800258' },
      { idx:8,  dob:'1975-08-07', gender:'male',   bg:'A+',  addr:'369 Fir Way, OH',      ecn:'Rosa Martinez',    ecp:'+1-555-2009', allergies:['Ibuprofen'],             chronic:['Diabetes Type 1'],       ins:'Cigna',      insn:'CI-900369' },
      { idx:9,  dob:'1998-02-14', gender:'female', bg:'AB-', addr:'741 Poplar Ct, GA',    ecn:'Kevin Jackson',    ecp:'+1-555-2010', allergies:[],                        chronic:[],                        ins:'BlueCross',  insn:'BC-101741' },
      { idx:10, dob:'1965-10-20', gender:'male',   bg:'O+',  addr:'852 Willow Dr, NC',    ecn:'Beth White',       ecp:'+1-555-2011', allergies:['Morphine'],              chronic:['COPD','Hypertension'],   ins:'Medicare',   insn:'MC-102852' },
      { idx:11, dob:'1991-05-11', gender:'female', bg:'B+',  addr:'963 Ash Blvd, VA',     ecn:'Sam Harris',       ecp:'+1-555-2012', allergies:[],                        chronic:['Migraine'],              ins:'Aetna',      insn:'AE-103963' },
    ];

    const patientIds = [];
    for (const p of patientProfiles) {
      const res = await client.query(
        `INSERT INTO patients
           (user_id,date_of_birth,gender,blood_group,address,
            emergency_contact_name,emergency_contact_phone,
            allergies,chronic_diseases,insurance_provider,insurance_number)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (user_id) DO UPDATE SET blood_group=EXCLUDED.blood_group
         RETURNING id`,
        [patientUserIds[p.idx], p.dob, p.gender, p.bg, p.addr,
         p.ecn, p.ecp, p.allergies, p.chronic, p.ins, p.insn]
      );
      patientIds.push(res.rows[0].id);
    }
    console.log(`  ✓ ${patientProfiles.length} patient profiles created`);

    // ── 7. Insert Appointments ─────────────────────────────────
    const today = new Date();
    const d = (offset) => {
      const dt = new Date(today);
      dt.setDate(dt.getDate() + offset);
      return dt.toISOString().slice(0, 10);
    };

    const appointments = [
      // Past completed
      { pid:0, did:0, date:d(-30), time:'09:00', status:'completed', type:'consultation',  reason:'Chest pain and shortness of breath' },
      { pid:1, did:1, date:d(-28), time:'10:00', status:'completed', type:'consultation',  reason:'Frequent headaches and dizziness' },
      { pid:2, did:2, date:d(-25), time:'08:30', status:'completed', type:'check_up',      reason:'Annual checkup for child' },
      { pid:3, did:3, date:d(-22), time:'09:30', status:'completed', type:'consultation',  reason:'Knee pain and swelling' },
      { pid:4, did:4, date:d(-20), time:'10:30', status:'completed', type:'consultation',  reason:'Skin rash and itching' },
      { pid:5, did:5, date:d(-18), time:'09:00', status:'completed', type:'check_up',      reason:'Routine gynecology checkup' },
      { pid:6, did:6, date:d(-15), time:'11:00', status:'completed', type:'consultation',  reason:'Stomach pain and bloating' },
      { pid:7, did:7, date:d(-14), time:'09:00', status:'completed', type:'consultation',  reason:'Blurry vision and eye strain' },
      { pid:8, did:0, date:d(-12), time:'10:00', status:'completed', type:'follow_up',     reason:'Follow-up after cardiac evaluation' },
      { pid:9, did:1, date:d(-10), time:'11:00', status:'completed', type:'consultation',  reason:'Memory loss and confusion' },
      { pid:10,did:2, date:d(-8),  time:'08:00', status:'completed', type:'consultation',  reason:'Fever and respiratory issues' },
      { pid:11,did:3, date:d(-6),  time:'10:00', status:'completed', type:'consultation',  reason:'Back pain and posture problems' },
      // Past cancelled
      { pid:0, did:4, date:d(-5),  time:'10:00', status:'cancelled', type:'consultation',  reason:'Skin allergy review' },
      { pid:2, did:6, date:d(-3),  time:'11:30', status:'cancelled', type:'consultation',  reason:'Digestive issues' },
      // Today
      { pid:0, did:0, date:d(0),   time:'09:00', status:'confirmed', type:'follow_up',     reason:'Follow-up cardiac checkup' },
      { pid:1, did:1, date:d(0),   time:'10:30', status:'confirmed', type:'follow_up',     reason:'Neurology follow-up' },
      { pid:2, did:2, date:d(0),   time:'08:30', status:'pending',   type:'check_up',      reason:'Child wellness visit' },
      { pid:3, did:3, date:d(0),   time:'11:00', status:'confirmed', type:'consultation',  reason:'Post-surgery review' },
      // Upcoming
      { pid:4, did:4, date:d(2),   time:'10:00', status:'confirmed', type:'follow_up',     reason:'Eczema treatment review' },
      { pid:5, did:5, date:d(3),   time:'09:00', status:'pending',   type:'consultation',  reason:'Pregnancy consultation' },
      { pid:6, did:6, date:d(4),   time:'11:30', status:'confirmed', type:'follow_up',     reason:'Gastritis follow-up' },
      { pid:7, did:7, date:d(5),   time:'09:30', status:'pending',   type:'consultation',  reason:'Cataract evaluation' },
      { pid:8, did:0, date:d(7),   time:'10:00', status:'confirmed', type:'consultation',  reason:'Hypertension management' },
      { pid:9, did:2, date:d(8),   time:'08:00', status:'pending',   type:'check_up',      reason:'Annual health check' },
      { pid:10,did:1, date:d(10),  time:'11:00', status:'confirmed', type:'follow_up',     reason:'Neurological evaluation' },
      { pid:11,did:5, date:d(12),  time:'09:00', status:'pending',   type:'consultation',  reason:'Hormonal imbalance' },
    ];

    const appointmentIds = [];
    for (const a of appointments) {
      const res = await client.query(
        `INSERT INTO appointments
           (patient_id,doctor_id,appointment_date,appointment_time,status,type,reason)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (doctor_id,appointment_date,appointment_time)
         DO UPDATE SET status=EXCLUDED.status RETURNING id`,
        [patientIds[a.pid], doctorIds[a.did], a.date, a.time, a.status, a.type, a.reason]
      );
      appointmentIds.push({ id: res.rows[0].id, ...a });
    }
    console.log(`  ✓ ${appointments.length} appointments created`);

    // ── 8. Insert Medical Records ──────────────────────────────
    const completedAppts = appointmentIds.filter(a => a.status === 'completed');

    const diagnoses = [
      { diagnosis:'Hypertensive Heart Disease', symptoms:'Chest tightness, elevated blood pressure 160/100, mild shortness of breath', treatment:'Prescribed ACE inhibitors, low-sodium diet, daily exercise. Monitor BP weekly.', notes:'Patient history of smoking. Advised to quit.', followup: d(30) },
      { diagnosis:'Migraine with Aura',          symptoms:'Severe unilateral headache, visual disturbances, nausea, photophobia', treatment:'Prescribed triptans for acute attacks, propranolol for prevention.', notes:'Stress and lack of sleep identified as triggers.', followup: d(21) },
      { diagnosis:'Upper Respiratory Infection', symptoms:'Fever 38.5°C, cough, runny nose, sore throat, fatigue', treatment:'Rest, increased fluids, paracetamol for fever. Antibiotics not indicated.', notes:'Viral etiology likely. Should resolve in 7-10 days.', followup: null },
      { diagnosis:'Osteoarthritis – Right Knee', symptoms:'Joint pain, stiffness in morning, crepitus on movement, mild swelling', treatment:'Physical therapy, NSAIDs for pain relief, weight management recommended.', notes:'X-ray shows moderate joint space narrowing.', followup: d(45) },
      { diagnosis:'Atopic Dermatitis',            symptoms:'Dry, itchy red patches on arms and neck, worsening at night', treatment:'Topical corticosteroids, moisturizing cream twice daily, avoid triggers.', notes:'Allergy test recommended.', followup: d(14) },
      { diagnosis:'Polycystic Ovary Syndrome',   symptoms:'Irregular periods, weight gain, acne, hirsutism', treatment:'Hormonal therapy, lifestyle modification, dietary changes.', notes:'Ultrasound confirmed multiple ovarian cysts.', followup: d(60) },
      { diagnosis:'Irritable Bowel Syndrome',    symptoms:'Abdominal cramping, alternating diarrhea and constipation, bloating', treatment:'Dietary fiber increase, antispasmodics, probiotics.', notes:'Stress management recommended.', followup: d(30) },
      { diagnosis:'Myopia and Dry Eye Syndrome', symptoms:'Blurred distance vision, eye redness, burning sensation, excessive tearing', treatment:'Corrective lenses prescribed, lubricating eye drops.', notes:'Screen time reduction advised.', followup: d(90) },
      { diagnosis:'Coronary Artery Disease',     symptoms:'Chest pain on exertion, fatigue, mild ankle swelling', treatment:'Beta-blockers, statins, aspirin. Lifestyle modification essential.', notes:'Stress ECG scheduled.', followup: d(14) },
      { diagnosis:'Alzheimer\'s Disease – Early Stage', symptoms:'Short-term memory loss, confusion, difficulty with familiar tasks', treatment:'Cholinesterase inhibitors prescribed. Cognitive exercises recommended.', notes:'Family support crucial. Safety assessment at home.', followup: d(30) },
      { diagnosis:'Pneumonia',                   symptoms:'High fever, productive cough, difficulty breathing, chest pain', treatment:'Amoxicillin course, rest, adequate hydration, chest physiotherapy.', notes:'Chest X-ray shows right lower lobe consolidation.', followup: d(10) },
      { diagnosis:'Lumbar Disc Herniation',      symptoms:'Low back pain radiating to left leg, tingling, muscle weakness', treatment:'Physical therapy, pain management, core strengthening exercises.', notes:'MRI confirms L4-L5 disc prolapse.', followup: d(21) },
    ];

    const recordIds = [];
    for (let i = 0; i < completedAppts.length; i++) {
      const appt = completedAppts[i];
      const diag = diagnoses[i % diagnoses.length];
      const res = await client.query(
        `INSERT INTO medical_records
           (patient_id,doctor_id,appointment_id,record_date,
            diagnosis,symptoms,treatment_plan,notes,follow_up_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id`,
        [patientIds[appt.pid], doctorIds[appt.did], appt.id,
         appt.date, diag.diagnosis, diag.symptoms,
         diag.treatment, diag.notes, diag.followup]
      );
      recordIds.push({ id: res.rows[0].id, pid: appt.pid, did: appt.did });
    }
    console.log(`  ✓ ${recordIds.length} medical records created`);

    // ── 9. Insert Prescriptions ────────────────────────────────
    const prescriptionData = [
      { items: [
          { name:'Amlodipine 5mg',    dosage:'1 tablet', freq:'Once daily',  dur:'3 months', inst:'Take in the morning', qty:90 },
          { name:'Lisinopril 10mg',   dosage:'1 tablet', freq:'Once daily',  dur:'3 months', inst:'Take with water',      qty:90 },
          { name:'Aspirin 75mg',      dosage:'1 tablet', freq:'Once daily',  dur:'3 months', inst:'Take after meals',     qty:90 },
      ]},
      { items: [
          { name:'Sumatriptan 50mg',  dosage:'1 tablet', freq:'As needed',   dur:'6 months', inst:'At onset of migraine', qty:12 },
          { name:'Propranolol 40mg',  dosage:'1 tablet', freq:'Twice daily', dur:'3 months', inst:'Morning and evening',  qty:180 },
      ]},
      { items: [
          { name:'Paracetamol 500mg', dosage:'2 tablets',freq:'3 times/day', dur:'5 days',   inst:'After meals',          qty:30 },
          { name:'Cetirizine 10mg',   dosage:'1 tablet', freq:'Once daily',  dur:'7 days',   inst:'At bedtime',           qty:7  },
          { name:'Normal Saline Spray',dosage:'2 sprays',freq:'4 times/day', dur:'7 days',   inst:'Each nostril',         qty:1  },
      ]},
      { items: [
          { name:'Ibuprofen 400mg',   dosage:'1 tablet', freq:'3 times/day', dur:'2 weeks',  inst:'After meals with food',qty:42 },
          { name:'Omeprazole 20mg',   dosage:'1 capsule',freq:'Once daily',  dur:'2 weeks',  inst:'Before breakfast',     qty:14 },
          { name:'Calcium + Vit D3',  dosage:'1 tablet', freq:'Once daily',  dur:'3 months', inst:'After lunch',          qty:90 },
      ]},
      { items: [
          { name:'Hydrocortisone 1% Cream',dosage:'Thin layer',freq:'Twice daily',dur:'2 weeks',inst:'Apply to affected area',qty:1 },
          { name:'Cetirizine 10mg',    dosage:'1 tablet', freq:'Once daily',  dur:'1 month',  inst:'At bedtime',           qty:30 },
          { name:'Aqueous Cream',      dosage:'As needed',freq:'3 times/day', dur:'Ongoing',  inst:'Moisturize after bath',qty:2  },
      ]},
      { items: [
          { name:'Metformin 500mg',   dosage:'1 tablet', freq:'Twice daily', dur:'3 months', inst:'With meals',           qty:180},
          { name:'Folic Acid 5mg',    dosage:'1 tablet', freq:'Once daily',  dur:'3 months', inst:'Morning',              qty:90 },
      ]},
      { items: [
          { name:'Mebeverine 135mg',  dosage:'1 tablet', freq:'3 times/day', dur:'1 month',  inst:'30 min before meals',  qty:90 },
          { name:'Lactulose 10ml',    dosage:'10ml',     freq:'Twice daily', dur:'2 weeks',  inst:'Mix with water',       qty:14 },
      ]},
      { items: [
          { name:'Refresh Tears Eye Drops',dosage:'2 drops',freq:'4 times/day',dur:'3 months',inst:'Both eyes',           qty:3  },
          { name:'Vitamin A Drops',   dosage:'1 drop',   freq:'Once daily',  dur:'3 months', inst:'Right eye at night',   qty:1  },
      ]},
    ];

    for (let i = 0; i < Math.min(recordIds.length, prescriptionData.length); i++) {
      const rec = recordIds[i];
      const pres = prescriptionData[i];
      const vDate = new Date(today); vDate.setMonth(vDate.getMonth() + 3);
      const presRes = await client.query(
        `INSERT INTO prescriptions
           (medical_record_id,patient_id,doctor_id,valid_until,status)
         VALUES ($1,$2,$3,$4,'active') RETURNING id`,
        [rec.id, patientIds[rec.pid], doctorIds[rec.did], vDate.toISOString().slice(0,10)]
      );
      const presId = presRes.rows[0].id;
      for (const item of pres.items) {
        await client.query(
          `INSERT INTO prescription_items
             (prescription_id,medicine_name,dosage,frequency,duration,instructions,quantity)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [presId, item.name, item.dosage, item.freq, item.dur, item.inst, item.qty]
        );
      }
    }
    console.log(`  ✓ ${Math.min(recordIds.length, prescriptionData.length)} prescriptions with medicines created`);

    // ── 10. Insert Bills ───────────────────────────────────────
    const billData = [
      { pid:0,  apptIdx:0,  con:800, med:250, lab:400, other:0,   dis:100, tax:70,  status:'paid',    method:'card',     date:d(-30) },
      { pid:1,  apptIdx:1,  con:750, med:180, lab:350, other:50,  dis:0,   tax:66,  status:'paid',    method:'online',   date:d(-28) },
      { pid:2,  apptIdx:2,  con:600, med:120, lab:200, other:0,   dis:50,  tax:43,  status:'paid',    method:'cash',     date:d(-25) },
      { pid:3,  apptIdx:3,  con:900, med:300, lab:500, other:200, dis:0,   tax:99,  status:'paid',    method:'insurance',date:d(-22) },
      { pid:4,  apptIdx:4,  con:500, med:150, lab:0,   other:0,   dis:0,   tax:33,  status:'partial', method:'cash',     date:d(-20) },
      { pid:5,  apptIdx:5,  con:700, med:200, lab:300, other:0,   dis:100, tax:66,  status:'paid',    method:'card',     date:d(-18) },
      { pid:6,  apptIdx:6,  con:680, med:220, lab:450, other:100, dis:0,   tax:90,  status:'unpaid',  method:null,       date:d(-15) },
      { pid:7,  apptIdx:7,  con:550, med:100, lab:200, other:0,   dis:50,  tax:40,  status:'paid',    method:'online',   date:d(-14) },
      { pid:8,  apptIdx:8,  con:800, med:350, lab:600, other:150, dis:200, tax:105, status:'partial', method:'insurance',date:d(-12) },
      { pid:9,  apptIdx:9,  con:750, med:0,   lab:800, other:0,   dis:0,   tax:155, status:'unpaid',  method:null,       date:d(-10) },
      { pid:10, apptIdx:10, con:600, med:400, lab:300, other:50,  dis:100, tax:125, status:'paid',    method:'card',     date:d(-8)  },
      { pid:11, apptIdx:11, con:900, med:280, lab:350, other:0,   dis:0,   tax:153, status:'unpaid',  method:null,       date:d(-6)  },
    ];

    for (let i = 0; i < billData.length; i++) {
      const b = billData[i];
      const seq = String(i + 1).padStart(4, '0');
      const billNum = `BILL-${b.date.replace(/-/g,'')}${seq}`;
      const apptId = appointmentIds[b.apptIdx]?.id || null;
      const due = new Date(b.date); due.setDate(due.getDate() + 30);

      const billRes = await client.query(
        `INSERT INTO bills
           (patient_id,appointment_id,bill_number,bill_date,due_date,
            consultation_fee,medicine_charges,lab_charges,other_charges,
            discount,tax,payment_status,notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (bill_number) DO NOTHING RETURNING id`,
        [patientIds[b.pid], apptId, billNum, b.date, due.toISOString().slice(0,10),
         b.con, b.med, b.lab, b.other, b.dis, b.tax, b.status,
         'Generated automatically from appointment']
      );

      if (billRes.rows.length > 0 && b.status !== 'unpaid') {
        const billId = billRes.rows[0].id;
        const total = b.con + b.med + b.lab + b.other - b.dis + b.tax;
        const paid  = b.status === 'paid' ? total : total * 0.5;
        await client.query(
          `UPDATE bills SET paid_amount=$1, payment_method=$2 WHERE id=$3`,
          [paid.toFixed(2), b.method, billId]
        );
      }
    }
    console.log(`  ✓ ${billData.length} bills created`);

    // ── 11. Insert Notifications ───────────────────────────────
    const adminRes = await client.query(`SELECT id FROM users WHERE role='admin' LIMIT 1`);
    const adminId  = adminRes.rows[0]?.id;

    const notifications = [
      // Patient notifications
      { uid: patientUserIds[0], title:'Appointment Confirmed',    msg:'Your appointment with Dr. Aisha Sharma on '+d(0)+' at 09:00 has been confirmed.',         type:'appointment' },
      { uid: patientUserIds[1], title:'Appointment Confirmed',    msg:'Your appointment with Dr. James Okafor on '+d(0)+' at 10:30 has been confirmed.',          type:'appointment' },
      { uid: patientUserIds[4], title:'Appointment Reminder',     msg:'Reminder: You have an appointment with Dr. Linda Chen on '+d(2)+' at 10:00.',              type:'appointment' },
      { uid: patientUserIds[5], title:'Appointment Booked',       msg:'Your appointment with Dr. Fatima Al-Said on '+d(3)+' at 09:00 has been booked.',           type:'appointment' },
      { uid: patientUserIds[0], title:'New Prescription',         msg:'Dr. Aisha Sharma has issued a new prescription for you. Please check your prescriptions.', type:'prescription' },
      { uid: patientUserIds[1], title:'New Prescription',         msg:'Dr. James Okafor has issued a new prescription. Please collect from pharmacy.',            type:'prescription' },
      { uid: patientUserIds[2], title:'New Medical Record',       msg:'A new medical record has been added by Dr. Priya Patel.',                                   type:'info' },
      { uid: patientUserIds[0], title:'Bill Generated',           msg:'Bill #BILL-001 for $1,420.00 has been generated for your recent visit.',                    type:'billing' },
      { uid: patientUserIds[1], title:'Payment Received',         msg:'Payment of $1,396.00 received for your bill. Thank you!',                                   type:'billing' },
      { uid: patientUserIds[4], title:'Outstanding Balance',      msg:'You have an outstanding balance of $341.50. Please clear it at your earliest convenience.', type:'billing' },
      { uid: patientUserIds[6], title:'Unpaid Bill Reminder',     msg:'Your bill from '+d(-15)+' is still unpaid. Total amount: $1,540.00.',                       type:'billing' },
      { uid: patientUserIds[8], title:'Follow-up Due',            msg:'Your follow-up appointment is due soon. Please book an appointment with Dr. Aisha Sharma.', type:'appointment' },
      // Doctor notifications
      { uid: doctorUserIds[0],  title:'New Appointment',          msg:'New appointment booked by John Mitchell on '+d(0)+' at 09:00.',                            type:'appointment' },
      { uid: doctorUserIds[1],  title:'New Appointment',          msg:'New appointment booked by Sarah Johnson on '+d(0)+' at 10:30.',                            type:'appointment' },
      { uid: doctorUserIds[0],  title:'Today\'s Schedule',        msg:'You have 2 appointments scheduled for today. Please review your schedule.',                 type:'info' },
      { uid: doctorUserIds[2],  title:'New Appointment',          msg:'New appointment booked by Emily Davis on '+d(0)+' at 08:30.',                              type:'appointment' },
      { uid: doctorUserIds[3],  title:'New Appointment',          msg:'New appointment booked by Michael Wilson on '+d(2)+' at 11:00.',                           type:'appointment' },
      // Admin notifications
      { uid: adminId,           title:'New Doctor Registered',    msg:'Dr. David Kim has registered as a new Ophthalmologist.',                                    type:'info' },
      { uid: adminId,           title:'Revenue Summary',          msg:'Monthly revenue target achieved. Total this month: $12,450.00.',                            type:'billing' },
      { uid: adminId,           title:'Pending Bills Alert',      msg:'3 patients have unpaid bills older than 15 days.',                                          type:'billing' },
      { uid: adminId,           title:'New Patient Registered',   msg:'12 new patients registered this month.',                                                    type:'info' },
    ];

    for (const n of notifications) {
      if (!n.uid) continue;
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, is_read)
         VALUES ($1,$2,$3,$4,$5)`,
        [n.uid, n.title, n.msg, n.type, Math.random() > 0.5]
      );
    }
    console.log(`  ✓ ${notifications.filter(n=>n.uid).length} notifications created`);

    // ── 12. Insert Doctor Schedules ────────────────────────────
    const schedules = [];
    for (let i = 0; i < doctorIds.length; i++) {
      for (let offset = -7; offset <= 30; offset++) {
        const dt    = new Date(today); dt.setDate(dt.getDate() + offset);
        const day   = dt.toLocaleDateString('en-US', { weekday: 'long' });
        const prof  = doctorProfiles[i];
        if (!prof.days.includes(day)) continue;
        schedules.push({
          doctor_id:    doctorIds[i],
          schedule_date: dt.toISOString().slice(0, 10),
          start_time:   prof.from,
          end_time:     prof.to,
          is_available: offset !== 14, // block one day as example
          reason:       offset === 14 ? 'Conference' : null,
        });
      }
    }

    let schedInserted = 0;
    for (const s of schedules) {
      await client.query(
        `INSERT INTO doctor_schedules
           (doctor_id,schedule_date,start_time,end_time,is_available,reason)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (doctor_id,schedule_date,start_time) DO NOTHING`,
        [s.doctor_id, s.schedule_date, s.start_time, s.end_time, s.is_available, s.reason]
      );
      schedInserted++;
    }
    console.log(`  ✓ ${schedInserted} doctor schedule entries created`);

    // ── 13. Commit ─────────────────────────────────────────────
    await client.query('COMMIT');
    console.log('\n✅ All sample data seeded successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  DOCTOR LOGIN CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    doctorUsers.forEach(u => console.log(`  ${u.email}  →  Doctor@123`));
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  PATIENT LOGIN CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    patientUsers.forEach(u => console.log(`  ${u.email}  →  Patient@123`));
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ADMIN:  admin@hospital.com  →  Admin@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Seeding failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

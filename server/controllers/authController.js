const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const UserModel    = require('../models/userModel');
const DoctorModel  = require('../models/doctorModel');
const PatientModel = require('../models/patientModel');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// ── Helpers ───────────────────────────────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const sanitizeUser = (user) => {
  const { password_hash, ...rest } = user;
  return rest;
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res) => {
  const { full_name, email, password, role, phone, ...profileData } = req.body;

  // Check duplicate
  const existing = await UserModel.findByEmail(email);
  if (existing) throw new AppError('Email already registered.', 409);

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(password, salt);

  // Create user
  const user = await UserModel.create({ full_name, email, password_hash, role, phone });

  // Create role-specific profile
  let profile = null;
  if (role === 'doctor') {
    profile = await DoctorModel.create({
      user_id:           user.id,
      specialization:    profileData.specialization  || 'General',
      qualification:     profileData.qualification,
      experience_years:  profileData.experience_years,
      consultation_fee:  profileData.consultation_fee,
      department_id:     profileData.department_id,
      license_number:    profileData.license_number,
      available_days:    profileData.available_days,
      available_from:    profileData.available_from,
      available_to:      profileData.available_to,
    });
  } else if (role === 'patient') {
    profile = await PatientModel.create({
      user_id:                 user.id,
      date_of_birth:           profileData.date_of_birth,
      gender:                  profileData.gender,
      blood_group:             profileData.blood_group,
      address:                 profileData.address,
      emergency_contact_name:  profileData.emergency_contact_name,
      emergency_contact_phone: profileData.emergency_contact_phone,
      allergies:               profileData.allergies,
      chronic_diseases:        profileData.chronic_diseases,
    });
  }

  const token = signToken(user);

  res.status(201).json({
    success: true,
    message: 'Registration successful.',
    data: { token, user: sanitizeUser(user), profile },
  });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await UserModel.findByEmail(email);
  if (!user) throw new AppError('Invalid email or password.', 401);

  if (!user.is_active) throw new AppError('Account is deactivated. Contact admin.', 401);

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw new AppError('Invalid email or password.', 401);

  // Fetch role profile
  let profile = null;
  if (user.role === 'doctor')  profile = await DoctorModel.findByUserId(user.id);
  if (user.role === 'patient') profile = await PatientModel.findByUserId(user.id);

  const token = signToken(user);

  res.json({
    success: true,
    message: 'Login successful.',
    data: { token, user: sanitizeUser(user), profile },
  });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user.id);
  if (!user) throw new AppError('User not found.', 404);

  let profile = null;
  if (user.role === 'doctor')  profile = await DoctorModel.findByUserId(user.id);
  if (user.role === 'patient') profile = await PatientModel.findByUserId(user.id);

  res.json({ success: true, data: { user, profile } });
});

// ── PUT /api/auth/update-profile ──────────────────────────────────────────────
exports.updateProfile = asyncHandler(async (req, res) => {
  const { full_name, phone, avatar_url } = req.body;
  const updated = await UserModel.update(req.user.id, { full_name, phone, avatar_url });
  if (!updated) throw new AppError('User not found.', 404);
  res.json({ success: true, message: 'Profile updated.', data: updated });
});

// ── PUT /api/auth/change-password ─────────────────────────────────────────────
exports.changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;

  const user = await UserModel.findByEmail(req.user.email);
  const isMatch = await bcrypt.compare(current_password, user.password_hash);
  if (!isMatch) throw new AppError('Current password is incorrect.', 400);

  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(new_password, salt);
  await UserModel.updatePassword(req.user.id, password_hash);

  res.json({ success: true, message: 'Password changed successfully.' });
});

const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { authMiddleware, generateToken } = require('../middleware/auth');

const router = express.Router();

// Email format regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Phone number: 7 to 15 digits, allowing optional leading +
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,15}$/;

/**
 * POST /api/hospitals/register
 * Register a new hospital with strict validation.
 * No demo data or stock is created.
 */
router.post('/register', async (req, res) => {
  try {
    const {
      hospital_name,
      registration_number,
      contact_number,
      email,
      password,
      confirm_password,
      confirmPassword,
      address,
      pincode,
      location
    } = req.body;

    const actualConfirmPassword = confirm_password !== undefined ? confirm_password : confirmPassword;

    // Field existence & trim checks
    const trimmedName = hospital_name ? String(hospital_name).trim() : '';
    const trimmedReg = registration_number ? String(registration_number).trim() : '';
    const trimmedContact = contact_number ? String(contact_number).trim() : '';
    const trimmedEmail = email ? String(email).trim().toLowerCase() : '';
    const trimmedAddress = address ? String(address).trim() : '';
    const trimmedPincode = pincode ? String(pincode).trim() : '';
    const trimmedLocation = location ? String(location).trim() : '';

    if (!trimmedName) {
      return res.status(400).json({ success: false, message: 'Hospital name is required.' });
    }
    if (!trimmedReg) {
      return res.status(400).json({ success: false, message: 'Hospital registration number is required.' });
    }
    if (!trimmedContact) {
      return res.status(400).json({ success: false, message: 'Contact number is required.' });
    }
    if (!PHONE_REGEX.test(trimmedContact)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid contact number (7-15 digits).' });
    }
    if (!trimmedEmail) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }
    if (password !== actualConfirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }
    if (!trimmedAddress) {
      return res.status(400).json({ success: false, message: 'Hospital address is required.' });
    }
    if (!trimmedPincode) {
      return res.status(400).json({ success: false, message: 'Pincode is required.' });
    }
    if (!trimmedLocation) {
      return res.status(400).json({ success: false, message: 'Location is required.' });
    }

    // Check unique registration number
    const existingReg = db.prepare('SELECT id FROM hospitals WHERE registration_number = ? COLLATE NOCASE').get(trimmedReg);
    if (existingReg) {
      return res.status(400).json({
        success: false,
        message: 'A hospital with this registration number is already registered.'
      });
    }

    // Check unique email
    const existingEmail = db.prepare('SELECT id FROM hospitals WHERE email = ? COLLATE NOCASE').get(trimmedEmail);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'A hospital with this email address is already registered.'
      });
    }

    // Hash password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert new hospital into database
    const insertStmt = db.prepare(`
      INSERT INTO hospitals (
        hospital_name,
        registration_number,
        contact_number,
        email,
        password_hash,
        address,
        pincode,
        location,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const result = insertStmt.run(
      trimmedName,
      trimmedReg,
      trimmedContact,
      trimmedEmail,
      passwordHash,
      trimmedAddress,
      trimmedPincode,
      trimmedLocation
    );

    const newHospital = db.prepare(`
      SELECT id, hospital_name, registration_number, contact_number, email, address, pincode, location, created_at, updated_at
      FROM hospitals
      WHERE id = ?
    `).get(result.lastInsertRowid);

    const token = generateToken(newHospital);

    return res.status(201).json({
      success: true,
      message: 'Hospital registered successfully.',
      hospital: newHospital,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed due to a server error. Please try again.'
    });
  }
});

/**
 * POST /api/hospitals/login
 * Hospital authentication
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const trimmedEmail = email ? String(email).trim().toLowerCase() : '';
    if (!trimmedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Both email and password are required.'
      });
    }

    const hospital = db.prepare(`
      SELECT id, hospital_name, registration_number, contact_number, email, password_hash, address, pincode, location, created_at, updated_at
      FROM hospitals
      WHERE email = ? COLLATE NOCASE
    `).get(trimmedEmail);

    if (!hospital) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, hospital.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Exclude password_hash from response
    const { password_hash, ...safeHospital } = hospital;
    const token = generateToken(safeHospital);

    return res.json({
      success: true,
      message: 'Login successful.',
      hospital: safeHospital,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed due to a server error. Please try again.'
    });
  }
});

/**
 * GET /api/hospitals/me
 * Get current authenticated hospital profile
 */
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    hospital: req.hospital
  });
});

/**
 * PUT /api/hospitals/me
 * Update authenticated hospital information
 */
router.put('/me', authMiddleware, (req, res) => {
  try {
    const { hospital_name, contact_number, address, pincode, location } = req.body;

    const trimmedName = hospital_name ? String(hospital_name).trim() : req.hospital.hospital_name;
    const trimmedContact = contact_number ? String(contact_number).trim() : req.hospital.contact_number;
    const trimmedAddress = address ? String(address).trim() : req.hospital.address;
    const trimmedPincode = pincode ? String(pincode).trim() : req.hospital.pincode;
    const trimmedLocation = location ? String(location).trim() : req.hospital.location;

    if (!trimmedName) {
      return res.status(400).json({ success: false, message: 'Hospital name cannot be empty.' });
    }
    if (!trimmedContact || !PHONE_REGEX.test(trimmedContact)) {
      return res.status(400).json({ success: false, message: 'Valid contact number is required.' });
    }
    if (!trimmedAddress) {
      return res.status(400).json({ success: false, message: 'Address cannot be empty.' });
    }
    if (!trimmedPincode) {
      return res.status(400).json({ success: false, message: 'Pincode cannot be empty.' });
    }
    if (!trimmedLocation) {
      return res.status(400).json({ success: false, message: 'Location cannot be empty.' });
    }

    db.prepare(`
      UPDATE hospitals
      SET hospital_name = ?,
          contact_number = ?,
          address = ?,
          pincode = ?,
          location = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(trimmedName, trimmedContact, trimmedAddress, trimmedPincode, trimmedLocation, req.hospital.id);

    const updatedHospital = db.prepare(`
      SELECT id, hospital_name, registration_number, contact_number, email, address, pincode, location, created_at, updated_at
      FROM hospitals
      WHERE id = ?
    `).get(req.hospital.id);

    return res.json({
      success: true,
      message: 'Hospital information updated successfully.',
      hospital: updatedHospital
    });
  } catch (error) {
    console.error('Update hospital error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update hospital information.'
    });
  }
});

module.exports = router;

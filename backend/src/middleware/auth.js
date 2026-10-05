const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'mediguide_bloodconnect_jwt_secret_2026_secure';

function generateToken(hospital) {
  return jwt.sign(
    {
      id: hospital.id,
      email: hospital.email,
      registration_number: hospital.registration_number
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization required. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const stmt = db.prepare(`
      SELECT id, hospital_name, registration_number, contact_number, email, address, pincode, location, created_at, updated_at
      FROM hospitals
      WHERE id = ?
    `);
    const hospital = stmt.get(decoded.id);

    if (!hospital) {
      return res.status(401).json({ success: false, message: 'Hospital account not found or has been removed.' });
    }

    req.hospital = hospital;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid or expired authorization token.' });
  }
}

module.exports = {
  JWT_SECRET,
  generateToken,
  authMiddleware
};

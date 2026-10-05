const express = require('express');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * Helper to calculate stock status automatically:
 * 0 units -> "Out of Stock"
 * 1-5 units -> "Low Stock"
 * > 5 units -> "Available"
 */
function calculateStockStatus(units) {
  if (units === 0) return 'Out of Stock';
  if (units <= 5) return 'Low Stock';
  return 'Available';
}

function normalizeBloodGroup(bg) {
  if (!bg) return '';
  return decodeURIComponent(bg).trim().toUpperCase();
}

/**
 * GET /api/hospitals/me/inventory
 * Fetch the inventory of all 8 blood groups for the logged-in hospital.
 * Real data only: if hospital has never entered stock, recorded as null / 0 with updated_at null.
 */
router.get('/inventory', authMiddleware, (req, res) => {
  try {
    const records = db.prepare(`
      SELECT blood_group, units_available, updated_at
      FROM blood_inventory
      WHERE hospital_id = ?
    `).all(req.hospital.id);

    const recordMap = new Map();
    records.forEach(r => recordMap.set(r.blood_group, r));

    // Present all 8 standard blood groups
    const inventory = VALID_BLOOD_GROUPS.map(group => {
      const existing = recordMap.get(group);
      if (existing) {
        return {
          blood_group: group,
          units_available: existing.units_available,
          status: calculateStockStatus(existing.units_available),
          updated_at: existing.updated_at,
          has_entry: true
        };
      }
      return {
        blood_group: group,
        units_available: 0,
        status: 'Stock information not updated',
        updated_at: null,
        has_entry: false
      };
    });

    res.json({
      success: true,
      inventory
    });
  } catch (error) {
    console.error('Fetch inventory error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve inventory data.' });
  }
});

/**
 * PUT /api/hospitals/me/inventory/:bloodGroup
 * Update units for a specific blood group.
 * Prevents duplicates via SQLite UNIQUE constraint + UPSERT.
 */
router.put('/inventory/:bloodGroup', authMiddleware, (req, res) => {
  try {
    const rawBloodGroup = req.params.bloodGroup;
    const bloodGroup = normalizeBloodGroup(rawBloodGroup);

    if (!VALID_BLOOD_GROUPS.includes(bloodGroup)) {
      return res.status(400).json({
        success: false,
        message: `Invalid blood group "${rawBloodGroup}". Valid groups are: ${VALID_BLOOD_GROUPS.join(', ')}`
      });
    }

    const { units_available } = req.body;
    const units = Number(units_available);

    if (units_available === undefined || units_available === null || isNaN(units) || !Number.isInteger(units) || units < 0) {
      return res.status(400).json({
        success: false,
        message: 'Units available must be a valid non-negative integer (0 or greater).'
      });
    }

    // Upsert blood stock
    const stmt = db.prepare(`
      INSERT INTO blood_inventory (hospital_id, blood_group, units_available, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(hospital_id, blood_group)
      DO UPDATE SET
        units_available = excluded.units_available,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(req.hospital.id, bloodGroup, units);

    const updatedRecord = db.prepare(`
      SELECT blood_group, units_available, updated_at
      FROM blood_inventory
      WHERE hospital_id = ? AND blood_group = ?
    `).get(req.hospital.id, bloodGroup);

    return res.json({
      success: true,
      message: `Stock updated for ${bloodGroup}.`,
      item: {
        blood_group: updatedRecord.blood_group,
        units_available: updatedRecord.units_available,
        status: calculateStockStatus(updatedRecord.units_available),
        updated_at: updatedRecord.updated_at,
        has_entry: true
      }
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update blood stock.' });
  }
});

/**
 * GET /api/hospitals/me/required-blood
 * List required blood groups marked by this hospital.
 */
router.get('/required-blood', authMiddleware, (req, res) => {
  try {
    const required = db.prepare(`
      SELECT blood_group, created_at, updated_at
      FROM required_blood
      WHERE hospital_id = ?
      ORDER BY blood_group ASC
    `).all(req.hospital.id);

    res.json({
      success: true,
      required: required.map(r => r.blood_group),
      details: required
    });
  } catch (error) {
    console.error('Fetch required blood error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve required blood groups.' });
  }
});

/**
 * POST /api/hospitals/me/required-blood
 * Add a required blood group.
 */
router.post('/required-blood', authMiddleware, (req, res) => {
  try {
    const rawBloodGroup = req.body.blood_group;
    const bloodGroup = normalizeBloodGroup(rawBloodGroup);

    if (!VALID_BLOOD_GROUPS.includes(bloodGroup)) {
      return res.status(400).json({
        success: false,
        message: `Invalid blood group "${rawBloodGroup}". Valid groups are: ${VALID_BLOOD_GROUPS.join(', ')}`
      });
    }

    db.prepare(`
      INSERT INTO required_blood (hospital_id, blood_group, created_at, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(hospital_id, blood_group)
      DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    `).run(req.hospital.id, bloodGroup);

    const required = db.prepare(`
      SELECT blood_group
      FROM required_blood
      WHERE hospital_id = ?
      ORDER BY blood_group ASC
    `).all(req.hospital.id).map(r => r.blood_group);

    return res.json({
      success: true,
      message: `Marked ${bloodGroup} as required.`,
      required
    });
  } catch (error) {
    console.error('Add required blood error:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark required blood group.' });
  }
});

/**
 * DELETE /api/hospitals/me/required-blood/:bloodGroup
 * Remove a required blood group.
 */
router.delete('/required-blood/:bloodGroup', authMiddleware, (req, res) => {
  try {
    const rawBloodGroup = req.params.bloodGroup;
    const bloodGroup = normalizeBloodGroup(rawBloodGroup);

    db.prepare(`
      DELETE FROM required_blood
      WHERE hospital_id = ? AND blood_group = ?
    `).run(req.hospital.id, bloodGroup);

    const required = db.prepare(`
      SELECT blood_group
      FROM required_blood
      WHERE hospital_id = ?
      ORDER BY blood_group ASC
    `).all(req.hospital.id).map(r => r.blood_group);

    return res.json({
      success: true,
      message: `Removed ${bloodGroup} from requirements.`,
      required
    });
  } catch (error) {
    console.error('Remove required blood error:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove required blood group.' });
  }
});

module.exports = router;
module.exports.VALID_BLOOD_GROUPS = VALID_BLOOD_GROUPS;
module.exports.calculateStockStatus = calculateStockStatus;

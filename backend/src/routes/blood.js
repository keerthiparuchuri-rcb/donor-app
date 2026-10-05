const express = require('express');
const { db } = require('../db');
const { calculateStockStatus, VALID_BLOOD_GROUPS } = require('./inventory');

const router = express.Router();

/**
 * GET /api/blood/search
 * Search real registered hospitals with real available blood stock (> 0 units).
 * Optional filters: pincode, location.
 */
router.get('/search', (req, res) => {
  try {
    const rawBloodGroup = req.query.blood_group;
    const pincode = req.query.pincode ? String(req.query.pincode).trim() : '';
    const location = req.query.location ? String(req.query.location).trim().toLowerCase() : '';

    if (!rawBloodGroup) {
      return res.status(400).json({
        success: false,
        message: 'Please select a blood group to search.'
      });
    }

    const bloodGroup = decodeURIComponent(rawBloodGroup).trim().toUpperCase();

    if (!VALID_BLOOD_GROUPS.includes(bloodGroup)) {
      return res.status(400).json({
        success: false,
        message: `Invalid blood group "${rawBloodGroup}". Valid groups: ${VALID_BLOOD_GROUPS.join(', ')}`
      });
    }

    // Dynamic query building
    const params = [bloodGroup];
    let whereClauses = [
      'bi.blood_group = ?',
      'bi.units_available > 0'
    ];

    if (pincode) {
      whereClauses.push('h.pincode = ?');
      params.push(pincode);
    }

    if (location) {
      whereClauses.push('(LOWER(h.location) LIKE ? OR LOWER(h.address) LIKE ?)');
      params.push(`%${location}%`);
      params.push(`%${location}%`);
    }

    const sql = `
      SELECT
        h.id,
        h.hospital_name,
        h.registration_number,
        h.contact_number,
        h.email,
        h.address,
        h.pincode,
        h.location,
        bi.blood_group,
        bi.units_available,
        bi.updated_at as stock_updated_at,
        (
          SELECT GROUP_CONCAT(rb.blood_group, ', ')
          FROM required_blood rb
          WHERE rb.hospital_id = h.id
        ) as required_blood_groups
      FROM hospitals h
      INNER JOIN blood_inventory bi ON bi.hospital_id = h.id
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY bi.units_available DESC, h.hospital_name ASC
    `;

    const rows = db.prepare(sql).all(...params);

    const results = rows.map(row => {
      const requiredList = row.required_blood_groups
        ? row.required_blood_groups.split(', ').filter(Boolean)
        : [];

      return {
        hospital_id: row.id,
        hospital_name: row.hospital_name,
        registration_number: row.registration_number,
        contact_number: row.contact_number,
        email: row.email,
        address: row.address,
        pincode: row.pincode,
        location: row.location,
        blood_group: row.blood_group,
        units_available: row.units_available,
        status: calculateStockStatus(row.units_available),
        last_updated: row.stock_updated_at,
        required_blood_groups: requiredList
      };
    });

    return res.json({
      success: true,
      query: {
        blood_group: bloodGroup,
        pincode: pincode || null,
        location: location || null
      },
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Blood search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search blood inventory.'
    });
  }
});

module.exports = router;

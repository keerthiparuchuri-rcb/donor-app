const express = require('express');
const cors = require('cors');
const path = require('path');
const { getStats, resetDatabase } = require('./db');

const hospitalRoutes = require('./routes/hospitals');
const inventoryRoutes = require('./routes/inventory');
const bloodRoutes = require('./routes/blood');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logging for debugging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Health & Statistics endpoint
app.get('/api/health', (req, res) => {
  try {
    const stats = getStats();
    res.json({
      status: 'healthy',
      app: 'MediGuide BloodConnect API',
      timestamp: new Date().toISOString(),
      database_counts: stats
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Safe database reset (Development only - resets to empty schema with 0 rows)
app.post('/api/dev/reset-database', (req, res) => {
  try {
    const stats = resetDatabase();
    res.json({
      success: true,
      message: 'Database schema successfully reset to 0 records. Strictly no demo data exists.',
      stats
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reset database: ' + err.message });
  }
});

// Routes
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/hospitals/me', inventoryRoutes);
app.use('/api/blood', bloodRoutes);

// Serve frontend static build if available
const frontendDist = path.join(__dirname, '../../frontend/dist');
const fs = require('fs');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.originalUrl.startsWith('/api')) {
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    next();
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.'
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    const stats = getStats();
    console.log(`====================================================`);
    console.log(`  MediGuide BloodConnect Backend Running on Port ${PORT}`);
    console.log(`  Database status:`);
    console.log(`    - Hospitals: ${stats.hospitals}`);
    console.log(`    - Blood Inventory: ${stats.blood_inventory}`);
    console.log(`    - Required Blood: ${stats.required_blood}`);
    console.log(`  Real Data Mode: STRICTLY ZERO DEMO DATA`);
    console.log(`====================================================`);
  });
}

module.exports = app;

const Database = require('better-sqlite3');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('--- STARTING VERIFICATION TEST SUITE ---');

  // Helper
  const post = async (url, body, token) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(BASE_URL + url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  };

  const get = async (url, token) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(BASE_URL + url, { headers });
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  };

  const put = async (url, body, token) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(BASE_URL + url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  };

  // TEST 1: Initial State Check
  console.log('\n[TEST 1] Checking initial application state...');
  const healthRes = await get('/api/health');
  console.log('Initial stats:', healthRes.data.database_counts);
  if (healthRes.data.database_counts.hospitals !== 0 ||
      healthRes.data.database_counts.blood_inventory !== 0 ||
      healthRes.data.database_counts.required_blood !== 0) {
    throw new Error('FAIL: Initial state is NOT empty!');
  }
  console.log('PASS: TEST 1 - Database starts completely empty (0 hospitals, 0 inventory, 0 required).');

  // TEST 2: Register Hospital
  console.log('\n[TEST 2] Registering a hospital manually...');
  const regPayload = {
    hospital_name: 'City Care General Hospital',
    registration_number: 'REG-CCGH-2026-001',
    contact_number: '+91 9123456780',
    email: 'citycare@hospital.org',
    password: 'SecurePassword123!',
    confirm_password: 'SecurePassword123!',
    address: '42 Healthway Boulevard, Sector 4',
    pincode: '516001',
    location: 'Kadapa'
  };

  const regRes = await post('/api/hospitals/register', regPayload);
  console.log('Registration response:', regRes.status, regRes.data.message);
  if (!regRes.ok || !regRes.data.token) {
    throw new Error('FAIL: Registration failed: ' + JSON.stringify(regRes.data));
  }
  const token = regRes.data.token;
  console.log('PASS: TEST 2 - Hospital registered successfully.');

  // TEST 3: Login
  console.log('\n[TEST 3] Testing hospital login...');
  const loginRes = await post('/api/hospitals/login', {
    email: 'citycare@hospital.org',
    password: 'SecurePassword123!'
  });
  if (!loginRes.ok || !loginRes.data.hospital) {
    throw new Error('FAIL: Hospital login failed: ' + JSON.stringify(loginRes.data));
  }
  console.log('PASS: TEST 3 - Login successful, received hospital profile.');

  // TEST 4: Add stock: A+ = 5, O- = 8
  console.log('\n[TEST 4] Adding blood stock: A+ = 5 units, O- = 8 units...');
  const stockA = await put('/api/hospitals/me/inventory/A%2B', { units_available: 5 }, token);
  const stockO = await put('/api/hospitals/me/inventory/O-', { units_available: 8 }, token);

  console.log('Stock A+ response:', stockA.data.item);
  console.log('Stock O- response:', stockO.data.item);

  if (stockA.data.item.status !== 'Low Stock' || stockO.data.item.status !== 'Available') {
    throw new Error('FAIL: Stock status calculation incorrect!');
  }
  console.log('PASS: TEST 4 - Database updated with real stock, status auto-calculated.');

  // TEST 5: Open User Portal & Search A+
  console.log('\n[TEST 5] Searching blood group A+ in User Portal...');
  const searchA = await get('/api/blood/search?blood_group=A%2B');
  console.log(`Found ${searchA.data.count} hospital(s) with A+:`, searchA.data.results.map(r => `${r.hospital_name}: ${r.units_available} units (${r.status})`));
  if (searchA.data.count !== 1 || searchA.data.results[0].units_available !== 5) {
    throw new Error('FAIL: A+ search did not return expected registered hospital data!');
  }
  console.log('PASS: TEST 5 - User search accurately returned registered hospital.');

  // TEST 6: Change A+ stock from 5 -> 10
  console.log('\n[TEST 6] Updating A+ stock from 5 to 10...');
  const updateA = await put('/api/hospitals/me/inventory/A%2B', { units_available: 10 }, token);
  console.log('Updated item:', updateA.data.item);

  const searchAUpdated = await get('/api/blood/search?blood_group=A%2B');
  console.log(`User search reflects: ${searchAUpdated.data.results[0].units_available} units (${searchAUpdated.data.results[0].status})`);
  if (searchAUpdated.data.results[0].units_available !== 10 || searchAUpdated.data.results[0].status !== 'Available') {
    throw new Error('FAIL: User portal did not reflect updated stock!');
  }
  console.log('PASS: TEST 6 - User Portal immediately reflects real-time stock update to 10 units.');

  // TEST 7: Search unavailable blood group (e.g. B-)
  console.log('\n[TEST 7] Searching unavailable blood group B- ...');
  const searchBneg = await get('/api/blood/search?blood_group=B-');
  console.log('Search B- results count:', searchBneg.data.count);
  if (searchBneg.data.count !== 0) {
    throw new Error('FAIL: Unavailable blood group returned records!');
  }
  console.log('PASS: TEST 7 - Search for unavailable group correctly returns 0 records.');

  // TEST 8: Register same hospital registration number again
  console.log('\n[TEST 8] Attempting duplicate hospital registration...');
  const dupReg = await post('/api/hospitals/register', {
    ...regPayload,
    email: 'different_email@hospital.org' // Same registration number
  });
  console.log('Duplicate reg response status:', dupReg.status, dupReg.data.message);
  if (dupReg.ok || dupReg.status !== 400) {
    throw new Error('FAIL: Duplicate registration number was not rejected!');
  }
  console.log('PASS: TEST 8 - Duplicate registration rejected successfully.');

  // TEST 9: Update blood stock duplicate prevention
  console.log('\n[TEST 9] Checking duplicate blood stock records...');
  await put('/api/hospitals/me/inventory/A%2B', { units_available: 15 }, token);

  const db = new Database(path.join(__dirname, 'data', 'bloodconnect.db'));
  const rowCount = db.prepare('SELECT COUNT(*) as c FROM blood_inventory WHERE blood_group = ?').get('A+').c;
  if (rowCount !== 1) {
    throw new Error('FAIL: Duplicate blood stock record created! Count: ' + rowCount);
  }
  console.log(`PASS: TEST 9 - Blood stock row count for A+ is exactly ${rowCount} (No duplicates).`);

  // TEST Required Blood Groups
  console.log('\n[TEST Requirements] Marking required blood groups...');
  const addReqRes = await post('/api/hospitals/me/required-blood', { blood_group: 'AB-' }, token);
  console.log('Required blood groups for hospital:', addReqRes.data.required);

  const searchWithReq = await get('/api/blood/search?blood_group=A%2B');
  console.log('Hospital search result required blood groups:', searchWithReq.data.results[0].required_blood_groups);
  if (!searchWithReq.data.results[0].required_blood_groups.includes('AB-')) {
    throw new Error('FAIL: Required blood groups not propagated to search result!');
  }
  console.log('PASS: Required blood groups accurately reflected.');

  // Reset back to completely empty state as required by prompt
  console.log('\n[TEST 10] Testing database reset to empty schema (0 records)...');
  const resetRes = await post('/api/dev/reset-database', {});
  console.log('Reset response:', resetRes.data);
  if (resetRes.data.stats.hospitals !== 0 || resetRes.data.stats.blood_inventory !== 0 || resetRes.data.stats.required_blood !== 0) {
    throw new Error('FAIL: Reset database did not yield 0 records!');
  }
  console.log('PASS: Database safely reset to 0 records. ZERO demo data present.');

  console.log('\n=========================================');
  console.log('ALL API & DATABASE INTEGRATION TESTS PASSED!');
  console.log('=========================================');
}

runTests().catch(err => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});

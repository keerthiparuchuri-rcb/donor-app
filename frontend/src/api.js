const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('mediguide_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('mediguide_token', token);
  } else {
    localStorage.removeItem('mediguide_token');
  }
}

export function getStoredHospital() {
  const data = localStorage.getItem('mediguide_hospital');
  return data ? JSON.parse(data) : null;
}

export function setStoredHospital(hospital) {
  if (hospital) {
    localStorage.setItem('mediguide_hospital', JSON.stringify(hospital));
  } else {
    localStorage.removeItem('mediguide_hospital');
  }
}

export function clearAuth() {
  localStorage.removeItem('mediguide_token');
  localStorage.removeItem('mediguide_hospital');
}

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: 'An unexpected response was received from the server.'
  }));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Hospital Authentication
  registerHospital: (data) => request('/hospitals/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  loginHospital: (data) => request('/hospitals/login', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  getHospitalProfile: () => request('/hospitals/me'),

  updateHospitalProfile: (data) => request('/hospitals/me', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // Inventory Management
  getInventory: () => request('/hospitals/me/inventory'),

  updateStock: (bloodGroup, unitsAvailable) => {
    const encoded = encodeURIComponent(bloodGroup);
    return request(`/hospitals/me/inventory/${encoded}`, {
      method: 'PUT',
      body: JSON.stringify({ units_available: unitsAvailable })
    });
  },

  // Required Blood Groups
  getRequiredBlood: () => request('/hospitals/me/required-blood'),

  addRequiredBlood: (bloodGroup) => request('/hospitals/me/required-blood', {
    method: 'POST',
    body: JSON.stringify({ blood_group: bloodGroup })
  }),

  removeRequiredBlood: (bloodGroup) => {
    const encoded = encodeURIComponent(bloodGroup);
    return request(`/hospitals/me/required-blood/${encoded}`, {
      method: 'DELETE'
    });
  },

  // User Blood Search
  searchBlood: (bloodGroup, pincode = '', location = '') => {
    const params = new URLSearchParams();
    if (bloodGroup) params.append('blood_group', bloodGroup);
    if (pincode) params.append('pincode', pincode);
    if (location) params.append('location', location);
    return request(`/blood/search?${params.toString()}`);
  },

  // Health / Stats
  getHealth: () => request('/health'),

  resetDatabaseDev: () => request('/dev/reset-database', { method: 'POST' })
};

import React, { useState, useEffect } from 'react';
import { api, setStoredHospital } from '../api';
import {
  Building2,
  Droplet,
  AlertTriangle,
  Clock,
  Edit2,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Hash
} from 'lucide-react';

const ALL_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function HospitalDashboard({ hospital, onUpdateHospital }) {
  const [inventory, setInventory] = useState([]);
  const [requiredBlood, setRequiredBlood] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Stock edit tracking
  const [editUnits, setEditUnits] = useState({});
  const [savingStock, setSavingStock] = useState({});

  // Hospital Info edit modal state
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({
    hospital_name: hospital.hospital_name || '',
    contact_number: hospital.contact_number || '',
    address: hospital.address || '',
    pincode: hospital.pincode || '',
    location: hospital.location || ''
  });
  const [savingInfo, setSavingInfo] = useState(false);

  // New required blood select state
  const [selectedRequiredGroup, setSelectedRequiredGroup] = useState('A+');
  const [addingRequired, setAddingRequired] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [hospital.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [invRes, reqRes] = await Promise.all([
        api.getInventory(),
        api.getRequiredBlood()
      ]);

      if (invRes.success) {
        setInventory(invRes.inventory);
        // Initialize local edit state with current units
        const unitsMap = {};
        invRes.inventory.forEach(item => {
          unitsMap[item.blood_group] = item.units_available;
        });
        setEditUnits(unitsMap);
      }

      if (reqRes.success) {
        setRequiredBlood(reqRes.required);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      showMessage(err.message || 'Failed to load dashboard data.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 4500);
  };

  // Stock update handler
  const handleUpdateStock = async (bloodGroup) => {
    const rawVal = editUnits[bloodGroup];
    const units = Number(rawVal);

    if (rawVal === undefined || rawVal === '' || isNaN(units) || !Number.isInteger(units) || units < 0) {
      showMessage(`Please enter a valid non-negative integer for ${bloodGroup}.`, 'danger');
      return;
    }

    try {
      setSavingStock(prev => ({ ...prev, [bloodGroup]: true }));
      const res = await api.updateStock(bloodGroup, units);

      if (res.success) {
        showMessage(`Successfully updated ${bloodGroup} to ${units} units.`, 'success');
        // Update local inventory list with response item
        setInventory(prev =>
          prev.map(item =>
            item.blood_group === bloodGroup ? res.item : item
          )
        );
      }
    } catch (err) {
      showMessage(err.message || `Failed to update stock for ${bloodGroup}.`, 'danger');
    } finally {
      setSavingStock(prev => ({ ...prev, [bloodGroup]: false }));
    }
  };

  // Add required blood
  const handleAddRequired = async (e) => {
    e.preventDefault();
    if (requiredBlood.includes(selectedRequiredGroup)) {
      showMessage(`${selectedRequiredGroup} is already in the required list.`, 'info');
      return;
    }

    try {
      setAddingRequired(true);
      const res = await api.addRequiredBlood(selectedRequiredGroup);
      if (res.success) {
        setRequiredBlood(res.required);
        showMessage(`Marked ${selectedRequiredGroup} as an urgent requirement.`, 'success');
      }
    } catch (err) {
      showMessage(err.message || 'Failed to add requirement.', 'danger');
    } finally {
      setAddingRequired(false);
    }
  };

  // Remove required blood
  const handleRemoveRequired = async (group) => {
    try {
      const res = await api.removeRequiredBlood(group);
      if (res.success) {
        setRequiredBlood(res.required);
        showMessage(`Removed ${group} from requirements.`, 'success');
      }
    } catch (err) {
      showMessage(err.message || 'Failed to remove requirement.', 'danger');
    }
  };

  // Update hospital info
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    try {
      setSavingInfo(true);
      const res = await api.updateHospitalProfile(infoForm);
      if (res.success) {
        setStoredHospital(res.hospital);
        onUpdateHospital(res.hospital);
        setIsEditingInfo(false);
        showMessage('Hospital profile details updated successfully.', 'success');
      }
    } catch (err) {
      showMessage(err.message || 'Failed to update hospital information.', 'danger');
    } finally {
      setSavingInfo(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Available':
        return 'status-badge available';
      case 'Low Stock':
        return 'status-badge low-stock';
      case 'Out of Stock':
        return 'status-badge out-of-stock';
      default:
        return 'status-badge not-set';
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Banner */}
      <div className="dashboard-header-banner">
        <div>
          <h1>{hospital.hospital_name}</h1>
          <p>
            Official Hospital Dashboard • Reg No: <strong>{hospital.registration_number}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setIsEditingInfo(true)}
            id="dash-edit-info-btn"
          >
            <Edit2 size={16} />
            <span>Update Details</span>
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`} role="alert" id="dashboard-alert-banner">
          {message.type === 'danger' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="dashboard-grid-split">
        {/* Left Column: Hospital Info Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>
                <Building2 size={18} color="var(--primary)" />
                <span>Hospital Information</span>
              </h3>
            </div>
            <div className="dash-card-body">
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Hospital Name</span>
                  <span className="info-value" id="disp-hosp-name">{hospital.hospital_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Registration Number</span>
                  <span className="info-value" id="disp-hosp-reg">
                    <span className="hospital-reg-badge">{hospital.registration_number}</span>
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Contact Number</span>
                  <span className="info-value" id="disp-hosp-contact">
                    <a href={`tel:${hospital.contact_number}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                      {hospital.contact_number}
                    </a>
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email Address</span>
                  <span className="info-value" id="disp-hosp-email">{hospital.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Address</span>
                  <span className="info-value" id="disp-hosp-address">{hospital.address}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Pincode</span>
                  <span className="info-value" id="disp-hosp-pincode">{hospital.pincode}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Location / City</span>
                  <span className="info-value" id="disp-hosp-location">{hospital.location}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Profile Registered On</span>
                  <span className="info-value" style={{ fontSize: '0.85rem', color: 'var(--navy-600)' }}>
                    {hospital.created_at ? new Date(hospital.created_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Urgent / Required Blood Groups Card */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>
                <AlertTriangle size={18} color="#e11d48" />
                <span>Urgent Requirements</span>
              </h3>
            </div>
            <div className="dash-card-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--navy-600)', marginBottom: '1rem' }}>
                Broadcast blood groups your facility urgently requires. Only groups you explicitly select will appear to seekers.
              </p>

              {requiredBlood.length === 0 ? (
                <div style={{ padding: '1rem', background: 'var(--slate-50)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '0.88rem', color: 'var(--navy-600)', marginBottom: '1.25rem' }}>
                  No blood groups currently marked as pending/required.
                </div>
              ) : (
                <div className="tags-container" id="required-blood-tags">
                  {requiredBlood.map(group => (
                    <span key={group} className="req-blood-tag">
                      <span>{group} Needed</span>
                      <button
                        type="button"
                        className="remove-tag"
                        onClick={() => handleRemoveRequired(group)}
                        title={`Remove ${group} requirement`}
                        aria-label={`Remove ${group}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddRequired} className="add-req-form">
                <select
                  className="form-control"
                  style={{ width: 'auto', flexGrow: 1 }}
                  value={selectedRequiredGroup}
                  onChange={(e) => setSelectedRequiredGroup(e.target.value)}
                  id="select-add-req-group"
                >
                  {ALL_BLOOD_GROUPS.map(bg => (
                    <option key={bg} value={bg} disabled={requiredBlood.includes(bg)}>
                      {bg} {requiredBlood.includes(bg) ? '(Already Added)' : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="btn btn-secondary btn-sm"
                  disabled={addingRequired || requiredBlood.includes(selectedRequiredGroup)}
                  id="btn-add-required-blood"
                >
                  <Plus size={16} />
                  <span>Mark Urgent</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Blood Stock Management */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <h3>
                <Droplet size={18} color="var(--primary)" />
                <span>Blood Stock Inventory</span>
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--navy-600)', marginTop: '2px' }}>
                Enter real verified units for each blood group. Status calculates automatically.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
              <span className="status-badge available" style={{ padding: '0.15rem 0.5rem' }}>&gt; 5 Avail</span>
              <span className="status-badge low-stock" style={{ padding: '0.15rem 0.5rem' }}>1-5 Low</span>
              <span className="status-badge out-of-stock" style={{ padding: '0.15rem 0.5rem' }}>0 Out</span>
            </div>
          </div>

          <div className="dash-card-body">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--navy-600)' }}>
                Loading verified inventory...
              </div>
            ) : (
              <div className="stock-grid" id="hospital-stock-grid">
                {inventory.map(item => {
                  const bg = item.blood_group;
                  const currentUnits = editUnits[bg] !== undefined ? editUnits[bg] : item.units_available;
                  const isDirty = Number(currentUnits) !== item.units_available;

                  return (
                    <div className="stock-card" key={bg} id={`stock-card-${bg.replace('+', 'pos').replace('-', 'neg')}`}>
                      <div className="stock-card-top">
                        <div className="blood-type-badge">{bg}</div>
                        <span className={getStatusBadgeClass(item.status)} id={`status-badge-${bg.replace('+', 'pos').replace('-', 'neg')}`}>
                          {item.status}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-700)' }}>
                        Available Units
                      </div>

                      <div className="stock-edit-box">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="stock-input"
                          value={currentUnits}
                          onChange={(e) => setEditUnits(prev => ({ ...prev, [bg]: e.target.value }))}
                          aria-label={`${bg} units`}
                          id={`input-stock-${bg.replace('+', 'pos').replace('-', 'neg')}`}
                        />
                        <button
                          type="button"
                          className={`btn btn-sm ${isDirty ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => handleUpdateStock(bg)}
                          disabled={savingStock[bg]}
                          id={`btn-save-stock-${bg.replace('+', 'pos').replace('-', 'neg')}`}
                          style={{ flexGrow: 1 }}
                        >
                          <Save size={14} />
                          <span>{savingStock[bg] ? 'Saving...' : 'Update'}</span>
                        </button>
                      </div>

                      <div className="stock-meta">
                        <Clock size={12} />
                        <span>
                          {item.updated_at
                            ? `Last Updated: ${new Date(item.updated_at).toLocaleString()}`
                            : 'Stock information not updated'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Information Modal */}
      {isEditingInfo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Update Hospital Information</h3>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setIsEditingInfo(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveInfo}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Hospital Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={infoForm.hospital_name}
                    onChange={(e) => setInfoForm(prev => ({ ...prev, hospital_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={infoForm.contact_number}
                    onChange={(e) => setInfoForm(prev => ({ ...prev, contact_number: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    rows="2"
                    className="form-control"
                    value={infoForm.address}
                    onChange={(e) => setInfoForm(prev => ({ ...prev, address: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Pincode</label>
                    <input
                      type="text"
                      className="form-control"
                      value={infoForm.pincode}
                      onChange={(e) => setInfoForm(prev => ({ ...prev, pincode: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location / City</label>
                    <input
                      type="text"
                      className="form-control"
                      value={infoForm.location}
                      onChange={(e) => setInfoForm(prev => ({ ...prev, location: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditingInfo(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingInfo}
                >
                  {savingInfo ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

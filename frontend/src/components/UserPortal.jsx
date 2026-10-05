import React, { useState } from 'react';
import { api } from '../api';
import {
  Search,
  MapPin,
  Phone,
  Building2,
  Clock,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  PhoneCall,
  CheckCircle2
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function UserPortal() {
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [pincode, setPincode] = useState('');
  const [location, setLocation] = useState('');

  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchedGroup, setSearchedGroup] = useState('');
  const [searchedPincode, setSearchedPincode] = useState('');
  const [searchedLocation, setSearchedLocation] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  // Contact modal state
  const [contactModalHospital, setContactModalHospital] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');

    if (!bloodGroup) {
      setError('Please select a blood group.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.searchBlood(bloodGroup, pincode.trim(), location.trim());
      setResults(res.results || []);
      setHasSearched(true);
      setSearchedGroup(bloodGroup);
      setSearchedPincode(pincode.trim());
      setSearchedLocation(location.trim());
    } catch (err) {
      console.error('Blood search error:', err);
      setError(err.message || 'Failed to complete search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return <span className="status-badge available">Available (&gt; 5 Units)</span>;
      case 'Low Stock':
        return <span className="status-badge low-stock">Low Stock (1-5 Units)</span>;
      case 'Out of Stock':
        return <span className="status-badge out-of-stock">Out of Stock</span>;
      default:
        return <span className="status-badge not-set">{status}</span>;
    }
  };

  return (
    <div className="user-portal-page">
      {/* Header Banner */}
      <section className="search-header-box">
        <h1>Find Blood Availability</h1>
        <p>
          Search verified blood stock directly across officially registered healthcare facilities.
        </p>
      </section>

      {/* Search Input Box */}
      <div className="search-card-container">
        <div className="search-bar-card">
          <form onSubmit={handleSearch} id="user-search-form">
            <div className="search-form-grid">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="search-blood-group">
                  Required Blood Group <span className="req">*</span>
                </label>
                <select
                  id="search-blood-group"
                  className="form-control"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  style={{ fontWeight: 700 }}
                  required
                >
                  {BLOOD_GROUPS.map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="search-pincode">
                  Pincode (Optional)
                </label>
                <input
                  id="search-pincode"
                  type="text"
                  className="form-control"
                  placeholder="e.g. 516001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="search-location">
                  Location / City (Optional)
                </label>
                <input
                  id="search-location"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Kadapa"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', height: '46px' }}
                  disabled={loading}
                  id="btn-find-blood"
                >
                  <Search size={18} />
                  <span>{loading ? 'Searching Database...' : 'Find Blood'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Main Results / Empty States Area */}
      <div className="results-container">
        {error && (
          <div className="alert alert-danger" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {hasSearched ? (
          <div>
            <div className="results-header-info">
              <h2>
                <ShieldCheck size={20} color="var(--primary)" />
                <span>
                  Search Results for <strong>{searchedGroup}</strong>
                  {searchedPincode && ` in Pincode "${searchedPincode}"`}
                  {searchedLocation && ` in "${searchedLocation}"`}
                </span>
              </h2>
              <div style={{ fontSize: '0.9rem', color: 'var(--navy-600)', fontWeight: 600 }}>
                {results.length} Registered {results.length === 1 ? 'Hospital' : 'Hospitals'} with Available Stock
              </div>
            </div>

            {results.length === 0 ? (
              <div className="empty-state-box" id="no-results-message">
                <div className="empty-state-icon">
                  <AlertCircle size={28} />
                </div>
                <h3>
                  {searchedPincode || searchedLocation
                    ? 'No hospitals with this blood group are currently available in this location.'
                    : 'No hospitals currently have this blood group available.'}
                </h3>
                <p>
                  No registered medical facilities currently have verified stock for blood group{' '}
                  <strong>{searchedGroup}</strong> matching your criteria. Try expanding your search radius or check back soon.
                </p>
              </div>
            ) : (
              <div className="results-list" id="hospital-search-results">
                {results.map(hospital => (
                  <div className="hospital-result-card" key={hospital.hospital_id} id={`result-hospital-${hospital.hospital_id}`}>
                    <div className="hospital-main-info">
                      <div className="hospital-reg-badge">
                        Reg: {hospital.registration_number}
                      </div>
                      <h3>{hospital.hospital_name}</h3>

                      <div className="hospital-meta-row">
                        <div className="hospital-meta-item">
                          <MapPin size={15} color="var(--primary)" />
                          <span>{hospital.address}, {hospital.location} - <strong>{hospital.pincode}</strong></span>
                        </div>
                        <div className="hospital-meta-item">
                          <Phone size={15} color="var(--navy-600)" />
                          <span>{hospital.contact_number}</span>
                        </div>
                      </div>

                      {/* Stock availability card callout */}
                      <div className="blood-match-callout">
                        <div className="match-stat">
                          <div className="match-blood-badge">{hospital.blood_group}</div>
                          <div>
                            <div className="match-units-text">
                              {hospital.units_available} Units Available
                            </div>
                            <div style={{ marginTop: '3px' }}>
                              {getStatusBadge(hospital.status)}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--navy-600)' }}>
                          <Clock size={14} />
                          <span>
                            Last Updated: {hospital.last_updated ? new Date(hospital.last_updated).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Hospital requirements if any */}
                      {hospital.required_blood_groups && hospital.required_blood_groups.length > 0 && (
                        <div className="required-badge-group">
                          <span className="req-label">Hospital Also Urgently Needs:</span>
                          {hospital.required_blood_groups.map(bg => (
                            <span key={bg} className="req-pill">{bg}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Column */}
                    <div className="hospital-action-box">
                      <button
                        className="btn btn-primary"
                        onClick={() => setContactModalHospital(hospital)}
                        id={`btn-contact-hospital-${hospital.hospital_id}`}
                      >
                        <PhoneCall size={16} />
                        <span>Contact Hospital</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state-box">
            <div className="empty-state-icon">
              <Search size={28} />
            </div>
            <h3>Search Real-Time Blood Availability</h3>
            <p>
              Select your required blood group above and optionally provide your pincode or city location to find registered hospitals with live stock in our central database.
            </p>
          </div>
        )}
      </div>

      {/* Contact Hospital Modal */}
      {contactModalHospital && (
        <div className="modal-overlay" onClick={() => setContactModalHospital(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} id="contact-hospital-modal">
            <div className="modal-header">
              <h3>Contact Hospital</h3>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setContactModalHospital(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem'
                }}>
                  <PhoneCall size={26} />
                </div>
                <h4 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                  {contactModalHospital.hospital_name}
                </h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--navy-600)' }}>
                  Registration No: <strong>{contactModalHospital.registration_number}</strong>
                </div>
              </div>

              <div style={{ background: 'var(--slate-50)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--navy-600)' }}>Verified Phone:</span>
                  <span style={{ fontWeight: 700, color: 'var(--navy-900)' }} id="modal-verified-phone">
                    {contactModalHospital.contact_number}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--navy-600)' }}>Available Blood:</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {contactModalHospital.blood_group} ({contactModalHospital.units_available} Units)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--navy-600)' }}>Address:</span>
                  <span style={{ textAlign: 'right', maxWidth: '240px', color: 'var(--navy-800)' }}>
                    {contactModalHospital.address}, {contactModalHospital.location} ({contactModalHospital.pincode})
                  </span>
                </div>
              </div>

              <a
                href={`tel:${contactModalHospital.contact_number}`}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', textDecoration: 'none' }}
                id="btn-call-direct"
              >
                <PhoneCall size={18} />
                <span>Call {contactModalHospital.contact_number}</span>
              </a>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setContactModalHospital(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

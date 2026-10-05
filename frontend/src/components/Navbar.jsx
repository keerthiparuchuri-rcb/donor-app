import React from 'react';
import { Droplet, Hospital, Search, LogOut, Building2 } from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, hospital, onLogout }) {
  return (
    <header className="main-header">
      <div className="header-inner">
        <button
          className="brand-logo"
          onClick={() => setCurrentView('landing')}
          aria-label="MediGuide BloodConnect Home"
        >
          <div className="brand-icon-box">
            <Droplet size={24} fill="currentColor" />
          </div>
          <div>
            <div className="brand-title">
              MediGuide <span>BloodConnect</span>
            </div>
            <div className="brand-tagline">Verified Hospital Blood Availability</div>
          </div>
        </button>

        <nav className="nav-links">
          <button
            className={`btn btn-sm ${currentView === 'user-portal' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrentView('user-portal')}
            id="nav-user-portal"
          >
            <Search size={16} />
            <span>Find Blood</span>
          </button>

          {hospital ? (
            <>
              <button
                className={`btn btn-sm ${currentView === 'hospital-dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCurrentView('hospital-dashboard')}
                id="nav-hospital-dash"
              >
                <Building2 size={16} />
                <span>{hospital.hospital_name || 'Dashboard'}</span>
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={onLogout}
                title="Log out of hospital account"
                id="nav-logout-btn"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <button
              className={`btn btn-sm ${currentView === 'hospital-auth' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCurrentView('hospital-auth')}
              id="nav-hospital-portal"
            >
              <Hospital size={16} />
              <span>Hospital Portal</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

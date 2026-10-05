import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import HospitalAuth from './components/HospitalAuth';
import HospitalDashboard from './components/HospitalDashboard';
import UserPortal from './components/UserPortal';
import Footer from './components/Footer';
import { getStoredHospital, setStoredHospital, clearAuth, api } from './api';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [hospital, setHospital] = useState(null);

  // Check existing session on load
  useEffect(() => {
    const stored = getStoredHospital();
    if (stored) {
      setHospital(stored);
      // Verify token with backend
      api.getHospitalProfile()
        .then(res => {
          if (res.success && res.hospital) {
            setHospital(res.hospital);
            setStoredHospital(res.hospital);
          }
        })
        .catch(() => {
          // Token expired or invalid
          clearAuth();
          setHospital(null);
        });
    }
  }, []);

  const handleAuthSuccess = (hospitalData) => {
    setHospital(hospitalData);
    setCurrentView('hospital-dashboard');
  };

  const handleLogout = () => {
    clearAuth();
    setHospital(null);
    setCurrentView('landing');
  };

  const handleUpdateHospital = (updatedData) => {
    setHospital(updatedData);
  };

  return (
    <div className="app-container">
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        hospital={hospital}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1 }}>
        {currentView === 'landing' && (
          <LandingPage
            onSelectPortal={(view) => {
              if (view === 'hospital-auth' && hospital) {
                setCurrentView('hospital-dashboard');
              } else {
                setCurrentView(view);
              }
            }}
          />
        )}

        {currentView === 'hospital-auth' && (
          hospital ? (
            <HospitalDashboard
              hospital={hospital}
              onUpdateHospital={handleUpdateHospital}
            />
          ) : (
            <HospitalAuth onAuthSuccess={handleAuthSuccess} />
          )
        )}

        {currentView === 'hospital-dashboard' && (
          hospital ? (
            <HospitalDashboard
              hospital={hospital}
              onUpdateHospital={handleUpdateHospital}
            />
          ) : (
            <HospitalAuth onAuthSuccess={handleAuthSuccess} />
          )
        )}

        {currentView === 'user-portal' && (
          <UserPortal />
        )}
      </main>

      <Footer />
    </div>
  );
}

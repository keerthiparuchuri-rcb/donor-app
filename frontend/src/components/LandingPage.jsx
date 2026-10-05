import React from 'react';
import { Hospital, Search, ShieldCheck, Database, ArrowRight, HeartPulse } from 'lucide-react';

export default function LandingPage({ onSelectPortal }) {
  return (
    <div className="landing-container">
      <section className="hero-section">
        <div className="hero-badge">
          <ShieldCheck size={16} />
          <span>Real-Time Hospital Blood Availability</span>
        </div>

        <h1 className="hero-title">
          MediGuide <span>BloodConnect</span>
        </h1>

        <p className="hero-subtitle">
          Find the blood you need from registered hospitals.
        </p>

        <div className="hero-cta-cards">
          {/* Hospital Portal Card */}
          <div className="portal-card hospital-card-hero">
            <div className="portal-icon-wrapper hospital">
              <Hospital size={28} />
            </div>
            <h3>Hospital Portal</h3>
            <p>
              For authorized hospitals and licensed blood banks to register, manage verified blood inventory, and broadcast urgent blood requirements.
            </p>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => onSelectPortal('hospital-auth')}
              id="hero-hospital-portal-btn"
            >
              <span>Hospital Portal</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* User Portal Card */}
          <div className="portal-card user-card-hero">
            <div className="portal-icon-wrapper user">
              <Search size={28} />
            </div>
            <h3>User Portal</h3>
            <p>
              For patients and families needing blood. Search real-time stock across registered hospitals by blood group, pincode, or city location.
            </p>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => onSelectPortal('user-portal')}
              id="hero-user-portal-btn"
            >
              <span>User Portal</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Informational Architecture Card (Strictly No Fake Stats) */}
        <div className="architecture-info-box">
          <div className="info-icon">
            <Database size={24} />
          </div>
          <div>
            <h4>Single Central Verified Database</h4>
            <p>
              MediGuide BloodConnect connects registered hospitals with seekers through a unified central registry. All blood availability numbers and hospital contact details are maintained directly by verified healthcare institutions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

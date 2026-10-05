import React from 'react';
import { Droplet } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
        <Droplet size={16} color="var(--primary)" fill="var(--primary)" />
        <strong style={{ color: 'var(--navy-900)' }}>MediGuide BloodConnect</strong>
      </div>
      <div>Find the blood you need from registered hospitals.</div>
      <div style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: 'var(--slate-400)' }}>
        Central Database • Zero Demo Data • Real Hospital Connectivity
      </div>
    </footer>
  );
}

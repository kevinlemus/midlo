import React from 'react';
import '../styles/theme.css';
import midloLogo from '../assets/midlo_logo.png';

export default function Results() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          border: '1px solid var(--color-accent)',
          boxShadow: 'var(--shadow-card)',
          textAlign: 'center',
        }}
      >
        <img
          src={midloLogo}
          alt="Midlo"
          style={{ width: 120, height: 'auto', marginBottom: 12, objectFit: 'contain' }}
        />
        <h1
          style={{
            fontSize: 'var(--font-size-heading)',
            color: 'var(--color-primary-dark)',
            margin: 0,
            marginBottom: 8,
          }}
        >
          Results
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-body)',
            color: 'var(--color-text-secondary)',
            margin: 0,
          }}
        >
          This page will soon show shared midpoints and deep links.
        </p>
      </div>
    </div>
  );
}

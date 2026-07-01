'use client';
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Gauge — the signature Norevify dial. An arc sweeps from ~7 o'clock through
 * the value; the last stretch can render in the redline colour to flag an
 * over-budget reading. Value sits in the hub. Pure CSS conic-gradient ring.
 */
export function Gauge({ label, value, percent = 60, redlineAt = 100, size = 92, style }) {
  const sweep = 270; // degrees of usable arc (gap at the bottom)
  const p = Math.max(0, Math.min(100, percent));
  const rl = Math.max(0, Math.min(100, redlineAt));
  const valDeg = (p / 100) * sweep;
  const rlDeg = (rl / 100) * sweep;
  const amberEnd = Math.min(valDeg, rlDeg);
  const hub = size - 28;

  const ring = `conic-gradient(from 135deg,
    var(--primary) 0deg ${amberEnd}deg,
    var(--redline) ${amberEnd}deg ${valDeg}deg,
    var(--surface-3) ${valDeg}deg ${sweep}deg,
    transparent ${sweep}deg 360deg)`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.6rem',
        ...style,
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <div
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: ring,
            WebkitMask: `radial-gradient(circle at center, transparent ${hub / 2 - 1}px, #000 ${hub / 2}px)`,
            mask: `radial-gradient(circle at center, transparent ${hub / 2 - 1}px, #000 ${hub / 2}px)`,
          }}
        />
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            fontSize: size > 80 ? '0.95rem' : '0.8rem',
            color: 'var(--text)',
          }}
        >
          {value}
        </span>
      </div>
      {label && (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.72rem',
            fontWeight: 600,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            textAlign: 'center',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

Gauge.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  percent: PropTypes.number,
  redlineAt: PropTypes.number,
  size: PropTypes.number,
  style: PropTypes.object,
};

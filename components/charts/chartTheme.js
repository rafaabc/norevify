'use client';
// SVG presentation attributes (fill, stroke) do not resolve CSS custom properties,
// so recharts axis/grid styles use raw hex values mirroring the globals.css tokens.
export const CATEGORY_COLORS = {
  Fuel: '#ff7a1a', // ignition amber (matches --cat-fuel)
  Maintenance: '#ffb020', // warm amber-gold (matches --cat-maintenance)
  Insurance: '#5fa8ff', // blue (matches --cat-insurance)
  Parking: '#46d17f', // green (matches --cat-parking)
  Toll: '#c08cff', // violet (matches --cat-toll)
  Tax: '#ff3b30', // redline (matches --cat-tax)
  Other: '#7d828c', // muted (matches --cat-other)
};

export const AXIS_STYLE = {
  tick: { fill: '#7d828c', fontSize: 12, fontFamily: 'Barlow, system-ui, sans-serif' },
  axisLine: { stroke: '#26292f' },
  tickLine: { stroke: '#26292f' },
};

export const GRID_STYLE = {
  stroke: '#26292f',
  strokeDasharray: '3 3',
};

export const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#16181c',
    border: '1px solid #26292f',
    borderRadius: '12px',
    color: '#e9eaec',
    fontSize: 13,
    fontFamily: 'Barlow, system-ui, sans-serif',
  },
  labelStyle: { color: '#aab0b8' },
  cursor: { fill: 'rgba(255,122,26,0.06)' },
};

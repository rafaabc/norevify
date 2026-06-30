'use client';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { CATEGORY_COLORS, AXIS_STYLE, GRID_STYLE, TOOLTIP_STYLE } from './chartTheme.js';
import { monthLabel } from '@/utils/aggregations.js';
import { categoryLabel } from '@/utils/categories.js';

export default function StackedMonthlyBar({ data = [], categories = [] }) {
  const { t } = useTranslation();
  if (!data.length)
    return (
      <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>No data</div>
    );

  const formatted = data.map((d) => ({ ...d, label: monthLabel(d.month) }));

  const peakIdx = formatted.reduce((pi, d, i) => {
    const total = Object.entries(d)
      .filter(([k]) => k !== 'month' && k !== 'name' && k !== 'label')
      .reduce((s, [, v]) => s + (typeof v === 'number' ? v : 0), 0);
    const peakTotal = Object.entries(formatted[pi])
      .filter(([k]) => k !== 'month' && k !== 'name' && k !== 'label')
      .reduce((s, [, v]) => s + (typeof v === 'number' ? v : 0), 0);
    return total > peakTotal ? i : pi;
  }, 0);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={formatted} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid {...GRID_STYLE} />
        <XAxis
          dataKey="label"
          tick={AXIS_STYLE.tick}
          axisLine={AXIS_STYLE.axisLine}
          tickLine={AXIS_STYLE.tickLine}
        />
        <YAxis
          tick={AXIS_STYLE.tick}
          axisLine={AXIS_STYLE.axisLine}
          tickLine={AXIS_STYLE.tickLine}
          width={60}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE.contentStyle}
          labelStyle={TOOLTIP_STYLE.labelStyle}
          cursor={TOOLTIP_STYLE.cursor}
        />
        <Legend
          wrapperStyle={{
            fontSize: 12,
            fontFamily: 'Barlow, system-ui, sans-serif',
            color: '#aab0b8',
          }}
        />
        {categories.map((cat) => (
          <Bar
            key={cat}
            dataKey={cat}
            name={categoryLabel(cat, t)}
            stackId="a"
            fill={CATEGORY_COLORS[cat] ?? '#7d828c'}
          >
            {formatted.map((d, idx) => (
              <Cell
                key={d.month}
                fill={idx === peakIdx ? '#ff3b30' : (CATEGORY_COLORS[cat] ?? '#7d828c')}
              />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

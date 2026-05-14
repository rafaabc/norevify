import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, Plus, BarChart3, KeyRound } from 'lucide-react';
import styles from './BottomTabs.module.css';

const TABS = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/expenses',    icon: Receipt,         label: 'Expenses' },
  { to: '/summary',     icon: BarChart3,       label: 'Summary' },
  { to: '/change-password', icon: KeyRound,    label: 'Settings' },
];

export default function BottomTabs() {
  const navigate = useNavigate();

  return (
    <nav className={styles.tabbar} aria-label="Main navigation">
      {TABS.slice(0, 2).map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => isActive ? `${styles.tab} ${styles.active}` : styles.tab}
        >
          <Icon size={22} className={styles.icon} />
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}

      <button
        className={`${styles.tab} ${styles.newBtn}`}
        onClick={() => navigate('/expenses/new')}
        type="button"
        aria-label="New expense"
      >
        <Plus size={24} className={styles.icon} />
        <span className={styles.label}>New</span>
      </button>

      {TABS.slice(2).map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => isActive ? `${styles.tab} ${styles.active}` : styles.tab}
        >
          <Icon size={22} className={styles.icon} />
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

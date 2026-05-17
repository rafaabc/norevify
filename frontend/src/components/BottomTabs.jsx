import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, Plus, BarChart3, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './BottomTabs.module.css';

export default function BottomTabs() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const TABS = [
    { to: '/',         icon: LayoutDashboard, label: t('nav.dashboard'), end: true },
    { to: '/expenses', icon: Receipt,         label: t('nav.expenses') },
    { to: '/summary',  icon: BarChart3,       label: t('nav.summary') },
    { to: '/settings', icon: Settings,        label: t('nav.settings') },
  ];

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
        aria-label={t('common.new')}
      >
        <Plus size={24} className={styles.icon} />
        <span className={styles.label}>{t('common.new')}</span>
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

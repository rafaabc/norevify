import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, BarChart3, LogOut, Gauge, KeyRound, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { username, logout } = useAuth();
  const { t } = useTranslation();

  const NAV_ITEMS = [
    { to: '/', icon: LayoutDashboard, label: t('nav.dashboard'), end: true },
    { to: '/expenses', icon: Receipt, label: t('nav.expenses') },
    { to: '/summary', icon: BarChart3, label: t('nav.summary') },
    { to: '/change-password', icon: KeyRound, label: t('nav.changePassword') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <Gauge size={22} className={styles.brandIcon} />
        <span className={styles.brandName}>
          DRIVE<span>LEDGER</span>
        </span>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
            }
          >
            <Icon size={16} className={styles.navIcon} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <span className={styles.username}>{username ?? '—'}</span>
        <button
          className={styles.logoutBtn}
          onClick={logout}
          aria-label={t('nav.logout')}
          type="button"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

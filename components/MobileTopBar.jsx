'use client';
import { LogOut, Gauge, Bell } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext.jsx';
import styles from './MobileTopBar.module.css';

export default function MobileTopBar({ badgeCount = 0 }) {
  const { logout } = useAuth();
  const { t } = useTranslation();
  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <Gauge size={18} className={styles.brandIcon} />
        <span className={styles.brandName}>NORE<span>VIFY</span></span>
      </div>
      <div className={styles.actions}>
        <Link href="/reminders" className={styles.bellBtn} aria-label={t('nav.reminders')}>
          <Bell size={18} />
          {badgeCount > 0 && <span className={styles.badge}>{badgeCount}</span>}
        </Link>
        <button className={styles.logoutBtn} onClick={logout} aria-label={t('nav.logout')} type="button">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

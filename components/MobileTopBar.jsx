'use client';
import { LogOut, Gauge } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext.jsx';
import styles from './MobileTopBar.module.css';

export default function MobileTopBar() {
  const { logout } = useAuth();
  const { t } = useTranslation();
  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <Gauge size={18} className={styles.brandIcon} />
        <span className={styles.brandName}>DRIVE<span>LEDGER</span></span>
      </div>
      <button className={styles.logoutBtn} onClick={logout} aria-label={t('nav.logout')} type="button">
        <LogOut size={18} />
      </button>
    </header>
  );
}

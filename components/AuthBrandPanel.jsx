'use client';
import { Gauge } from 'lucide-react';
import styles from '@/views/LoginPage.module.css';

export default function AuthBrandPanel() {
  return (
    <aside className={styles.brand}>
      <div className={styles.brandContent}>
        <Gauge size={64} strokeWidth={1.5} className={styles.brandIcon} />
        <span className={styles.wordmark}>NOREVIFY</span>
        <p className={styles.tagline}>Track every kilometer.</p>
      </div>
    </aside>
  );
}

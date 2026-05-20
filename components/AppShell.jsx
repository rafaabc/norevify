'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar.jsx';
import MobileTopBar from './MobileTopBar.jsx';
import BottomTabs from './BottomTabs.jsx';
import styles from './AppShell.module.css';
import { useAuth } from '@/context/AuthContext.jsx';
import { remindersApi } from '@/services/apiService.js';

function useReminderBadge(isAuthed) {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAuthed) {
      setCount(0);
      return;
    }
    let cancelled = false;

    async function fetchCount() {
      try {
        const { dueSoon, overdue } = await remindersApi.badgeCount();
        if (!cancelled) setCount((dueSoon || 0) + (overdue || 0));
      } catch {
        // silently ignore — badge is best-effort
      }
    }

    fetchCount();

    function onChanged() { fetchCount(); }
    window.addEventListener('reminders:changed', onChanged);
    window.addEventListener('focus', onChanged);

    return () => {
      cancelled = true;
      window.removeEventListener('reminders:changed', onChanged);
      window.removeEventListener('focus', onChanged);
    };
  }, [isAuthed, pathname]);

  return count;
}

export default function AppShell({ children }) {
  const { isAuthed } = useAuth();
  const badgeCount = useReminderBadge(isAuthed);

  return (
    <div className={styles.shell}>
      <Sidebar badgeCount={badgeCount} />
      <MobileTopBar badgeCount={badgeCount} />
      <main className={styles.main}>
        {children}
      </main>
      <BottomTabs />
    </div>
  );
}

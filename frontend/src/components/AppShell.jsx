import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import MobileTopBar from './MobileTopBar.jsx';
import BottomTabs from './BottomTabs.jsx';
import styles from './AppShell.module.css';

export default function AppShell() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <MobileTopBar />
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomTabs />
    </div>
  );
}

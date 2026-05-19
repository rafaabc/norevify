import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import AppShell from './components/AppShell.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ExpensesListPage from './pages/ExpensesListPage.jsx';
import ExpenseFormPage from './pages/ExpenseFormPage.jsx';
import SummaryPage from './pages/SummaryPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import UpdatePrompt from './components/UpdatePrompt.jsx';
import ChangePasswordPage from './pages/ChangePasswordPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import ReminderFormPage from './pages/ReminderFormPage.jsx';
import RemindersListPage from './pages/RemindersListPage.jsx';

export default function App() {
  const { i18n } = useTranslation();
  const [updateSW, setUpdateSW] = useState(null);

  useEffect(() => {
    const lang = i18n.language === 'en' ? 'en-US' : i18n.language;
    document.documentElement.lang = lang;
  }, [i18n.language]);

  useEffect(() => {
    const handler = (e) => setUpdateSW(() => e.detail.updateSW);
    window.addEventListener('pwa:update-available', handler);
    return () => window.removeEventListener('pwa:update-available', handler);
  }, []);

  return (
    <AuthProvider>
      {updateSW && <UpdatePrompt onUpdate={() => updateSW(true)} />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/expenses" element={<ExpensesListPage />} />
          <Route path="/expenses/new" element={<ExpenseFormPage />} />
          <Route path="/expenses/:id/edit" element={<ExpenseFormPage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/reminders" element={<RemindersListPage />} />
          <Route path="/reminders/new" element={<ReminderFormPage />} />
          <Route path="/reminders/:id/edit" element={<ReminderFormPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

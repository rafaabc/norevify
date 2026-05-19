'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext.jsx';
import AppShell from '@/components/AppShell.jsx';

export default function AppLayout({ children }) {
  const { isAuthed } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthed) router.replace('/login');
  }, [isAuthed, router]);

  if (!isAuthed) return null;

  return <AppShell>{children}</AppShell>;
}

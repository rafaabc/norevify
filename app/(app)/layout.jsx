'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext.jsx';
import AppShell from '@/components/AppShell.jsx';

export default function AppLayout({ children }) {
  const { isAuthed, authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthed) router.replace('/login');
  }, [isAuthed, authLoading, router]);

  if (authLoading || !isAuthed) return null;

  return <AppShell>{children}</AppShell>;
}

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext.jsx';
import Loading from '@/components/Loading.jsx';

export default function RootPage() {
  const { isAuthed, authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (isAuthed) router.replace('/dashboard');
    else router.replace('/login');
  }, [isAuthed, authLoading, router]);

  return <Loading />;
}

import { Suspense } from 'react';
import LoginPage from '@/views/LoginPage.jsx';

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}

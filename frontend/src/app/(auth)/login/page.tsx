'use client';

import React, { Suspense } from 'react';
import LoginForm from '@/features/auth/components/LoginForm';

const LoginPage: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage;

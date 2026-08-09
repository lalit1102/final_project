'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { Suspense } from 'react';
import LoginForm from '@/features/auth/components/LoginForm';
const LoginPage = () => {
    return (_jsx(Suspense, { fallback: null, children: _jsx(LoginForm, {}) }));
};
export default LoginPage;

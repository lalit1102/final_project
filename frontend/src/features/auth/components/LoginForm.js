'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { Button, Form, Input } from 'antd';
import { isAxiosError } from 'axios';
import { loginSchema } from '@/features/auth/schemas/auth.schemas';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useNotification } from '@/hooks/useNotification';
import { getAuthErrorMessage } from '@/services/api/auth';
import { STATUS_CODES } from '@/constants/statusCodes';
import styles from './LoginForm.module.css';
const LoginForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const notification = useNotification();
    const { control, handleSubmit, setError, formState: { errors, isSubmitting }, } = useForm({
        mode: 'onSubmit',
    });
    const onSubmit = async (data) => {
        const parseResult = loginSchema.safeParse(data);
        if (!parseResult.success) {
            const zodErrors = parseResult.error.format();
            if (zodErrors.email?.message) {
                setError('email', { type: 'manual', message: zodErrors.email.message });
            }
            if (zodErrors.password?.message) {
                setError('password', { type: 'manual', message: zodErrors.password.message });
            }
            return;
        }
        try {
            await login(parseResult.data);
            const callback = searchParams.get('callback');
            const target = callback || '/dashboard';
            router.replace(target);
            notification.success('Login successful.');
        }
        catch (error) {
            let userMessage = 'Login failed. Please try again.';
            if (isAxiosError(error)) {
                const status = error.response?.status ?? 0;
                if (status === STATUS_CODES.BAD_REQUEST) {
                    userMessage = 'Please check your credentials and try again.';
                }
                else if (status === STATUS_CODES.UNAUTHORIZED) {
                    userMessage = 'Invalid email or password.';
                }
                else if (status === STATUS_CODES.FORBIDDEN) {
                    userMessage = 'Account is temporarily locked. Try again later.';
                }
                else if (status === STATUS_CODES.TOO_MANY_REQUESTS) {
                    userMessage = 'Too many attempts. Please try again later.';
                }
                else {
                    const extracted = getAuthErrorMessage(error);
                    userMessage = extracted || 'Login failed. Please try again.';
                }
            }
            notification.error(userMessage);
        }
    };
    return (_jsxs("div", { className: styles.loginFormContainer, children: [_jsxs("div", { className: styles.loginFormHeader, children: [_jsx("h2", { className: styles.loginFormTitle, children: "Welcome to LearnSphere" }), _jsx("p", { className: styles.loginFormSubtitle, children: "Sign in to continue" })] }), _jsxs(Form, { layout: "vertical", children: [_jsx(Form.Item, { label: "Email", validateStatus: errors.email ? 'error' : undefined, help: errors.email?.message, children: _jsx(Controller, { name: "email", control: control, render: ({ field }) => (_jsx(Input, { type: "email", placeholder: "you@example.com", autoComplete: "email", inputMode: "email", ...field })) }) }), _jsx(Form.Item, { label: "Password", validateStatus: errors.password ? 'error' : undefined, help: errors.password?.message, children: _jsx(Controller, { name: "password", control: control, render: ({ field }) => (_jsx(Input.Password, { type: "password", placeholder: "Enter your password", autoComplete: "current-password", ...field })) }) }), _jsx(Form.Item, { children: _jsx(Button, { type: "primary", htmlType: "submit", loading: isSubmitting, block: true, size: "large", onClick: handleSubmit(onSubmit), children: "Sign In" }) })] })] }));
};
div >
;
;
;
export default LoginForm;

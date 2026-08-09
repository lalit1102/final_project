'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Card, Form, Input, Space } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { changePasswordSchema, } from '@/features/auth/schemas/auth.schemas';
import { getAuthErrorMessage } from '@/services/api/auth';
import styles from './ChangePasswordForm.module.css';
const changePasswordValidationSchema = changePasswordSchema.extend({
    confirmPassword: z
        .string()
        .min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
const ChangePasswordForm = ({ onSubmit, isLoading, }) => {
    const { control, handleSubmit, setError, formState: { errors } } = useForm({
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
        mode: 'onSubmit',
    });
    const handleFormSubmit = async (data) => {
        const parseResult = changePasswordValidationSchema.safeParse(data);
        if (!parseResult.success) {
            const zodErrors = parseResult.error.format();
            if (zodErrors.currentPassword?.message) {
                setError('currentPassword', { type: 'manual', message: zodErrors.currentPassword.message });
            }
            if (zodErrors.newPassword?.message) {
                setError('newPassword', { type: 'manual', message: zodErrors.newPassword.message });
            }
            if (zodErrors.confirmPassword?.message) {
                setError('confirmPassword', { type: 'manual', message: zodErrors.confirmPassword.message });
            }
            return;
        }
        const backendPayload = {
            currentPassword: parseResult.data.currentPassword,
            newPassword: parseResult.data.newPassword,
        };
        try {
            await onSubmit(backendPayload);
        }
        catch (error) {
            const message = getAuthErrorMessage(error);
            if (message) {
                setError('currentPassword', { type: 'manual', message });
            }
        }
    };
    return (_jsx(Card, { title: "Change Password", className: styles.formCard, children: _jsxs(Form, { layout: "vertical", children: [_jsx(Form.Item, { label: "Current Password", validateStatus: errors.currentPassword ? 'error' : undefined, help: errors.currentPassword?.message, children: _jsx(Controller, { name: "currentPassword", control: control, render: ({ field }) => (_jsx(Input.Password, { placeholder: "Enter current password", autoComplete: "current-password", ...field })) }) }), _jsx(Form.Item, { label: "New Password", validateStatus: errors.newPassword ? 'error' : undefined, help: errors.newPassword?.message, children: _jsx(Controller, { name: "newPassword", control: control, render: ({ field }) => (_jsx(Input.Password, { placeholder: "Enter new password", autoComplete: "new-password", ...field })) }) }), _jsx(Form.Item, { label: "Confirm New Password", validateStatus: errors.confirmPassword ? 'error' : undefined, help: errors.confirmPassword?.message, children: _jsx(Controller, { name: "confirmPassword", control: control, render: ({ field }) => (_jsx(Input.Password, { placeholder: "Confirm new password", autoComplete: "new-password", ...field })) }) }), _jsx(Form.Item, { children: _jsx(Space, { direction: "horizontal", size: "middle", children: _jsx(Button, { type: "primary", icon: _jsx(SaveOutlined, {}), loading: isLoading, onClick: handleSubmit(handleFormSubmit), children: "Save" }) }) })] }) }));
};
export default ChangePasswordForm;

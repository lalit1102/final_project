'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Card, Form, Grid, Input, Space } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { updateProfileSchema, } from '@/features/auth/schemas/auth.schemas';
import { getAuthErrorMessage } from '@/services/api/auth';
import styles from './ProfileForm.module.css';
const ProfileForm = ({ initialName = '', initialAvatar = '', onSubmit, isLoading, onCancel, }) => {
    const { control, handleSubmit, setError, formState: { errors } } = useForm({
        defaultValues: {
            name: initialName,
            avatar: initialAvatar ?? undefined,
        },
        mode: 'onSubmit',
    });
    const { md } = Grid.useBreakpoint();
    const isMobile = !md;
    const handleFormSubmit = async (data) => {
        const parseResult = updateProfileSchema.safeParse(data);
        if (!parseResult.success) {
            const zodErrors = parseResult.error.format();
            if (zodErrors.name?.message) {
                setError('name', { type: 'manual', message: zodErrors.name.message });
            }
            if (zodErrors.avatar?.message) {
                setError('avatar', { type: 'manual', message: zodErrors.avatar.message });
            }
            return;
        }
        try {
            await onSubmit({
                name: parseResult.data.name ?? '',
                avatar: parseResult.data.avatar ?? '',
            });
        }
        catch (error) {
            const message = getAuthErrorMessage(error);
            if (message) {
                setError('name', { type: 'manual', message });
            }
        }
    };
    return (_jsx(Card, { title: "Edit Profile", className: styles.formCard, children: _jsxs(Form, { layout: "vertical", children: [_jsx(Form.Item, { label: "Name", validateStatus: errors.name ? 'error' : undefined, help: errors.name?.message, children: _jsx(Controller, { name: "name", control: control, render: ({ field }) => (_jsx(Input, { placeholder: "Enter your name", autoComplete: "name", ...field })) }) }), _jsx(Form.Item, { label: "Avatar URL", validateStatus: errors.avatar ? 'error' : undefined, help: errors.avatar?.message, children: _jsx(Controller, { name: "avatar", control: control, render: ({ field }) => (_jsx(Input, { placeholder: "https://example.com/avatar.png", autoComplete: "off", ...field })) }) }), _jsx(Form.Item, { children: _jsxs(Space, { direction: isMobile ? 'vertical' : 'horizontal', style: { width: isMobile ? '100%' : 'auto' }, size: "middle", children: [onCancel && (_jsx(Button, { icon: _jsx(CloseOutlined, {}), onClick: onCancel, disabled: isLoading, children: "Cancel" })), _jsx(Button, { type: "primary", icon: _jsx(SaveOutlined, {}), loading: isLoading, onClick: handleSubmit(handleFormSubmit), children: "Save" })] }) })] }) }));
};
export default ProfileForm;

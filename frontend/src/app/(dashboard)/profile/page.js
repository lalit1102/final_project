'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, Typography } from 'antd';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { ProfileView } from '@/features/profile';
import PageContainer from '@/components/common/PageContainer';
const ProfilePage = () => {
    const { user, isAuthenticated } = useAuth();
    if (!isAuthenticated) {
        return null;
    }
    return (_jsx(PageContainer, { children: _jsxs(Card, { children: [_jsx(Typography.Title, { level: 2, children: "Profile" }), _jsx(ProfileView, { user: user })] }) }));
};
export default ProfilePage;

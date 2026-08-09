'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Avatar, Button, Card, Grid, Space, Tag, Typography } from 'antd';
import { EditOutlined, LockOutlined, UserOutlined, } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import styles from './ProfileView.module.css';
const roleLabels = {
    ADMIN: 'Administrator',
    TEACHER: 'Teacher',
    STUDENT: 'Student',
    PARENT: 'Parent',
};
const ProfileView = ({ user }) => {
    const router = useRouter();
    const { md } = Grid.useBreakpoint();
    const handleEdit = () => {
        router.push('/dashboard/profile/edit');
    };
    const handleChangePassword = () => {
        router.push('/dashboard/profile/change-password');
    };
    if (!user) {
        return (_jsx(Card, { children: _jsx(Typography.Text, { type: "secondary", children: "No user data available" }) }));
    }
    const avatarSrc = user.avatar ?? undefined;
    const roleLabel = roleLabels[user.role] ?? user.role;
    const isMobile = !md;
    return (_jsx(Card, { className: styles.profileCard, children: _jsxs("div", { className: styles.profileContent, children: [_jsxs("div", { className: styles.profileHeader, children: [_jsx(Avatar, { src: avatarSrc, icon: !avatarSrc && _jsx(UserOutlined, {}), alt: user.name, size: isMobile ? 64 : 80 }), _jsxs("div", { className: styles.profileName, children: [_jsx(Typography.Title, { level: isMobile ? 4 : 3, className: styles.title, children: user.name }), _jsx(Tag, { color: "blue", className: styles.roleTag, children: roleLabel })] })] }), _jsx(Typography.Text, { type: "secondary", className: styles.email, children: user.email }), _jsxs(Space, { direction: "vertical", className: styles.actions, size: "middle", children: [_jsx(Button, { type: "primary", icon: _jsx(EditOutlined, {}), onClick: handleEdit, "aria-label": "Edit profile", children: "Edit Profile" }), _jsx(Button, { icon: _jsx(LockOutlined, {}), onClick: handleChangePassword, "aria-label": "Change password", children: "Change Password" })] })] }) }));
};
export default ProfileView;

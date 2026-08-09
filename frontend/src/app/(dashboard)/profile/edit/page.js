'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { useNotification } from '@/hooks/useNotification';
import { useUpdateProfile } from '@/hooks/auth/useUpdateProfile';
import { ProfileForm } from '@/features/profile';
import PageContainer from '@/components/common/PageContainer';
const ProfileEditPage = () => {
    const router = useRouter();
    const { user, isAuthenticated, refreshUser } = useAuth();
    const updateProfile = useUpdateProfile();
    const notification = useNotification();
    const handleUpdate = async (data) => {
        await updateProfile.execute({
            name: data.name,
            avatar: data.avatar || undefined,
        });
        if (updateProfile.isSuccess) {
            await refreshUser();
            notification.success('Profile updated successfully.');
            router.push('/dashboard/profile');
        }
    };
    const handleCancel = () => {
        router.push('/dashboard/profile');
    };
    if (!isAuthenticated) {
        return null;
    }
    return (_jsx(PageContainer, { children: _jsx(ProfileForm, { initialName: user?.name ?? '', initialAvatar: user?.avatar ?? null, onSubmit: handleUpdate, isLoading: updateProfile.isLoading, onCancel: handleCancel }) }));
};
export default ProfileEditPage;

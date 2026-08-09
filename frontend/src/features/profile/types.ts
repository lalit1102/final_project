import type { User } from '@/types/user';

export interface ProfileViewProps {
  user: User | null;
}

export interface ProfileFormProps {
  initialName?: string;
  initialAvatar?: string | null;
  onSubmit: (data: ProfileFormValues) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export interface ProfileFormValues {
  name: string;
  avatar: string;
}

export interface ChangePasswordFormProps {
  onSubmit: (data: ChangePasswordBackendPayload) => Promise<void>;
  isLoading?: boolean;
}

export interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordBackendPayload {
  currentPassword: string;
  newPassword: string;
}

'use client';

import React from 'react';
import { Button, Card, Form, Grid, Input, Space } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from '@/features/auth/schemas/auth.schemas';
import type { ProfileFormProps } from '../types';
import { getAuthErrorMessage } from '@/services/api/auth';
import type { AxiosError } from 'axios';
import styles from './ProfileForm.module.css';

const ProfileForm: React.FC<ProfileFormProps> = ({
  initialName = '',
  initialAvatar = '',
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const { control, handleSubmit, setError, formState: { errors } } = useForm<UpdateProfileFormData>({
    defaultValues: {
      name: initialName,
      avatar: initialAvatar ?? undefined,
    },
    mode: 'onSubmit',
  });

  const { md } = Grid.useBreakpoint();
  const isMobile = !md;

  const handleFormSubmit = async (data: UpdateProfileFormData) => {
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
    } catch (error: unknown) {
      const message = getAuthErrorMessage(error as AxiosError);
      if (message) {
        setError('name', { type: 'manual', message });
      }
    }
  };

  return (
    <Card title="Edit Profile" className={styles.formCard}>
      <Form layout="vertical">
        <Form.Item
          label="Name"
          validateStatus={errors.name ? 'error' : undefined}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="Enter your name"
                autoComplete="name"
                {...field}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Avatar URL"
          validateStatus={errors.avatar ? 'error' : undefined}
          help={errors.avatar?.message}
        >
          <Controller
            name="avatar"
            control={control}
            render={({ field }) => (
              <Input
                placeholder="https://example.com/avatar.png"
                autoComplete="off"
                {...field}
              />
            )}
          />
        </Form.Item>

        <Form.Item>
          <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ width: isMobile ? '100%' : 'auto' }} size="middle">
            {onCancel && (
              <Button
                icon={<CloseOutlined />}
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={isLoading}
              onClick={handleSubmit(handleFormSubmit)}
            >
              Save
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ProfileForm;

'use client';

import React from 'react';
import { Button, Card, Form, Input, Space } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import {
  changePasswordSchema,
} from '@/features/auth/schemas/auth.schemas';
import { getAuthErrorMessage } from '@/services/api/auth';
import type { AxiosError } from 'axios';
import type { ChangePasswordFormProps, ChangePasswordFormValues } from '../types';
import styles from './ChangePasswordForm.module.css';

const changePasswordValidationSchema = changePasswordSchema.extend({
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

interface BackendPayload {
  currentPassword: string;
  newPassword: string;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const { control, handleSubmit, setError, formState: { errors } } = useForm<ChangePasswordFormValues>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onSubmit',
  });

  const handleFormSubmit = async (data: ChangePasswordFormValues) => {
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

    const backendPayload: BackendPayload = {
      currentPassword: parseResult.data.currentPassword,
      newPassword: parseResult.data.newPassword,
    };

    try {
      await onSubmit(backendPayload);
    } catch (error: unknown) {
      const message = getAuthErrorMessage(error as AxiosError);
      if (message) {
        setError('currentPassword', { type: 'manual', message });
      }
    }
  };

  return (
    <Card title="Change Password" className={styles.formCard}>
      <Form layout="vertical">
        <Form.Item
          label="Current Password"
          validateStatus={errors.currentPassword ? 'error' : undefined}
          help={errors.currentPassword?.message}
        >
          <Controller
            name="currentPassword"
            control={control}
            render={({ field }) => (
              <Input.Password
                placeholder="Enter current password"
                autoComplete="current-password"
                {...field}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="New Password"
          validateStatus={errors.newPassword ? 'error' : undefined}
          help={errors.newPassword?.message}
        >
          <Controller
            name="newPassword"
            control={control}
            render={({ field }) => (
              <Input.Password
                placeholder="Enter new password"
                autoComplete="new-password"
                {...field}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Confirm New Password"
          validateStatus={errors.confirmPassword ? 'error' : undefined}
          help={errors.confirmPassword?.message}
        >
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <Input.Password
                placeholder="Confirm new password"
                autoComplete="new-password"
                {...field}
              />
            )}
          />
        </Form.Item>

        <Form.Item>
          <Space direction="horizontal" size="middle">
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

export default ChangePasswordForm;

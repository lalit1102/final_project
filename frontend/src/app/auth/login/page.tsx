"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Divider, Typography, App } from "antd";

import { Card } from "@/components/card";
import { Button } from "@/components/button";
import { Form, FormInput, FormPassword } from "@/components/form";
import { GoogleIcon } from "@/components/icons/google-icon";
import { useAuth } from "@/hooks";
import type { LoginPayload } from "@/types/auth";
import { getApiErrorMessage, getApiValidationErrors } from "@/utils/axiosError";
import styles from "../auth.module.css";
import { GoogleLoginButton } from "@/components/auth";
import { useGoogleAuth } from "@/hooks";

const { Title, Text } = Typography;

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { loginWithGoogle, loading:googleLoading } = useGoogleAuth();
  const router = useRouter();
  const { message } = App.useApp();
  const methods = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { login, loading:authLoading } = useAuth();

  const {
    formState: { isSubmitting },
  } = methods;

  const applyApiErrors = (errors: string[]) => {
    errors.forEach((errorMessage) => {
      const normalized = errorMessage.toLowerCase();
      if (normalized.includes("email")) {
        methods.setError("email", { type: "server", message: errorMessage });
      } else if (normalized.includes("password")) {
        methods.setError("password", { type: "server", message: errorMessage });
      }
    });
  };

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    try {
      const payload: LoginPayload = {
        email: data.email,
        password: data.password,
      };

      methods.clearErrors();
      await login(payload);
      message.success("Signed in successfully.");
      router.replace("/dashboard");
    } catch (error) {
      const errorMessage = getApiErrorMessage(error);
      const validationErrors = getApiValidationErrors(error);

      applyApiErrors(validationErrors);
      if (validationErrors.length === 0) {
        message.error(errorMessage);
      }
    }
  };


  const isBusy = isSubmitting || authLoading;

  return (
    <div className={styles.authContainer}>
      <Card className={styles.authCard}>
        <div className={styles.header}>
          <Title level={3} className={styles.title}>
            Welcome Back
          </Title>
          <div className={styles.subtitle}>
            Sign in to your enterprise account
          </div>
        </div>

        <GoogleLoginButton
          className={styles.googleButton}
          onSuccess={loginWithGoogle}
          onError={() => message.error("Google login failed")}
        />

        <Divider className={styles.divider}>
          <span className={styles.dividerText}>OR LOGIN WITH EMAIL</span>
        </Divider>

        <Form methods={methods} onSubmit={onSubmit} className={styles.form}>
          <FormInput
            name="email"
            label="Email Address"
            placeholder="admin@enterprise.com"
          />
          <FormPassword
            name="password"
            label="Password"
            placeholder="Enter your password"
          />
          <Button
            type="primary"
            block
            loading={isBusy}
            htmlType="submit"
            className={styles.submitButton}
          >
            Sign In
          </Button>
        </Form>

        <div className={styles.footer}>
          <Text type="secondary">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register">Register here</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
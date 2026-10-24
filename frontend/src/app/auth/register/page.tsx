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
import { useAuth, useGoogleAuth } from "@/hooks";
import type { RegisterPayload } from "@/types/auth";
import { getApiErrorMessage, getApiValidationErrors } from "@/utils/axiosError";
import styles from "../auth.module.css";
import { GoogleLoginButton } from "@/components/auth";

const { Title, Text } = Typography;

const registerSchema = z.object({
  name: z.string().min(2, "Name is required (min 2 characters)"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const { loginWithGoogle, loading:googleLoading } = useGoogleAuth();
  const router = useRouter();
  const { message } = App.useApp();
  const methods = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const { register, loading:authLoading } = useAuth();
  const {
    formState: { isSubmitting },
  } = methods;

  const applyApiErrors = (errors: string[]) => {
    errors.forEach((errorMessage) => {
      const normalized = errorMessage.toLowerCase();
      if (normalized.includes("name")) {
        methods.setError("name", { type: "server", message: errorMessage });
      } else if (normalized.includes("email")) {
        methods.setError("email", { type: "server", message: errorMessage });
      } else if (normalized.includes("password")) {
        methods.setError("password", { type: "server", message: errorMessage });
      } else if (normalized.includes("confirm")) {
        methods.setError("confirmPassword", { type: "server", message: errorMessage });
      }
    });
  };

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    try {
      const payload: RegisterPayload = {
        name: data.name,
        email: data.email,
        password: data.password,
      };

      methods.clearErrors();
      await register(payload);
      message.success("Account created successfully. Please sign in.");
      router.replace("/auth/login");
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
            Create Account
          </Title>
          <div className={styles.subtitle}>
            Register for a new enterprise account
          </div>
        </div>

        <GoogleLoginButton
          className={styles.googleButton}
          onSuccess={loginWithGoogle}
          onError={() => message.error("Google login failed")}
        />

        <Divider className={styles.divider}>
          <span className={styles.dividerText}>OR REGISTER WITH EMAIL</span>
        </Divider>

        <Form methods={methods} onSubmit={onSubmit} className={styles.form}>
          <FormInput name="name" label="Full Name" placeholder="John Doe" />
          <FormInput
            name="email"
            label="Email Address"
            placeholder="john.doe@enterprise.com"
          />
          <FormPassword
            name="password"
            label="Password"
            placeholder="Create a strong password"
          />
          <FormPassword
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm your password"
          />
          <Button
            type="primary"
            block
            loading={isBusy}
            htmlType="submit"
            className={styles.submitButton}
          >
            Create Account
          </Button>
        </Form>

        <div className={styles.footer}>
          <Text type="secondary">
            Already have an account?{" "}
            <Link href="/auth/login">Sign in here</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
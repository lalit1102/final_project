"use client";

import React from "react";
import Link from "next/link";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card } from "@/components/card";
import { Button } from "@/components/button";
import { Form, FormInput, FormPassword } from "@/components/form";
import { Divider, Typography } from "antd";


import type { LoginRequest } from "@/types/auth";
import styles from "../auth.module.css";
import { GoogleIcon } from "@/components/icons/google-icon";

const { Title, Text } = Typography;

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const methods = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    formState: { isSubmitting },
  } = methods;

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    try {
      const payload: LoginRequest = {
        email: data.email,
        password: data.password,
      };

      console.log("LOGIN PAYLOAD:", payload);

      // TODO: API CALL HERE (Axios)
      // const res = await api.post("/auth/login", payload);

      localStorage.setItem("accessToken", "demo-token");
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleGoogleLogin = () => {
    console.log("Google OAuth Triggered");
    // TODO: NextAuth / Google OAuth
  };

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

        <Button
          type="default"
          className={styles.googleButton}
          onClick={handleGoogleLogin}
          icon={<GoogleIcon />}
          block
        >
          Continue with Google
        </Button>

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
            loading={isSubmitting}
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
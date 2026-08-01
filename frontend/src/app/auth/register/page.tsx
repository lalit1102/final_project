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


import type { RegisterRequest } from "@/types/auth";
import styles from "../auth.module.css";
import { GoogleIcon } from "@/components/icons/google-icon";

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
  const methods = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    formState: { isSubmitting },
  } = methods;

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    try {
      const payload: RegisterRequest = {
        name: data.name,
        email: data.email,
        password: data.password,
      };

      console.log("Register Payload:", payload);

      // TODO: Connect Axios API here in the future
      // const res = await api.post("/auth/register", payload);

      localStorage.setItem("accessToken", "demo-token");
    } catch (error) {
      console.error("Register Error:", error);
    }
  };

  const handleGoogleSignup = () => {
    console.log("Initiating Google Signup...");
    // TODO: Connect NextAuth / Google OAuth here in the future
  };

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

        <Button
          type="default"
          className={styles.googleButton}
          onClick={handleGoogleSignup}
          icon={<GoogleIcon/>}
          block
        >
          Sign up with Google
        </Button>

        <Divider className={styles.divider}>
          <span className={styles.dividerText}>OR REGISTER WITH EMAIL</span>
        </Divider>

        <Form methods={methods} onSubmit={onSubmit} className={styles.form}>
          <FormInput
            name="name"
            label="Full Name"
            placeholder="John Doe"
          />
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
            loading={isSubmitting}
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
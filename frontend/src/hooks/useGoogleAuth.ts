"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";

import { googleLogin } from "@/api";
import { getApiErrorMessage } from "@/utils/axiosError";

export default function useGoogleAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const loginWithGoogle = async (credential: string) => {
    try {
      setLoading(true);

      await googleLogin({
         idToken: credential,
      });

      message.success("Google login successful.");

      router.replace("/dashboard");
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    loginWithGoogle,
  };
}
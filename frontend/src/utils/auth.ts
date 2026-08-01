"use client";

import { redirect } from "next/navigation";
import { profile } from "@/api";

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const response = await profile();
    return response.status < 400;
  } catch {
    redirect("/auth/login");
    return false;
  }
};

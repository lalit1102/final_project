"use client";


import { profile } from "@/api";

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const response = await profile();
    return response.status < 400;
  } catch {
   
    return false;
  }
};

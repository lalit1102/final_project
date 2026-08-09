import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/AppProviders";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnSphere",
  description: "Enterprise School Learning Management System",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <AppProviders>{children}</AppProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}

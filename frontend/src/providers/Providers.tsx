"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import AntdProvider from "./AntdProvider";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <AntdProvider>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          {children}
        </GoogleOAuthProvider>
      </AntdProvider>
    </Provider>
  );
}

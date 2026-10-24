"use client";

import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

interface GoogleLoginButtonProps {
  className?: string;
  onSuccess: (credential: string) => void;
  onError?: () => void;
}

export default function GoogleLoginButton({
  className,
  onSuccess,
  onError,
}: GoogleLoginButtonProps) {
  return (
    <div className={className}>
      <GoogleLogin
        onSuccess={(response: CredentialResponse) => {
          if (response.credential) {
            onSuccess(response.credential);
          }
        }}
        onError={() => {
          onError?.();
        }}
        theme="outline"
        size="large"
        text="continue_with"
        shape="rectangular"
      />
    </div>
  );
}
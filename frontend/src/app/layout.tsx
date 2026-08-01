
import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";





export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
    >
      <body className="min-h-full flex flex-col">
        <GoogleOAuthProvider  clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
        {children}
        </GoogleOAuthProvider>
        </body>
    </html>
  );
}

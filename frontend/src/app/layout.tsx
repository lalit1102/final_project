
import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AntdProvider from "@/providers/AntdProvider";




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
        <AntdProvider>
        <GoogleOAuthProvider  clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
        {children}
        </GoogleOAuthProvider>
        </AntdProvider>
        </body>
    </html>
  );
}

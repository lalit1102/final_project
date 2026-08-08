
import "./globals.css";
import Providers from "@/providers/Providers";




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
        <Providers>
          {children}
        </Providers>
        </body>
    </html>
  );
}

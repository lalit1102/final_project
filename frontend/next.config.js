const nextConfig = {
    reactStrictMode: true,
    // Backend API proxy (optional — only for development convenience)
    // The backend has CORS configured with credentials, so direct Axios calls work.
    // If CORS is problematic in dev, uncomment:
    // async rewrites() {
    //   return [
    //     {
    //       source: '/api/auth/:path*',
    //       destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/:path*`,
    //     },
    //   ];
    // },
};
export default nextConfig;

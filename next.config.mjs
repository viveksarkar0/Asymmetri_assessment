/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@vercel/postgres", "drizzle-orm"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;

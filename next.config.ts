import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable React's Strict Mode in development
  reactStrictMode: true,
  // Configuratie voor statische export
  output: 'export',
  // Schakel linting en typechecking uit tijdens build om problemen te vermijden
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;

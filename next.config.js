// Next.js configuration
// This file configures the Next.js application settings

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Configure environment variables that should be exposed to the browser
  env: {
    NEXT_PUBLIC_PROXY_TOKEN: process.env.PROXY_TOKEN,
    NEXT_PUBLIC_OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    NEXT_PUBLIC_ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
  },
  
  // Configure experimental features
  experimental: {
    // Enable the new app directory structure
    appDir: true,
  },
  
  // Configure webpack for any custom build requirements
  webpack: (config) => {
    return config;
  },
}

module.exports = nextConfig
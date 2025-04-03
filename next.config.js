/** @type {import('next').NextConfig} */
const { readFileSync } = require('fs');
const path = require('path');

// Get certificate paths
const certPath = path.join(process.cwd(), 'certificates');
let httpsConfig = null;

// Only attempt to read certificates if they exist
try {
  httpsConfig = {
    key: readFileSync(path.join(certPath, 'localhost+3-key.pem')),
    cert: readFileSync(path.join(certPath, 'localhost+3.pem'))
  };
  console.log('HTTPS certificates loaded successfully');
} catch (error) {
  console.warn('HTTPS certificates not found, falling back to HTTP');
  console.warn('To use HTTPS, run: mkcert -install && mkcert localhost 127.0.0.1 ::1');
}

const nextConfig = {
  reactStrictMode: true,
  // For serving images from public folder
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
    domains: ['localhost']
  },
  // No need to specify webpack config if you're not modifying it
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;

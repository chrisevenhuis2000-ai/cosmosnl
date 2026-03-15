/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export — werkt op elke webserver zonder Node.js
  output: 'export',
  trailingSlash: true,

  // Voor statische export: gebruik unoptimized images (geen server nodig)
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig

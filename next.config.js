// next.config.js
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // ✅ nodig voor static export + externe images
  },
}
module.exports = nextConfig
cat > next.config.js << 'EOF'
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
}
module.exports = nextConfig
EOF
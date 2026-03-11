/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void:   '#07080d',
        deep:   '#0c0e18',
        panel:  '#111420',
        rim:    '#1c2035',
        mist:   '#2a3050',
        dust:   '#4a5278',
        ash:    '#7a86a8',
        star:   '#dde2f0',
        gold:   '#d4a84b',
        cyan:   '#3dcfdf',
        cosmos: '#e05040',
        green:  '#3ddf90',
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'serif'],
        sans:    ['var(--font-syne)', 'sans-serif'],
        mono:    ['var(--font-dm-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}

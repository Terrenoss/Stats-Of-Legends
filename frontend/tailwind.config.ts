
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        lol: {
          gold: '#C8AA6E',
          goldDim: '#785A28',
          goldLight: '#F0E6D2',
          red: '#C23030',
          redDark: '#5e1313',
          hextech: '#9333EA',
          hextechDim: '#581c87',
          blue: '#9333EA',
          dark: '#050505',
          panel: '#121212',
          card: '#18181b',
          win: '#059669',
          loss: '#991B1B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Beaufort for LOL', 'Inter', 'serif'],
      },
      backgroundImage: {
        'hex-pattern': "url('data:image/svg+xml,%3Csvg width=\"24\" height=\"40\" viewBox=\"0 0 24 40\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 40c5.523 0 10-4.477 10-10V10c0-5.523-4.477-10-10-10s-10 4.477-10 10v20c0 5.523 4.477 10 10 10z\" fill=\"%239333EA\" fill-opacity=\"0.05\" fill-rule=\"evenodd\"/%3E%3C/svg%3E')",
        'gold-gradient': 'linear-gradient(to bottom, #C8AA6E, #785A28)',
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(200, 170, 110, 0.15)',
        'glow-void': '0 0 20px rgba(147, 51, 234, 0.25)',
        'glow-red': '0 0 20px rgba(194, 48, 48, 0.3)',
      }
    },
  },
  plugins: [],
};
export default config;

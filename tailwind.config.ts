import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dusty-rose': '#D4A5A5',
        'sage': '#8FAF8A',
        'terracotta': '#C4674A',
        'cream': '#F5EFE0',
        'amber': '#C8944A',
        'cream-dark': '#EDE3CD',
      },
      fontFamily: {
        'display': ['var(--font-playfair)', 'Georgia', 'serif'],
        'body': ['var(--font-dm-serif)', 'Georgia', 'serif'],
        'handwritten': ['var(--font-caveat)', 'cursive'],
        'pappa': ['var(--font-pappa)', 'serif'],
      },
      backgroundImage: {
        'linen': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%23F5EFE0'/%3E%3Cpath d='M0 0L4 4M4 0L0 4' stroke='%23E8DCC8' stroke-width='0.5' opacity='0.5'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}

export default config

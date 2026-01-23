/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Mediterranean Kitchen palette
        cream: '#FDF6E9',
        'cream-dark': '#F5EBD8',
        terracotta: {
          50: '#FEF4F0',
          100: '#FCE5DB',
          200: '#F9C7B3',
          300: '#F5A385',
          400: '#E07442',
          500: '#C45C26',
          600: '#A34A1F',
          700: '#823B18',
          800: '#612C12',
          900: '#401D0C',
        },
        olive: {
          50: '#F4F6EF',
          100: '#E5EAD9',
          200: '#C8D4AF',
          300: '#A6B97F',
          400: '#7A9147',
          500: '#4A5D23',
          600: '#3C4B1C',
          700: '#2E3915',
          800: '#20280F',
          900: '#121608',
        },
        charcoal: '#2D2A26',
        honey: {
          50: '#FFFBF0',
          100: '#FEF5D9',
          200: '#FCE9AE',
          300: '#F9D97D',
          400: '#F5C64D',
          500: '#E8A838',
          600: '#C4872A',
          700: '#9C6A21',
          800: '#744F19',
          900: '#4C3410',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
        hebrew: ['Heebo', 'Assistant', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'paper-texture': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'steam': 'steam 2s ease-out infinite',
        // Cooking mode animations
        'confetti': 'confetti 4s ease-out forwards',
        'step-complete': 'stepComplete 0.5s ease-out',
        'achievement': 'achievementUnlock 0.6s ease-out forwards',
        'progress-shimmer': 'progressShimmer 2s infinite',
        'bounce-in': 'bounceIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        steam: {
          '0%': { opacity: '0', transform: 'translateY(0) scale(1)' },
          '50%': { opacity: '0.5' },
          '100%': { opacity: '0', transform: 'translateY(-20px) scale(1.5)' },
        },
        // Cooking mode keyframes
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        stepComplete: {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(74, 93, 35, 0.4)' },
          '50%': { transform: 'scale(1.1)', boxShadow: '0 0 0 20px rgba(74, 93, 35, 0)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(74, 93, 35, 0)' },
        },
        achievementUnlock: {
          '0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(10deg)', opacity: '1' },
          '75%': { transform: 'scale(0.95) rotate(-5deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        progressShimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

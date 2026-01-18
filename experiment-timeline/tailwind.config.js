/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dmrt: {
          'primary-dark': '#0c3026',
          'primary-main': '#017f97',
          'primary-light': '#e8f4f8',
          'accent-5': '#00a1b8',
          'accent-4': '#54b7c6',
          'accent-3': '#84cfdb',
          'accent-2': '#b3e3ec',
          'accent-1': '#d9f1f6',
        },
        text: {
          'primary': '#212529',
          'secondary': '#6c757d',
          'placeholder': '#adb5bd',
          'disabled': '#ced4da',
        },
        bg: {
          'page': '#ffffff',
          'card': '#f8f9fa',
          'input': '#ffffff',
        },
        border: {
          'default': '#dee2e6',
          'focus': '#017f97',
          'error': '#dc3545',
        },
        status: {
          'success': '#28a745',
          'warning': '#ffc107',
          'error': '#dc3545',
          'info': '#17a2b8',
        }
      },
      fontFamily: {
        'primary': ['KoPub Dotum', 'Malgun Gothic', 'sans-serif'],
        'code': ['D2Coding', 'Consolas', 'monospace'],
      },
      spacing: {
        '1': '0.25rem',   // 4px
        '2': '0.5rem',    // 8px
        '3': '0.75rem',   // 12px
        '4': '1rem',      // 16px
        '5': '1.25rem',   // 20px
        '6': '1.5rem',    // 24px
        '8': '2rem',      // 32px
        '10': '2.5rem',   // 40px
        '12': '3rem',     // 48px
        '16': '4rem',     // 64px
      },
      fontSize: {
        'xs': '0.75rem',    // 12px
        'sm': '0.875rem',   // 14px
        'base': '1rem',     // 16px
        'lg': '1.125rem',   // 18px
        'xl': '1.25rem',    // 20px
        '2xl': '1.5rem',    // 24px
        '3xl': '1.875rem',  // 30px
      },
      minHeight: {
        'touch': '44px',  // 최소 터치 타겟
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'modal': '0 4px 12px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}

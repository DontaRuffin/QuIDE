import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'gh-canvas': '#0D1117',
        'gh-surface': '#161B22',
        'gh-border': '#30363D',
        'gh-text': '#E6EDF3',
        'gh-muted': '#8B949E',
        'gh-blue': '#58A6FF',
        'gh-green': '#3FB950',
        'gh-red': '#F85149',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;

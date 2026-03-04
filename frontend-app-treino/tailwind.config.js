/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
    // As cores customizadas antigas (app-bg, app-card, app-primary) foram
    // removidas pois não são usadas no App.jsx atual — o Tailwind não
    // purga classes que nunca aparecem no conteúdo, mas ter configurações
    // não usadas aumenta o tempo de compilação.
  },
  plugins: [],
}
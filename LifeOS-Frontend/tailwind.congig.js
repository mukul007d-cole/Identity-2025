/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
    extend: {
    fontFamily: {
    sans: ["Inter", "Roboto", "sans-serif"],
    },
    colors: {
    primary: "#4f9eff",
    secondary: "#1e293b",
    accent: "#38bdf8",
    },
    },
    },
    plugins: [],
    };
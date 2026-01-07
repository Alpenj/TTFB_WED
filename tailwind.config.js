/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                neonGreen: '#39FF14',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // You might want to import Inter in CSS
            },
        },
    },
    plugins: [],
}

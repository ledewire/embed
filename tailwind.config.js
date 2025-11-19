/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
    // Important: Prefix to avoid collisions or use Shadow DOM (we are using Shadow DOM, but prefix is safer too if we leak)
    // But since we are using Shadow DOM, we might not need prefix, but let's keep it standard.
    // Actually, for Shadow DOM, we need to inject styles *into* the shadow root.
    // Tailwind by default works on the document.
}

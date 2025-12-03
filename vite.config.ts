import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import path from 'path';

export default defineConfig({
    plugins: [preact()],
    resolve: {
        alias: {
            react: 'preact/compat',
            'react-dom': 'preact/compat',
        },
    },
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/main.tsx'),
            name: 'LedeWire',
            fileName: (format) => `ledewire.${format}.js`,
            formats: ['iife']
        },
        rollupOptions: {
            external: [],
            output: {
                globals: {}
            }
        },
        minify: 'terser',
    },
    server: {
        open: '/index.html'
    }
});

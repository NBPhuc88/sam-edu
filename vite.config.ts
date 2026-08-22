import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.tsx',
                'resources/js/pages/Auth/Login.tsx',
                'resources/js/pages/Dashboard.tsx',
                'resources/js/pages/Error.tsx',
                'resources/js/pages/Home/Index.tsx',
                'resources/js/pages/Home/About.tsx',
                'resources/js/pages/Home/Contact.tsx',
                'resources/js/pages/Admin/Statistics.tsx',
            ],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                }),
            ],
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
            // command: 'docker compose -f /home/phuc/Desktop/web/docker/docker-compose.yml exec -w /var/www/sam-edu php83 php artisan wayfinder:generate',
            // command: 'docker compose -f /home/phuc/Desktop/php/docker/docker-compose.yml exec -w /var/www/sam-edu workspace-83 php artisan wayfinder:generate',
        }),
    ],
    build: {
        rollupOptions: {
            input: [
                'resources/css/app.css',
                'resources/js/app.tsx',
                'resources/js/pages/Auth/Login.tsx',
                'resources/js/pages/Dashboard.tsx',
                'resources/js/pages/Error.tsx',
                'resources/js/pages/Home/Index.tsx',
                'resources/js/pages/Home/About.tsx',
                'resources/js/pages/Home/Contact.tsx',
                'resources/js/pages/Admin/Statistics.tsx',
            ],
        },
    },
});

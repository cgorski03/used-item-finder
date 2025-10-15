import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        name: 'search-producer-tests',
        environment: 'miniflare',
        dir: 'test',

        pool: '@cloudflare/vitest-pool-workers',
        poolOptions: {
            workers: {
            },
        },
    },
});

import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
    test: {
        fileParallelism: false,
        name: 'search-producer-tests',
        poolOptions: {
            workers: {
                wrangler: {
                    configPath: "./wrangler.jsonc", environment: "test"
                }
            },
        },
    },
});

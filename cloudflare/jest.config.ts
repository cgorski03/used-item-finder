import type { Config } from 'jest';

const config: Config = {
    testEnvironment: 'node',
    preset: 'ts-jest',
    testMatch: ['**/?(*.)+(test).ts'],
    clearMocks: true,
    globals: {
        'ts-jest': {
            // Use the appropriate tsconfig for the main Jest run
            // If you're using tsconfig.test.json, reference that here.
            tsconfig: 'tsconfig.test.json',
            // This is the important part: tell ts-jest to emit ES modules
            // for the Jest environment, even if your tsconfig has `module: "ESNext"`
            // (which it likely does for Workers). Jest sometimes needs CJS for its runner,
            // but your sources are ESM.
            // Setting `useESM: true` here means ts-jest will try to handle `.mts` files
            // and keep `import`/`export` syntax, which Jest's runtime can then process
            // if configured correctly.
            // However, usually it's better to transform to CJS for Jest's runtime stability,
            // and allow Jest to handle the CJS output. Let's try `module: "CommonJS"` in ts-jest
            // first, as that's simpler.

            // Let's try NOT setting useESM here for ts-jest directly.
            // Instead, we'll let ts-jest convert ESM to CJS, which Jest handles well.
            // The `tsconfig.json` for compilation should define the module strategy.
        },
    },
    projects: [
        {
            displayName: 'shared',
            testMatch: ['<rootDir>/workers/shared/**/*.test.{ts,js}'],
        },
        // Worker 1 project
        {
            displayName: 'search-consumer',
            testMatch: ['<rootDir>/workers/search-consumer/**/*.test.{ts,js}'],
        },
        // Worker 2 project
        {
            displayName: 'search-producer',
            testMatch: ['<rootDir>/workers/search-producer/**/*.test.{ts,js}'],
        }
    ],
};

export default config;

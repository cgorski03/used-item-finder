import type { Config } from 'jest';

const config: Config = {
    testEnvironment: 'node',
    preset: 'ts-jest',
    testMatch: ['**/?(*.)+(test).ts'],
    clearMocks: true,
};

export default config;

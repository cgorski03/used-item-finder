import { getAccessToken } from "./ebay-api";
import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('ebay-oauth-nodejs-client', () => ({
    __esModule: true,
    default: vi.fn().mockImplementation(() => {
        return {
            getApplicationToken: vi.fn().mockResolvedValue({
                access_token: 'mock-token',
                expires_in: 7200
            })
        }
    })
}))

describe('getAccessToken', () => {
    beforeEach(() => {
        // Set up environment variables
        process.env.EBAY_ENV = 'SANDBOX';
        process.env.clientId = 'test-client-id';
        process.env.clientSecret = 'test-client-secret';
        process.env.devId = 'test-dev-id';
    });

    it('should return a token from eBay API', async () => {
        const token = await getAccessToken();
        expect(token.access_token).toBe('mock-token');
        expect(token.expires_in).toBe(7200);
    });

    it('should throw error for invalid environment', async () => {
        process.env.EBAY_ENV = 'INVALID';
        await expect(getAccessToken()).rejects.toThrow('Environment must be set');
    });
})

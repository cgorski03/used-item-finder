import { shouldGetNewToken, setEbayToken } from "./set-oauth-token";
import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('./ebay-api', () => ({
    ...vi.importActual('./ebay-api'),
    getAccessToken: vi.fn().mockResolvedValue({
        access_token: 'valid-token',
        expires_in: 7200
    })
}));


describe('setRefreshToken', () => {
    beforeEach(() => {
        // Set up environment variables
        process.env.EBAY_ENV = 'SANDBOX';
        process.env.clientId = 'test-client-id';
        process.env.clientSecret = 'test-client-secret';
        process.env.devId = 'test-dev-id';
    });

    it('should not refresh a valid token', async () => {
        const mockKV = {
            get: vi.fn().mockReturnValue({
                access_token: 'valid-token',
                expires_at: Date.now() + 30 * 60 * 1000
            }),
            put: vi.fn()
        };

        await setEbayToken(mockKV, 'TOKEN_KEY');
        expect(mockKV.put,).not.toHaveBeenCalled();
    });
    it('should refresh an invalid token', async () => {
        const mockKV = {
            get: vi.fn().mockReturnValue({
                access_token: 'invalid-token',
                expires_at: Date.now() - 30 * 60 * 1000
            }),
            put: vi.fn()
        };

        await setEbayToken(mockKV, 'TOKEN_KEY');
        expect(mockKV.put).toHaveBeenCalledWith(
            'TOKEN_KEY',
            expect.stringContaining('valid-token')
        );
    });

})

import { shouldGetNewToken, setRefreshToken } from "./set-oauth-token";

jest.mock('./ebay-api', () => ({
    ...jest.requireActual('./ebay-api'),
    getAccessToken: jest.fn().mockResolvedValue({
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
            get: jest.fn().mockReturnValue({
                access_token: 'valid-token',
                expires_at: Date.now() + 30 * 60 * 1000
            }),
            put: jest.fn()
        } as unknown as KVNamespace;

        await setRefreshToken(mockKV, 'TOKEN_KEY');
        expect(mockKV.put,).not.toHaveBeenCalled();
    });
    it('should refresh an invalid token', async () => {
        const mockKV = {
            get: jest.fn().mockReturnValue({
                access_token: 'invalid-token',
                expires_at: Date.now() - 30 * 60 * 1000
            }),
            put: jest.fn()
        } as unknown as KVNamespace;

        await setRefreshToken(mockKV, 'TOKEN_KEY');
        expect(mockKV.put).toHaveBeenCalledWith(
            'TOKEN_KEY',
            expect.stringContaining('valid-token')
        );
    });

})

declare module 'ebay-oauth-nodejs-client' {
    export interface EbayAuthTokenOptions {
        filePath?: string;
        clientId?: string;
        clientSecret?: string;
        redirectUri?: string;
        devid?: string;
        env: EbayEnv;
    }
    export type EbayEnv = 'PRODUCTION' | 'SANDBOX'
    export interface AccessTokenResponse {
        access_token: string;
        expires_in: number;
        token_type: string;
        refresh_token?: string;
        refresh_token_expires_in?: number;
    }

    export interface UserAuthorizationUrlOptions {
        prompt?: 'login';
        state?: string;
    }

    class EbayAuthToken {

        constructor(options: EbayAuthTokenOptions);

        /**
         * Generates an application access token for the client credentials grant flow.
         * @param environment Environment ('PRODUCTION' or 'SANDBOX').
         * @param scopes An array or space-separated string of scopes for which you need to generate the access token. Defaults to 'https://api.ebay.com/oauth/api_scope'
         * @return A Promise that resolves with the access token object.
         */
        getApplicationToken(
            environment: EbayEnv,
            scopes?: string | string[]
        ): Promise<AccessTokenResponse>;

        /**
         * Generates a user consent authorization URL.
         * @param environment Environment ('PRODUCTION' or 'SANDBOX').
         * @param scopes An array or space-separated string of scopes for which you need to generate the access token.
         * @param options Optional values.
         * @param options.state Custom state value.
         * @param options.prompt Enforce to log in.
         * @return The user consent URL.
         */
        generateUserAuthorizationUrl(
            environment: EbayEnv,
            scopes: string | string[],
            options?: UserAuthorizationUrlOptions
        ): string;

        /**
         * Exchanges an authorization code for a user access token.
         * @param environment Environment ('PRODUCTION' or 'SANDBOX').
         * @param code The code generated from the browser using the `generateUserAuthorizationUrl` method.
         * @return A Promise that resolves with the access token object.
         */
        exchangeCodeForAccessToken(
            environment: EbayEnv,
            code: string
        ): Promise<string>;

        /**
         * Uses a refresh token to update an expired user access token.
         * @param environment Environment ('PRODUCTION' or 'SANDBOX').
         * @param refreshToken The refresh token obtained from the authorization code flow.
         * @param scopes An array or space-separated string of scopes for which you need to generate the access token.
         * @return A Promise that resolves with the access token object.
         */
        getAccessToken(
            environment: EbayEnv,
            refreshToken: string,
            scopes: string | string[]
        ): Promise<string>;

        /**
         * Sets the refresh token.
         * @param refreshToken The refresh token.
         */
        setRefreshToken(refreshToken: string): void;

        /**
         * Gets the currently stored refresh token.
         * @return The refresh token.
         */
        getRefreshToken(): string | undefined;
    }

    export default EbayAuthToken;
}

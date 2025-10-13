import EbayAuthToken, { AccessTokenResponse } from 'ebay-oauth-nodejs-client';

export const getAccessToken = async (): Promise<AccessTokenResponse> => {
    const env = process.env.EBAY_ENV!;
    if (env !== 'PRODUCTION' && env !== 'SANDBOX') {
        ;
        throw new Error('Environment must be set');
    }
    const options = {
        clientId: process.env.clientId!,
        clientSecret: process.env.clientSecret!,
        devid: process.env.devId!
    }

    const token = new EbayAuthToken(options)
    return await token.getApplicationToken(env);
}

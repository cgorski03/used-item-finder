import EbayAuthToken, { AccessTokenResponse } from 'ebay-oauth-nodejs-client';
const EXPIRATION_BUFFER_MINUTES = 15;

type AccessTokenKVObject = {
    access_token: string;
    expiresAt: number; // UTC Timestamp in ms
}

const getAccessToken = async (): Promise<AccessTokenResponse> => {
    const env = process.env.EBAY_ENV!;
    if (env !== 'PRODUCTION' && env !== 'SANDBOX') {
        console.log('EBAY_ENV is not valid');
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

const shouldGetNewToken = (accessToken: unknown): boolean => {
    // type gaurds
    if (!accessToken || typeof accessToken !== "object") return true;
    if (!("access_token" in accessToken) || !("expiresAt" in accessToken)) return true;
    const tokenObj = accessToken as AccessTokenKVObject;
    // Check if it is going to expire in the next 15 minutes
    const currentUtcTimestampMs = Date.now();
    if ((tokenObj.expiresAt - (EXPIRATION_BUFFER_MINUTES * 60 * 1000)) < currentUtcTimestampMs) {
        return true;
    }
    return false;
}


export async function setRefreshToken(item_finder_kv: KVNamespace, EBAY_TOKEN_KEY: string) {
    // Get the current token from the KV 
    let accessToken = item_finder_kv.get(EBAY_TOKEN_KEY, { type: 'json' });
    if (!shouldGetNewToken(accessToken)) {
        console.log(`Token within ${EXPIRATION_BUFFER_MINUTES} minutes. Refreshing token is not necessary`);
        return;
    }
    // Get another token
    try {
        const newToken = await getAccessToken()
        const kvObj: AccessTokenKVObject = {
            access_token: newToken.access_token,
            expiresAt: Date.now() + newToken.expires_in * 1000
        }
        // Save new token
        await item_finder_kv.put(EBAY_TOKEN_KEY, JSON.stringify(kvObj))
    } catch (error: any) {
        console.error(`Failed to get new token from ebay API. Error: ${error}`)
        // rethrow error for observability
        throw error;
    }
}


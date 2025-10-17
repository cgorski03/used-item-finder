import { getAccessToken, AccessTokenKVObject, parseAccessToken, EbayAuthTokenOptions } from "@workers/shared";
const EXPIRATION_BUFFER_MINUTES = 15;

export const shouldGetNewToken = (accessToken: unknown, expirationBufferMinutes: number = EXPIRATION_BUFFER_MINUTES): boolean => {
    // type guards
    const token = parseAccessToken(accessToken);
    if (!token) return true;
    // Check if it is going to expire in the next 15 minutes
    const currentUtcTimestampMs = Date.now();
    if ((token.expires_at - (expirationBufferMinutes * 60 * 1000)) < currentUtcTimestampMs) {
        return true;
    }
    return false;
}

export async function setEbayToken(item_finder_kv: KVNamespace, EBAY_TOKEN_KEY: string, ebayCredentials: EbayAuthTokenOptions) {
    // Get the current token from the KV 
    let accessToken = await item_finder_kv.get(EBAY_TOKEN_KEY, { type: 'json' });
    if (!shouldGetNewToken(accessToken)) {
        console.log(`Token within ${EXPIRATION_BUFFER_MINUTES} minutes. Refreshing token is not necessary`);
        return;
    }
    // Get another token
    try {
        const newToken = await getAccessToken(ebayCredentials)
        const kvObj: AccessTokenKVObject = {
            access_token: newToken.access_token,
            expires_at: Date.now() + newToken.expires_in * 1000
        }
        console.log('kvObj');
        // Save new token
        await item_finder_kv.put(EBAY_TOKEN_KEY, JSON.stringify(kvObj))
    } catch (error: any) {
        console.error(`Failed to get new token from ebay API. Error: ${error}`)
        // rethrow error for observability
        throw error;
    }
}


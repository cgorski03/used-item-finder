import { getAccessToken } from "./ebay-api";

const EXPIRATION_BUFFER_MINUTES = 15;

type AccessTokenKVObject = {
    access_token: string;
    expires_at: number; // UTC Timestamp in ms
}

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

export function parseAccessToken(accessToken: unknown): AccessTokenKVObject | null {
    if (!accessToken || typeof accessToken !== "object") return null;
    if (!("access_token" in accessToken) || !("expires_at" in accessToken)) return null;

    const tokenObj = accessToken as AccessTokenKVObject;
    if (typeof tokenObj.expires_at !== 'number' || typeof tokenObj.access_token !== 'string') return null;
    return tokenObj
}

export async function setEbayToken(item_finder_kv: KVNamespace, EBAY_TOKEN_KEY: string) {
    // Get the current token from the KV 
    let accessToken = await item_finder_kv.get(EBAY_TOKEN_KEY, { type: 'json' });
    if (!shouldGetNewToken(accessToken)) {
        console.log(`Token within ${EXPIRATION_BUFFER_MINUTES} minutes. Refreshing token is not necessary`);
        return;
    }
    // Get another token
    try {
        const newToken = await getAccessToken()
        const kvObj: AccessTokenKVObject = {
            access_token: newToken.access_token,
            expires_at: Date.now() + newToken.expires_in * 1000
        }
        // Save new token
        await item_finder_kv.put(EBAY_TOKEN_KEY, JSON.stringify(kvObj))
    } catch (error: any) {
        console.error(`Failed to get new token from ebay API. Error: ${error}`)
        // rethrow error for observability
        throw error;
    }
}


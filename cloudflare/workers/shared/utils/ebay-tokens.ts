export type AccessTokenKVObject = {
    access_token: string;
    expires_at: number; // UTC Timestamp in ms
}


export function parseAccessToken(accessToken: unknown): AccessTokenKVObject | null {
    if (!accessToken || typeof accessToken !== "object") return null;
    if (!("access_token" in accessToken) || !("expires_at" in accessToken)) return null;

    const tokenObj = accessToken as AccessTokenKVObject;
    if (typeof tokenObj.expires_at !== 'number' || typeof tokenObj.access_token !== 'string') return null;
    return tokenObj
}


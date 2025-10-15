import EbayAuthToken, { AccessTokenResponse } from 'ebay-oauth-nodejs-client';
import type { components, operations } from '@shared/types/ebay';

export type EbayItemSummary = components['schemas']['ItemSummary'];
export type EbaySearchQuery = operations['search']['parameters']['query'];
export type EbaySearchHeaders = operations['search']['parameters']['header'];
export type EbaySearchResponse = components['schemas']['SearchPagedCollection'];

const getEbayEnv = (): 'PRODUCTION' | 'SANDBOX' => {
    const env = process.env.EBAY_ENV!;
    if (env !== 'PRODUCTION' && env !== 'SANDBOX') {
        throw new Error('Environment must be set');
    }
    return env;
}

const getBaseUrl = (): string => {
    const baseUrl = getEbayEnv() === 'PRODUCTION' ? 'api.ebay.com' : 'api.sandbox.ebay.com';
    return `https://${baseUrl}/buy/browse/v1/item_summary/search`;
}

const getUrlSearchParams = (query: EbaySearchQuery): URLSearchParams => {
    const params = new URLSearchParams();
    for (const key in query) {
        const value = query[key as keyof EbaySearchQuery];
        if (value !== undefined && value !== null) {
            params.append(key, String(value));
        }
    }
    return params;
}

const getEbaySearchHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
    'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
});

export const getAccessToken = async (): Promise<AccessTokenResponse> => {
    const options = {
        clientId: process.env.clientId!,
        clientSecret: process.env.clientSecret!,
        devid: process.env.devId!
    }

    const env = getEbayEnv();
    const token = new EbayAuthToken(options)
    return await token.getApplicationToken(env);
}

export async function searchEbay(keywords: string, accessToken: string): Promise<EbayItemSummary[]> {
    const endpoint = getBaseUrl();
    const queryParams: EbaySearchQuery = {
        q: keywords,
        limit: "50",
        offset: "0"
    };
    const searchParams = getUrlSearchParams(queryParams);
    const headers = getEbaySearchHeaders(accessToken);
    try {
        const response = await fetch(`${endpoint}?${searchParams.toString()}`, {
            method: 'GET',
            headers: headers as Record<string, string>, // Cast for fetch signature compatibility
        });
        if (!response.ok) {
            // The generated types for 400/500 say 'content?: never',
            // so we might not get a JSON error body. Read as text for better debugging.
            const errorText = await response.text();
            console.error(
                `eBay Browse API Error (${response.status} ${response.statusText}):`,
                errorText,
            );
        }
        const data: EbaySearchResponse = await response.json();
        return data.itemSummaries || [];
    } catch (error: any) {
        console.error(`error(ebay-api.searchEbay): ${error}`);
        throw (error);
    }
}

export const hasRequiredFieldsForDb = (ebayItem: EbayItemSummary): boolean => (
    !ebayItem.itemId ||
    !ebayItem.title ||
    !ebayItem.price?.value ||
    !ebayItem.price?.currency ||
    !ebayItem.itemWebUrl)



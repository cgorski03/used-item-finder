import EbayAuthToken, { AccessTokenResponse, EbayAuthTokenOptions, EbayEnv } from 'ebay-oauth-nodejs-client';
import type { components, operations } from '../types/ebay';
export type EbayItemSummary = components['schemas']['ItemSummary'];
export type EbaySearchQuery = operations['search']['parameters']['query'];
export type EbaySearchHeaders = operations['search']['parameters']['header'];
export type EbaySearchResponse = components['schemas']['SearchPagedCollection'];

const getBaseUrl = (ebayEnv: EbayEnv): string => {
    const baseUrl = ebayEnv === 'PRODUCTION' ? 'api.ebay.com' : 'api.sandbox.ebay.com';
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

export const getAccessToken = async (options: EbayAuthTokenOptions): Promise<AccessTokenResponse> => {
    const token = new EbayAuthToken(options)
    return JSON.parse(await token.getApplicationToken(options.env));
}

export async function searchEbay(keywords: string, accessToken: string, ebayEnv: EbayEnv):
    Promise<{ apiItemCount: number, apiItems: EbayItemSummary[] }> {
    const endpoint = getBaseUrl(ebayEnv);
    const queryParams: EbaySearchQuery = {
        q: keywords,
        limit: "100",
        offset: "0",
        fieldgroups: "EXTENDED"
    };
    const searchParams = getUrlSearchParams(queryParams);
    const headers = getEbaySearchHeaders(accessToken);
    try {
        // Construct the request options
        const requestOptions = {
            method: 'GET',
            headers: headers as Record<string, string>, // Cast for fetch signature compatibility
        };

        // Print the full request details
        console.log('Request URL:', `${endpoint}?${searchParams.toString()}`);
        console.log('Request Options:', requestOptions);

        // Make the request
        const response = await fetch(`${endpoint}?${searchParams.toString()}`, requestOptions);
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
        return {
            apiItemCount: data.total || 0,
            apiItems: data.itemSummaries || []
        };
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



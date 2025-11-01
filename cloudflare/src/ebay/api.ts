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

export async function searchEbay(
    keywords: string,
    accessToken: string,
    ebayEnv: EbayEnv
): Promise<{ apiItemCount: number; apiItems: EbayItemSummary[] }> {
    const endpoint = getBaseUrl(ebayEnv);
    const headers = getEbaySearchHeaders(accessToken);
    const requestOptions = {
        method: "GET",
        headers: headers as Record<string, string>,
    };

    const limit = 100;
    let offset = 0;
    let allItems: EbayItemSummary[] = [];
    let totalCount = 0;
    let hasMoreItems = true;

    while (hasMoreItems) {
        const queryParams: EbaySearchQuery = {
            q: keywords,
            limit: limit.toString(),
            offset: offset.toString(),
            fieldgroups: "EXTENDED",
        };
        const searchParams = getUrlSearchParams(queryParams);

        console.log("Request URL:", `${endpoint}?${searchParams.toString()}`);
        console.log("Request Options:", requestOptions);

        try {
            const response = await fetch(
                `${endpoint}?${searchParams.toString()}`,
                requestOptions
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    `eBay Browse API Error (${response.status} ${response.statusText}):`,
                    errorText
                );
                break;
            }

            const data: EbaySearchResponse = await response.json();

            if (!data.itemSummaries || data.itemSummaries.length === 0) {
                hasMoreItems = false;
                break;
            }

            totalCount = data.total || 0;
            allItems.push(...data.itemSummaries);

            // Check if we've retrieved all items
            if (offset + limit >= totalCount) {
                hasMoreItems = false;
            } else {
                offset += limit;
            }
        } catch (error: any) {
            console.error(`error(ebay-api.searchEbay): ${error}`);
            throw error;
        }
    }

    return {
        apiItemCount: totalCount,
        apiItems: allItems,
    };
}

export const hasRequiredFieldsForDb = (ebayItem: EbayItemSummary): boolean => (
    !ebayItem.itemId ||
    !ebayItem.title ||
    !ebayItem.price?.value ||
    !ebayItem.price?.currency ||
    !ebayItem.itemWebUrl)



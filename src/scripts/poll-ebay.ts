import 'dotenv/config';
import { db } from '../server/db';
import { items } from '../server/db/schema';
import { eq } from 'drizzle-orm';
import { getOAuthToken } from './oauth';
import type { components, operations } from '../types/ebay';

type DbItem = typeof items.$inferInsert;
// Define specific types directly from operations.search
type EbaySearchQuery = operations['search']['parameters']['query'];
type EbaySearchHeaders = operations['search']['parameters']['header'];
type EbaySearchResponse = components['schemas']['SearchPagedCollection'];
type EbayItemSummary = components['schemas']['ItemSummary'];
type EbayErrorResponse = components['schemas']['Error'];

async function searchEbay(keywords: string, currentAccessToken: string): Promise<DbItem[]> {
  // Use the refined base URL from environment variable, which should be just the hostname
  const browseApiBaseUrl = process.env.EBAY_API_BASE_URL;
  if (!browseApiBaseUrl) {
    console.error('EBAY_API_BASE_URL environment variable is not set.');
    return [];
  }
  const endpoint = `https://${browseApiBaseUrl}/buy/browse/v1/item_summary/search`;

  const queryParams: EbaySearchQuery = {
    q: keywords,
  };

  // Convert queryParams object to URLSearchParams correctly for parameters that might be arrays/strings
  const params = new URLSearchParams();
  for (const key in queryParams) {
    const value = queryParams[key as keyof EbaySearchQuery];
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }

  // --- Construct Headers using the generated type ---
  const headers: EbaySearchHeaders & { Authorization: string } = {
    'Authorization': `Bearer ${currentAccessToken}`,
    'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
  };

  try {
    const response = await fetch(`${endpoint}?${params.toString()}`, {
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
      // Attempt to parse as JSON in case it's actually structured
      try {
        const parsedError = JSON.parse(errorText);
        console.error('Parsed Error Details:', parsedError);
      } catch (e) {
        // Not JSON, just output raw text
      }
      return [];
    }

    const data: EbaySearchResponse = await response.json();
    const summaries: EbayItemSummary[] = data.itemSummaries || [];
    return summaries.map((ebayItem: EbayItemSummary) => {
      // Check for required fields which might be optional in API response but not in DB
      if (!ebayItem.itemId || !ebayItem.title || !ebayItem.price?.value || !ebayItem.price?.currency || !ebayItem.itemWebUrl) {
        console.warn('Skipping item due to missing essential data:', ebayItem);
        return null;
      }
      // Create an object that perfectly matches your Drizzle `items` table's insert type
      const dbItem = {
        externalId: ebayItem.itemId,
        title: ebayItem.title,
        priceValue: ebayItem.price.value,
        priceCurrency: ebayItem.price.currency,
        url: ebayItem.itemWebUrl,
        primaryImageUrl: ebayItem.image?.imageUrl,
        additionalImageUrls: ebayItem.additionalImages?.map(img => img.imageUrl!).filter(Boolean) as string[],
        condition: ebayItem.condition,
        conditionId: ebayItem.conditionId,
        buyingOptions: ebayItem.buyingOptions,
        itemCreationDate: ebayItem.itemCreationDate ? new Date(ebayItem.itemCreationDate) : undefined,
        itemEndDate: ebayItem.itemEndDate ? new Date(ebayItem.itemEndDate) : undefined,
        sellerUsername: ebayItem.seller?.username,
        rawData: ebayItem,
      };
      return dbItem;
    }).filter(Boolean) as DbItem[];

  } catch (error) {
    console.error('Failed to fetch from eBay Browse API:', error);
    return [];
  }
}


async function main() {
  console.log('Starting eBay poll...');
  // 1. Hardcode a search for now
  const token = await getOAuthToken();
  const searchKeywords = 'Golf Polo';
  const foundItems = await searchEbay(searchKeywords, token.access_token);
  // 2. Loop through found items and save new ones
  for (const itemForDb of foundItems) {
    // You might want to get the db instance first if `db` is a Promise
    const drizzleDb = await db;

    const existing = await drizzleDb.query.items.findFirst({
      where: eq(items.externalId, itemForDb.externalId),
    });
    if (!existing) {
      console.log(`New item found: ${itemForDb.title}`);
      await drizzleDb.insert(items).values(itemForDb);
    }
  }
  console.log('Poll finished.');
  process.exit(0);
}

main();

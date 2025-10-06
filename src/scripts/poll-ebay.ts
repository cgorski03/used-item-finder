import 'dotenv/config';
import { db } from '../server/db';
import { items, itemAnalysis } from '../server/db/schema';
import { eq } from 'drizzle-orm';

const EBAY_OAUTH_TOKEN = process.env.EBAY_OAUTH_TOKEN!; // You'll need to get this token

async function searchEbay(keywords: string) {
  const endpoint = 'https://api.ebay.com/buy/browse/v1/item_summary/search';

  const params = new URLSearchParams({
    q: keywords,
    category_ids: '15687', // Example: Men's Golf Apparel
    limit: '100', // Fetch up to 100 of the newest items
    sort: 'newlyListed', // MOST IMPORTANT for polling
    filter: 'price:[20..150],conditions:{USED}',
  });

  try {
    const response = await fetch(`${endpoint}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${EBAY_OAUTH_TOKEN}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US', // Or your target marketplace
      },
    });

    if (!response.ok) {
      console.error('eBay API Error:', await response.text());
      return [];
    }

    const data = await response.json();
    const listings = data.itemSummaries || [];

    // Map the response to match our database schema
    return listings.map((item: any) => ({
      externalId: item.itemId,
      title: item.title,
      price: item.price?.value,
      url: item.itemWebUrl,
      imageUrl: item.image?.imageUrl,
    }));
  } catch (error) {
    console.error('Failed to fetch from eBay:', error);
    return [];
  }
}

// ... the rest of the main() function from the previous example ...
// It will work as-is, since it expects the same object shape.

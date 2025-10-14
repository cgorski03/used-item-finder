import { eq } from "drizzle-orm";
import { db } from "../shared/db/client";
import { search, item } from "../shared/db/schema";
import { parseAccessToken } from "../utils/set-oauth-token";
import { EbayItemSummary, searchEbay } from "../utils/ebay-api";

type Env = {
    DATABASE_URL: string;
    ITEM_FINDER: KVNamespace;
    EBAY_TOKEN_KEY: string;
}

const createDbItemObjectFromSummary = (ebayItem: EbayItemSummary) => {
    if (!ebayItem.itemId ||
        !ebayItem.title ||
        !ebayItem.price?.value ||
        !ebayItem.price?.currency ||
        !ebayItem.itemWebUrl) {
        return null
    }
    return {
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
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const body = request.body;
        if (!body ||
            typeof body !== 'object' ||
            !('search_id' in body) ||
            typeof body.search_id !== 'number') {
            return new Response(JSON.stringify({
                success: false,
                error: 'missing search_id in body'
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        const searchId = body.search_id;
        try {
            const searchRes = await db.select().from(search).where(eq(search.id, searchId)).limit(1);
            if (searchRes.length === 0) {
                throw new Error(`Search ${searchId} not found`)
            }
            const searchInfo = searchRes[0];
            const accessToken = parseAccessToken(await env.ITEM_FINDER.get(env.EBAY_TOKEN_KEY, { type: 'json' }));
            if (!accessToken) {
                throw new Error('No access token');
            }
            const searchResults = await searchEbay(searchInfo.keywords, accessToken.access_token);

            type NewItem = typeof item.$inferInsert;
            const items = searchResults.map((ebayItem: EbayItemSummary) => {
                const itemObj = createDbItemObjectFromSummary(ebayItem);
                if (!itemObj) {
                    console.warn(`Item is missing required field ${ebayItem}`)
                } else {
                    return { ...itemObj, searchId: searchInfo.id } as NewItem;
                }
            }).filter((it) => it != null);
            // Save the items in the db 
            await db.transaction(
                async (tx) => {

                    await tx.insert(item).values(items)
                        .onConflictDoUpdate({
                            target: [item.searchId, item.externalId],
                            set: { lastSeen: new Date() }
                        });
                    await tx.update(search).set({
                        lastRunAt: new Date(),
                    })
                        .where(eq(search.id, searchId));
                }
            )
            return new Response(JSON.stringify({
                success: true,
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });

        } catch (e: any) {
            console.error(`Error(processing worker): ${e}`);
            return new Response(JSON.stringify({
                success: false,
                error: 'Server error encountered'
            }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        // Get the information about the search
        // Get the ebay token from the KV store
        // Make the ebay API request for the search based on the information
        // clean the data for the fields we want
        // put the information into the table
    }
}

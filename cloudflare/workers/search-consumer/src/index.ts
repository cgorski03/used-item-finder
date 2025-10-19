import { getWorkerDb } from '@db'
import { parseAccessToken, SearchMessage } from '@workers/shared';
import { EbayItemSummary, searchEbay } from '@workers/shared';
import { createDbItemObjectFromSummaryHelper, getSearchObjects, NewItem, saveItemsAndUpdateSearch } from "./repository";

// TODO refactor. This should relly be a processor class with retry logic etc
// Will also scale better with factory pattern to be able to consume
// Different data sources
// Should be ok for the MVP
export default {
    async queue(batch: MessageBatch<SearchMessage>, env: Env) {
        // without access token, no searches will succeed
        const accessToken = parseAccessToken(await env.AUTH_TOKEN_KV.get(env.EBAY_KV_KEY, { type: 'json' }));
        if (!accessToken) {
            throw new Error('No access token');
        }
        const searchIds = batch.messages.map((message) => {
            return message.body.search_id
        });
        const db = getWorkerDb(env.DATABASE_URL);
        const searches = await getSearchObjects(db, searchIds);
        if (searches.length === 0) {
            throw new Error(`No searches found for any of searchIds ${searchIds}`);
        }
        if (searches.length !== searchIds.length) {
            console.warn(`Called with ${searchIds} but only found ${searches}`);
        }
        await Promise.all(searches.map(async (search) => {
            const searchResults = await searchEbay(search.keywords, accessToken.access_token, env.EBAY_ENV);
            const items = searchResults.map((ebayItem: EbayItemSummary) => {
                const itemObj = createDbItemObjectFromSummaryHelper(ebayItem);
                if (!itemObj) {
                    console.warn(`Item is missing required field ${ebayItem}`)
                } else {
                    return { ...itemObj, searchId: search.id } as NewItem;
                }
            }).filter((it) => it != null);
            saveItemsAndUpdateSearch(db, items, search.id)
        }));
        return {
            success: true
        }
    }
}

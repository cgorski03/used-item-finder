import { AiAnalysisMessage, EbayItemSummary, parseAccessToken, searchEbay, SearchMessage } from "@workers/shared";
import { getWorkerDb } from "../../../../packages/db";
import { createDbItemObjectFromSummaryHelper, getItemSearchObjects, getSearchObjects, NewItem, saveItemsAndUpdateSearch } from "./repository";

export async function handleSearchRequest(batch: MessageBatch<SearchMessage>, env: Env, ctx: ExecutionContext) {
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
        await saveItemsAndUpdateSearch(db, items, search.id)
    }));
    return {
        success: true
    }
}

export async function handleAiAnalysisRequest(batch: MessageBatch<AiAnalysisMessage>, env: Env, ctx: ExecutionContext) {
    const itemIds = batch.messages.map((message) => {
        return message.body.item_id
    });
    const db = getWorkerDb(env.DATABASE_URL);
    const itemSearchObjects = await getItemSearchObjects(db, itemIds);
    if (itemSearchObjects.length === 0) { throw new Error("No items to analyze"); }
    await Promise.all(itemSearchObjects.map(async (itemSearch) => {
        const { item, search } = itemSearch;
    }))
}

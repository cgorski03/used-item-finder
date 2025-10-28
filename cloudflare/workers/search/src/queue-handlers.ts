import { AiAnalysisMessage, EbayItemSummary, parseAccessToken, searchEbay, SearchMessage } from "@workers/shared";
import { getWorkerDb } from "../../../../packages/db";
import { createDbItemObjectFromSummaryHelper, getItemSearchObjects, getSearchObjects, NewItem, saveItemBasicScore, saveItemsAndUpdateSearch } from "./repository";
import { analyzeItem } from "./ai/analyze-item";

export async function handleSearchRequest(batch: MessageBatch<SearchMessage>, env: Env, ctx: ExecutionContext) {
    // without access token, no searches will succeed
    console.log(`Handling search batch: ${batch.messages}`);
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
        const newRows = await saveItemsAndUpdateSearch(db, items, search.id)
        const newIds = newRows
            .map((row) => ({
                body: { item_id: row.id },
            }));
        if (newIds.length !== 0) {
            await env.AI_ANALYSIS_QUEUE.sendBatch(newIds);
        }
    }));
    return {
        success: true
    }
}

export async function handleAiAnalysisRequest(batch: MessageBatch<AiAnalysisMessage>, env: Env, ctx: ExecutionContext) {
    console.log(`Handling AI Analysis request batch: ${batch.messages}`);
    const itemIds = batch.messages.map((message) => {
        return message.body.item_id
    });
    const db = getWorkerDb(env.DATABASE_URL);
    console.log("Pre: " + itemIds);
    const itemSearchObjects = await getItemSearchObjects(db, itemIds);
    if (itemSearchObjects.length === 0) { throw new Error("No items to analyze"); }
    try {
        await Promise.all(itemSearchObjects.map(async (itemSearch) => {
            const { item, search } = itemSearch;
            if (!item || !search) {
                throw Error("What the heck");
            }
            const analysis = await analyzeItem(env.GOOGLE_API_KEY, item, search)

            await saveItemBasicScore(db, {
                searchId: search.id,
                searchItemId: item.externalId,
                score: analysis.imageScore || analysis.score,
                attributesScore: analysis.score,
                attributesReasoning: analysis.reasoning,
                imageReasoning: analysis.imageReasoning,
                imageScore: analysis.imageScore,
                model: analysis.model,
            })
        }));

    } catch (error: any) {
        console.error('some analysis failed');
        throw error;
    }
}

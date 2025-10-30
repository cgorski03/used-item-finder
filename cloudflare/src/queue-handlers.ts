import { getWorkerDb } from "@db";
import { getItemSearchObjects, getSearchObjects, saveItemBasicScore, saveItemsAndUpdateSearch, saveSearchRunFailure, saveSearchRunStub, saveSearchRunSuccess } from "./repository";
import { analyzeItem } from "./ai/analyze-item";
import { type AiAnalysisMessage, type SearchMessage } from "./types/queue";
import { type EbayItemSummary, searchEbay } from "./ebay/api";
import { parseAccessTokenHelper } from "./ebay/tokens";
import { processEbayItemsForDb } from "./lib/ebay-to-db";
import { MessageConversionError } from "ai";

export async function handleSearchRequest(batch: MessageBatch<SearchMessage>, env: Env, ctx: ExecutionContext) {
    // without access token, no searches will succeed
    console.log(`Handling search batch: ${batch.messages.length}`);
    const accessToken = parseAccessTokenHelper(await env.AUTH_TOKEN_KV.get(env.EBAY_KV_KEY, { type: 'json' }));
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
    await Promise.allSettled(searches.map(async (search) => {
        console.log(search);
        const searchRun = await saveSearchRunStub(db, search.id);
        try {
            const { apiItemCount, apiItems } = await searchEbay(search.keywords, accessToken.access_token, env.EBAY_ENV);
            console.log(apiItemCount, apiItemCount);
            const newDbItems = processEbayItemsForDb(search.id, apiItems);
            const newRowsInserted = await saveItemsAndUpdateSearch(db, newDbItems, search.id)
            await saveSearchRunSuccess(db, {
                searchRun,
                totalApiItems: apiItemCount,
                newItemsInserted: newRowsInserted.length,
            })
            const newIds = newRowsInserted
                .map((row) => ({
                    body: { item_id: row.id },
                }));
            if (newIds.length !== 0) {
                await env.AI_ANALYSIS_QUEUE.sendBatch(newIds);
            }
        }
        catch (err: any) {
            saveSearchRunFailure(db, {
                searchRun,
                errorMessage:
                    err instanceof Error ? err.message : 'Unknown error',
                errorDetails: err
            });
            console.error(`Search ${search.id} failed`, err);
            batch.messages.find((ms) => ms.body.search_id === search.id)?.retry();
            throw err;
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
